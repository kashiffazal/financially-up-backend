/**
 * Company Registration Routes
 * ==============================
 * Base path: /api/company-registrations
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorizeModule } = require("../middleware/authorize");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const { getAll, getById, create, update, remove } = require("../controllers/companyRegistration.controller");

router.get("/", authenticate, authorizeModule("legacy-company", "view"), getAll);
router.get("/:id", authenticate, authorizeModule("legacy-company", "view"), getById);
router.post("/", create);
router.put("/:id", authenticate, authorizeModule("legacy-company", "manage"), update);
router.delete("/:id", authenticate, authorizeModule("legacy-company", "manage"), recordDeletionDisabled); // records are never deleted

module.exports = router;
