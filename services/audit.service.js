/**
 * Centralized Audit Service
 * =========================
 * Provides an immutable, append-only security and operational audit logging service.
 * Automatically masks and sanitizes sensitive fields (passwords, tokens, hashes)
 * before persisting records to the `audit_logs` table.
 */

const { AuditLog } = require("../models");

// Fields that must never be recorded in raw before/after JSON snapshots
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "newpassword",
  "currentpassword",
  "token",
  "refreshtoken",
  "sessiontoken",
  "session_token_hash",
  "secret",
  "authorization",
  "cookie",
]);

/**
 * Recursively sanitize an object by masking sensitive keys.
 *
 * @param {any} data - Object or primitive to sanitize
 * @returns {any} Sanitized clone of data
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Log a system or user action to the immutable audit trail.
 *
 * @param {Object} params
 * @param {number|string} [params.actorUserId] - ID of user initiating the action
 * @param {number|string} [params.targetUserId] - ID of target user affected (if applicable)
 * @param {string} params.action - Action identifier (e.g. LOGIN_SUCCESS, USER_CREATED, GST_APPROVED)
 * @param {string} params.module - Module name (e.g. auth, users, roles, gst, company)
 * @param {string} [params.resourceType] - Type of resource (e.g. User, Role, GstRegistration)
 * @param {string|number} [params.resourceId] - ID of affected resource
 * @param {string} [params.description] - Human-readable summary
 * @param {Object} [params.beforeData] - State prior to mutation
 * @param {Object} [params.afterData] - State after mutation
 * @param {string} [params.ipAddress] - Client IP
 * @param {string} [params.userAgent] - Client User Agent
 * @param {string} [params.requestId] - Unique request tracking ID
 * @param {string} [params.status='SUCCESS'] - 'SUCCESS' or 'FAILURE'
 * @param {string} [params.errorMessage] - Error details if status is FAILURE
 * @returns {Promise<AuditLog|null>} Created audit log record
 */
const log = async ({
  actorUserId = null,
  targetUserId = null,
  action,
  module,
  resourceType = null,
  resourceId = null,
  description = null,
  beforeData = null,
  afterData = null,
  ipAddress = null,
  userAgent = null,
  requestId = null,
  status = "SUCCESS",
  errorMessage = null,
}) => {
  try {
    if (!action || !module) {
      console.warn("Audit log missing required 'action' or 'module' field:", { action, module });
      return null;
    }

    const entry = await AuditLog.create({
      actorUserId: actorUserId ? Number(actorUserId) : null,
      targetUserId: targetUserId ? Number(targetUserId) : null,
      action: action.toUpperCase(),
      module: module.toLowerCase(),
      resourceType,
      resourceId: resourceId !== null && resourceId !== undefined ? String(resourceId) : null,
      description,
      beforeData: beforeData ? sanitizeData(beforeData) : null,
      afterData: afterData ? sanitizeData(afterData) : null,
      ipAddress: ipAddress ? String(ipAddress).substring(0, 45) : null,
      userAgent: userAgent ? String(userAgent) : null,
      requestId,
      status: status === "FAILURE" ? "FAILURE" : "SUCCESS",
      errorMessage: errorMessage ? String(errorMessage) : null,
    });

    return entry;
  } catch (error) {
    // Audit logging failure should not crash the primary operational request,
    // but should be aggressively reported in server logs.
    console.error("❌ Failed to write to audit log:", error.message, { action, module });
    return null;
  }
};

module.exports = {
  log,
  sanitizeData,
};
