/**
 * Centralized Express Error Handling Middleware.
 * Standardizes API error responses and prevents stack traces leaking in production.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  };

  if (err.errors) {
    response.error.details = err.errors;
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND'
    }
  });
}

module.exports = { errorHandler, notFoundHandler };
