import { dbPool } from '../config/supabase.js';

export class BookingsService {
  /**
   * Create a new appointment booking with database-enforced double-booking prevention.
   */
  static async createBooking({ serviceId, specialistId, date, timeSlot, client, notes }) {
    // 1. Verify service exists and is active
    const serviceRes = await dbPool.query(
      `SELECT id, title, duration_minutes, fee::float AS fee, is_active 
       FROM services 
       WHERE id = $1;`,
      [serviceId]
    );

    if (serviceRes.rows.length === 0 || !serviceRes.rows[0].is_active) {
      const err = new Error('Service not found or inactive');
      err.statusCode = 404;
      err.errorDetails = { code: 'SERVICE_NOT_FOUND', serviceId };
      throw err;
    }

    // 2. Verify specialist exists and is active
    const specRes = await dbPool.query(
      `SELECT id, full_name, specialty, is_active 
       FROM specialists 
       WHERE id = $1;`,
      [specialistId]
    );

    if (specRes.rows.length === 0 || !specRes.rows[0].is_active) {
      const err = new Error('Specialist not found or inactive');
      err.statusCode = 404;
      err.errorDetails = { code: 'SPECIALIST_NOT_FOUND', specialistId };
      throw err;
    }

    // 3. Verify specialist provides this service
    const specServiceRes = await dbPool.query(
      `SELECT 1 FROM specialist_services 
       WHERE specialist_id = $1 AND service_id = $2;`,
      [specialistId, serviceId]
    );

    if (specServiceRes.rows.length === 0) {
      const err = new Error('The selected specialist does not provide this consultation service.');
      err.statusCode = 400;
      err.errorDetails = { code: 'INVALID_SPECIALIST_SERVICE', specialistId, serviceId };
      throw err;
    }

    // 4. Verify slot exists and belongs to the specialist
    const slotRes = await dbPool.query(
      `SELECT id, specialist_id, TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, start_time, end_time, is_available 
       FROM availability_slots 
       WHERE id = $1;`,
      [timeSlot]
    );

    if (slotRes.rows.length === 0) {
      const err = new Error('Availability slot not found');
      err.statusCode = 404;
      err.errorDetails = { code: 'SLOT_NOT_FOUND', timeSlot };
      throw err;
    }

    const slot = slotRes.rows[0];

    // Ensure slot matches specialist
    if (slot.specialist_id !== specialistId) {
      const err = new Error('The selected availability slot does not belong to the selected specialist.');
      err.statusCode = 400;
      err.errorDetails = { code: 'SLOT_SPECIALIST_MISMATCH' };
      throw err;
    }

    // Ensure slot matches requested date
    const slotDateStr = String(slot.slot_date).split('T')[0];

    if (slotDateStr !== date) {
      const err = new Error(`The selected slot date (${slotDateStr}) does not match the requested date (${date}).`);
      err.statusCode = 400;
      err.errorDetails = { code: 'SLOT_DATE_MISMATCH', expectedDate: slotDateStr, requestedDate: date };
      throw err;
    }

    // Pre-check availability (fast reject)
    if (!slot.is_available) {
      const err = new Error('The requested availability slot is already booked or unavailable.');
      err.statusCode = 409;
      err.errorDetails = { code: 'SLOT_CONFLICT', slotId: timeSlot };
      throw err;
    }

    // 5. Client Onboarding / Lookup
    let clientId;
    const clientLookup = await dbPool.query(
      `SELECT id FROM clients WHERE LOWER(email) = LOWER($1);`,
      [client.email]
    );

    if (clientLookup.rows.length > 0) {
      clientId = clientLookup.rows[0].id;
      // Optionally update phone if provided
      if (client.phone) {
        await dbPool.query(
          `UPDATE clients SET full_name = $1, phone = $2, updated_at = NOW() WHERE id = $3;`,
          [client.fullName, client.phone, clientId]
        );
      }
    } else {
      const newClient = await dbPool.query(
        `INSERT INTO clients (full_name, email, phone) 
         VALUES ($1, $2, $3) 
         RETURNING id;`,
        [client.fullName, client.email.toLowerCase(), client.phone || null]
      );
      clientId = newClient.rows[0].id;
    }

    // 6. Execute Atomic Booking via Transaction & Row-Level Locking
    const dbClient = await dbPool.connect();
    try {
      await dbClient.query('BEGIN');

      // Lock slot row FOR UPDATE to prevent concurrent race condition
      const lockRes = await dbClient.query(
        `SELECT id, is_available FROM availability_slots WHERE id = $1 FOR UPDATE;`,
        [timeSlot]
      );

      if (!lockRes.rows[0].is_available) {
        await dbClient.query('ROLLBACK');
        const err = new Error('The requested availability slot is already booked.');
        err.statusCode = 409;
        err.errorDetails = { code: 'SLOT_CONFLICT', slotId: timeSlot };
        throw err;
      }

      // Insert booking with default status 'Pending'
      const insertBookingRes = await dbClient.query(
        `INSERT INTO bookings (
          client_id,
          specialist_id,
          service_id,
          availability_slot_id,
          status,
          notes
        ) VALUES ($1, $2, $3, $4, 'Pending', $5)
        RETURNING id, client_id, specialist_id, service_id, availability_slot_id, status, notes, created_at, updated_at;`,
        [clientId, specialistId, serviceId, timeSlot, notes || null]
      );

      // Trigger will update availability_slots.is_available = false automatically,
      // but we explicitly ensure consistency within transaction:
      await dbClient.query(
        `UPDATE availability_slots SET is_available = false, updated_at = NOW() WHERE id = $1;`,
        [timeSlot]
      );

      await dbClient.query('COMMIT');

      const createdBooking = insertBookingRes.rows[0];

      return {
        id: createdBooking.id,
        status: createdBooking.status,
        date: slotDateStr,
        notes: createdBooking.notes,
        created_at: createdBooking.created_at,
        service: {
          id: serviceRes.rows[0].id,
          title: serviceRes.rows[0].title,
          fee: serviceRes.rows[0].fee,
          duration_minutes: serviceRes.rows[0].duration_minutes
        },
        specialist: {
          id: specRes.rows[0].id,
          full_name: specRes.rows[0].full_name,
          specialty: specRes.rows[0].specialty
        },
        slot: {
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time
        },
        client: {
          id: clientId,
          fullName: client.fullName,
          email: client.email,
          phone: client.phone || null
        }
      };
    } catch (txErr) {
      await dbClient.query('ROLLBACK');
      throw txErr;
    } finally {
      dbClient.release();
    }
  }

