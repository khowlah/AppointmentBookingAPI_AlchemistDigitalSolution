import { dbPool } from '../config/supabase.js';

export class SpecialistsService {
  /**
   * Retrieve active specialists with optional specialty filter,
   * including the list of services they offer.
   */
  static async getAllSpecialists({ specialty, category } = {}) {
    let query = `
      SELECT 
        s.id,
        s.full_name,
        s.email,
        s.phone,
        s.specialty,
        s.bio,
        s.is_active,
        COALESCE(
          json_agg(
            json_build_object(
              'id', srv.id,
              'title', srv.title,
              'duration_minutes', srv.duration_minutes,
              'fee', srv.fee::float,
              'category', srv.category
            )
          ) FILTER (WHERE srv.id IS NOT NULL),
          '[]'::json
        ) AS services
      FROM specialists s
      LEFT JOIN specialist_services ss ON s.id = ss.specialist_id
      LEFT JOIN services srv ON ss.service_id = srv.id AND srv.is_active = true
      WHERE s.is_active = true
    `;
    const params = [];

    if (specialty) {
      params.push(specialty);
      query += ` AND LOWER(s.specialty) = LOWER($${params.length})`;
    }

    if (category) {
      params.push(category);
      query += ` AND s.id IN (
        SELECT ss2.specialist_id 
        FROM specialist_services ss2 
        JOIN services srv2 ON ss2.service_id = srv2.id 
        WHERE LOWER(srv2.category) = LOWER($${params.length})
      )`;
    }

    query += `
      GROUP BY s.id
      ORDER BY s.full_name ASC;
    `;

    const result = await dbPool.query(query, params);
    return result.rows;
  }

  /**
   * Retrieve availability slots for a specific specialist on a given date.
   * Clearly categorizes each slot as 'available' or 'booked'.
   */
  static async getSpecialistSlots(specialistId, date) {
    // 1. Verify specialist existence
    const specialistCheck = await dbPool.query(
      `SELECT id, full_name, specialty, is_active FROM specialists WHERE id = $1;`,
      [specialistId]
    );

    if (specialistCheck.rows.length === 0 || !specialistCheck.rows[0].is_active) {
      const error = new Error('Specialist not found or inactive');
      error.statusCode = 404;
      error.errorDetails = { code: 'SPECIALIST_NOT_FOUND', specialistId };
      throw error;
    }

    // 2. Query availability slots for the specified date
    const query = `
      SELECT 
        id,
        TO_CHAR(start_time, 'HH24:MI') AS start_time,
        TO_CHAR(end_time, 'HH24:MI') AS end_time,
        CASE 
          WHEN is_available = true THEN 'available'
          ELSE 'booked'
        END AS status
      FROM availability_slots
      WHERE specialist_id = $1 AND slot_date = $2
      ORDER BY start_time ASC;
    `;

    const slotsResult = await dbPool.query(query, [specialistId, date]);

    return {
      specialistId,
      date,
      slots: slotsResult.rows
    };
  }
}
