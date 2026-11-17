/**
 * Standardized API Response Utilities
 * Enforces uniform success and error payloads across the entire REST API
 */

export const successResponse = (res, statusCode = 200, message = 'Operation completed successfully', data = null) => {
  const payload = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

export const errorResponse = (res, statusCode = 500, message = 'An unexpected error occurred', errorDetails = null) => {
  const payload = {
    success: false,
    message
  };

  if (errorDetails) {
    payload.error = errorDetails;
  }

  return res.status(statusCode).json(payload);
};
