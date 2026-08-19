/**
 * NewCompanyBeneficialOwner Model
 * ===============================
 * Sequelize model for 'new_company_beneficial_owners' table.
 * Stores Ultimate Beneficial Owner (UBO) records for AML/CTF compliance.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyBeneficialOwner = sequelize.define("new_company_beneficial_owners", {
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

  /* ─── UBO Details ─── */
  fullName: { type: DataTypes.STRING(255), allowNull: true },
  dob: { type: DataTypes.DATEONLY, allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  ownershipPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  holdingType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: "Direct, Indirect, Jointly Held, Trust, Nominee",
  },
  howControlIsHeld: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = NewCompanyBeneficialOwner;
