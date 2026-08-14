/**
 * Business Name Registration Routes
 * ==============================
 * Base path: /api/business-name-registrations
 */

const express = require("express");
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/businessNameRegistration.controller");

// GET /api/business-name-registrations - Fetch all with pagination & filters
router.get("/", getAll);

// GET /api/business-name-registrations/:id - Fetch single record by ID
router.get("/:id", getById);

// POST /api/business-name-registrations - Create new record
router.post("/", create);

// PUT /api/business-name-registrations/:id - Update existing record
router.put("/:id", update);

// DELETE /api/business-name-registrations/:id - Delete a record
router.delete("/:id", remove);

module.exports = router;
