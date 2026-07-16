/**
 * BusinessNameRegistration Model
 * ==========================
 * Sequelize model for the 'business_name_registrations' table.
 * Maps directly to the form fields from the old app's Business Name Registration form.
 * Each row represents one form submission from a client.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusinessNameRegistration = sequelize.define("business_name_registrations", {
  // ============================
  // Primary Key
  // ============================
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ============================
  // Business Information
  // ============================

  /** Proposed business name */
  businessProposeName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** House number of business address */
  housenumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Street name of business address */
  street: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Australian Business Number */
  ABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Phone number (uppercase field from old app) */
  PhoneNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Email address */
  email: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Applicant's full address */
  YourAddress: {
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

  /** State (e.g., NSW, VIC) */
  state: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Registered business address */
  BusinessRegAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Applicant's full name */
  Name: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Date of submission or registration date */
  Date: {
    type: DataTypes.TEXT, // Stored as string to match old app format
    allowNull: true,
  },

  /** Phone number (lowercase field — alternate phone) */
  phone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================

  /** Type of form submitted (e.g., "business-name-registrations") */
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

  /** Client signature — Base64 encoded image or URL */
  signature: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Workflow status — managed by admin panel */
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "New Query",
  },

  /** Notes added by admin when approving/changing status */
  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = BusinessNameRegistration;
