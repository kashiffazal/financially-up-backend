/**
 * Rate Limiting Middleware
 * ========================
 * Protects authentication endpoints against brute force and credential stuffing attacks.
 * Configured dynamically via environment variables (RATE_LIMIT_WINDOW_MINUTES, RATE_LIMIT_MAX_ATTEMPTS).
 */

const rateLimit = require("express-rate-limit");

const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15;
const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS, 10) || 10;

/**
 * Strict limiter for sensitive authentication endpoints (login, forgot-password).
 * Defaults to 10 attempts per 15 minutes per IP address.
 */
const authLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxAttempts,
  standardHeaders: true, // Return standard rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable legacy `X-RateLimit-*` headers
  message: {
    success: false,
    message: `Too many login attempts from this IP. Please try again after ${windowMinutes} minutes.`,
  },
});

module.exports = {
  authLimiter,
};
