/**
 * Role Model
 * ==========
 * Database-driven custom roles (e.g., Administrator, Accountant, Reviewer, Viewer).
 * Protected system roles have `is_system: true` and cannot be deleted by users.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = sequelize.define(
  "Role",
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: "is_system",
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active",
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "created_by",
    },
  },
  {
    tableName: "user_roles",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["slug"],
      },
      {
        fields: ["status"],
      },
    ],
  }
);

module.exports = Role;
