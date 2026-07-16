/**
 * API Response Helper
 * ====================
 * Standardized response format for all API endpoints.
 * Ensures every response follows the same { success, message, data } structure
 * so the frontend can parse responses consistently.
 */

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {string} message - Human-readable success message
 * @param {any} data - Response payload (object, array, etc.)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {any} errors - Additional error details (optional)
 */
const errorResponse = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = { successResponse, errorResponse };
