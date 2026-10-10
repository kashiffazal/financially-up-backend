/**
 * User Management Controller
 * ==========================
 * Full CRUD, role assignment, status toggling, password resets,
 * session management, and activity inspection for user accounts.
 */

const { Op } = require("sequelize");
const { User, Role, UserRole, Session, AuditLog, sequelize } = require("../models");
const crypto = require("crypto");
const { hashPassword, passwordProblem } = require("../utils/password");
const passwordLinks = require("../services/passwordToken.service");

// ============================
// Lock-out protection
// ============================

const ADMIN_ROLE_SLUG = "administrator";
const isSelf = (req, user) => String(req.user?.id) === String(user.id);

/** Does this user currently hold the Administrator role? */
const hasAdminRole = async (userId, transaction) => {
  const adminRole = await Role.findOne({ where: { slug: ADMIN_ROLE_SLUG }, transaction });
  if (!adminRole) return false;
  return Boolean(await UserRole.findOne({ where: { userId, roleId: adminRole.id }, transaction }));
};

/** True when `userId` is the only active user with the Administrator role. */
const isLastActiveAdmin = async (userId, transaction) => {
  const adminRole = await Role.findOne({ where: { slug: ADMIN_ROLE_SLUG }, transaction });
  if (!adminRole || !(await hasAdminRole(userId, transaction))) return false;
  const links = await UserRole.findAll({ where: { roleId: adminRole.id }, attributes: ["userId"], raw: true, transaction });
  const otherIds = links.map((l) => l.userId).filter((id) => String(id) !== String(userId));
  if (!otherIds.length) return true;
  const others = await User.count({ where: { id: { [Op.in]: otherIds }, status: "Active" }, transaction });
  return others === 0;
};

const LAST_ADMIN_MESSAGE = "This is the only active Administrator. Give another user the Administrator role first, so the portal is never left without one.";

/** Password nobody knows: used until the user sets their own from the emailed link. */
const unusablePassword = () => crypto.randomBytes(32).toString("base64url");
const auditService = require("../services/audit.service");
const permissionService = require("../services/permission.service");

/**
 * GET /api/users
 * Paginated list of users with search, role filtering, and status filtering.
 */
