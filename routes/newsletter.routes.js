/**
 * Newsletter Subscriber Routes
 * ============================
 * Base path: /api/newsletter-subscribers
 *
 * POST   /      → public website newsletter form (rate limited)
 * GET    /      → list / filter subscribers     (newsletter.view)
 * GET    /:id   → one subscriber              (newsletter.view)
 * PUT    /:id   → unsubscribe / re-subscribe    (newsletter.manage)
 * DELETE /:id   → disabled (records are never deleted)
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { recordDeletionDisabled } = require("../middleware/recordDeletionDisabled");
const { newsletterLimiter } = require("../middleware/rateLimiter");
const controller = require("../controllers/newsletter.controller");

router.post("/", newsletterLimiter, controller.subscribe);

router.get("/", authenticate, authorize("newsletter.view"), controller.list);
router.get("/:id", authenticate, authorize("newsletter.view"), controller.getById);
router.put("/:id", authenticate, authorize("newsletter.manage"), controller.update);
router.delete("/:id", authenticate, authorize("newsletter.manage"), recordDeletionDisabled);

module.exports = router;
