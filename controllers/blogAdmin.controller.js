/**
 * Blog Admin Controller
 * =====================
 * WordPress-style blog management for /admin/blog (login + blog.* permissions).
 *
 * Posts:      list (status tabs + counts), get, create, update, feature,
 *             trash / restore, permanent delete (from Trash only)
 * Categories: list (tree + post counts), create, update, delete
 * Tags:       list (+ post counts), create, update, delete
 * Media:      image upload (featured image + images inside the editor)
 * Authors:    staff users that can be chosen as post author
 */

const { Op } = require("sequelize");
const { sequelize, BlogPost, BlogCategory, BlogTag, BlogPostCategory, BlogPostTag, User } = require("../models");
const auditService = require("../services/audit.service");
const {
  uniqueSlug,
  sanitizePostHtml,
  computeReadTime,
  toAdminPost,
  refreshWebsiteBlog,
} = require("../services/blog.service");

const STATUSES = ["draft", "published"];

const postIncludes = [
  { model: BlogCategory, as: "categories", attributes: ["id", "name", "slug", "parentId"], through: { attributes: [] } },
  { model: BlogTag, as: "tags", attributes: ["id", "name", "slug"], through: { attributes: [] } },
  { model: User, as: "author", attributes: ["id", "firstName", "lastName", "email"], required: false },
];

const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const userName = (u) => (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : null);

