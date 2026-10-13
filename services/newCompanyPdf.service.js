/**
 * New Company PDF Service (PHP mPDF Powered)
 * ==========================================
 * Generates and tracks the Company Registration PDF package:
 * 1. Client Application PDF (21-section master document)       - at submission
 * 2. Director Consent PDFs (one per officeholder)              - at submission
 * 3. Member Consent PDFs (one per shareholder)                  - at submission
 * 4. Admin Compliance Review PDF (internal-only)                - at each decision
 * 5. Notice of Acceptance (client + reviewer signatures)        - when approved
 *
 * Rendering goes through services/pdfEngine.js. Each generator returns the PDF's
 * link, or null when the PDF could not be made (nothing is recorded then, so the
 * record shows the PDF as missing and "Regenerate PDFs" can rebuild it).
 * Options (asOf, settings, targetRelPath, generatedBy, version) are used by
 * services/pdfRegenerate.service.js to rebuild an identical file.
 */

const fs = require("fs");
const path = require("path");
const { pdfServiceHeaders, pdfServiceContext } = require("../utils/pdfServiceRequest");
const { pdfTarget, pdfInputs, renderPdf, snapshotOf } = require("./pdfEngine");
const NewCompanyPdf = require("../models/NewCompanyPdf");

const getPhpPdfServerUrl = () => require("../utils/siteConfig").phpPdfServerUrl();

/**
 * Render arbitrary HTML content to a PDF file using PHP mPDF service
 */
async function renderHtmlToPdf(htmlContent, fullPath, title = "Company Registration Document") {
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

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
 * Save versioned PDF metadata (with the generation snapshot)
 */
async function savePdfRecord(registrationId, type, fileName, filePath, personName = null, generatedBy = "System", { snapshot = null, version = null } = {}) {
  try {
    const nextVersion =
      version || (await NewCompanyPdf.count({ where: { registrationId, type, ...(personName ? { personName } : {}) } })) + 1;
    return await NewCompanyPdf.create({
      registrationId,
      type,
      personName,
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

/**
 * Converts a Sequelize instance (with includes) into a plain JSON object for PHP
 */
function toPlain(record) {
  if (!record) return {};
  return typeof record.toJSON === "function" ? record.toJSON() : record;
}

/**
 * Sanitize a name for use in filenames
 */
function sanitizeName(name) {
  return (name || "Unknown").replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

/** Render one Company Registration PDF and record it. @returns {Promise<string|null>} link or null */
async function generateCompanyPdf(type, label, data, extra = {}, personName = null, options = {}) {
  const target = pdfTarget({ reference: data.referenceNumber || `CREG-${Date.now()}`, label, targetRelPath: options.targetRelPath });
  const inputs = await pdfInputs(options);
  const ok = await renderPdf({ form: "company-registration", type, data, extra, ...inputs, ...target });
  if (!ok) return null;
  if (data.id) {
    await savePdfRecord(data.id, type, target.fileName, target.relPath, personName, options.generatedBy || personName || "System", {
      snapshot: snapshotOf({ type, data, extra, ...inputs }),
      version: options.version,
    });
  }
  return target.relPath;
}

/** 1. Client Application PDF (21-section master document) */
async function generateClientApplicationPDF(record, options = {}) {
  return generateCompanyPdf("ClientApplication", "Client_Application", toPlain(record), {}, null, options);
}

/** 2. Admin Compliance Review PDF (internal-only) */
async function generateAdminReviewPDF(record, options = {}) {
  return generateCompanyPdf("AdminReview", "Admin_Compliance_Review", toPlain(record), {}, null, options);
}

/** 2b. Notice of Acceptance: signed by the client signatory(ies) and the reviewer. Needs record.adminReview. */
async function generateAcceptancePDF(record, options = {}) {
  return generateCompanyPdf("Acceptance", "Acceptance", toPlain(record), {}, null, options);
}

/** 3. Director Consent PDFs (one per consenting officeholder). Returns [{ name, path }] of the ones made. */
async function generateDirectorConsentPDFs(record, officeholderRecords, options = {}) {
  const registration = toPlain(record);
  const paths = [];
  for (const oh of (officeholderRecords || []).map(toPlain)) {
    if (!oh.consentAccepted) continue;
    const relPath = await generateCompanyPdf(
      "DirectorConsent",
      `Director_Consent_${sanitizeName(oh.fullName)}`,
      registration,
      { officeholder: oh },
      oh.fullName,
      options
    );
    if (relPath) paths.push({ name: oh.fullName, path: relPath });
  }
  return paths;
}

/** 4. Member Consent PDFs (one per consenting shareholder). Returns [{ name, path }] of the ones made. */
async function generateMemberConsentPDFs(record, shareholderRecords, options = {}) {
  const registration = toPlain(record);
  const paths = [];
  for (const sh of (shareholderRecords || []).map(toPlain)) {
    if (!sh.consentAccepted) continue;
    const relPath = await generateCompanyPdf(
      "MemberConsent",
      `Member_Consent_${sanitizeName(sh.fullName)}`,
      registration,
      { shareholder: sh },
      sh.fullName,
      options
    );
    if (relPath) paths.push({ name: sh.fullName, path: relPath });
  }
  return paths;
}

module.exports = {
  generateClientApplicationPDF,
  generateAdminReviewPDF,
  generateAcceptancePDF,
  generateDirectorConsentPDFs,
  generateMemberConsentPDFs,
  generateCompanyPdf,
  sanitizeName,
  renderHtmlToPdf,
  savePdfRecord,
};
