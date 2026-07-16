/**
 * EntityEngagement Model
 * ==========================
 * Sequelize model for the 'entity_engagements' table.
 * Maps directly to the form fields from the old app's Entity Engagement form.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EntityEngagement = sequelize.define("entity_engagements", {
  // ============================
  // Primary Key
  // ============================
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ============================
  // Entity Information
  // ============================

  /** Type of entity (e.g., Company, Trust, Partnership) */
  TypeOfEntity: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Legal name of the entity */
  LegalName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Tax File Number */
  TFN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Australian Business Number */
  ABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trading name of the entity */
  TradingName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Address
  // ============================

  /** Registered address */
  RegisteredAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

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

  /** Postal address (if different from registered) */
  postalAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Contact Information
  // ============================

  /** Phone number */
  PhoneNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Email address */
  email: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Bank Details
  // ============================

  /** Bank account number */
  AccountNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** BSB number */
  BSB: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Name on the bank account */
  NameOfAccount: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Directors & Former Accountant
  // ============================

  /** List of directors */
  ListOfDirectors: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Former accountant name */
  FormerAccountantName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Former accountant phone number */
  FormerPhoneNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Former accountant email */
  Formeremail: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Terms & Attachments
  // ============================

  /** Terms and conditions acceptance */
  Terms_Conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Proof of ID attachment — URL or JSON array of URLs */
  proofOfID: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Trust deed attachment */
  TrustDeed: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Location
  // ============================

  /** GPS latitude */
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },

  /** GPS longitude */
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================

  /** Type of form submitted (e.g., "entity-engagements") */
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

  /** Notes added by admin */
  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = EntityEngagement;
