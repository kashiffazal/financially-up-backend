/**
 * IndividualEngagement Model
 * ==========================
 * Sequelize model for the 'individual_engagements' table.
 * Maps directly to the form fields from the old app's Individual Engagement form.
 * Each row represents one form submission from a client.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const IndividualEngagement = sequelize.define("individual_engagements", {
  // ============================
  // Primary Key
  // ============================
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ============================
  // Personal Information
  // ============================
  FirstName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  LastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  VisaStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  Occupation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dob: {
    type: DataTypes.STRING, // Stored as string to match old app format
    allowNull: true,
  },

  // ============================
  // Spouse Information
  // ============================
  Spouse: {
    type: DataTypes.STRING, // "Yes" or "No"
    allowNull: true,
  },
  SpouseFname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  SpouseLname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  NoOfDependants: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  SpouseIncome: {
    type: DataTypes.DECIMAL(10, 2), // Number type from form spec
    allowNull: true,
  },

  // ============================
  // Residential Address
  // ============================
  housenumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  street: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  residentialAddressMap: {
    type: DataTypes.TEXT, // Can hold long Google Maps URLs or full address strings
    allowNull: true,
  },
  Residential_Address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  suburb: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  postcode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  // ============================
  // Postal Address
  // ============================
  housenumber2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  street2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  postalAddressMap: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  PostalAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  suburb2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  postcode2: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  state2: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  // ============================
  // Postal Checkbox Address (if same as residential)
  // ============================
  address_PostalCheckbox: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  suburb_PostalCheckbox: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  postcode_PostalCheckbox: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  state_PostalCheckbox: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  // ============================
  // Contact Information
  // ============================
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ============================
  // Tax & Financial Details
  // ============================
  TFN: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ABN: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  // ============================
  // Bank Details
  // ============================
  NameOfAccount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  BSB: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  AccountNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  // ============================
  // Step 3 Address Fields
  // ============================
  suburb_Step3: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  postcode_Step3: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  state_step3: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  // ============================
  // Agreement & Signature
  // ============================
  Terms_Conditions: {
    type: DataTypes.STRING(10), // "accepted" / "not accepted"
    allowNull: true,
  },
  ClientName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  signature: {
    type: DataTypes.TEXT, // Base64 encoded signature image or URL
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================
  formType: {
    type: DataTypes.STRING(100), // e.g., "individual-engagement"
    allowNull: true,
  },
  proofOfID: {
    type: DataTypes.JSON, // Array of file paths/URLs e.g., ["/uploads/id1.jpg", "/uploads/id2.jpg"]
    allowNull: true,
  },
  pdfUrl: {
    type: DataTypes.TEXT, // URL to the generated PDF form
    allowNull: true,
  },

  // ============================
  // Workflow Status (added by admin system)
  // ============================
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "New Query", // Default status when form is submitted from old app
  },
  approvalNotes: {
    type: DataTypes.TEXT, // Notes added by admin when approving/changing status
    allowNull: true,
  },
});

module.exports = IndividualEngagement;
