import { Router } from 'express';
import { BookingsController } from '../controllers/bookings.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { 
  createBookingSchema, 
  updateBookingStatusSchema, 
  rescheduleBookingSchema 
} from '../validators/booking.validator.js';
import { bookingsQuerySchema, uuidParamSchema } from '../validators/query.validator.js';

const router = Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a new appointment booking with double-booking prevention
 */
router.post('/', validateRequest(createBookingSchema, 'body'), BookingsController.createBooking);

/**
 * @route   GET /api/bookings
 * @desc    Retrieve bookings with optional filters (email, phone, status, specialistId, date) & pagination
 */
router.get('/', validateRequest(bookingsQuerySchema, 'query'), BookingsController.getBookings);

/**
 * @route   PATCH /api/bookings/:id/status
 * @desc    Update booking status (Pending, Confirmed, Completed, Cancelled)
 */
router.patch(
  '/:id/status',
  validateRequest(uuidParamSchema, 'params'),
  validateRequest(updateBookingStatusSchema, 'body'),
  BookingsController.updateStatus
);

/**
 * @route   PATCH /api/bookings/:id/reschedule
 * @desc    Reschedule booking to a new availability slot
 */
router.patch(
  '/:id/reschedule',
  validateRequest(uuidParamSchema, 'params'),
  validateRequest(rescheduleBookingSchema, 'body'),
  BookingsController.reschedule
);

export default router;
