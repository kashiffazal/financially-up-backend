/**
 * Individual Email Service
 * ========================
 * Emails for the New Individual Engagement form:
 *   - client receipt (with the signed engagement PDF) + staff alert
 *   - review decision to the client (with the acceptance PDF) + staff log
 *
 * Sent with the default account from Settings > Email (mail.service). Staff
 * copies go to the "new-individual" recipients (its own list in Settings >
 * Email > Recipients, otherwise the default list).
 *
 * Both functions return true / false and never throw (callers don't wait on them).
 */

const fs = require("fs");
const { getSettingsMap } = require("./settings.service");
const { sendMail, getStaffRecipients, escapeHtml } = require("./mail.service");

const AREA = "new-individual";

/**
 * Step 1: client submission receipt + staff alert.
 */
async function sendClientSubmissionEmail(clientEmail, fullName, referenceNumber, pdfFullPath) {
  try {
    const settings = await getSettingsMap();
    const staff = await getStaffRecipients(AREA);
    const name = escapeHtml(fullName);
    const ref = escapeHtml(referenceNumber);

    const attachments =
      pdfFullPath && fs.existsSync(pdfFullPath)
        ? [{ filename: `${referenceNumber}_Client_Engagement.pdf`, path: pdfFullPath }]
        : [];

    await sendMail({
      to: clientEmail,
      replyTo: staff.to[0],
      subject: `Client Engagement Application Received - Financially Up (Ref: ${referenceNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #008043; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">FINANCIALLY UP</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Registered Tax Agents & Financial Consultants</p>
          </div>

          <div style="padding: 24px; color: #1e293b;">
            <h2 style="color: #008043; margin-top: 0;">Dear ${name},</h2>
            <p>Thank you for submitting your <strong>Individual Client Engagement Form</strong> with Financially Up.</p>

            <div style="background-color: #eaf7f0; border-left: 4px solid #008043; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; font-weight: bold; color: #008043;">Application Reference Number:</p>
              <p style="margin: 4px 0 0; font-family: monospace; font-size: 18px; font-weight: 800; color: #0f172a;">${ref}</p>
            </div>

            <p>Attached to this email is a copy of your signed <strong>Client Engagement Notice & Scope of Services</strong>.</p>
            <p>Our registered tax agents are reviewing your submission. We will notify you once your onboarding review is complete.</p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

            <p style="margin: 0; font-size: 13px; color: #64748b;">
              Kind regards,<br />
              <strong style="color: #1e293b;">${escapeHtml(settings["company.name"])} Client Onboarding Team</strong><br />
              Phone: ${escapeHtml(settings["company.phone"])} | Email: ${escapeHtml(settings["company.email"])}
            </p>
          </div>
        </div>
      `,
      attachments,
    });
    console.log(`[EMAIL SUCCESS] Client receipt sent to ${clientEmail}`);

    if (staff.to.length) {
      await sendMail({
        to: staff.to,
        cc: staff.cc,
        bcc: staff.bcc,
        replyTo: clientEmail,
        subject: `[NEW SUBMISSION ALERT] Individual Engagement: ${fullName} (${referenceNumber})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h3 style="color: #008043;">New Individual Engagement Form Submitted</h3>
            <p><strong>Client:</strong> ${name} (${escapeHtml(clientEmail)})</p>
            <p><strong>Reference:</strong> ${ref}</p>
            <p>Please log in to the Tax Agent Admin Portal to perform Phase 2 compliance review and approval.</p>
          </div>
        `,
        attachments,
      });
      console.log(`[EMAIL SUCCESS] Internal staff alert sent to ${staff.to.join(", ")}`);
    }

    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send submission email:`, error.message);
    return false;
  }
}

/**
 * Step 2: review decision to the client + staff log.
 */
async function sendAdminDecisionEmail(clientEmail, fullName, referenceNumber, decision, staffName, notes, acceptancePdfFullPath) {
  try {
    const staff = await getStaffRecipients(AREA);
    const name = escapeHtml(fullName);
    const ref = escapeHtml(referenceNumber);
    const status = escapeHtml(decision);

    const attachments =
      acceptancePdfFullPath && fs.existsSync(acceptancePdfFullPath)
        ? [{ filename: `${referenceNumber}_Engagement_Acceptance.pdf`, path: acceptancePdfFullPath }]
        : [];

    await sendMail({
      to: clientEmail,
      replyTo: staff.to[0],
      subject: `Engagement Status Update: ${decision} - Financially Up (Ref: ${referenceNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #008043; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">FINANCIALLY UP</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Tax Agent Onboarding & Compliance Portal</p>
          </div>

          <div style="padding: 24px; color: #1e293b;">
            <h2 style="color: #008043; margin-top: 0;">Dear ${name},</h2>
            <p>Your <strong>Individual Client Engagement Application</strong> (Ref: <strong>${ref}</strong>) has been reviewed by our Tax Agent team.</p>

            <div style="background-color: #eaf7f0; border-left: 4px solid #008043; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; font-weight: bold; color: #008043;">Engagement Decision Status:</p>
              <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${status}</p>
            </div>

            ${notes ? `<p><strong>Reviewer Rationale / Instructions:</strong> ${escapeHtml(notes)}</p>` : ""}
            ${attachments.length ? `<p>Attached to this email is your official <strong>Engagement Acceptance Notice & Scope Confirmation</strong>.</p>` : ""}

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

            <p style="margin: 0; font-size: 13px; color: #64748b;">
              Reviewed by: <strong>${escapeHtml(staffName)}</strong><br />
              Kind regards,<br />
              <strong style="color: #1e293b;">Financially Up Tax Agent Compliance Team</strong>
            </p>
          </div>
        </div>
      `,
      attachments,
    });
    console.log(`[EMAIL SUCCESS] Admin decision email sent to ${clientEmail}`);

    if (staff.to.length) {
      await sendMail({
        to: staff.to,
        cc: staff.cc,
        bcc: staff.bcc,
        subject: `[DECISION LOG] Engagement ${referenceNumber} -> ${decision}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h3 style="color: #008043;">Tax Agent Decision Executed</h3>
            <p><strong>Client:</strong> ${name} (${escapeHtml(clientEmail)})</p>
            <p><strong>Reference:</strong> ${ref}</p>
            <p><strong>Decision:</strong> ${status}</p>
            <p><strong>Staff Member:</strong> ${escapeHtml(staffName)}</p>
          </div>
        `,
        attachments,
      });
      console.log(`[EMAIL SUCCESS] Internal decision log sent to ${staff.to.join(", ")}`);
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
