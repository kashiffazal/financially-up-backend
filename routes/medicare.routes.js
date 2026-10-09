/**
 * Medicare Routes
 * ==============================
 * Base path: /api/medicare
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const upload = require("../middleware/upload");
const { getAll, getById, create, update, remove } = require("../controllers/medicare.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getById);
// Public form submission (JSON or multipart with evidence uploads)
router.post("/", upload.publicForm.any(), create);
router.put("/:id", authenticate, update);
router.delete("/:id", authenticate, recordDeletionDisabled); // records are never deleted

module.exports = router;
