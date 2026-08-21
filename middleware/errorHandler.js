/**
 * Global Error Handler Middleware
 * ================================
 * Catches all unhandled errors thrown in routes/controllers
 * and returns a clean JSON error response instead of crashing the server.
 * This is registered as the last middleware in app.js.
 */

const errorHandler = (err, req, res, next) => {
  // Log the full error stack in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err.stack);
  } else {
    console.error("❌ Error:", err.message);
  }

  // Handle Sequelize validation errors (e.g., unique constraint violations)
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: messages,
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry found",
      errors: err.errors.map((e) => e.message),
    });
  }

  // Handle all other errors with a descriptive server error response
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
    error: err.message || undefined,
  });
};

module.exports = errorHandler;
