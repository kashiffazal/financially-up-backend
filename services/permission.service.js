/**
 * Permission & RBAC Resolution Service
 * =====================================
 * Centralized service to resolve and evaluate dynamic user permissions.
 * Computes the union of permissions across all active assigned roles.
 */

const { User, Role, Permission } = require("../models");

/**
 * Fetch all active roles assigned to a user.
 *
 * @param {number|string} userId
 * @returns {Promise<Array<Role>>} List of Role models
 */
const getUserRoles = async (userId) => {
  if (!userId) return [];

  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: "roles",
        where: { status: "Active" },
        through: { attributes: [] },
      },
    ],
  });

  return user ? user.roles || [] : [];
};

/**
 * Fetch all unique active permission slugs for a user (union across assigned roles).
 *
 * @param {number|string} userId
 * @returns {Promise<Array<string>>} Array of permission slugs (e.g. ['users.view', 'gst.registration.approve'])
 */
const getUserPermissions = async (userId) => {
  if (!userId) return [];

  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: "roles",
        where: { status: "Active" },
        through: { attributes: [] },
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  if (!user || !user.roles) {
    return [];
  }

  const permissionSet = new Set();
  for (const role of user.roles) {
    if (role.permissions) {
      for (const perm of role.permissions) {
        permissionSet.add(perm.slug);
      }
    }
  }

  return Array.from(permissionSet);
};

/**
 * Check if a user has a specific permission.
 *
 * @param {number|string} userId
 * @param {string} permissionSlug - Required permission (e.g. 'gst.registration.edit')
 * @returns {Promise<boolean>} True if user possesses permission
 */
const hasPermission = async (userId, permissionSlug) => {
  if (!userId || !permissionSlug) return false;

  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionSlug);
};

/**
 * Check if a user has at least one of the provided permissions.
 *
 * @param {number|string} userId
 * @param {Array<string>} permissionSlugs
 * @returns {Promise<boolean>}
 */
const hasAnyPermission = async (userId, permissionSlugs = []) => {
  if (!userId || !permissionSlugs.length) return false;

  const permissions = await getUserPermissions(userId);
  return permissionSlugs.some((slug) => permissions.includes(slug));
};

/**
 * Check if a user has ALL of the provided permissions.
 *
 * @param {number|string} userId
 * @param {Array<string>} permissionSlugs
 * @returns {Promise<boolean>}
 */
const hasAllPermissions = async (userId, permissionSlugs = []) => {
  if (!userId || !permissionSlugs.length) return false;

  const permissions = await getUserPermissions(userId);
  return permissionSlugs.every((slug) => permissions.includes(slug));
};

module.exports = {
  getUserRoles,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
};
