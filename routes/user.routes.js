/**
 * User Management Routes
 * ======================
 * Endpoints for administering users with strict RBAC permission checks.
 */

const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");

// All user routes require authentication
router.use(authenticate);

router.get("/", authorize("users.view"), userController.getUsers);
router.post("/", authorize("users.create"), userController.createUser);
router.get("/:id", authorize("users.view"), userController.getUserById);
router.put("/:id", authorize("users.edit"), userController.updateUser);
router.patch("/:id/status", authorize("users.disable"), userController.updateUserStatus);
router.put("/:id/roles", authorize("users.roles.manage"), userController.updateUserRoles);
router.post("/:id/reset-password", authorize("users.reset_password"), userController.resetUserPassword);
router.get("/:id/activity", authorize("users.activity.view"), userController.getUserActivity);
router.get("/:id/sessions", authorize("users.sessions.manage"), userController.getUserSessions);
router.delete("/:id/sessions/:sessionId", authorize("users.sessions.manage"), userController.revokeUserSession);
router.delete("/:id/sessions", authorize("users.sessions.manage"), userController.revokeAllUserSessions);

module.exports = router;
