/**
 * Blog Service
 * ============
 * Shared helpers for the public blog API and the admin blog module:
 * slugs, HTML sanitising, read time, response shapes, and telling the
 * Next.js website to refresh its cached blog pages after a change.
 */

const sanitizeHtml = require("sanitize-html");

// ============================
// Slugs
// ============================

/** "Tax Tips & Tricks 2026!" -> "tax-tips-tricks-2026" */
const slugify = (text) =>
  String(text || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

/**
 * A slug that no other row of `Model` uses ("my-post", "my-post-2", ...).
 * @param {Model} Model - Sequelize model with a `slug` column
 * @param {string} wanted - Requested slug or source text
 * @param {number} [excludeId] - Row being edited
 */
const uniqueSlug = async (Model, wanted, excludeId = null) => {
  const { Op } = require("sequelize");
  const base = slugify(wanted) || "untitled";
  let candidate = base;
  for (let n = 2; n < 500; n++) {
    const where = { slug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    if (!(await Model.findOne({ where, attributes: ["id"] }))) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
};

// ============================
// HTML sanitising (editor content)
// ============================

const ALLOWED_STYLES = {
  color: [/^.+$/],
  "background-color": [/^.+$/],
  "text-align": [/^(left|right|center|justify)$/],
  "text-decoration": [/^.+$/],
  "font-size": [/^[\d.]+(px|pt|em|rem|%)$/],
  "font-family": [/^[\w\s,'"-]+$/],
  "font-weight": [/^.+$/],
  "font-style": [/^.+$/],
  "line-height": [/^.+$/],
  width: [/^.+$/],
  height: [/^.+$/],
  "max-width": [/^.+$/],
  float: [/^(left|right|none)$/],
  margin: [/^.+$/],
  "margin-left": [/^.+$/],
  "margin-right": [/^.+$/],
  "padding-left": [/^.+$/],
  border: [/^.+$/],
  "border-collapse": [/^.+$/],
  "list-style-type": [/^.+$/],
  "vertical-align": [/^.+$/],
};

/** Keeps editor formatting (headings, lists, tables, images, colours, embeds) but drops scripts & event handlers. */
const sanitizePostHtml = (html) =>
  sanitizeHtml(String(html || ""), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "figure", "figcaption", "h1", "h2", "span", "u", "s", "sup", "sub", "mark", "iframe", "video", "source", "colgroup", "col",
    ]),
    allowedAttributes: {
      "*": ["style", "class", "id", "title", "dir"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
      video: ["src", "controls", "width", "height", "poster"],
      source: ["src", "type"],
      td: ["colspan", "rowspan", "width"],
      th: ["colspan", "rowspan", "width", "scope"],
      col: ["span", "width"],
      ol: ["start", "type"],
    },
    allowedStyles: { "*": ALLOWED_STYLES },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
    transformTags: {
      // External links open safely in a new tab
      a: (tagName, attribs) => {
        if (attribs.target === "_blank") attribs.rel = "noopener noreferrer";
        return { tagName, attribs };
      },
    },
  });

/** JSON columns come back as text from MariaDB; normalise to an object (or null). */
const parseJson = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/** Plain text of a post (for word count / read time / keyword checks). */
const postPlainText = (post) => {
  const sc = parseJson(post.structuredContent);
  if (sc) {
    return [sc.intro, ...(sc.sections || []).flatMap((s) => [s.heading, s.body]), ...(sc.keyTakeaways || [])]
      .filter(Boolean)
      .join(" ");
  }
  return sanitizeHtml(String(post.content || ""), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
};

/** Minutes to read at ~200 words per minute (minimum 1). */
const computeReadTime = (post) => {
  const words = postPlainText(post).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

// ============================
// Status helpers
// ============================

/** Status as shown in the admin: Draft / Published / Scheduled / Trash */
const displayStatus = (post) => {
  if (post.status === "trash") return "Trash";
  if (post.status === "draft") return "Draft";
  if (post.publishedAt && new Date(post.publishedAt) > new Date()) return "Scheduled";
  return "Published";
};

/** Sequelize where-clause for posts visible on the website right now. */
const liveWhere = () => {
  const { Op } = require("sequelize");
  return { status: "published", publishedAt: { [Op.lte]: new Date() } };
};

// ============================
// Response shapes
// ============================

const initials = (name) =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "FU";

const formatDisplayDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric", timeZone: "Australia/Sydney" })
    : "";

const sortCategories = (cats = []) => [...cats].sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0) || a.name.localeCompare(b.name));

/**
 * Website shape (matches what the /blog pages render).
 * `category` is the post's main (first top-level) category name.
 */
const toPublicPost = (post, companyName = "Financially Up") => {
  const p = post.get ? post.get({ plain: true }) : { ...post };
  p.structuredContent = parseJson(p.structuredContent);
  const categories = sortCategories(p.categories || []);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: categories[0]?.name || "Uncategorised",
    categorySlug: categories[0]?.slug || null,
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId })),
    tags: (p.tags || []).map((t) => t.name),
    tagSlugs: (p.tags || []).map((t) => t.slug),
    badge: p.badge || "",
    image: p.featuredImage || "",
    excerpt: p.excerpt || "",
    summary: p.structuredContent?.summary || p.excerpt || "",
    date: formatDisplayDate(p.publishedAt),
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
    readTime: `${p.readTimeMinutes || 1} min read`,
    featured: Boolean(p.featured),
    author: {
      name: p.authorName || companyName,
      role: p.authorRole || "",
      avatar: initials(p.authorName || companyName),
      qualifications: p.authorQualifications || "",
    },
    // Exactly one of these is set: imported posts keep their sectioned layout
    content: p.structuredContent ? { intro: p.structuredContent.intro, sections: p.structuredContent.sections || [], keyTakeaways: p.structuredContent.keyTakeaways || [] } : null,
    html: p.structuredContent ? null : p.content || "",
    seo: {
      metaTitle: p.metaTitle || "",
      metaDescription: p.metaDescription || "",
      focusKeyword: p.focusKeyword || "",
      schemaJson: p.schemaJson || "",
    },
  };
};

