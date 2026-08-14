/**
 * Medicare Model
 * ==========================
 * Sequelize model for the 'medicares' table.
 * Maps directly to the form fields from the old app's Medicare form.
 * Each row represents one form submission from a client.
 *
 * Field names are kept identical to the old app's form field names
 * so the POST body from the old app can be saved directly without transformation.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Medicare = sequelize.define("medicares", {
  // ============================
  // Primary Key
  // ============================
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ============================
  // Tax Agent Information
  // ============================

  /** Whether a tax agent is involved (e.g., "Yes", "No") */
  taxAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Name of the company */
  nameOfCompany: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Name of the tax agent */
  nameOfTaxAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Tax agent phone number */
  taxAgentPhoneNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Tax agent address */
  taxAgentAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Privacy notice acceptance */
  privacyNotice: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Tax agent permission */
  taxAgentPermission: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Medicare Card Details
  // ============================

  /** Medicare card type (e.g., "Green", "Blue", "Yellow") */
  medicareCard: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Medicare card number */
  medicareNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Medicare reference number */
  medicareRefNumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Personal Information
  // ============================

  /** Title (e.g., Mr, Mrs, Ms) */
  title: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Family name / last name */
  familyName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** First name */
  firstName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Second / middle name */
  secondName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Gender */
  gender: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Date of birth */
  dob: {
    type: DataTypes.TEXT,
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
  // Residential Address
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

  // ============================
  // Correspondence Address
  // ============================

  correspondenceHousenumber: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  correspondenceStreet: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  correspondenceSuburb: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  correspondencePostcode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  correspondenceState: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  correspondencePostalAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Tax Agent Address
  // ============================

  taxAgentHouseNo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  taxAgentStreet: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  taxAgentSuburb: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  taxAgentPostcode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  taxAgentState: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Residency & Eligibility
  // ============================

  /** Country lived in before Australia */
  LivingInBeforeAustralia: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Years of Australian residency */
  ResidenceYears: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Months of Australian residency */
  ResidenceMonths: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether applicant has health insurance */
  HasHealthInsurance: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether applicant is from Finland, Malta, or Norway */
  IsFromFinlandMaltaNorway: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether applicant lodged for permanent residency */
  applicantLodgedForPermanentResidency: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether there is an appeal against a decision */
  HasAppealAgainstDecision: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Appeal details */
  AppealAgainstDecision: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether application is under parents */
  hasApplicationUnderParents: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Permanent residency status */
  permanentResidency: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Residency status (e.g., Citizen, Permanent Resident) */
  ResidencyStatus: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether applicant entered Australia on student visa */
  EnterAustraliaOnStudentVisa: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Whether applicant is leaving Australia */
  IsLeavingAustralia: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Parents details */
  Parents: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Dates
  // ============================

  /** Financial year from date */
  FinancialYearFrom: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Financial year to date */
  FinancialYearTo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Declaration of Medicare */
  DeclarationOfMedicare: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Date letter received for permanent residence */
  RecievedDateOfLetterForPermanentResidence: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Application lodged date */
  ApplicationLodgedDate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Full name (declaration section) */
  FullName: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Date of declaration */
  Date: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Departure date from Australia */
  DepartureDate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Approved date */
  ApprovedDate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Withdrawn date */
  WithdrawnDate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Refused date */
  RefusedDate: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Location & Address Misc
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

  /** Postal address string */
  postalAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Agent address string */
  agentAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ============================
  // Attachments (JSON arrays of file URLs)
  // ============================

  /** Evidence of visa endorsed - array of file URLs */
  evidenceoOfVisaEndorsed: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Medical insurance details - can be array */
  medicalInsurance: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  /** Residency status attachment (single file URL) */
  ResidencyStatusAttachment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Passport copy (single file URL) */
  passportCopy: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  /** Other documents - array of file URLs */
  otherDocuments: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // ============================
  // Form Metadata
  // ============================

  /** Type of form submitted (e.g., "medicare") */
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

  /** Workflow status - managed by admin panel */
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

module.exports = Medicare;
