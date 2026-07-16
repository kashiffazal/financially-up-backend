/**
 * TrustRegistration Model
 * ==========================
 * Sequelize model for the 'trust_registrations' table.
 * Maps directly to the form fields from the old app's Trust Registration form.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TrustRegistration = sequelize.define("trust_registrations", {
  // ============================
  // Primary Key
  // ============================
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ============================
  // Trust Information
  // ============================

  /** Type of trust (e.g., Discretionary, Unit, Hybrid) */
  TypeOfTrust: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust name */
  TrustName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Establishment date of the trust */
  EstablishDate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** State of registration */
  state: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Trustee 1 — Personal Details
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

  // ============================
  // Trustee 1 — Address
  // ============================

  housenumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Appointer Details
  // ============================

  /** Number of appointers */
  NoOfAppointers: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Individual or company selection for appointer */
  IndividualOrCompany: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Appointer first name */
  fname1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Appointer middle name */
  mname1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Appointer last name */
  lname1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Appointer address */
  Address1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Appointer suburb */
  Suburb1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Appointer state */
  state2: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Appointer postcode */
  Postcode1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Additional Trustee / Member Addresses
  // ============================

  housenumber1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  housenumber2: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street2: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  housenumber3: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street3: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  housenumber4: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street4: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  housenumber5: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street5: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  housenumber6: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  street6: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Trust Address
  // ============================

  /** Trust registered address */
  Address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust suburb */
  Suburb: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust state */
  state1: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust postcode */
  Postcode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Additional Details
  // ============================

  /** Individual or Company selection 2 */
  IndividualOrCompany2: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Individual or Company selection 3 */
  IndividualOrCompany3: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Number of beneficiaries */
  beneficairyNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Registration options selected */
  registrationOptions: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================

  /** Type of form submitted (e.g., "trust-registrations") */
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

module.exports = TrustRegistration;
