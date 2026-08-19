/**
 * NewCompanyAdminReview Model
 * ===========================
 * Sequelize model for 'new_company_admin_reviews' table.
 * Stores the internal AML/CTF compliance review for admin-only access.
 * NOT client-facing. Tracks identity verification, PEP/sanctions screening,
 * UBO review, source of funds assessment, and overall risk decision.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyAdminReview = sequelize.define("new_company_admin_reviews", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  registrationId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
    comment: "FK to new_company_registrations.id (one review per registration)",
  },

  /* ─── Reviewer Details ─── */
  reviewerName: { type: DataTypes.STRING(255), allowNull: true },
  reviewerRole: { type: DataTypes.STRING(100), allowNull: true, defaultValue: "Accountant" },

  /* ─── Review Status & Lifecycle ─── */
  reviewStatus: {
    type: DataTypes.ENUM(
      "Not Started",
      "Pending Documents",
      "Identity Review",
      "Ownership Review",
      "Compliance Screening",
      "Source Review",
      "Enhanced Review",
      "Escalated",
      "Approved",
      "Approved With Conditions",
      "Declined",
      "On Hold",
      "Re-Review Required",
      "Completed"
    ),
    allowNull: true,
    defaultValue: "Not Started",
  },

  /* ─── Risk Assessment ─── */
  overallRiskRating: {
    type: DataTypes.ENUM("Low", "Medium", "High", "Prohibited"),
    allowNull: true,
    defaultValue: "Low",
  },
  riskRationale: { type: DataTypes.TEXT, allowNull: true },

  /* ─── AML/CTF Screening Results ─── */
  pepSanctionsScreeningResult: { type: DataTypes.STRING(100), allowNull: true, defaultValue: "Clear" },
  adverseMediaResult: { type: DataTypes.STRING(100), allowNull: true, defaultValue: "Clear" },
  identityVerificationNotes: { type: DataTypes.TEXT, allowNull: true },
  ownershipVerificationNotes: { type: DataTypes.TEXT, allowNull: true },
  sourceOfFundsNotes: { type: DataTypes.TEXT, allowNull: true },

  /* ─── CDD Checklist ─── */
  cddVerificationNotes: { type: DataTypes.TEXT, allowNull: true },
  addressServiceApproval: { type: DataTypes.STRING(50), allowNull: true },

  /* ─── Decision ─── */
  decisionNotes: { type: DataTypes.TEXT, allowNull: true },
  approvalConditions: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Signature ─── */
  signatureMethod: { type: DataTypes.STRING(20), allowNull: true, comment: "draw, upload, or typed" },
  signatureFilePath: { type: DataTypes.TEXT, allowNull: true },
  signatureTypedName: { type: DataTypes.STRING(255), allowNull: true },
  signatureDrawnData: { type: DataTypes.TEXT("long"), allowNull: true },

  /* ─── Timestamps ─── */
  reviewStartedAt: { type: DataTypes.DATE, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  ipAddress: { type: DataTypes.STRING(50), allowNull: true },
});

module.exports = NewCompanyAdminReview;
