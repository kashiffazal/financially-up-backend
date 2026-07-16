/**
 * Individual Engagement Routes
 * ==============================
 * Defines all REST API endpoints for the Individual Engagement resource.
 * Each route maps to a controller function that handles the business logic.
 *
 * Base path: /api/individual-engagement
 *
 * Routes:
 * GET    /  → List all engagements (with pagination, filters, search)
 * GET   /:id → Get a single engagement by ID
 * POST   /  → Create a new engagement (called by Old App on form submit)
 * PUT   /:id → Update an engagement (edit fields, change status)
 * DELETE /:id → Delete an engagement
 */

const express = require("express");
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/individualEngagement.controller");

// GET /api/individual-engagement — Fetch all with pagination & filters
router.get("/", getAll);

// GET /api/individual-engagement/:id — Fetch single record by ID
router.get("/:id", getById);

// POST /api/individual-engagement — Create new record (Old App calls this)
router.post("/", create);

// PUT /api/individual-engagement/:id — Update existing record
router.put("/:id", update);

// DELETE /api/individual-engagement/:id — Delete a record
router.delete("/:id", remove);

module.exports = router;
