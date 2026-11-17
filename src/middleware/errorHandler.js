import { errorResponse } from '../utils/apiResponse.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, {
    code: 'ROUTE_NOT_FOUND',
    method: req.method,
    path: req.originalUrl
  });
};

/**
 * Centralized Error-Handling Middleware
 * Catches validation errors, PostgreSQL integrity exceptions, and custom business exceptions.
 */
export const errorHandler = (err, req, res, next) => {
  // Safe logging that doesn't trigger inspect errors in Node v24
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[API ERROR] ${req.method} ${req.originalUrl}:`, err?.message || err);
  }

  // 1. Zod Validation Error
  if (err?.name === 'ZodError' || err?.issues) {
    const issues = err.issues || err.errors || [];
    const formattedErrors = issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message
    }));

    return errorResponse(res, 400, 'Validation failed. Please check your request parameters.', {
      code: 'VALIDATION_ERROR',
      details: formattedErrors
    });
  }

  // 2. PostgreSQL Constraint Violations
  if (err?.code) {
    // 23505: Unique constraint violation (Double-booking conflict)
    if (err.code === '23505') {
      return errorResponse(res, 409, 'The requested availability slot is already booked or unavailable.', {
        code: 'SLOT_CONFLICT',
        detail: 'Another active booking already occupies this time slot.'
      });
    }

    // 23P01: Exclusion constraint violation (Overlapping slots)
    if (err.code === '23P01') {
      return errorResponse(res, 409, 'Overlapping availability schedule detected.', {
        code: 'SCHEDULE_OVERLAP',
        detail: 'The specialist already has a conflicting slot for the given time interval.'
      });
    }

    // 23503: Foreign key violation
    if (err.code === '23503') {
      return errorResponse(res, 400, 'Invalid reference: One or more referenced entities do not exist or are incompatible.', {
        code: 'FOREIGN_KEY_VIOLATION'
      });
    }
  }

  // 3. Custom PostgreSQL Exception Messages
  if (err?.message) {
    if (err.message.includes('already booked') || err.message.includes('unavailable')) {
      return errorResponse(res, 409, 'The requested availability slot is already booked.', {
        code: 'SLOT_CONFLICT'
      });
    }

    if (err.message.includes('not authorized to provide service')) {
      return errorResponse(res, 400, 'The selected specialist does not offer the requested service.', {
        code: 'INVALID_SPECIALIST_SERVICE'
      });
    }

    if (err.message.includes('does not belong to the selected specialist')) {
      return errorResponse(res, 400, 'The selected availability slot does not belong to the specified specialist.', {
        code: 'INVALID_SLOT_SPECIALIST'
      });
    }
  }

  // 4. Custom Application HTTP Errors
  if (err?.statusCode) {
    return errorResponse(res, err.statusCode, err.message, err.errorDetails || null);
  }

  // 5. Fallback Generic 500
  const isDev = process.env.NODE_ENV === 'development';
  return errorResponse(res, 500, 'An internal server error occurred. Please try again later.', {
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDev && { debug: err?.message })
  });
};
