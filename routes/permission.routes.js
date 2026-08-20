/**
 * Permission Routes
 * =================
 * Endpoints for querying available permissions.
 */

const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permission.controller");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");

// All permission routes require authentication
router.use(authenticate);

router.get("/", authorize("roles.permissions.manage"), permissionController.getPermissions);

module.exports = router;