const escapeHtml = (text) =>
  String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Editor HTML for an imported (sectioned) post: intro, headings + paragraphs, key takeaways. */
const structuredToHtml = (sc) => {
  if (!sc) return "";
  return [
    sc.intro ? `<p>${escapeHtml(sc.intro)}</p>` : "",
    ...(sc.sections || []).map((s) => `<h2>${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.body)}</p>`),
    sc.keyTakeaways?.length ? `<h3>Key Takeaways</h3><ul>${sc.keyTakeaways.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul>` : "",
  ].join("");
};

/** Admin shape: everything the editor and the posts table need. */
const toAdminPost = (post) => {
  const p = post.get ? post.get({ plain: true }) : { ...post };
  p.structuredContent = parseJson(p.structuredContent);
  return {
    ...p,
    // Imported posts open in the editor as HTML; saving content switches them to the editor layout
    content: p.content || (p.structuredContent ? structuredToHtml(p.structuredContent) : ""),
    isImportedLayout: Boolean(p.structuredContent),
    displayStatus: displayStatus(p),
    categories: sortCategories(p.categories || []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId })),
    categoryIds: (p.categories || []).map((c) => c.id),
    tags: (p.tags || []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
    tagIds: (p.tags || []).map((t) => t.id),
    author: p.author ? { id: p.author.id, name: `${p.author.firstName || ""} ${p.author.lastName || ""}`.trim(), email: p.author.email } : null,
  };
};

// ============================
// Website cache refresh
// ============================

/**
 * Ask the Next.js website to refresh its cached blog pages right away
 * (POST {SITE_URL}/api/revalidate). Without REVALIDATE_SECRET the website
 * still picks up changes within 60 seconds on its own.
 */
const refreshWebsiteBlog = () => require("../utils/websiteRefresh").refreshWebsite(["blog"]);

module.exports = {
  slugify,
  uniqueSlug,
  sanitizePostHtml,
  postPlainText,
  computeReadTime,
  displayStatus,
  liveWhere,
  toPublicPost,
  toAdminPost,
  refreshWebsiteBlog,
  formatDisplayDate,
  parseJson,
};
