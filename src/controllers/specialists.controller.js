import { SpecialistsService } from '../services/specialists.service.js';
import { successResponse } from '../utils/apiResponse.js';

export class SpecialistsController {
  /**
   * GET /api/specialists
   * Retrieve active specialist profiles with optional specialty/category filtering
   */
  static async getSpecialists(req, res, next) {
    try {
      const { specialty, category } = req.query;
      const specialists = await SpecialistsService.getAllSpecialists({ specialty, category });
      return successResponse(res, 200, 'Specialists retrieved successfully', specialists);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/specialists/:id/slots?date=YYYY-MM-DD
   * Retrieve availability schedule for a specialist on a specific date
   */
  static async getSpecialistSlots(req, res, next) {
    try {
      const { id } = req.params;
      const { date } = req.query;

      const schedule = await SpecialistsService.getSpecialistSlots(id, date);
      return successResponse(res, 200, 'Specialist availability slots retrieved successfully', schedule);
    } catch (err) {
      next(err);
    }
  }
}
