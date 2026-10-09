/**
 * Contact Enquiry Routes
 * ======================
 * Base path: /api/contact-enquiries
 *
 * POST   /      → public website contact form (rate limited)
 * GET    /      → list enquiries            (enquiries.view)
 * GET    /:id   → single enquiry            (enquiries.view)
 * PUT    /:id   → status / staff notes      (enquiries.manage)
 * DELETE /:id   → delete enquiry            (enquiries.manage)
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const { authorize } = require("../middleware/authorize");
const { contactLimiter } = require("../middleware/rateLimiter");
const controller = require("../controllers/contactEnquiry.controller");

router.post("/", contactLimiter, controller.create);

router.get("/", authenticate, authorize("enquiries.view"), controller.list);
router.get("/:id", authenticate, authorize("enquiries.view"), controller.getById);
router.put("/:id", authenticate, authorize("enquiries.manage"), controller.update);
router.delete("/:id", authenticate, authorize("enquiries.manage"), recordDeletionDisabled); // records are never deleted

module.exports = router;
