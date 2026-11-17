import { ServicesService } from '../services/services.service.js';
import { successResponse } from '../utils/apiResponse.js';

export class ServicesController {
  /**
   * GET /api/services
   * Retrieve active consultation services with optional category filtering
   */
  static async getServices(req, res, next) {
    try {
      const { category } = req.query;
      const services = await ServicesService.getAllServices({ category });
      return successResponse(res, 200, 'Services retrieved successfully', services);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/services/:id
   * Retrieve a specific consultation service by ID
   */
  static async getServiceById(req, res, next) {
    try {
      const { id } = req.params;
      const service = await ServicesService.getServiceById(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found',
          error: { code: 'SERVICE_NOT_FOUND', id }
        });
      }

      return successResponse(res, 200, 'Service details retrieved successfully', service);
    } catch (err) {
      next(err);
    }
  }
}
