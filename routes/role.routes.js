/**
 * Role Management Routes
 * ======================
 * Endpoints for managing roles and permission matrix.
 */

const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");

// All role routes require authentication
router.use(authenticate);

router.get("/", authorize("roles.view"), roleController.getRoles);
router.post("/", authorize("roles.create"), roleController.createRole);
router.get("/:id", authorize("roles.view"), roleController.getRoleById);
router.put("/:id", authorize("roles.edit"), roleController.updateRole);
router.delete("/:id", authorize("roles.delete"), roleController.deleteRole);
router.put("/:id/permissions", authorize("roles.permissions.manage"), roleController.updateRolePermissions);

module.exports = router;
