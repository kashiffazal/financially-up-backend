/**
 * Dynamic PDF & Document Viewer Middleware
 * ========================================
 * Ensures that all uploaded documents and generated PDFs (including historical
 * or on-demand documents) are served seamlessly:
 * 1. If file exists on disk -> serves it directly.
 * 2. If .pdf is requested and .html companion exists -> serves styled HTML.
 * 3. If neither exists on disk -> extracts reference number, fetches record from MySQL,
 *    renders the template on-the-fly, saves to disk, and serves immediately.
 */

const fs = require("fs");
const path = require("path");

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

    // 1. If exact file exists on disk, let express.static serve it or send it
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

      // Match Individual Engagement reference: NENG-YYYY-XXXXX or ENG-YYYY-XXXXX
      const nengMatch = filename.match(/(NENG-\d{4}-\d+|ENG-\d+)/i);
      if (nengMatch && models?.NewIndividualEngagement) {
        const refNumber = nengMatch[1];
        const engagement = await models.NewIndividualEngagement.findOne({
          where: { referenceNumber: refNumber },
          include: [
            "client",
            "services",
            "identity",
            "documents",
            "consents",
            "signatures",
            "auditLogs",
            "adminReview",
          ],
        });

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

      // Match Company Registration reference: CREG-YYYY-XXXXX
      const cregMatch = filename.match(/(CREG-\d{4}-\d+)/i);
      if (cregMatch && models?.NewCompanyRegistration) {
        const refNumber = cregMatch[1];
        const registration = await models.NewCompanyRegistration.findOne({
          where: { referenceNumber: refNumber },
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

    return next();
  } catch (error) {
    console.error("Dynamic PDF viewer error:", error);
    return next();
  }
}

module.exports = dynamicPdfViewer;
