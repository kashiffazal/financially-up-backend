/**
 * Settings Controller
 * ===================
 * 1. getPublicSettings  (GET  /api/settings)        - public key/value map for the
 *                                                     frontend, PDFs and PHP service
 * 2. getManagedSettings (GET  /api/settings/manage) - full rows for the Admin Portal
 * 3. updateSettings     (PUT  /api/settings/manage) - bulk update from the Admin Portal
 */

const settingsService = require("../services/settings.service");
const auditService = require("../services/audit.service");

/**
 * GET /api/settings - flat { key: value } map (no authentication required)
 */
async function getPublicSettings(req, res) {
  try {
    const settings = await settingsService.getSettingsMap();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Error loading public settings:", error);
    return res.status(500).json({ success: false, message: "Failed to load settings." });
  }
}

/**
 * GET /api/settings/manage - grouped rows with labels for the settings form
 */
async function getManagedSettings(req, res) {
  try {
    const rows = await settingsService.getSettingRows();
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error loading managed settings:", error);
    return res.status(500).json({ success: false, message: "Failed to load settings." });
  }
}

/**
 * PUT /api/settings/manage - bulk update { settings: { key: value } }
 */
async function updateSettings(req, res) {
  try {
    const updates = req.body?.settings || req.body || {};
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: "Expected a settings object." });
    }

    const { updated, ignored } = await settingsService.updateSettings(updates);

    await auditService.log({
      actorUserId: req.user?.id || null,
      action: "update",
      module: "settings",
      resourceType: "setting",
      description: `Updated ${updated.length} global setting(s): ${updated.join(", ")}`,
      afterData: updates,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      success: true,
      message: `${updated.length} setting(s) saved.`,
      successNotify: true,
      updated,
      ignored,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({ success: false, message: "Failed to update settings.", error: error.message });
  }
}

module.exports = { getPublicSettings, getManagedSettings, updateSettings };
