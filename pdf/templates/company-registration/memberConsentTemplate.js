/**
 * Member Consent PDF Template - Company Registration
 * ===================================================
 * Generates individual Member/Shareholder Subscription Consent certificates.
 * One PDF per member: Member_Consent_John_Smith.pdf
 * References Corporations Act 2001 - Section 231.
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

function formatDate(dateVal) {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * Generate Member Subscription Consent HTML
 * @param {object} shareholder - Single shareholder record
 * @param {object} registration - Parent registration record
 * @returns {string} Complete HTML document
 */
function renderMemberConsentHtml(shareholder, registration) {
  const sh = shareholder;
  const reg = registration;
  const logoUri = getLogoBase64Uri();
  const now = new Date();
  const totalValue = (Number(sh.numberOfShares) || 0) * (Number(sh.amountPaidPerShare) || 1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Member Consent - ${sh.fullName || "Member"}</title>
<style>
  @page { margin: 25mm 20mm; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; line-height: 1.7; margin: 0; padding: 40px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #008043; padding-bottom: 20px; }
  .header img { max-width: 180px; margin-bottom: 15px; }
  .header h1 { color: #008043; font-size: 20px; margin: 5px 0; }
  .header h2 { color: #666; font-size: 14px; font-weight: 400; }
  .legal-ref { color: #888; font-size: 10px; font-style: italic; margin: 5px 0; }
  .content { max-width: 650px; margin: 0 auto; }
  .field { margin: 12px 0; }
  .field-label { font-weight: 700; color: #333; display: inline-block; width: 220px; }
  .field-value { color: #1a1a2e; }
  .share-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .share-table td, .share-table th { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
  .share-table th { background: #008043; color: #fff; font-weight: 600; }
  .declaration { background: #f8faf8; border: 1px solid #ddd; padding: 20px; margin: 25px 0; border-radius: 6px; }
  .signature-area { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 6px; }
  .footer { text-align: center; font-size: 8px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
</style>
</head>
<body>

<div class="header">
  <img src="${logoUri}" alt="Financially Up Logo" />
  <h1>Member Subscription Consent</h1>
  <h2>${reg.companyName1 || "Proposed Company"}</h2>
  <p class="legal-ref">Corporations Act 2001 (Cth) - Section 231</p>
  <p class="legal-ref">Application Reference: ${reg.referenceNumber || "N/A"}</p>
</div>

<div class="content">
  <div class="field"><span class="field-label">Member Name:</span> <span class="field-value">${sh.fullName || "N/A"}</span></div>
  <div class="field"><span class="field-label">Member Type:</span> <span class="field-value">${sh.memberType || "Individual"}</span></div>
  <div class="field"><span class="field-label">Address:</span> <span class="field-value">${sh.address || "N/A"}</span></div>

  <h3 style="color:#008043; margin-top:25px;">Share Subscription Details</h3>
  <table class="share-table">
    <tr><th>Share Class</th><th>Number of Shares</th><th>Amount Paid / Share</th><th>Amount Unpaid / Share</th><th>Total Value</th></tr>
    <tr>
      <td>${sh.shareClass || "Ordinary"}</td>
      <td>${sh.numberOfShares || "N/A"}</td>
      <td>$${sh.amountPaidPerShare || "1.00"}</td>
      <td>$${sh.amountUnpaidPerShare || "0.00"}</td>
      <td>$${totalValue.toFixed(2)}</td>
    </tr>
  </table>

  ${sh.isBeneficiallyHeld ? `
  <div class="field"><span class="field-label">Beneficially Held For:</span> <span class="field-value">${sh.heldForWhom || "N/A"}</span></div>
  ` : ""}

  <div class="declaration">
    <p><strong>I/We, ${sh.fullName || "[Member Name]"},</strong> hereby consent to become a member of <strong>${reg.companyName1 || "[Proposed Company Name]"}</strong> and agree to take the shares specified above upon its registration under the Corporations Act 2001 (Cth).</p>
    <p>I/We confirm that:</p>
    <ul>
      <li>I/We agree to be bound by the constitution (if any) and the replaceable rules of the Corporations Act 2001 applicable to the company.</li>
      <li>I/We agree to take the number and class of shares described above and to pay any amounts due on those shares.</li>
      <li>The information provided is true and correct to the best of my/our knowledge.</li>
    </ul>
  </div>

  <div class="signature-area">
    <div class="field"><span class="field-label">Date:</span> <span class="field-value">${formatDate(now)}</span></div>
    <p style="color:#888; font-size:10px;">Consent recorded electronically upon form submission.</p>
  </div>
</div>

<div class="footer">
  <p>Financially Up Pty Ltd | Member Subscription Consent | Ref: ${reg.referenceNumber || "Draft"}</p>
  <p>Generated: ${formatDate(now)} | CONFIDENTIAL</p>
</div>

</body>
</html>`;
}

module.exports = { renderMemberConsentHtml };
