/**
 * Permission Controller
 * =====================
 * Read-only dictionary endpoints providing grouped and list views of system capabilities.
 */

const { Permission } = require("../models");

/**
 * GET /api/permissions
 * List all available permissions grouped by module.
 */
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [["module", "ASC"], ["name", "ASC"]],
    });

    // Group by module
    const grouped = {};
    for (const p of permissions) {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push(p);
    }

    return res.status(200).json({
      success: true,
      permissions,
      grouped,
    });
  } catch (error) {
    console.error("getPermissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve permissions.",
    });
  }
};

module.exports = {
  getPermissions,
};
