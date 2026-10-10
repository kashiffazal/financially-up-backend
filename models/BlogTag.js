/**
 * BlogTag Model
 * =============
 * Flat blog tags (WordPress-style). Managed at /admin/blog/tags and created
 * inline from the post editor.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BlogTag = sequelize.define("blog_tags", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(160),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = BlogTag;
