/**
 * Blog post ↔ category / tag link tables (many-to-many, WordPress-style).
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BlogPostCategory = sequelize.define(
  "blog_post_categories",
  {
    postId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    categoryId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  },
  { timestamps: false, indexes: [{ fields: ["categoryId"] }] }
);

const BlogPostTag = sequelize.define(
  "blog_post_tags",
  {
    postId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    tagId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  },
  { timestamps: false, indexes: [{ fields: ["tagId"] }] }
);

module.exports = { BlogPostCategory, BlogPostTag };
