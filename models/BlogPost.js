/**
 * BlogPost Model
 * ==============
 * WordPress-style blog posts shown on the website at /blog and /blog/[slug].
 *
 * Status:
 *   draft      - not on the website
 *   published  - on the website from `publishedAt` (a future date = "Scheduled")
 *   trash      - in the admin Trash tab, restorable (`statusBeforeTrash`)
 *
 * Content is sanitised HTML from the editor. Posts imported from the original
 * hardcoded blog keep their structured layout in `structuredContent`
 * ({ intro, sections: [{ heading, body }], keyTakeaways: [] }).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BlogPost = sequelize.define(
  "blog_posts",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    structuredContent: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "draft",
    },
    statusBeforeTrash: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    trashedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    badge: {
      type: DataTypes.STRING(60),
      allowNull: true,
      comment: "Short label shown on the featured image, e.g. TAX TIPS 2026",
    },
    featuredImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // Author: a staff user (name snapshot kept so posts survive user changes)
    authorUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    authorName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    authorRole: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    authorQualifications: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    readTimeMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    // SEO
    focusKeyword: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    metaTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    metaDescription: {
      type: DataTypes.STRING(400),
      allowNull: true,
    },
    schemaJson: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updatedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    indexes: [{ fields: ["status", "publishedAt"] }, { fields: ["featured"] }],
  }
);

module.exports = BlogPost;
