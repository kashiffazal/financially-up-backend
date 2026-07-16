/**
 * GST Registration Routes
 * ==============================
 * Defines all REST API endpoints for the GST Registration resource.
 * Each route maps to a controller function that handles the business logic.
 *
 * Base path: /api/gst-registrations
 *
 * Routes:
 * GET    /  → List all records (with pagination, filters, search)
 * GET   /:id → Get a single record by ID
 * POST   /  → Create a new record (called by Old App on form submit)
 * PUT   /:id → Update a record (edit fields, change status)
 * DELETE /:id → Delete a record
 */

const express = require("express");
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/gstRegistration.controller");

// GET /api/gst-registrations — Fetch all with pagination & filters
router.get("/", getAll);

// GET /api/gst-registrations/:id — Fetch single record by ID
router.get("/:id", getById);

// POST /api/gst-registrations — Create new record (Old App calls this)
router.post("/", create);

// PUT /api/gst-registrations/:id — Update existing record
router.put("/:id", update);

// DELETE /api/gst-registrations/:id — Delete a record
router.delete("/:id", remove);

module.exports = router;
