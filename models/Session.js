/**
 * Session Model
 * =============
 * Tracks active authentication sessions and devices per user.
 * Supports session token hashing, IP/device logging, activity tracking,
 * and individual or account-wide revocation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Session = sequelize.define(
  "Session",
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
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "user_id",
      references: {
        model: "user_main",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    sessionTokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "session_token_hash",
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
    deviceName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "device_name",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_activity_at",
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "revoked_at",
    },
  },
  {
    tableName: "user_sessions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["session_token_hash"],
      },
      {
        fields: ["expires_at"],
      },
      {
        fields: ["revoked_at"],
      },
    ],
  }
);

module.exports = Session;
