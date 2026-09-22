/**
 * Individual PDF Service (PHP mPDF Powered)
 * =========================================
 * Generates and tracks 4 Individual Engagement PDF types in `new_individual_pdfs`:
 * 1. Client Engagement PDF (Client copy on submission)
 * 2. Admin Review PDF (Internal staff package on submission)
 * 3. Engagement Acceptance PDF (Client official acceptance notice on Tax Agent approval)
 * 4. Audit Report PDF (Compliance audit log report on demand)
 *
 * Utilizes the lightweight, reliable PHP mPDF backend service instead of Puppeteer/Chromium.
 */

const fs = require("fs");
const path = require("path");
const NewIndividualPdf = require("../models/NewIndividualPdf");

/**
 * Resolves the PHP mPDF service base URL from environment
 */
function getPhpPdfServerUrl() {
  return (
    process.env.PHP_PDF_SERVER_URL ||
    "http://localhost/myProjects/nextjs/financially-up/financially-up-php-backend"
  );
}

/**
 * Calls PHP mPDF backend service to render and save an Individual Engagement PDF
 * @param {string} type - 'ClientEngagement' | 'AdminReview' | 'EngagementAcceptance' | 'AuditReport'
 * @param {object} data - Full engagement record data
 * @param {string} fullPath - Target physical file path
 * @param {string} fileName - File name
 * @param {string} relPath - Relative web path
 * @param {object} extra - Optional extra parameters (e.g. staffName, auditorName)
 * @returns {Promise<boolean>}
 */
async function renderIndividualPdfViaPhp(type, data, fullPath, fileName, relPath, extra = {}) {
  // Ensure target directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const phpServerUrl = getPhpPdfServerUrl();
  const endpoint = `${phpServerUrl}/forms-pdf-generation/individual-engagement/generate.php`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        data,
        savePath: fullPath,
        fileName,
        relPath,
        ...extra,
      }),
    });

    if (!response.ok) {
      console.warn(`PHP PDF server returned HTTP ${response.status} for ${type}`);
    }

    const result = await response.json();
    if (result && result.success) {
      // If PHP returned base64 and file was not written directly on local disk, write it now
      if (result.pdfBase64 && !fs.existsSync(fullPath)) {
        const buffer = Buffer.from(result.pdfBase64, "base64");
        fs.writeFileSync(fullPath, buffer);
      }
      return true;
    } else {
      console.warn("PHP PDF generation error:", result?.error || "Unknown error");
    }
  } catch (err) {
    console.error("Failed to connect to PHP PDF generation service:", err.message);
  }

  return false;
}

/**
 * Generates PDF file from arbitrary HTML string using PHP mPDF service
 * @param {string} htmlContent
 * @param {string} fullPath
 * @param {string} title
 * @returns {Promise<boolean>}
 */
async function renderHtmlToPdf(htmlContent, fullPath, title = "Financially Up Document") {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: htmlContent,
        title,
        savePath: fullPath,
        fileName: path.basename(fullPath),
      }),
    });

    const result = await response.json();
    if (result && result.success) {
      if (result.pdfBase64 && !fs.existsSync(fullPath)) {
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
 * Saves versioned record into new_individual_pdfs database table
 */
async function savePdfRecord(engagementId, type, fileName, filePath, generatedBy = "System") {
  try {
    const existingCount = await NewIndividualPdf.count({
      where: { engagementId, type },
    });
    const version = existingCount + 1;

    return await NewIndividualPdf.create({
      engagementId,
      type,
      fileName,
      filePath,
      version,
      templateVersion: "v2.0.0 (mPDF)",
      generatedBy,
      generatedAt: new Date(),
      emailSent: false,
    });
  } catch (err) {
    console.error(`Failed to record PDF metadata for ${type}:`, err.message);
    return null;
  }
}

/**
 * 1. Generate Client Engagement PDF
 */
async function generateClientEngagementPDF(data) {
  const referenceNumber = data.referenceNumber || `NENG-${Date.now()}`;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const pdfDir = path.join(__dirname, "../public/uploads/pdf", `${year}/${month}`);
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const fileName = `${referenceNumber}_Client_Engagement.pdf`;
  const fullPath = path.join(pdfDir, fileName);
  const relPath = `/uploads/pdf/${year}/${month}/${fileName}`;

  await renderIndividualPdfViaPhp("ClientEngagement", data, fullPath, fileName, relPath);

  if (data.id) {
    await savePdfRecord(data.id, "ClientEngagement", fileName, relPath, "System");
  }

  return relPath;
}

/**
 * 2. Generate Admin Review PDF
 */
async function generateAdminReviewPDF(data) {
  const referenceNumber = data.referenceNumber || `NENG-${Date.now()}`;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const pdfDir = path.join(__dirname, "../public/uploads/pdf", `${year}/${month}`);
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const fileName = `${referenceNumber}_Admin_Review.pdf`;
  const fullPath = path.join(pdfDir, fileName);
  const relPath = `/uploads/pdf/${year}/${month}/${fileName}`;

  await renderIndividualPdfViaPhp("AdminReview", data, fullPath, fileName, relPath);

  if (data.id) {
    await savePdfRecord(data.id, "AdminReview", fileName, relPath, "System");
  }

  return relPath;
}

/**
 * 3. Generate Engagement Acceptance PDF
 */
async function generateEngagementAcceptancePDF(data, taxAgentName = "Financially Up Tax Agent") {
  const referenceNumber = data.referenceNumber || `NENG-${Date.now()}`;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const pdfDir = path.join(__dirname, "../public/uploads/pdf", `${year}/${month}`);
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const fileName = `${referenceNumber}_Engagement_Acceptance.pdf`;
  const fullPath = path.join(pdfDir, fileName);
  const relPath = `/uploads/pdf/${year}/${month}/${fileName}`;

  await renderIndividualPdfViaPhp("EngagementAcceptance", data, fullPath, fileName, relPath, {
    staffName: taxAgentName,
  });

  if (data.id) {
    await savePdfRecord(data.id, "EngagementAcceptance", fileName, relPath, taxAgentName);
  }

  return relPath;
}

/**
 * 4. Generate Audit Report PDF
 */
async function generateAuditReportPDF(data, auditorName = "Compliance Auditor") {
  const referenceNumber = data.referenceNumber || `NENG-${Date.now()}`;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const pdfDir = path.join(__dirname, "../public/uploads/pdf", `${year}/${month}`);
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const fileName = `${referenceNumber}_Audit_Report.pdf`;
  const fullPath = path.join(pdfDir, fileName);
  const relPath = `/uploads/pdf/${year}/${month}/${fileName}`;

  await renderIndividualPdfViaPhp("AuditReport", data, fullPath, fileName, relPath, {
    auditorName,
  });

  if (data.id) {
    await savePdfRecord(data.id, "AuditReport", fileName, relPath, auditorName);
  }

  return relPath;
}

module.exports = {
  generateClientEngagementPDF,
  generateAdminReviewPDF,
  generateEngagementAcceptancePDF,
  generateAuditReportPDF,
  renderHtmlToPdf,
  savePdfRecord,
};
