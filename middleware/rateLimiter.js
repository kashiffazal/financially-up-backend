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

/**
 * Limiter for the admin global search (debounced type-ahead).
 * Keyed per authenticated user, falling back to IP. Defaults to 120 searches per minute.
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.SEARCH_RATE_LIMIT_PER_MINUTE, 10) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => (req.user?.id ? `user-${req.user.id}` : rateLimit.ipKeyGenerator(req.ip)),
  message: {
    success: false,
    message: "Too many searches in a short time. Please wait a moment and try again.",
  },
});

/**
 * Limiter for the public website contact form (anti-spam).
 * Defaults to 5 enquiries per 15 minutes per IP address.
 */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.CONTACT_RATE_LIMIT, 10) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You've sent several enquiries in a short time. Please wait a few minutes or call us directly.",
  },
});

module.exports = {
  authLimiter,
  searchLimiter,
  contactLimiter,
};
