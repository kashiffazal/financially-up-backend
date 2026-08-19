/**
 * NewCompanyRegistration Model
 * ============================
 * Sequelize model for 'new_company_registrations' master table.
 * Stores the complete 12-step Australian Company Registration form data,
 * including versioned Terms of Engagement and Privacy Notice audit fields.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewCompanyRegistration = sequelize.define("new_company_registrations", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },

  /* ─── Reference & Status ─── */
  referenceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM(
      "Draft",
      "Submitted",
      "Under Review",
      "Pending Documents",
      "Approved",
      "Approved With Conditions",
      "Declined",
      "On Hold",
      "Lodged with ASIC"
    ),
    allowNull: false,
    defaultValue: "Submitted",
  },

  /* ─── Terms of Engagement - Versioned Audit Fields ─── */
  terms_version: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: "Version of Terms of Engagement accepted, e.g. v1.0",
  },
  terms_accepted: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  terms_accepted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  terms_accepted_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Client legal name or email who accepted the terms",
  },
  terms_acceptance_method: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: "Electronic Checkbox / Form Submission",
  },

  /* ─── Privacy Collection Notice - Versioned Audit Fields ─── */
  privacy_notice_version: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: "Version of Privacy Collection Notice acknowledged, e.g. v1.0",
  },
  privacy_notice_acknowledged: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  privacy_notice_acknowledged_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  privacy_notice_acknowledged_by: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Client legal name or email who acknowledged the notice",
  },

  /* ─── Step 1: Contact & Service Selection ─── */
  contactName: { type: DataTypes.STRING(255), allowNull: true },
  contactEmail: { type: DataTypes.STRING(255), allowNull: true },
  contactMobile: { type: DataTypes.STRING(50), allowNull: true },
  contactRelationship: { type: DataTypes.STRING(100), allowNull: true },
  otherRelationshipDetail: { type: DataTypes.TEXT, allowNull: true },
  authorityDescription: { type: DataTypes.TEXT, allowNull: true },
  primaryService: { type: DataTypes.STRING(255), allowNull: true },
  dateServiceRequested: { type: DataTypes.DATEONLY, allowNull: true },
  additionalServices: { type: DataTypes.JSON, allowNull: true, comment: "Array of additional requested services" },
  isUrgent: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  urgencyExplanation: { type: DataTypes.TEXT, allowNull: true },
  previousRefusal: { type: DataTypes.STRING(10), allowNull: true },
  previousRefusalDetails: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Step 2: Company Details ─── */
  companyName1: { type: DataTypes.STRING(255), allowNull: true },
  companyName2: { type: DataTypes.STRING(255), allowNull: true },
  companyName3: { type: DataTypes.STRING(255), allowNull: true },
  useAcnAsName: { type: DataTypes.BOOLEAN, allowNull: true },
  isNameReserved: { type: DataTypes.STRING(10), allowNull: true },
  reservationNumber: { type: DataTypes.STRING(100), allowNull: true },
  reservationDate: { type: DataTypes.DATEONLY, allowNull: true },
  reservationApplicant: { type: DataTypes.STRING(255), allowNull: true },
  companyType: { type: DataTypes.STRING(100), allowNull: true },
  specialPurposeDetail: { type: DataTypes.TEXT, allowNull: true },
  jurisdictionState: { type: DataTypes.STRING(50), allowNull: true },
  companyPurpose: { type: DataTypes.STRING(255), allowNull: true },
  otherPurposeDetail: { type: DataTypes.TEXT, allowNull: true },
  mainBusinessActivity: { type: DataTypes.STRING(255), allowNull: true },
  anzsicDescription: { type: DataTypes.TEXT, allowNull: true },
  tradingNameChoice: { type: DataTypes.STRING(100), allowNull: true },
  proposedBusinessName: { type: DataTypes.STRING(255), allowNull: true },
  commencementDate: { type: DataTypes.DATEONLY, allowNull: true },
  isPartOfGroup: { type: DataTypes.STRING(10), allowNull: true },
  groupDescription: { type: DataTypes.TEXT, allowNull: true },
  ultimateHoldingName: { type: DataTypes.STRING(255), allowNull: true },
  ultimateHoldingAcn: { type: DataTypes.STRING(50), allowNull: true },
  ultimateHoldingCountry: { type: DataTypes.STRING(100), allowNull: true },
  governanceDocument: { type: DataTypes.STRING(255), allowNull: true },
  specialInstructions: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Step 3: Addresses & Address Service ─── */
  regOfficeHouseNumber: { type: DataTypes.STRING(50), allowNull: true },
  regOfficeStreet: { type: DataTypes.STRING(255), allowNull: true },
  regOfficeSuburb: { type: DataTypes.STRING(100), allowNull: true },
  regOfficePostcode: { type: DataTypes.STRING(20), allowNull: true },
  regOfficeState: { type: DataTypes.STRING(50), allowNull: true },
  companyOccupiesRegisteredOffice: { type: DataTypes.STRING(10), allowNull: true },
  occupierName: { type: DataTypes.STRING(255), allowNull: true },
  samePrincipalAddress: { type: DataTypes.STRING(10), allowNull: true },
  ppobHouseNumber: { type: DataTypes.STRING(50), allowNull: true },
  ppobStreet: { type: DataTypes.STRING(255), allowNull: true },
  ppobSuburb: { type: DataTypes.STRING(100), allowNull: true },
  ppobPostcode: { type: DataTypes.STRING(20), allowNull: true },
  ppobState: { type: DataTypes.STRING(50), allowNull: true },
  provideRegisteredOfficeAddress: { type: DataTypes.BOOLEAN, allowNull: true },
  providePrincipalPlaceAddress: { type: DataTypes.BOOLEAN, allowNull: true },
  addressServiceCommercialReason: { type: DataTypes.TEXT, allowNull: true },
  authorisedRecipientName: { type: DataTypes.STRING(255), allowNull: true },
  authorisedRecipientEmail: { type: DataTypes.STRING(255), allowNull: true },
  authorisedRecipientPhone: { type: DataTypes.STRING(50), allowNull: true },
  addressServiceAccepted: { type: DataTypes.BOOLEAN, allowNull: true, comment: "Accepted Address Service Terms" },

  /* ─── Step 7: AML/CTF CDD Questions ─── */
  cddQ1: { type: DataTypes.STRING(20), allowNull: true },
  cddQ1Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ2: { type: DataTypes.STRING(20), allowNull: true },
  cddQ2Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ3: { type: DataTypes.STRING(20), allowNull: true },
  cddQ3Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ4: { type: DataTypes.STRING(20), allowNull: true },
  cddQ4Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ5: { type: DataTypes.STRING(20), allowNull: true },
  cddQ5Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ6: { type: DataTypes.STRING(20), allowNull: true },
  cddQ6Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ7: { type: DataTypes.STRING(20), allowNull: true },
  cddQ7Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ8: { type: DataTypes.STRING(20), allowNull: true },
  cddQ8Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ9: { type: DataTypes.STRING(20), allowNull: true },
  cddQ9Detail: { type: DataTypes.TEXT, allowNull: true },
  cddQ10: { type: DataTypes.STRING(20), allowNull: true },
  cddQ10Detail: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Step 8: Source of Funds / Source of Wealth ─── */
  initialCapitalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  initialCapitalPaidBy: { type: DataTypes.STRING(255), allowNull: true },
  initialCapitalSource: { type: DataTypes.STRING(255), allowNull: true },
  first12MonthsFundingAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  first12MonthsFundingSource: { type: DataTypes.STRING(255), allowNull: true },
  first12MonthsFunderName: { type: DataTypes.STRING(255), allowNull: true },
  first12MonthsOriginBank: { type: DataTypes.STRING(255), allowNull: true },
  sourceOfWealthSummary: { type: DataTypes.TEXT, allowNull: true },
  hasOffshoreFunding: { type: DataTypes.STRING(10), allowNull: true },
  offshoreCountries: { type: DataTypes.TEXT, allowNull: true },
  offshoreBanks: { type: DataTypes.TEXT, allowNull: true },
  offshoreExplanation: { type: DataTypes.TEXT, allowNull: true },
  hasCashOver10k: { type: DataTypes.STRING(10), allowNull: true },
  cashAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  cashPayer: { type: DataTypes.STRING(255), allowNull: true },
  cashReason: { type: DataTypes.TEXT, allowNull: true },

  /* ─── Step 9: Nominee / Trustee Arrangements ─── */
  isDirectorActingForOthers: { type: DataTypes.STRING(10), allowNull: true },
  directorNominatorName: { type: DataTypes.STRING(255), allowNull: true },
  isNomineeShareholder: { type: DataTypes.STRING(10), allowNull: true },
  nomineeNominator: { type: DataTypes.STRING(255), allowNull: true },
  nomineeBeneficialOwner: { type: DataTypes.STRING(255), allowNull: true },
  isTrusteeInvolved: { type: DataTypes.STRING(10), allowNull: true },
  trustName: { type: DataTypes.STRING(255), allowNull: true },
  trustSettlor: { type: DataTypes.STRING(255), allowNull: true },
  hasLegalAdvice: { type: DataTypes.STRING(10), allowNull: true },
  legalAdviserName: { type: DataTypes.STRING(255), allowNull: true },
  legalAdviceSummary: { type: DataTypes.TEXT, allowNull: true },
  nomineeArrangementAccepted: { type: DataTypes.BOOLEAN, allowNull: true, comment: "Accepted Nominee/Trustee Arrangement Terms" },

  /* ─── Step 10: Optional Tax Services ─── */
  abnTfnRequired: { type: DataTypes.STRING(10), allowNull: true },
  gstRegistrationRequired: { type: DataTypes.STRING(10), allowNull: true },
  expectedTurnover: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
  paygWithholdingRequired: { type: DataTypes.STRING(10), allowNull: true },
  businessNameRegistrationRequired: { type: DataTypes.STRING(10), allowNull: true },
  proposedTaxBusinessName: { type: DataTypes.STRING(255), allowNull: true },
  bankAccountAssistance: { type: DataTypes.STRING(10), allowNull: true },
  accountingSoftware: { type: DataTypes.STRING(100), allowNull: true },
  otherAccountingSoftware: { type: DataTypes.STRING(255), allowNull: true },
  registeredAgentSupport: { type: DataTypes.STRING(10), allowNull: true },

  /* ─── Step 12: Statutory Declarations & Execution ─── */
  declaration1: { type: DataTypes.BOOLEAN, allowNull: true },
  declaration2: { type: DataTypes.BOOLEAN, allowNull: true },
  declaration3: { type: DataTypes.BOOLEAN, allowNull: true },
  declaration4: { type: DataTypes.BOOLEAN, allowNull: true },
  declaration5: { type: DataTypes.BOOLEAN, allowNull: true },
  declaration6: { type: DataTypes.BOOLEAN, allowNull: true },
  signatory1Name: { type: DataTypes.STRING(255), allowNull: true },
  signatory1Capacity: { type: DataTypes.STRING(100), allowNull: true },
  signatory1Date: { type: DataTypes.DATEONLY, allowNull: true },
  signatory1Signature: { type: DataTypes.TEXT("long"), allowNull: true, comment: "Base64 or file path for Signatory 1" },
  signatory2Name: { type: DataTypes.STRING(255), allowNull: true },
  signatory2Capacity: { type: DataTypes.STRING(100), allowNull: true },
  signatory2Date: { type: DataTypes.DATEONLY, allowNull: true },
  signatory2Signature: { type: DataTypes.TEXT("long"), allowNull: true, comment: "Base64 or file path for Signatory 2" },

  /* ─── Audit & Snapshot ─── */
  submittedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  ipAddress: { type: DataTypes.STRING(50), allowNull: true },
  userAgent: { type: DataTypes.TEXT, allowNull: true },
  applicationSnapshot: { type: DataTypes.JSON, allowNull: true, comment: "Complete JSON snapshot at submission time" },

  /* ─── PDF Quick-Access Paths ─── */
  clientPdfPath: { type: DataTypes.TEXT, allowNull: true },
  adminPdfPath: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = NewCompanyRegistration;
