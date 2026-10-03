/**
 * Dashboard Routes
 * ================
 * Endpoints for aggregated practice metrics, charts, and activity feeds.
 */

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { authenticate } = require("../middleware/authenticate");

// GET /api/dashboard/stats
router.get("/stats", authenticate, dashboardController.getDashboardStats);

module.exports = router;