  /**
   * Retrieve bookings with filtering, search, and pagination
   */
  static async getBookings({ email, phone, status, specialistId, date, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (email) {
      params.push(email);
      conditions.push(`LOWER(c.email) = LOWER($${params.length})`);
    }

    if (phone) {
      params.push(phone);
      conditions.push(`c.phone ILIKE '%' || $${params.length} || '%'`);
    }

    if (status) {
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }

    if (specialistId) {
      params.push(specialistId);
      conditions.push(`b.specialist_id = $${params.length}`);
    }

    if (date) {
      params.push(date);
      conditions.push(`slt.slot_date = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN availability_slots slt ON b.availability_slot_id = slt.id
      ${whereClause};
    `;
    const countRes = await dbPool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // Data query
    const dataQuery = `
      SELECT 
        b.id,
        b.status,
        b.notes,
        b.created_at,
        b.updated_at,
        json_build_object(
          'id', c.id,
          'full_name', c.full_name,
          'email', c.email,
          'phone', c.phone
        ) AS client,
        json_build_object(
          'id', sp.id,
          'full_name', sp.full_name,
          'specialty', sp.specialty
        ) AS specialist,
        json_build_object(
          'id', srv.id,
          'title', srv.title,
          'duration_minutes', srv.duration_minutes,
          'fee', srv.fee::float
        ) AS service,
        json_build_object(
          'id', slt.id,
          'date', TO_CHAR(slt.slot_date, 'YYYY-MM-DD'),
          'start_time', TO_CHAR(slt.start_time, 'HH24:MI'),
          'end_time', TO_CHAR(slt.end_time, 'HH24:MI')
        ) AS slot
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN specialists sp ON b.specialist_id = sp.id
      JOIN services srv ON b.service_id = srv.id
      JOIN availability_slots slt ON b.availability_slot_id = slt.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;

    const dataRes = await dbPool.query(dataQuery, [...params, limit, offset]);

    return {
      bookings: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update booking status with strict lifecycle validation and slot release upon cancellation.
   */
  static async updateBookingStatus(id, newStatus, reason) {
    const bookingRes = await dbPool.query(
      `SELECT id, status, availability_slot_id FROM bookings WHERE id = $1;`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      err.errorDetails = { code: 'BOOKING_NOT_FOUND', bookingId: id };
      throw err;
    }

    const currentBooking = bookingRes.rows[0];

    // Status transition validation
    if (currentBooking.status === 'Cancelled') {
      const err = new Error('Cannot update status of an already cancelled booking.');
      err.statusCode = 400;
      err.errorDetails = { code: 'INVALID_STATUS_TRANSITION', currentStatus: currentBooking.status };
      throw err;
    }

    if (currentBooking.status === 'Completed' && newStatus !== 'Completed') {
      const err = new Error('Cannot change status of an already completed consultation.');
      err.statusCode = 400;
      err.errorDetails = { code: 'INVALID_STATUS_TRANSITION', currentStatus: currentBooking.status };
      throw err;
    }

    // If cancelling, execute cancel_booking stored procedure or update
    if (newStatus === 'Cancelled') {
      const cancelRes = await dbPool.query(
        `SELECT cancel_booking($1, $2);`,
        [id, reason || null]
      );
      const resData = cancelRes.rows[0].cancel_booking;
      return {
        id,
        status: 'Cancelled',
        slotReleased: currentBooking.availability_slot_id,
        detail: resData
      };
    }

    // Otherwise, standard status update
    const updateRes = await dbPool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, status, updated_at;`,
      [newStatus, id]
    );

    return updateRes.rows[0];
  }

  /**
   * Reschedule an appointment atomically to a new availability slot.
   */
  static async rescheduleBooking(id, newSlotId, requestedDate) {
    // 1. Verify booking exists
    const bookingRes = await dbPool.query(
      `SELECT id, status, specialist_id, availability_slot_id FROM bookings WHERE id = $1;`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      err.errorDetails = { code: 'BOOKING_NOT_FOUND', bookingId: id };
      throw err;
    }

    const booking = bookingRes.rows[0];

    if (booking.status === 'Cancelled') {
      const err = new Error('Cannot reschedule an already cancelled booking.');
      err.statusCode = 400;
      err.errorDetails = { code: 'CANNOT_RESCHEDULE_CANCELLED' };
      throw err;
    }

    // 2. Verify new slot exists, belongs to same specialist, and matches date
    const newSlotRes = await dbPool.query(
      `SELECT id, specialist_id, TO_CHAR(slot_date, 'YYYY-MM-DD') AS slot_date, start_time, end_time, is_available 
       FROM availability_slots 
       WHERE id = $1;`,
      [newSlotId]
    );

    if (newSlotRes.rows.length === 0) {
      const err = new Error('Target availability slot not found');
      err.statusCode = 404;
      err.errorDetails = { code: 'NEW_SLOT_NOT_FOUND', newSlotId };
      throw err;
    }

    const newSlot = newSlotRes.rows[0];

    if (newSlot.specialist_id !== booking.specialist_id) {
      const err = new Error('Target availability slot belongs to a different specialist.');
      err.statusCode = 400;
      err.errorDetails = { code: 'SPECIALIST_MISMATCH' };
      throw err;
    }

    const newSlotDateStr = String(newSlot.slot_date).split('T')[0];

    if (requestedDate && newSlotDateStr !== requestedDate) {
      const err = new Error(`Target slot date (${newSlotDateStr}) does not match requested date (${requestedDate}).`);
      err.statusCode = 400;
      err.errorDetails = { code: 'SLOT_DATE_MISMATCH' };
      throw err;
    }

    if (!newSlot.is_available) {
      const err = new Error('The target availability slot is already booked or unavailable.');
      err.statusCode = 409;
      err.errorDetails = { code: 'SLOT_CONFLICT', slotId: newSlotId };
      throw err;
    }

    // 3. Call Atomic RPC reschedule_booking
    const rpcRes = await dbPool.query(
      `SELECT reschedule_booking($1, $2);`,
      [id, newSlotId]
    );

    return {
      id,
      previousSlotId: booking.availability_slot_id,
      newSlotId,
      date: newSlotDateStr,
      status: booking.status,
      rescheduleResult: rpcRes.rows[0].reschedule_booking
    };
  }
}
