import { BookingsService } from '../services/bookings.service.js';
import { successResponse } from '../utils/apiResponse.js';

export class BookingsController {
  /**
   * POST /api/bookings
   * Create a new appointment booking with double-booking prevention
   */
  static async createBooking(req, res, next) {
    try {
      const bookingData = req.body;
      const createdBooking = await BookingsService.createBooking(bookingData);
      return successResponse(res, 201, 'Appointment booked successfully', createdBooking);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/bookings
   * Retrieve bookings with filtering by email, phone, status, specialist, date, and pagination
   */
  static async getBookings(req, res, next) {
    try {
      const filters = req.query;
      const result = await BookingsService.getBookings(filters);
      return successResponse(res, 200, 'Bookings retrieved successfully', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/bookings/:id/status
   * Update status of an existing booking (Pending, Confirmed, Completed, Cancelled)
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const updatedBooking = await BookingsService.updateBookingStatus(id, status, reason);
      return successResponse(res, 200, `Booking status updated to ${status}`, updatedBooking);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/bookings/:id/reschedule
   * Reschedule an appointment atomically to a new slot
   */
  static async reschedule(req, res, next) {
    try {
      const { id } = req.params;
      const { timeSlot, date } = req.body;
      const result = await BookingsService.rescheduleBooking(id, timeSlot, date);
      return successResponse(res, 200, 'Booking rescheduled successfully', result);
    } catch (err) {
      next(err);
    }
  }
}
