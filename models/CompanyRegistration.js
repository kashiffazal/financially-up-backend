/**
 * Company Registration Model
 * ==========================
 * Sequelize model for the 'company_registrations' table.
 * Maps directly to the form fields from the old app's Company Registration form.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CompanyRegistration = sequelize.define("company_registrations", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // Basic Company Details
  companyName: { type: DataTypes.TEXT, allowNull: true },
  proposed_name: { type: DataTypes.TEXT, allowNull: true },
  type: { type: DataTypes.TEXT, allowNull: true },
  name_is_same: { type: DataTypes.TEXT, allowNull: true },
  name_ABN: { type: DataTypes.TEXT, allowNull: true },
  numberOfState: { type: DataTypes.TEXT, allowNull: true },
  email: { type: DataTypes.TEXT, allowNull: true },
  Confirm_email: { type: DataTypes.TEXT, allowNull: true },
  seo_marketing: { type: DataTypes.TEXT, allowNull: true },

  // Holding Company
  is_holding_has_Holding: { type: DataTypes.TEXT, allowNull: true },
  is_holding_name: { type: DataTypes.TEXT, allowNull: true },
  is_holding_acnOrArbnOrAbn: { type: DataTypes.TEXT, allowNull: true },
  is_holding_countryOfIncorporation: { type: DataTypes.TEXT, allowNull: true },

  // States & SMSF
  states: { type: DataTypes.TEXT, allowNull: true },
  smsf: { type: DataTypes.TEXT, allowNull: true },

  // ASIC
  asic_is_query: { type: DataTypes.TEXT, allowNull: true },
  asic_mobile: { type: DataTypes.TEXT, allowNull: true },
  asic_reserved: { type: DataTypes.TEXT, allowNull: true },
  isEntity: { type: DataTypes.TEXT, allowNull: true },

  // Applicant
  isFirst_name: { type: DataTypes.TEXT, allowNull: true },
  isMiddle_name: { type: DataTypes.TEXT, allowNull: true },
  isLast_name: { type: DataTypes.TEXT, allowNull: true },

  // Registered Address
  address_careOf: { type: DataTypes.TEXT, allowNull: true },
  address_unitLevel: { type: DataTypes.TEXT, allowNull: true },
  address_streetAddress: { type: DataTypes.TEXT, allowNull: true },
  address_suburb: { type: DataTypes.TEXT, allowNull: true },
  address_state: { type: DataTypes.TEXT, allowNull: true },
  address_postCode: { type: DataTypes.TEXT, allowNull: true },
  address_country: { type: DataTypes.TEXT, allowNull: true },
  isRegistered_address: { type: DataTypes.TEXT, allowNull: true },
  NameOf_Occupier: { type: DataTypes.TEXT, allowNull: true },

  // Principal Place
  isPrincpal_Place: { type: DataTypes.TEXT, allowNull: true },
  principalPlace_unitLevel: { type: DataTypes.TEXT, allowNull: true },
  principalPlace_streetAddress: { type: DataTypes.TEXT, allowNull: true },
  principalPlace_suburb: { type: DataTypes.TEXT, allowNull: true },
  principalPlace_state: { type: DataTypes.TEXT, allowNull: true },
  principalPlace_postCode: { type: DataTypes.TEXT, allowNull: true },
  principalPlace_country: { type: DataTypes.TEXT, allowNull: true },

  // Tables / Arrays
  shares: { type: DataTypes.JSON, allowNull: true },
  Individual_director: { type: DataTypes.TEXT, allowNull: true },
  Individual_Shareholder: { type: DataTypes.TEXT, allowNull: true },
  Company_Shareholder: { type: DataTypes.TEXT, allowNull: true },
  Directors: { type: DataTypes.JSON, allowNull: true },
  Shareholder: { type: DataTypes.JSON, allowNull: true },
  OtherCompany: { type: DataTypes.JSON, allowNull: true },
  DirectorsTable: { type: DataTypes.JSON, allowNull: true },
  ShareholdersTable: { type: DataTypes.JSON, allowNull: true },
  AttenderMeeting: { type: DataTypes.JSON, allowNull: true },
  Signer: { type: DataTypes.JSON, allowNull: true },

  // Other Company Details
  OtherCompany_First_name: { type: DataTypes.TEXT, allowNull: true },
  OtherCompany_last_name: { type: DataTypes.TEXT, allowNull: true },

  // Secretary
  SecretaryOfCompany: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_first_name: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_middle_name: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_last_name: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_dob: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_isBornAustralia: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_Cob: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_overseas_City: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_BornSuburb: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_state: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_Level: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_StreetNumber: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_Country_report: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_Suburb: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_state2: { type: DataTypes.TEXT, allowNull: true },
  SecretaryOfCompany_postal_code_2: { type: DataTypes.TEXT, allowNull: true },

  // Public Officer
  PublicOfficer: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_first_name: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_middle_name: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_last_name: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_dob: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_isBornAustralia: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_Cob: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_overseas_City: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_BornSuburb: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_state: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_Level: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_StreetNumber: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_Country_report: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_Suburb: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_state2: { type: DataTypes.TEXT, allowNull: true },
  PublicOfficer_postal_code_2: { type: DataTypes.TEXT, allowNull: true },

  // Queries
  queries: { type: DataTypes.TEXT, allowNull: true },
  queries_first_name: { type: DataTypes.TEXT, allowNull: true },
  queries_middle_name: { type: DataTypes.TEXT, allowNull: true },
  queries_last_name: { type: DataTypes.TEXT, allowNull: true },
  queries_dob: { type: DataTypes.TEXT, allowNull: true },
  queries_isBornAustralia: { type: DataTypes.TEXT, allowNull: true },
  queries_Cob: { type: DataTypes.TEXT, allowNull: true },
  queries_overseas_City: { type: DataTypes.TEXT, allowNull: true },
  queries_BornSuburb: { type: DataTypes.TEXT, allowNull: true },
  queries_state: { type: DataTypes.TEXT, allowNull: true },
  queries_Level: { type: DataTypes.TEXT, allowNull: true },
  queries_StreetNumber: { type: DataTypes.TEXT, allowNull: true },
  queries_Country_report: { type: DataTypes.TEXT, allowNull: true },
  queries_Suburb: { type: DataTypes.TEXT, allowNull: true },
  queries_state2: { type: DataTypes.TEXT, allowNull: true },
  queries_postal_code_2: { type: DataTypes.TEXT, allowNull: true },

  // Meeting
  place: { type: DataTypes.TEXT, allowNull: true },
  DateOfMeeting: { type: DataTypes.TEXT, allowNull: true },
  timeInput: { type: DataTypes.TEXT, allowNull: true },
  Chair_the_Meeting: { type: DataTypes.TEXT, allowNull: true },
  resolutionCirculated: { type: DataTypes.TEXT, allowNull: true },

  // Additional Registrations
  registerABN: { type: DataTypes.TEXT, allowNull: true },
  registerTFN: { type: DataTypes.TEXT, allowNull: true },
  GoodsServicesTaxGST: { type: DataTypes.TEXT, allowNull: true }, // mapped from boolean to TEXT/tinyint
  turnover_of_trust: { type: DataTypes.TEXT, allowNull: true },
  Quarterly: { type: DataTypes.TEXT, allowNull: true },
  CashAccruals: { type: DataTypes.TEXT, allowNull: true },
  YesNo: { type: DataTypes.TEXT, allowNull: true },

  // Trademark & Legal
  Trademark_Register: { type: DataTypes.TEXT, allowNull: true },
  Legal_Advice: { type: DataTypes.TEXT, allowNull: true },
  Legal_Advice_Price: { type: DataTypes.TEXT, allowNull: true },

  // Delivery
  Printing_Binding: { type: DataTypes.TEXT, allowNull: true },
  Delivery_Level: { type: DataTypes.TEXT, allowNull: true },
  Delivery_StreetNumber: { type: DataTypes.TEXT, allowNull: true },
  Delivery_Country_report: { type: DataTypes.TEXT, allowNull: true },
  Delivery_Suburb: { type: DataTypes.TEXT, allowNull: true },
  Delivery_state: { type: DataTypes.TEXT, allowNull: true },
  Delivery_postal_code: { type: DataTypes.TEXT, allowNull: true },
  YesNoprinting: { type: DataTypes.TEXT, allowNull: true },
  instructions: { type: DataTypes.TEXT, allowNull: true },

  // Pricing
  totalExGST: { type: DataTypes.TEXT, allowNull: true },
  gst: { type: DataTypes.TEXT, allowNull: true },
  totalPaid: { type: DataTypes.TEXT, allowNull: true },

  // Workflow fields
  formType: { type: DataTypes.TEXT, allowNull: true },
  pdfUrl: { type: DataTypes.TEXT, allowNull: true },
  signature: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "New Query",
  },
  approvalNotes: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = CompanyRegistration;
