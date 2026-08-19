/**
 * Director Consent PDF Template - Company Registration
 * =====================================================
 * Generates individual Director/Secretary Consent to Act certificates.
 * One PDF per person: Director_Consent_John_Smith.pdf
 * References Corporations Act 2001 - Sections 201D and 204C.
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
 * Generate Director/Secretary Consent to Act HTML
 * @param {object} officeholder - Single officeholder record
 * @param {object} registration - Parent registration record
 * @returns {string} Complete HTML document
 */
function renderDirectorConsentHtml(officeholder, registration) {
  const oh = officeholder;
  const reg = registration;
  const logoUri = getLogoBase64Uri();
  const now = new Date();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Consent to Act - ${oh.fullName || "Director"}</title>
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
  .declaration { background: #f8faf8; border: 1px solid #ddd; padding: 20px; margin: 25px 0; border-radius: 6px; }
  .declaration p { margin: 8px 0; }
  .signature-area { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 6px; }
  .signature-area img { max-height: 70px; }
  .footer { text-align: center; font-size: 8px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
</style>
</head>
<body>

<div class="header">
  <img src="${logoUri}" alt="Financially Up Logo" />
  <h1>Consent to Act as ${oh.role || "Director"}</h1>
  <h2>${reg.companyName1 || "Proposed Company"}</h2>
  <p class="legal-ref">Corporations Act 2001 (Cth) - Sections 201D and 204C</p>
  <p class="legal-ref">Application Reference: ${reg.referenceNumber || "N/A"}</p>
</div>

<div class="content">
  <div class="field"><span class="field-label">Full Legal Name:</span> <span class="field-value">${oh.fullName || "N/A"}</span></div>
  ${oh.formerNames ? `<div class="field"><span class="field-label">Former Names:</span> <span class="field-value">${oh.formerNames}</span></div>` : ""}
  <div class="field"><span class="field-label">Date of Birth:</span> <span class="field-value">${formatDate(oh.dob)}</span></div>
  <div class="field"><span class="field-label">Place of Birth:</span> <span class="field-value">${[oh.birthCity, oh.birthState, oh.birthCountry].filter(Boolean).join(", ") || "N/A"}</span></div>
  <div class="field"><span class="field-label">Residential Address:</span> <span class="field-value">${oh.residentialAddress || "N/A"}</span></div>
  <div class="field"><span class="field-label">Role:</span> <span class="field-value">${oh.role || "Director"}</span></div>
  <div class="field"><span class="field-label">Director ID Status:</span> <span class="field-value">${oh.directorIdStatus || "N/A"}</span></div>
  ${oh.directorIdNumber ? `<div class="field"><span class="field-label">Director ID Number:</span> <span class="field-value">${oh.directorIdNumber}</span></div>` : ""}

  <div class="declaration">
    <p><strong>I, ${oh.fullName || "[Full Name]"},</strong> hereby consent to act as <strong>${oh.role || "Director"}</strong> of <strong>${reg.companyName1 || "[Proposed Company Name]"}</strong> upon its registration under the Corporations Act 2001 (Cth).</p>
    <p>I confirm that:</p>
    <ul>
      <li>I am not disqualified from managing corporations under Part 2D.6 of the Corporations Act 2001.</li>
      <li>I have read and understand the duties and obligations of a ${(oh.role || "director").toLowerCase()} under Australian law.</li>
      <li>The information I have provided is true and correct to the best of my knowledge.</li>
      <li>I understand that providing false or misleading information is an offence.</li>
    </ul>
  </div>

  <div class="signature-area">
    <div class="field"><span class="field-label">Signed:</span></div>
    ${oh.signatureData ? `<img src="${oh.signatureData.startsWith("data:") ? oh.signatureData : ""}" alt="Signature" />` : "<p>[Signature on file]</p>"}
    <div class="field"><span class="field-label">Date:</span> <span class="field-value">${formatDate(oh.signatureDate || now)}</span></div>
  </div>
</div>

<div class="footer">
  <p>Financially Up Pty Ltd | Director/Secretary Consent to Act | Ref: ${reg.referenceNumber || "Draft"}</p>
  <p>Generated: ${formatDate(now)} | CONFIDENTIAL</p>
</div>

</body>
</html>`;
}

module.exports = { renderDirectorConsentHtml };
