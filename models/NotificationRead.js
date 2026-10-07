/**
 * NotificationRead Model
 * ======================
 * Marks a notification as read for one staff user (one row per user per notification),
 * and records when that user removed it from their list.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NotificationRead = sequelize.define(
  "notification_reads",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Set when the user removes the notification from their own list (others still see it)
    dismissedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    indexes: [{ unique: true, fields: ["notificationId", "userId"] }, { fields: ["userId"] }],
  }
);

module.exports = NotificationRead;
