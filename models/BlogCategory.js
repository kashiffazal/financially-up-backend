/**
 * BlogCategory Model
 * ==================
 * Hierarchical blog categories (WordPress-style): a category may have a parent,
 * which makes it a sub-category. Managed at /admin/blog/categories.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BlogCategory = sequelize.define("blog_categories", {
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
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = BlogCategory;
