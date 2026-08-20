/**
 * Authorization Middleware
 * ========================
 * Enforces fine-grained permission checks on protected API routes.
 * Denies access by default if permission is missing.
 */

/**
 * Require a specific permission to access the route.
 *
 * @param {string} permissionSlug - Required permission (e.g. 'users.create', 'gst.registration.edit')
 */
const authorize = (permissionSlug) => {
  return (req, res, next) => {
    if (!req.user || !req.permissions) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // System administrator bypass if role has full access or slug is matched
    const isGranted = req.permissions.includes(permissionSlug);

    if (!isGranted) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

/**
 * Require ANY of the specified permissions.
 *
 * @param {Array<string>} permissionSlugs
 */
const authorizeAny = (permissionSlugs = []) => {
  return (req, res, next) => {
    if (!req.user || !req.permissions) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const hasAny = permissionSlugs.some((slug) => req.permissions.includes(slug));

    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

/**
 * Require ALL of the specified permissions.
 *
 * @param {Array<string>} permissionSlugs
 */
const authorizeAll = (permissionSlugs = []) => {
  return (req, res, next) => {
    if (!req.user || !req.permissions) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const hasAll = permissionSlugs.every((slug) => req.permissions.includes(slug));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  authorizeAny,
  authorizeAll,
};
