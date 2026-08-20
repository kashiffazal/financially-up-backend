/**
 * User Model
 * ==========
 * Core identity model for all system users (Administrators, Managers, Accountants, etc.).
 * Stores authentication credentials (Argon2id password hashes), personal information,
 * and status. Role and permission memberships are managed dynamically via UserRole & Role.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "last_name",
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "job_title",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive", "Suspended"),
      defaultValue: "Active",
      allowNull: false,
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "email_verified_at",
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login_at",
    },
    lastLoginIp: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "last_login_ip",
    },
  },
  {
    tableName: "user_main",
    timestamps: true,
    paranoid: true, // Enables soft deletion via deletedAt (deleted_at)
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["uuid"],
      },
    ],
  }
);

module.exports = User;
