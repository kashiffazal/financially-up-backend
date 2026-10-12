/**
 * Private Files (client uploads, signatures and generated PDFs)
 * =============================================================
 * Where client files live and how they are named.
 *
 * - Stored in storage/uploads/ (NOT public/). On Hostinger the web server
 *   serves anything inside public/ directly, before the Node app can check the
 *   login, so private files must never be saved there. Blog images stay in
 *   public/uploads/blog because the website shows them to everyone.
 * - Links keep the same shape (/uploads/pdf/2026/10/...) and are served only by
 *   the Node app after middleware/protectUploads.js checks the login and the
 *   module permission of the record the file belongs to.
 * - Every name has a random 32-character part, so one link can't be used to
 *   guess another (e.g. NENG-2026-4302_Client_Engagement_<random>.pdf).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PRIVATE_UPLOADS_DIR = path.join(__dirname, "../storage/uploads");
const PUBLIC_UPLOADS_DIR = path.join(__dirname, "../public/uploads");

/** A name already carries a random part (…_<32 hex>.ext or …-<32 hex>.ext). */
const SECURE_NAME = /[_-][0-9a-f]{32}\.[A-Za-z0-9]+$/;

const randomToken = () => crypto.randomBytes(16).toString("hex");

/** Generated PDFs: same record + type -> same name (so a rebuild replaces the file), still unguessable. */
let warnedNoSecret = false;
const pdfToken = (reference, label) => {
  const secret = process.env.FILE_LINK_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (!warnedNoSecret) console.warn("⚠️ FILE_LINK_SECRET / JWT_SECRET not set: PDF names use a one-off random part.");
    warnedNoSecret = true;
    return randomToken();
  }
  return crypto.createHmac("sha256", secret).update(`${reference}|${label}`).digest("hex").slice(0, 32);
};

const safeStem = (value, fallback = "file") =>
  String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60) || fallback;

/** "passport scan.pdf" -> "passport_scan-<random>.pdf" */
const secureFileName = (originalName, fallbackStem = "file") => {
  const ext = path.extname(String(originalName || "")).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${safeStem(path.basename(String(originalName || ""), path.extname(String(originalName || ""))), fallbackStem)}-${randomToken()}${ext}`;
};

/** "NENG-2026-4302", "Client_Engagement" -> "NENG-2026-4302_Client_Engagement_<token>.pdf" */
const securePdfName = (reference, label) => `${safeStem(reference, "document")}_${label}_${pdfToken(reference, label)}.pdf`;

/**
 * Private folder for this month, created when missing.
 * @param {"pdf"|"signatures"|"documents"} folder
 * @returns {{ dir: string, urlBase: string }}
 */
const privateMonthDir = (folder) => {
  const now = new Date();
  const sub = `${folder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = path.join(PRIVATE_UPLOADS_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return { dir, urlBase: `/uploads/${sub}` };
};

/** Disk path of a saved file -> its link ("/uploads/documents/2026/10/x.pdf"). */
const uploadUrlOf = (fullPath) => {
  const root = path.resolve(fullPath).startsWith(PRIVATE_UPLOADS_DIR + path.sep) ? PRIVATE_UPLOADS_DIR : PUBLIC_UPLOADS_DIR;
  return `/uploads/${path.relative(root, path.resolve(fullPath)).split(path.sep).join("/")}`;
};

/**
 * Link in any stored form ("/uploads/x", "uploads/x", "/api/uploads/x", full URL)
 * -> "x" relative to the uploads folder, or null when it is not an uploads link
 * or tries to leave the folder.
 */
const toUploadsRelPath = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  let rel = value.trim();
  try {
    if (/^https?:\/\//i.test(rel)) rel = new URL(rel).pathname;
    rel = decodeURIComponent(rel);
  } catch {
    return null;
  }
  rel = rel.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^api\//, "");
  if (!rel.startsWith("uploads/")) return null;
  rel = rel.slice("uploads/".length);
  const resolved = path.resolve(PRIVATE_UPLOADS_DIR, rel);
  if (!resolved.startsWith(PRIVATE_UPLOADS_DIR + path.sep)) return null;
  return rel;
};

/**
 * Disk path for a path relative to the uploads folder: the private copy, or
 * (blog images / files not moved yet) the public one. Null when neither exists.
 */
const existingUploadPath = (relPath) => {
  for (const root of [PRIVATE_UPLOADS_DIR, PUBLIC_UPLOADS_DIR]) {
    const full = path.resolve(root, relPath);
    if (!full.startsWith(root + path.sep)) continue;
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
};

/** Link -> disk path of the file (null when missing or not an uploads link). */
const diskPathOfUpload = (value) => {
  const rel = toUploadsRelPath(value);
  return rel ? existingUploadPath(rel) : null;
};

module.exports = {
  PRIVATE_UPLOADS_DIR,
  PUBLIC_UPLOADS_DIR,
  SECURE_NAME,
  randomToken,
  secureFileName,
  securePdfName,
  privateMonthDir,
  uploadUrlOf,
  toUploadsRelPath,
  existingUploadPath,
  diskPathOfUpload,
};
