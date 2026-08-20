/**
 * RBAC Database Seeder
 * ====================
 * Seeds initial system permissions, default roles (Administrator, Practice Manager,
 * Senior Accountant, Staff Member), maps initial permission matrix, and provisions
 * the primary Administrator user:
 * Email: admin@financiallyup.com.au
 * Password: <bcrypt-hashed 123456>
 */

require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development",
});

const { hashPassword } = require("../utils/password");
const {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
} = require("../models");

// 1. Master Permissions Catalog
const DEFAULT_PERMISSIONS = [
  // User Management
  { module: "users", resource: "users", action: "view", name: "View Users", slug: "users.view", description: "View staff list and profiles" },
  { module: "users", resource: "users", action: "create", name: "Create Users", slug: "users.create", description: "Invite or create new staff users" },
  { module: "users", resource: "users", action: "edit", name: "Edit Users", slug: "users.edit", description: "Modify user profile, details, status" },
  { module: "users", resource: "users", action: "delete", name: "Delete Users", slug: "users.delete", description: "Deactivate or delete users" },
  { module: "users", resource: "roles", action: "assign", name: "Assign Roles", slug: "users.roles.assign", description: "Assign or modify roles of users" },

  // Role & Permissions
  { module: "roles", resource: "roles", action: "view", name: "View Roles", slug: "roles.view", description: "View roles and permission matrices" },
  { module: "roles", resource: "roles", action: "create", name: "Create Roles", slug: "roles.create", description: "Create custom practice roles" },
  { module: "roles", resource: "roles", action: "edit", name: "Edit Roles", slug: "roles.edit", description: "Modify custom roles and assign permissions" },
  { module: "roles", resource: "roles", action: "delete", name: "Delete Roles", slug: "roles.delete", description: "Delete custom practice roles" },

  // Audit Logs
  { module: "audit", resource: "audit_logs", action: "view", name: "View Audit Logs", slug: "audit.view", description: "Inspect system audit trail and history" },
  { module: "audit", resource: "audit_logs", action: "export", name: "Export Audit Logs", slug: "audit.export", description: "Export security logs to CSV / JSON" },

  // Operational Modules
  { module: "medicare", resource: "medicare", action: "view", name: "View Medicare", slug: "medicare.view", description: "View Medicare form submissions" },
  { module: "medicare", resource: "medicare", action: "edit", name: "Edit Medicare", slug: "medicare.edit", description: "Process & edit Medicare forms" },
  { module: "medicare", resource: "medicare", action: "delete", name: "Delete Medicare", slug: "medicare.delete", description: "Delete Medicare form submissions" },

  { module: "gst", resource: "gst_registrations", action: "view", name: "View GST Registrations", slug: "gst.registration.view", description: "View GST registrations" },
  { module: "gst", resource: "gst_registrations", action: "edit", name: "Edit GST Registrations", slug: "gst.registration.edit", description: "Process GST applications" },
  { module: "gst", resource: "gst_registrations", action: "delete", name: "Delete GST Registrations", slug: "gst.registration.delete", description: "Delete GST registrations" },

  { module: "company", resource: "company_registrations", action: "view", name: "View Company Registrations", slug: "company.registration.view", description: "View company registrations" },
  { module: "company", resource: "company_registrations", action: "edit", name: "Edit Company Registrations", slug: "company.registration.edit", description: "Process company registrations" },
  { module: "company", resource: "company_registrations", action: "delete", name: "Delete Company Registrations", slug: "company.registration.delete", description: "Delete company registrations" },

  { module: "company", resource: "company_changes", action: "view", name: "View Company Detail Changes", slug: "company.changes.view", description: "View company detail changes" },
  { module: "company", resource: "company_changes", action: "edit", name: "Edit Company Detail Changes", slug: "company.changes.edit", description: "Process company detail changes" },

  { module: "trust", resource: "trust_registrations", action: "view", name: "View Trust Registrations", slug: "trust.registration.view", description: "View trust registrations" },
  { module: "trust", resource: "trust_registrations", action: "edit", name: "Edit Trust Registrations", slug: "trust.registration.edit", description: "Process trust registrations" },

  { module: "smsf", resource: "smsf_registrations", action: "view", name: "View SMSF Registrations", slug: "smsf.registration.view", description: "View SMSF registrations" },
  { module: "smsf", resource: "smsf_registrations", action: "edit", name: "Edit SMSF Registrations", slug: "smsf.registration.edit", description: "Process SMSF registrations" },

  { module: "business", resource: "business_registrations", action: "view", name: "View Business Name Registrations", slug: "business.name.view", description: "View business name registrations" },
  { module: "business", resource: "business_registrations", action: "edit", name: "Edit Business Name Registrations", slug: "business.name.edit", description: "Process business name registrations" },

  { module: "tfn_abn", resource: "tfn_abn_applications", action: "view", name: "View TFN & ABNs", slug: "tfn.abn.view", description: "View TFN & ABN applications" },
  { module: "tfn_abn", resource: "tfn_abn_applications", action: "edit", name: "Edit TFN & ABNs", slug: "tfn.abn.edit", description: "Process TFN & ABN applications" },

  { module: "individual_engagement", resource: "individual_engagements", action: "view", name: "View Individual Engagements", slug: "individual.engagement.view", description: "View individual engagements" },
  { module: "individual_engagement", resource: "individual_engagements", action: "edit", name: "Edit Individual Engagements", slug: "individual.engagement.edit", description: "Process individual engagements" },

  { module: "entity_engagement", resource: "entity_engagements", action: "view", name: "View Entity Engagements", slug: "entity.engagement.view", description: "View entity engagements" },
  { module: "entity_engagement", resource: "entity_engagements", action: "edit", name: "Edit Entity Engagements", slug: "entity.engagement.edit", description: "Process entity engagements" },
];

