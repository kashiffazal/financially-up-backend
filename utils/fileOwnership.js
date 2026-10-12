/**
 * File Ownership
 * ==============
 * Which admin module a private upload belongs to, found from the record that
 * stores its link (e.g. a GST application's document -> "gst"). Used by
 * middleware/protectUploads.js: a staff member may open a file only when they
 * can view that module, so having the link alone is not enough.
 *
 * Also lists every column that can hold upload links (utils/secureUploads.js
 * renames files through the same list).
 */

const { QueryTypes } = require("sequelize");

/** Application tables -> module key (keys match utils/modulePermissions.js). */
const MODULE_OF_MODEL = {
  CompanyRegistration: "legacy-company",
  IndividualEngagement: "legacy-individual",
  EntityEngagement: "entity-engagements",
  ChangesToCompanyDetails: "changes-company",
  GstRegistration: "gst",
  Medicare: "medicare",
  TrustRegistration: "trust",
  SmsfRegistration: "smsf",
  BusinessNameRegistration: "business-names",
  ApplyTfnAbns: "apply-tfn",
};

const moduleKeyOfModel = (modelName) => {
  if (MODULE_OF_MODEL[modelName]) return MODULE_OF_MODEL[modelName];
  if (modelName.startsWith("NewIndividual")) return "new-individual";
  if (modelName.startsWith("NewCompany")) return "new-company";
  return null;
};

const TEXT_TYPES = new Set(["STRING", "TEXT", "CHAR", "JSON", "JSONB"]);

let sourcesCache = null;

/**
 * Tables + columns that can hold upload links.
 * @returns {{ moduleKey: string, table: string, columns: string[] }[]}
 */
const getFileSources = () => {
  if (sourcesCache) return sourcesCache;
  const models = require("../models");
  sourcesCache = Object.entries(models)
    .filter(([name, model]) => model?.rawAttributes && moduleKeyOfModel(name))
    .map(([name, model]) => ({
      moduleKey: moduleKeyOfModel(name),
      table: model.getTableName(),
      columns: Object.entries(model.rawAttributes)
        .filter(([, attr]) => TEXT_TYPES.has(String(attr?.type?.key || "").toUpperCase()))
        .map(([, attr]) => attr.field || attr.fieldName),
    }))
    .filter((s) => s.columns.length);
  return sourcesCache;
};

const escapeLike = (value) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

// Recent answers (path -> module keys); cleared after 10 minutes
const ownerCache = new Map();
const CACHE_MS = 10 * 60 * 1000;
const CACHE_MAX = 2000;

/**
 * Module keys of the records that link to this file ([] when none does).
 * @param {string} relPath - path inside the uploads folder, e.g. "pdf/2026/10/x.pdf"
 */
const findFileModules = async (relPath) => {
  const cached = ownerCache.get(relPath);
  if (cached && cached.at > Date.now() - CACHE_MS) return cached.keys;

  const { sequelize } = require("../models");
  const pattern = `%uploads/${escapeLike(relPath)}%`;
  const keys = new Set();

  for (const source of getFileSources()) {
    if (keys.has(source.moduleKey)) continue;
    const where = source.columns.map((c) => `CAST(\`${c}\` AS CHAR) LIKE :pattern`).join(" OR ");
    try {
      const rows = await sequelize.query(`SELECT 1 AS found FROM \`${source.table}\` WHERE ${where} LIMIT 1`, {
        replacements: { pattern },
        type: QueryTypes.SELECT,
      });
      if (rows.length) keys.add(source.moduleKey);
    } catch (error) {
      // A table missing on this server must not block the other modules
      if (!/doesn't exist/i.test(error.message)) console.error(`[Files] owner lookup in ${source.table}:`, error.message);
    }
  }

  const result = [...keys];
  if (result.length) {
    if (ownerCache.size >= CACHE_MAX) ownerCache.clear();
    ownerCache.set(relPath, { keys: result, at: Date.now() });
  }
  return result;
};

module.exports = { getFileSources, findFileModules, moduleKeyOfModel };
