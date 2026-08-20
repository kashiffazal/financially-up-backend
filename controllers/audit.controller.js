/**
 * Audit Log Controller
 * ====================
 * Read-only controller for searching, filtering, and inspecting system-wide audit records.
 */

const { Op } = require("sequelize");
const { AuditLog, User } = require("../models");

/**
 * GET /api/audit-logs
 * Paginated list of audit records with comprehensive multi-criteria filtering.
 */
const getAuditLogs = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    module: mod,
    action,
    actorUserId,
    targetUserId,
    status,
    startDate,
    endDate,
    search,
  } = req.query;

  try {
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const where = {};

    if (mod) where.module = mod.toLowerCase();
    if (action) where.action = action.toUpperCase();
    if (actorUserId) where.actorUserId = actorUserId;
    if (targetUserId) where.targetUserId = targetUserId;
    if (status && ["SUCCESS", "FAILURE"].includes(status)) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { description: { [Op.like]: q } },
        { action: { [Op.like]: q } },
        { resourceType: { [Op.like]: q } },
        { resourceId: { [Op.like]: q } },
        { ipAddress: { [Op.like]: q } },
      ];
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "firstName", "lastName", "email", "avatar"],
          required: false,
        },
        {
          model: User,
          as: "target",
          attributes: ["id", "firstName", "lastName", "email", "avatar"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        uuid: l.uuid,
        action: l.action,
        module: l.module,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        description: l.description,
        status: l.status,
        errorMessage: l.errorMessage,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt,
        actor: l.actor
          ? {
              id: l.actor.id,
              name: `${l.actor.firstName} ${l.actor.lastName}`.trim(),
              email: l.actor.email,
              avatar: l.actor.avatar,
            }
          : null,
        target: l.target
          ? {
              id: l.target.id,
              name: `${l.target.firstName} ${l.target.lastName}`.trim(),
              email: l.target.email,
              avatar: l.target.avatar,
            }
          : null,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getAuditLogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve audit logs.",
    });
  }
};

/**
 * GET /api/audit-logs/:id
 * Full details of a single audit log entry including raw JSON diffs.
 */
const getAuditLogById = async (req, res) => {
  const { id } = req.params;

  try {
    const log = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "firstName", "lastName", "email", "avatar", "department", "jobTitle"],
        },
        {
          model: User,
          as: "target",
          attributes: ["id", "firstName", "lastName", "email", "avatar", "department", "jobTitle"],
        },
      ],
    });

    if (!log) {
      return res.status(404).json({ success: false, message: "Audit record not found." });
    }

    return res.status(200).json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("getAuditLogById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve audit record details.",
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
