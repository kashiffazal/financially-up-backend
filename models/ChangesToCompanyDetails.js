/**
 * ChangesToCompanyDetails Model
 * ==========================
 * Sequelize model for the 'changes_to_company_details' table.
 * Maps directly to the form fields from the old app's Changes to Company Details form.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChangesToCompanyDetails = sequelize.define("changes_to_company_details", {
  // ============================
  // Primary Key
  // ============================
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ============================
  // Company Information
  // ============================

  /** Name of the company */
  NameOfCompany: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** ACN or ABN number */
  ACNorABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** List of changes to notify (JSON array of strings) */
  changesNotify: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // ============================
  // Contact Person
  // ============================

  /** First name */
  fname: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Middle name */
  mname: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Last name */
  lname: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Email address */
  email: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Old Address
  // ============================

  /** Old address (stored as JSON object from AddressSchema) */
  oldAddress: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Old suburb */
  oldSuburb: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Old postcode */
  oldPostcode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Old state */
  oldState: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // New Address
  // ============================

  /** New address (stored as JSON object from AddressSchema) */
  newAddress: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** New suburb */
  newSuburb: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** New postcode */
  newPostcode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** New state */
  newState: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Postal address */
  postalAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Appointment / Removal
  // ============================

  /** Appointment or removal type */
  appointmentRemoval: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Office holder type (e.g., Director, Secretary) */
  officeHolder: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Office Holder Details
  // ============================

  /** Office holder first name */
  fname1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Office holder middle name */
  mname1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Office holder last name */
  lname1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** House number */
  housenumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Street */
  street: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** House number (alternate) */
  housenumber1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Street (alternate) */
  street1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Office holder email */
  email1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Date of birth */
  dob: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether born in Australia */
  BornAustralia: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Residential address */
  residentialAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Suburb */
  suburb: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Postcode */
  postcode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** State */
  state1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Country */
  country1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Share Details
  // ============================

  /** Class of shares */
  ShareClass: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Number of shares */
  NoOfShares: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Number of paid shares */
  NoOfPaidShare: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Number of unpaid shares */
  NoOfUnpaidShare: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Declaration
  // ============================

  /** Declarant's name */
  YourName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Second date of birth */
  dob2: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** City */
  city: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Second suburb */
  suburb2: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================

  /** Type of form submitted */
  formType: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Admin Workflow Fields
  // ============================

  /** URL to the generated PDF form */
  pdfUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Client signature */
  signature: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Workflow status - managed by admin panel */
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "New Query",
  },

  /** Notes added by admin */
  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = ChangesToCompanyDetails;