const audit = (req, action, resourceType, resourceId, description) =>
  auditService.log({
    actorUserId: req.user?.id,
    action,
    module: "blog",
    resourceType,
    resourceId,
    description,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

const sendError = (res, error, fallback) => {
  console.error(`[BlogAdmin] ${fallback}:`, error);
  return res.status(500).json({ success: false, message: fallback });
};

// ============================================================================
// POSTS
// ============================================================================

/**
 * GET /api/blog-admin/posts?status=all|published|draft|scheduled|trash&search=&categoryId=
 */
const listPosts = async (req, res) => {
  try {
    const now = new Date();
    const { status = "all", search = "", categoryId } = req.query;

    const where = {};
    if (status === "trash") where.status = "trash";
    else if (status === "draft") where.status = "draft";
    else if (status === "published") Object.assign(where, { status: "published", publishedAt: { [Op.lte]: now } });
    else if (status === "scheduled") Object.assign(where, { status: "published", publishedAt: { [Op.gt]: now } });
    else where.status = { [Op.ne]: "trash" };

    const q = clean(search, 120);
    if (q) where[Op.or] = [{ title: { [Op.like]: `%${q}%` } }, { slug: { [Op.like]: `%${q}%` } }, { authorName: { [Op.like]: `%${q}%` } }];

    const include = postIncludes.map((inc) => ({ ...inc }));
    if (categoryId) {
      // Keep all of a post's categories in the response while filtering by one
      const ids = await BlogPostCategory.findAll({ where: { categoryId: Number(categoryId) }, attributes: ["postId"], raw: true });
      where.id = { [Op.in]: ids.map((r) => r.postId) };
    }

    const rows = await BlogPost.findAll({
      where,
      include,
      attributes: { exclude: ["content", "structuredContent", "schemaJson"] },
      order: [["id", "DESC"]],
      limit: 1000,
    });
    // Newest first by post date (publish date; drafts by creation date), like WordPress.
    // Not by "last updated", so featuring or editing a post doesn't move it in the list.
    const postDate = (p) => new Date(p.publishedAt || p.createdAt).getTime();
    rows.sort((x, y) => postDate(y) - postDate(x) || y.id - x.id);

    // Tab counts
    const [all, published, scheduled, drafts, trash] = await Promise.all([
      BlogPost.count({ where: { status: { [Op.ne]: "trash" } } }),
      BlogPost.count({ where: { status: "published", publishedAt: { [Op.lte]: now } } }),
      BlogPost.count({ where: { status: "published", publishedAt: { [Op.gt]: now } } }),
      BlogPost.count({ where: { status: "draft" } }),
      BlogPost.count({ where: { status: "trash" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: { posts: rows.map(toAdminPost), counts: { all, published, scheduled, drafts, trash } },
    });
  } catch (error) {
    return sendError(res, error, "Failed to load posts");
  }
};

/**
 * GET /api/blog-admin/posts/:id
 */
const getPost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id, { include: postIncludes });
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    return res.status(200).json({ success: true, data: toAdminPost(post) });
  } catch (error) {
    return sendError(res, error, "Failed to load post");
  }
};

/** Validates & normalises the editor payload into column values. */
const buildPostValues = async (body, req, existing = null) => {
  const errors = {};
  // On update, fields not sent keep their saved value (title included)
  const title = body.title === undefined && existing ? existing.title : clean(body.title, 255);
  if (!title) errors.title = "Please enter a title.";

  const status = STATUSES.includes(body.status) ? body.status : existing?.status === "trash" ? existing.statusBeforeTrash || "draft" : existing?.status || "draft";

  let publishedAt = existing?.publishedAt || null;
  if (body.publishedAt !== undefined) {
    const d = body.publishedAt ? new Date(body.publishedAt) : null;
    if (d && Number.isNaN(d.getTime())) errors.publishedAt = "Invalid publish date.";
    else publishedAt = d;
  }
  if (status === "published" && !publishedAt) publishedAt = new Date();

  let schemaJson = typeof body.schemaJson === "string" ? body.schemaJson.trim() : existing?.schemaJson || null;
  if (schemaJson) {
    // Accept raw JSON or a <script type="application/ld+json"> wrapper
    const inner = schemaJson.replace(/^<script[^>]*>/i, "").replace(/<\/script>\s*$/i, "").trim();
    try {
      JSON.parse(inner);
      schemaJson = inner;
    } catch {
      errors.schemaJson = "Blog Schema is not valid JSON.";
    }
  }

  if (Object.keys(errors).length) return { errors };

  // Author: chosen staff user (defaults to the logged-in user)
  const authorUserId = Number(body.authorUserId) || existing?.authorUserId || req.user?.id || null;
  const author = authorUserId ? await User.findByPk(authorUserId, { attributes: ["id", "firstName", "lastName", "email", "jobTitle"] }) : null;

  const values = {
    title,
    content: body.content !== undefined ? sanitizePostHtml(body.content) : existing?.content || "",
    excerpt: body.excerpt !== undefined ? clean(body.excerpt, 2000) || null : existing?.excerpt || null,
    status,
    publishedAt,
    badge: body.badge !== undefined ? clean(body.badge, 60) || null : existing?.badge || null,
    featuredImage: body.featuredImage !== undefined ? clean(body.featuredImage, 500) || null : existing?.featuredImage || null,
    authorUserId: author?.id || null,
    authorName: userName(author) || existing?.authorName || null,
    authorRole: body.authorRole !== undefined ? clean(body.authorRole, 150) || null : existing?.authorRole ?? author?.jobTitle ?? null,
    authorQualifications: body.authorQualifications !== undefined ? clean(body.authorQualifications, 200) || null : existing?.authorQualifications || null,
    focusKeyword: body.focusKeyword !== undefined ? clean(body.focusKeyword, 150) || null : existing?.focusKeyword || null,
    metaTitle: body.metaTitle !== undefined ? clean(body.metaTitle, 255) || null : existing?.metaTitle || null,
    metaDescription: body.metaDescription !== undefined ? clean(body.metaDescription, 400) || null : existing?.metaDescription || null,
    schemaJson: schemaJson || null,
    updatedByUserId: req.user?.id || null,
  };
  // Editing an imported post in the editor turns it into a normal HTML post
  if (body.content !== undefined && existing?.structuredContent) values.structuredContent = null;

  values.slug = await uniqueSlug(BlogPost, clean(body.slug, 200) || existing?.slug || title, existing?.id);
  values.readTimeMinutes = computeReadTime({ structuredContent: values.structuredContent === null ? null : existing?.structuredContent, content: values.content });
  return { values };
};

/** Replaces a post's categories / tags (ids that don't exist are ignored). */
const setPostTerms = async (postId, categoryIds, tagIds, transaction) => {
  if (Array.isArray(categoryIds)) {
    const valid = await BlogCategory.findAll({ where: { id: categoryIds.map(Number).filter(Boolean) }, attributes: ["id"], transaction });
    await BlogPostCategory.destroy({ where: { postId }, transaction });
    await BlogPostCategory.bulkCreate(valid.map((c) => ({ postId, categoryId: c.id })), { transaction });
  }
  if (Array.isArray(tagIds)) {
    const valid = await BlogTag.findAll({ where: { id: tagIds.map(Number).filter(Boolean) }, attributes: ["id"], transaction });
    await BlogPostTag.destroy({ where: { postId }, transaction });
    await BlogPostTag.bulkCreate(valid.map((t) => ({ postId, tagId: t.id })), { transaction });
  }
};

/** Only one featured post at a time. */
const applyFeatured = async (postId, featured, transaction) => {
  // silent: featuring isn't a content edit, so "last updated" stays as it was
  if (featured) await BlogPost.update({ featured: false }, { where: { featured: true, id: { [Op.ne]: postId } }, transaction, silent: true });
  await BlogPost.update({ featured: Boolean(featured) }, { where: { id: postId }, transaction, silent: true });
};

/**
 * POST /api/blog-admin/posts
 */
const createPost = async (req, res) => {
  try {
    const { values, errors } = await buildPostValues(req.body || {}, req);
    if (errors) return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });

    const post = await sequelize.transaction(async (transaction) => {
      const created = await BlogPost.create({ ...values, createdByUserId: req.user?.id || null }, { transaction });
      await setPostTerms(created.id, req.body.categoryIds || [], req.body.tagIds || [], transaction);
      if (req.body.featured !== undefined) await applyFeatured(created.id, req.body.featured, transaction);
      return created;
    });

    await audit(req, "CREATE", "blog_post", post.id, `Created post "${post.title}" (${post.status})`);
    refreshWebsiteBlog();
    const full = await BlogPost.findByPk(post.id, { include: postIncludes });
    return res.status(201).json({ success: true, message: "Post saved.", data: toAdminPost(full) });
  } catch (error) {
    return sendError(res, error, "Failed to save post");
  }
};

