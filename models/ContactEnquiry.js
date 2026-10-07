/**
 * ContactEnquiry Model
 * ====================
 * Messages sent from the public website (Contact page form and the
 * "Contact Us" popup). Managed by staff at /admin/enquiries.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ContactEnquiry = sequelize.define("contact_enquiries", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  referenceNumber: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(190),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(40),
    allowNull: true,
  },
  service: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  preferredContact: {
    type: DataTypes.STRING(40),
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING(40),
    allowNull: true,
    comment: "contact_page | contact_modal",
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: "New",
    comment: "New | Contacted | Closed | Spam",
  },
  staffNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  handledByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  handledByName: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  handledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Email delivery tracking: pending | sent | failed | skipped
  staffEmailStatus: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  staffEmailError: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  confirmationEmailStatus: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  confirmationEmailError: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  spamReason: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
});

module.exports = ContactEnquiry;
