/**
 * NewIndividualLodgmentDeclaration Model
 * =====================================
 * Sequelize model for 'new_individual_lodgment_declarations' table.
 * Future-ready table recording specific client per-lodgment approvals and declarations.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualLodgmentDeclaration = sequelize.define("new_individual_lodgment_declarations", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  lodgmentId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  clientId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  declarationText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  documentVersion: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "1.0",
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  signatureEvidence: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
});

module.exports = NewIndividualLodgmentDeclaration;
