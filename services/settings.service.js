/**
 * Global Settings Service
 * =======================
 * Reads and updates the global variables stored in the `settings` table and keeps
 * a short-lived in-memory cache, since every PDF render and public page request
 * asks for the same values.
 *
 * The cache is cleared automatically whenever settings are updated.
 */

const Setting = require("../models/Setting");
const { DEFAULT_SETTINGS } = require("../utils/settingsSeed");

const CACHE_TTL_MS = 60 * 1000;

let cachedMap = null;
let cachedAt = 0;

/** Fallback values used if the database is unavailable */
function defaultsAsMap() {
  return DEFAULT_SETTINGS.reduce((map, item) => {
    map[item.key] = item.value;
    return map;
  }, {});
}

/** Clears the cache so the next read hits the database */
function clearSettingsCache() {
  cachedMap = null;
  cachedAt = 0;
}

/**
 * Returns all settings as a flat { key: value } map.
 * Falls back to seeded defaults if the query fails.
 */
async function getSettingsMap() {
  if (cachedMap && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedMap;
  }

  try {
    const rows = await Setting.findAll({ order: [["group", "ASC"], ["sortOrder", "ASC"]] });
    const map = defaultsAsMap();
    for (const row of rows) {
      map[row.key] = row.value;
    }
    cachedMap = map;
    cachedAt = Date.now();
    return map;
  } catch (error) {
    console.error("Failed to load settings, using defaults:", error.message);
    return defaultsAsMap();
  }
}

/**
 * Returns a single setting value, or the provided fallback.
 */
async function getSetting(key, fallback = null) {
  const map = await getSettingsMap();
  return map[key] ?? fallback;
}

/**
 * Returns full rows (with labels and groups) for the Admin Portal form.
 */
async function getSettingRows() {
  return Setting.findAll({ order: [["group", "ASC"], ["sortOrder", "ASC"]] });
}

/**
 * Applies a { key: value } object of updates. Unknown keys are ignored so the
 * settings list stays controlled by the seeder.
 *
 * @returns {Promise<{updated: string[], ignored: string[]}>}
 */
async function updateSettings(updates = {}) {
  const updated = [];
  const ignored = [];

  for (const [key, value] of Object.entries(updates)) {
    const row = await Setting.findOne({ where: { key } });
    if (!row) {
      ignored.push(key);
      continue;
    }
    await row.update({ value: value === null || value === undefined ? "" : String(value).trim() });
    updated.push(key);
  }

  clearSettingsCache();
  return { updated, ignored };
}

module.exports = {
  getSettingsMap,
  getSetting,
  getSettingRows,
  updateSettings,
  clearSettingsCache,
};
