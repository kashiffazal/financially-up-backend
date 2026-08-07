/**
 * Admin Review PDF Template — Individual Engagement Form
 * ======================================================
 * Renders the comprehensive internal Office Review Package for Tax Agents & Staff.
 * Styled in Financially Up brand primary (#008043) & soft light (#eaf7f0) theme.
 */

const path = require("path");
const fs = require("fs");

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

function getSignatureBase64Uri(relPath) {
  if (!relPath) return null;
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

function parseArrayField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return val.split(",").map((s) => s.trim());
    }
  }
  return [];
}

function renderAdminReviewHtml(data) {
  const referenceNumber = data.referenceNumber || `NENG-${Date.now()}`;
  const client = data.client || {};
  const services = data.services || [];
  const identity = data.identity || {};
  const documents = data.documents || [];
  const signatures = data.signatures || [];
  const clientSig = signatures.find((s) => s.signerType === "Client") || signatures[0];

  const incomeActivities = parseArrayField(data.incomeActivities);
  const logoUri = getLogoBase64Uri();
  const sigImageUri = clientSig?.signatureFilePath ? getSignatureBase64Uri(clientSig.signatureFilePath) : null;
  const now = new Date();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${referenceNumber}_Admin_Review</title>
  <style>
    @page { size: A4; margin: 15mm 12mm 15mm 12mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 10.5px; line-height: 1.45; }
    
    .header-banner { border-bottom: 3px solid #008043; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
    .brand-logo { max-height: 46px; max-width: 210px; object-fit: contain; }
    .brand-subtitle { font-size: 10px; color: #008043; font-weight: 800; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.3px; }
    .ref-badge { background: #eaf7f0; border: 1px solid #a7f3d0; color: #065f46; padding: 5px 10px; border-radius: 6px; font-family: monospace; font-size: 11px; font-weight: bold; }
    
    .section-head { font-size: 11.5px; font-weight: 800; color: #008043; background: #eaf7f0; border-left: 4px solid #008043; padding: 5px 8px; margin-top: 15px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 10px; text-align: left; word-break: break-word; }
    th { background: #f8fafc; font-weight: 700; color: #334155; width: 28%; }

    .risk-badge { display: inline-block; padding: 3px 8px; border-radius: 5px; font-weight: bold; font-size: 10px; }
    .risk-low { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .risk-high { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

    .tag { display: inline-block; background: #eaf7f0; color: #008043; border: 1px solid #a7f3d0; font-weight: bold; padding: 2px 7px; border-radius: 5px; font-size: 9.5px; margin-right: 4px; margin-bottom: 2px; }

    .signature-box { border: 1.5px dashed #008043; background: #f0fdf4; padding: 10px; border-radius: 8px; margin-top: 10px; }
    
    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; }
  </style>
</head>
<body>

  <!-- Header Banner with Logo -->
  <div class="header-banner">
    <div>
      <img src="${logoUri}" class="brand-logo" alt="Financially Up" />
      <div class="brand-subtitle">Tax Agent Office Review & Application Data Sheet</div>
    </div>
    <div class="ref-badge">
      CONFIDENTIAL: ${referenceNumber}
    </div>
  </div>

  <!-- Step 1: Selected Services & Entity Requirements -->
  <div class="section-head">Step 1: Selected Services & Entity Scope</div>
  <table>
    <tr>
      <th>Selected Tax Services</th>
      <td>
        ${services.length > 0 ? services.map(s => `<span class="tag">${s.serviceName}</span>`).join(' ') : '<span class="tag">Individual Income Tax Return</span>'}
      </td>
    </tr>
    <tr>
      <th>Additional Entity Service Needed?</th>
      <td>${data.entityService || 'No'}</td>
    </tr>
  </table>

  <!-- Step 2: Personal Information -->
  <div class="section-head">Step 2: Personal Information</div>
  <table>
    <tr><th>Full Legal Name</th><td>${client.fullName || 'N/A'}</td><th>Email Address</th><td>${client.email || 'N/A'}</td></tr>
    <tr><th>Mobile Number</th><td>${client.mobile || 'N/A'}</td><th>Date of Birth</th><td>${client.dateOfBirth || 'N/A'}</td></tr>
    <tr><th>Country of Birth</th><td>${client.birthCountry || 'N/A'}</td><th>City of Birth</th><td>${client.birthCity || 'N/A'}</td></tr>
    <tr><th>Occupation</th><td>${client.occupation || 'N/A'}</td><th>Employment Status</th><td>${client.employmentStatus || 'N/A'}</td></tr>
    <tr><th>Tax File Number (TFN)</th><td><strong>${client.tfn || client.maskedTfn || 'N/A'}</strong></td><th>About / Notes</th><td>${client.about || 'None'}</td></tr>
    <tr><th>Has Previous / Maiden Name?</th><td>${data.hasPreviousName || 'No'}</td><th>Previous Names</th><td>${data.previousNames || 'N/A'}</td></tr>
    <tr><th>Residential Address</th><td colspan="3">${data.address || 'N/A'}</td></tr>
    <tr><th>Postal Address</th><td colspan="3">${data.postalAddress || data.address || 'Same as Residential Address'}</td></tr>
  </table>

  <!-- Step 3: Residency & Family Profile -->
  <div class="section-head">Step 3: Tax Residency & Family Profile</div>
  <table>
    <tr><th>Australian Citizen</th><td>${data.isAustralianCitizen ? 'Yes' : 'No'}</td><th>Country of Citizenship</th><td>${data.citizenshipCountry || 'Australia'}</td></tr>
    <tr><th>Visa Status</th><td>${data.visaStatus || 'N/A'}</td><th>Visa Subclass</th><td>${data.visaSubclass || 'N/A'}</td></tr>
    <tr><th>Visa Expiry Date</th><td>${data.visaExpiry || 'N/A'}</td><th>First Arrival Date</th><td>${data.arrivalDate || 'N/A'}</td></tr>
    <tr><th>Tax Residency Status</th><td colspan="3"><strong>${data.taxResidency || 'Australian Resident'}</strong></td></tr>
    <tr><th>Date Became Resident</th><td>${data.residentArrival || 'N/A'}</td><th>Date Ceased Resident</th><td>${data.residentDeparture || 'N/A'}</td></tr>
    <tr><th>Foreign Country of Residence</th><td>${data.foreignCountry || 'N/A'}</td><th>Overseas Income & Assets</th><td>${data.foreignInfo || 'None'}</td></tr>
    <tr><th>Has Spouse</th><td>${data.hasSpouse || 'No'}</td><th>Spouse Full Name</th><td>${data.spouseName || 'N/A'}</td></tr>
    <tr><th>Spouse Date of Birth</th><td>${data.spouseDob || 'N/A'}</td><th>Spouse Taxable Income</th><td>${data.spouseIncome ? `$${data.spouseIncome}` : 'N/A'}</td></tr>
    <tr><th>Prepare Spouse Return?</th><td>${data.prepareSpouseReturn || 'No'}</td><th>Has Dependants</th><td>${data.hasDependants || 'No'} (${data.dependantCount || 0} children)</td></tr>
  </table>

  <!-- Step 4: Income Profile & ATO Matters -->
  <div class="section-head">Step 4: Income Profile & ATO Matters</div>
  <table>
    <tr>
      <th>Selected Income Activities</th>
      <td colspan="3">
        ${incomeActivities.length > 0 ? incomeActivities.map(act => `<span class="tag">${act}</span>`).join(' ') : '<span class="tag">Salary/Wages</span>'}
      </td>
    </tr>
    <tr><th>Had Previous Tax Agent</th><td>${data.hadPreviousAccountant || 'No'}</td><th>Previous Firm Name</th><td>${data.previousFirm || 'N/A'}</td></tr>
    <tr><th>Authorise Ethical Contact</th><td>${data.authorisePreviousAdvisor || 'N/A'}</td><th>Reason for Change</th><td>${data.reasonForChange || 'N/A'}</td></tr>
    <tr><th>ATO Debts / Disputes / Audits</th><td><strong>${data.atoIssues || 'No'}</strong></td><th>ATO Matter Description</th><td>${data.atoExplanation || 'None'}</td></tr>
    <tr><th>ATO Notice Date</th><td>${data.noticeDate || 'N/A'}</td><th>ATO Due Date</th><td>${data.dueDate || 'N/A'}</td></tr>
  </table>

  <!-- Step 5: Sole Trader / BAS / ABN / GST Profile -->
  <div class="section-head">Step 5: Sole Trader, BAS, ABN & GST Profile</div>
  <table>
    <tr><th>Existing ABN</th><td>${data.existingAbn || 'None'}</td><th>ABN Status</th><td>${data.abnStatus || 'N/A'}</td></tr>
    <tr><th>BAS Lodgement Period</th><td>${data.basPeriod || 'N/A'}</td><th>GST Reporting Frequency</th><td>${data.reportingFrequency || 'N/A'}</td></tr>
    <tr><th>GST Registration Status</th><td>${data.gstStatus || 'N/A'}</td><th>Overdue BAS Statements?</th><td>${data.overdueBas || 'No'}</td></tr>
    <tr><th>Accounting Records Complete?</th><td>${data.recordsComplete || 'Yes'}</td><th>Maintained By</th><td>${data.recordsMaintainedBy || 'Client'}</td></tr>
    <tr><th>Business Start Date</th><td>${data.businessStartDate || 'N/A'}</td><th>Primary Business Activity</th><td>${data.businessActivity || 'N/A'}</td></tr>
    <tr><th>Business Location</th><td>${data.businessLocation || 'N/A'}</td><th>Expected Annual Turnover</th><td>${data.expectedTurnover ? `$${data.expectedTurnover}` : 'N/A'}</td></tr>
    <tr><th>Profit Expectation</th><td>${data.profitExpectation || 'Yes'}</td><th>Has Employees / PAYG</th><td>${data.hasEmployees || 'No'} (PAYG Reg: ${data.registerPAYG || 'No'})</td></tr>
    <tr><th>Register for GST?</th><td>${data.registerGST || 'No'}</td><th>GST Effective Date</th><td>${data.gstEffectiveDate || 'N/A'}</td></tr>
    <tr><th>Accounting Method</th><td>${data.accountingMethod || 'Cash'}</td><th>Fuel Tax / Imports / Exports</th><td>Fuel: ${data.fuelTaxCredits || 'No'} | Imports: ${data.imports || 'No'} | Exports: ${data.exports || 'No'}</td></tr>
  </table>

  <!-- Step 6: Documents & TPB Identity Verification -->
  <div class="section-head">Step 6: Documents & Identity Verification</div>
  <table>
    <tr><th>ID Verification Method</th><td>${identity.identityMethod || 'Upload ID'}</td><th>DVS Status</th><td><strong>${identity.dvsStatus || 'Pass'}</strong></td></tr>
    <tr><th>No Photo ID Reason</th><td colspan="3">${identity.noPhotoIdReason || 'N/A'}</td></tr>
    <tr>
      <th>Uploaded Documents</th>
      <td colspan="3">
        ${documents.length > 0 ? documents.map(d => `<span class="tag">${d.documentCategory}: ${d.fileName}</span>`).join(' ') : 'No document files attached'}
      </td>
    </tr>
  </table>

  <!-- Step 7: Representative & Refund Bank Account -->
  <div class="section-head">Step 7: Representative & Refund Bank Account</div>
  <table>
    <tr><th>Submitting For Self?</th><td>${data.isSelf || 'Yes'}</td><th>Representative Name</th><td>${data.repName || 'N/A'} (${data.relationship || 'N/A'})</td></tr>
    <tr><th>Representative Authority</th><td colspan="3">${data.authorityDesc || 'N/A'}</td></tr>
    <tr><th>Refund Bank Account Required?</th><td>${data.needBank || 'Yes'}</td><th>Account Name</th><td>${data.accountName || 'N/A'}</td></tr>
    <tr><th>BSB</th><td>${data.bsb || 'N/A'}</td><th>Account Number</th><td>${data.accountNumber || 'N/A'}</td></tr>
  </table>

  <!-- Step 8 & 9: Legal Consents & Declarations -->
  <div class="section-head">Step 8 & 9: Statutory Declarations & Legal Consents</div>
  <table>
    <tr><th>TASA 2009 Authority</th><td>✔ Accepted</td><th>Privacy Act 1988 Consent</th><td>✔ Accepted</td></tr>
    <tr><th>ATO Tax Agent Portal Consent</th><td>✔ Accepted</td><th>Biometric / ID Consent</th><td>✔ Accepted</td></tr>
  </table>

  <!-- Step 10: Electronic Signature Verification -->
  <div class="section-head">Step 10: Electronic Signature Verification Stamp</div>
  <div class="signature-box">
    <div>Signer Name: <strong>${clientSig?.signerFullName || client.fullName}</strong> | Method: <strong>${clientSig?.signatureMethod || 'draw'}</strong></div>
    ${sigImageUri ? `
      <div style="margin-top: 8px;">
        <img src="${sigImageUri}" style="max-height: 55px; max-width: 250px; border-bottom: 2px solid #008043; object-fit: contain;" />
      </div>
    ` : `
      <div style="font-family: cursive; font-size: 20px; color: #008043; margin-top: 6px;">
        ${clientSig?.signerFullName || client.fullName}
      </div>
    `}
    <div style="font-size: 9.5px; color: #047857; margin-top: 6px;">
      IP Address: ${clientSig?.ipAddress || '127.0.0.1'} | Timestamp: ${now.toLocaleString('en-AU')} | ETA 1999 Legally Binding
    </div>
  </div>

  <!-- Tax Agent Review Checklist & Risk Assessment -->
  <div class="section-head">Tax Agent Review & Compliance Assessment</div>
  <table>
    <tr>
      <th>Overall Risk Level</th>
      <td>
        <span class="risk-badge ${data.riskLevel === 'High' || data.riskLevel === 'Unacceptable' ? 'risk-high' : 'risk-low'}">
          ${data.riskLevel || 'Low Risk'}
        </span>
      </td>
      <th>Review Status</th>
      <td><strong>${data.status || 'Pending Review'}</strong></td>
    </tr>
    <tr>
      <th>Tax Agent Reviewer Notes</th>
      <td colspan="3">${data.riskNotes || 'Initial automated submission logged. Awaiting Tax Agent review.'}</td>
    </tr>
  </table>

  <!-- Footer -->
  <div class="footer">
    INTERNAL CONFIDENTIAL DOCUMENT — FOR TAX AGENT & COMPLIANCE OFFICERS ONLY — FINANCIALLY UP ERP
  </div>

</body>
</html>
  `;
}

module.exports = { renderAdminReviewHtml };
