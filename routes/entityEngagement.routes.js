/**
 * Entity Engagement Routes
 * ==============================
 * Base path: /api/entity-engagements
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorizeModule } = require("../middleware/authorize");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const upload = require("../middleware/upload");
const { getAll, getById, create, update, remove } = require("../controllers/entityEngagement.controller");

router.get("/", authenticate, authorizeModule("entity-engagements", "view"), getAll);
router.get("/:id", authenticate, authorizeModule("entity-engagements", "view"), getById);
// Public form submission (JSON or multipart with evidence uploads)
router.post("/", upload.publicForm.any(), create);
router.put("/:id", authenticate, authorizeModule("entity-engagements", "manage"), update);
router.delete("/:id", authenticate, authorizeModule("entity-engagements", "manage"), recordDeletionDisabled); // records are never deleted

module.exports = router;
