/**
 * Authentication Controller
 * =========================
 * Manages user login, session issuance, token generation, logout,
 * profile management, and password change with Argon2id hashing and audit logging.
 */

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Role, Session, Permission } = require("../models");
const { verifyPassword, hashPassword } = require("../utils/password");
const { hashSessionToken } = require("../middleware/authenticate");
const auditService = require("../services/audit.service");
const permissionService = require("../services/permission.service");

const JWT_SECRET = process.env.JWT_SECRET || "financially_up_secure_jwt_secret_dev_2026_!#%*";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Helper to calculate session expiry date (defaults to 7 days).
 */
const getSessionExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};

/**
 * POST /api/auth/login
 * Authenticate user credentials, create session, and issue secure cookie.
 */
const login = async (req, res) => {
  const { email, password, deviceName } = req.body;
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // 1. Query user by email
    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
      include: [
        {
          model: Role,
          as: "roles",
          where: { status: "Active" },
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    // 2. Generic failure if user not found (prevent user enumeration)
    if (!user) {
      await auditService.log({
        action: "LOGIN_FAILED",
        module: "auth",
        description: `Failed login attempt for non-existent email: ${email}`,
        ipAddress,
        userAgent,
        status: "FAILURE",
        errorMessage: "User not found",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 3. Verify account status
    if (user.status !== "Active") {
      await auditService.log({
        actorUserId: user.id,
        targetUserId: user.id,
        action: "LOGIN_FAILED",
        module: "auth",
        description: `Login attempt on ${user.status} account for ${email}`,
        ipAddress,
        userAgent,
        status: "FAILURE",
        errorMessage: `Account status is ${user.status}`,
      });

      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Please contact an administrator.`,
      });
    }

    // 4. Verify password with Argon2id
    const isMatch = await verifyPassword(user.passwordHash, password);
    if (!isMatch) {
      await auditService.log({
        actorUserId: user.id,
        targetUserId: user.id,
        action: "LOGIN_FAILED",
        module: "auth",
        description: `Invalid password entered for email: ${email}`,
        ipAddress,
        userAgent,
        status: "FAILURE",
        errorMessage: "Password mismatch",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 5. Generate secure JWT token
    const token = jwt.sign(
      {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 6. Create session in database
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiryDate();

    await Session.create({
      userId: user.id,
      sessionTokenHash: tokenHash,
      ipAddress: String(ipAddress).substring(0, 45),
      userAgent: userAgent.substring(0, 500),
      deviceName: deviceName || "Web Browser",
      expiresAt,
      lastActivityAt: new Date(),
    });

    // 7. Update last login metadata on user
    await user.update({
      lastLoginAt: new Date(),
      lastLoginIp: String(ipAddress).substring(0, 45),
    });

    // 8. Resolve effective permissions
    const permissions = await permissionService.getUserPermissions(user.id);

    // 9. Set secure HttpOnly cookie
    res.cookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 10. Audit log LOGIN_SUCCESS
    await auditService.log({
      actorUserId: user.id,
      targetUserId: user.id,
      action: "LOGIN_SUCCESS",
      module: "auth",
      description: `User ${user.email} logged in successfully`,
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    // 11. Return sanitized user profile and token
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
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
        roles: (user.roles || []).map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          isSystem: r.isSystem,
        })),
        permissions,
      },
    });
  } catch (error) {
    console.error("Login controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login.",
    });
  }
};

/**
 * POST /api/auth/logout
 * Revoke the current active session and clear authentication cookie.
 */
const logout = async (req, res) => {
  try {
    if (req.session) {
      await req.session.update({ revokedAt: new Date() });
    }

    res.clearCookie("session_token");

    if (req.user) {
      await auditService.log({
        actorUserId: req.user.id,
        action: "LOGOUT",
        module: "auth",
        description: `User ${req.user.email} logged out`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        status: "SUCCESS",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout.",
    });
  }
};

/**
 * GET /api/auth/me
 * Return the authenticated user's profile and effective permissions.
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("getMe controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile.",
    });
  }
};

/**
 * PUT /api/auth/profile
 * Update current user's personal profile information.
 */
const updateProfile = async (req, res) => {
  const { firstName, lastName, phone, department, jobTitle, bio, avatar } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const beforeData = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      department: user.department,
      jobTitle: user.jobTitle,
      bio: user.bio,
      avatar: user.avatar,
    };

    await user.update({
      firstName: firstName !== undefined ? firstName.trim() : user.firstName,
      lastName: lastName !== undefined ? lastName.trim() : user.lastName,
      phone: phone !== undefined ? phone : user.phone,
      department: department !== undefined ? department : user.department,
      jobTitle: jobTitle !== undefined ? jobTitle : user.jobTitle,
      bio: bio !== undefined ? bio : user.bio,
      avatar: avatar !== undefined ? avatar : user.avatar,
    });

    const afterData = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      department: user.department,
      jobTitle: user.jobTitle,
      bio: user.bio,
      avatar: user.avatar,
    };

    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: req.user.id,
      action: "USER_PROFILE_UPDATED",
      module: "auth",
      description: `User ${user.email} updated their profile information`,
      beforeData,
      afterData,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    // Re-fetch updated user profile
    const updatedPermissions = await permissionService.getUserPermissions(user.id);
    const userRoles = await permissionService.getUserRoles(user.id);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
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
        roles: userRoles.map((r) => ({ id: r.id, name: r.name, slug: r.slug })),
        permissions: updatedPermissions,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

/**
 * PUT /api/auth/change-password
 * Change current user's password with Argon2id validation and revoke other active sessions.
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 1. Verify current password
    const isMatch = await verifyPassword(user.passwordHash, currentPassword);
    if (!isMatch) {
      await auditService.log({
        actorUserId: req.user.id,
        action: "PASSWORD_CHANGE_FAILED",
        module: "auth",
        description: "Failed password change due to incorrect current password",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
      });

      return res.status(400).json({
        success: false,
        message: "The current password you entered is incorrect.",
      });
    }

    // 2. Hash new password with Argon2id
    const newHash = await hashPassword(newPassword);
    await user.update({ passwordHash: newHash });

    // 3. Revoke all OTHER sessions except current one for account protection
    const { Op } = require("sequelize");
    if (req.session) {
      await Session.update(
        { revokedAt: new Date() },
        {
          where: {
            userId: user.id,
            id: { [Op.ne]: req.session.id },
            revokedAt: null,
          },
        }
      );
    }

    await auditService.log({
      actorUserId: req.user.id,
      targetUserId: user.id,
      action: "PASSWORD_CHANGED",
      module: "auth",
      description: `Password changed successfully for user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Other active sessions were invalidated for security.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
};

/**
 * GET /api/auth/sessions
 * List active sessions for the current user.
 */
const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.findAll({
      where: {
        userId: req.user.id,
      },
      order: [["created_at", "DESC"]],
      limit: 20,
    });

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      uuid: s.uuid,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      deviceName: s.deviceName,
      expiresAt: s.expiresAt,
      lastActivityAt: s.lastActivityAt,
      isCurrent: req.session ? req.session.id === s.id : false,
      isRevoked: Boolean(s.revokedAt),
      createdAt: s.createdAt,
    }));

    return res.status(200).json({
      success: true,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("getMySessions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load sessions.",
    });
  }
};

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session for current user.
 */
const revokeMySession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findOne({
      where: {
        id: sessionId,
        userId: req.user.id,
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    await session.update({ revokedAt: new Date() });

    await auditService.log({
      actorUserId: req.user.id,
      action: "SESSION_REVOKED",
      module: "auth",
      resourceType: "Session",
      resourceId: session.id,
      description: `User revoked session ID ${session.id}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Session revoked successfully.",
    });
  } catch (error) {
    console.error("revokeMySession error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to revoke session.",
    });
  }
};

module.exports = {
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  getMySessions,
  revokeMySession,
};