// 2. Default Practice Roles
const DEFAULT_ROLES = [
  {
    name: "Administrator",
    slug: "administrator",
    description: "Full, unrestricted system and practice administrative access",
    isSystem: true,
    status: "Active",
  },
  {
    name: "Practice Manager",
    slug: "manager",
    description: "Full operational access, user oversight, reporting, and audit viewing",
    isSystem: true,
    status: "Active",
  },
  {
    name: "Senior Accountant",
    slug: "accountant",
    description: "View and process client tax, company, trust, and engagement filings",
    isSystem: true,
    status: "Active",
  },
  {
    name: "Staff Member",
    slug: "staff",
    description: "Standard staff member with basic processing capabilities",
    isSystem: true,
    status: "Active",
  },
];

async function seedRBAC() {
  console.log("==========================================");
  console.log("Starting RBAC and Default User Seeding...");
  console.log("==========================================");

  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // Sync models to ensure tables exist
    await sequelize.sync();
    console.log("Database schema verified.");

    // 1. Seed Permissions
    console.log(`Seeding ${DEFAULT_PERMISSIONS.length} master permissions...`);
    for (const perm of DEFAULT_PERMISSIONS) {
      await Permission.findOrCreate({
        where: { slug: perm.slug },
        defaults: perm,
      });
    }
    console.log("Master permissions seeded successfully.");

    // 2. Seed Default Roles
    console.log(`Seeding ${DEFAULT_ROLES.length} default practice roles...`);
    const createdRoles = {};
    for (const roleDef of DEFAULT_ROLES) {
      const [role] = await Role.findOrCreate({
        where: { slug: roleDef.slug },
        defaults: roleDef,
      });
      createdRoles[role.slug] = role;
    }
    console.log("Default practice roles seeded successfully.");

    // 3. Map Permissions to Roles
    console.log("Configuring role-permission mappings...");
    const allDbPermissions = await Permission.findAll();
    const permMap = {};
    allDbPermissions.forEach((p) => {
      permMap[p.slug] = p.id;
    });

    // Administrator gets ALL permissions
    const adminRole = createdRoles["administrator"];
    if (adminRole) {
      await adminRole.setPermissions(allDbPermissions);
      console.log(`Assigned all ${allDbPermissions.length} permissions to Administrator.`);
    }

    // Manager gets all operational permissions + user view + audit view
    const managerRole = createdRoles["manager"];
    if (managerRole) {
      const managerPermSlugs = [
        "users.view",
        "audit.view",
        "audit.export",
        "medicare.view",
        "medicare.edit",
        "gst.registration.view",
        "gst.registration.edit",
        "company.registration.view",
        "company.registration.edit",
        "company.changes.view",
        "company.changes.edit",
        "trust.registration.view",
        "trust.registration.edit",
        "smsf.registration.view",
        "smsf.registration.edit",
        "business.name.view",
        "business.name.edit",
        "tfn.abn.view",
        "tfn.abn.edit",
        "individual.engagement.view",
        "individual.engagement.edit",
        "entity.engagement.view",
        "entity.engagement.edit",
      ];
      const managerPermIds = managerPermSlugs.map((s) => permMap[s]).filter(Boolean);
      await managerRole.setPermissions(managerPermIds);
      console.log(`Assigned ${managerPermIds.length} permissions to Practice Manager.`);
    }

    // Accountant gets operational view & edit
    const accountantRole = createdRoles["accountant"];
    if (accountantRole) {
      const accountantPermSlugs = [
        "medicare.view",
        "medicare.edit",
        "gst.registration.view",
        "gst.registration.edit",
        "company.registration.view",
        "company.registration.edit",
        "company.changes.view",
        "company.changes.edit",
        "trust.registration.view",
        "trust.registration.edit",
        "smsf.registration.view",
        "smsf.registration.edit",
        "business.name.view",
        "business.name.edit",
        "tfn.abn.view",
        "tfn.abn.edit",
        "individual.engagement.view",
        "individual.engagement.edit",
        "entity.engagement.view",
        "entity.engagement.edit",
      ];
      const accountantPermIds = accountantPermSlugs.map((s) => permMap[s]).filter(Boolean);
      await accountantRole.setPermissions(accountantPermIds);
      console.log(`Assigned ${accountantPermIds.length} permissions to Senior Accountant.`);
    }

    // 4. Seed Default Administrator User
    console.log("Seeding default Administrator user...");
    const adminEmail = "admin@financiallyup.com.au";
    const rawPassword = "123456";
    const hashedPassword = await hashPassword(rawPassword);

    let [adminUser, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        firstName: "Kashif",
        lastName: "Fazal",
        email: adminEmail,
        passwordHash: hashedPassword,
        phone: "+61 400 000 000",
        department: "Executive & Practice Management",
        jobTitle: "Principal Practice Administrator",
        status: "Active",
      },
    });

    if (!created) {
      // Ensure password is correct and status is active
      adminUser.passwordHash = hashedPassword;
      adminUser.status = "Active";
      await adminUser.save();
      console.log("Existing Administrator user updated with latest credentials.");
    } else {
      console.log("Created new Administrator user.");
    }

    // Assign Administrator role to default admin user
    if (adminRole) {
      await adminUser.setRoles([adminRole]);
      console.log("Assigned 'Administrator' role to admin@financiallyup.com.au.");
    }

    console.log("==========================================");
    console.log("RBAC Seeding Completed Successfully!");
    console.log("Default Admin Account Credentials:");
    console.log("Email:    admin@financiallyup.com.au");
    console.log("Password: 123456");
    console.log("==========================================");
    process.exit(0);
  } catch (error) {
    console.error("RBAC Seeding Failed:", error);
    process.exit(1);
  }
}

seedRBAC();
