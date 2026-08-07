/**
 * NewIndividualSignature Model
 * ============================
 * Sequelize model for 'new_individual_signatures' table.
 * Stores electronic signature details for both client and tax agent countersignature.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualSignature = sequelize.define("new_individual_signatures", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  engagementId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  signerType: {
    type: DataTypes.ENUM("Client", "TaxAgent"),
    allowNull: false,
    defaultValue: "Client",
  },
  signerFullName: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  signatureMethod: {
    type: DataTypes.ENUM("draw", "type", "upload"),
    allowNull: false,
    defaultValue: "draw",
  },
  signatureFilePath: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  typedSignatureText: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bindingConfirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

module.exports = NewIndividualSignature;
