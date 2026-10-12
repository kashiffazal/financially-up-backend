/**
 * NewsletterSubscriber Model
 * ==========================
 * Emails collected by the website's "Join the Financially Up Newsletter"
 * forms (blog listing + single article). Managed by staff at /admin/newsletter.
 * Records are never deleted: people are marked Unsubscribed instead.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NewsletterSubscriber = sequelize.define(
  "newsletter_subscribers",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: true,
      comment: "Name given on the sign-up form (older subscribers may have none)",
    },
    email: {
      type: DataTypes.STRING(190),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Subscribed",
      comment: "Subscribed | Unsubscribed",
    },
    source: {
      type: DataTypes.STRING(40),
      allowNull: true,
      comment: "blog_listing | blog_article",
    },
    sourcePage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Website path the person subscribed from",
    },
    subscribedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    unsubscribedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updatedByName: {
      type: DataTypes.STRING(150),
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
  },
  {
    indexes: [{ fields: ["status"] }, { fields: ["subscribedAt"] }],
  }
);

module.exports = NewsletterSubscriber;
