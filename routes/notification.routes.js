/**
 * Notification Routes
 * ===================
 * Base path: /api/notifications (all endpoints require login)
 *
 * GET  /               → paged feed (?filter=all|unread&limit=20&before=<id>)
 * GET  /unread-count   → unread count + newest unread item (polled by the header bell)
 * GET  /stream         → live Server-Sent Events feed of new notifications
 * POST /read-all       → mark every visible notification as read
 * GET  /:id            → full details (marks it read)
 * POST /:id/read       → mark one notification as read
 * DELETE /             → remove all from MY list (?filter=unread → only unread ones)
 * DELETE /:id          → remove one from MY list (colleagues keep theirs)
 * POST /:id/restore    → undo a removal
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const controller = require("../controllers/notification.controller");

router.use(authenticate);

router.get("/", controller.list);
router.get("/unread-count", controller.unreadCount);
router.get("/stream", controller.stream);
router.post("/read-all", controller.markAllRead);
router.delete("/", controller.dismissAll);
router.get("/:id", controller.getById);
router.post("/:id/read", controller.markOneRead);
router.post("/:id/restore", controller.restoreOne);
router.delete("/:id", controller.dismissOne);

module.exports = router;
