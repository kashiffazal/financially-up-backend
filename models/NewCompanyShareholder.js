/**
 * NewCompanyShareholder Model
 * ===========================
 * Sequelize model for 'new_company_shareholders' table.
 * Stores repeatable member/shareholder records.
 * Share changes trigger consent invalidation via consentValidation service.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyShareholder = sequelize.define("new_company_shareholders", {
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

  /* ─── Member Details ─── */
  fullName: { type: DataTypes.STRING(255), allowNull: true },
  memberType: {
    type: DataTypes.ENUM("Individual", "Company", "Trust", "Other"),
    allowNull: true,
    defaultValue: "Individual",
  },
  address: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Share Allocation ─── */
  shareClass: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: "Ordinary",
  },
  numberOfShares: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Number of shares subscribed",
  },
  amountPaidPerShare: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: true,
    comment: "Amount paid per share in AUD",
  },
  amountUnpaidPerShare: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: true,
    comment: "Amount unpaid per share in AUD",
  },

  /* ─── Beneficial Ownership ─── */
  isBeneficiallyHeld: { type: DataTypes.BOOLEAN, allowNull: true },
  heldForWhom: { type: DataTypes.STRING(255), allowNull: true },
  corporateOwnershipChain: { type: DataTypes.TEXT, allowNull: true },
  extractFilePath: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Member Consent (Section 231 Subscription Consent) ─── */
  consentAccepted: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
});

module.exports = NewCompanyShareholder;
