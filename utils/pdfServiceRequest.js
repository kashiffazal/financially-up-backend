/**
 * PHP PDF Service Request Helpers
 * ===============================
 * Shared by services/individualPdf.service.js and services/newCompanyPdf.service.js.
 *
 * 1. embedSignatures(data)
 *    Signatures are stored here as files (public/uploads/signatures/...). The PHP
 *    service runs on its own server in production and can't read this disk, so
 *    every signature path in the PDF data is replaced with the image itself
 *    (a base64 data URI) before the request is sent. PHP already accepts data URIs.
 *
 * 2. pdfServiceHeaders()
 *    Sends the shared PDF_SERVICE_SECRET so the PHP service only accepts
 *    requests from this backend (set the same value in both servers' settings).
 */

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "../public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const SIGNATURE_KEY = /signature(FilePath|Data|Path|Url)?$/i;
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

/** "uploads/signatures/x.png" | "/api/uploads/..." | full URL -> data URI, or null. */
const signatureFileToDataUri = (value) => {
  if (typeof value !== "string" || !value || value.startsWith("data:")) return null;
  let rel = value;
  try {
    if (/^https?:\/\//i.test(rel)) rel = new URL(rel).pathname;
  } catch {
    return null;
  }
  rel = decodeURIComponent(rel).replace(/\\/g, "/").replace(/^\/+/, "").replace(/^api\//, "");
  if (!rel.startsWith("uploads/")) rel = `uploads/${rel}`;

  const fullPath = path.resolve(PUBLIC_DIR, rel);
  // Only files inside public/uploads, only images, only reasonable sizes
  if (!fullPath.startsWith(UPLOADS_DIR + path.sep)) return null;
  const mime = MIME[path.extname(fullPath).toLowerCase()];
  if (!mime || !fs.existsSync(fullPath)) return null;
  const stat = fs.statSync(fullPath);
  if (!stat.isFile() || stat.size > MAX_SIGNATURE_BYTES) return null;

  return `data:${mime};base64,${fs.readFileSync(fullPath).toString("base64")}`;
};

/**
 * Plain copy of `data` with every signature file path replaced by the image's
 * data URI (paths that can't be read are left as they are).
 */
const embedSignatures = (data) => {
  const copy = JSON.parse(JSON.stringify(data ?? {}));
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && SIGNATURE_KEY.test(key)) {
        const dataUri = signatureFileToDataUri(value);
        if (dataUri) node[key] = dataUri;
      } else if (value && typeof value === "object") {
        walk(value);
      }
    }
  };
  walk(copy);
  return copy;
};

/** Request headers for the PHP PDF service (includes the shared secret when set). */
const pdfServiceHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (process.env.PDF_SERVICE_SECRET) headers["X-PDF-Service-Key"] = process.env.PDF_SERVICE_SECRET;
  return headers;
};

module.exports = { embedSignatures, pdfServiceHeaders, signatureFileToDataUri };
