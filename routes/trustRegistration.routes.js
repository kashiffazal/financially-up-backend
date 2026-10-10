/**
 * Trust Registration Routes
 * ==============================
 * Base path: /api/trust-registrations
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorizeModule } = require("../middleware/authorize");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const upload = require("../middleware/upload");
const { getAll, getById, create, update, remove } = require("../controllers/trustRegistration.controller");

router.get("/", authenticate, authorizeModule("trust", "view"), getAll);
router.get("/:id", authenticate, authorizeModule("trust", "view"), getById);
// Public form submission (JSON or multipart with evidence uploads)
router.post("/", upload.publicForm.any(), create);
router.put("/:id", authenticate, authorizeModule("trust", "manage"), update);
router.delete("/:id", authenticate, authorizeModule("trust", "manage"), recordDeletionDisabled); // records are never deleted

module.exports = router;
