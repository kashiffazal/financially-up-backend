/**
 * Public Blog Controller
 * ======================
 * Read-only API for the website (/blog, /blog/[slug]). Only posts that are
 * published with a publish date in the past are ever returned, so drafts,
 * scheduled and trashed posts stay private.
 *
 * GET /api/blog/hub           -> { posts, categories, tags } for the /blog page
 * GET /api/blog/posts/:slug   -> { post, recentPosts } for a single article
 */

const { BlogPost, BlogCategory, BlogTag } = require("../models");
const { liveWhere, toPublicPost } = require("../services/blog.service");
const { getSettingsMap } = require("../services/settings.service");

/** Posts without an author show the company name (Settings > Company Details) */
const companyNameOf = async () => (await getSettingsMap().catch(() => ({})))["company.name"] || "Financially Up";

const postIncludes = [
  { model: BlogCategory, as: "categories", attributes: ["id", "name", "slug", "parentId"], through: { attributes: [] } },
  { model: BlogTag, as: "tags", attributes: ["id", "name", "slug"], through: { attributes: [] } },
];

const listLivePosts = (limit = 500) =>
  BlogPost.findAll({
    where: liveWhere(),
    include: postIncludes,
    order: [["publishedAt", "DESC"], ["id", "DESC"]],
    limit,
  });

/** Categories / tags with the number of live posts in each. */
const termCounts = (posts) => {
  const categories = new Map();
  const tags = new Map();
  for (const post of posts) {
    for (const c of post.categories || []) {
      const entry = categories.get(c.id) || { id: c.id, name: c.name, slug: c.slug, parentId: c.parentId, count: 0 };
      entry.count += 1;
      categories.set(c.id, entry);
    }
    for (const t of post.tags || []) {
      const entry = tags.get(t.id) || { id: t.id, name: t.name, slug: t.slug, count: 0 };
      entry.count += 1;
      tags.set(t.id, entry);
    }
  }
  return {
    categories: [...categories.values()],
    tags: [...tags.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
};

/**
 * GET /api/blog/hub
 */
const hub = async (req, res) => {
  try {
    const rows = await listLivePosts();
    const companyName = await companyNameOf();
    const posts = rows.map((row) => toPublicPost(row, companyName));
    const counts = termCounts(rows.map((r) => r.get({ plain: true })));

    // Top-level categories in admin order for the filter bar (with counts; empty ones hidden)
    const allCategories = await BlogCategory.findAll({ order: [["sortOrder", "ASC"], ["name", "ASC"]], raw: true });
    const countById = new Map(counts.categories.map((c) => [c.id, c.count]));
    const categories = allCategories
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId, count: countById.get(c.id) || 0 }))
      .filter((c) => c.count > 0);

    return res.status(200).json({ success: true, data: { posts, categories, tags: counts.tags } });
  } catch (error) {
    console.error("[Blog] hub error:", error);
    return res.status(500).json({ success: false, message: "Failed to load blog posts." });
  }
};

/**
 * GET /api/blog/posts/:slug
 */
const getBySlug = async (req, res) => {
  try {
    const post = await BlogPost.findOne({ where: { ...liveWhere(), slug: String(req.params.slug || "") }, include: postIncludes });
    if (!post) return res.status(404).json({ success: false, message: "Article not found." });

    const companyName = await companyNameOf();
    const recent = await BlogPost.findAll({
      where: liveWhere(),
      include: postIncludes,
      order: [["publishedAt", "DESC"], ["id", "DESC"]],
      limit: 4,
    });

    return res.status(200).json({
      success: true,
      data: {
        post: toPublicPost(post, companyName),
        recentPosts: recent.filter((r) => r.id !== post.id).slice(0, 3).map((r) => toPublicPost(r, companyName)),
      },
    });
  } catch (error) {
    console.error("[Blog] getBySlug error:", error);
    return res.status(500).json({ success: false, message: "Failed to load the article." });
  }
};

/**
 * GET /api/blog/slugs — published slugs (for sitemaps / static generation)
 */
const slugs = async (req, res) => {
  try {
    const rows = await BlogPost.findAll({ where: liveWhere(), attributes: ["slug", "updatedAt"], order: [["publishedAt", "DESC"]], raw: true });
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("[Blog] slugs error:", error);
    return res.status(500).json({ success: false, message: "Failed to load slugs." });
  }
};

module.exports = { hub, getBySlug, slugs };
