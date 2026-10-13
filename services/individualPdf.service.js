/**
 * Individual PDF Service (PHP mPDF Powered)
 * =========================================
 * Generates and tracks 4 Individual Engagement PDF types in `new_individual_pdfs`:
 * 1. Client Engagement PDF (Client copy on submission)
 * 2. Admin Review PDF (Internal staff package on submission, again at each decision)
 * 3. Engagement Acceptance PDF (Client official acceptance notice on Tax Agent approval)
 * 4. Audit Report PDF (Compliance audit log report at each decision)
 *
 * Rendering goes through services/pdfEngine.js. Each generator returns the PDF's
 * link, or null when the PDF could not be made (nothing is recorded then, so the
 * record shows the PDF as missing and "Regenerate PDFs" can rebuild it).
 *
 * Options (all optional, used by services/pdfRegenerate.service.js):
 *   asOf, settings   fixed inputs so a rebuild is identical to the original
 *   targetRelPath    write to this existing file instead of a new one
 *   generatedBy      PDF history label
 *   version          keep this history version number (rebuild of the same PDF)
 */

const fs = require("fs");
const path = require("path");
const { pdfServiceHeaders, pdfServiceContext } = require("../utils/pdfServiceRequest");
const getPhpPdfServerUrl = () => require("../utils/siteConfig").phpPdfServerUrl();
const { brandText } = require("../utils/brand");
const { getSettingsMap } = require("./settings.service");
const { pdfTarget, pdfInputs, renderPdf, snapshotOf } = require("./pdfEngine");
const NewIndividualPdf = require("../models/NewIndividualPdf");

/**
 * Generates PDF file from arbitrary HTML string using PHP mPDF service
 * @param {string} htmlContent
 * @param {string} fullPath
 * @param {string} title
 * @returns {Promise<boolean>}
 */
async function renderHtmlToPdf(htmlContent, fullPath, title = "Financially Up Document") {
  title = brandText(title, await getSettingsMap().catch(() => ({})));
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Save HTML copy for archive
  const htmlPath = fullPath.replace(/\.pdf$/, ".html");
  fs.writeFileSync(htmlPath, htmlContent);

  const phpServerUrl = getPhpPdfServerUrl();
  const endpoint = `${phpServerUrl}/forms-pdf-generation/render-html.php`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: pdfServiceHeaders(),
      body: JSON.stringify({
        ...(await pdfServiceContext()),
        html: htmlContent,
        title,
        savePath: fullPath,
        fileName: path.basename(fullPath),
      }),
    });

    const result = await response.json();
    if (result && result.success) {
      // Always keep the copy PHP returned (it may run on another server, and a rebuilt PDF must replace the old file)
      if (result.pdfBase64) {
        const buffer = Buffer.from(result.pdfBase64, "base64");
        fs.writeFileSync(fullPath, buffer);
      }
      return true;
    }
  } catch (err) {
    console.error("PHP HTML-to-PDF service error:", err.message);
  }

  return false;
}

/**
 * Saves a versioned row in new_individual_pdfs (with the generation snapshot)
 */
async function savePdfRecord(engagementId, type, fileName, filePath, generatedBy = "System", { snapshot = null, version = null } = {}) {
  try {
    const nextVersion = version || (await NewIndividualPdf.count({ where: { engagementId, type } })) + 1;
    return await NewIndividualPdf.create({
      engagementId,
      type,
      fileName,
      filePath,
      version: nextVersion,
      templateVersion: "v2.0.0 (mPDF)",
      generatedBy,
      generatedAt: new Date(),
      emailSent: false,
      snapshot,
    });
  } catch (err) {
    console.error(`Failed to record PDF metadata for ${type}:`, err.message);
    return null;
  }
}

/** Render one Individual Engagement PDF and record it. @returns {Promise<string|null>} link or null */
async function generateIndividualPdf(type, label, data, extra = {}, options = {}) {
  const target = pdfTarget({ reference: data.referenceNumber || `NENG-${Date.now()}`, label, targetRelPath: options.targetRelPath });
  const inputs = await pdfInputs(options);
  const ok = await renderPdf({ form: "individual-engagement", type, data, extra, ...inputs, ...target });
  if (!ok) return null;
  if (data.id) {
    await savePdfRecord(data.id, type, target.fileName, target.relPath, options.generatedBy || extra.staffName || extra.auditorName || "System", {
      snapshot: snapshotOf({ type, data, extra, ...inputs }),
      version: options.version,
    });
  }
  return target.relPath;
}

/** 1. Client Engagement PDF */
async function generateClientEngagementPDF(data, options = {}) {
  return generateIndividualPdf("ClientEngagement", "Client_Engagement", data, {}, options);
}

/** 2. Admin Review PDF */
async function generateAdminReviewPDF(data, options = {}) {
  return generateIndividualPdf("AdminReview", "Admin_Review", data, {}, options);
}

/** 3. Engagement Acceptance PDF */
async function generateEngagementAcceptancePDF(data, taxAgentName = "Financially Up Tax Agent", options = {}) {
  const staffName = brandText(taxAgentName, await getSettingsMap().catch(() => ({})));
  return generateIndividualPdf("EngagementAcceptance", "Engagement_Acceptance", data, { staffName }, options);
}

/** 4. Audit Report PDF */
async function generateAuditReportPDF(data, auditorName = "Compliance Auditor", options = {}) {
  return generateIndividualPdf("AuditReport", "Audit_Report", data, { auditorName }, options);
}

module.exports = {
  generateClientEngagementPDF,
  generateAdminReviewPDF,
  generateEngagementAcceptancePDF,
  generateAuditReportPDF,
  generateIndividualPdf,
  renderHtmlToPdf,
  savePdfRecord,
};
