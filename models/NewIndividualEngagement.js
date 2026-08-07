/**
 * NewIndividualEngagement Model
 * =============================
 * Sequelize model for 'new_individual_engagements' master table.
 * Stores master engagement record, taxpayer residency, family, tax profile,
 * sole trader business, bank details, risk ratings, and PDF document paths.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewIndividualEngagement = sequelize.define("new_individual_engagements", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  referenceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM("Pending Review", "Accepted", "Conditional Accept", "Request Information", "Declined"),
    allowNull: false,
    defaultValue: "Pending Review",
  },
  entityService: {
    type: DataTypes.STRING(10), // "No", "Yes", "Unsure"
    allowNull: true,
  },
  isAustralianCitizen: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  taxResidency: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  hasPreviousName: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  previousNames: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  postalAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  citizenshipCountry: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  visaStatus: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  visaSubclass: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  visaExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  arrivalDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  residentArrival: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  residentDeparture: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  foreignCountry: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  foreignInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hasSpouse: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  spouseName: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  spouseDob: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  spouseIncome: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  prepareSpouseReturn: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  hasDependants: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  dependantCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  hadPreviousAccountant: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  previousFirm: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  reasonForChange: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  authorisePreviousAdvisor: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  atoIssues: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  atoExplanation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  noticeDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  // Sole Trader BAS / ABN / GST
  existingAbn: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  abnStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  basPeriod: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  reportingFrequency: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  gstStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  overdueBas: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  recordsComplete: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  recordsMaintainedBy: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  hasPayroll: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  businessStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  businessActivity: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  businessLocation: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  expectedTurnover: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  profitExpectation: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  hasEmployees: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  registerGST: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  registerPAYG: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  gstAbn: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  gstEffectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gstTurnover: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  accountingMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  fuelTaxCredits: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  imports: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  exports: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  digitalSales: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  // Representative & Bank
  isSelf: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  repName: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  relationship: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  authorityDesc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  needBank: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  accountName: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  bsb: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  accountNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  confirmOwnership: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  // Risk & Audit
  riskLevel: {
    type: DataTypes.ENUM("Low", "Medium", "High", "Unacceptable"),
    allowNull: true,
    defaultValue: "Low",
  },
  riskNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  clientPdfPath: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  adminPdfPath: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  acceptancePdfPath: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  auditPdfPath: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = NewIndividualEngagement;