const getUsers = async (req, res) => {
  const { page = 1, limit = 10, search = "", status = "", roleId = "" } = req.query;

  try {
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const where = {};

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { firstName: { [Op.like]: q } },
        { lastName: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { department: { [Op.like]: q } },
        { jobTitle: { [Op.like]: q } },
      ];
    }

    if (status && ["Active", "Inactive", "Suspended"].includes(status)) {
      where.status = status;
    }

    const roleInclude = {
      model: Role,
      as: "roles",
      through: { attributes: [] },
      required: false,
    };

    if (roleId) {
      roleInclude.where = { id: roleId };
      roleInclude.required = true;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: [roleInclude],
      distinct: true,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
      attributes: { exclude: ["passwordHash"] },
    });

    return res.status(200).json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        uuid: u.uuid,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`.trim(),
        phone: u.phone,
        department: u.department,
        jobTitle: u.jobTitle,
        avatar: u.avatar,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        lastLoginIp: u.lastLoginIp,
        createdAt: u.createdAt,
        roles: (u.roles || []).map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          isSystem: r.isSystem,
        })),
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
    });
  }
};

/**
 * POST /api/users
 * Create a new user account and assign roles.
 *
 * passwordMode:
 *   "email"  (default) - the user gets a "Set your password" email (link valid 48 hours);
 *                        no password is typed or shared by the admin
 *   "manual"           - the admin sets `password`; the user must change it at first login
 */
const createUser = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    department,
    jobTitle,
    bio,
    avatar,
    status = "Active",
    roleIds = [],
    passwordMode = "email",
  } = req.body;
  const sendLink = passwordMode !== "manual";

  const t = await sequelize.transaction();

  try {
    if (!email || !firstName || !lastName) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Email, first name, and last name are required.",
      });
    }

    if (!sendLink) {
      const weakness = passwordProblem(password);
      if (weakness) {
        await t.rollback();
        return res.status(400).json({ success: false, message: weakness });
      }
    }

    // Check unique email
    const existing = await User.findOne({
      where: { email: email.trim().toLowerCase() },
      transaction: t,
    });
    if (existing) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "A user with this email address already exists.",
      });
    }

    // Emailed link: nobody knows the password until the user sets it
    const passwordHash = await hashPassword(sendLink ? unusablePassword() : password);

    // Create user
    const newUser = await User.create(
      {
        email: email.trim().toLowerCase(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone || null,
        department: department || null,
        jobTitle: jobTitle || null,
        bio: bio || null,
        avatar: avatar || null,
        status: ["Active", "Inactive", "Suspended"].includes(status) ? status : "Active",
        emailVerifiedAt: new Date(),
        // A password chosen by the admin must be replaced at first login
        mustChangePassword: !sendLink,
      },
      { transaction: t }
    );

    // Assign roles
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const userRolesData = roleIds.map((rId) => ({
        userId: newUser.id,
        roleId: rId,
        assignedBy: req.user.id,
      }));
      await UserRole.bulkCreate(userRolesData, { transaction: t });
    }

    await t.commit();

    // Audit log USER_CREATED
    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: newUser.id,
      action: "USER_CREATED",
      module: "users",
      resourceType: "User",
      resourceId: newUser.id,
      description: `Created user account for ${newUser.email} with ${roleIds.length} roles`,
      afterData: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        department: newUser.department,
        jobTitle: newUser.jobTitle,
        status: newUser.status,
        roleIds,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    // Welcome email with the "Set my password" link (after the account is saved;
    // if it fails the account stays and the admin can resend from the Users list)
    let emailSent = false;
    if (sendLink) {
      try {
        await passwordLinks.issueAndEmail(newUser, "setup", { createdByUserId: req.user.id, requestIp: req.ip });
        emailSent = true;
      } catch (mailError) {
        console.error("[Users] Welcome email failed:", mailError.message);
      }
    }

    // Load with roles to return
    const createdWithRoles = await User.findByPk(newUser.id, {
      include: [{ model: Role, as: "roles", through: { attributes: [] } }],
      attributes: { exclude: ["passwordHash"] },
    });

    return res.status(201).json({
      success: true,
      message: !sendLink
        ? "User created. They'll be asked to choose their own password when they first sign in."
        : emailSent
          ? `User created. A "Set your password" email was sent to ${newUser.email}.`
          : "User created, but the welcome email couldn't be sent. Use Reset Password > Send email to try again.",
      emailSent,
      user: createdWithRoles,
    });
  } catch (error) {
    await t.rollback();
    console.error("createUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user.",
    });
  }
};

/**
 * GET /api/users/:id
 * Get full user details including assigned roles and permissions.
 */
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: "roles",
          through: { attributes: [] },
        },
      ],
      attributes: { exclude: ["passwordHash"] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const permissions = await permissionService.getUserPermissions(user.id);

    return res.status(200).json({
      success: true,
      user: {
        ...user.toJSON(),
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        permissions,
      },
    });
  } catch (error) {
    console.error("getUserById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user.",
    });
  }
};

/**
 * PUT /api/users/:id
 * Update user profile and details.
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, department, jobTitle, bio, avatar, status } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Status changes that would lock people out
    if (status && status !== user.status && status !== "Active") {
      if (isSelf(req, user)) {
        return res.status(400).json({ success: false, message: "You can't deactivate your own account." });
      }
      if (await isLastActiveAdmin(user.id)) {
        return res.status(400).json({ success: false, message: LAST_ADMIN_MESSAGE });
      }
    }

    const beforeData = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      department: user.department,
      jobTitle: user.jobTitle,
      bio: user.bio,
      avatar: user.avatar,
      status: user.status,
    };

    await user.update({
      firstName: firstName !== undefined ? firstName.trim() : user.firstName,
      lastName: lastName !== undefined ? lastName.trim() : user.lastName,
      phone: phone !== undefined ? phone : user.phone,
      department: department !== undefined ? department : user.department,
      jobTitle: jobTitle !== undefined ? jobTitle : user.jobTitle,
      bio: bio !== undefined ? bio : user.bio,
      avatar: avatar !== undefined ? avatar : user.avatar,
      status: status && ["Active", "Inactive", "Suspended"].includes(status) ? status : user.status,
    });

    const afterData = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      department: user.department,
      jobTitle: user.jobTitle,
      bio: user.bio,
      avatar: user.avatar,
      status: user.status,
    };

    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: user.id,
      action: "USER_UPDATED",
      module: "users",
      resourceType: "User",
      resourceId: user.id,
      description: `Updated profile for user ${user.email}`,
      beforeData,
      afterData,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        phone: user.phone,
        department: user.department,
        jobTitle: user.jobTitle,
        bio: user.bio,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("updateUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
    });
  }
};

/**
 * PATCH /api/users/:id/status
 * Enable, disable, or suspend a user account.
 */
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!["Active", "Inactive", "Suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Active', 'Inactive', or 'Suspended'.",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Prevent disabling self
    if (isSelf(req, user) && status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "You cannot disable your own active account.",
      });
    }
    // ...or the last active Administrator
    if (status !== "Active" && (await isLastActiveAdmin(user.id))) {
      return res.status(400).json({ success: false, message: LAST_ADMIN_MESSAGE });
    }

    const oldStatus = user.status;
    await user.update({ status });

    // If deactivated or suspended, revoke all active sessions
    if (status !== "Active") {
      await Session.update(
        { revokedAt: new Date() },
        { where: { userId: user.id, revokedAt: null } }
      );
    }

    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: user.id,
      action: "USER_STATUS_CHANGED",
      module: "users",
      resourceType: "User",
      resourceId: user.id,
      description: `Changed status of user ${user.email} from ${oldStatus} to ${status}`,
      beforeData: { status: oldStatus },
      afterData: { status },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: `User status changed to ${status}.`,
      status,
    });
  } catch (error) {
    console.error("updateUserStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change user status.",
    });
  }
};

/**
 * PUT /api/users/:id/roles
 * Assign or update user roles.
 */
const updateUserRoles = async (req, res) => {
  const { id } = req.params;
  const { roleIds = [] } = req.body;

  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: "roles", through: { attributes: [] } }],
      transaction: t,
    });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const previousRoleIds = (user.roles || []).map((r) => r.id);

    // Your own roles are changed by another administrator (prevents locking yourself out)
    if (isSelf(req, user)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "You can't change your own roles. Ask another administrator." });
    }
    // Removing the Administrator role from the last active Administrator
    const adminRole = await Role.findOne({ where: { slug: ADMIN_ROLE_SLUG }, transaction: t });
    const keepsAdmin = adminRole && (roleIds || []).map(String).includes(String(adminRole.id));
    if (adminRole && !keepsAdmin && (await isLastActiveAdmin(user.id, t))) {
      await t.rollback();
      return res.status(400).json({ success: false, message: LAST_ADMIN_MESSAGE });
    }

    // Delete current roles
    await UserRole.destroy({ where: { userId: user.id }, transaction: t });

    // Insert new roles
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const records = roleIds.map((rId) => ({
        userId: user.id,
        roleId: rId,
        assignedBy: req.user.id,
      }));
      await UserRole.bulkCreate(records, { transaction: t });
    }

    await t.commit();

    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: user.id,
      action: "USER_ROLES_UPDATED",
      module: "users",
      resourceType: "User",
      resourceId: user.id,
      description: `Updated role assignments for ${user.email}`,
      beforeData: { roleIds: previousRoleIds },
      afterData: { roleIds },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    const updatedRoles = await permissionService.getUserRoles(user.id);
    const updatedPermissions = await permissionService.getUserPermissions(user.id);

    return res.status(200).json({
      success: true,
      message: "User roles updated successfully.",
      roles: updatedRoles,
      permissions: updatedPermissions,
    });
  } catch (error) {
    await t.rollback();
    console.error("updateUserRoles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user roles.",
    });
  }
};

/**
 * POST /api/users/:id/reset-password
 * { mode: "email" }                    - email a reset link (valid 48 hours); the
 *                                        current password keeps working until it's used
 * { mode: "manual", newPassword }      - set a password the user must change at next login
 * Either way the user is signed out of every device.
 */
const resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword, mode = "manual" } = req.body;
  const sendLink = mode === "email";

  try {
    if (!sendLink) {
      const weakness = passwordProblem(newPassword);
      if (weakness) return res.status(400).json({ success: false, message: weakness });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (isSelf(req, user)) {
      return res.status(400).json({ success: false, message: "Change your own password from My Profile > Security & Password." });
    }

    if (sendLink) {
      try {
        await passwordLinks.issueAndEmail(user, "setup", { createdByUserId: req.user.id, requestIp: req.ip });
      } catch (mailError) {
        console.error("[Users] Reset email failed:", mailError.message);
        return res.status(502).json({ success: false, message: "The email couldn't be sent. Check the email (SMTP) settings and try again." });
      }
    } else {
      const passwordHash = await hashPassword(newPassword);
      await user.update({ passwordHash, mustChangePassword: true });
      await passwordLinks.cancelOpenTokens(user.id);
    }

    // Revoke all active sessions for target user
    await Session.update(
      { revokedAt: new Date() },
      { where: { userId: user.id, revokedAt: null } }
    );

    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: user.id,
      action: "ADMIN_RESET_PASSWORD",
      module: "users",
      resourceType: "User",
      resourceId: user.id,
      description: sendLink
        ? `Admin ${req.user.email} emailed a password reset link to ${user.email}`
        : `Admin ${req.user.email} set a temporary password for ${user.email} (must change at next login)`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: sendLink
        ? `A password reset link was emailed to ${user.email}. They've been signed out of all devices.`
        : "Temporary password set. The user must choose a new one at next sign-in and has been signed out of all devices.",
    });
  } catch (error) {
    console.error("resetUserPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset user password.",
    });
  }
};

