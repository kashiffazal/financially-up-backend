/**
 * NewCompanyAuditLog Model
 * ========================
 * Sequelize model for 'new_company_audit_logs' table.
 * Records all material actions for compliance audit trail.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyAuditLog = sequelize.define("new_company_audit_logs", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  registrationId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: "FK to new_company_registrations.id",
  },

  /* ─── Action Details ─── */
  action: { type: DataTypes.STRING(255), allowNull: false },
  performedBy: { type: DataTypes.STRING(255), allowNull: true, defaultValue: "System" },
  details: { type: DataTypes.JSON, allowNull: true },
  ipAddress: { type: DataTypes.STRING(50), allowNull: true },
});

module.exports = NewCompanyAuditLog;
