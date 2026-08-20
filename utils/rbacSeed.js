/**
 * RBAC Database Seeder
 * ====================
 * Automatically initializes developer-defined permissions, standard system roles,
 * and the primary administrator account on startup if they don't already exist.
 *
 * Password for the admin user is hashed using Argon2id.
 */

const { User, Role, Permission, UserRole, RolePermission } = require("../models");
const { hashPassword } = require("./password");

// Standard permission definitions across all Financially Up ERP modules
const SYSTEM_PERMISSIONS = [
  // User Management
  { module: "users", resource: "user", action: "view", slug: "users.view", name: "View Users", description: "View user accounts and profiles" },
  { module: "users", resource: "user", action: "create", slug: "users.create", name: "Create User", description: "Create new user accounts" },
  { module: "users", resource: "user", action: "edit", slug: "users.edit", name: "Edit User", description: "Modify user account details" },
  { module: "users", resource: "user", action: "disable", slug: "users.disable", name: "Disable/Enable User", description: "Activate, deactivate, or suspend users" },
  { module: "users", resource: "user", action: "reset_password", slug: "users.reset_password", name: "Reset User Password", description: "Trigger password reset for users" },
  { module: "users", resource: "user_role", action: "manage", slug: "users.roles.manage", name: "Manage User Roles", description: "Assign or remove roles from users" },
  { module: "users", resource: "activity", action: "view", slug: "users.activity.view", name: "View User Activity", description: "View individual user activity and audit trail" },
  { module: "users", resource: "session", action: "manage", slug: "users.sessions.manage", name: "Manage User Sessions", description: "View and revoke user login sessions" },

  // Role Management
  { module: "roles", resource: "role", action: "view", slug: "roles.view", name: "View Roles", description: "View available roles and permission sets" },
  { module: "roles", resource: "role", action: "create", slug: "roles.create", name: "Create Role", description: "Create custom system roles" },
  { module: "roles", resource: "role", action: "edit", slug: "roles.edit", name: "Edit Role", description: "Modify role names and descriptions" },
  { module: "roles", resource: "role", action: "delete", slug: "roles.delete", name: "Delete Role", description: "Remove custom roles (system roles protected)" },
  { module: "roles", resource: "permission", action: "manage", slug: "roles.permissions.manage", name: "Manage Role Permissions", description: "Assign or modify permissions for roles" },

  // Security & Audit Logs
  { module: "audit", resource: "log", action: "view", slug: "audit.view", name: "View Audit Logs", description: "View immutable system-wide audit records" },
  { module: "audit", resource: "log", action: "export", slug: "audit.export", name: "Export Audit Logs", description: "Export audit records to CSV/Excel" },

  // GST Registration Module
  { module: "gst", resource: "registration", action: "view", slug: "gst.registration.view", name: "View GST Registrations", description: "View GST registration applications" },
  { module: "gst", resource: "registration", action: "create", slug: "gst.registration.create", name: "Create GST Registration", description: "Submit GST registration applications" },
  { module: "gst", resource: "registration", action: "edit", slug: "gst.registration.edit", name: "Edit GST Registration", description: "Modify GST registration applications" },
  { module: "gst", resource: "registration", action: "delete", slug: "gst.registration.delete", name: "Delete GST Registration", description: "Delete GST registration applications" },
  { module: "gst", resource: "registration", action: "review", slug: "gst.registration.review", name: "Review GST Registration", description: "Review and verify GST submissions" },
  { module: "gst", resource: "registration", action: "approve", slug: "gst.registration.approve", name: "Approve GST Registration", description: "Approve or reject GST submissions" },
  { module: "gst", resource: "registration", action: "export", slug: "gst.registration.export", name: "Export GST Registrations", description: "Export GST data to CSV/Excel" },

  // Company Registration Module
  { module: "company", resource: "registration", action: "view", slug: "company.registration.view", name: "View Company Registrations", description: "View company registration applications" },
  { module: "company", resource: "registration", action: "create", slug: "company.registration.create", name: "Create Company Registration", description: "Submit company registration applications" },
  { module: "company", resource: "registration", action: "edit", slug: "company.registration.edit", name: "Edit Company Registration", description: "Modify company registration applications" },
  { module: "company", resource: "registration", action: "delete", slug: "company.registration.delete", name: "Delete Company Registration", description: "Delete company registration applications" },
  { module: "company", resource: "registration", action: "review", slug: "company.registration.review", name: "Review Company Registration", description: "Review company registrations" },
  { module: "company", resource: "registration", action: "approve", slug: "company.registration.approve", name: "Approve Company Registration", description: "Approve or reject company registrations" },
  { module: "company", resource: "registration", action: "export", slug: "company.registration.export", name: "Export Company Registrations", description: "Export company registration data" },

  // Individual Engagement Module
  { module: "engagement", resource: "engagement", action: "view", slug: "engagement.view", name: "View Individual Engagements", description: "View individual tax engagement forms" },
  { module: "engagement", resource: "engagement", action: "create", slug: "engagement.create", name: "Create Individual Engagement", description: "Submit individual tax engagement forms" },
  { module: "engagement", resource: "engagement", action: "edit", slug: "engagement.edit", name: "Edit Individual Engagement", description: "Modify individual tax engagement forms" },
  { module: "engagement", resource: "engagement", action: "delete", slug: "engagement.delete", name: "Delete Individual Engagement", description: "Delete individual tax engagement forms" },
  { module: "engagement", resource: "engagement", action: "review", slug: "engagement.review", name: "Review Individual Engagement", description: "Review individual tax engagement forms" },
  { module: "engagement", resource: "engagement", action: "approve", slug: "engagement.approve", name: "Approve Individual Engagement", description: "Approve individual tax engagement forms" },
  { module: "engagement", resource: "engagement", action: "export", slug: "engagement.export", name: "Export Individual Engagements", description: "Export individual engagement data" },

  // TFN / ABN Applications
  { module: "tfn_abn", resource: "application", action: "view", slug: "tfn_abn.application.view", name: "View TFN/ABN Applications", description: "View TFN/ABN applications" },
  { module: "tfn_abn", resource: "application", action: "create", slug: "tfn_abn.application.create", name: "Create TFN/ABN Application", description: "Submit TFN/ABN applications" },
  { module: "tfn_abn", resource: "application", action: "edit", slug: "tfn_abn.application.edit", name: "Edit TFN/ABN Application", description: "Modify TFN/ABN applications" },
  { module: "tfn_abn", resource: "application", action: "delete", slug: "tfn_abn.application.delete", name: "Delete TFN/ABN Application", description: "Delete TFN/ABN applications" },
  { module: "tfn_abn", resource: "application", action: "review", slug: "tfn_abn.application.review", name: "Review TFN/ABN Application", description: "Review TFN/ABN applications" },
  { module: "tfn_abn", resource: "application", action: "approve", slug: "tfn_abn.application.approve", name: "Approve TFN/ABN Application", description: "Approve TFN/ABN applications" },

  // Business Name Registrations
  { module: "business_name", resource: "registration", action: "view", slug: "business_name.registration.view", name: "View Business Name Registrations", description: "View business name registrations" },
  { module: "business_name", resource: "registration", action: "create", slug: "business_name.registration.create", name: "Create Business Name Registration", description: "Submit business name registrations" },
  { module: "business_name", resource: "registration", action: "edit", slug: "business_name.registration.edit", name: "Edit Business Name Registration", description: "Modify business name registrations" },
  { module: "business_name", resource: "registration", action: "delete", slug: "business_name.registration.delete", name: "Delete Business Name Registration", description: "Delete business name registrations" },
  { module: "business_name", resource: "registration", action: "review", slug: "business_name.registration.review", name: "Review Business Name Registration", description: "Review business name registrations" },
  { module: "business_name", resource: "registration", action: "approve", slug: "business_name.registration.approve", name: "Approve Business Name Registration", description: "Approve business name registrations" },

  // Trust Registrations
  { module: "trust", resource: "registration", action: "view", slug: "trust.registration.view", name: "View Trust Registrations", description: "View trust registration applications" },
  { module: "trust", resource: "registration", action: "create", slug: "trust.registration.create", name: "Create Trust Registration", description: "Submit trust registration applications" },
  { module: "trust", resource: "registration", action: "edit", slug: "trust.registration.edit", name: "Edit Trust Registration", description: "Modify trust registration applications" },
  { module: "trust", resource: "registration", action: "delete", slug: "trust.registration.delete", name: "Delete Trust Registration", description: "Delete trust registration applications" },
  { module: "trust", resource: "registration", action: "review", slug: "trust.registration.review", name: "Review Trust Registration", description: "Review trust registrations" },
  { module: "trust", resource: "registration", action: "approve", slug: "trust.registration.approve", name: "Approve Trust Registration", description: "Approve trust registrations" },

  // SMSF Registrations
  { module: "smsf", resource: "registration", action: "view", slug: "smsf.registration.view", name: "View SMSF Registrations", description: "View SMSF registration applications" },
  { module: "smsf", resource: "registration", action: "create", slug: "smsf.registration.create", name: "Create SMSF Registration", description: "Submit SMSF registration applications" },
  { module: "smsf", resource: "registration", action: "edit", slug: "smsf.registration.edit", name: "Edit SMSF Registration", description: "Modify SMSF registration applications" },
  { module: "smsf", resource: "registration", action: "delete", slug: "smsf.registration.delete", name: "Delete SMSF Registration", description: "Delete SMSF registration applications" },
  { module: "smsf", resource: "registration", action: "review", slug: "smsf.registration.review", name: "Review SMSF Registration", description: "Review SMSF registrations" },
  { module: "smsf", resource: "registration", action: "approve", slug: "smsf.registration.approve", name: "Approve SMSF Registration", description: "Approve SMSF registrations" },

  // Medicare Claims
  { module: "medicare", resource: "claim", action: "view", slug: "medicare.claim.view", name: "View Medicare Claims", description: "View Medicare levy exemption claims" },
  { module: "medicare", resource: "claim", action: "create", slug: "medicare.claim.create", name: "Create Medicare Claim", description: "Submit Medicare levy exemption claims" },
  { module: "medicare", resource: "claim", action: "edit", slug: "medicare.claim.edit", name: "Edit Medicare Claim", description: "Modify Medicare levy exemption claims" },
  { module: "medicare", resource: "claim", action: "delete", slug: "medicare.claim.delete", name: "Delete Medicare Claim", description: "Delete Medicare claims" },
  { module: "medicare", resource: "claim", action: "review", slug: "medicare.claim.review", name: "Review Medicare Claim", description: "Review Medicare claims" },
  { module: "medicare", resource: "claim", action: "approve", slug: "medicare.claim.approve", name: "Approve Medicare Claim", description: "Approve Medicare claims" },

  // Company Details Changes
  { module: "changes_to_company", resource: "request", action: "view", slug: "changes_to_company.request.view", name: "View Company Changes", description: "View requests for changes to company details" },
  { module: "changes_to_company", resource: "request", action: "create", slug: "changes_to_company.request.create", name: "Create Company Changes", description: "Submit requests for changes to company details" },
  { module: "changes_to_company", resource: "request", action: "edit", slug: "changes_to_company.request.edit", name: "Edit Company Changes", description: "Modify requests for changes to company details" },
  { module: "changes_to_company", resource: "request", action: "delete", slug: "changes_to_company.request.delete", name: "Delete Company Changes", description: "Delete company change requests" },
  { module: "changes_to_company", resource: "request", action: "review", slug: "changes_to_company.request.review", name: "Review Company Changes", description: "Review company change requests" },
  { module: "changes_to_company", resource: "request", action: "approve", slug: "changes_to_company.request.approve", name: "Approve Company Changes", description: "Approve company change requests" },

  // Documents & PDFs
  { module: "documents", resource: "document", action: "view", slug: "documents.view", name: "View Documents", description: "View client and company uploaded files" },
  { module: "documents", resource: "document", action: "upload", slug: "documents.upload", name: "Upload Documents", description: "Upload documents to applications" },
  { module: "documents", resource: "document", action: "download", slug: "documents.download", name: "Download Documents", description: "Download documents" },
  { module: "documents", resource: "document", action: "delete", slug: "documents.delete", name: "Delete Documents", description: "Delete documents" },
  { module: "pdf", resource: "pdf", action: "view", slug: "pdf.view", name: "View Generated PDFs", description: "View generated summary and lodgment PDFs" },
  { module: "pdf", resource: "pdf", action: "generate", slug: "pdf.generate", name: "Generate PDFs", description: "Generate new PDF summaries" },
  { module: "pdf", resource: "pdf", action: "download", slug: "pdf.download", name: "Download PDFs", description: "Download generated PDF files" },
];

