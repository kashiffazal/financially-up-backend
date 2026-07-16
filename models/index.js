/**
 * Model Registry
 * ===============
 * Central file that imports all Sequelize models and exports them.
 * As new forms are added (Entity Engagement, Medicare, etc.),
 * import their models here so they are all registered with Sequelize.
 *
 * This file also runs any model associations (relationships) if needed.
 */

const sequelize = require("../config/database");

// Import all models
const IndividualEngagement = require("./IndividualEngagement");
const ApplyTfnAbns = require("./ApplyTfnAbns");
const GstRegistration = require("./GstRegistration");
const BusinessNameRegistration = require("./BusinessNameRegistration");
const Medicare = require("./Medicare");
const TrustRegistration = require("./TrustRegistration");
const EntityEngagement = require("./EntityEngagement");
const ChangesToCompanyDetails = require("./ChangesToCompanyDetails");
const SmsfRegistration = require("./SmsfRegistration");
const CompanyRegistration = require("./CompanyRegistration");

// ============================
// Define Associations (if any)
// ============================
// Example: IndividualEngagement.hasMany(Attachment);
// Add associations here as the project grows.

// Export all models and the sequelize instance
module.exports = {
  sequelize,
  IndividualEngagement,
  ApplyTfnAbns,
  GstRegistration,
  BusinessNameRegistration,
  Medicare,
  TrustRegistration,
  EntityEngagement,
  ChangesToCompanyDetails,
  SmsfRegistration,
  CompanyRegistration,
};
