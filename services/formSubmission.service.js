/**
 * Form Submission Service
 * =======================
 * Turns a public application form submission (JSON or multipart with files)
 * into database values for the legacy application tables:
 *
 *   - `columns`         values for the table's own columns (exact / case-insensitive
 *                       name match, plus per-module aliases), so admin tables, search
 *                       and notifications keep working;
 *   - `submissionData`  the COMPLETE submission (every answer + uploaded files), so
 *                       answers without a matching column are never lost.
 *
 * Status and other system fields can never be set by the client.
 */

const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "../public");

// Fields a public submission may never write
const PROTECTED_FIELDS = new Set(["id", "status", "createdAt", "updatedAt", "submissionData", "adminNotes"]);

/** Multipart sends arrays/objects as JSON strings — turn them back into values. */
const parseValue = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
};

const isEmpty = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

/** Public URL path of an uploaded file, e.g. /uploads/documents/2026/10/passport-123.pdf */
const publicPathOf = (file) => `/${path.relative(PUBLIC_DIR, file.path).split(path.sep).join("/")}`;

/** "Jane Mary Smith" → { first: "Jane Mary", last: "Smith" } */
const splitName = (fullName) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] || "", last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
};

/** Convert a form value to something the column type accepts (or undefined to skip). */
const toColumnValue = (attribute, value) => {
  const type = String(attribute?.type?.key || attribute?.type || "").toUpperCase();
  if (["INTEGER", "BIGINT", "FLOAT", "DOUBLE", "DECIMAL", "REAL", "SMALLINT", "TINYINT"].includes(type)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  if (type === "BOOLEAN") {
    if (typeof value === "boolean") return value;
    const s = String(value).toLowerCase();
    if (["true", "yes", "1", "on"].includes(s)) return true;
    if (["false", "no", "0", "off"].includes(s)) return false;
    return undefined;
  }
  if (type === "DATE" || type === "DATEONLY") {
    return Number.isNaN(new Date(value).getTime()) ? undefined : value;
  }
  if (type === "JSON") return value;
  return typeof value === "object" ? JSON.stringify(value) : String(value);
};

/**
 * Build column values + full submission snapshot.
 *
 * @param {object} req - Express request (body + optional multer `req.files`)
 * @param {object} Model - Sequelize model of the module table
 * @param {object} [aliases] - { formField: "column" | (value, fields) => ({ column: value }) }
 *                             fills columns whose name differs from the form field
 * @returns {{ columns: object, submissionData: object }}
 */
const buildSubmission = (req, Model, aliases = {}) => {
  const attributes = Model.rawAttributes;
  const byLowerName = new Map(Object.keys(attributes).map((a) => [a.toLowerCase(), a]));

  // 1. Every answer (parsed), minus protected/system fields
  const fields = {};
  for (const [key, raw] of Object.entries(req.body || {})) {
    if (PROTECTED_FIELDS.has(key)) continue;
    const value = parseValue(raw);
    if (!isEmpty(value)) fields[key] = value;
  }

  // 2. Uploaded files grouped by form field
  const files = {};
  (Array.isArray(req.files) ? req.files : []).forEach((file) => {
    (files[file.fieldname] = files[file.fieldname] || []).push({
      fileName: file.originalname,
      filePath: publicPathOf(file),
      size: file.size,
      mimeType: file.mimetype,
    });
  });

  // 3. Column values: exact / case-insensitive matches first, then aliases fill the gaps
  const columns = {};
  const assign = (column, value) => {
    if (!column || PROTECTED_FIELDS.has(column) || !attributes[column] || isEmpty(value)) return;
    if (columns[column] !== undefined) return;
    const converted = toColumnValue(attributes[column], value);
    if (converted !== undefined) columns[column] = converted;
  };

  for (const [key, value] of Object.entries(fields)) {
    assign(attributes[key] ? key : byLowerName.get(key.toLowerCase()), value);
  }
  for (const [formField, target] of Object.entries(aliases)) {
    if (isEmpty(fields[formField])) continue;
    if (typeof target === "function") {
      Object.entries(target(fields[formField], fields) || {}).forEach(([column, value]) => assign(column, value));
    } else {
      assign(target, fields[formField]);
    }
  }
  // File fields whose name matches a column (e.g. TrustDeed, proofOfID) also store the path(s)
  for (const [key, list] of Object.entries(files)) {
    assign(attributes[key] ? key : byLowerName.get(key.toLowerCase()), list.map((f) => f.filePath).join(", "));
  }

  return {
    columns,
    submissionData: {
      fields,
      files,
      submittedAt: new Date().toISOString(),
      source: req.get?.("origin") || null,
    },
  };
};

module.exports = {
  buildSubmission,
  splitName,
};
