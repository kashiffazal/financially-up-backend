/**
 * RolePermission Model (Join Table)
 * =================================
 * Maps Roles to Permissions.
 * Enforces unique (roleId, permissionId) combinations.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
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
    permissionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "permission_id",
      references: {
        model: "user_permissions",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "user_role_permissions",
    timestamps: true,
    updatedAt: false, // Only created_at is needed
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["role_id", "permission_id"],
      },
      {
        fields: ["role_id"],
      },
      {
        fields: ["permission_id"],
      },
    ],
  }
);

module.exports = RolePermission;
