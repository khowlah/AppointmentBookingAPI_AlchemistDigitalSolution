import { Router } from 'express';
import { SpecialistsController } from '../controllers/specialists.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { specialistsQuerySchema, slotsQuerySchema, uuidParamSchema } from '../validators/query.validator.js';

const router = Router();

/**
 * @route   GET /api/specialists
 * @desc    Retrieve all active specialists with their offered services
 */
router.get('/', validateRequest(specialistsQuerySchema, 'query'), SpecialistsController.getSpecialists);

/**
 * @route   GET /api/specialists/:id/slots
 * @desc    Retrieve availability schedule and slot status for a specialist on a specific date
 */
router.get(
  '/:id/slots',
  validateRequest(uuidParamSchema, 'params'),
  validateRequest(slotsQuerySchema, 'query'),
  SpecialistsController.getSpecialistSlots
);

export default router;
