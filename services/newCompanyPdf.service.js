/**
 * New Company PDF Service (PHP mPDF Powered)
 * ==========================================
 * Generates and tracks the Company Registration PDF package:
 * 1. Client Application PDF (21-section master document)
 * 2. Admin Compliance Review PDF (internal-only)
 * 3. Director Consent PDFs (one per officeholder)
 * 4. Member Consent PDFs (one per shareholder)
 *
 * Utilizes the lightweight, reliable PHP mPDF backend service instead of Puppeteer/Chromium.
 */

const fs = require("fs");
const path = require("path");
const NewCompanyPdf = require("../models/NewCompanyPdf");

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
 * Calls PHP mPDF backend service to render and save a Company Registration PDF
 * @param {string} type - 'ClientApplication' | 'AdminReview' | 'DirectorConsent' | 'MemberConsent'
 * @param {object} data - Full registration record data
 * @param {string} fullPath - Target physical file path
 * @param {string} fileName - File name
 * @param {string} relPath - Relative web path
 * @param {object} extra - Optional extra parameters (e.g. officeholder, shareholder)
 * @returns {Promise<boolean>}
 */
async function renderCompanyPdfViaPhp(type, data, fullPath, fileName, relPath, extra = {}) {
  // Ensure target directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const phpServerUrl = getPhpPdfServerUrl();
  const endpoint = `${phpServerUrl}/forms-pdf-generation/company-registration/generate.php`;

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
 * Save versioned PDF metadata to the database
 */
async function savePdfRecord(registrationId, type, fileName, filePath, personName = null, generatedBy = "System") {
  try {
    const existingCount = await NewCompanyPdf.count({
      where: { registrationId, type, ...(personName ? { personName } : {}) },
    });
    const version = existingCount + 1;

    return await NewCompanyPdf.create({
      registrationId,
      type,
      personName,
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
 * Create the PDF output directory for a given year/month
 */
function ensurePdfDir() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const pdfDir = path.join(__dirname, "../public/uploads/pdf", `${year}/${month}`);
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
  return { pdfDir, year, month };
}

/**
 * Sanitize a name for use in filenames
 */
function sanitizeName(name) {
  return (name || "Unknown").replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

/**
 * 1. Generate Client Application PDF (21-section master document)
 */
async function generateClientApplicationPDF(data) {
  const ref = data.referenceNumber || `CREG-${Date.now()}`;
  const { pdfDir, year, month } = ensurePdfDir();

  const fileName = `${ref}_Client_Application.pdf`;
  const fullPath = path.join(pdfDir, fileName);
  const relPath = `/uploads/pdf/${year}/${month}/${fileName}`;

  await renderCompanyPdfViaPhp("ClientApplication", data, fullPath, fileName, relPath);

  if (data.id) {
    await savePdfRecord(data.id, "ClientApplication", fileName, relPath);
  }

  return relPath;
}

/**
 * 2. Generate Admin Compliance Review PDF (internal-only)
 */
async function generateAdminReviewPDF(data) {
  const ref = data.referenceNumber || `CREG-${Date.now()}`;
  const { pdfDir, year, month } = ensurePdfDir();

  const fileName = `${ref}_Admin_Compliance_Review.pdf`;
  const fullPath = path.join(pdfDir, fileName);
  const relPath = `/uploads/pdf/${year}/${month}/${fileName}`;

  await renderCompanyPdfViaPhp("AdminReview", data, fullPath, fileName, relPath);

  if (data.id) {
    await savePdfRecord(data.id, "AdminReview", fileName, relPath);
  }

  return relPath;
}

/**
 * 3. Generate individual Director Consent PDFs (one per officeholder)
 * Returns array of generated PDF paths
 */
async function generateDirectorConsentPDFs(registration, officeholders) {
  const ref = registration.referenceNumber || `CREG-${Date.now()}`;
  const { pdfDir, year, month } = ensurePdfDir();
  const paths = [];

  for (const oh of officeholders) {
    if (!oh.consentAccepted) continue;

    const safeName = sanitizeName(oh.fullName);
    const fileName = `Director_Consent_${safeName}.pdf`;
    const fullPath = path.join(pdfDir, fileName);
    const relPath = `/uploads/pdf/${year}/${month}/${fileName}`;

    await renderCompanyPdfViaPhp("DirectorConsent", registration, fullPath, fileName, relPath, {
      officeholder: oh,
    });

    if (registration.id) {
      await savePdfRecord(registration.id, "DirectorConsent", fileName, relPath, oh.fullName);
    }

    paths.push({ name: oh.fullName, path: relPath });
  }

  return paths;
}

/**
 * 4. Generate individual Member Consent PDFs (one per shareholder)
 * Returns array of generated PDF paths
 */
async function generateMemberConsentPDFs(registration, shareholders) {
  const ref = registration.referenceNumber || `CREG-${Date.now()}`;
  const { pdfDir, year, month } = ensurePdfDir();
  const paths = [];

  for (const sh of shareholders) {
    if (!sh.consentAccepted) continue;

    const safeName = sanitizeName(sh.fullName);
    const fileName = `Member_Consent_${safeName}.pdf`;
    const fullPath = path.join(pdfDir, fileName);
    const relPath = `/uploads/pdf/${year}/${month}/${fileName}`;

    await renderCompanyPdfViaPhp("MemberConsent", registration, fullPath, fileName, relPath, {
      shareholder: sh,
    });

    if (registration.id) {
      await savePdfRecord(registration.id, "MemberConsent", fileName, relPath, sh.fullName);
    }

    paths.push({ name: sh.fullName, path: relPath });
  }

  return paths;
}

module.exports = {
  generateClientApplicationPDF,
  generateAdminReviewPDF,
  generateDirectorConsentPDFs,
  generateMemberConsentPDFs,
  renderHtmlToPdf,
  savePdfRecord,
};
