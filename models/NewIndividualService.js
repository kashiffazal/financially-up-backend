/**
 * NewIndividualService Model
 * ==========================
 * Sequelize model for 'new_individual_services' table.
 * Records all selected services for a new engagement submission.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualService = sequelize.define("new_individual_services", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  engagementId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  serviceName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
});

module.exports = NewIndividualService;
