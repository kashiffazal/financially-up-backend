/**
 * Protected Uploads
 * =================
 * Runs before /uploads (and /api/uploads) are served.
 *
 * - blog/        public (images shown on the website blog)
 * - everything else (client signatures, identity documents, generated PDFs)
 *                needs a signed-in staff member who can view the module of the
 *                record the file belongs to (utils/fileOwnership.js), e.g. a
 *                Medicare document needs Medicare access. Files no record links
 *                to can only be opened by Administrators.
 *
 * Private files live in storage/uploads (utils/privateFiles.js), outside the
 * folder the web server serves by itself, so this check can't be skipped.
 *
 * Opening a file in a new browser tab works because the login session is an
 * HttpOnly cookie, which the browser sends with the request.
 *
 * Also rejects paths that try to leave the uploads folder ("../").
 */

const path = require("path");
const { authenticate } = require("./authenticate");
const { canAccessModule } = require("../utils/modulePermissions");
const { findFileModules } = require("../utils/fileOwnership");
const { PRIVATE_UPLOADS_DIR } = require("../utils/privateFiles");

const PUBLIC_FOLDERS = ["blog/"];

const isAdministrator = (user) => (user?.roles || []).some((r) => r.slug === "administrator");

const protectUploads = (req, res, next) => {
  let relPath;
  try {
    relPath = decodeURIComponent(req.path || "").replace(/\\/g, "/").replace(/^\/+/, "");
  } catch {
    return res.status(400).json({ success: false, message: "Invalid file path." });
  }

  // Never serve anything outside the uploads folder
  const resolved = path.resolve(PRIVATE_UPLOADS_DIR, relPath);
  if (!relPath || !resolved.startsWith(PRIVATE_UPLOADS_DIR + path.sep)) {
    return res.status(400).json({ success: false, message: "Invalid file path." });
  }

  if (PUBLIC_FOLDERS.some((folder) => relPath.startsWith(folder))) return next();

  // Private file: signed-in staff only (authenticate answers 401 itself)
  return authenticate(req, res, async () => {
    try {
      let allowed = isAdministrator(req.user);
      if (!allowed) {
        const permissions = req.permissions || [];
        const moduleKeys = await findFileModules(relPath);
        allowed = moduleKeys.some((key) => canAccessModule(permissions, key, "view"));
      }

      if (!allowed) {
        return res.status(403).json({ success: false, message: "You do not have permission to open this file." });
      }

      // Client files must never sit in shared caches
      res.setHeader("Cache-Control", "private, no-cache");
      next();
    } catch (error) {
      console.error("[Uploads] access check failed:", error.message);
      return res.status(500).json({ success: false, message: "Could not open this file." });
    }
  });
};

module.exports = { protectUploads };
