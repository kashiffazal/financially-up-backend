/**
 * Notification Model
 * ==================
 * One row per staff-facing event, broadcast to every user allowed to see it:
 *   - "submission"       a client submitted an application form
 *   - "status_change"    a staff member changed an application's status / decision
 *   - "contact_enquiry"  a website visitor sent the contact form
 *
 * Visibility is controlled by `permission` (same slug the sidebar uses for the
 * module; NULL = every staff member). Per-user read state lives in
 * `notification_reads`. Actors never see notifications about their own actions.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "notifications",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      comment: "submission | status_change | contact_enquiry",
    },
    moduleKey: {
      type: DataTypes.STRING(60),
      allowNull: true,
      comment: "Global search module key (e.g. gst, new-company) or 'enquiries'",
    },
    recordId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Event details: fromStatus, toStatus, clientName, email, phone, service…",
    },
    permission: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Permission slug required to see this notification (NULL = all staff)",
    },
    actorUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actorName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
  },
  {
    indexes: [{ fields: ["createdAt"] }, { fields: ["moduleKey", "recordId"] }],
  }
);

module.exports = Notification;
