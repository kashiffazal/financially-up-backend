/**
 * Module Permissions (single source of truth)
 * ===========================================
 * Which permission slugs give access to each admin module. Used by the API
 * route guards, Global Search, notifications, the dashboard and the
 * protected /uploads files. The admin panel has a matching copy in
 * financially-up-frontend/lib/adminAccess.js — keep the two in sync.
 *
 * Levels:
 *   view   - see the list, open records, view / download their PDFs and files
 *   manage - change status, make review / approval decisions, regenerate PDFs
 *            (edit, review or approve all count, so Accountants and Reviewers both work)
 *
 * Each list holds the current slug first, then older slugs that existing roles
 * may still have (e.g. "medicare.view"), so nobody loses access they were given.
 * Keys match the Global Search registry keys.
 */

const MODULE_PERMISSIONS = {
  "new-company": {
    view: ["company.registration.view"],
    manage: ["company.registration.edit", "company.registration.review", "company.registration.approve"],
  },
  "legacy-company": {
    view: ["company.registration.view"],
    manage: ["company.registration.edit", "company.registration.review", "company.registration.approve"],
  },
  "changes-company": {
    view: ["changes_to_company.request.view", "company.changes.view"],
    manage: [
      "changes_to_company.request.edit",
      "changes_to_company.request.review",
      "changes_to_company.request.approve",
      "company.changes.edit",
    ],
  },
  "new-individual": {
    view: ["engagement.view", "individual.engagement.view"],
    manage: ["engagement.edit", "engagement.review", "engagement.approve", "individual.engagement.edit"],
  },
  "legacy-individual": {
    view: ["engagement.view", "individual.engagement.view"],
    manage: ["engagement.edit", "engagement.review", "engagement.approve", "individual.engagement.edit"],
  },
  "entity-engagements": {
    view: ["engagement.view", "entity.engagement.view"],
    manage: ["engagement.edit", "engagement.review", "engagement.approve", "entity.engagement.edit"],
  },
  gst: {
    view: ["gst.registration.view"],
    manage: ["gst.registration.edit", "gst.registration.review", "gst.registration.approve"],
  },
  medicare: {
    view: ["medicare.claim.view", "medicare.view"],
    manage: ["medicare.claim.edit", "medicare.claim.review", "medicare.claim.approve", "medicare.edit"],
  },
  trust: {
    view: ["trust.registration.view"],
    manage: ["trust.registration.edit", "trust.registration.review", "trust.registration.approve"],
  },
  smsf: {
    view: ["smsf.registration.view"],
    manage: ["smsf.registration.edit", "smsf.registration.review", "smsf.registration.approve"],
  },
  "business-names": {
    view: ["business_name.registration.view", "business.name.view"],
    manage: [
      "business_name.registration.edit",
      "business_name.registration.review",
      "business_name.registration.approve",
      "business.name.edit",
    ],
  },
  "apply-tfn": {
    view: ["tfn_abn.application.view", "tfn.abn.view"],
    manage: ["tfn_abn.application.edit", "tfn_abn.application.review", "tfn_abn.application.approve", "tfn.abn.edit"],
  },
  blog: {
    view: ["blog.view"],
    manage: ["blog.manage"],
  },
};

/** Client-application modules (everything except the blog). */
const APPLICATION_MODULE_KEYS = Object.keys(MODULE_PERMISSIONS).filter((key) => key !== "blog");

/** The current ("canonical") view slug of a module, e.g. for notifications. */
const viewPermissionOf = (moduleKey) => MODULE_PERMISSIONS[moduleKey]?.view[0] || null;

/**
 * True when `permissions` (array of slugs) allow `level` access to the module.
 * Unknown modules are never accessible.
 */
const canAccessModule = (permissions = [], moduleKey, level = "view") => {
  const config = MODULE_PERMISSIONS[moduleKey];
  if (!config) return false;
  const slugs = level === "manage" ? config.manage : config.view;
  return slugs.some((slug) => permissions.includes(slug));
};

/** Keys of every module the user can view. */
const viewableModuleKeys = (permissions = []) =>
  Object.keys(MODULE_PERMISSIONS).filter((key) => canAccessModule(permissions, key, "view"));

/**
 * The user's permissions plus the current view slug of every module they can
 * view through an older slug — so records tagged with the current slug (e.g.
 * notifications) are visible to roles that still use the older names.
 */
const withModuleViewSlugs = (permissions = []) => {
  const all = new Set(permissions);
  viewableModuleKeys(permissions).forEach((key) => all.add(viewPermissionOf(key)));
  return [...all];
};

module.exports = {
  MODULE_PERMISSIONS,
  withModuleViewSlugs,
  APPLICATION_MODULE_KEYS,
  viewPermissionOf,
  canAccessModule,
  viewableModuleKeys,
};
