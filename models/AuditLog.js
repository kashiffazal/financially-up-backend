/**
 * AuditLog Model
 * ==============
 * Immutable, append-only security and operational audit trail.
 * Logs actor, target, module, action, safe before/after snapshots,
 * network metadata (IP, user-agent), and execution status.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },
    actorUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "actor_user_id",
      references: {
        model: "user_main",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    targetUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "target_user_id",
      references: {
        model: "user_main",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "resource_type",
    },
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "resource_id",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    beforeData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "before_data",
    },
    afterData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "after_data",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "ip_address",
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "user_agent",
    },
    requestId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "request_id",
    },
    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILURE"),
      defaultValue: "SUCCESS",
      allowNull: false,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
    },
  },
  {
    tableName: "user_audit_logs",
    timestamps: true,
    updatedAt: false, // Immutable append-only log, only created_at
    underscored: true,
    indexes: [
      {
        fields: ["actor_user_id"],
      },
      {
        fields: ["target_user_id"],
      },
      {
        fields: ["module"],
      },
      {
        fields: ["action"],
      },
      {
        fields: ["resource_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

module.exports = AuditLog;
