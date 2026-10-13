/**
 * Trash Routes
 * ============
 * Base path: /api/trash (application logs and the newsletter)
 *
 * POST /:moduleKey           { ids }  move to Trash
 * POST /:moduleKey/restore   { ids }  restore to the previous status
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const controller = require("../controllers/trash.controller");

router.post("/:moduleKey", authenticate, controller.moveToTrash);
router.post("/:moduleKey/restore", authenticate, controller.restoreFromTrash);

module.exports = router;
