/**
 * Setting Model
 * =============
 * Stores global application variables (company identity, contact emails, app URLs)
 * that are shared by the Next.js frontend, this API, the generated PDFs, and the
 * PHP mPDF service.
 *
 * Values are editable from the Admin Portal (/admin/settings) so details such as
 * the Tax Agent Registration Number can be updated without a code deployment.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: "Dot-notation identifier, e.g. company.abn",
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    label: {
      type: DataTypes.STRING(150),
      allowNull: false,
      comment: "Human readable field label shown in the Admin Portal",
    },
    group: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "company",
      comment: "Admin form section: company | email | url",
    },
    inputType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "text",
      comment: "text | email | url | textarea",
    },
    helpText: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "settings",
    timestamps: true,
  }
);

module.exports = Setting;
