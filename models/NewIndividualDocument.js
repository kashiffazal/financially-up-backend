/**
 * NewIndividualDocument Model
 * ===========================
 * Sequelize model for 'new_individual_documents' table.
 * Stores metadata and relative file paths for all client uploads.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualDocument = sequelize.define("new_individual_documents", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  engagementId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  documentCategory: {
    type: DataTypes.STRING(50), // Visa, ATO Notice, Authority Document, ID Document
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
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
});

module.exports = NewIndividualDocument;