/**
 * GET /api/users/:id/activity
 * Get activity and audit history for a specific user.
 */
const getUserActivity = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: {
        [Op.or]: [{ actorUserId: id }, { targetUserId: id }],
      },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getUserActivity error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user activity.",
    });
  }
};

/**
 * GET /api/users/:id/sessions
 * List active and historical sessions for a user.
 */
const getUserSessions = async (req, res) => {
  const { id } = req.params;

  try {
    const sessions = await Session.findAll({
      where: { userId: id },
      order: [["created_at", "DESC"]],
      limit: 20,
    });

    return res.status(200).json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        uuid: s.uuid,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceName: s.deviceName,
        expiresAt: s.expiresAt,
        lastActivityAt: s.lastActivityAt,
        isRevoked: Boolean(s.revokedAt),
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("getUserSessions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load sessions.",
    });
  }
};

/**
 * DELETE /api/users/:id/sessions/:sessionId
 * Revoke specific session of a user.
 */
const revokeUserSession = async (req, res) => {
  const { id, sessionId } = req.params;

  try {
    const session = await Session.findOne({
      where: { id: sessionId, userId: id },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    await session.update({ revokedAt: new Date() });

    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: id,
      action: "USER_SESSION_REVOKED",
      module: "users",
      resourceType: "Session",
      resourceId: sessionId,
      description: `Admin revoked session ${sessionId} for user ID ${id}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Session revoked successfully.",
    });
  } catch (error) {
    console.error("revokeUserSession error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to revoke session.",
    });
  }
};

/**
 * DELETE /api/users/:id/sessions
 * Revoke ALL active sessions for a user.
 */
const revokeAllUserSessions = async (req, res) => {
  const { id } = req.params;

  try {
    await Session.update(
      { revokedAt: new Date() },
      { where: { userId: id, revokedAt: null } }
    );

    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: id,
      action: "USER_ALL_SESSIONS_REVOKED",
      module: "users",
      resourceType: "Session",
      description: `Admin revoked all active sessions for user ID ${id}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "All active sessions revoked for user.",
    });
  } catch (error) {
    console.error("revokeAllUserSessions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to revoke user sessions.",
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserRoles,
  resetUserPassword,
  getUserActivity,
  getUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
};
