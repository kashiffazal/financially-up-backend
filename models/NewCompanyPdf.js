/**
 * NewCompanyPdf Model
 * ===================
 * Sequelize model for 'new_company_pdfs' table.
 * Tracks versioned generated PDFs for the Company Registration package:
 * - ClientApplication: Master 21-section client PDF
 * - AdminReview: Internal compliance review PDF
 * - DirectorConsent: Per-person Director Consent certificate
 * - MemberConsent: Per-person Member Consent certificate
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyPdf = sequelize.define("new_company_pdfs", {
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

  /* ─── PDF Classification ─── */
  type: {
    type: DataTypes.ENUM("ClientApplication", "AdminReview", "DirectorConsent", "MemberConsent"),
    allowNull: false,
  },
  personName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Person name for individual consent PDFs (e.g., John Smith)",
  },

  /* ─── File Details ─── */
  fileName: { type: DataTypes.STRING(255), allowNull: false },
  filePath: { type: DataTypes.TEXT, allowNull: false },
  version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  templateVersion: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "v1.0.0" },

  /* ─── Generation Audit ─── */
  generatedBy: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "System" },
  generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  emailSent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  emailSentAt: { type: DataTypes.DATE, allowNull: true },
});

module.exports = NewCompanyPdf;
