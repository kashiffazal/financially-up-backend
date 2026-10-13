/**
 * Regenerate PDFs Routes
 * ======================
 * Base path: /api/pdf-regenerate (Individual Engagement + Company Registration)
 *
 * GET  /:moduleKey/:id   PDFs of the application, each Present / Missing
 * POST /:moduleKey/:id   rebuild them all
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const controller = require("../controllers/pdfRegenerate.controller");

router.get("/:moduleKey/:id", authenticate, controller.list);
router.post("/:moduleKey/:id", authenticate, controller.regenerate);

module.exports = router;
