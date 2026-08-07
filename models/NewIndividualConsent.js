/**
 * NewIndividualConsent Model
 * ==========================
 * Sequelize model for 'new_individual_consents' table.
 * Records statutory legal consents (TASA 2009, Privacy, ATO Authority, Biometric, Cloud Processing).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualConsent = sequelize.define("new_individual_consents", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  engagementId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  consentType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  accepted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = NewIndividualConsent;
