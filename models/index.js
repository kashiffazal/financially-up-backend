/**
 * Model Registry
 * ===============
 * Central file that imports all Sequelize models and exports them.
 * As new forms and subsystems are added, import their models here so they are registered with Sequelize.
 */

const sequelize = require("../config/database");

// ============================
// RBAC & User Management Models
// ============================
const User = require("./User");
const Role = require("./Role");
const Permission = require("./Permission");
const UserRole = require("./UserRole");
const RolePermission = require("./RolePermission");
const Session = require("./Session");
const AuditLog = require("./AuditLog");

// ============================
// Legacy Models (Preserved)
// ============================
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
// New Individual Engagement Models
// ============================
const NewIndividualClient = require("./NewIndividualClient");
const NewIndividualEngagement = require("./NewIndividualEngagement");
const NewIndividualService = require("./NewIndividualService");
const NewIndividualIdentity = require("./NewIndividualIdentity");
const NewIndividualDocument = require("./NewIndividualDocument");
const NewIndividualConsent = require("./NewIndividualConsent");
const NewIndividualSignature = require("./NewIndividualSignature");
const NewIndividualAuditLog = require("./NewIndividualAuditLog");
const NewIndividualPdf = require("./NewIndividualPdf");
const NewIndividualLodgment = require("./NewIndividualLodgment");
const NewIndividualLodgmentDeclaration = require("./NewIndividualLodgmentDeclaration");
const NewIndividualAdminReview = require("./NewIndividualAdminReview");

// ============================
// New Company Registration Models
// ============================
const NewCompanyRegistration = require("./NewCompanyRegistration");
const NewCompanyOfficeholder = require("./NewCompanyOfficeholder");
const NewCompanyShareholder = require("./NewCompanyShareholder");
const NewCompanyBeneficialOwner = require("./NewCompanyBeneficialOwner");
const NewCompanyConsent = require("./NewCompanyConsent");
const NewCompanyDocument = require("./NewCompanyDocument");
const NewCompanyAdminReview = require("./NewCompanyAdminReview");
const NewCompanyPdf = require("./NewCompanyPdf");
const NewCompanyAuditLog = require("./NewCompanyAuditLog");

// ============================
// RBAC & User Associations
// ============================

// User <-> Role (Many-to-Many via UserRole)
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "userId",
  otherKey: "roleId",
  as: "roles",
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "roleId",
  otherKey: "userId",
  as: "users",
});

User.hasMany(UserRole, { foreignKey: "userId", as: "userRoles" });
UserRole.belongsTo(User, { foreignKey: "userId", as: "user" });

Role.hasMany(UserRole, { foreignKey: "roleId", as: "userRoles" });
UserRole.belongsTo(Role, { foreignKey: "roleId", as: "role" });

// Role <-> Permission (Many-to-Many via RolePermission)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
  otherKey: "permissionId",
  as: "permissions",
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
  otherKey: "roleId",
  as: "roles",
});

Role.hasMany(RolePermission, { foreignKey: "roleId", as: "rolePermissions" });
RolePermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });

Permission.hasMany(RolePermission, { foreignKey: "permissionId", as: "rolePermissions" });
RolePermission.belongsTo(Permission, { foreignKey: "permissionId", as: "permission" });

// User <-> Session (One-to-Many)
User.hasMany(Session, { foreignKey: "userId", as: "sessions" });
Session.belongsTo(User, { foreignKey: "userId", as: "user" });

// User <-> AuditLog (One-to-Many for actor and target)
User.hasMany(AuditLog, { foreignKey: "actorUserId", as: "actorAuditLogs" });
User.hasMany(AuditLog, { foreignKey: "targetUserId", as: "targetAuditLogs" });
AuditLog.belongsTo(User, { foreignKey: "actorUserId", as: "actor" });
AuditLog.belongsTo(User, { foreignKey: "targetUserId", as: "target" });

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

NewIndividualEngagement.hasMany(NewIndividualLodgment, { foreignKey: "engagementId", as: "lodgments" });
NewIndividualLodgment.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

NewIndividualLodgment.hasOne(NewIndividualLodgmentDeclaration, { foreignKey: "lodgmentId", as: "declaration" });
NewIndividualLodgmentDeclaration.belongsTo(NewIndividualLodgment, { foreignKey: "lodgmentId" });

NewIndividualEngagement.hasOne(NewIndividualAdminReview, { foreignKey: "engagementId", as: "adminReview" });
NewIndividualAdminReview.belongsTo(NewIndividualEngagement, { foreignKey: "engagementId" });

// ============================
// New Company Registration Associations
// ============================
NewCompanyRegistration.hasMany(NewCompanyOfficeholder, { foreignKey: "registrationId", as: "officeholders" });
NewCompanyOfficeholder.belongsTo(NewCompanyRegistration, { foreignKey: "registrationId" });

NewCompanyRegistration.hasMany(NewCompanyShareholder, { foreignKey: "registrationId", as: "shareholders" });
NewCompanyShareholder.belongsTo(NewCompanyRegistration, { foreignKey: "registrationId" });

NewCompanyRegistration.hasMany(NewCompanyBeneficialOwner, { foreignKey: "registrationId", as: "beneficialOwners" });
NewCompanyBeneficialOwner.belongsTo(NewCompanyRegistration, { foreignKey: "registrationId" });

NewCompanyRegistration.hasMany(NewCompanyConsent, { foreignKey: "registrationId", as: "consents" });
NewCompanyConsent.belongsTo(NewCompanyRegistration, { foreignKey: "registrationId" });

NewCompanyRegistration.hasMany(NewCompanyDocument, { foreignKey: "registrationId", as: "documents" });
NewCompanyDocument.belongsTo(NewCompanyRegistration, { foreignKey: "registrationId" });

NewCompanyRegistration.hasOne(NewCompanyAdminReview, { foreignKey: "registrationId", as: "adminReview" });
NewCompanyAdminReview.belongsTo(NewCompanyRegistration, { foreignKey: "registrationId" });

NewCompanyRegistration.hasMany(NewCompanyPdf, { foreignKey: "registrationId", as: "pdfs" });
NewCompanyPdf.belongsTo(NewCompanyRegistration, { foreignKey: "registrationId" });

NewCompanyRegistration.hasMany(NewCompanyAuditLog, { foreignKey: "registrationId", as: "auditLogs" });
NewCompanyAuditLog.belongsTo(NewCompanyRegistration, { foreignKey: "registrationId" });

// Export all models and the sequelize instance
module.exports = {
  sequelize,
  // RBAC & Auth
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Session,
  AuditLog,
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
  NewIndividualLodgment,
  NewIndividualLodgmentDeclaration,
  NewIndividualAdminReview,
  // New Company Registration
  NewCompanyRegistration,
  NewCompanyOfficeholder,
  NewCompanyShareholder,
  NewCompanyBeneficialOwner,
  NewCompanyConsent,
  NewCompanyDocument,
  NewCompanyAdminReview,
  NewCompanyPdf,
  NewCompanyAuditLog,
};
