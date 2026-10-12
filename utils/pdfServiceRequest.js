/**
 * PHP PDF Service Request Helpers
 * ===============================
 * Shared by services/individualPdf.service.js and services/newCompanyPdf.service.js.
 *
 * 1. embedSignatures(data)
 *    Signatures are stored here as files (storage/uploads/signatures/...). The PHP
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

const { diskPathOfUpload } = require("./privateFiles");
const SIGNATURE_KEY = /signature(FilePath|Data|Path|Url)?$/i;
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

/** "uploads/signatures/x.png" | "/api/uploads/..." | full URL -> data URI, or null. */
const signatureFileToDataUri = (value) => {
  if (typeof value !== "string" || !value || value.startsWith("data:")) return null;
  // Bare "signatures/x.png" counts as an uploads path too
  const link = /^(https?:\/\/|\/?(api\/)?uploads\/)/i.test(value) ? value : `uploads/${value.replace(/^\/+/, "")}`;
  // Only files inside the uploads folders, only images, only reasonable sizes
  const fullPath = diskPathOfUpload(link);
  if (!fullPath) return null;
  const mime = MIME[path.extname(fullPath).toLowerCase()];
  if (!mime) return null;
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

/**
 * Sent with every PDF request so the PHP service needs no domain or settings
 * lookup of its own: this API's address (links to uploaded files) and the
 * company details from Settings.
 */
const pdfServiceContext = async () => {
  const { apiUrl } = require("./siteConfig");
  const { getSettingsMap } = require("../services/settings.service");
  return { apiUrl: apiUrl(), settings: await getSettingsMap().catch(() => ({})) };
};

module.exports = { embedSignatures, pdfServiceHeaders, pdfServiceContext, signatureFileToDataUri };
