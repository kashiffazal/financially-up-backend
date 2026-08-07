/**
 * Model Registry
 * ===============
 * Central file that imports all Sequelize models and exports them.
 * As new forms are added, import their models here so they are registered with Sequelize.
 */

const sequelize = require("../config/database");

// Legacy models (preserved)
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

// New Individual Engagement Models
const NewIndividualClient = require("./NewIndividualClient");
const NewIndividualEngagement = require("./NewIndividualEngagement");
const NewIndividualService = require("./NewIndividualService");
const NewIndividualIdentity = require("./NewIndividualIdentity");
const NewIndividualDocument = require("./NewIndividualDocument");
const NewIndividualConsent = require("./NewIndividualConsent");
const NewIndividualSignature = require("./NewIndividualSignature");
const NewIndividualAuditLog = require("./NewIndividualAuditLog");
const NewIndividualPdf = require("./NewIndividualPdf");

// ============================
// Define New Model Associations
// ============================
NewIndividualClient.hasMany(NewIndividualEngagement, { foreignKey: "clientId", as: "engagements" });
NewIndividualEngagement.belongsTo(NewIndividualClient, { foreignKey: "clientId", as: "client" });

NewIndividualEngagement.hasMany(NewIndividualService, { foreignKey: "engagementId", as: "services" });
NewIndividualService.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

NewIndividualEngagement.hasOne(NewIndividualIdentity, { foreignKey: "engagementId", as: "identity" });
NewIndividualIdentity.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

NewIndividualEngagement.hasMany(NewIndividualDocument, { foreignKey: "engagementId", as: "documents" });
NewIndividualDocument.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

NewIndividualEngagement.hasMany(NewIndividualConsent, { foreignKey: "engagementId", as: "consents" });
NewIndividualConsent.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

NewIndividualEngagement.hasMany(NewIndividualSignature, { foreignKey: "engagementId", as: "signatures" });
NewIndividualSignature.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

NewIndividualEngagement.hasMany(NewIndividualAuditLog, { foreignKey: "engagementId", as: "auditLogs" });
NewIndividualAuditLog.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

NewIndividualEngagement.hasMany(NewIndividualPdf, { foreignKey: "engagementId", as: "pdfs" });
NewIndividualPdf.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

// Export all models and the sequelize instance
module.exports = {
  sequelize,
  // Legacy
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
  // New Individual Engagement
  NewIndividualClient,
  NewIndividualEngagement,
  NewIndividualService,
  NewIndividualIdentity,
  NewIndividualDocument,
  NewIndividualConsent,
  NewIndividualSignature,
  NewIndividualAuditLog,
  NewIndividualPdf,
};
