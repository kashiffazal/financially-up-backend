/**
 * NewIndividualIdentity Model
 * ===========================
 * Sequelize model for 'new_individual_identities' table.
 * Records identity verification method, DVS status, uploaded ID paths, selfie, and biometric consent.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualIdentity = sequelize.define("new_individual_identities", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  engagementId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  identityMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  primaryIdPath: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  supportingIdPath: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  selfiePath: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  noPhotoIdReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  biometricConsent: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  dvsStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: "Pending",
  },
});

module.exports = NewIndividualIdentity;
