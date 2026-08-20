/**
 * Authentication Middleware
 * =========================
 * Verifies the user's session token from HttpOnly cookies or Bearer headers.
 * Validates the session record in the database, checks account status,
 * loads effective permissions, and attaches sanitized `req.user` and `req.session`.
 */

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Session, Role } = require("../models");
const permissionService = require("../services/permission.service");

const JWT_SECRET = process.env.JWT_SECRET || "financially_up_secure_jwt_secret_dev_2026_!#%*";

/**
 * Hash a raw token string using SHA-256 for database lookup.
 *
 * @param {string} token
 * @returns {string} Hexadecimal hash
 */
const hashSessionToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Extract from HttpOnly cookie
    if (req.cookies && (req.cookies.session_token || req.cookies.token)) {
      token = req.cookies.session_token || req.cookies.token;
    }

    // 2. Extract from Authorization Bearer header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. No session token provided.",
      });
    }

    // 3. Verify JWT signature & expiration
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session token.",
      });
    }

    // 4. Verify session record in DB (check if revoked or expired)
    const tokenHash = hashSessionToken(token);
    const sessionRecord = await Session.findOne({
      where: {
        userId: decoded.id,
        sessionTokenHash: tokenHash,
      },
    });

    if (!sessionRecord) {
      return res.status(401).json({
        success: false,
        message: "Session not found or has been revoked.",
      });
    }

    if (sessionRecord.revokedAt) {
      return res.status(401).json({
        success: false,
        message: "Session has been revoked.",
      });
    }

    if (new Date(sessionRecord.expiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session has expired. Please log in again.",
      });
    }

    // Update last activity on session asynchronously
    sessionRecord.update({ lastActivityAt: new Date() }).catch((e) => {});

    // 5. Load user and verify active status
    const user = await User.findByPk(decoded.id, {
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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Access denied.`,
      });
    }

    // 6. Resolve effective permissions
    const permissions = await permissionService.getUserPermissions(user.id);

    // 7. Attach sanitized user info & session to request
    req.user = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone,
      department: user.department,
      jobTitle: user.jobTitle,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      roles: (user.roles || []).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        isSystem: r.isSystem,
      })),
      permissions,
    };

    req.session = sessionRecord;
    req.permissions = permissions;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

module.exports = {
  authenticate,
  hashSessionToken,
};
