/**
 * Global Settings Routes
 * ======================
 * Mounted at /api/settings in app.js
 *
 * The public GET endpoint is intentionally unauthenticated: the website, the
 * client-facing forms and the PHP PDF service all need the company details.
 * Editing requires authentication plus the `settings.update` permission.
 */

const express = require("express");
const router = express.Router();

const settingController = require("../controllers/setting.controller");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");

/* Public: flat key/value map of global variables */
router.get("/", settingController.getPublicSettings);

/* Admin Portal: full rows with labels/groups */
router.get("/manage", authenticate, authorize("settings.view"), settingController.getManagedSettings);

/* Admin Portal: bulk update */
router.put("/manage", authenticate, authorize("settings.update"), settingController.updateSettings);

module.exports = router;
