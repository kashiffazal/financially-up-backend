/**
 * GstRegistration Model
 * ==========================
 * Sequelize model for the 'gst_registrations' table.
 * Maps directly to the form fields from the old app's GST Registration form.
 * Each row represents one form submission from a client.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GstRegistration = sequelize.define("gst_registrations", {
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

  /** Australian Business Number */
  abn: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Business structure type (e.g., Sole Trader, Company, Partnership, Trust) */
  businessStructure: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Personal Information
  // ============================

  /** Applicant's first name */
  firstName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Applicant's last name */
  lastName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Applicant's gender */
  gender: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Date of birth */
  dob: {
    type: DataTypes.TEXT, // Stored as string to match old app format
    allowNull: true,
  },

  /** Phone number */
  phone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Email address */
  email: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Address
  // ============================

  /** House number */
  housenumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Street name */
  street: {
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

  /** Postal address (if different from residential) */
  postalAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // GST Details
  // ============================

  /** Estimated annual turnover */
  estimateTurnover: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** GST accounting method timing (e.g., cash, accrual) */
  gstTiming: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Reporting frequency (e.g., monthly, quarterly, annually) */
  reportingFrequency: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Date Components (GST start date)
  // ============================

  /** Day of GST start date */
  day: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  /** Month of GST start date */
  month: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  /** Year of GST start date */
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // ============================
  // Additional Details
  // ============================

  /** Whether the business imports goods (e.g., "Yes", "No") */
  importGoods: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether the business has employees (e.g., "Yes", "No") */
  hasEmployees: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** GPS latitude of business address */
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },

  /** GPS longitude of business address */
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================

  /** Type of form submitted (e.g., "gst-registrations") */
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

module.exports = GstRegistration;
