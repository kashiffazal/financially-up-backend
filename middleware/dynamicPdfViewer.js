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

function loadDependencies() {
  if (!models) {
    try {
      models = require("../models");
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
      return res.sendFile(diskPath);
    }

    // 2. If .pdf requested, check if .html companion exists
    if (reqPath.endsWith(".pdf")) {
      const htmlPath = diskPath.replace(/\.pdf$/, ".html");
      if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.sendFile(htmlPath);
      }

      // 3. On-demand document generation from MySQL database
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

            res.setHeader("Content-Type", "text/html; charset=utf-8");
            return res.send(renderedHtml);
          }
        }
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

