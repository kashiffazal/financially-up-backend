/**
 * New Company PDF Service
 * =======================
 * Generates and tracks the Company Registration PDF package:
 * 1. Client Application PDF (21-section master document)
 * 2. Admin Compliance Review PDF (internal-only)
 * 3. Director Consent PDFs (one per officeholder)
 * 4. Member Consent PDFs (one per shareholder)
 *
 * Uses Puppeteer for HTML-to-PDF rendering with Chrome headless.
 */

const fs = require("fs");
const path = require("path");
const { renderClientApplicationHtml } = require("../pdf/templates/company-registration/clientApplicationTemplate");
const { renderAdminReviewHtml } = require("../pdf/templates/company-registration/adminReviewTemplate");
const { renderDirectorConsentHtml } = require("../pdf/templates/company-registration/directorConsentTemplate");
const { renderMemberConsentHtml } = require("../pdf/templates/company-registration/memberConsentTemplate");
const NewCompanyPdf = require("../models/NewCompanyPdf");

/* Lazy-load Puppeteer to avoid startup failures */
let puppeteer = null;
try {
  puppeteer = require("puppeteer");
} catch (e) {
  console.warn("Puppeteer not loaded yet. Will load lazily when available.");
}

/**
 * Get Chrome / Chromium executable path for Puppeteer across Windows and Linux
 */
function getChromeExecutablePath() {
  const possiblePaths = [
    // Windows paths
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.USERPROFILE}\\.cache\\puppeteer\\chrome\\win64-151.0.7922.71\\chrome-win64\\chrome.exe`,
    // Linux / Hostinger / CloudLinux / Ubuntu paths
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "/usr/local/bin/chrome",
    "/usr/local/bin/chromium",
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  try {
    if (puppeteer && typeof puppeteer.executablePath === "function") {
      const pPath = puppeteer.executablePath();
      if (fs.existsSync(pPath)) return pPath;
    }
  } catch {}
  return null;
}

/**
 * Render HTML content to a PDF file using Puppeteer with HTML fallback
 */
async function renderHtmlToPdf(htmlContent, fullPath) {
  // Always ensure destination directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Always write HTML copy so document is never lost
  const htmlPath = fullPath.replace(/\.pdf$/, ".html");
  fs.writeFileSync(htmlPath, htmlContent);

  if (puppeteer) {
    try {
      const launchOptions = {
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--single-process",
          "--no-zygote",
        ],
      };
      const chromePath = getChromeExecutablePath();
      if (chromePath) {
        launchOptions.executablePath = chromePath;
      }
      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      await page.pdf({ path: fullPath, format: "A4", printBackground: true });
      await browser.close();
      return true;
    } catch (err) {
      console.warn("Puppeteer PDF render error (HTML fallback saved):", err.message);
    }
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
      templateVersion: "v1.0.0",
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

  const html = renderClientApplicationHtml(data);
  await renderHtmlToPdf(html, fullPath);

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

  const html = renderAdminReviewHtml(data);
  await renderHtmlToPdf(html, fullPath);

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

    const html = renderDirectorConsentHtml(oh, registration);
    await renderHtmlToPdf(html, fullPath);

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

    const html = renderMemberConsentHtml(sh, registration);
    await renderHtmlToPdf(html, fullPath);

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
  savePdfRecord,
};
