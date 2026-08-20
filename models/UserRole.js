/**
 * UserRole Model (Join Table)
 * ===========================
 * Maps Users to Roles with multi-role support.
 * Enforces unique (userId, roleId) combinations.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserRole = sequelize.define(
  "UserRole",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
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
    roleId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "role_id",
      references: {
        model: "user_roles",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    assignedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "assigned_by",
    },
  },
  {
    tableName: "user_main_roles",
    timestamps: true,
    updatedAt: false, // Only created_at is needed
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "role_id"],
      },
      {
        fields: ["user_id"],
      },
      {
        fields: ["role_id"],
      },
    ],
  }
);

module.exports = UserRole;
