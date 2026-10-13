/**
 * RecordTrash Model
 * =================
 * One row per application / subscriber currently in Trash (status "Trash"):
 * remembers the status it had before, so "Restore" puts it back exactly there.
 * The record itself is never deleted (services/trash.service.js).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RecordTrash = sequelize.define(
  "record_trash",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    moduleKey: {
      type: DataTypes.STRING(40),
      allowNull: false,
      comment: "Module key from utils/modulePermissions.js (e.g. gst, new-individual, newsletter)",
    },
    recordId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousStatus: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    trashedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trashedByName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    trashedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    indexes: [{ unique: true, fields: ["moduleKey", "recordId"] }],
  }
);

module.exports = RecordTrash;
