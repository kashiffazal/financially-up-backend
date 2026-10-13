/**
 * Trash Controller
 * ================
 * POST /api/trash/:moduleKey           { ids: [..] }  -> move to Trash
 * POST /api/trash/:moduleKey/restore   { ids: [..] }  -> back to the previous status
 *
 * Who: Administrators, or staff who can change statuses in that module
 * ("manage" level; newsletter.manage for the newsletter). Records are never
 * deleted (services/trash.service.js).
 */

const { TRASH_MODULES, moveToTrash, restoreFromTrash } = require("../services/trash.service");
const { canAccessModule } = require("../utils/modulePermissions");

const isAdministrator = (user) => (user?.roles || []).some((r) => r.slug === "administrator");

const canManage = (req, moduleKey) => {
  if (isAdministrator(req.user)) return true;
  const permissions = req.permissions || [];
  if (moduleKey === "newsletter") return permissions.includes("newsletter.manage");
  return canAccessModule(permissions, moduleKey, "manage");
};

const handle = (action) => async (req, res) => {
  const { moduleKey } = req.params;
  if (!TRASH_MODULES[moduleKey]) {
    return res.status(404).json({ success: false, message: "Trash isn't available for this section." });
  }
  if (!canManage(req, moduleKey)) {
    return res.status(403).json({ success: false, message: "You do not have permission to change these records." });
  }
  const ids = req.body?.ids ?? req.body?.id;
  if (ids === undefined || ids === null || (Array.isArray(ids) && !ids.length)) {
    return res.status(400).json({ success: false, message: "Select at least one record." });
  }
  try {
    const result = action === "trash" ? await moveToTrash(moduleKey, ids, req) : await restoreFromTrash(moduleKey, ids, req);
    const count = result.done.length;
    const what = count === 1 ? "record" : "records";
    return res.status(200).json({
      success: true,
      message: action === "trash" ? `${count} ${what} moved to Trash.` : `${count} ${what} restored.`,
      data: result,
    });
  } catch (error) {
    console.error(`[Trash] ${action} ${moduleKey} failed:`, error);
    return res.status(500).json({ success: false, message: "Could not update the selected records." });
  }
};

module.exports = { moveToTrash: handle("trash"), restoreFromTrash: handle("restore") };
