/**
 * Changes To Company Details Routes
 * ==============================
 * Base path: /api/changes-to-company-details
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const upload = require("../middleware/upload");
const { getAll, getById, create, update, remove } = require("../controllers/changesToCompanyDetails.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getById);
// Public form submission (JSON or multipart with evidence uploads)
router.post("/", upload.publicForm.any(), create);
router.put("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);

module.exports = router;
