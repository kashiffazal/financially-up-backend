/**
 * NewCompanyConsent Model
 * =======================
 * Sequelize model for 'new_company_consents' table.
 * Universal versioned consent record with SHA-256 invalidation hash.
 * Tracks individual Director Consents, Member Consents, Address Service Terms,
 * and Nominee/Trustee Arrangement acceptances.
 *
 * INVALIDATION RULE: If shareholder details (numberOfShares, shareClass, etc.)
 * change after consent was given, the status flips to 'Outdated' and a new
 * consent is required before final submission / ASIC lodgement.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyConsent = sequelize.define("new_company_consents", {
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

  /* ─── Person Identification ─── */
  personType: {
    type: DataTypes.ENUM("Officeholder", "Member", "ScheduleC_Recipient"),
    allowNull: false,
  },
  personId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: "FK to new_company_officeholders.id or new_company_shareholders.id",
  },
  personName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Full name of the consenting person for PDF filename generation",
  },

  /* ─── Consent Classification ─── */
  consentType: {
    type: DataTypes.ENUM(
      "DirectorConsent",
      "MemberConsent",
      "AddressServiceTerms",
      "NomineeArrangement"
    ),
    allowNull: false,
  },
  consentVersion: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: "v1.0",
  },

  /* ─── Status & Invalidation ─── */
  status: {
    type: DataTypes.ENUM("Active", "Outdated", "Superseded", "Revoked"),
    allowNull: false,
    defaultValue: "Active",
  },
  snapshotData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: "JSON snapshot of the exact terms, shares, or roles consented to",
  },
  consentDataHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: "SHA-256 hash of shareholding/role parameters for invalidation detection",
  },

  /* ─── Signature & Audit ─── */
  signedAt: { type: DataTypes.DATE, allowNull: true },
  signatureData: { type: DataTypes.TEXT("long"), allowNull: true, comment: "Base64 signature data" },
  ipAddress: { type: DataTypes.STRING(50), allowNull: true },
});

module.exports = NewCompanyConsent;