/**
 * PUT /api/blog-admin/posts/:id
 */
const updatePost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const { values, errors } = await buildPostValues(req.body || {}, req, post.get({ plain: true }));
    if (errors) return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });

    await sequelize.transaction(async (transaction) => {
      await post.update(values, { transaction });
      await setPostTerms(post.id, req.body.categoryIds, req.body.tagIds, transaction);
      if (req.body.featured !== undefined) await applyFeatured(post.id, req.body.featured, transaction);
    });

    await audit(req, "UPDATE", "blog_post", post.id, `Updated post "${post.title}" (${post.status})`);
    refreshWebsiteBlog();
    const full = await BlogPost.findByPk(post.id, { include: postIncludes });
    return res.status(200).json({ success: true, message: "Post updated.", data: toAdminPost(full) });
  } catch (error) {
    return sendError(res, error, "Failed to update post");
  }
};

/**
 * PUT /api/blog-admin/posts/:id/featured  { featured: true|false }
 */
const setFeatured = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    if (post.status === "trash") return res.status(400).json({ success: false, message: "Restore the post before featuring it." });

    const featured = Boolean(req.body?.featured);
    await sequelize.transaction((transaction) => applyFeatured(post.id, featured, transaction));
    await audit(req, featured ? "FEATURE" : "UNFEATURE", "blog_post", post.id, `${featured ? "Featured" : "Unfeatured"} post "${post.title}"`);
    refreshWebsiteBlog();
    return res.status(200).json({ success: true, message: featured ? "Post is now the featured post." : "Post is no longer featured." });
  } catch (error) {
    return sendError(res, error, "Failed to update featured post");
  }
};

/**
 * POST /api/blog-admin/posts/:id/trash   (Delete -> Trash)
 */
const trashPost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    if (post.status !== "trash") {
      await post.update({ statusBeforeTrash: post.status, status: "trash", trashedAt: new Date(), featured: false, updatedByUserId: req.user?.id || null });
      await audit(req, "TRASH", "blog_post", post.id, `Moved post "${post.title}" to Trash`);
      refreshWebsiteBlog();
    }
    return res.status(200).json({ success: true, message: "Post moved to Trash." });
  } catch (error) {
    return sendError(res, error, "Failed to move post to Trash");
  }
};

/**
 * POST /api/blog-admin/posts/:id/restore
 */
const restorePost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    if (post.status === "trash") {
      await post.update({ status: post.statusBeforeTrash || "draft", statusBeforeTrash: null, trashedAt: null, updatedByUserId: req.user?.id || null });
      await audit(req, "RESTORE", "blog_post", post.id, `Restored post "${post.title}" from Trash`);
      refreshWebsiteBlog();
    }
    return res.status(200).json({ success: true, message: "Post restored." });
  } catch (error) {
    return sendError(res, error, "Failed to restore post");
  }
};

/**
 * DELETE /api/blog-admin/posts/:id   (permanent; only from Trash)
 */
