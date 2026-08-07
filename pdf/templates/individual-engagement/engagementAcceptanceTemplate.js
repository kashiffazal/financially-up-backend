/**
 * Engagement Acceptance PDF Template — Individual Engagement Form
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

function renderEngagementAcceptanceHtml(data) {
  const referenceNumber = data.referenceNumber || `NENG-${Date.now()}`;
  const client = data.client || {};
  const services = data.services || [];
  const signatures = data.signatures || [];
  const clientSig = signatures.find((s) => s.signerType === "Client") || signatures[0];
  const taxAgentSig = signatures.find((s) => s.signerType === "TaxAgent");

  const logoUri = getLogoBase64Uri();
  const clientSigUri = clientSig?.signatureFilePath ? getSignatureBase64Uri(clientSig.signatureFilePath) : null;
  const taxAgentSigUri = taxAgentSig?.signatureFilePath ? getSignatureBase64Uri(taxAgentSig.signatureFilePath) : null;
  const now = new Date();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${referenceNumber}_Engagement_Acceptance</title>
  <style>
    @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; }
    
    .header-banner { border-bottom: 3px solid #008043; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .brand-logo { max-height: 48px; max-width: 220px; object-fit: contain; }
    .brand-subtitle { font-size: 11px; color: #008043; font-weight: 800; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.3px; }
    .ref-badge { background: #eaf7f0; border: 1px solid #a7f3d0; color: #065f46; padding: 6px 12px; border-radius: 8px; font-family: monospace; font-size: 13px; font-weight: bold; }
    
    .accept-box { background: #f0fdf4; border: 1.5px solid #008043; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center; }
    .accept-title { font-size: 16px; font-weight: 800; color: #008043; margin-bottom: 4px; }
    
    .section-head { font-size: 13px; font-weight: 800; color: #008043; background: #eaf7f0; border-left: 4px solid #008043; padding: 5px 8px; margin-top: 25px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.3px; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; text-align: left; }
    th { background: #f8fafc; font-weight: 700; color: #334155; }

    .signatures-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 25px; }
    .sig-card { border: 1px dashed #008043; border-radius: 10px; padding: 12px; background: #f0fdf4; }
    .sig-header { font-size: 11px; font-weight: bold; color: #008043; text-transform: uppercase; margin-bottom: 6px; }

    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
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
    <div style="font-size: 12px; color: #047857;">
      Financially Up has formally accepted your tax engagement application for client <strong>${client.fullName}</strong>.
    </div>
  </div>

  <!-- Section 1: Accepted Scope of Engagement -->
  <div class="section-head">1. Accepted Services & Fee Schedule</div>
  <table>
    <thead>
      <tr>
        <th>Service Title</th>
        <th>Compliance Scope</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${services.map((s) => `
        <tr>
          <td><strong>${s.serviceName}</strong></td>
          <td>Registered ATO Lodgement & Professional Advisory</td>
          <td><strong style="color: #008043;">ACCEPTED</strong></td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- Section 2: Statutory Terms & ATO Authority -->
  <div class="section-head">2. Statutory Rights & Legal Framework</div>
  <p style="font-size: 11px; color: #475569; leading-height: 1.6;">
    This document constitutes a binding engagement contract under the Tax Agent Services Act 2009 (TASA 2009). Financially Up is authorized to represent you before the Australian Taxation Office (ATO), manage portal records, prepare income tax returns, and handle statutory correspondence.
  </p>

  <!-- Section 3: Dual Counter-Signatures -->
  <div class="signatures-grid">
    <div class="sig-card">
      <div class="sig-header">Client Signature</div>
      <div><strong>${clientSig?.signerFullName || client.fullName}</strong></div>
      ${clientSigUri ? `
        <img src="${clientSigUri}" style="max-height: 50px; max-width: 200px; margin-top: 6px; object-fit: contain;" />
      ` : `<div style="font-family: cursive; font-size: 18px; color: #008043; margin-top: 6px;">${client.fullName}</div>`}
      <div style="font-size: 9.5px; color: #64748b; margin-top: 6px;">Signed: ${clientSig?.createdAt ? new Date(clientSig.createdAt).toLocaleDateString('en-AU') : now.toLocaleDateString('en-AU')}</div>
    </div>

    <div class="sig-card">
      <div class="sig-header">Registered Tax Agent Approval</div>
      <div><strong>${taxAgentSig?.signerFullName || 'Financially Up Tax Agent'}</strong></div>
      <div style="font-size: 11px; color: #008043; font-weight: bold; margin-top: 4px;">
        Tax Agent Registration # 2601 4892
      </div>
      ${taxAgentSigUri ? `
        <img src="${taxAgentSigUri}" style="max-height: 50px; max-width: 200px; margin-top: 6px; object-fit: contain;" />
      ` : `<div style="font-family: cursive; font-size: 18px; color: #008043; margin-top: 6px;">Financially Up Tax Agent</div>`}
      <div style="font-size: 9.5px; color: #64748b; margin-top: 6px;">Accepted Date: ${now.toLocaleDateString('en-AU')}</div>
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
