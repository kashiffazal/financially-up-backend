/**
 * Permission Model
 * ================
 * Developer-defined system capabilities following the `[module].[resource].[action]` convention.
 * (e.g., `gst.registration.view`, `gst.registration.approve`, `users.create`).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "user_permissions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["slug"],
      },
      {
        fields: ["module"],
      },
    ],
  }
);

module.exports = Permission;
