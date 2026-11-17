import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const uuidParamSchema = z.object({
  id: z.string().regex(uuidRegex, { message: 'Invalid ID: Must be a valid UUID' })
});

export const servicesQuerySchema = z.object({
  category: z.string().trim().optional()
});

export const specialistsQuerySchema = z.object({
  specialty: z.string().trim().optional(),
  category: z.string().trim().optional()
});

export const slotsQuerySchema = z.object({
  date: z.string().regex(dateRegex, { message: 'Date parameter is required and must match format YYYY-MM-DD' })
});

export const bookingsQuerySchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled']).optional(),
  specialistId: z.string().regex(uuidRegex, { message: 'Invalid specialistId UUID' }).optional(),
  date: z.string().regex(dateRegex, { message: 'Date must match YYYY-MM-DD' }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
