const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");

const uploadsStaticDir = path.join(__dirname, "../public/uploads");

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
    const cleanRelPath = reqPath.replace(/^\//, "");
    const diskPath = path.join(uploadsStaticDir, cleanRelPath);

    // 1. If exact file exists on disk, serve it immediately
    if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
      if (diskPath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${path.basename(diskPath)}"`);
      }
      return res.sendFile(diskPath);
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

    // 3. If .pdf requested, generate binary PDF from MySQL database
    if (reqPath.endsWith(".pdf")) {
      const htmlPath = diskPath.replace(/\.pdf$/, ".html");

      loadDependencies();
      const filename = path.basename(reqPath);

      // Match Individual Engagement reference or filename
      const nengMatch = filename.match(/(NENG-\d{4}-\d+|ENG-\d+)/i);
      const refNumber = nengMatch ? nengMatch[1] : null;

      if (models?.NewIndividualEngagement) {
        let engagement = null;
        if (refNumber) {
          engagement = await models.NewIndividualEngagement.findOne({
            where: {
              [Op.or]: [
                { referenceNumber: refNumber },
                { clientPdfPath: { [Op.like]: `%${filename}%` } },
                { adminPdfPath: { [Op.like]: `%${filename}%` } },
                { acceptancePdfPath: { [Op.like]: `%${filename}%` } },
                { auditPdfPath: { [Op.like]: `%${filename}%` } },
              ],
            },
            include: [
              "client",
              "services",
              "identity",
              "documents",
              "signatures",
              "auditLogs",
              "adminReview",
            ],
          });
        }

        // Also check by filename directly in NewIndividualPdf table
        if (!engagement && models.NewIndividualPdf) {
          const pdfRow = await models.NewIndividualPdf.findOne({
            where: { fileName: filename },
          });
          if (pdfRow?.engagementId) {
            engagement = await models.NewIndividualEngagement.findByPk(pdfRow.engagementId, {
              include: [
                "client",
                "services",
                "identity",
                "documents",
                "signatures",
                "auditLogs",
                "adminReview",
              ],
            });
          }
        }

        if (engagement) {
          let renderedHtml = null;
          if (filename.includes("Client_Engagement")) {
            renderedHtml = individualTemplates.renderClientEngagementHtml(engagement);
          } else if (filename.includes("Admin_Review")) {
            renderedHtml = individualTemplates.renderAdminReviewHtml(engagement);
          } else if (filename.includes("Engagement_Acceptance")) {
            renderedHtml = individualTemplates.renderEngagementAcceptanceHtml(engagement);
          } else if (filename.includes("Audit_Report")) {
            renderedHtml = individualTemplates.renderAuditReportHtml(engagement);
          }

          if (renderedHtml) {
            const dir = path.dirname(diskPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(htmlPath, renderedHtml);

            if (renderHtmlToPdf) {
              try {
                await renderHtmlToPdf(renderedHtml, diskPath);
              } catch (pdfGenErr) {
                console.warn("PDF compilation notice:", pdfGenErr.message);
              }
            }

            if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
              res.setHeader("Content-Type", "application/pdf");
              res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
              return res.sendFile(diskPath);
            }

            // If Puppeteer could not compile binary PDF, serve styled HTML fallback
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.send(renderedHtml);
          }
        }
      }

      // Match Company Registration reference or filename
      const cregMatch = filename.match(/(CREG-\d{4}-\d+)/i);
      const cregRef = cregMatch ? cregMatch[1] : null;

      if (models?.NewCompanyRegistration) {
        let registration = null;
        if (cregRef) {
          registration = await models.NewCompanyRegistration.findOne({
            where: {
              [Op.or]: [
                { referenceNumber: cregRef },
                { clientPdfPath: { [Op.like]: `%${filename}%` } },
                { adminPdfPath: { [Op.like]: `%${filename}%` } },
              ],
            },
            include: [
              "officeholders",
              "shareholders",
              "beneficialOwners",
              "documents",
              "consents",
              "adminReview",
              "pdfs",
              "auditLogs",
            ],
          });
        }

        if (registration) {
          let renderedHtml = null;
          if (filename.includes("Client_Application") || filename.includes("Application")) {
            renderedHtml = companyTemplates.renderClientApplicationHtml(registration);
          } else if (filename.includes("Admin_Review")) {
            renderedHtml = companyTemplates.renderAdminReviewHtml(registration);
          }

          if (renderedHtml) {
            const dir = path.dirname(diskPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(htmlPath, renderedHtml);

            if (renderHtmlToPdf) {
              try {
                await renderHtmlToPdf(renderedHtml, diskPath);
              } catch (pdfGenErr) {
                console.warn("Company PDF compilation notice:", pdfGenErr.message);
              }
            }

            if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
              res.setHeader("Content-Type", "application/pdf");
              res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
              return res.sendFile(diskPath);
            }

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.send(renderedHtml);
          }
        }
      }

      // If .html companion already exists on disk
      if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.sendFile(htmlPath);
      }
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
