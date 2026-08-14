/**
 * Engagement Acceptance PDF Template - Individual Engagement Form
 * ================================================================
 * Renders the Official Engagement Acceptance PDF issued to the client after
 * Tax Agent Phase 2 approval for Individual Client Engagements.
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
  return (
    process.env.COMPANY_LOGO_URL || "http://localhost:5000/images/logo.png"
  );
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

function renderEngagementAcceptanceHtml(data) {
  const referenceNumber = data.referenceNumber || `NENG-${Date.now()}`;
  const client = data.client || {};
  let services = data.services || [];
  if (services.length === 0) {
    services = [{ serviceName: "Individual Income Tax Return" }];
  }
  const signatures = data.signatures || [];
  const clientSig =
    signatures.find((s) => s.signerType === "Client") || signatures[0];
  const taxAgentSig = signatures.find((s) => s.signerType === "TaxAgent");

  const logoUri = getLogoBase64Uri();
  const clientSigUri = clientSig?.signatureFilePath
    ? getSignatureBase64Uri(clientSig.signatureFilePath)
    : null;
  const taxAgentSigUri = taxAgentSig?.signatureFilePath
    ? getSignatureBase64Uri(taxAgentSig.signatureFilePath)
    : null;
  const now = new Date();
  const currentYear = now.getFullYear();

  // Process schedule parameters for each service
  const scheduleRows = services.map((s, idx) => {
    const srvName =
      typeof s === "string"
        ? s
        : s.serviceName || "Individual Income Tax Return";
    let fee = "$180.00 (ex. GST)";
    let deliverable = `${srvName} Lodgement & Advice`;
    let includedWork =
      "Data verification, ATO portal pre-fill check, tax calculation, electronic lodgement, and notice of assessment review.";
    let excludedWork =
      "ATO audit defense, legal advisory, bookkeeping/data entry, or financial planning advice.";
    let infoDeadline = "15 October";
    let lodgmentDeadline = "31 October";
    let specialConditions =
      "Client must provide all income statements, interest records, and deduction receipts prior to preparation.";
    let period = `FY ${currentYear - 1}-${currentYear}`;

    if (srvName.includes("Rental Property")) {
      fee = "+ $120.00 / property (ex. GST)";
      deliverable = "Rental Property Schedule & Capital Works Advice";
      specialConditions =
        "Client must supply 12-month property manager annual statement and loan interest statements.";
    } else if (srvName.includes("Capital Gains")) {
      fee = "+ $150.00 / CGT event (ex. GST)";
      deliverable = "Capital Gains Tax Schedule & Discount Calculation";
      specialConditions =
        "Client must supply purchase contract, settlement statements, and cost base records.";
    } else if (srvName.includes("Cryptocurrency")) {
      fee = "+ $150.00 / crypto report (ex. GST)";
      deliverable = "Cryptocurrency Tax Report & Capital Loss Tracking";
      specialConditions =
        "Client must supply complete exchange transaction CSV logs or API read access.";
    } else if (srvName.includes("Sole Trader BAS")) {
      fee = "$220.00 / quarter (ex. GST)";
      deliverable = "Quarterly BAS Preparation & Lodgement";
      period = "Quarterly (Q1 - Q4)";
      infoDeadline = "21st of month following quarter end";
      lodgmentDeadline = "28th of month following quarter end";
      specialConditions =
        "Client must maintain reconciled bank records or software file.";
    } else if (srvName.includes("ABN Application")) {
      fee = "$150.00 (Fixed ex. GST)";
      deliverable = "ABN & Business Registration Processing";
      period = "One-Off";
      infoDeadline = "Immediate upon engagement";
      lodgmentDeadline = "Within 3 business days";
      specialConditions =
        "Subject to Registrar identification checks and business entity eligibility.";
    } else if (srvName.includes("GST Registration")) {
      fee = "$150.00 (Fixed ex. GST)";
      deliverable = "GST Registration & ATO System Setup";
      period = "One-Off";
      infoDeadline = "Immediate upon engagement";
      lodgmentDeadline = "Within 3 business days";
      specialConditions =
        "Client must confirm projected turnover exceeds $75,000 threshold.";
    } else if (srvName.includes("Prior-Year Return")) {
      fee = "$220.00 / return (ex. GST)";
      deliverable = "Prior Year Overdue Tax Return Lodgement";
      infoDeadline = "Immediate";
      lodgmentDeadline = "Within 14 business days";
      specialConditions =
        "May involve ATO failure to lodge penalties which remain client responsibility.";
    } else if (srvName.includes("Tax Return Amendment")) {
      fee = "$150.00 / amendment (ex. GST)";
      deliverable = "Notice of Assessment Amendment Request";
      specialConditions =
        "Requires copy of original notice of assessment and justification documents.";
    } else if (srvName.includes("Tax Planning")) {
      fee = "$300.00 / session (ex. GST)";
      deliverable = "Pre-EOFY Tax Minimization Strategy";
      period = "Annual Pre-EOFY";
      infoDeadline = "May 31st";
      lodgmentDeadline = "June 30th";
    }

    return {
      index: idx + 1,
      service: srvName,
      period,
      deliverable,
      includedWork,
      excludedWork,
      infoDeadline,
      expectedCompletion: "14 business days from receipt of complete info",
      lodgmentDeadline,
      fee,
      gstTreatment: "10% GST applies to all professional fees",
      urgentWorkLimit: "Urgent requests (< 5 days) incur 30% surcharge",
      specialConditions,
      responsibleAccountant: "Financially Up - Registered Tax Agent Team",
      engagementTerm: "Ongoing until terminated in writing (14 days notice)",
      acceptanceDate: now.toLocaleDateString("en-AU"),
    };
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${referenceNumber}_Engagement_Acceptance</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
    
    .header-banner { border-bottom: 3px solid #008043; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
    .brand-logo { max-height: 44px; max-width: 200px; object-fit: contain; }
    .brand-subtitle { font-size: 10px; color: #008043; font-weight: 800; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.3px; }
    .ref-badge { background: #eaf7f0; border: 1px solid #a7f3d0; color: #065f46; padding: 5px 10px; border-radius: 6px; font-family: monospace; font-size: 12px; font-weight: bold; }
    
    .accept-box { background: #f0fdf4; border: 1.5px solid #008043; border-radius: 10px; padding: 12px; margin-bottom: 15px; text-align: center; }
    .accept-title { font-size: 15px; font-weight: 800; color: #008043; margin-bottom: 4px; }
    
    .section-head { font-size: 12px; font-weight: 800; color: #008043; background: #eaf7f0; border-left: 4px solid #008043; padding: 4px 8px; margin-top: 18px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; color: #334155; }

    .schedule-box { border: 1px solid #008043; border-radius: 8px; padding: 10px; margin-bottom: 10px; background: #fafdfb; page-break-inside: avoid; }
    .schedule-title { font-size: 11px; font-weight: bold; color: #008043; margin-bottom: 6px; border-bottom: 1px solid #a7f3d0; padding-bottom: 4px; }

    .signatures-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; page-break-inside: avoid; }
    .sig-card { border: 1px dashed #008043; border-radius: 8px; padding: 10px; background: #f0fdf4; }
    .sig-header { font-size: 10px; font-weight: bold; color: #008043; text-transform: uppercase; margin-bottom: 4px; }

    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }
  </style>
</head>
<body>

  <!-- Header Banner with Logo -->
  <div class="header-banner">
    <div>
      <img src="${logoUri}" class="brand-logo" alt="Financially Up" />
      <div class="brand-subtitle">Official Tax Agent Engagement Acceptance Notice</div>
    </div>
    <div class="ref-badge">
      ${referenceNumber}
    </div>
  </div>

  <!-- Acceptance Hero Box -->
  <div class="accept-box">
    <div class="accept-title">✅ APPLICATION ACCEPTED & REGISTERED</div>
    <div style="font-size: 11px; color: #047857;">
      Financially Up has formally accepted your tax engagement application for client <strong>${client.fullName}</strong>.
    </div>
  </div>

  <!-- Section 1: Accepted Official Engagement Schedule (15 Parameters) -->
  <div class="section-head">1. Accepted Engagement Schedule & Scope Matrix (15 Parameters)</div>
  ${scheduleRows
    .map(
      (row) => `
    <div class="schedule-box">
      <div class="schedule-title">
        Service #${row.index}: ${row.service} | Status: ACCEPTED | Fee: ${row.fee}
      </div>
      <table>
        <tr>
          <th style="width: 20%;">1. Service</th>
          <td style="width: 30%;">${row.service}</td>
          <th style="width: 20%;">2. Year / Period</th>
          <td style="width: 30%;">${row.period}</td>
        </tr>
        <tr>
          <th>3. Deliverable</th>
          <td>${row.deliverable}</td>
          <th>6. Info Deadline</th>
          <td><strong>${row.infoDeadline}</strong></td>
        </tr>
        <tr>
          <th>7. Expected Completion</th>
          <td>${row.expectedCompletion}</td>
          <th>8. Lodgment Deadline</th>
          <td><strong>${row.lodgmentDeadline}</strong></td>
        </tr>
        <tr>
          <th>9. Professional Fee</th>
          <td><strong>${row.fee}</strong></td>
          <th>10. GST Treatment</th>
          <td>${row.gstTreatment}</td>
        </tr>
        <tr>
          <th>11. Urgent Work Limit</th>
          <td>${row.urgentWorkLimit}</td>
          <th>12. Special Conditions</th>
          <td>${row.specialConditions}</td>
        </tr>
        <tr>
          <th>4. Included Work</th>
          <td colspan="3" style="color: #065f46; background: #f0fdf4;">${row.includedWork}</td>
        </tr>
        <tr>
          <th>5. Excluded Work</th>
          <td colspan="3" style="color: #9f1239; background: #fff1f2;">${row.excludedWork}</td>
        </tr>
      </table>
    </div>
  `,
    )
    .join("")}

  <table style="margin-top: 6px;">
    <tr>
      <th style="width: 25%;">13. Responsible Accountant</th>
      <td>Financially Up - Registered Tax Agent Team</td>
      <th style="width: 25%;">14. Engagement Term</th>
      <td>Ongoing until terminated in writing (14 days notice)</td>
    </tr>
    <tr>
      <th>15. Acceptance Date</th>
      <td colspan="3">${now.toLocaleDateString("en-AU")}</td>
    </tr>
  </table>

  <!-- Section 2: Statutory Terms & ATO Authority -->
  <div class="section-head">2. Statutory Rights & Legal Framework</div>
  <p style="font-size: 10px; color: #475569; line-height: 1.5; margin: 0;">
    This document constitutes a binding engagement contract under the Tax Agent Services Act 2009 (TASA 2009). Financially Up is authorized to represent you before the Australian Taxation Office (ATO), manage portal records, prepare income tax returns, and handle statutory correspondence.
  </p>

  <!-- Section 3: Dual Counter-Signatures -->
  <div class="signatures-grid">
    <div class="sig-card">
      <div class="sig-header">Client Signature</div>
      <div><strong>${clientSig?.signerFullName || client.fullName}</strong></div>
      ${
        clientSigUri
          ? `
        <img src="${clientSigUri}" style="max-height: 45px; max-width: 180px; margin-top: 4px; object-fit: contain;" />
      `
          : `<div style="font-family: cursive; font-size: 16px; color: #008043; margin-top: 4px;">${client.fullName}</div>`
      }
      <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Signed: ${clientSig?.createdAt ? new Date(clientSig.createdAt).toLocaleDateString("en-AU") : now.toLocaleDateString("en-AU")}</div>
    </div>

    <div class="sig-card">
      <div class="sig-header">Registered Tax Agent Approval</div>
      <div><strong>${taxAgentSig?.signerFullName || "Financially Up Tax Agent"}</strong></div>
      <div style="font-size: 10px; color: #008043; font-weight: bold; margin-top: 2px;">
        Tax Agent Registration # 2601 4892
      </div>
      ${
        taxAgentSigUri
          ? `
        <img src="${taxAgentSigUri}" style="max-height: 45px; max-width: 180px; margin-top: 4px; object-fit: contain;" />
      `
          : `<div style="font-family: cursive; font-size: 16px; color: #008043; margin-top: 4px;">Financially Up Tax Agent</div>`
      }
      <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Accepted Date: ${now.toLocaleDateString("en-AU")}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Financially Up | Registered Tax Agent | Level 5, 100 Walker St, North Sydney NSW 2060 | Phone: 1300 328 316 | Email: info@financiallyup.com.au
  </div>

</body>
</html>
  `;
}

module.exports = { renderEngagementAcceptanceHtml };
