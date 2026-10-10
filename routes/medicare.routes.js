/**
 * Medicare Routes
 * ==============================
 * Base path: /api/medicare
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorizeModule } = require("../middleware/authorize");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const upload = require("../middleware/upload");
const { getAll, getById, create, update, remove } = require("../controllers/medicare.controller");

router.get("/", authenticate, authorizeModule("medicare", "view"), getAll);
router.get("/:id", authenticate, authorizeModule("medicare", "view"), getById);
// Public form submission (JSON or multipart with evidence uploads)
router.post("/", upload.publicForm.any(), create);
router.put("/:id", authenticate, authorizeModule("medicare", "manage"), update);
router.delete("/:id", authenticate, authorizeModule("medicare", "manage"), recordDeletionDisabled); // records are never deleted

module.exports = router;
