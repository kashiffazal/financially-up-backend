/**
 * PDF Engine (shared by the Individual Engagement and Company Registration PDFs)
 * ============================================================================
 * Renders one PDF with the PHP mPDF service and reports honestly whether the
 * file now exists. Everything a PDF depends on is passed in explicitly, so the
 * same inputs always give the same PDF:
 *
 *   data      the application (signature files are embedded at send time)
 *   extra     template extras (staffName, officeholder, ...)
 *   settings  company details (Settings > Company Details)
 *   asOf      the PDF's "today" (dates, financial year) - ISO string
 *
 * These are saved as the PDF's snapshot (new_*_pdfs.snapshot) so
 * "Regenerate PDFs" can rebuild an identical file (services/pdfRegenerate.service.js).
 */

const fs = require("fs");
const path = require("path");
const { embedSignatures, pdfServiceHeaders } = require("../utils/pdfServiceRequest");
const { privateMonthDir, securePdfName, toUploadsRelPath, PRIVATE_UPLOADS_DIR } = require("../utils/privateFiles");
const { phpPdfServerUrl, apiUrl } = require("../utils/siteConfig");
const { getSettingsMap } = require("./settings.service");

/**
 * Where to write the PDF: the exact file a record already links to (regeneration),
 * otherwise a new unguessable name in this month's private folder.
 * @returns {{ fullPath: string, fileName: string, relPath: string }}
 */
const pdfTarget = ({ reference, label, targetRelPath }) => {
  const rel = targetRelPath ? toUploadsRelPath(targetRelPath) : null;
  if (rel && /\.pdf$/i.test(rel)) {
    const fullPath = path.resolve(PRIVATE_UPLOADS_DIR, rel);
    if (fullPath.startsWith(PRIVATE_UPLOADS_DIR + path.sep)) {
      return { fullPath, fileName: path.basename(fullPath), relPath: `/uploads/${rel}` };
    }
  }
  const { dir, urlBase } = privateMonthDir("pdf");
  const fileName = securePdfName(reference, label);
  return { fullPath: path.join(dir, fileName), fileName, relPath: `${urlBase}/${fileName}` };
};

/** Inputs of a generation: fixed values for a rebuild, current ones otherwise. */
const pdfInputs = async ({ asOf, settings } = {}) => ({
  asOf: asOf || new Date().toISOString(),
  settings: settings || (await getSettingsMap().catch(() => ({}))),
});

/**
 * Render one PDF to `fullPath`.
 * @param {"individual-engagement"|"company-registration"} form
 * @returns {Promise<boolean>} true only when the file exists afterwards
 */
const renderPdf = async ({ form, type, data, extra = {}, asOf, settings, fullPath, fileName, relPath }) => {
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const endpoint = `${phpPdfServerUrl()}/forms-pdf-generation/${form}/generate.php`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: pdfServiceHeaders(),
      body: JSON.stringify({
        apiUrl: apiUrl(),
        settings,
        asOf,
        type,
        // Signature images travel inside the request (the PHP server can't read this disk)
        data: embedSignatures(data),
        savePath: fullPath,
        fileName,
        relPath,
        ...extra,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!result?.success) {
      console.warn(`[PDF] ${type} not generated: ${result?.error || `PHP service answered HTTP ${response.status}`}`);
      return false;
    }
    // Keep the copy PHP returned (it may run on another server; a rebuild replaces the old file)
    if (result.pdfBase64) fs.writeFileSync(fullPath, Buffer.from(result.pdfBase64, "base64"));
    return fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0;
  } catch (error) {
    console.error(`[PDF] ${type} not generated - PHP service unreachable:`, error.message);
    return false;
  }
};

/** JSON snapshot saved with the PDF history row. */
const snapshotOf = ({ type, data, extra, settings, asOf }) => {
  try {
    return JSON.stringify({ type, data, extra: extra || {}, settings, asOf });
  } catch {
    return null;
  }
};

const parseSnapshot = (value) => {
  try {
    const parsed = value ? JSON.parse(value) : null;
    return parsed && parsed.data && parsed.asOf ? parsed : null;
  } catch {
    return null;
  }
};

module.exports = { pdfTarget, pdfInputs, renderPdf, snapshotOf, parseSnapshot };
