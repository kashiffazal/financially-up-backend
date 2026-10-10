/**
 * SMSF Registration Routes
 * ==============================
 * Base path: /api/smsf-registrations
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorizeModule } = require("../middleware/authorize");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const upload = require("../middleware/upload");
const { getAll, getById, create, update, remove } = require("../controllers/smsfRegistration.controller");

router.get("/", authenticate, authorizeModule("smsf", "view"), getAll);
router.get("/:id", authenticate, authorizeModule("smsf", "view"), getById);
// Public form submission (JSON or multipart with evidence uploads)
router.post("/", upload.publicForm.any(), create);
router.put("/:id", authenticate, authorizeModule("smsf", "manage"), update);
router.delete("/:id", authenticate, authorizeModule("smsf", "manage"), recordDeletionDisabled); // records are never deleted

module.exports = router;
