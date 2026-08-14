/**
 * NewIndividualLodgment Model
 * ==========================
 * Sequelize model for 'new_individual_lodgments' table.
 * Future-ready table for document-specific tax returns, BAS lodgements, and applications.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualLodgment = sequelize.define("new_individual_lodgments", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  engagementId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(100), // e.g. "TAX_RETURN", "BAS", "ABN_APPLICATION"
    allowNull: false,
  },
  period: {
    type: DataTypes.STRING(50), // e.g. "2026", "2026-Q1"
    allowNull: false,
  },
  documentId: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(50), // e.g. "DRAFT", "READY_FOR_CLIENT_APPROVAL", "CLIENT_APPROVED", "LODGED"
    allowNull: false,
    defaultValue: "DRAFT",
  },
  preparedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lodgedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = NewIndividualLodgment;
