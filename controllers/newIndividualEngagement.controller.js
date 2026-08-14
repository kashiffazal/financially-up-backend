/**
 * NewIndividualEngagement Controller
 * ==================================
 * Handles API endpoints for the New Individual Client Engagement Form:
 * 1. createEngagement (POST /api/new-individual-engagements)
 * 2. getEngagements (GET /api/new-individual-engagements)
 * 3. getEngagementById (GET /api/new-individual-engagements/:id)
 * 4. submitAdminDecision (PUT /api/admin/new-individual-engagements/:id/decision)
 */

const {
  sequelize,
  NewIndividualClient,
  NewIndividualEngagement,
  NewIndividualService,
  NewIndividualIdentity,
  NewIndividualDocument,
  NewIndividualConsent,
  NewIndividualSignature,
  NewIndividualAuditLog,
  NewIndividualAdminReview,
} = require("../models");

const { saveBase64Signature } = require("../services/storage.service");
const {
  generateClientEngagementPDF,
  generateAdminReviewPDF,
  generateEngagementAcceptancePDF,
  generateAuditReportPDF,
} = require("../services/individualPdf.service");
const { sendClientSubmissionEmail, sendAdminDecisionEmail } = require("../services/individualEmail.service");
const path = require("path");

function calculateAutomatedRiskLevel(body) {
  let score = 0;
  if (body.atoIssues === "Yes") score += 3;
  if (body.overdueBas === "Yes") score += 2;
  if (body.identityMethod === "No Photo ID") score += 2;
  if (body.isSelf === "No") score += 2;
  if (body.expectedTurnover && parseFloat(body.expectedTurnover) > 500000) score += 2;
  if (body.foreignCountry || body.foreignInfo) score += 1;

  if (score >= 6) return "Unacceptable";
  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

/**
 * Creates a new engagement submission from Phase 1 Client Form.
 */
async function createEngagement(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const body = req.body || {};

    // Generate unique reference number e.g. NENG-2026-9812
    const refSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `NENG-${new Date().getFullYear()}-${refSuffix}`;

    // 1. Create or Find Client
    const [client] = await NewIndividualClient.findOrCreate({
      where: { email: body.email || "client@example.com" },
      defaults: {
        fullName: body.fullName || body.name || "Client",
        mobile: body.mobile || body.phone || "",
        dateOfBirth: body.dateOfBirth || null,
        birthCountry: body.birthCountry || null,
        birthCity: body.birthCity || null,
        occupation: body.occupation || null,
        employmentStatus: body.employmentStatus || null,
        tfn: body.tfn || null,
        maskedTfn: body.tfn ? `*** *** ${String(body.tfn).replace(/\s/g, "").slice(-3)}` : null,
      },
      transaction,
    });

    // 2. Create Master Engagement Record
    const engagement = await NewIndividualEngagement.create(
      {
        clientId: client.id,
        referenceNumber,
        status: "Pending Review",
        entityService: body.entityService || "No",
        isAustralianCitizen: body.isAustralianCitizen === "Yes" || body.isAustralianCitizen === true,
        taxResidency: body.taxResidency || "Australian Tax Resident",
        hasPreviousName: body.hasPreviousName || "No",
        previousNames: body.previousNames || null,
        address: body.address || body.residentialAddress || null,
        postalAddress: body.postalAddress || null,
        citizenshipCountry: body.citizenshipCountry || null,
        visaStatus: body.visaStatus || null,
        visaSubclass: body.visaSubclass || null,
        visaExpiry: body.visaExpiry || null,
        arrivalDate: body.arrivalDate || null,
        residentArrival: body.residentArrival || null,
        residentDeparture: body.residentDeparture || null,
        foreignCountry: body.foreignCountry || null,
        foreignInfo: body.foreignInfo || null,
        hasSpouse: body.hasSpouse || "No",
        spouseName: body.spouseName || null,
        spouseDob: body.spouseDob || null,
        spouseIncome: body.spouseIncome ? parseFloat(body.spouseIncome) : null,
        prepareSpouseReturn: body.prepareSpouseReturn || "No",
        hasDependants: body.hasDependants || "No",
        dependantCount: body.dependantCount ? parseInt(body.dependantCount, 10) : 0,
        hadPreviousAccountant: body.hadPreviousAccountant || "No",
        previousFirm: body.previousFirm || null,
        reasonForChange: body.reasonForChange || null,
        authorisePreviousAdvisor: body.authorisePreviousAdvisor || null,
        atoIssues: body.atoIssues || "No",
        atoExplanation: body.atoExplanation || null,
        noticeDate: body.noticeDate || null,
        dueDate: body.dueDate || null,
        // Sole Trader
        existingAbn: body.existingAbn || null,
        abnStatus: body.abnStatus || null,
        basPeriod: body.basPeriod || null,
        reportingFrequency: body.reportingFrequency || null,
        gstStatus: body.gstStatus || null,
        overdueBas: body.overdueBas || "No",
        recordsComplete: body.recordsComplete || "Yes",
        recordsMaintainedBy: body.recordsMaintainedBy || null,
        hasPayroll: body.hasPayroll || "No",
        businessStartDate: body.businessStartDate || null,
        businessActivity: body.businessActivity || null,
        businessLocation: body.businessLocation || null,
        expectedTurnover: body.expectedTurnover ? parseFloat(body.expectedTurnover) : null,
        profitExpectation: body.profitExpectation || "Yes",
        hasEmployees: body.hasEmployees || "No",
        registerGST: body.registerGST || "No",
        registerPAYG: body.registerPAYG || "No",
        gstAbn: body.gstAbn || null,
        gstEffectiveDate: body.gstEffectiveDate || null,
        gstTurnover: body.gstTurnover ? parseFloat(body.gstTurnover) : null,
        accountingMethod: body.accountingMethod || null,
        fuelTaxCredits: body.fuelTaxCredits || "No",
        imports: body.imports || "No",
        exports: body.exports || "No",
        digitalSales: body.digitalSales || "No",
        // Representative & Bank
        isSelf: body.isSelf || "Yes",
        repName: body.repName || null,
        relationship: body.relationship || null,
        authorityDesc: body.authorityDesc || null,
        needBank: body.needBank || "Yes",
        accountName: body.accountName || null,
        bsb: body.bsb || null,
        accountNumber: body.accountNumber || null,
        confirmOwnership: body.confirmOwnership || true,
        riskLevel: calculateAutomatedRiskLevel(body),
        submittedAt: new Date(),
      },
      { transaction }
    );

    // 3. Create Services
    let serviceList = [];
    try {
      const rawServices = typeof body.services === "string" ? JSON.parse(body.services) : body.services;
      serviceList = Array.isArray(rawServices) && rawServices.length > 0 ? rawServices : ["Individual Income Tax Return"];
    } catch (e) {
      serviceList = ["Individual Income Tax Return"];
    }

    for (const sName of serviceList) {
      await NewIndividualService.create(
        { engagementId: engagement.id, serviceName: sName },
        { transaction }
      );
    }

    // 4. Identity Verification
    await NewIndividualIdentity.create(
      {
        engagementId: engagement.id,
        identityMethod: body.identityMethod || "Upload ID",
        noPhotoIdReason: body.noPhotoIdReason || null,
        biometricConsent: body.biometricConsent || true,
        dvsStatus: "Pass",
      },
      { transaction }
    );

    // 5. Signature Storage
    let sigPath = null;
    const rawSig = body.signature || body.signatureDrawnData;
    if (rawSig) {
      sigPath = saveBase64Signature(rawSig, "client");
    } else if (req.files && req.files.signatureUploadedFile && req.files.signatureUploadedFile.length > 0) {
      const sigFile = req.files.signatureUploadedFile[0];
      const mFolder = path.basename(path.dirname(sigFile.path));
      const yFolder = path.basename(path.dirname(path.dirname(sigFile.path)));
      sigPath = `/uploads/documents/${yFolder}/${mFolder}/${sigFile.filename}`;
    }

    await NewIndividualSignature.create(
      {
        engagementId: engagement.id,
        signerType: "Client",
        signerFullName: body.signerFullName || client.fullName,
        signatureMethod: body.signatureType || "draw",
        signatureFilePath: sigPath,
        typedSignatureText: body.typedSignatureText || null,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "",
        bindingConfirmed: true,
      },
      { transaction }
    );

    // 6. Consents with Audit Tracking (documentType, version, openedAt, acceptedAt)
    const consentEntries = [
      {
        consentType: "ScheduleTerms",
        accepted: body.consentScheduleTerms === true || body.consentScheduleTerms === "true" || body.consentScheduleTerms === 1,
        documentType: body.termsDocumentType || "TERMS",
        version: body.termsVersion || "2.1",
        openedAt: body.termsOpenedAt ? new Date(body.termsOpenedAt) : null,
        acceptedAt: body.termsAcceptedAt ? new Date(body.termsAcceptedAt) : new Date(),
      },
      {
        consentType: "PrivacyNotice",
        accepted: body.consentPrivacy === true || body.consentPrivacy === "true" || body.consentPrivacy === 1,
        documentType: body.privacyDocumentType || "PRIVACY",
        version: body.privacyVersion || "2.1",
        openedAt: body.privacyOpenedAt ? new Date(body.privacyOpenedAt) : null,
        acceptedAt: body.privacyAcceptedAt ? new Date(body.privacyAcceptedAt) : new Date(),
      },
      {
        consentType: "AtoAuthority",
        accepted: body.consentAtoAuthority === true || body.consentAtoAuthority === "true" || body.consentAtoAuthority === 1,
        documentType: "ATO_AUTHORITY",
        version: "1.0",
        openedAt: null,
        acceptedAt: new Date(),
      },
      {
        consentType: "CloudProcessing",
        accepted: body.consentCloudOverseas === "Yes",
        documentType: "CLOUD_PROCESSING",
        version: "1.0",
        openedAt: null,
        acceptedAt: new Date(),
      },
      {
        consentType: "BiometricConsent",
        accepted: body.consentBiometric === true || body.consentBiometric === "true" || body.consentBiometric === 1,
        documentType: "BIOMETRIC",
        version: "1.0",
        openedAt: null,
        acceptedAt: new Date(),
      },
    ];

    for (const entry of consentEntries) {
      if (entry.accepted) {
        await NewIndividualConsent.create(
          {
            engagementId: engagement.id,
            consentType: entry.consentType,
            documentType: entry.documentType,
            version: entry.version,
            openedAt: entry.openedAt,
            accepted: true,
            acceptedAt: entry.acceptedAt,
          },
          { transaction }
        );
      }
    }

    // 6b. Process Multer Uploaded Documents (Multer)
    if (req.files) {
      const docCategories = {
        primaryId: "PrimaryID",
        supportingId: "SupportingID",
        selfie: "SelfieID",
        visaEvidence: "VisaEvidence",
        atoDocuments: "ATONotice",
        authorityDoc: "AuthorityDocument",
        signatureUploadedFile: "Signature",
      };

      for (const [fieldName, fileArr] of Object.entries(req.files)) {
        if (Array.isArray(fileArr) && fileArr.length > 0) {
          for (const file of fileArr) {
            const monthFolder = path.basename(path.dirname(file.path));
            const yearFolder = path.basename(path.dirname(path.dirname(file.path)));
            const relPath = `/uploads/documents/${yearFolder}/${monthFolder}/${file.filename}`;

            await NewIndividualDocument.create(
              {
                engagementId: engagement.id,
                documentCategory: docCategories[fieldName] || "Other",
                fileName: file.originalname || file.filename,
                filePath: relPath,
                fileSize: file.size,
                mimeType: file.mimetype,
              },
              { transaction }
            );

            if (fieldName === "primaryId") {
              await NewIndividualIdentity.update(
                { primaryIdPath: relPath },
                { where: { engagementId: engagement.id }, transaction }
              );
            } else if (fieldName === "supportingId") {
              await NewIndividualIdentity.update(
                { supportingIdPath: relPath },
                { where: { engagementId: engagement.id }, transaction }
              );
            }
          }
        }
      }
    }

    // 7. Audit Log
    await NewIndividualAuditLog.create(
      {
        engagementId: engagement.id,
        action: "Individual Client Engagement Form Submitted",
        performedBy: client.fullName,
        details: `Reference ${referenceNumber} generated. Status set to Pending Review.`,
      },
      { transaction }
    );

    await transaction.commit();

    // 8. Async PDF Generation & Email Dispatch
    try {
      const fullData = await NewIndividualEngagement.findByPk(engagement.id, {
        include: ["client", "services", "identity", "documents", "consents", "signatures", "auditLogs", "adminReview"],
      });
      
      const clientPdfPath = await generateClientEngagementPDF(fullData);
      const adminPdfPath = await generateAdminReviewPDF(fullData);
      
      // Update PDF Paths on engagement record
      await engagement.update({ clientPdfPath, adminPdfPath });

      // Dispatch Email with Client PDF Attachment
      const fullPdfPath = path.join(__dirname, "../public", clientPdfPath);
      sendClientSubmissionEmail(client.email, client.fullName, referenceNumber, fullPdfPath);
    } catch (pdfErr) {
      console.error("Async PDF/Email error:", pdfErr);
    }

    return res.status(201).json({
      success: true,
      message: "Engagement form submitted successfully.",
      referenceNumber,
      engagementId: engagement.id,
      status: "Pending Review",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating new individual engagement:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit engagement form.",
      error: error.message,
    });
  }
}

