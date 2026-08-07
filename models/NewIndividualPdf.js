/**
 * NewIndividualPdf Model
 * ======================
 * Sequelize model for 'new_individual_pdfs' table.
 * Tracks versioned generated PDFs (ClientEngagement, AdminReview, EngagementAcceptance, AuditReport).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualPdf = sequelize.define("new_individual_pdfs", {
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
    type: DataTypes.ENUM("ClientEngagement", "AdminReview", "EngagementAcceptance", "AuditReport"),
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  templateVersion: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "v1.0.0",
  },
  generatedBy: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: "System",
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = NewIndividualPdf;
