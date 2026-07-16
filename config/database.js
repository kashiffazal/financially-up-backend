/**
 * Database Configuration
 * =====================
 * Creates and exports a Sequelize instance connected to MySQL.
 * Reads connection details from environment variables (.env files).
 * This is the single source of truth for the DB connection across the app.
 */

const { Sequelize } = require("sequelize");

// Create Sequelize instance with MySQL connection parameters from environment
const sequelize = new Sequelize(
  process.env.DB_NAME || "financially-up",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",

    // Logging: show SQL queries in development, hide in production
    logging: process.env.NODE_ENV === "development" ? console.log : false,

    // Connection pool settings for handling multiple concurrent requests
    pool: {
      max: 10, // Maximum number of connections in pool
      min: 0, // Minimum number of connections in pool
      acquire: 30000, // Max time (ms) to wait for a connection before throwing error
      idle: 10000, // Max time (ms) a connection can be idle before being released
    },

    // Define options applied to all models by default
    define: {
      timestamps: true, // Automatically adds createdAt and updatedAt columns
      underscored: false, // Keep camelCase column names (matching the form field names)
      freezeTableName: true, // Use exact model name as table name (no auto-pluralization)
    },
  }
);

module.exports = sequelize;