/**
 * Gets all engagements for Admin Portal (/admin/individual-engagement-new).
 */
async function getEngagements(req, res) {
  try {
    const engagements = await NewIndividualEngagement.findAll({
      include: ["client", "services", "identity", "documents", "signatures", "adminReview"],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({
      success: true,
      data: engagements,
    });
  } catch (error) {
    console.error("Error fetching engagements:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch engagements." });
  }
}

/**
 * Gets a single engagement by ID for Admin Review modal.
 */
async function getEngagementById(req, res) {
  try {
    const { id } = req.params;
    const engagement = await NewIndividualEngagement.findByPk(id, {
      include: ["client", "services", "identity", "documents", "consents", "signatures", "auditLogs", "adminReview"],
    });

    if (!engagement) {
      return res.status(404).json({ success: false, message: "Engagement not found." });
    }

    return res.status(200).json({ success: true, data: engagement });
  } catch (error) {
    console.error("Error fetching engagement details:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch engagement details." });
  }
}

/**
 * Tax Agent Phase 2 Decision Execution (/admin/individual-engagement-new).
 */
async function submitAdminDecision(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const files = req.files || {};

    const engagement = await NewIndividualEngagement.findByPk(id, {
      include: ["client"],
    });

    if (!engagement) {
      return res.status(404).json({ success: false, message: "Engagement not found." });
    }

    const staffName = body.staffMemberName || body.taxAgentName || "Financially Up Tax Agent";
    const decision = body.decision || body.status || "Accepted";
    const riskLevel = body.riskLevel || engagement.riskLevel || "Low";
    const reviewNotes = typeof body.reviewNotes === "string" ? body.reviewNotes : (body.notes || "");
    const sigType = body.staffSignatureType || "draw";
    const userRole = body.userRole || "Accountant";
    const riskRationale = body.riskRationale || null;
    
    let checklistItems = body.admChecklist;
    if (typeof checklistItems === "string") {
      try { checklistItems = JSON.parse(checklistItems); } catch (e) { checklistItems = [checklistItems]; }
    }

    // 1. Process Staff Signature
    let staffSigPath = null;
    if (sigType === "draw" && body.staffDrawnSignature) {
      staffSigPath = saveBase64Signature(body.staffDrawnSignature, "signatures");
    } else if (sigType === "upload" && files.staffUploadedSignature && files.staffUploadedSignature[0]) {
      const f = files.staffUploadedSignature[0];
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      staffSigPath = `/uploads/signatures/${year}/${month}/${f.filename}`;
    }

    if (staffSigPath || body.staffTypedSignature) {
      await NewIndividualSignature.create({
        engagementId: engagement.id,
        signerType: "TaxAgent",
        signerFullName: staffName,
        signatureMethod: sigType,
        signatureFilePath: staffSigPath,
        ipAddress: req.ip || "127.0.0.1",
        tasaDeclarationAccepted: true,
        etaDeclarationAccepted: true,
      });
    }

    // 2. Insert Audit Log Entry
    await NewIndividualAuditLog.create({
      engagementId: engagement.id,
      action: `Phase 2 Review: ${decision}`,
      performedBy: staffName,
      details: `Role: ${body.userRole || "Accountant"} | Risk: ${riskLevel} | Notes: ${reviewNotes}`,
      ipAddress: req.ip || "127.0.0.1",
    });

    // 3. Fetch Full Data & Regenerate PDFs
    const fullData = await NewIndividualEngagement.findByPk(engagement.id, {
      include: ["client", "services", "identity", "documents", "consents", "signatures", "auditLogs", "adminReview"],
    });

    let adminPdfPath = null;
    let acceptancePdfPath = null;
    let auditPdfPath = null;

    try {
      adminPdfPath = await generateAdminReviewPDF(fullData);
    } catch (err) {
      console.error("Error regenerating Admin Review PDF:", err);
    }

    if (decision === "Accept" || decision === "Accepted" || decision === "Conditional Accept") {
      try {
        acceptancePdfPath = await generateEngagementAcceptancePDF(fullData, staffName);
      } catch (err) {
        console.error("Error generating Acceptance PDF:", err);
      }
    }

    try {
      auditPdfPath = await generateAuditReportPDF(fullData, staffName);
    } catch (err) {
      console.error("Error generating Audit Report PDF:", err);
    }

    // Map decision enum value for Sequelize model
    const statusEnumMap = {
      "Accept": "Accepted",
      "Accepted": "Accepted",
      "Conditional Accept": "Conditional Accept",
      "Request Information": "Request Information",
      "Enhanced Monitoring": "Enhanced Monitoring",
      "Escalate": "Escalate",
      "Declined": "Declined",
      "Decline": "Declined",
    };
    const mappedStatus = statusEnumMap[decision] || decision || "Accepted";

    // Upsert into new_individual_admin_reviews table
    const [adminReviewRecord] = await NewIndividualAdminReview.upsert({
      engagementId: engagement.id,
      userRole,
      reviewerName: staffName,
      decision,
      riskLevel,
      riskRationale,
      checklistItems: checklistItems || [],
      amlDesignatedServiceInvolved: body.amlDesignatedServiceInvolved || "No",
      amlBeneficialOwnershipVerified: body.amlBeneficialOwnershipVerified || "Yes",
      amlSourceOfFundsRecorded: body.amlSourceOfFundsRecorded || "N/A",
      amlEscalationRequired: body.amlEscalationRequired || (decision === "Escalate" ? "Yes" : "No"),
      sanctionsOverseasActivityCheck: body.sanctionsOverseasActivityCheck || "Pass",
      sanctionsHighRiskJurisdictionCheck: body.sanctionsHighRiskJurisdictionCheck || "Pass",
      sanctionsNameMatchCheck: body.sanctionsNameMatchCheck || "Clear - No Match",
      reviewNotes,
      signatureMethod: sigType,
      signatureFilePath: staffSigPath,
      signatureTypedName: body.staffTypedSignature || null,
      signatureDrawnData: sigType === "draw" ? body.staffDrawnSignature : null,
      ipAddress: req.ip || "127.0.0.1",
    });

    await engagement.update({
      status: mappedStatus,
      riskLevel,
      riskNotes: reviewNotes,
      adminPdfPath: adminPdfPath || engagement.adminPdfPath,
      acceptancePdfPath: acceptancePdfPath || engagement.acceptancePdfPath,
      auditPdfPath: auditPdfPath || engagement.auditPdfPath,
    });

    // Dispatch Admin Decision Email
    try {
      const clientEmail = engagement.client?.email;
      const fullName = engagement.client?.fullName || "Client";
      const fullAcceptancePdfPath = acceptancePdfPath ? path.join(__dirname, "../public", acceptancePdfPath) : null;
      if (clientEmail) {
        sendAdminDecisionEmail(clientEmail, fullName, engagement.referenceNumber, mappedStatus, staffName, reviewNotes, fullAcceptancePdfPath);
      }
    } catch (emailErr) {
      console.error("Async decision email error:", emailErr);
    }

    return res.status(200).json({
      success: true,
      message: `Engagement updated to ${mappedStatus}.`,
      engagement,
      adminPdfPath,
      acceptancePdfPath,
      auditPdfPath,
    });
  } catch (error) {
    console.error("Error updating admin decision:", error);
    return res.status(500).json({ success: false, message: "Failed to update decision.", error: error.message });
  }
}

module.exports = {
  createEngagement,
  getEngagements,
  getEngagementById,
  submitAdminDecision,
};
