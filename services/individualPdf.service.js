/**
 * Individual PDF Service
 * ======================
 * Complete Part 20 PDF Generation Specification Implementation.
 * Generates and tracks 4 PDF types in `new_individual_pdfs`:
 * 1. Client Engagement PDF (Client copy on submission)
 * 2. Admin Review PDF (Internal staff package on submission)
 * 3. Engagement Acceptance PDF (Client official acceptance notice on Tax Agent approval)
 * 4. Audit Report PDF (Compliance audit log report on demand)
 */

const fs = require("fs");
const path = require("path");
const { renderClientEngagementHtml } = require("../pdf/templates/individual-engagement/clientEngagementTemplate");
const { renderAdminReviewHtml } = require("../pdf/templates/individual-engagement/adminReviewTemplate");
const { renderEngagementAcceptanceHtml } = require("../pdf/templates/individual-engagement/engagementAcceptanceTemplate");
const { renderAuditReportHtml } = require("../pdf/templates/individual-engagement/auditReportTemplate");
const NewIndividualPdf = require("../models/NewIndividualPdf");

let puppeteer = null;
try {
  puppeteer = require("puppeteer");
} catch (e) {
  console.warn("Puppeteer not loaded yet. Will load lazily when available.");
}

/**
 * Gets Chrome / Chromium executable path for Puppeteer across Windows and Linux
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
 * Generates PDF file from HTML string using Puppeteer with HTML fallback
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

  const html = renderClientEngagementHtml(data);
  await renderHtmlToPdf(html, fullPath);

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

  const html = renderAdminReviewHtml(data);
  await renderHtmlToPdf(html, fullPath);

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

  const html = renderEngagementAcceptanceHtml(data);
  await renderHtmlToPdf(html, fullPath);

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

  const html = renderAuditReportHtml(data);
  await renderHtmlToPdf(html, fullPath);

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
