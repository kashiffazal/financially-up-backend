/**
 * SmsfRegistration Model
 * ==========================
 * Sequelize model for the 'smsf_registrations' table.
 * Maps directly to the form fields from the old app's SMSF Registrations form.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SmsfRegistration = sequelize.define("smsf_registrations", {
  // ============================
  // Primary Key
  // ============================
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ============================
  // SMSF Information
  // ============================

  NameOfSMSF: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  Founder: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  NameOfIndividual: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  Companyabn: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Address 1
  // ============================

  suburb1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  housenumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  postcode1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  state1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Address 2
  // ============================

  housenumber1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Address 3
  // ============================

  housenumber2: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street2: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  AdressOfIndividual: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  suburb: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  postcode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  state_Step1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Appointers & Settlers
  // ============================

  NameOfAppointer: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  NameOfSettlers: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Members
  // ============================

  /** List of member names (string array) */
  MemberOfSmsf: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Member details objects array (from MemberDetailSchema) */
  memberDetails: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // ============================
  // Trustees
  // ============================

  TrusteeOfSmsf: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  DirectorOfCorporate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  CompanyName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  ACN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Address 4 (Step 3)
  // ============================

  StreeyAddressStep_3: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  suburb_step3: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  state_Step3: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  postcode_step3: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  country_Step3: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Meeting Details
  // ============================

  ExecuteTheDeed: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  SigningOnBehalf: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  AttendingTheMeeting: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  ChairTheMeeting: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  Venue: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  date_smsf: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  hours_smsf: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  minutes_smsf: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Contact info
  // ============================

  AccountantName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  Text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  NameClient: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  mobileNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================

  formType: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Admin Workflow Fields
  // ============================

  pdfUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  signature: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "New Query",
  },

  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = SmsfRegistration;
