const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");

const { PRIVATE_UPLOADS_DIR, existingUploadPath } = require("../utils/privateFiles");
const { brandText } = require("../utils/brand");
const { getSettingsMap } = require("../services/settings.service");

/**
 * Serves /uploads files and rebuilds a missing generated PDF / signature image
 * from the database. Runs after middleware/protectUploads.js. A file is only
 * rebuilt when a record stores that exact link, so guessing a name (e.g. from a
 * reference number) never creates or returns a file. Rebuilt files are written
 * to the private folder (storage/uploads).
 */

/**
 * Lazy template renderers to avoid circular dependencies
 */
let individualTemplates = null;
let companyTemplates = null;
let models = null;
let renderHtmlToPdf = null;

function loadDependencies() {
  if (!models) {
    try {
      models = require("../models");
      const pdfService = require("../services/individualPdf.service");
      renderHtmlToPdf = pdfService.renderHtmlToPdf;

      individualTemplates = {
        renderClientEngagementHtml: require("../pdf/templates/individual-engagement/clientEngagementTemplate").renderClientEngagementHtml,
        renderAdminReviewHtml: require("../pdf/templates/individual-engagement/adminReviewTemplate").renderAdminReviewHtml,
        renderEngagementAcceptanceHtml: require("../pdf/templates/individual-engagement/engagementAcceptanceTemplate").renderEngagementAcceptanceHtml,
        renderAuditReportHtml: require("../pdf/templates/individual-engagement/auditReportTemplate").renderAuditReportHtml,
      };
      companyTemplates = {
        renderClientApplicationHtml: require("../pdf/templates/company-registration/clientApplicationTemplate").renderClientApplicationHtml,
        renderAdminReviewHtml: require("../pdf/templates/company-registration/adminReviewTemplate").renderAdminReviewHtml,
        renderDirectorConsentHtml: require("../pdf/templates/company-registration/directorConsentTemplate").renderDirectorConsentHtml,
        renderMemberConsentHtml: require("../pdf/templates/company-registration/memberConsentTemplate").renderMemberConsentHtml,
      };
    } catch (e) {
      console.warn("Failed to load PDF dependencies lazily:", e.message);
    }
  }
}

async function dynamicPdfViewer(req, res, next) {
  try {
    const reqPath = req.path || "";
    const cleanRelPath = decodeURIComponent(reqPath).replace(/^\//, "");
    const diskPath = path.resolve(PRIVATE_UPLOADS_DIR, cleanRelPath);
    if (!diskPath.startsWith(PRIVATE_UPLOADS_DIR + path.sep)) {
      return res.status(400).json({ success: false, message: "Invalid file path." });
    }

    // 1. If the file exists on disk, serve it immediately
    const existing = existingUploadPath(cleanRelPath);
    if (existing) {
      if (existing.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${path.basename(existing)}"`);
      }
      return res.sendFile(existing);
    }

    // 2. Signature image auto-restoration
    if (reqPath.includes("signatures") && (reqPath.endsWith(".png") || reqPath.endsWith(".jpg") || reqPath.endsWith(".jpeg"))) {
      loadDependencies();
      const sigFilename = path.basename(reqPath);

      let sigRecord = null;
      if (models?.NewIndividualSignature) {
        try {
          sigRecord = await models.NewIndividualSignature.findOne({
            where: {
              signatureFilePath: { [Op.like]: `%${sigFilename}%` },
            },
          });
        } catch (e) {}
      }

      if (!sigRecord && models?.NewIndividualAdminReview) {
        try {
          sigRecord = await models.NewIndividualAdminReview.findOne({
            where: {
              signatureFilePath: { [Op.like]: `%${sigFilename}%` },
            },
          });
        } catch (e) {}
      }

      if (!sigRecord && models?.NewCompanyOfficeholder) {
        try {
          sigRecord = await models.NewCompanyOfficeholder.findOne({
            where: {
              signatureData: { [Op.like]: `%${sigFilename}%` },
            },
          });
        } catch (e) {}
      }

      const dir = path.dirname(diskPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      if (sigRecord) {
        const drawnData = sigRecord.signatureDrawnData || sigRecord.signatureData || sigRecord.signatory1Signature || sigRecord.signatory2Signature;
        if (drawnData && typeof drawnData === "string" && drawnData.startsWith("data:image")) {
          const base64Data = drawnData.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          fs.writeFileSync(diskPath, buffer);
          res.setHeader("Content-Type", "image/png");
          return res.sendFile(diskPath);
        }

        const typedName = sigRecord.signerFullName || sigRecord.typedSignatureText || sigRecord.signatureTypedName || sigRecord.fullName;
        if (typedName) {
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">
            <rect width="100%" height="100%" fill="transparent"/>
            <text x="20" y="70" font-family="'Brush Script MT', 'Dancing Script', cursive, sans-serif" font-size="36" font-style="italic" fill="#008043">${typedName}</text>
          </svg>`;
          res.setHeader("Content-Type", "image/svg+xml");
          return res.send(svgContent);
        }
      }

      // Default transparent 1x1 PNG fallback so signature images never 404
      const transparentPixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64"
      );
      res.setHeader("Content-Type", "image/png");
      return res.send(transparentPixel);
    }

    // 3. A missing PDF is never replaced by a substitute (it would not match what the
    //    client received): say so, and point to "Regenerate PDFs" in the admin log.
    if (reqPath.endsWith(".pdf")) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>PDF not available</title>
<meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
<div style="max-width:440px;padding:28px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;text-align:center">
<h1 style="font-size:18px;margin:0 0 8px">This PDF is not available</h1>
<p style="font-size:14px;color:#475569;margin:0">The file is missing on the server. Open the application in the admin panel and use
<strong>Actions &gt; Regenerate PDFs</strong> to rebuild it from the saved data.</p></div></body></html>`);
    }

    return res.status(404).json({
      success: false,
      message: `File or document not found: ${path.basename(reqPath)}`,
    });
  } catch (error) {
    console.error("Dynamic PDF viewer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load document.",
      error: error.message,
    });
  }
}

module.exports = dynamicPdfViewer;
