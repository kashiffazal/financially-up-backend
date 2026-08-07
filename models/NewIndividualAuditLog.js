/**
 * NewIndividualAuditLog Model
 * ===========================
 * Sequelize model for 'new_individual_audit_logs' table.
 * Immutable audit trail tracking form submissions, status changes, and admin reviews.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualAuditLog = sequelize.define("new_individual_audit_logs", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  engagementId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  performedBy: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: "Client",
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = NewIndividualAuditLog;
