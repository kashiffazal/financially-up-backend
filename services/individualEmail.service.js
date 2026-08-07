/**
 * Individual Email Service
 * ========================
 * Sends automated confirmation & alert emails to clients and staff
 * using Nodemailer configured with Hostinger SMTP for the New Individual Engagement Form.
 */

const nodemailer = require("nodemailer");
const fs = require("fs");

/**
 * Creates Nodemailer transporter configured with Hostinger SMTP settings
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER || "kashif@innotechcloud.com",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

/**
 * Step 1: Send client submission receipt email & staff alert email (Phase 1).
 */
async function sendClientSubmissionEmail(clientEmail, fullName, referenceNumber, pdfFullPath) {
  try {
    const transporter = createTransporter();
    const sender = process.env.EMAIL_SENDER || '"Financially Up" <kashif@innotechcloud.com>';
    const receiver = process.env.EMAIL_RECEIVER || "hafiz@financiallyup.com.au";
    const cc = process.env.EMAIL_CC || "kashiffazalfullstack@gmail.com";

    const mailOptions = {
      from: sender,
      to: clientEmail,
      cc: cc,
      subject: `Client Engagement Application Received - Financially Up (Ref: ${referenceNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #008043; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">FINANCIALLY UP</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Registered Tax Agents & Financial Consultants</p>
          </div>
          
          <div style="padding: 24px; color: #1e293b;">
            <h2 style="color: #008043; margin-top: 0;">Dear ${fullName},</h2>
            <p>Thank you for submitting your <strong>Individual Client Engagement Form</strong> with Financially Up.</p>
            
            <div style="background-color: #eaf7f0; border-left: 4px solid #008043; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; font-weight: bold; color: #008043;">Application Reference Number:</p>
              <p style="margin: 4px 0 0; font-family: monospace; font-size: 18px; font-weight: 800; color: #0f172a;">${referenceNumber}</p>
            </div>

            <p>Attached to this email is a copy of your signed <strong>Client Engagement Notice & Scope of Services</strong>.</p>
            <p>Our registered tax agents are reviewing your submission. We will notify you once your onboarding review is complete.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            
            <p style="margin: 0; font-size: 13px; color: #64748b;">
              Kind regards,<br />
              <strong style="color: #1e293b;">Financially Up Client Onboarding Team</strong><br />
              Phone: 1300 328 316 | Email: info@financiallyup.com.au
            </p>
          </div>
        </div>
      `,
    };

    if (pdfFullPath && fs.existsSync(pdfFullPath)) {
      mailOptions.attachments = [
        {
          filename: `${referenceNumber}_Client_Engagement.pdf`,
          path: pdfFullPath,
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Client receipt sent to ${clientEmail} (MsgId: ${info.messageId})`);

    // Staff Alert Email to Receiver
    if (receiver) {
      await transporter.sendMail({
        from: sender,
        to: receiver,
        cc: cc,
        subject: `[NEW SUBMISSION ALERT] Individual Engagement: ${fullName} (${referenceNumber})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h3 style="color: #008043;">New Individual Engagement Form Submitted</h3>
            <p><strong>Client:</strong> ${fullName} (${clientEmail})</p>
            <p><strong>Reference:</strong> ${referenceNumber}</p>
            <p>Please log in to the Tax Agent Admin Portal to perform Phase 2 compliance review and approval.</p>
          </div>
        `,
        attachments: mailOptions.attachments || [],
      });
      console.log(`[EMAIL SUCCESS] Internal staff alert sent to ${receiver}`);
    }

    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send submission email:`, error.message);
    return false;
  }
}

/**
 * Step 2: Send Tax Agent Phase 2 Decision Execution Email.
 */
async function sendAdminDecisionEmail(clientEmail, fullName, referenceNumber, decision, staffName, notes, acceptancePdfFullPath) {
  try {
    const transporter = createTransporter();
    const sender = process.env.EMAIL_SENDER || '"Financially Up" <kashif@innotechcloud.com>';
    const receiver = process.env.EMAIL_RECEIVER || "hafiz@financiallyup.com.au";
    const cc = process.env.EMAIL_CC || "kashiffazalfullstack@gmail.com";

    const mailOptions = {
      from: sender,
      to: clientEmail,
      cc: cc,
      subject: `Engagement Status Update: ${decision} - Financially Up (Ref: ${referenceNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #008043; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">FINANCIALLY UP</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Tax Agent Onboarding & Compliance Portal</p>
          </div>
          
          <div style="padding: 24px; color: #1e293b;">
            <h2 style="color: #008043; margin-top: 0;">Dear ${fullName},</h2>
            <p>Your <strong>Individual Client Engagement Application</strong> (Ref: <strong>${referenceNumber}</strong>) has been reviewed by our Tax Agent team.</p>
            
            <div style="background-color: #eaf7f0; border-left: 4px solid #008043; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; font-weight: bold; color: #008043;">Engagement Decision Status:</p>
              <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${decision}</p>
            </div>

            ${notes ? `<p><strong>Reviewer Rationale / Instructions:</strong> ${notes}</p>` : ""}
            ${acceptancePdfFullPath ? `<p>Attached to this email is your official <strong>Engagement Acceptance Notice & Scope Confirmation</strong>.</p>` : ""}

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            
            <p style="margin: 0; font-size: 13px; color: #64748b;">
              Reviewed by: <strong>${staffName}</strong><br />
              Kind regards,<br />
              <strong style="color: #1e293b;">Financially Up Tax Agent Compliance Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    if (acceptancePdfFullPath && fs.existsSync(acceptancePdfFullPath)) {
      mailOptions.attachments = [
        {
          filename: `${referenceNumber}_Engagement_Acceptance.pdf`,
          path: acceptancePdfFullPath,
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SUCCESS] Admin decision email sent to ${clientEmail} (MsgId: ${info.messageId})`);

    // Internal Notification to Receiver
    if (receiver) {
      await transporter.sendMail({
        from: sender,
        to: receiver,
        cc: cc,
        subject: `[DECISION LOG] Engagement ${referenceNumber} -> ${decision}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h3 style="color: #008043;">Tax Agent Decision Executed</h3>
            <p><strong>Client:</strong> ${fullName} (${clientEmail})</p>
            <p><strong>Reference:</strong> ${referenceNumber}</p>
            <p><strong>Decision:</strong> ${decision}</p>
            <p><strong>Staff Member:</strong> ${staffName}</p>
          </div>
        `,
        attachments: mailOptions.attachments || [],
      });
      console.log(`[EMAIL SUCCESS] Internal decision log sent to ${receiver}`);
    }

    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send decision email:`, error.message);
    return false;
  }
}

module.exports = {
  sendClientSubmissionEmail,
  sendAdminDecisionEmail,
};
