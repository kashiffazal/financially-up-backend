/**
 * NewIndividualEngagement Controller
 * ==================================
 * Handles API endpoints for the New Individual Client Engagement Form:
 * 1. createEngagement (POST /api/new-individual-engagements)
 * 2. getEngagements (GET /api/new-individual-engagements)
 * 3. submitAdminDecision (PUT/POST /api/new-individual-engagements/:id/decision)
 * 4. deleteEngagement (DELETE /api/new-individual-engagements/:id)
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
const notificationService = require("../services/notification.service");
const path = require("path");

/** Parses a field that may arrive as a JSON string (multipart) or an array */
function parseJsonField(value) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) || typeof parsed === "object" ? parsed : [value];
    } catch (e) {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return null;
}

/** Normalises checkbox/boolean payload values ("true", true, 1, ["accepted"]) */
function isChecked(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value === true || value === "true" || value === 1 || value === "1" || value === "Yes" || value === "accepted";
}

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
    // The form captures first and last name separately; fullName is kept as the
    // composed value used by admin lists, exports and PDFs.
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const composedName = [firstName, lastName].filter(Boolean).join(" ");

    const clientDetails = {
      firstName: firstName || null,
      lastName: lastName || null,
      fullName: composedName || body.fullName || body.name || "Client",
      mobile: body.mobile || body.phone || "",
      dateOfBirth: body.dateOfBirth || null,
      birthCountry: body.birthCountry || null,
      birthCity: body.birthCity || null,
      occupation: body.occupation || null,
      employmentStatus: body.employmentStatus || null,
      about: body.about || null,
      tfn: body.tfn || null,
      maskedTfn: body.tfn ? `*** *** ${String(body.tfn).replace(/\s/g, "").slice(-3)}` : null,
    };

    const [client, clientCreated] = await NewIndividualClient.findOrCreate({
      where: { email: body.email || "client@example.com" },
      defaults: clientDetails,
      transaction,
    });

    // Returning clients: refresh details supplied in this submission so the
    // record does not stay frozen at whatever was entered the first time.
    if (!clientCreated) {
      const refreshed = Object.entries(clientDetails).reduce((changes, [key, value]) => {
        if (value !== null && value !== "") changes[key] = value;
        return changes;
      }, {});
      await client.update(refreshed, { transaction });
    }

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
        tfnStatus: body.tfnStatus || null,
        tfnExplanation: body.tfnExplanation || null,
        incomeActivities: parseJsonField(body.incomeActivities),
        basScope: body.basScope || null,
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
        confirmOwnership: isChecked(body.confirmOwnership),
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
        primaryIdType: body.primaryIdType || null,
        supportingIdType: body.supportingIdType || null,
        noPhotoIdReason: body.noPhotoIdReason || null,
        biometricConsent: isChecked(body.biometricConsent),
        // No DVS integration exists yet, so identity stays unverified until an
        // officer checks it manually. Never assert an electronic "Pass" here.
        dvsStatus: "Pending",
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
      /* Step 9: statutory terms, notices and declarations */
      {
        consentType: "ScheduleTerms",
        accepted: isChecked(body.consentScheduleTerms),
        documentType: body.termsDocumentType || "TERMS",
        version: body.termsVersion || "2.1",
        openedAt: body.termsOpenedAt ? new Date(body.termsOpenedAt) : null,
        acceptedAt: body.termsAcceptedAt ? new Date(body.termsAcceptedAt) : new Date(),
      },
      {
        consentType: "PrivacyNotice",
        accepted: isChecked(body.consentPrivacy),
        documentType: body.privacyDocumentType || "PRIVACY",
        version: body.privacyVersion || "2.1",
        openedAt: body.privacyOpenedAt ? new Date(body.privacyOpenedAt) : null,
        acceptedAt: body.privacyAcceptedAt ? new Date(body.privacyAcceptedAt) : new Date(),
      },
      { consentType: "AtoAuditDeclaration", accepted: isChecked(body.consentAtoAuditDeclaration), documentType: "ATO_AUDIT_DECLARATION", version: "1.0" },
      { consentType: "TrueAndCorrect", accepted: isChecked(body.declarationTrueAndCorrect), documentType: "DECLARATION", version: "1.0" },
      { consentType: "WorldwideIncome", accepted: isChecked(body.declarationWorldwideIncome), documentType: "DECLARATION", version: "1.0" },
      { consentType: "PendingReview", accepted: isChecked(body.declarationPendingReview), documentType: "DECLARATION", version: "1.0" },
      { consentType: "BiometricConsent", accepted: isChecked(body.consentBiometric), documentType: "BIOMETRIC", version: "1.0" },
      { consentType: "RecordingConsent", accepted: isChecked(body.consentRecording), documentType: "RECORDING", version: "1.0" },
      { consentType: "TechnologyOverseasProcessing", accepted: isChecked(body.techBlendedTeam), documentType: "CLOUD_PROCESSING", version: "1.0" },

      /* Step 7: statutory authorities */
      { consentType: "AtoAuthority", accepted: isChecked(body.atoAuthority), documentType: "ATO_AUTHORITY", version: "1.0" },
      { consentType: "AbrAuthority", accepted: isChecked(body.abrAuthority), documentType: "ABR_AUTHORITY", version: "1.0" },
      { consentType: "PreviousAgentAuthority", accepted: isChecked(body.previousAuthority), documentType: "PREVIOUS_AGENT_AUTHORITY", version: "1.0" },
      { consentType: "BankAccountOwnership", accepted: isChecked(body.confirmOwnership), documentType: "BANK_OWNERSHIP", version: "1.0" },
    ];

    // Every answer is recorded, including declines, so the PDFs and the audit
    // trail show what the client actually agreed to rather than assuming consent.
    for (const entry of consentEntries) {
      await NewIndividualConsent.create(
        {
          engagementId: engagement.id,
          consentType: entry.consentType,
          documentType: entry.documentType,
          version: entry.version,
          openedAt: entry.openedAt || null,
          accepted: entry.accepted,
          acceptedAt: entry.accepted ? entry.acceptedAt || new Date() : null,
        },
        { transaction }
      );
    }

    // 6b. Process Multer Uploaded Documents (Multer)
    if (req.files) {
      // Identity documents are captured front and back. The legacy single-file
      // names are still accepted and treated as the front image.
      const docCategories = {
        primaryId: "PrimaryID (Front)",
        primaryIdFront: "PrimaryID (Front)",
        primaryIdBack: "PrimaryID (Back)",
        supportingId: "SupportingID (Front)",
        supportingIdFront: "SupportingID (Front)",
        supportingIdBack: "SupportingID (Back)",
        selfie: "SelfieID",
        visaEvidence: "VisaEvidence",
        atoDocuments: "ATONotice",
        authorityDoc: "AuthorityDocument",
        signatureUploadedFile: "Signature",
      };

      // Upload field -> identity column holding that image
      const identityPathFields = {
        primaryId: "primaryIdPath",
        primaryIdFront: "primaryIdPath",
        primaryIdBack: "primaryIdBackPath",
        supportingId: "supportingIdPath",
        supportingIdFront: "supportingIdPath",
        supportingIdBack: "supportingIdBackPath",
        selfie: "selfiePath",
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

            const identityColumn = identityPathFields[fieldName];
            if (identityColumn) {
              await NewIndividualIdentity.update(
                { [identityColumn]: relPath },
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
      // incomeActivities and about are now persisted, so regenerated PDFs keep them
      const plainData = fullData ? fullData.toJSON() : {};

      const clientPdfPath = await generateClientEngagementPDF(plainData);
      const adminPdfPath = await generateAdminReviewPDF(plainData);
      
      // Update PDF Paths on engagement record
      await engagement.update({ clientPdfPath, adminPdfPath });

      // Dispatch Email with Client PDF Attachment
      const fullPdfPath = path.join(__dirname, "../public", clientPdfPath);
      sendClientSubmissionEmail(client.email, client.fullName, referenceNumber, fullPdfPath);
    } catch (pdfErr) {
      console.error("Async PDF/Email error:", pdfErr);
    }

    // Notify staff (fire-and-forget)
    notificationService.notifySubmission("NewIndividualEngagement", engagement);

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
    // ?id=<n> → just that row, in the same shape as the list (live table updates)
    const id = parseInt(req.query.id, 10);
    const engagements = await NewIndividualEngagement.findAll({
      ...(id > 0 ? { where: { id } } : {}),
      include: [
        // Never send the raw TFN to the browser — admin screens use client.maskedTfn
        { association: "client", attributes: { exclude: ["tfn"] } },
        "services",
        "identity",
        "documents",
        "signatures",
        "adminReview",
      ],
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

    // The signer is the logged-in staff member (route requires authentication);
    // the typed name is only a fallback for older clients
    const staffName = req.user?.fullName || body.staffMemberName || body.taxAgentName || "Financially Up Tax Agent";
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

    // 3. Map decision enum value for Sequelize model
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

    const previousStatus = engagement.status;
    await engagement.update({
      status: mappedStatus,
      riskLevel,
      riskNotes: reviewNotes,
    });
    notificationService.notifyStatusChange("NewIndividualEngagement", engagement, previousStatus, req, {
      notes: reviewNotes || null,
    });

    // 4. Generate PDFs AFTER the review and status are saved, so the documents
    //    show this decision rather than the previous state of the record.
    const fullData = await NewIndividualEngagement.findByPk(engagement.id, {
      include: ["client", "services", "identity", "documents", "consents", "signatures", "auditLogs", "adminReview"],
    });
    const plainData = fullData ? fullData.toJSON() : {};
    plainData.taxAgentName = staffName;

    let adminPdfPath = null;
    let acceptancePdfPath = null;
    let auditPdfPath = null;

    try {
      adminPdfPath = await generateAdminReviewPDF(plainData);
    } catch (err) {
      console.error("Error regenerating Admin Review PDF:", err);
    }

    if (decision === "Accept" || decision === "Accepted" || decision === "Conditional Accept") {
      try {
        acceptancePdfPath = await generateEngagementAcceptancePDF(plainData, staffName);
      } catch (err) {
        console.error("Error generating Acceptance PDF:", err);
      }
    }

    try {
      auditPdfPath = await generateAuditReportPDF(plainData, staffName);
    } catch (err) {
      console.error("Error generating Audit Report PDF:", err);
    }

    await engagement.update({
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

/**
 * Deletes an engagement by ID (DELETE /api/new-individual-engagements/:id).
 */
async function deleteEngagement(req, res) {
  try {
    const { id } = req.params;
    const engagement = await NewIndividualEngagement.findByPk(id);

    if (!engagement) {
      return res.status(404).json({ success: false, message: "Engagement not found." });
    }

    // Delete associated sub-records
    try {
      await NewIndividualIdentity.destroy({ where: { engagementId: id } });
      await NewIndividualDocument.destroy({ where: { engagementId: id } });
      await NewIndividualSignature.destroy({ where: { engagementId: id } });
      await NewIndividualConsent.destroy({ where: { engagementId: id } });
      await NewIndividualAdminReview.destroy({ where: { engagementId: id } });
      await NewIndividualAuditLog.destroy({ where: { engagementId: id } });
    } catch (cleanErr) {
      console.warn("Sub-record clean error:", cleanErr);
    }

    await engagement.destroy();

    return res.status(200).json({
      success: true,
      message: "Engagement record deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting engagement:", error);
    return res.status(500).json({ success: false, message: "Failed to delete engagement.", error: error.message });
  }
}

module.exports = {
  createEngagement,
  getEngagements,
  submitAdminDecision,
  deleteEngagement,
};
