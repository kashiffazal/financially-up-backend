/**
 * New Company Registration Controller
 * ====================================
 * Handles all API operations for the New Company Registration module:
 * - POST / : Client form submission with multi-file uploads
 * - GET / : Admin listing with pagination, search & status filters
 * - GET /:id : Full details for Admin Review
 * - PUT /:id/shareholders/:memberId : Update shareholder (triggers consent invalidation)
 * - PUT /:id/decision : Admin AML/CTF review decision
 * - GET /:id/pdf/:type : Download generated PDFs
 * - POST /:id/regenerate-pdf : Regenerate PDFs on demand
 */

const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const NewCompanyRegistration = require("../models/NewCompanyRegistration");
const NewCompanyOfficeholder = require("../models/NewCompanyOfficeholder");
const NewCompanyShareholder = require("../models/NewCompanyShareholder");
const NewCompanyBeneficialOwner = require("../models/NewCompanyBeneficialOwner");
const NewCompanyConsent = require("../models/NewCompanyConsent");
const NewCompanyDocument = require("../models/NewCompanyDocument");
const NewCompanyAdminReview = require("../models/NewCompanyAdminReview");
const NewCompanyPdf = require("../models/NewCompanyPdf");
const NewCompanyAuditLog = require("../models/NewCompanyAuditLog");
const { invalidateOutdatedConsents, createConsent, computeConsentHash } = require("../services/consentValidation.service");
const { generateClientApplicationPDF, generateAdminReviewPDF, generateDirectorConsentPDFs, generateMemberConsentPDFs } = require("../services/newCompanyPdf.service");

/**
 * Helper: save a base64 signature image to disk
 */
function saveBase64Signature(base64Data, subDir) {
  try {
    if (!base64Data || !base64Data.startsWith("data:")) return null;
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;
    const ext = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const dir = path.join(__dirname, "../public/uploads", subDir, `${year}/${month}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fileName = `sig_${Date.now()}_${Math.round(Math.random() * 1e6)}.${ext}`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${subDir}/${year}/${month}/${fileName}`;
  } catch (e) {
    console.error("Error saving base64 signature:", e);
    return null;
  }
}

/**
 * Generate a unique reference number for a new company registration
 */
function generateReferenceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `CREG-${year}-${random}`;
}

/**
 * POST / — Submit new Company Registration form (client-facing)
 */
