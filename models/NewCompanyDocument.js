/**
 * NewCompanyDocument Model
 * ========================
 * Sequelize model for 'new_company_documents' table.
 * Stores metadata for all uploaded supporting documents.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyDocument = sequelize.define("new_company_documents", {
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

  /* ─── Document Metadata ─── */
  documentType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Primary ID, Photo ID, Director Consent, Member Consent, ASIC Extract, Trust Deed, Structure Chart, Occupier Consent, Source of Wealth Evidence, Nominee Agreement, Authority Document",
  },
  fileName: { type: DataTypes.STRING(255), allowNull: true },
  filePath: { type: DataTypes.TEXT, allowNull: true },
  fileSize: { type: DataTypes.BIGINT, allowNull: true },
  mimeType: { type: DataTypes.STRING(100), allowNull: true },
  status: {
    type: DataTypes.ENUM("Attached", "To Follow", "Verified", "Rejected"),
    allowNull: true,
    defaultValue: "Attached",
  },
});

module.exports = NewCompanyDocument;
