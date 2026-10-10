/**
 * PasswordToken Model
 * ===================
 * One-time links for staff passwords:
 *   setup - "Set your password" email when an account is created (or an admin
 *           sends a reset), valid 48 hours
 *   reset - "Forgot password" email from the login page, valid 1 hour
 *
 * Only a SHA-256 hash of the token is stored, so a database copy can't be used
 * to take over accounts. A token works once (usedAt) and every older unused
 * token of the same user is cancelled when a new one is issued or used.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PasswordToken = sequelize.define(
  "password_tokens",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    purpose: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: "setup | reset",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdByUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: "Admin who sent it (null = requested from the login page)",
    },
    requestIp: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  },
  {
    indexes: [{ fields: ["userId"] }],
  }
);

module.exports = PasswordToken;
