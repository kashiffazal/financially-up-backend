/**
 * NewIndividualAdminReview Model
 * ==============================
 * Sequelize model for 'new_individual_admin_reviews' table.
 * Stores internal tax agent/compliance review decisions, checklist items,
 * AML/CTF checks, sanctions verification, risk ratings, and staff signature evidence.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualAdminReview = sequelize.define(
  "new_individual_admin_reviews",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    engagementId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },
    userRole: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Accountant",
    },
    reviewerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Financially Up Tax Agent",
    },
    decision: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Accept",
    },
    riskLevel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Low",
    },
    riskRationale: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    checklistItems: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    amlDesignatedServiceInvolved: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "No",
    },
    amlBeneficialOwnershipVerified: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "Yes",
    },
    amlSourceOfFundsRecorded: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "N/A",
    },
    amlEscalationRequired: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "No",
    },
    sanctionsOverseasActivityCheck: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Pass",
    },
    sanctionsHighRiskJurisdictionCheck: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Pass",
    },
    sanctionsNameMatchCheck: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Clear - No Match",
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    signatureMethod: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "draw",
    },
    signatureFilePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    signatureTypedName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    signatureDrawnData: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: "new_individual_admin_reviews",
    timestamps: true,
  }
);

module.exports = NewIndividualAdminReview;
