import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createBookingSchema = z.object({
  serviceId: z.string().regex(uuidRegex, { message: 'serviceId must be a valid UUID' }),
  specialistId: z.string().regex(uuidRegex, { message: 'specialistId must be a valid UUID' }),
  date: z.string().regex(dateRegex, { message: 'date must match format YYYY-MM-DD' }),
  timeSlot: z.string().regex(uuidRegex, { message: 'timeSlot must be a valid UUID representing an availability_slot' }),
  client: z.object({
    fullName: z.string().trim().min(2, { message: 'Client fullName must be at least 2 characters' }),
    email: z.string().trim().email({ message: 'A valid client email address is required' }),
    phone: z.string().trim().min(7, { message: 'Phone number must be at least 7 digits' }).optional()
  }),
  notes: z.string().trim().max(1000).optional()
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled'], {
    errorMap: () => ({ message: 'Status must be one of: Pending, Confirmed, Completed, Cancelled' })
  }),
  reason: z.string().trim().max(500).optional()
});

export const rescheduleBookingSchema = z.object({
  date: z.string().regex(dateRegex, { message: 'date must match format YYYY-MM-DD' }),
  timeSlot: z.string().regex(uuidRegex, { message: 'timeSlot must be a valid UUID' })
});
