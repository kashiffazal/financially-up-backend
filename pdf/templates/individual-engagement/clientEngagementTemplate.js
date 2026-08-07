/**
 * Client Engagement PDF Template — Individual Engagement Form
 * ==========================================================
 * Renders the Client Engagement Notice PDF for Individual Client Engagements.
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

function renderClientEngagementHtml(data) {
  const referenceNumber = data.referenceNumber || `NENG-${Date.now()}`;
  const client = data.client || {};
  const services = data.services || [{ serviceName: "Individual Income Tax Return" }];
  const signatures = data.signatures || [];
  const clientSig = signatures.find((s) => s.signerType === "Client") || signatures[0];

  const logoUri = getLogoBase64Uri();
  const sigImageUri = clientSig?.signatureFilePath ? getSignatureBase64Uri(clientSig.signatureFilePath) : null;
  const now = new Date();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${referenceNumber}_Client_Engagement</title>
  <style>
    @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; }
    
    .header-banner { border-bottom: 3px solid #008043; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .brand-logo { max-height: 48px; max-width: 220px; object-fit: contain; }
    .brand-subtitle { font-size: 11px; color: #008043; font-weight: 800; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.3px; }
    .ref-badge { background: #eaf7f0; border: 1px solid #a7f3d0; color: #065f46; padding: 6px 12px; border-radius: 8px; font-family: monospace; font-size: 13px; font-weight: bold; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 15px; }
    .card-title { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
    
    .section-head { font-size: 13px; font-weight: 800; color: #008043; background: #eaf7f0; border-left: 4px solid #008043; padding: 5px 8px; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.3px; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 11px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; color: #334155; width: 30%; }

    .consent-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 11px; }
    
    .signature-container { border: 1.5px dashed #008043; background: #f0fdf4; border-radius: 10px; padding: 15px; margin-top: 20px; }
    .sig-title { font-size: 12px; font-weight: bold; color: #008043; margin-bottom: 8px; text-transform: uppercase; }
    
    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style>
</head>
<body>

  <!-- Header Banner with Logo -->
  <div class="header-banner">
    <div>
      <img src="${logoUri}" class="brand-logo" alt="Financially Up" />
      <div class="brand-subtitle">Individual Client Engagement Notice</div>
    </div>
    <div class="ref-badge">
      ${referenceNumber}
    </div>
  </div>

  <!-- Meta Summary Cards -->
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Client Profile</div>
      <div><strong>Name:</strong> ${client.fullName || 'N/A'}</div>
      <div><strong>Email:</strong> ${client.email || 'N/A'}</div>
      <div><strong>Mobile:</strong> ${client.mobile || 'N/A'}</div>
      <div><strong>Date of Birth:</strong> ${client.dateOfBirth || 'N/A'}</div>
    </div>
    <div class="card">
      <div class="card-title">Engagement Status & Date</div>
      <div><strong>Status:</strong> ${data.status || 'Pending Review'}</div>
      <div><strong>Submitted At:</strong> ${now.toLocaleDateString('en-AU')}</div>
      <div><strong>Tax Residency:</strong> ${data.taxResidency || 'Australian Resident'}</div>
      <div><strong>Masked TFN:</strong> ${client.maskedTfn || '*** *** ***'}</div>
    </div>
  </div>

  <!-- Section 1: Scope of Engagement -->
  <div class="section-head">1. Scope of Tax & Advisory Services</div>
  <table>
    <thead>
      <tr>
        <th>Service Requested</th>
        <th>Compliance Scope</th>
        <th>Service Frequency</th>
      </tr>
    </thead>
    <tbody>
      ${services.map((s) => `
        <tr>
          <td><strong>${s.serviceName}</strong></td>
          <td>Registered Tax Agent ATO Lodgement & Advice</td>
          <td>Annual / Periodic Statutory Lodgement</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- Section 2: Residency & Tax Profile -->
  <div class="section-head">2. Residency, Spouse & Tax Profile</div>
  <table>
    <tr>
      <th>Australian Citizen</th>
      <td>${data.isAustralianCitizen ? 'Yes' : 'No'}</td>
      <th>Citizenship Country</th>
      <td>${data.citizenshipCountry || 'Australia'}</td>
    </tr>
    <tr>
      <th>Has Spouse</th>
      <td>${data.hasSpouse || 'No'}</td>
      <th>Spouse Name</th>
      <td>${data.spouseName || 'N/A'}</td>
    </tr>
    <tr>
      <th>Has Dependants</th>
      <td>${data.hasDependants || 'No'} (${data.dependantCount || 0})</td>
      <th>ATO Tax Issues</th>
      <td>${data.atoIssues || 'No'}</td>
    </tr>
  </table>

  <!-- Section 3: Statutory Legal Consents -->
  <div class="section-head">3. Statutory Declarations & Tax Agent Authority</div>
  <div class="consent-item">
    ✔ <strong>Tax Agent Services Act 2009 (TASA 2009):</strong> I authorize Financially Up to act as my registered tax agent and access ATO portal records on my behalf.
  </div>
  <div class="consent-item">
    ✔ <strong>Electronic Transactions Act 1999 (ETA 1999):</strong> I agree that my electronic signature below constitutes my legally binding execution of this agreement.
  </div>
  <div class="consent-item">
    ✔ <strong>Privacy Act 1988:</strong> I consent to the collection, secure storage, and processing of my personal tax information under strict Australian privacy laws.
  </div>

  <!-- Section 4: Electronic Signature Verification -->
  <div class="signature-container">
    <div class="sig-title">Electronic Signature Verification Stamp</div>
    <div>Signer Name: <strong>${clientSig?.signerFullName || client.fullName}</strong></div>
    <div>Signing Method: <strong>${clientSig?.signatureMethod || 'draw'}</strong></div>
    ${sigImageUri ? `
      <div style="margin-top: 10px;">
        <img src="${sigImageUri}" style="max-height: 60px; max-width: 250px; border-bottom: 2px solid #008043; object-fit: contain;" />
      </div>
    ` : `
      <div style="font-family: cursive; font-size: 22px; color: #008043; margin-top: 8px;">
        ${clientSig?.signerFullName || client.fullName}
      </div>
    `}
    <div style="font-size: 10px; color: #047857; margin-top: 8px;">
      IP Address: ${clientSig?.ipAddress || '127.0.0.1'} | Timestamp: ${now.toLocaleString('en-AU')}
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

module.exports = { renderClientEngagementHtml };
