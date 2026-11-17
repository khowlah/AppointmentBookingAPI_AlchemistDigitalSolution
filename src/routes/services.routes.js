import { Router } from 'express';
import { ServicesController } from '../controllers/services.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { servicesQuerySchema, uuidParamSchema } from '../validators/query.validator.js';

const router = Router();

/**
 * @route   GET /api/services
 * @desc    Retrieve all active consultation services
 */
router.get('/', validateRequest(servicesQuerySchema, 'query'), ServicesController.getServices);

/**
 * @route   GET /api/services/:id
 * @desc    Retrieve consultation service by ID
 */
router.get('/:id', validateRequest(uuidParamSchema, 'params'), ServicesController.getServiceById);

export default router;