async function createRegistration(req, res) {
  try {
    const body = req.body || {};
    const files = req.files || {};

    /* Parse JSON-stringified arrays/objects from FormData */
    const parseJson = (val) => {
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch (e) { return val; }
      }
      return val;
    };

    const referenceNumber = generateReferenceNumber();
    const now = new Date();

    /* 1. Create master registration record */
    const registration = await NewCompanyRegistration.create({
      referenceNumber,
      status: "Submitted",

      /* Terms of Engagement audit */
      terms_version: body.terms_version || "v1.0",
      terms_accepted: body.terms_accepted === "true" || body.terms_accepted === true,
      terms_accepted_at: now,
      terms_accepted_by: body.contactName || body.contactEmail || "Client",
      terms_acceptance_method: body.terms_acceptance_method || "Electronic Checkbox / Form Submission",

      /* Privacy Collection Notice audit */
      privacy_notice_version: body.privacy_notice_version || "v1.0",
      privacy_notice_acknowledged: body.privacy_notice_acknowledged === "true" || body.privacy_notice_acknowledged === true,
      privacy_notice_acknowledged_at: now,
      privacy_notice_acknowledged_by: body.contactName || body.contactEmail || "Client",

      /* Step 1 */
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactMobile: body.contactMobile,
      contactRelationship: body.contactRelationship,
      otherRelationshipDetail: body.otherRelationshipDetail,
      authorityDescription: body.authorityDescription,
      primaryService: body.primaryService,
      dateServiceRequested: body.dateServiceRequested || null,
      additionalServices: parseJson(body.additionalServices),
      isUrgent: body.isUrgent === "true" || body.isUrgent === true,
      urgencyExplanation: body.urgencyExplanation,
      previousRefusal: body.previousRefusal,
      previousRefusalDetails: body.previousRefusalDetails,

      /* Step 2 */
      companyName1: body.companyName1,
      companyName2: body.companyName2,
      companyName3: body.companyName3,
      useAcnAsName: body.useAcnAsName === "true" || body.useAcnAsName === true,
      isNameReserved: body.isNameReserved,
      reservationNumber: body.reservationNumber,
      reservationDate: body.reservationDate || null,
      reservationApplicant: body.reservationApplicant,
      companyType: body.companyType,
      specialPurposeDetail: body.specialPurposeDetail,
      jurisdictionState: body.jurisdictionState,
      companyPurpose: body.companyPurpose,
      otherPurposeDetail: body.otherPurposeDetail,
      mainBusinessActivity: body.mainBusinessActivity,
      anzsicDescription: body.anzsicDescription,
      tradingNameChoice: body.tradingNameChoice,
      proposedBusinessName: body.proposedBusinessName,
      commencementDate: body.commencementDate || null,
      isPartOfGroup: body.isPartOfGroup,
      groupDescription: body.groupDescription,
      ultimateHoldingName: body.ultimateHoldingName,
      ultimateHoldingAcn: body.ultimateHoldingAcn,
      ultimateHoldingCountry: body.ultimateHoldingCountry,
      governanceDocument: body.governanceDocument,
      specialInstructions: body.specialInstructions,

      /* Step 3 */
      regOfficeHouseNumber: body.regOfficeHouseNumber,
      regOfficeStreet: body.regOfficeStreet,
      regOfficeSuburb: body.regOfficeSuburb,
      regOfficePostcode: body.regOfficePostcode,
      regOfficeState: body.regOfficeState,
      companyOccupiesRegisteredOffice: body.companyOccupiesRegisteredOffice,
      occupierName: body.occupierName,
      samePrincipalAddress: body.samePrincipalAddress,
      ppobHouseNumber: body.ppobHouseNumber,
      ppobStreet: body.ppobStreet,
      ppobSuburb: body.ppobSuburb,
      ppobPostcode: body.ppobPostcode,
      ppobState: body.ppobState,
      provideRegisteredOfficeAddress: body.provideRegisteredOfficeAddress === "true" || body.provideRegisteredOfficeAddress === true,
      providePrincipalPlaceAddress: body.providePrincipalPlaceAddress === "true" || body.providePrincipalPlaceAddress === true,
      addressServiceCommercialReason: body.addressServiceCommercialReason,
      authorisedRecipientName: body.authorisedRecipientName,
      authorisedRecipientEmail: body.authorisedRecipientEmail,
      authorisedRecipientPhone: body.authorisedRecipientPhone,
      addressServiceAccepted: body.addressServiceAccepted === "true" || body.addressServiceAccepted === true,

      /* Step 7: CDD */
      cddQ1: body.cddQ1, cddQ1Detail: body.cddQ1Detail,
      cddQ2: body.cddQ2, cddQ2Detail: body.cddQ2Detail,
      cddQ3: body.cddQ3, cddQ3Detail: body.cddQ3Detail,
      cddQ4: body.cddQ4, cddQ4Detail: body.cddQ4Detail,
      cddQ5: body.cddQ5, cddQ5Detail: body.cddQ5Detail,
      cddQ6: body.cddQ6, cddQ6Detail: body.cddQ6Detail,
      cddQ7: body.cddQ7, cddQ7Detail: body.cddQ7Detail,
      cddQ8: body.cddQ8, cddQ8Detail: body.cddQ8Detail,
      cddQ9: body.cddQ9, cddQ9Detail: body.cddQ9Detail,
      cddQ10: body.cddQ10, cddQ10Detail: body.cddQ10Detail,

      /* Step 8: Source of Funds */
      initialCapitalAmount: body.initialCapitalAmount || null,
      initialCapitalPaidBy: body.initialCapitalPaidBy,
      initialCapitalSource: body.initialCapitalSource,
      first12MonthsFundingAmount: body.first12MonthsFundingAmount || null,
      first12MonthsFundingSource: body.first12MonthsFundingSource,
      first12MonthsFunderName: body.first12MonthsFunderName,
      first12MonthsOriginBank: body.first12MonthsOriginBank,
      sourceOfWealthSummary: body.sourceOfWealthSummary,
      hasOffshoreFunding: body.hasOffshoreFunding,
      offshoreCountries: body.offshoreCountries,
      offshoreBanks: body.offshoreBanks,
      offshoreExplanation: body.offshoreExplanation,
      hasCashOver10k: body.hasCashOver10k,
      cashAmount: body.cashAmount || null,
      cashPayer: body.cashPayer,
      cashReason: body.cashReason,

      /* Step 9: Nominee */
      isDirectorActingForOthers: body.isDirectorActingForOthers,
      directorNominatorName: body.directorNominatorName,
      isNomineeShareholder: body.isNomineeShareholder,
      nomineeNominator: body.nomineeNominator,
      nomineeBeneficialOwner: body.nomineeBeneficialOwner,
      isTrusteeInvolved: body.isTrusteeInvolved,
      trustName: body.trustName,
      trustSettlor: body.trustSettlor,
      hasLegalAdvice: body.hasLegalAdvice,
      legalAdviserName: body.legalAdviserName,
      legalAdviceSummary: body.legalAdviceSummary,
      nomineeArrangementAccepted: body.nomineeArrangementAccepted === "true" || body.nomineeArrangementAccepted === true,

      /* Step 10: Optional */
      abnTfnRequired: body.abnTfnRequired,
      gstRegistrationRequired: body.gstRegistrationRequired,
      expectedTurnover: body.expectedTurnover || null,
      paygWithholdingRequired: body.paygWithholdingRequired,
      businessNameRegistrationRequired: body.businessNameRegistrationRequired,
      proposedTaxBusinessName: body.proposedTaxBusinessName,
      bankAccountAssistance: body.bankAccountAssistance,
      accountingSoftware: body.accountingSoftware,
      otherAccountingSoftware: body.otherAccountingSoftware,
      registeredAgentSupport: body.registeredAgentSupport,

      /* Step 12: Declarations */
      declaration1: body.declaration1 === "true" || body.declaration1 === true,
      declaration2: body.declaration2 === "true" || body.declaration2 === true,
      declaration3: body.declaration3 === "true" || body.declaration3 === true,
      declaration4: body.declaration4 === "true" || body.declaration4 === true,
      declaration5: body.declaration5 === "true" || body.declaration5 === true,
      declaration6: body.declaration6 === "true" || body.declaration6 === true,
      signatory1Name: body.signatory1Name,
      signatory1Capacity: body.signatory1Capacity,
      signatory1Date: body.signatory1Date || null,
      signatory1Signature: body.signatory1Signature ? saveBase64Signature(body.signatory1Signature, "signatures") || body.signatory1Signature : null,
      signatory2Name: body.signatory2Name,
      signatory2Capacity: body.signatory2Capacity,
      signatory2Date: body.signatory2Date || null,
      signatory2Signature: body.signatory2Signature ? saveBase64Signature(body.signatory2Signature, "signatures") || body.signatory2Signature : null,

      /* Audit */
      submittedAt: now,
      ipAddress: req.ip || "127.0.0.1",
      userAgent: req.get("User-Agent") || "",
      applicationSnapshot: body,
    });

    /* 2. Create officeholder records */
    const officeholders = parseJson(body.officeholders) || [];
    const createdOfficeholders = [];
    for (const oh of officeholders) {
      const sigPath = oh.signatureData ? saveBase64Signature(oh.signatureData, "signatures") || oh.signatureData : null;
      const record = await NewCompanyOfficeholder.create({
        registrationId: registration.id,
        fullName: oh.fullName,
        formerNames: oh.formerNames,
        dob: oh.dob || null,
        birthCity: oh.birthCity,
        birthState: oh.birthState,
        birthCountry: oh.birthCountry,
        residentialAddress: oh.residentialAddress,
        email: oh.email,
        mobile: oh.mobile,
        role: oh.role || "Director",
        occupation: oh.occupation,
        citizenship: oh.citizenship,
        taxResidence: oh.taxResidence,
        isAustralianResidentDirector: oh.isAustralianResidentDirector === "true" || oh.isAustralianResidentDirector === true,
        directorIdStatus: oh.directorIdStatus,
        directorIdNumber: oh.directorIdNumber,
        idDocType: oh.idDocType,
        idDocNumber: oh.idDocNumber,
        pepStatus: oh.pepStatus,
        sanctionsDeclaration: oh.sanctionsDeclaration,
        sourceOfWealth: oh.sourceOfWealth,
        consentAccepted: oh.consentAccepted === "true" || oh.consentAccepted === true,
        signatureData: sigPath,
        signatureDate: oh.signatureDate || null,
      });
      createdOfficeholders.push(record);

      /* Create Director Consent record */
      if (record.consentAccepted) {
        await createConsent({
          registrationId: registration.id,
          personType: "Officeholder",
          personId: record.id,
          personName: record.fullName,
          consentType: "DirectorConsent",
          consentVersion: "v1.0",
          snapshotData: { role: record.role, fullName: record.fullName },
          signatureData: sigPath,
          ipAddress: req.ip || "127.0.0.1",
        });
      }
    }

    /* 3. Create shareholder records */
    const shareholders = parseJson(body.shareholders) || [];
    const createdShareholders = [];
    for (const sh of shareholders) {
      const record = await NewCompanyShareholder.create({
        registrationId: registration.id,
        fullName: sh.fullName,
        memberType: sh.memberType || "Individual",
        address: sh.address,
        shareClass: sh.shareClass || "Ordinary",
        numberOfShares: sh.numberOfShares || null,
        amountPaidPerShare: sh.amountPaidPerShare || null,
        amountUnpaidPerShare: sh.amountUnpaidPerShare || null,
        isBeneficiallyHeld: sh.isBeneficiallyHeld === "true" || sh.isBeneficiallyHeld === true,
        heldForWhom: sh.heldForWhom,
        corporateOwnershipChain: sh.corporateOwnershipChain,
        consentAccepted: sh.consentAccepted === "true" || sh.consentAccepted === true,
      });
      createdShareholders.push(record);

      /* Create Member Consent record with hash for invalidation */
      if (record.consentAccepted) {
        await createConsent({
          registrationId: registration.id,
          personType: "Member",
          personId: record.id,
          personName: record.fullName,
          consentType: "MemberConsent",
          consentVersion: "v1.0",
          snapshotData: {
            shareClass: record.shareClass,
            numberOfShares: record.numberOfShares,
            amountPaidPerShare: record.amountPaidPerShare,
            amountUnpaidPerShare: record.amountUnpaidPerShare,
            memberType: record.memberType,
          },
          ipAddress: req.ip || "127.0.0.1",
        });
      }
    }

    /* 4. Create beneficial owner records */
    const beneficialOwners = parseJson(body.beneficialOwners) || [];
    for (const bo of beneficialOwners) {
      await NewCompanyBeneficialOwner.create({
        registrationId: registration.id,
        fullName: bo.fullName,
        dob: bo.dob || null,
        address: bo.address,
        ownershipPercentage: bo.ownershipPercentage || null,
        holdingType: bo.holdingType,
        howControlIsHeld: bo.howControlIsHeld,
      });
    }

    /* 5. Save uploaded files as document records */
    const fileFields = Object.keys(files);
    for (const fieldName of fileFields) {
      const fileList = Array.isArray(files[fieldName]) ? files[fieldName] : [files[fieldName]];
      for (const file of fileList) {
        const now2 = new Date();
        const year = now2.getFullYear();
        const month = String(now2.getMonth() + 1).padStart(2, "0");
        await NewCompanyDocument.create({
          registrationId: registration.id,
          documentType: fieldName,
          fileName: file.originalname || file.filename,
          filePath: `/uploads/documents/${year}/${month}/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: "Attached",
        });
      }
    }

    /* 6. Create audit log entry */
    await NewCompanyAuditLog.create({
      registrationId: registration.id,
      action: "Application Submitted",
      performedBy: body.contactName || "Client",
      details: { referenceNumber, officeholderCount: officeholders.length, shareholderCount: shareholders.length },
      ipAddress: req.ip || "127.0.0.1",
    });

    /* 7. Generate PDF package */
    let clientPdfPath = null;
    let directorConsentPdfs = [];
    let memberConsentPdfs = [];

    try {
      const fullData = await NewCompanyRegistration.findByPk(registration.id, {
        include: ["officeholders", "shareholders", "beneficialOwners", "documents"],
      });
      clientPdfPath = await generateClientApplicationPDF(fullData);
      directorConsentPdfs = await generateDirectorConsentPDFs(fullData, createdOfficeholders);
      memberConsentPdfs = await generateMemberConsentPDFs(fullData, createdShareholders);

      await registration.update({ clientPdfPath });
    } catch (pdfErr) {
      console.error("PDF generation error (non-blocking):", pdfErr);
    }

    return res.status(201).json({
      success: true,
      message: "Company registration submitted successfully.",
      data: {
        id: registration.id,
        referenceNumber,
        status: registration.status,
        clientPdfPath,
        directorConsentPdfs,
        memberConsentPdfs,
      },
    });
  } catch (error) {
    console.error("Error creating company registration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit company registration.",
      error: error.message,
    });
  }
}

/**
 * GET / — Admin listing with pagination, search & status filters
 */
async function getRegistrations(req, res) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== "All") {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { referenceNumber: { [Op.like]: `%${search}%` } },
        { companyName1: { [Op.like]: `%${search}%` } },
        { contactName: { [Op.like]: `%${search}%` } },
        { contactEmail: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await NewCompanyRegistration.findAndCountAll({
      where,
      include: ["officeholders", "shareholders", "adminReview"],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      success: true,
      data: {
        records: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch registrations." });
  }
}

/**
 * GET /:id — Full details for Admin Review
 */
async function getRegistrationById(req, res) {
  try {
    const { id } = req.params;
    const registration = await NewCompanyRegistration.findByPk(id, {
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

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    return res.status(200).json({ success: true, data: registration });
  } catch (error) {
    console.error("Error fetching registration details:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch registration details." });
  }
}

/**
 * PUT /:id/shareholders/:memberId — Update shareholder and trigger consent invalidation
 */
async function updateShareholder(req, res) {
  try {
    const { id, memberId } = req.params;
    const body = req.body || {};

    const shareholder = await NewCompanyShareholder.findOne({
      where: { id: memberId, registrationId: id },
    });

    if (!shareholder) {
      return res.status(404).json({ success: false, message: "Shareholder not found." });
    }

    /* Update the shareholder record */
    await shareholder.update({
      fullName: body.fullName !== undefined ? body.fullName : shareholder.fullName,
      memberType: body.memberType !== undefined ? body.memberType : shareholder.memberType,
      address: body.address !== undefined ? body.address : shareholder.address,
      shareClass: body.shareClass !== undefined ? body.shareClass : shareholder.shareClass,
      numberOfShares: body.numberOfShares !== undefined ? body.numberOfShares : shareholder.numberOfShares,
      amountPaidPerShare: body.amountPaidPerShare !== undefined ? body.amountPaidPerShare : shareholder.amountPaidPerShare,
      amountUnpaidPerShare: body.amountUnpaidPerShare !== undefined ? body.amountUnpaidPerShare : shareholder.amountUnpaidPerShare,
      isBeneficiallyHeld: body.isBeneficiallyHeld !== undefined ? body.isBeneficiallyHeld : shareholder.isBeneficiallyHeld,
      heldForWhom: body.heldForWhom !== undefined ? body.heldForWhom : shareholder.heldForWhom,
    });

    /* Trigger consent invalidation check */
    const invalidatedCount = await invalidateOutdatedConsents(id, memberId, {
      shareClass: shareholder.shareClass,
      numberOfShares: shareholder.numberOfShares,
      amountPaidPerShare: shareholder.amountPaidPerShare,
      amountUnpaidPerShare: shareholder.amountUnpaidPerShare,
      memberType: shareholder.memberType,
    });

    /* Log the change if consents were invalidated */
    if (invalidatedCount > 0) {
      await NewCompanyAuditLog.create({
        registrationId: id,
        action: `Shareholder Updated - ${invalidatedCount} consent(s) invalidated`,
        performedBy: body.updatedBy || "Admin",
        details: { memberId, invalidatedCount, newShares: shareholder.numberOfShares, newShareClass: shareholder.shareClass },
        ipAddress: req.ip || "127.0.0.1",
      });
    }

    return res.status(200).json({
      success: true,
      message: invalidatedCount > 0
        ? `Shareholder updated. ${invalidatedCount} consent(s) are now outdated and require renewal.`
        : "Shareholder updated successfully.",
      data: shareholder,
      consentsInvalidated: invalidatedCount,
    });
  } catch (error) {
    console.error("Error updating shareholder:", error);
    return res.status(500).json({ success: false, message: "Failed to update shareholder.", error: error.message });
  }
}

/**
 * PUT /:id/decision — Admin AML/CTF review decision
 */
async function submitAdminDecision(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const files = req.files || {};

    const registration = await NewCompanyRegistration.findByPk(id);
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    const staffName = body.reviewerName || "Financially Up Reviewer";
    const sigType = body.signatureMethod || "draw";

    /* Process staff signature */
    let staffSigPath = null;
    if (sigType === "draw" && body.signatureDrawnData) {
      staffSigPath = saveBase64Signature(body.signatureDrawnData, "signatures");
    } else if (sigType === "upload" && files.staffSignature && files.staffSignature[0]) {
      const f = files.staffSignature[0];
      const now2 = new Date();
      const year = now2.getFullYear();
      const month = String(now2.getMonth() + 1).padStart(2, "0");
      staffSigPath = `/uploads/signatures/${year}/${month}/${f.filename}`;
    }

    /* Upsert admin review record */
    await NewCompanyAdminReview.upsert({
      registrationId: id,
      reviewerName: staffName,
      reviewerRole: body.reviewerRole || "Accountant",
      reviewStatus: body.reviewStatus || "Completed",
      overallRiskRating: body.overallRiskRating || "Low",
      riskRationale: body.riskRationale,
      pepSanctionsScreeningResult: body.pepSanctionsScreeningResult || "Clear",
      adverseMediaResult: body.adverseMediaResult || "Clear",
      identityVerificationNotes: body.identityVerificationNotes,
      ownershipVerificationNotes: body.ownershipVerificationNotes,
      sourceOfFundsNotes: body.sourceOfFundsNotes,
      cddVerificationNotes: body.cddVerificationNotes,
      addressServiceApproval: body.addressServiceApproval,
      decisionNotes: body.decisionNotes,
      approvalConditions: body.approvalConditions,
      signatureMethod: sigType,
      signatureFilePath: staffSigPath,
      signatureTypedName: body.signatureTypedName || null,
      signatureDrawnData: sigType === "draw" ? body.signatureDrawnData : null,
      reviewStartedAt: body.reviewStartedAt || null,
      reviewedAt: new Date(),
      ipAddress: req.ip || "127.0.0.1",
    });

    /* Map review status to registration status */
    const statusMap = {
      "Approved": "Approved",
      "Approved With Conditions": "Approved With Conditions",
      "Declined": "Declined",
      "On Hold": "On Hold",
      "Completed": "Approved",
    };
    const mappedStatus = statusMap[body.reviewStatus] || "Under Review";
    await registration.update({ status: mappedStatus });

    /* Generate admin review PDF */
    let adminPdfPath = null;
    try {
      const fullData = await NewCompanyRegistration.findByPk(id, {
        include: ["officeholders", "shareholders", "beneficialOwners", "documents", "adminReview"],
      });
      adminPdfPath = await generateAdminReviewPDF(fullData);
      await registration.update({ adminPdfPath });
    } catch (pdfErr) {
      console.error("Admin PDF generation error (non-blocking):", pdfErr);
    }

    /* Audit log */
    await NewCompanyAuditLog.create({
      registrationId: id,
      action: `Admin Review Decision: ${body.reviewStatus || "Completed"}`,
      performedBy: staffName,
      details: { decision: body.reviewStatus, riskRating: body.overallRiskRating },
      ipAddress: req.ip || "127.0.0.1",
    });

    return res.status(200).json({
      success: true,
      message: `Registration updated to ${mappedStatus}.`,
      data: { status: mappedStatus, adminPdfPath },
    });
  } catch (error) {
    console.error("Error submitting admin decision:", error);
    return res.status(500).json({ success: false, message: "Failed to submit decision.", error: error.message });
  }
}

/**
 * GET /:id/pdf/:type — Download or view generated PDFs
 */
async function getPdf(req, res) {
  try {
    const { id, type } = req.params;
    const pdf = await NewCompanyPdf.findOne({
      where: { registrationId: id, type },
      order: [["version", "DESC"]],
    });

    if (!pdf) {
      return res.status(404).json({ success: false, message: "PDF not found." });
    }

    const fullPath = path.join(__dirname, "../public", pdf.filePath);
    if (!fs.existsSync(fullPath)) {
      /* Try HTML fallback */
      const htmlPath = fullPath.replace(/\.pdf$/, ".html");
      if (fs.existsSync(htmlPath)) {
        return res.sendFile(htmlPath);
      }
      return res.status(404).json({ success: false, message: "PDF file not found on disk." });
    }

    return res.sendFile(fullPath);
  } catch (error) {
    console.error("Error serving PDF:", error);
    return res.status(500).json({ success: false, message: "Failed to serve PDF." });
  }
}

/**
 * POST /:id/regenerate-pdf — Regenerate PDFs on demand
 */
async function regeneratePdf(req, res) {
  try {
    const { id } = req.params;
    const registration = await NewCompanyRegistration.findByPk(id, {
      include: ["officeholders", "shareholders", "beneficialOwners", "documents", "adminReview"],
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    const clientPdfPath = await generateClientApplicationPDF(registration);
    const directorPdfs = await generateDirectorConsentPDFs(registration, registration.officeholders || []);
    const memberPdfs = await generateMemberConsentPDFs(registration, registration.shareholders || []);

    let adminPdfPath = null;
    if (registration.adminReview) {
      adminPdfPath = await generateAdminReviewPDF(registration);
    }

    await registration.update({ clientPdfPath, adminPdfPath: adminPdfPath || registration.adminPdfPath });

    return res.status(200).json({
      success: true,
      message: "PDFs regenerated successfully.",
      data: { clientPdfPath, adminPdfPath, directorPdfs, memberPdfs },
    });
  } catch (error) {
    console.error("Error regenerating PDFs:", error);
    return res.status(500).json({ success: false, message: "Failed to regenerate PDFs.", error: error.message });
  }
}

module.exports = {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateShareholder,
  submitAdminDecision,
  getPdf,
  regeneratePdf,
};
