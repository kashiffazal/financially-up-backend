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

// Import the configured Express app and Sequelize instance
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

/**
 * Start the server
 * - Authenticate the database connection
 * - Sync all models (create tables if they don't exist)
 * - Start Express listening on the configured port
 */
const startServer = async () => {
  try {
    console.log("========== DATABASE ==========");
    console.log({
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
    });
    console.log("==============================");

    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Sync all models with the database
    // alter: true will update existing tables to match the model (add new columns, etc.)
    // In production, you would use migrations instead of sync
    await sequelize.sync();
    console.log("✅ Database tables synced successfully.");

    // Seed RBAC permissions, roles, and initial administrator
    const { seedRBAC } = require("./utils/rbacSeed");
    await seedRBAC();

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1); // Exit with error code
  }
};

// Boot the server
startServer();
