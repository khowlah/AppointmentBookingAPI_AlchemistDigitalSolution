import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { dbPool } from '../src/config/supabase.js';

describe('Smart Appointment & Consultation Platform API Tests', () => {
  let createdBookingId = null;
  const testSpecialistId = '22222222-2222-2222-2222-222222222201'; // Dr. Sarah (General Medicine)
  const testServiceId = '11111111-1111-1111-1111-111111111101';    // General Consultation
  const testAvailableSlotId = '44444444-4444-4444-4444-444444444404'; // Dr. Sarah 11:00-11:30
  const testRescheduleSlotId = '44444444-4444-4444-4444-444444444403'; // Dr. Sarah 10:00-10:30
  const alreadyBookedSlotId = '44444444-4444-4444-4444-444444444401'; // Already booked in seed
  const testDate = '2026-12-01';

  after(async () => {
    // Clean up any test booking created
    if (createdBookingId) {
      await dbPool.query('DELETE FROM bookings WHERE id = $1;', [createdBookingId]);
      await dbPool.query('UPDATE availability_slots SET is_available = true WHERE id = $1;', [testAvailableSlotId]);
      await dbPool.query('UPDATE availability_slots SET is_available = true WHERE id = $1;', [testRescheduleSlotId]);
    }
    await dbPool.end();
  });

  // 1. Health check
  test('GET / returns operational health status', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.documentation);
  });

  // 2. Services endpoint
  test('GET /api/services retrieves all active services', async () => {
    const res = await request(app).get('/api/services');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 5);
    const service = res.body.data[0];
    assert.ok(service.id);
    assert.ok(service.title);
    assert.ok(service.fee);
    assert.ok(service.duration_minutes);
    assert.ok(service.category);
  });

  // 3. Services filtering by category
  test('GET /api/services?category=Cardiology filters services correctly', async () => {
    const res = await request(app).get('/api/services?category=Cardiology');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.every(s => s.category.toLowerCase() === 'cardiology'));
  });

  // 4. Specialists directory
  test('GET /api/specialists retrieves active specialists with their services', async () => {
    const res = await request(app).get('/api/specialists');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 3);
    const specialist = res.body.data[0];
    assert.ok(specialist.full_name);
    assert.ok(specialist.specialty);
    assert.ok(Array.isArray(specialist.services));
  });

  // 5. Specialists filtering by specialty
  test('GET /api/specialists?specialty=Dermatology filters specialists', async () => {
    const res = await request(app).get('/api/specialists?specialty=Dermatology');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.every(s => s.specialty.toLowerCase() === 'dermatology'));
  });

  // 6. Specialist slots retrieval
  test('GET /api/specialists/:id/slots?date=YYYY-MM-DD returns slots with status', async () => {
    const res = await request(app).get(`/api/specialists/${testSpecialistId}/slots?date=${testDate}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.specialistId, testSpecialistId);
    assert.equal(res.body.data.date, testDate);
    assert.ok(Array.isArray(res.body.data.slots));
    
    // Check that available and booked statuses are present
    const statuses = res.body.data.slots.map(s => s.status);
    assert.ok(statuses.includes('available') || statuses.includes('booked'));
  });

  // 7. Slots for non-existent specialist returns 404
  test('GET /api/specialists/:id/slots returns 404 for non-existent specialist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/api/specialists/${fakeId}/slots?date=${testDate}`);
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  // 8. Create valid booking
  test('POST /api/bookings successfully creates a new appointment', async () => {
    const payload = {
      serviceId: testServiceId,
      specialistId: testSpecialistId,
      date: testDate,
      timeSlot: testAvailableSlotId,
      client: {
        fullName: 'Khawlah Integration Client',
        email: 'khawlah.integration@example.com',
        phone: '+966559988776'
      },
      notes: 'Automated test consultation booking'
    };

    const res = await request(app).post('/api/bookings').send(payload);
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.status, 'Pending');
    createdBookingId = res.body.data.id;
  });

  // 9. CRITICAL: Attempt to double-book the same slot returns 409 Conflict
  test('POST /api/bookings rejects double-booking the same slot with 409', async () => {
    const conflictingPayload = {
      serviceId: testServiceId,
      specialistId: testSpecialistId,
      date: testDate,
      timeSlot: testAvailableSlotId, // Same slot as test #8!
      client: {
        fullName: 'Another Client',
        email: 'another.client@example.com',
        phone: '+966551122334'
      }
    };

    const res = await request(app).post('/api/bookings').send(conflictingPayload);
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SLOT_CONFLICT');
  });

  // 10. Attempt to book an already occupied seed slot returns 409
  test('POST /api/bookings returns 409 when booking an occupied seed slot', async () => {
    const payload = {
      serviceId: testServiceId,
      specialistId: testSpecialistId,
      date: testDate,
      timeSlot: alreadyBookedSlotId,
      client: {
        fullName: 'Test Third Party',
        email: 'thirdparty@example.com'
      }
    };

    const res = await request(app).post('/api/bookings').send(payload);
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  // 11. Retrieve bookings with filters
  test('GET /api/bookings retrieves bookings list with pagination', async () => {
    const res = await request(app).get('/api/bookings?limit=5');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.bookings));
    assert.ok(res.body.data.pagination);
    assert.ok(res.body.data.pagination.total >= 1);
  });

  // 12. Filter bookings by email
  test('GET /api/bookings?email=khawlah.integration@example.com filters by client email', async () => {
    const res = await request(app).get('/api/bookings?email=khawlah.integration@example.com');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.bookings.length >= 1);
    assert.equal(res.body.data.bookings[0].client.email, 'khawlah.integration@example.com');
  });

  // 13. Filter bookings by status
  test('GET /api/bookings?status=Pending filters by status', async () => {
    const res = await request(app).get('/api/bookings?status=Pending');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.bookings.every(b => b.status === 'Pending'));
  });

  // 14. Update booking status to Confirmed
  test('PATCH /api/bookings/:id/status updates status to Confirmed', async () => {
    assert.ok(createdBookingId);
    const res = await request(app)
      .patch(`/api/bookings/${createdBookingId}/status`)
      .send({ status: 'Confirmed' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'Confirmed');
  });

  // 15. Reschedule booking to another available slot
  test('PATCH /api/bookings/:id/reschedule moves booking to new slot', async () => {
    assert.ok(createdBookingId);
    const res = await request(app)
      .patch(`/api/bookings/${createdBookingId}/reschedule`)
      .send({
        timeSlot: testRescheduleSlotId,
        date: testDate
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.newSlotId, testRescheduleSlotId);
  });

  // 16. Cancel booking and verify slot is released
  test('PATCH /api/bookings/:id/status cancels booking and releases slot', async () => {
    assert.ok(createdBookingId);
    const res = await request(app)
      .patch(`/api/bookings/${createdBookingId}/status`)
      .send({ status: 'Cancelled', reason: 'Integration test cleanup' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'Cancelled');

    // Check slot is now available in database
    const slotCheck = await dbPool.query(
      'SELECT is_available FROM availability_slots WHERE id = $1;',
      [testRescheduleSlotId]
    );
    assert.equal(slotCheck.rows[0].is_available, true);
  });

  // 17. Validation failure on invalid request
  test('POST /api/bookings with invalid body returns 400 Validation Error', async () => {
    const res = await request(app).post('/api/bookings').send({ invalid: 'body' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  // 18. Invalid route returns 404
  test('GET /api/nonexistent-route returns 404 Route Not Found', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
  });
});
