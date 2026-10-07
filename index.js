/**
 * Server Entry Point
 * ===================
 * Boots the Express server:
 * 1. Loads environment variables from the correct .env file
 * 2. Imports the configured Express app
 * 3. Tests the MySQL database connection
 * 4. Syncs Sequelize models (creates tables if they don't exist)
 * 5. Starts listening on the configured port
 *
 * Usage:
 *   Development: npm run dev  (uses nodemon for auto-restart)
 *   Production:  npm start
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables based on NODE_ENV
// Default to 'development' if NODE_ENV is not set
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
const envPath = path.resolve(__dirname, envFile);

// Only load from file if it exists locally.
// Otherwise rely on system environment variables (e.g., Hostinger hPanel).
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`📄 Loaded environment variables from: ${envFile}`);
} else {
  console.log(
    `📄 No ${envFile} file found. Relying on system environment variables.`,
  );
}

// Ensure storage directories exist on server startup
const ensureStorageDirs = () => {
  const dirs = [
    path.join(__dirname, "public/uploads"),
    path.join(__dirname, "public/uploads/pdf"),
    path.join(__dirname, "public/uploads/signatures"),
    path.join(__dirname, "public/uploads/documents"),
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }
};
ensureStorageDirs();

// Import the configured Express app and Sequelize instance
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

// Start the Express server immediately so Hostinger/Reverse Proxy detects active listener
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

/**
 * Initialize Database Asynchronously
 * Authenticates connection, syncs Sequelize models, and seeds RBAC permissions.
 */
const initDatabase = async (retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`⏳ [Attempt ${attempt}/${retries}] Connecting to MySQL database...`);
      console.log("========== DATABASE CONFIG ==========");
      console.log({
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD ? "******" : "(empty)",
      });
      console.log("=====================================");

      await sequelize.authenticate();
      console.log("✅ Database connection established successfully.");

      await sequelize.sync();
      console.log("✅ Database tables synced successfully.");

      // Safe schema patches: ensure newly added columns exist in MySQL tables
      try {
        await sequelize.query("ALTER TABLE new_individual_consents ADD COLUMN documentType VARCHAR(50) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_consents ADD COLUMN version VARCHAR(20) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_consents ADD COLUMN openedAt DATETIME NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_company_registrations ADD COLUMN controlAnswers JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_engagements ADD COLUMN tfnStatus VARCHAR(50) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_engagements ADD COLUMN tfnExplanation TEXT NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_engagements ADD COLUMN incomeActivities JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_engagements ADD COLUMN basScope VARCHAR(100) NULL").catch(() => {});
        // Declined consents are recorded with a NULL acceptedAt
        await sequelize.query("ALTER TABLE new_individual_consents MODIFY COLUMN acceptedAt DATETIME NULL").catch(() => {});

        // First/last name captured separately (fullName stays as the composed value)
        await sequelize.query("ALTER TABLE new_individual_clients ADD COLUMN firstName VARCHAR(100) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_clients ADD COLUMN lastName VARCHAR(100) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_company_officeholders ADD COLUMN firstName VARCHAR(100) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_company_officeholders ADD COLUMN lastName VARCHAR(100) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_company_shareholders ADD COLUMN firstName VARCHAR(100) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_company_shareholders ADD COLUMN lastName VARCHAR(100) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_company_beneficial_owners ADD COLUMN firstName VARCHAR(100) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_company_beneficial_owners ADD COLUMN lastName VARCHAR(100) NULL").catch(() => {});

        // Front/back identity document images
        await sequelize.query("ALTER TABLE new_individual_identities ADD COLUMN primaryIdType VARCHAR(60) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_identities ADD COLUMN primaryIdBackPath TEXT NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_identities ADD COLUMN supportingIdType VARCHAR(60) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_individual_identities ADD COLUMN supportingIdBackPath TEXT NULL").catch(() => {});
        await sequelize.query("ALTER TABLE new_company_officeholders ADD COLUMN idDocBackFilePath TEXT NULL").catch(() => {});

        // Website enquiries: email delivery tracking + spam reason
        await sequelize.query("ALTER TABLE contact_enquiries ADD COLUMN staffEmailStatus VARCHAR(20) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE contact_enquiries ADD COLUMN staffEmailError TEXT NULL").catch(() => {});
        await sequelize.query("ALTER TABLE contact_enquiries ADD COLUMN confirmationEmailStatus VARCHAR(20) NULL").catch(() => {});
        await sequelize.query("ALTER TABLE contact_enquiries ADD COLUMN confirmationEmailError TEXT NULL").catch(() => {});
        await sequelize.query("ALTER TABLE contact_enquiries ADD COLUMN spamReason VARCHAR(100) NULL").catch(() => {});

        // Public application forms: full submission snapshot (answers + uploaded files)
        await sequelize.query("ALTER TABLE gst_registrations ADD COLUMN submissionData JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE medicares ADD COLUMN submissionData JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE trust_registrations ADD COLUMN submissionData JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE smsf_registrations ADD COLUMN submissionData JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE business_name_registrations ADD COLUMN submissionData JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE apply_tfn_abns ADD COLUMN submissionData JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE entity_engagements ADD COLUMN submissionData JSON NULL").catch(() => {});
        await sequelize.query("ALTER TABLE changes_to_company_details ADD COLUMN submissionData JSON NULL").catch(() => {});

        // Notifications: per-user "removed from my list"
        await sequelize.query("ALTER TABLE notification_reads ADD COLUMN dismissedAt DATETIME NULL").catch(() => {});
      } catch (patchErr) {
        console.warn("Schema patch notice:", patchErr.message);
      }

      // Seed RBAC permissions, roles, and initial administrator
      const { seedRBAC } = require("./utils/rbacSeed");
      await seedRBAC();
      console.log("✅ RBAC seeding completed.");

      // Seed global settings (company identity, contact emails, app URLs)
      const { seedSettings } = require("./utils/settingsSeed");
      await seedSettings();
      console.log("✅ Global settings seeding completed.");
      return;
    } catch (error) {
      console.error(`⚠️ Database connection attempt ${attempt} failed:`, error.message);
      if (attempt < retries) {
        console.log(`Retrying in ${delayMs / 1000}s...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        console.error("❌ All database connection attempts exhausted. Server remains listening.");
      }
    }
  }
};

// Run database initialization in background without crashing Express listener
initDatabase();

module.exports = server;

