/**
 * NewCompanyOfficeholder Model
 * ============================
 * Sequelize model for 'new_company_officeholders' table.
 * Stores repeatable director and secretary records.
 * Each person gets their own consent record linked via NewCompanyConsent.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyOfficeholder = sequelize.define("new_company_officeholders", {
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

  /* ─── Personal Details ─── */
  fullName: { type: DataTypes.STRING(255), allowNull: true },
  formerNames: { type: DataTypes.STRING(255), allowNull: true },
  dob: { type: DataTypes.DATEONLY, allowNull: true },
  birthCity: { type: DataTypes.STRING(100), allowNull: true },
  birthState: { type: DataTypes.STRING(100), allowNull: true },
  birthCountry: { type: DataTypes.STRING(100), allowNull: true },

  /* ─── Contact & Address ─── */
  residentialAddress: { type: DataTypes.TEXT, allowNull: true },
  email: { type: DataTypes.STRING(255), allowNull: true },
  mobile: { type: DataTypes.STRING(50), allowNull: true },

  /* ─── Role & Identity ─── */
  role: {
    type: DataTypes.ENUM("Director", "Secretary", "Director and Secretary"),
    allowNull: true,
    defaultValue: "Director",
  },
  occupation: { type: DataTypes.STRING(255), allowNull: true },
  citizenship: { type: DataTypes.STRING(100), allowNull: true },
  taxResidence: { type: DataTypes.STRING(100), allowNull: true },
  isAustralianResidentDirector: { type: DataTypes.BOOLEAN, allowNull: true },
  directorIdStatus: { type: DataTypes.STRING(100), allowNull: true },
  directorIdNumber: { type: DataTypes.STRING(100), allowNull: true },

  /* ─── Identity Document ─── */
  idDocType: { type: DataTypes.STRING(100), allowNull: true },
  idDocNumber: { type: DataTypes.STRING(100), allowNull: true },
  idDocFilePath: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Compliance Declarations ─── */
  pepStatus: { type: DataTypes.STRING(50), allowNull: true, comment: "Politically Exposed Person status" },
  sanctionsDeclaration: { type: DataTypes.STRING(50), allowNull: true },
  sourceOfWealth: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Consent (Director Consent to Act - Section 201D/204C) ─── */
  consentAccepted: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  signatureData: { type: DataTypes.TEXT("long"), allowNull: true, comment: "Base64 signature canvas data" },
  signatureDate: { type: DataTypes.DATEONLY, allowNull: true },
});

module.exports = NewCompanyOfficeholder;
