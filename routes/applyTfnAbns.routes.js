/**
 * Apply TFN & ABNs Routes
 * ==============================
 * Defines all REST API endpoints for the Apply TFN & ABN resource.
 * Each route maps to a controller function that handles the business logic.
 *
 * Base path: /api/apply-tfn-abns
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
} = require("../controllers/applyTfnAbns.controller");

// GET /api/apply-tfn-abns - Fetch all with pagination & filters
router.get("/", getAll);

// GET /api/apply-tfn-abns/:id - Fetch single record by ID
router.get("/:id", getById);

// POST /api/apply-tfn-abns - Create new record (Old App calls this)
router.post("/", create);

// PUT /api/apply-tfn-abns/:id - Update existing record
router.put("/:id", update);

// DELETE /api/apply-tfn-abns/:id - Delete a record
router.delete("/:id", remove);

module.exports = router;
