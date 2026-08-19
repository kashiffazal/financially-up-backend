/**
 * Admin Compliance Review PDF Template - Company Registration
 * ===========================================================
 * Renders the internal admin AML/CTF compliance review PDF.
 * NOT client-facing. Contains risk ratings, PEP screening, and decision logs.
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

function formatDateTime(dateVal) {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function row(label, value) {
  return `<tr><td class="label">${label}</td><td class="value">${value || "N/A"}</td></tr>`;
}

function renderAdminReviewHtml(data) {
  const reg = data;
  const review = data.adminReview || {};
  const logoUri = getLogoBase64Uri();
  const now = new Date();

  const riskColors = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444", Prohibited: "#7f1d1d" };
  const riskColor = riskColors[review.overallRiskRating] || "#666";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Admin Compliance Review - ${reg.referenceNumber || "Draft"}</title>
<style>
  @page { margin: 20mm 15mm 25mm 15mm; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #1a1a2e; line-height: 1.5; margin: 0; padding: 0; }
  .header { background: #1a1a2e; color: #fff; padding: 20px; text-align: center; }
  .header img { max-width: 150px; margin-bottom: 10px; }
  .header h1 { font-size: 18px; margin: 5px 0; }
  .header .confidential { background: #ef4444; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 10px; display: inline-block; margin-top: 8px; }
  .section-title { background: #1a1a2e; color: #fff; padding: 8px 14px; font-size: 12px; font-weight: 700; margin: 20px 0 10px 0; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  table td { padding: 6px 10px; border: 1px solid #ddd; font-size: 10px; vertical-align: top; }
  td.label { background: #f0f0f5; font-weight: 600; width: 38%; color: #333; }
  td.value { color: #1a1a2e; }
  .risk-badge { padding: 4px 12px; border-radius: 4px; font-weight: 700; color: #fff; display: inline-block; }
  .footer { text-align: center; font-size: 8px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 8px; }
</style>
</head>
<body>

<div class="header">
  <img src="${logoUri}" alt="Logo" />
  <h1>Admin Compliance Review</h1>
  <p>${reg.referenceNumber || "Draft"} | ${reg.companyName1 || "Proposed Company"}</p>
  <div class="confidential">⚠ INTERNAL & CONFIDENTIAL - NOT FOR CLIENT DISTRIBUTION</div>
</div>

<div class="section-title">Application Summary</div>
<table>
  ${row("Reference", reg.referenceNumber)}
  ${row("Proposed Company", reg.companyName1)}
  ${row("Company Type", reg.companyType)}
  ${row("Contact", reg.contactName)}
  ${row("Status", reg.status)}
  ${row("Submitted", formatDateTime(reg.submittedAt))}
</table>

<div class="section-title">Risk Assessment</div>
<table>
  ${row("Overall Risk Rating", `<span class="risk-badge" style="background:${riskColor}">${review.overallRiskRating || "Pending"}</span>`)}
  ${row("Risk Rationale", review.riskRationale)}
  ${row("Review Status", review.reviewStatus)}
  ${row("Reviewer", review.reviewerName)}
  ${row("Reviewer Role", review.reviewerRole)}
</table>

<div class="section-title">AML/CTF Screening Results</div>
<table>
  ${row("PEP/Sanctions Screening", review.pepSanctionsScreeningResult)}
  ${row("Adverse Media", review.adverseMediaResult)}
  ${row("Identity Verification", review.identityVerificationNotes)}
  ${row("Ownership Verification", review.ownershipVerificationNotes)}
  ${row("Source of Funds", review.sourceOfFundsNotes)}
  ${row("CDD Verification", review.cddVerificationNotes)}
  ${row("Address Service Approval", review.addressServiceApproval)}
</table>

<div class="section-title">Decision</div>
<table>
  ${row("Decision Notes", review.decisionNotes)}
  ${row("Approval Conditions", review.approvalConditions)}
  ${row("Review Started", formatDateTime(review.reviewStartedAt))}
  ${row("Decision Date", formatDateTime(review.reviewedAt))}
</table>

<div class="footer">
  <p>Financially Up Pty Ltd | Internal Admin Compliance Review | CONFIDENTIAL</p>
  <p>Generated: ${formatDateTime(now)} | Template Version: v1.0.0</p>
</div>

</body>
</html>`;
}

module.exports = { renderAdminReviewHtml };
