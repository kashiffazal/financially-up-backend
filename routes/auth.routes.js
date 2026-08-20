/**
 * Authentication Routes
 * =====================
 * API endpoints for authentication, session verification, profile editing,
 * password changes, and device session revocations.
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/authenticate");
const { authLimiter } = require("../middleware/rateLimiter");

// Public endpoints
router.post("/login", authLimiter, authController.login);

// Protected endpoints (Session / Token required)
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.put("/profile", authenticate, authController.updateProfile);
router.put("/change-password", authenticate, authController.changePassword);
router.get("/sessions", authenticate, authController.getMySessions);
router.delete("/sessions/:sessionId", authenticate, authController.revokeMySession);

module.exports = router;
