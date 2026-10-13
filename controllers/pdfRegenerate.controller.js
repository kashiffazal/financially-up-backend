/**
 * Regenerate PDFs Controller
 * ==========================
 * GET  /api/pdf-regenerate/:moduleKey/:id   the application's PDFs, each Present / Missing
 * POST /api/pdf-regenerate/:moduleKey/:id   rebuild them all (identical to the originals)
 *
 * moduleKey: new-individual | new-company. Who: Administrators, or staff who can
 * manage that module. Details: services/pdfRegenerate.service.js
 */

const { MODULES, listPdfs, regenerateAll } = require("../services/pdfRegenerate.service");
const { canAccessModule } = require("../utils/modulePermissions");
const auditService = require("../services/audit.service");

const isAdministrator = (user) => (user?.roles || []).some((r) => r.slug === "administrator");

const guard = (req, res) => {
  const { moduleKey, id } = req.params;
  if (!MODULES.includes(moduleKey)) {
    res.status(404).json({ success: false, message: "PDFs can't be regenerated for this section." });
    return null;
  }
  if (!isAdministrator(req.user) && !canAccessModule(req.permissions || [], moduleKey, "manage")) {
    res.status(403).json({ success: false, message: "You do not have permission to regenerate these PDFs." });
    return null;
  }
  const recordId = Number(id);
  if (!Number.isInteger(recordId) || recordId <= 0) {
    res.status(400).json({ success: false, message: "Invalid application." });
    return null;
  }
  return { moduleKey, recordId };
};

const list = async (req, res) => {
  const target = guard(req, res);
  if (!target) return;
  try {
    const data = await listPdfs(target.moduleKey, target.recordId);
    if (!data) return res.status(404).json({ success: false, message: "Application not found." });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[PDF] list failed:", error);
    return res.status(500).json({ success: false, message: "Could not load the PDFs." });
  }
};

const regenerate = async (req, res) => {
  const target = guard(req, res);
  if (!target) return;
  try {
    const actorName = req.user?.fullName || req.user?.email || "staff";
    // body.only: PDF keys to rebuild (from GET); none = all of them
    const only = Array.isArray(req.body?.only) ? req.body.only : null;
    const data = await regenerateAll(target.moduleKey, target.recordId, actorName, only);
    if (!data) return res.status(404).json({ success: false, message: "Application not found." });
    if (!data.results.length) return res.status(400).json({ success: false, message: "None of the selected PDFs belong to this application." });
    const made = data.results.filter((r) => r.ok).length;
    const failed = data.results.length - made;
    await auditService.log({
      actorUserId: req.user?.id,
      action: "REGENERATE_PDFS",
      module: target.moduleKey,
      resourceId: String(target.recordId),
      description: `Regenerated PDFs for ${data.reference}: ${data.results.map((r) => `${r.label} - ${r.message}`).join("; ")}`,
      status: failed ? "FAILURE" : "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return res.status(200).json({
      success: made > 0,
      message: failed
        ? `${made} of ${data.results.length} PDFs regenerated - ${failed} could not be made.`
        : made === 1
          ? "1 PDF regenerated."
          : `${made} PDFs regenerated.`,
      data,
    });
  } catch (error) {
    console.error("[PDF] regenerate failed:", error);
    return res.status(500).json({ success: false, message: "Could not regenerate the PDFs." });
  }
};

module.exports = { list, regenerate };
