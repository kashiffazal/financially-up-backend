/**
 * Database Configuration
 * =====================
 * Creates and exports a Sequelize instance connected to MySQL.
 * Reads connection details from environment variables (.env files).
 * This is the single source of truth for the DB connection across the app.
 */

const { Sequelize } = require("sequelize");

/**
 * Hostinger puts an account prefix in front of database and user names
 * (staging u272433291_, client u114088816_). Set DB_PREFIX per server and keep
 * DB_NAME / DB_USER the same everywhere; a name that already has a u123..._
 * prefix gets the DB_PREFIX one instead. Without DB_PREFIX the names are used as is.
 */
const withPrefix = (value) => {
  const prefix = (process.env.DB_PREFIX || "").trim();
  if (!prefix || !value) return value;
  return prefix + value.replace(/^u\d+_/, "");
};

const DB_NAME = withPrefix(process.env.DB_NAME || "financially-up");
const DB_USER = withPrefix(process.env.DB_USER || "root");

// Create Sequelize instance with MySQL connection parameters from environment
// (the password only ever comes from DB_PASSWORD)
const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
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
  },
);

module.exports = sequelize;
