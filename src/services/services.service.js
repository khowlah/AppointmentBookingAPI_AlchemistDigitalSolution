import { dbPool } from '../config/supabase.js';

export class ServicesService {
  /**
   * Retrieve active consultation services with optional category filter
   */
  static async getAllServices({ category } = {}) {
    let query = `
      SELECT 
        id,
        title,
        description,
        duration_minutes,
        fee::float AS fee,
        category,
        is_active,
        created_at
      FROM services
      WHERE is_active = true
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND LOWER(category) = LOWER($${params.length})`;
    }

    query += ` ORDER BY category ASC, title ASC;`;

    const result = await dbPool.query(query, params);
    return result.rows;
  }

  /**
   * Retrieve single service by ID
   */
  static async getServiceById(id) {
    const query = `
      SELECT id, title, description, duration_minutes, fee::float AS fee, category, is_active
      FROM services
      WHERE id = $1 AND is_active = true;
    `;
    const result = await dbPool.query(query, [id]);
    return result.rows[0] || null;
  }
}
