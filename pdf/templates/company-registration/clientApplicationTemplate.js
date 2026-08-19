/**
 * Client Application PDF Template - Company Registration
 * ======================================================
 * Renders the complete 21-section Client Application PDF for
 * Australian Company Registration submissions.
 * Styled in Financially Up brand primary (#008043) & soft light (#eaf7f0) theme.
 */

const path = require("path");
const fs = require("fs");

/**
 * Convert company logo to base64 data URI for embedding in PDF
 */
function getLogoBase64Uri() {
  try {
    const logoPath = path.join(__dirname, "../../../public/images/logo.png");
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    }
  } catch (e) {}
  return process.env.COMPANY_LOGO_URL || "http://localhost:5000/images/logo.png";
}

/**
 * Convert a stored signature file to base64 data URI
 */
function getSignatureBase64Uri(relPath) {
  if (!relPath) return null;
  if (relPath.startsWith("data:")) return relPath;
  try {
    const fullPath = path.join(__dirname, "../../../public", relPath);
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      const mime = relPath.endsWith(".png") ? "image/png" : "image/jpeg";
      return `data:${mime};base64,${buffer.toString("base64")}`;
    }
  } catch (e) {}
  return null;
}

/**
 * Format Australian date (DD/MM/YYYY)
 */
function formatDate(dateVal) {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * Format date and time for audit fields
 */
function formatDateTime(dateVal) {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

/**
 * Render a two-column key-value table row
 */
function row(label, value) {
  return `<tr><td class="label">${label}</td><td class="value">${value || "N/A"}</td></tr>`;
}

/**
 * Render a section heading
 */
function sectionTitle(num, title) {
  return `<div class="section-title"><span class="section-num">${num}.</span> ${title}</div>`;
}

/**
 * Generate the complete HTML for the Client Application PDF
 * @param {object} data - Full registration record with associations
 * @returns {string} Complete HTML document string
 */
function renderClientApplicationHtml(data) {
  const reg = data;
  const officeholders = data.officeholders || [];
  const shareholders = data.shareholders || [];
  const beneficialOwners = data.beneficialOwners || [];
  const documents = data.documents || [];
  const logoUri = getLogoBase64Uri();
  const now = new Date();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Company Registration Application - ${reg.referenceNumber || "Draft"}</title>
<style>
  @page { margin: 20mm 15mm 25mm 15mm; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #1a1a2e; line-height: 1.5; margin: 0; padding: 0; }
  .cover { text-align: center; padding: 80px 40px; page-break-after: always; }
  .cover img { max-width: 200px; margin-bottom: 30px; }
  .cover h1 { color: #008043; font-size: 24px; margin: 10px 0; }
  .cover h2 { color: #333; font-size: 16px; font-weight: 400; margin: 5px 0; }
  .cover .ref { background: #eaf7f0; padding: 10px 20px; border-radius: 8px; display: inline-block; margin-top: 20px; font-weight: 600; color: #008043; font-size: 14px; }
  .cover .meta { margin-top: 30px; font-size: 11px; color: #666; }
  .section-title { background: #008043; color: #fff; padding: 8px 14px; font-size: 12px; font-weight: 700; margin: 20px 0 10px 0; border-radius: 4px; page-break-after: avoid; }
  .section-num { opacity: 0.7; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  table td, table th { padding: 6px 10px; border: 1px solid #ddd; font-size: 10px; vertical-align: top; }
  td.label { background: #f5f8f5; font-weight: 600; width: 38%; color: #333; }
  td.value { color: #1a1a2e; }
  th { background: #008043; color: #fff; text-align: left; font-weight: 600; }
  .sub-heading { background: #eaf7f0; padding: 6px 12px; font-weight: 700; color: #008043; margin: 12px 0 8px 0; border-left: 3px solid #008043; font-size: 11px; }
  .signature-block { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 6px; }
  .signature-block img { max-height: 60px; }
  .footer { text-align: center; font-size: 8px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 8px; }
  .legal-appendix { background: #fafafa; border: 1px solid #e0e0e0; padding: 15px; margin: 10px 0; font-size: 9px; line-height: 1.6; border-radius: 4px; }
  .audit-box { background: #eaf7f0; border: 1px solid #b8e0c8; padding: 12px; border-radius: 6px; margin: 10px 0; }
  .audit-box p { margin: 4px 0; font-size: 10px; }
  .person-card { border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin: 8px 0; page-break-inside: avoid; }
  .person-card h4 { color: #008043; margin: 0 0 8px 0; font-size: 11px; }
</style>
</head>
<body>

<!-- 1. COVER PAGE -->
<div class="cover">
  <img src="${logoUri}" alt="Financially Up Logo" />
  <h1>Company Registration</h1>
  <h2>Client Intake Application</h2>
  <div class="ref">${reg.referenceNumber || "Draft"}</div>
  <h2 style="margin-top:20px;">${reg.companyName1 || "Proposed Company"}</h2>
  <div class="meta">
    <p>Applicant: ${reg.contactName || "N/A"}</p>
    <p>Status: ${reg.status || "Submitted"}</p>
    <p>Submitted: ${formatDateTime(reg.submittedAt)}</p>
    <p>Document Version: v1.0</p>
    <p>Generated: ${formatDateTime(now)}</p>
  </div>
</div>

<!-- 2. DOCUMENT CONTROL & AUDIT -->
${sectionTitle(1, "Document Control & Engagement Audit")}
<div class="audit-box">
  <p><strong>Terms of Engagement accepted:</strong> Version ${reg.terms_version || "1.0"}, ${formatDateTime(reg.terms_accepted_at)} by ${reg.terms_accepted_by || reg.contactName || "Client"}</p>
  <p><strong>Acceptance method:</strong> ${reg.terms_acceptance_method || "Electronic Checkbox / Form Submission"}</p>
  <p><strong>Privacy Collection Notice acknowledged:</strong> Version ${reg.privacy_notice_version || "1.0"}, ${formatDateTime(reg.privacy_notice_acknowledged_at)} by ${reg.privacy_notice_acknowledged_by || reg.contactName || "Client"}</p>
  <p><strong>Application Reference:</strong> ${reg.referenceNumber || "N/A"}</p>
  <p><strong>Submission IP:</strong> ${reg.ipAddress || "N/A"}</p>
</div>

<!-- 3. STEP 1: ENGAGEMENT & SERVICE -->
${sectionTitle(2, "Engagement & Service Selection")}
<table>
  ${row("Contact Name", reg.contactName)}
  ${row("Contact Email", reg.contactEmail)}
  ${row("Contact Mobile", reg.contactMobile)}
  ${row("Relationship to Company", reg.contactRelationship)}
  ${reg.otherRelationshipDetail ? row("Other Relationship Detail", reg.otherRelationshipDetail) : ""}
  ${reg.authorityDescription ? row("Authority Description", reg.authorityDescription) : ""}
  ${row("Primary Service", reg.primaryService)}
  ${row("Date Service Requested", formatDate(reg.dateServiceRequested))}
  ${row("Additional Services", Array.isArray(reg.additionalServices) ? reg.additionalServices.join(", ") : (reg.additionalServices || "None"))}
  ${row("Urgent", reg.isUrgent ? "Yes" : "No")}
  ${reg.isUrgent ? row("Urgency Explanation", reg.urgencyExplanation) : ""}
  ${row("Previous ASIC Refusal", reg.previousRefusal || "No")}
  ${reg.previousRefusalDetails ? row("Refusal Details", reg.previousRefusalDetails) : ""}
</table>

<!-- 4. STEP 2: COMPANY DETAILS -->
${sectionTitle(3, "Company Details")}
<table>
  ${row("Proposed Company Name (1st Choice)", reg.companyName1)}
  ${row("Proposed Company Name (2nd Choice)", reg.companyName2)}
  ${row("Proposed Company Name (3rd Choice)", reg.companyName3)}
  ${row("Use ACN as Name", reg.useAcnAsName ? "Yes" : "No")}
  ${row("Name Reserved with ASIC", reg.isNameReserved || "No")}
  ${reg.reservationNumber ? row("Reservation Number", reg.reservationNumber) : ""}
  ${reg.reservationDate ? row("Reservation Date", formatDate(reg.reservationDate)) : ""}
  ${row("Company Type", reg.companyType)}
  ${reg.specialPurposeDetail ? row("Special Purpose Detail", reg.specialPurposeDetail) : ""}
  ${row("Jurisdiction / State", reg.jurisdictionState)}
  ${row("Company Purpose", reg.companyPurpose)}
  ${reg.otherPurposeDetail ? row("Other Purpose Detail", reg.otherPurposeDetail) : ""}
  ${row("Main Business Activity", reg.mainBusinessActivity)}
  ${reg.anzsicDescription ? row("ANZSIC Description", reg.anzsicDescription) : ""}
  ${row("Trading Name Choice", reg.tradingNameChoice)}
  ${reg.proposedBusinessName ? row("Proposed Business Name", reg.proposedBusinessName) : ""}
  ${row("Expected Commencement Date", formatDate(reg.commencementDate))}
  ${row("Part of Corporate Group", reg.isPartOfGroup || "No")}
  ${reg.ultimateHoldingName ? row("Ultimate Holding Company", reg.ultimateHoldingName) : ""}
  ${reg.ultimateHoldingAcn ? row("Ultimate Holding ACN", reg.ultimateHoldingAcn) : ""}
  ${reg.ultimateHoldingCountry ? row("Ultimate Holding Country", reg.ultimateHoldingCountry) : ""}
  ${reg.governanceDocument ? row("Governance Document", reg.governanceDocument) : ""}
  ${reg.specialInstructions ? row("Special Instructions", reg.specialInstructions) : ""}
</table>

<!-- 5. STEP 3: ADDRESSES -->
${sectionTitle(4, "Registered Office & Principal Place of Business")}
<table>
  ${row("Registered Office", [reg.regOfficeHouseNumber, reg.regOfficeStreet, reg.regOfficeSuburb, reg.regOfficeState, reg.regOfficePostcode].filter(Boolean).join(", ") || "N/A")}
  ${row("Company Occupies Registered Office", reg.companyOccupiesRegisteredOffice || "N/A")}
  ${reg.occupierName ? row("Occupier Name / Consent", reg.occupierName) : ""}
  ${row("Same as Principal Place of Business", reg.samePrincipalAddress || "N/A")}
  ${reg.samePrincipalAddress === "No" ? row("Principal Place of Business", [reg.ppobHouseNumber, reg.ppobStreet, reg.ppobSuburb, reg.ppobState, reg.ppobPostcode].filter(Boolean).join(", ") || "N/A") : ""}
</table>
${reg.provideRegisteredOfficeAddress || reg.providePrincipalPlaceAddress ? `
<div class="sub-heading">Address Service</div>
<table>
  ${row("Registered Office Address Service", reg.provideRegisteredOfficeAddress ? "Requested" : "Not Requested")}
  ${row("Principal Place Address Service", reg.providePrincipalPlaceAddress ? "Requested" : "Not Requested")}
  ${reg.addressServiceCommercialReason ? row("Commercial Reason", reg.addressServiceCommercialReason) : ""}
  ${reg.authorisedRecipientName ? row("Authorised Recipient", reg.authorisedRecipientName) : ""}
  ${reg.authorisedRecipientEmail ? row("Recipient Email", reg.authorisedRecipientEmail) : ""}
  ${row("Address Service Terms Accepted", reg.addressServiceAccepted ? "Yes" : "No")}
</table>
` : ""}

<!-- 6. SCHEDULE A: OFFICEHOLDERS -->
${sectionTitle(5, "Proposed Directors & Secretaries")}
${officeholders.length > 0 ? officeholders.map((oh, i) => `
<div class="person-card">
  <h4>Director/Secretary ${i + 1}: ${oh.fullName || "N/A"}</h4>
  <table>
    ${row("Role", oh.role)}
    ${row("Full Legal Name", oh.fullName)}
    ${oh.formerNames ? row("Former Names", oh.formerNames) : ""}
    ${row("Date of Birth", formatDate(oh.dob))}
    ${row("Place of Birth", [oh.birthCity, oh.birthState, oh.birthCountry].filter(Boolean).join(", ") || "N/A")}
    ${row("Residential Address", oh.residentialAddress)}
    ${row("Email", oh.email)}
    ${row("Mobile", oh.mobile)}
    ${row("Occupation", oh.occupation)}
    ${row("Citizenship", oh.citizenship)}
    ${row("Tax Residence", oh.taxResidence)}
    ${row("Australian Resident Director", oh.isAustralianResidentDirector ? "Yes" : "No")}
    ${row("Director ID Status", oh.directorIdStatus)}
    ${oh.directorIdNumber ? row("Director ID Number", oh.directorIdNumber) : ""}
    ${row("Identity Document Type", oh.idDocType)}
    ${row("Identity Document Number", oh.idDocNumber)}
    ${row("PEP Status", oh.pepStatus || "No")}
    ${row("Sanctions Declaration", oh.sanctionsDeclaration || "Clear")}
    ${row("Consent to Act Accepted", oh.consentAccepted ? "Yes" : "No")}
    ${row("Consent Date", formatDate(oh.signatureDate))}
  </table>
  ${oh.signatureData ? `<div class="signature-block"><strong>Signature:</strong><br/><img src="${oh.signatureData.startsWith("data:") ? oh.signatureData : getSignatureBase64Uri(oh.signatureData) || ""}" alt="Director Signature" /></div>` : ""}
</div>
`).join("") : "<p>No officeholders recorded.</p>"}

<!-- 7. SCHEDULE B: SHAREHOLDERS -->
${sectionTitle(6, "Members / Shareholders & Share Structure")}
${shareholders.length > 0 ? `<table>
<tr><th>#</th><th>Name</th><th>Type</th><th>Share Class</th><th>Shares</th><th>Paid/Share</th><th>Unpaid/Share</th><th>Beneficial</th></tr>
${shareholders.map((sh, i) => `<tr>
  <td>${i + 1}</td>
  <td>${sh.fullName || "N/A"}</td>
  <td>${sh.memberType || "Individual"}</td>
  <td>${sh.shareClass || "Ordinary"}</td>
  <td>${sh.numberOfShares || "N/A"}</td>
  <td>$${sh.amountPaidPerShare || "1.00"}</td>
  <td>$${sh.amountUnpaidPerShare || "0.00"}</td>
  <td>${sh.isBeneficiallyHeld ? "Held for: " + (sh.heldForWhom || "N/A") : "Yes"}</td>
</tr>`).join("")}
</table>` : "<p>No shareholders recorded.</p>"}

<!-- 8. BENEFICIAL OWNERSHIP -->
${sectionTitle(7, "Beneficial Ownership & Control")}
${beneficialOwners.length > 0 ? `<table>
<tr><th>#</th><th>Name</th><th>DOB</th><th>Ownership %</th><th>Holding Type</th><th>Control Method</th></tr>
${beneficialOwners.map((bo, i) => `<tr>
  <td>${i + 1}</td>
  <td>${bo.fullName || "N/A"}</td>
  <td>${formatDate(bo.dob)}</td>
  <td>${bo.ownershipPercentage || "N/A"}%</td>
  <td>${bo.holdingType || "Direct"}</td>
  <td>${bo.howControlIsHeld || "N/A"}</td>
</tr>`).join("")}
</table>` : "<p>No beneficial owners recorded.</p>"}

<!-- 9. STEP 7: AML/CTF CDD -->
${sectionTitle(8, "Client Due Diligence Information")}
<table>
  ${row("Q1", reg.cddQ1 || "N/A")} ${reg.cddQ1Detail ? row("Q1 Detail", reg.cddQ1Detail) : ""}
  ${row("Q2", reg.cddQ2 || "N/A")} ${reg.cddQ2Detail ? row("Q2 Detail", reg.cddQ2Detail) : ""}
  ${row("Q3", reg.cddQ3 || "N/A")} ${reg.cddQ3Detail ? row("Q3 Detail", reg.cddQ3Detail) : ""}
  ${row("Q4", reg.cddQ4 || "N/A")} ${reg.cddQ4Detail ? row("Q4 Detail", reg.cddQ4Detail) : ""}
  ${row("Q5", reg.cddQ5 || "N/A")} ${reg.cddQ5Detail ? row("Q5 Detail", reg.cddQ5Detail) : ""}
  ${row("Q6", reg.cddQ6 || "N/A")} ${reg.cddQ6Detail ? row("Q6 Detail", reg.cddQ6Detail) : ""}
  ${row("Q7", reg.cddQ7 || "N/A")} ${reg.cddQ7Detail ? row("Q7 Detail", reg.cddQ7Detail) : ""}
  ${row("Q8", reg.cddQ8 || "N/A")} ${reg.cddQ8Detail ? row("Q8 Detail", reg.cddQ8Detail) : ""}
  ${row("Q9", reg.cddQ9 || "N/A")} ${reg.cddQ9Detail ? row("Q9 Detail", reg.cddQ9Detail) : ""}
  ${row("Q10", reg.cddQ10 || "N/A")} ${reg.cddQ10Detail ? row("Q10 Detail", reg.cddQ10Detail) : ""}
</table>

<!-- 10. STEP 8: SOURCE OF FUNDS -->
${sectionTitle(9, "Source of Funds / Source of Wealth")}
<table>
  ${row("Initial Capital Amount", reg.initialCapitalAmount ? "$" + reg.initialCapitalAmount : "N/A")}
  ${row("Initial Capital Paid By", reg.initialCapitalPaidBy)}
  ${row("Initial Capital Source", reg.initialCapitalSource)}
  ${row("First 12 Months Funding", reg.first12MonthsFundingAmount ? "$" + reg.first12MonthsFundingAmount : "N/A")}
  ${row("Funding Source", reg.first12MonthsFundingSource)}
  ${row("Funder Name", reg.first12MonthsFunderName)}
  ${row("Origin Bank", reg.first12MonthsOriginBank)}
  ${row("Source of Wealth Summary", reg.sourceOfWealthSummary)}
  ${row("Offshore Funding", reg.hasOffshoreFunding || "No")}
  ${reg.offshoreCountries ? row("Offshore Countries", reg.offshoreCountries) : ""}
  ${reg.offshoreBanks ? row("Offshore Banks", reg.offshoreBanks) : ""}
  ${reg.offshoreExplanation ? row("Offshore Explanation", reg.offshoreExplanation) : ""}
  ${row("Cash Over $10,000", reg.hasCashOver10k || "No")}
  ${reg.cashAmount ? row("Cash Amount", "$" + reg.cashAmount) : ""}
  ${reg.cashPayer ? row("Cash Payer", reg.cashPayer) : ""}
  ${reg.cashReason ? row("Cash Reason", reg.cashReason) : ""}
</table>

<!-- 11. STEP 9: NOMINEE/TRUSTEE -->
${sectionTitle(10, "Nominee / Trustee Arrangements")}
<table>
  ${row("Director Acting for Others", reg.isDirectorActingForOthers || "No")}
  ${reg.directorNominatorName ? row("Director Nominator", reg.directorNominatorName) : ""}
  ${row("Nominee Shareholder", reg.isNomineeShareholder || "No")}
  ${reg.nomineeNominator ? row("Nominee Nominator", reg.nomineeNominator) : ""}
  ${reg.nomineeBeneficialOwner ? row("Nominee Beneficial Owner", reg.nomineeBeneficialOwner) : ""}
  ${row("Trustee Involved", reg.isTrusteeInvolved || "No")}
  ${reg.trustName ? row("Trust Name", reg.trustName) : ""}
  ${reg.trustSettlor ? row("Trust Settlor", reg.trustSettlor) : ""}
  ${row("Legal Advice Obtained", reg.hasLegalAdvice || "No")}
  ${reg.legalAdviserName ? row("Legal Adviser", reg.legalAdviserName) : ""}
  ${reg.legalAdviceSummary ? row("Legal Advice Summary", reg.legalAdviceSummary) : ""}
  ${row("Arrangement Terms Accepted", reg.nomineeArrangementAccepted ? "Yes" : "N/A")}
</table>

<!-- 12. STEP 10: OPTIONAL SERVICES -->
${sectionTitle(11, "Optional Tax & Business Services")}
<table>
  ${row("ABN/TFN Registration", reg.abnTfnRequired || "No")}
  ${row("GST Registration", reg.gstRegistrationRequired || "No")}
  ${reg.expectedTurnover ? row("Expected Turnover", "$" + reg.expectedTurnover) : ""}
  ${row("PAYG Withholding", reg.paygWithholdingRequired || "No")}
  ${row("Business Name Registration", reg.businessNameRegistrationRequired || "No")}
  ${reg.proposedTaxBusinessName ? row("Proposed Business Name", reg.proposedTaxBusinessName) : ""}
  ${row("Bank Account Assistance", reg.bankAccountAssistance || "No")}
  ${row("Accounting Software", reg.accountingSoftware || "N/A")}
  ${reg.otherAccountingSoftware ? row("Other Software", reg.otherAccountingSoftware) : ""}
  ${row("Registered Agent Support", reg.registeredAgentSupport || "No")}
</table>

<!-- 13. SUPPORTING DOCUMENTS INDEX -->
${sectionTitle(12, "Supporting Documents Index")}
${documents.length > 0 ? `<table>
<tr><th>#</th><th>Document Type</th><th>File Name</th><th>Status</th></tr>
${documents.map((doc, i) => `<tr>
  <td>${i + 1}</td>
  <td>${doc.documentType || "N/A"}</td>
  <td>${doc.fileName || "N/A"}</td>
  <td>${doc.status || "Attached"}</td>
</tr>`).join("")}
</table>` : "<p>No supporting documents uploaded.</p>"}

<!-- 14-19. LEGAL APPENDICES -->
${sectionTitle(13, "Statutory Declarations & Final Execution")}
<table>
  ${row("Declaration 1 - Information Truthfulness", reg.declaration1 ? "✓ Accepted" : "Not Accepted")}
  ${row("Declaration 2 - Authority Confirmation", reg.declaration2 ? "✓ Accepted" : "Not Accepted")}
  ${row("Declaration 3 - Director Consent Confirmation", reg.declaration3 ? "✓ Accepted" : "Not Accepted")}
  ${row("Declaration 4 - Member Consent Confirmation", reg.declaration4 ? "✓ Accepted" : "Not Accepted")}
  ${row("Declaration 5 - Compliance Undertaking", reg.declaration5 ? "✓ Accepted" : "Not Accepted")}
  ${row("Declaration 6 - Legal Obligations Acknowledgement", reg.declaration6 ? "✓ Accepted" : "Not Accepted")}
</table>

<!-- SIGNATORY 1 -->
<div class="signature-block">
  <strong>Signatory 1:</strong> ${reg.signatory1Name || "N/A"} (${reg.signatory1Capacity || "N/A"})
  <br/>Date: ${formatDate(reg.signatory1Date)}
  ${reg.signatory1Signature ? `<br/><img src="${reg.signatory1Signature.startsWith("data:") ? reg.signatory1Signature : getSignatureBase64Uri(reg.signatory1Signature) || ""}" alt="Signatory 1" />` : ""}
</div>

<!-- SIGNATORY 2 -->
${reg.signatory2Name ? `<div class="signature-block">
  <strong>Signatory 2:</strong> ${reg.signatory2Name || "N/A"} (${reg.signatory2Capacity || "N/A"})
  <br/>Date: ${formatDate(reg.signatory2Date)}
  ${reg.signatory2Signature ? `<br/><img src="${reg.signatory2Signature.startsWith("data:") ? reg.signatory2Signature : getSignatureBase64Uri(reg.signatory2Signature) || ""}" alt="Signatory 2" />` : ""}
</div>` : ""}

<!-- 20. AUDIT FOOTER -->
<div class="footer">
  <p>Financially Up Pty Ltd | Company Registration Client Intake Application | Ref: ${reg.referenceNumber || "Draft"}</p>
  <p>Generated: ${formatDateTime(now)} | Template Version: v1.0.0 | CONFIDENTIAL</p>
</div>

</body>
</html>`;
}

module.exports = { renderClientApplicationHtml };
