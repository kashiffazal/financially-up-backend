/**
 * Company Registration Routes
 * ==============================
 * Base path: /api/company-registrations
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const { getAll, getById, create, update, remove } = require("../controllers/companyRegistration.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getById);
router.post("/", create);
router.put("/:id", authenticate, update);
router.delete("/:id", authenticate, recordDeletionDisabled); // records are never deleted

module.exports = router;
