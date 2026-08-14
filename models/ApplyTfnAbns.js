/**
 * ApplyTfnAbns Model
 * ==========================
 * Sequelize model for the 'apply_tfn_abns' table.
 * Maps directly to the form fields from the old app's Apply TFN & ABN form.
 * Each row represents one form submission from a client.
 *
 * This form handles multiple entity types (Individual TFN, Sole Trader ABN,
 * Company ABN, Trust ABN, Partnership ABN) - each with its own set of fields.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ApplyTfnAbns = sequelize.define("apply_tfn_abns", {
  // ============================
  // Primary Key
  // ============================
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ============================
  // Common / Individual TFN Fields
  // ============================

  /** Which form types were selected - can be a JSON array or comma-separated string */
  applyTFN_ABN: {
    type: DataTypes.TEXT, // Can hold "[\"TFN\", \"ABN\"]" or a single string
    allowNull: true,
  },

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

  /** Applicant's phone number */
  phoneNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Applicant's email address */
  email: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Date of birth */
  dob: {
    type: DataTypes.TEXT, // Stored as string to match old app format
    allowNull: true,
  },

  /** Full residential address */
  address: {
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

  /** Proof of identity documents - array of file URLs */
  proofOfID: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // ============================
  // Common Address Components (housenumber/street)
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

  // ============================
  // Sole Trader ABN Section
  // ============================

  /** Sole trader house number */
  housenumber_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader street */
  street_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader postal address - house number */
  housenumber_Sole_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader postal address - street */
  street_Sole_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader business address - house number */
  housenumber_Sole_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader business address - street */
  street_Sole_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader first name */
  firstName_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader last name */
  lastName_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader phone number */
  phoneNumber_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader email */
  email_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader date of birth */
  dob_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader TFN */
  TFN_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader business activity description */
  BusinessActivity_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader address */
  address_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader suburb */
  suburb_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader postcode */
  postcode_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader state */
  state_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader postal address */
  PostalAddress_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader business address */
  Business_Sole: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader proof of identity - array of file URLs */
  proofOfID_Sole: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Sole trader postal checkbox address */
  address_Sole_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader postal checkbox suburb */
  suburb_Sole_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader postal checkbox postcode */
  postcode_Sole_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader business checkbox state */
  state_Sole_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader postal checkbox state */
  state_Sole_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader business checkbox address */
  Address_Sole_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader business checkbox suburb */
  suburb_Sole_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Sole trader business checkbox postcode */
  postcode_Sole_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Company ABN Section
  // ============================

  /** Company ABN house number */
  housenumber_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN street */
  street_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN postal address - house number */
  housenumber_CompanyABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN postal address - street */
  street_CompanyABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN business address - house number */
  housenumber_CompanyABN_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN business address - street */
  street_CompanyABN_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN contact first name */
  firstName_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN contact last name */
  lastName_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN contact phone */
  phoneNumber_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN contact email */
  email_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN contact date of birth */
  dob_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN TFN */
  TFN_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN business activity */
  BusinessActivity_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN position/role */
  position_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN address */
  address_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN suburb */
  suburb_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN postcode */
  postcode_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN state */
  state_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN postal address */
  PostalAddress_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN business address */
  Business_CompanyABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN proof of identity - array of file URLs */
  proofOfID_CompanyABN: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Company ABN postal checkbox address */
  address_CompanyABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN postal checkbox suburb */
  suburb_CompanyABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN postal checkbox postcode */
  postcode_CompanyABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN postal checkbox state */
  state_CompanyABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN business checkbox address */
  Address_CompanyABN_BusinessCheckBox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN business checkbox suburb */
  suburb_CompanyABN_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Company ABN business checkbox postcode */
  postcode_CompanyABN_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Trust ABN Section
  // ============================

  /** Trust ABN house number */
  housenumber_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN street */
  street_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust name */
  TrustName_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN contact first name */
  firstName_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN contact last name */
  lastName_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN contact phone */
  phoneNumber_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN contact email */
  email_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN contact date of birth */
  dob_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN TFN */
  TFN_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN business activity */
  BusinessActivity_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN address */
  address_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN suburb */
  suburb_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN postcode */
  postcode_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN state */
  state_TrustABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Trust ABN proof of identity - array of file URLs */
  proofOfID_TrustABN: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // ============================
  // Partnership ABN Section
  // ============================

  /** Partnership ABN house number */
  housenumber_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN street */
  street_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN postal address - house number */
  housenumber_PartnershipABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN postal address - street */
  street_PartnershipABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN business address - house number */
  housenumber_PartnershipABN_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN business address - street */
  street_PartnershipABN_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN contact first name */
  firstName_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN contact last name */
  lastName_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN contact phone */
  phoneNumber_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN contact email */
  email_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN contact date of birth */
  dob_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN TFN */
  TFN_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN business activity */
  BusinessActivity_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN address */
  address_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN suburb */
  suburb_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN postcode */
  postcode_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN state */
  state_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN postal address */
  PostalAddress_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN business address */
  Business_PartnershipABN: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN proof of identity - array of file URLs */
  proofOfID_PartnershipABN: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Partnership ABN postal checkbox address */
  address_PartnershipABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN postal checkbox suburb */
  suburb_PartnershipABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN postal checkbox postcode */
  postcode_PartnershipABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN postal checkbox state */
  state_PartnershipABN_PostalCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN business checkbox address */
  Address_PartnershipABN_BusinessCheckBox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN business checkbox suburb */
  suburb_PartnershipABN_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Partnership ABN business checkbox postcode */
  postcode_PartnershipABN_BusinessCheckbox: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================

  /** Type of form submitted (e.g., "apply-tfn-abns") */
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

  /** Client signature - Base64 encoded image or URL */
  signature: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  pdfUrl: {
    type: DataTypes.TEXT, // URL to the generated PDF form
    allowNull: true,
  },

  /** Workflow status - managed by admin panel */
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "New Query", // Default status when form is submitted from old app
  },

  /** Notes added by admin when approving/changing status */
  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvalNotes: {
    type: DataTypes.TEXT, // Notes added by admin when approving/changing status
    allowNull: true,
  },
});

module.exports = ApplyTfnAbns;