const deletePost = async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    if (post.status !== "trash") return res.status(400).json({ success: false, message: "Move the post to Trash first." });

    await sequelize.transaction(async (transaction) => {
      await BlogPostCategory.destroy({ where: { postId: post.id }, transaction });
      await BlogPostTag.destroy({ where: { postId: post.id }, transaction });
      await post.destroy({ transaction });
    });
    await audit(req, "DELETE", "blog_post", post.id, `Permanently deleted post "${post.title}"`);
    return res.status(200).json({ success: true, message: "Post permanently deleted." });
  } catch (error) {
    return sendError(res, error, "Failed to delete post");
  }
};

// ============================================================================
// CATEGORIES
// ============================================================================

/** Post counts per category / tag (posts not in Trash). */
const termPostCounts = async (LinkModel, key) => {
  const rows = await LinkModel.findAll({
    attributes: [key, [sequelize.fn("COUNT", sequelize.col("postId")), "count"]],
    where: { postId: { [Op.in]: sequelize.literal("(SELECT id FROM blog_posts WHERE status <> 'trash')") } },
    group: [key],
    raw: true,
  });
  return new Map(rows.map((r) => [r[key], Number(r.count)]));
};

/**
 * GET /api/blog-admin/categories  -> flat list in tree order (parents then their children)
 */
const listCategories = async (req, res) => {
  try {
    const [rows, counts] = await Promise.all([
      BlogCategory.findAll({ order: [["sortOrder", "ASC"], ["name", "ASC"]], raw: true }),
      termPostCounts(BlogPostCategory, "categoryId"),
    ]);
    const byParent = new Map();
    rows.forEach((c) => {
      const key = c.parentId || 0;
      byParent.set(key, [...(byParent.get(key) || []), c]);
    });
    const ordered = [];
    const walk = (parentId, depth) => {
      for (const c of byParent.get(parentId) || []) {
        ordered.push({ ...c, depth, count: counts.get(c.id) || 0 });
        walk(c.id, depth + 1);
      }
    };
    walk(0, 0);
    // Orphans (parent removed) at the end
    rows.filter((c) => !ordered.some((o) => o.id === c.id)).forEach((c) => ordered.push({ ...c, depth: 0, count: counts.get(c.id) || 0 }));
    return res.status(200).json({ success: true, data: ordered });
  } catch (error) {
    return sendError(res, error, "Failed to load categories");
  }
};

/** True when making `parentId` the parent of `id` would create a loop. */
const createsCycle = async (id, parentId) => {
  let current = parentId;
  for (let i = 0; current && i < 50; i++) {
    if (Number(current) === Number(id)) return true;
    const parent = await BlogCategory.findByPk(current, { attributes: ["parentId"], raw: true });
    current = parent?.parentId;
  }
  return false;
};

const saveCategory = async (req, res, existing = null) => {
  const name = clean(req.body?.name, 120);
  if (!name) return res.status(400).json({ success: false, message: "Please enter a category name." });
  const parentId = Number(req.body?.parentId) || null;
  if (parentId) {
    if (!(await BlogCategory.findByPk(parentId))) return res.status(400).json({ success: false, message: "Parent category not found." });
    if (existing && (await createsCycle(existing.id, parentId))) {
      return res.status(400).json({ success: false, message: "A category can't be placed inside itself or its own sub-category." });
    }
  }
  const values = {
    name,
    slug: await uniqueSlug(BlogCategory, clean(req.body?.slug, 160) || name, existing?.id),
    description: clean(req.body?.description, 2000) || null,
    parentId,
  };
  const category = existing ? await existing.update(values) : await BlogCategory.create(values);
  await audit(req, existing ? "UPDATE" : "CREATE", "blog_category", category.id, `${existing ? "Updated" : "Created"} category "${category.name}"`);
  refreshWebsiteBlog();
  return res.status(existing ? 200 : 201).json({ success: true, message: existing ? "Category updated." : "Category added.", data: category });
};

/** POST /api/blog-admin/categories */
const createCategory = async (req, res) => {
  try {
    return await saveCategory(req, res);
  } catch (error) {
    return sendError(res, error, "Failed to add category");
  }
};

/** PUT /api/blog-admin/categories/:id */
const updateCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    return await saveCategory(req, res, category);
  } catch (error) {
    return sendError(res, error, "Failed to update category");
  }
};

