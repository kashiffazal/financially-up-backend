/**
 * Changes To Company Details Routes
 * ==============================
 * Base path: /api/changes-to-company-details
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorizeModule } = require("../middleware/authorize");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const upload = require("../middleware/upload");
const { getAll, getById, create, update, remove } = require("../controllers/changesToCompanyDetails.controller");

router.get("/", authenticate, authorizeModule("changes-company", "view"), getAll);
router.get("/:id", authenticate, authorizeModule("changes-company", "view"), getById);
// Public form submission (JSON or multipart with evidence uploads)
router.post("/", upload.publicForm.any(), create);
router.put("/:id", authenticate, authorizeModule("changes-company", "manage"), update);
router.delete("/:id", authenticate, authorizeModule("changes-company", "manage"), recordDeletionDisabled); // records are never deleted

module.exports = router;
