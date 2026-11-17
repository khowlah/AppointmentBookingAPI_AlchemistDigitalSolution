/**
 * Generic Request Validation Middleware using Zod
 * Supports body, query, and params schemas
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed; // assign sanitized data
      next();
    } catch (err) {
      next(err);
    }
  };
};