/**
 * DELETE /api/blog-admin/categories/:id
 * Posts keep their other categories; sub-categories move up to this category's parent.
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    await sequelize.transaction(async (transaction) => {
      await BlogCategory.update({ parentId: category.parentId }, { where: { parentId: category.id }, transaction });
      await BlogPostCategory.destroy({ where: { categoryId: category.id }, transaction });
      await category.destroy({ transaction });
    });
    await audit(req, "DELETE", "blog_category", category.id, `Deleted category "${category.name}"`);
    refreshWebsiteBlog();
    return res.status(200).json({ success: true, message: "Category deleted." });
  } catch (error) {
    return sendError(res, error, "Failed to delete category");
  }
};

// ============================================================================
// TAGS
// ============================================================================

/** GET /api/blog-admin/tags */
const listTags = async (req, res) => {
  try {
    const [rows, counts] = await Promise.all([BlogTag.findAll({ order: [["name", "ASC"]], raw: true }), termPostCounts(BlogPostTag, "tagId")]);
    return res.status(200).json({ success: true, data: rows.map((t) => ({ ...t, count: counts.get(t.id) || 0 })) });
  } catch (error) {
    return sendError(res, error, "Failed to load tags");
  }
};

/** POST /api/blog-admin/tags — returns the existing tag if the name is already used */
const createTag = async (req, res) => {
  try {
    const name = clean(req.body?.name, 120).replace(/^#+/, "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Please enter a tag name." });
    const existing = await BlogTag.findOne({ where: { name } });
    if (existing) return res.status(200).json({ success: true, message: "Tag already exists.", data: existing });
    const tag = await BlogTag.create({
      name,
      slug: await uniqueSlug(BlogTag, clean(req.body?.slug, 160) || name),
      description: clean(req.body?.description, 2000) || null,
    });
    await audit(req, "CREATE", "blog_tag", tag.id, `Created tag "${tag.name}"`);
    return res.status(201).json({ success: true, message: "Tag added.", data: tag });
  } catch (error) {
    return sendError(res, error, "Failed to add tag");
  }
};

/** PUT /api/blog-admin/tags/:id */
const updateTag = async (req, res) => {
  try {
    const tag = await BlogTag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ success: false, message: "Tag not found." });
    const name = clean(req.body?.name, 120).replace(/^#+/, "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Please enter a tag name." });
    await tag.update({
      name,
      slug: await uniqueSlug(BlogTag, clean(req.body?.slug, 160) || name, tag.id),
      description: clean(req.body?.description, 2000) || null,
    });
    await audit(req, "UPDATE", "blog_tag", tag.id, `Updated tag "${tag.name}"`);
    refreshWebsiteBlog();
    return res.status(200).json({ success: true, message: "Tag updated.", data: tag });
  } catch (error) {
    return sendError(res, error, "Failed to update tag");
  }
};

/** DELETE /api/blog-admin/tags/:id (removed from all posts) */
const deleteTag = async (req, res) => {
  try {
    const tag = await BlogTag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ success: false, message: "Tag not found." });
    await sequelize.transaction(async (transaction) => {
      await BlogPostTag.destroy({ where: { tagId: tag.id }, transaction });
      await tag.destroy({ transaction });
    });
    await audit(req, "DELETE", "blog_tag", tag.id, `Deleted tag "${tag.name}"`);
    refreshWebsiteBlog();
    return res.status(200).json({ success: true, message: "Tag deleted." });
  } catch (error) {
    return sendError(res, error, "Failed to delete tag");
  }
};

// ============================================================================
// MEDIA & AUTHORS
// ============================================================================

/**
 * POST /api/blog-admin/media (multipart field "file")
 * Returns { url, location } — `location` is what the TinyMCE image uploader expects.
 */
const uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No image received." });
  const now = new Date();
  const url = `/uploads/blog/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${req.file.filename}`;
  return res.status(201).json({ success: true, url, location: url, data: { url, fileName: req.file.originalname, size: req.file.size } });
};

/** GET /api/blog-admin/authors — active staff users */
const listAuthors = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { status: { [Op.ne]: "inactive" } },
      attributes: ["id", "firstName", "lastName", "email", "jobTitle"],
      order: [["firstName", "ASC"]],
      raw: true,
    });
    return res.status(200).json({
      success: true,
      data: users.map((u) => ({ id: u.id, name: userName(u), email: u.email, jobTitle: u.jobTitle || "" })),
    });
  } catch (error) {
    return sendError(res, error, "Failed to load authors");
  }
};

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  setFeatured,
  trashPost,
  restorePost,
  deletePost,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listTags,
  createTag,
  updateTag,
  deleteTag,
  uploadImage,
  listAuthors,
};