// Initial roles to seed
const SYSTEM_ROLES = [
  {
    name: "Administrator",
    slug: "administrator",
    description: "Full administrative access with all permissions and system configuration capabilities",
    isSystem: true,
    status: "Active",
  },
  {
    name: "Accountant",
    slug: "accountant",
    description: "Operational access to view, create, and manage client engagement and tax registration forms",
    isSystem: false,
    status: "Active",
  },
  {
    name: "Reviewer",
    slug: "reviewer",
    description: "Verification and quality assurance access to review and approve submitted lodgments",
    isSystem: false,
    status: "Active",
  },
  {
    name: "Viewer",
    slug: "viewer",
    description: "Read-only access across all Financially Up ERP records",
    isSystem: false,
    status: "Active",
  },
];

/**
 * Seed all RBAC permissions, roles, mappings, and initial administrator user.
 */
const seedRBAC = async () => {
  try {
    console.log("--> Starting RBAC initialization and seeding...");

    // 1. Seed or update permissions
    const permissionMap = new Map();
    for (const permData of SYSTEM_PERMISSIONS) {
      let [permission] = await Permission.findOrCreate({
        where: { slug: permData.slug },
        defaults: permData,
      });
      permissionMap.set(permData.slug, permission);
    }
    console.log(`--> Registered ${permissionMap.size} system permissions`);

    // 2. Seed system roles
    const roleMap = new Map();
    for (const roleData of SYSTEM_ROLES) {
      let [role] = await Role.findOrCreate({
        where: { slug: roleData.slug },
        defaults: roleData,
      });
      roleMap.set(roleData.slug, role);
    }
    console.log(`--> Registered ${roleMap.size} system roles`);

    // 3. Assign all permissions explicitly to Administrator role
    const adminRole = roleMap.get("administrator");
    if (adminRole) {
      for (const permission of permissionMap.values()) {
        await RolePermission.findOrCreate({
          where: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
          defaults: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    // 4. Assign standard permissions to Accountant role
    const accountantRole = roleMap.get("accountant");
    if (accountantRole) {
      const accountantPermSlugs = [
        "gst.registration.view", "gst.registration.create", "gst.registration.edit", "gst.registration.export",
        "company.registration.view", "company.registration.create", "company.registration.edit", "company.registration.export",
        "engagement.view", "engagement.create", "engagement.edit", "engagement.export",
        "tfn_abn.application.view", "tfn_abn.application.create", "tfn_abn.application.edit",
        "business_name.registration.view", "business_name.registration.create", "business_name.registration.edit",
        "trust.registration.view", "trust.registration.create", "trust.registration.edit",
        "smsf.registration.view", "smsf.registration.create", "smsf.registration.edit",
        "medicare.claim.view", "medicare.claim.create", "medicare.claim.edit",
        "changes_to_company.request.view", "changes_to_company.request.create", "changes_to_company.request.edit",
        "documents.view", "documents.upload", "documents.download",
        "pdf.view", "pdf.generate", "pdf.download",
      ];
      for (const slug of accountantPermSlugs) {
        const perm = permissionMap.get(slug);
        if (perm) {
          await RolePermission.findOrCreate({
            where: { roleId: accountantRole.id, permissionId: perm.id },
            defaults: { roleId: accountantRole.id, permissionId: perm.id },
          });
        }
      }
    }

    // 5. Assign review/approve permissions to Reviewer role
    const reviewerRole = roleMap.get("reviewer");
    if (reviewerRole) {
      const reviewerPermSlugs = [
        "gst.registration.view", "gst.registration.review", "gst.registration.approve", "gst.registration.export",
        "company.registration.view", "company.registration.review", "company.registration.approve", "company.registration.export",
        "engagement.view", "engagement.review", "engagement.approve", "engagement.export",
        "tfn_abn.application.view", "tfn_abn.application.review", "tfn_abn.application.approve",
        "business_name.registration.view", "business_name.registration.review", "business_name.registration.approve",
        "trust.registration.view", "trust.registration.review", "trust.registration.approve",
        "smsf.registration.view", "smsf.registration.review", "smsf.registration.approve",
        "medicare.claim.view", "medicare.claim.review", "medicare.claim.approve",
        "changes_to_company.request.view", "changes_to_company.request.review", "changes_to_company.request.approve",
        "documents.view", "documents.download",
        "pdf.view", "pdf.download",
        "audit.view",
      ];
      for (const slug of reviewerPermSlugs) {
        const perm = permissionMap.get(slug);
        if (perm) {
          await RolePermission.findOrCreate({
            where: { roleId: reviewerRole.id, permissionId: perm.id },
            defaults: { roleId: reviewerRole.id, permissionId: perm.id },
          });
        }
      }
    }

    // 6. Assign view-only permissions to Viewer role
    const viewerRole = roleMap.get("viewer");
    if (viewerRole) {
      for (const [slug, perm] of permissionMap.entries()) {
        if (slug.endsWith(".view")) {
          await RolePermission.findOrCreate({
            where: { roleId: viewerRole.id, permissionId: perm.id },
            defaults: { roleId: viewerRole.id, permissionId: perm.id },
          });
        }
      }
    }

    // 7. Seed Initial Administrator Account if no administrators exist
    const defaultAdminEmail = "admin@financiallyup.com.au";
    let adminUser = await User.findOne({ where: { email: defaultAdminEmail } });

    if (!adminUser) {
      // Check if any active user exists with the administrator role
      const existingAdminCount = await UserRole.count({ where: { roleId: adminRole.id } });
      if (existingAdminCount === 0) {
        const passwordHash = await hashPassword("123456");
        adminUser = await User.create({
          email: defaultAdminEmail,
          passwordHash: passwordHash,
          firstName: "Kashif",
          lastName: "Fazal",
          phone: "+61 400 000 000",
          department: "Taxation & Advisory",
          jobTitle: "Practice Administrator",
          bio: "Senior Tax Agent and Practice Administrator for Financially Up.",
          status: "Active",
          emailVerifiedAt: new Date(),
        });
        console.log(`--> Created initial Administrator account: ${defaultAdminEmail}`);
      }
    }

    // Ensure admin user is linked to the Administrator role
    if (adminUser && adminRole) {
      await UserRole.findOrCreate({
        where: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
        defaults: {
          userId: adminUser.id,
          roleId: adminRole.id,
          assignedBy: adminUser.id,
        },
      });
    }

    console.log("--> RBAC initialization completed successfully.");
  } catch (error) {
    console.error("RBAC Seeder Error:", error);
  }
};

module.exports = {
  seedRBAC,
  SYSTEM_PERMISSIONS,
  SYSTEM_ROLES,
};
