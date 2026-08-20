/**
 * Role Management Controller
 * ==========================
 * Manages dynamic roles, permission assignment matrices, and system role protections.
 */

const { Role, Permission, RolePermission, UserRole, sequelize } = require("../models");
const auditService = require("../services/audit.service");

/**
 * GET /api/roles
 * List all roles with user counts and permission counts.
 */
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
      order: [["is_system", "DESC"], ["name", "ASC"]],
    });

    // Get user counts per role
    const userCounts = await UserRole.findAll({
      attributes: [
        "roleId",
        [sequelize.fn("COUNT", sequelize.col("user_id")), "userCount"],
      ],
      group: ["roleId"],
      raw: true,
    });

    const userCountMap = {};
    for (const uc of userCounts) {
      userCountMap[uc.roleId] = parseInt(uc.userCount) || 0;
    }

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      uuid: r.uuid,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      status: r.status,
      userCount: userCountMap[r.id] || 0,
      permissionCount: (r.permissions || []).length,
      createdAt: r.createdAt,
    }));

    return res.status(200).json({
      success: true,
      roles: formattedRoles,
    });
  } catch (error) {
    console.error("getRoles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve roles.",
    });
  }
};

/**
 * POST /api/roles
 * Create a new custom role.
 */
const createRole = async (req, res) => {
  const { name, description, permissionIds = [] } = req.body;

  const t = await sequelize.transaction();

  try {
    if (!name || !name.trim()) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Role name is required.",
      });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check slug uniqueness
    const existing = await Role.findOne({ where: { slug }, transaction: t });
    if (existing) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "A role with a similar name already exists.",
      });
    }

    const newRole = await Role.create(
      {
        name: name.trim(),
        slug,
        description: description || null,
        isSystem: false,
        status: "Active",
        createdBy: req.user.id,
      },
      { transaction: t }
    );

    // Assign permissions
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      const records = permissionIds.map((pId) => ({
        roleId: newRole.id,
        permissionId: pId,
      }));
      await RolePermission.bulkCreate(records, { transaction: t });
    }

    await t.commit();

    await auditService.log({
      actorUserId: req.user.id,
      action: "ROLE_CREATED",
      module: "roles",
      resourceType: "Role",
      resourceId: newRole.id,
      description: `Created custom role '${newRole.name}' (${newRole.slug})`,
      afterData: { id: newRole.id, name: newRole.name, slug: newRole.slug, permissionIds },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully.",
      role: newRole,
    });
  } catch (error) {
    await t.rollback();
    console.error("createRole error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create role.",
    });
  }
};

/**
 * GET /api/roles/:id
 * Get single role with its full list of assigned permissions.
 */
const getRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    return res.status(200).json({
      success: true,
      role,
    });
  } catch (error) {
    console.error("getRoleById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve role.",
    });
  }
};

/**
 * PUT /api/roles/:id
 * Update role details (name, description, status).
 */
const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    const beforeData = {
      name: role.name,
      description: role.description,
      status: role.status,
    };

    await role.update({
      name: name !== undefined ? name.trim() : role.name,
      description: description !== undefined ? description : role.description,
      status: status && ["Active", "Inactive"].includes(status) ? status : role.status,
    });

    const afterData = {
      name: role.name,
      description: role.description,
      status: role.status,
    };

    await auditService.log({
      actorUserId: req.user.id,
      action: "ROLE_UPDATED",
      module: "roles",
      resourceType: "Role",
      resourceId: role.id,
      description: `Updated role '${role.name}'`,
      beforeData,
      afterData,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Role updated successfully.",
      role,
    });
  } catch (error) {
    console.error("updateRole error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update role.",
    });
  }
};

/**
 * DELETE /api/roles/:id
 * Delete custom role (system roles are protected).
 */
const deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        message: "System roles are protected and cannot be deleted.",
      });
    }

    // Check if users are assigned to this role
    const assignedUserCount = await UserRole.count({ where: { roleId: role.id } });
    if (assignedUserCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. There are ${assignedUserCount} users currently assigned to it. Reassign those users first.`,
      });
    }

    await role.destroy();

    await auditService.log({
      actorUserId: req.user.id,
      action: "ROLE_DELETED",
      module: "roles",
      resourceType: "Role",
      resourceId: id,
      description: `Deleted custom role '${role.name}' (${role.slug})`,
      beforeData: { id: role.id, name: role.name, slug: role.slug },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully.",
    });
  } catch (error) {
    console.error("deleteRole error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete role.",
    });
  }
};

/**
 * PUT /api/roles/:id/permissions
 * Replace permissions assigned to a role.
 */
const updateRolePermissions = async (req, res) => {
  const { id } = req.params;
  const { permissionIds = [] } = req.body;

  const t = await sequelize.transaction();

  try {
    const role = await Role.findByPk(id, {
      include: [{ model: Permission, as: "permissions", through: { attributes: [] } }],
      transaction: t,
    });

    if (!role) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    const previousPermissionIds = (role.permissions || []).map((p) => p.id);

    // Delete existing permissions for role
    await RolePermission.destroy({ where: { roleId: role.id }, transaction: t });

    // Insert new permissions
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      const records = permissionIds.map((pId) => ({
        roleId: role.id,
        permissionId: pId,
      }));
      await RolePermission.bulkCreate(records, { transaction: t });
    }

    await t.commit();

    await auditService.log({
      actorUserId: req.user.id,
      action: "ROLE_PERMISSIONS_UPDATED",
      module: "roles",
      resourceType: "Role",
      resourceId: role.id,
      description: `Updated permissions for role '${role.name}' (${permissionIds.length} permissions assigned)`,
      beforeData: { permissionIds: previousPermissionIds },
      afterData: { permissionIds },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
    });

    // Re-fetch role with updated permissions
    const updatedRole = await Role.findByPk(id, {
      include: [{ model: Permission, as: "permissions", through: { attributes: [] } }],
    });

    return res.status(200).json({
      success: true,
      message: "Role permissions updated successfully.",
      role: updatedRole,
    });
  } catch (error) {
    await t.rollback();
    console.error("updateRolePermissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update role permissions.",
    });
  }
};

module.exports = {
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  updateRolePermissions,
};
