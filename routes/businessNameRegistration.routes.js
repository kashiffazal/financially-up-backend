/**
 * Business Name Registration Routes
 * ==============================
 * Base path: /api/business-name-registrations
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const upload = require("../middleware/upload");
const {
  getAll,
  getById,
  create,
  update,
  remove,
} = require("../controllers/businessNameRegistration.controller");

// GET /api/business-name-registrations - Fetch all with pagination & filters
router.get("/", authenticate, getAll);

// GET /api/business-name-registrations/:id - Fetch single record by ID
router.get("/:id", authenticate, getById);

// POST /api/business-name-registrations - Create new record
// Public form submission (JSON or multipart with evidence uploads)
router.post("/", upload.publicForm.any(), create);

// PUT /api/business-name-registrations/:id - Update existing record
router.put("/:id", authenticate, update);

// DELETE /api/business-name-registrations/:id - Delete a record
router.delete("/:id", authenticate, recordDeletionDisabled); // records are never deleted

module.exports = router;
