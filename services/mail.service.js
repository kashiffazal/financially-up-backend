/**
 * Mail Service
 * ============
 * Single SMTP transport + branded HTML layout for every outgoing email.
 *
 * Configuration (.env.development / .env.production):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 *   EMAIL_SENDER    "From" address               e.g. "Financially Up <kashif@…>"
 *   EMAIL_RECEIVER  staff inbox for alerts
 *   EMAIL_CC        copy of every staff alert (optional)
 *   NEW_APP_URL     admin portal base URL (links in staff emails)
 *   COMPANY_LOGO_URL  fallback only — the logo is normally embedded in the email
 *                     itself (public/images/logo.png), so it shows even when the
 *                     URL is unreachable (e.g. localhost) or remote images are blocked
 *
 * All user-supplied text is HTML-escaped before it is placed in a template.
 */

const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { getSettingsMap } = require("./settings.service");

let transporter = null;

// Logo embedded as an inline attachment, referenced in the HTML as cid:<LOGO_CID>
const LOGO_CID = "company-logo@financiallyup";
const LOGO_PATH = path.join(__dirname, "../public/images/logo.png");
const hasLogoFile = () => fs.existsSync(LOGO_PATH);

/** Lazily-created, reused SMTP transport. */
const getTransporter = () => {
  if (transporter) return transporter;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
  return transporter;
};

const mailConfig = () => ({
  sender: process.env.EMAIL_SENDER || process.env.SMTP_USER,
  staffTo: process.env.EMAIL_RECEIVER || null,
  staffCc: process.env.EMAIL_CC || undefined,
  appUrl: (process.env.NEW_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  logoUrl: process.env.COMPANY_LOGO_URL || null,
});

/** Send one email. Throws on failure so callers can record the error. */
const sendMail = async ({ to, cc, subject, html, text, replyTo, attachments }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP is not configured (SMTP_USER / SMTP_PASS missing).");
  }
  if (!to) throw new Error("No recipient address.");
  // Attach the logo only when the rendered layout references it
  if (html && html.includes(`cid:${LOGO_CID}`) && hasLogoFile()) {
    attachments = [
      ...(attachments || []),
      { filename: "logo.png", path: LOGO_PATH, cid: LOGO_CID, contentDisposition: "inline" },
    ];
  }
  const info = await getTransporter().sendMail({
    from: mailConfig().sender,
    to,
    cc,
    replyTo,
    subject,
    html,
    text,
    attachments,
  });
  console.log(`[EMAIL] "${subject}" → ${to} (MsgId: ${info.messageId})`);
  return info;
};

// ============================
// Branded layout
// ============================

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Render a branded email.
 * @param {object} opts
 * @param {string} opts.preheader   Inbox preview text
 * @param {string} opts.heading
 * @param {string} [opts.intro]     Plain text (escaped)
 * @param {Array<[string,string]>} [opts.rows]   Label/value pairs (escaped); empty values skipped
 * @param {string} [opts.reference] Highlighted reference number
 * @param {string} [opts.quote]     Multi-line message block (escaped)
 * @param {{label:string,url:string}} [opts.cta]
 * @param {string} [opts.footnote]  Small text under the content (escaped)
 */
const renderEmail = async ({ preheader, heading, intro, rows = [], reference, quote, cta, footnote }) => {
  const settings = await getSettingsMap().catch(() => ({}));
  const logoSrc = hasLogoFile() ? `cid:${LOGO_CID}` : mailConfig().logoUrl;
  const companyName = settings["company.legalName"] || settings["company.name"] || "Financially Up";
  const phone = settings["company.phone"];
  const email = settings["company.email"];
  const address = settings["company.address"];

  const rowsHtml = rows
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;vertical-align:top;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || heading)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#008043;padding:20px 28px;">
          ${
            logoSrc
              ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(companyName)}" height="34" style="display:block;height:34px;border:0;background:#ffffff;border-radius:8px;padding:6px 10px;">`
              : `<span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.02em;">${escapeHtml(companyName)}</span>`
          }
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#0f172a;">${escapeHtml(heading)}</h1>
          ${intro ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(intro)}</p>` : ""}
          ${
            reference
              ? `<div style="margin:0 0 18px;padding:14px 16px;background:#eaf7f0;border-left:4px solid #008043;border-radius:8px;">
                   <div style="font-size:11px;font-weight:bold;color:#008043;text-transform:uppercase;letter-spacing:.06em;">Reference</div>
                   <div style="margin-top:4px;font-family:Consolas,Menlo,monospace;font-size:18px;font-weight:800;color:#0f172a;">${escapeHtml(reference)}</div>
                 </div>`
              : ""
          }
          ${rowsHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">${rowsHtml}</table>` : ""}
          ${
            quote
              ? `<div style="margin:0 0 18px;padding:14px 16px;background:#f8fafc;border-left:3px solid #008043;border-radius:0 8px 8px 0;font-size:14px;line-height:1.6;color:#334155;white-space:pre-line;">${escapeHtml(quote)}</div>`
              : ""
          }
          ${
            cta
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;"><tr><td style="background:#008043;border-radius:10px;">
                   <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">${escapeHtml(cta.label)} &rarr;</a>
                 </td></tr></table>`
              : ""
          }
          ${footnote ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#64748b;">${escapeHtml(footnote)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b;">
          <strong style="color:#334155;">${escapeHtml(companyName)}</strong><br>
          ${[phone && `Phone: ${escapeHtml(phone)}`, email && `Email: ${escapeHtml(email)}`].filter(Boolean).join(" &nbsp;|&nbsp; ")}
          ${address ? `<br>${escapeHtml(address)}` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    heading,
    intro,
    reference && `Reference: ${reference}`,
    ...rows.filter(([, v]) => v).map(([l, v]) => `${l}: ${v}`),
    quote,
    cta && `${cta.label}: ${cta.url}`,
    footnote,
    "",
    companyName,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { html, text };
};

module.exports = {
  getTransporter,
  mailConfig,
  sendMail,
  renderEmail,
  escapeHtml,
};
