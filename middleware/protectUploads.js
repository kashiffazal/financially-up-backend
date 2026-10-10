/**
 * Protected Uploads
 * =================
 * Runs before /uploads (and /api/uploads) are served.
 *
 * - blog/        public (images shown on the website blog)
 * - everything else (client signatures, identity documents, generated PDFs)
 *                requires a signed-in staff member who may view client
 *                applications. Generated PDFs named after an application
 *                reference are limited to that module:
 *                  NENG-… / ENG-…  Individual Engagement
 *                  CREG-…          Company Registration
 *
 * Opening a file in a new browser tab works because the login session is an
 * HttpOnly cookie, which the browser sends with the request.
 *
 * Also rejects paths that try to leave the uploads folder ("../").
 */

const path = require("path");
const { authenticate } = require("./authenticate");
const { canAccessModule, APPLICATION_MODULE_KEYS } = require("../utils/modulePermissions");

const UPLOADS_DIR = path.join(__dirname, "../public/uploads");
const PUBLIC_FOLDERS = ["blog/"];

/** Module a file belongs to, when its name tells us; null = any application module. */
const moduleOfFile = (relPath) => {
  const name = path.basename(relPath);
  if (/(^|[^A-Z])(NENG|ENG)-\d+/i.test(name) || /^(client_engagement|admin_review|engagement_acceptance|audit_report)_/i.test(name)) {
    return "new-individual";
  }
  if (/CREG-\d{4}-\d+/i.test(name)) return "new-company";
  return null;
};

const protectUploads = (req, res, next) => {
  let relPath;
  try {
    relPath = decodeURIComponent(req.path || "").replace(/\\/g, "/").replace(/^\/+/, "");
  } catch {
    return res.status(400).json({ success: false, message: "Invalid file path." });
  }

  // Never serve anything outside public/uploads
  const resolved = path.resolve(UPLOADS_DIR, relPath);
  if (resolved !== UPLOADS_DIR && !resolved.startsWith(UPLOADS_DIR + path.sep)) {
    return res.status(400).json({ success: false, message: "Invalid file path." });
  }

  if (PUBLIC_FOLDERS.some((folder) => relPath.startsWith(folder))) return next();

  // Private file: signed-in staff only (authenticate answers 401 itself)
  return authenticate(req, res, () => {
    const permissions = req.permissions || [];
    const moduleKey = moduleOfFile(relPath);
    const allowed = moduleKey
      ? canAccessModule(permissions, moduleKey, "view")
      : APPLICATION_MODULE_KEYS.some((key) => canAccessModule(permissions, key, "view"));

    if (!allowed) {
      return res.status(403).json({ success: false, message: "You do not have permission to open this file." });
    }

    // Client files must never sit in shared caches
    res.setHeader("Cache-Control", "private, no-cache");
    next();
  });
};

module.exports = { protectUploads, moduleOfFile };
