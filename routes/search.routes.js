/**
 * Global Search Routes
 * ====================
 * Base path: /api/search
 *
 * Routes:
 * GET / → Search applications across all modules (name, email, phone, ABN/ACN, reference)
 */

const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller");
const { authenticate } = require("../middleware/authenticate");
const { searchLimiter } = require("../middleware/rateLimiter");

// GET /api/search?q=john&limit=5
router.get("/", authenticate, searchLimiter, searchController.search);

module.exports = router;
