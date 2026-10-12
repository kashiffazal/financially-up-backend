/**
 * EmailAccount Model
 * ==================
 * SMTP accounts managed in Settings > Email. Exactly one can be the default:
 * every email the portal sends (form alerts, client receipts, enquiries,
 * password emails) goes through it. A new default is only accepted after a
 * test email is delivered through it.
 *
 * The password is stored encrypted (utils/secretBox.js) and is never sent to
 * the browser.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EmailAccount = sequelize.define(
  "email_accounts",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      comment: "Label shown in the admin, e.g. Client Microsoft 365",
    },
    host: {
      type: DataTypes.STRING(190),
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    security: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "ssl",
      comment: "ssl (implicit TLS, usually 465) | starttls (usually 587) | none",
    },
    username: {
      type: DataTypes.STRING(190),
      allowNull: false,
    },
    passwordEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fromName: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    fromEmail: {
      type: DataTypes.STRING(190),
      allowNull: false,
    },
    replyTo: {
      type: DataTypes.STRING(190),
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastTestAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastTestOk: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    lastTestMessage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdByUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    updatedByUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    indexes: [{ fields: ["isDefault"] }],
  }
);

module.exports = EmailAccount;
