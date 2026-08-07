/**
 * NewIndividualClient Model
 * =========================
 * Sequelize model for 'new_individual_clients' table.
 * Stores primary taxpayer client profiles for the New Individual Engagement Form.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualClient = sequelize.define("new_individual_clients", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  birthCountry: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  birthCity: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  occupation: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  employmentStatus: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  about: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tfn: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  maskedTfn: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
});

module.exports = NewIndividualClient;
