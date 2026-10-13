/**
 * Alert Email Service
 * ===================
 * Emails sent on website activity (all use the branded layout in mail.service):
 *   - sendEnquiryStaffAlert()     staff inbox for "enquiries" (Settings > Email > Recipients), Reply-To = visitor
 *   - sendEnquiryConfirmation()   "we received your enquiry" to the visitor
 *   - sendApplicationStaffAlert() staff inbox of that form (its own recipients, else the default ones),
 *                                 optionally with the application PDF attached
 *   - sendCompanyApplicationReceipt() "we received your application" to the company
 *                                 registration contact, with the Client Application PDF
 *
 * Every function throws on failure so callers can record the delivery status.
 */

const { sendMail, renderEmail, mailConfig, getStaffRecipients } = require("./mail.service");

const SOURCE_LABELS = { contact_page: "Contact page", contact_modal: "Contact Us popup" };

const fullNameOf = (e) => [e.firstName, e.lastName].filter(Boolean).join(" ") || e.email;

/**
 * Staff alert for a new website enquiry.
 * @param {object} enquiry - ContactEnquiry (plain or instance)
 */
const sendEnquiryStaffAlert = async (enquiry) => {
  const { appUrl } = mailConfig();
  const { to: staffTo, cc: staffCc, bcc: staffBcc } = await getStaffRecipients("enquiries");
  if (!staffTo.length) throw new Error("No staff recipients set (Settings > Email > Recipients).");
  const name = fullNameOf(enquiry);

  const { html, text } = await renderEmail({
    preheader: `${name}: ${String(enquiry.message || enquiry.service || "New website enquiry").slice(0, 90)}`,
    heading: "New website enquiry",
    intro: `${name} sent an enquiry from the website. Reply to this email to respond directly to them.`,
    reference: enquiry.referenceNumber,
    rows: [
      ["Name", name],
      ["Email", enquiry.email],
      ["Phone", enquiry.phone],
      ["Service", enquiry.service],
      ["Prefers", enquiry.preferredContact],
      ["Sent from", SOURCE_LABELS[enquiry.source] || enquiry.source],
    ],
    quote: enquiry.message,
    cta: { label: "Open in admin", url: `${appUrl}/admin/enquiries?open=${enquiry.id}` },
  });

  return sendMail({
    to: staffTo,
    cc: staffCc,
    bcc: staffBcc,
    replyTo: enquiry.email,
    subject: `New website enquiry · ${name} · ${enquiry.referenceNumber}`,
    html,
    text,
  });
};

/**
 * Confirmation to the visitor who sent the enquiry.
 * @param {object} enquiry
 */
const sendEnquiryConfirmation = async (enquiry) => {
  const { to: staffTo } = await getStaffRecipients("enquiries");
  const { html, text } = await renderEmail({
    preheader: `We've received your enquiry (${enquiry.referenceNumber}).`,
    heading: `Thanks for getting in touch, ${enquiry.firstName}`,
    intro:
      "We've received your enquiry and one of our team will contact you shortly. Please keep your reference number handy if you need to follow up.",
    reference: enquiry.referenceNumber,
    rows: [
      ["Service", enquiry.service],
      ["We'll contact you by", enquiry.preferredContact],
    ],
    quote: enquiry.message,
    footnote: "You're receiving this because you submitted an enquiry on our website. If this wasn't you, you can ignore this email.",
  });

  return sendMail({
    to: enquiry.email,
    replyTo: staffTo[0] || undefined,
    subject: `We've received your enquiry (${enquiry.referenceNumber}) — Financially Up`,
    html,
    text,
  });
};

/**
 * Staff alert for a new application form submission.
 * @param {object} info - { moduleKey, moduleName, route, recordId, reference, clientName, email, phone, attachments? }
 */
const sendApplicationStaffAlert = async ({ moduleKey, moduleName, route, recordId, reference, clientName, email, phone, attachments = [] }) => {
  const { appUrl } = mailConfig();
  const { to: staffTo, cc: staffCc, bcc: staffBcc } = await getStaffRecipients(moduleKey);
  if (!staffTo.length) throw new Error("No staff recipients set (Settings > Email > Recipients).");

  const { html, text } = await renderEmail({
    preheader: `${clientName} submitted a new ${moduleName} application.`,
    heading: `New ${moduleName} application`,
    intro: `${clientName} has submitted a new ${moduleName} application. It is waiting for review in the admin portal.`,
    reference,
    rows: [
      ["Application", moduleName],
      ["Client", clientName],
      ["Email", email],
      ["Phone", phone],
    ],
    cta: { label: "Review application", url: `${appUrl}${route}?open=${recordId}` },
  });

  return sendMail({
    to: staffTo,
    cc: staffCc,
    bcc: staffBcc,
    replyTo: email || undefined,
    subject: `New ${moduleName} · ${clientName} · ${reference}`,
    html,
    text,
    attachments,
  });
};

/**
 * Receipt to the contact of a new Company Registration, with the Client
 * Application PDF attached (when it was generated).
 * @param {object} info - { email, name, reference, companyName, attachments }
 */
const sendCompanyApplicationReceipt = async ({ email, name, reference, companyName, attachments = [] }) => {
  const { to: staffTo } = await getStaffRecipients("new-company");
  const { html, text } = await renderEmail({
    preheader: `We've received your company registration application (${reference}).`,
    heading: `Thank you, ${name || "for your application"}`,
    intro: attachments.length
      ? "We've received your company registration application. A copy of your submitted application is attached to this email. Our team will review it and contact you if anything else is needed."
      : "We've received your company registration application. Our team will review it and contact you if anything else is needed.",
    reference,
    rows: [
      ["Application", "Company Registration"],
      ["Proposed company name", companyName],
    ],
    footnote: "You're receiving this because you submitted a company registration application on our website. If this wasn't you, please contact us.",
  });

  return sendMail({
    to: email,
    replyTo: staffTo[0] || undefined,
    subject: `Company Registration Application Received - Financially Up (Ref: ${reference})`,
    html,
    text,
    attachments,
  });
};

// What the client is told for each Review & Decision outcome
const COMPANY_DECISION_INTROS = {
  Approved:
    "Good news - your company registration application has been approved. Your signed Notice of Acceptance is attached. Our team will now prepare and lodge the registration with ASIC and keep you updated.",
  "Approved With Conditions":
    "Your company registration application has been approved, subject to the conditions below. Your signed Notice of Acceptance is attached. Please action the conditions so we can lodge the registration with ASIC.",
  Declined:
    "After reviewing your company registration application, we are unable to proceed with it. The reviewer's notes are below. Please contact us if you have any questions.",
  "On Hold":
    "Your company registration application has been placed on hold while we wait for more information. The reviewer's notes are below - please reply to this email with what is needed.",
};

/**
 * Review & Decision on a Company Registration: email the client (every decision)
 * and send the staff "decision log". The Notice of Acceptance PDF is attached to
 * both when the application was approved.
 * Throws on failure (the caller logs it; the decision itself is already saved).
 *
 * @param {object} info - { email, name, reference, companyName, decision, status, staffName,
 *                          notes, conditions, recordId, attachments }
 */
const sendCompanyDecisionEmails = async ({
  email,
  name,
  reference,
  companyName,
  decision,
  status,
  staffName,
  notes,
  conditions,
  recordId,
  attachments = [],
}) => {
  const { appUrl } = mailConfig();
  const staff = await getStaffRecipients("new-company");
  const rows = [
    ["Application", "Company Registration"],
    ["Proposed company name", companyName],
    ["Decision", decision],
    ["Reviewed by", staffName],
  ];
  if (conditions && decision === "Approved With Conditions") rows.push(["Conditions", conditions]);

  if (email) {
    const client = await renderEmail({
      preheader: `Your company registration application (${reference}): ${decision}.`,
      heading: `Application update: ${decision}`,
      intro: `Dear ${name || "client"}, ${
        COMPANY_DECISION_INTROS[decision] ||
        `the status of your company registration application is now "${status || decision}".`
      }`,
      reference,
      rows,
      quote: notes || undefined,
      footnote: "You're receiving this because you submitted a company registration application on our website.",
    });
    await sendMail({
      to: email,
      replyTo: staff.to[0] || undefined,
      subject: `Company Registration ${decision} - Financially Up (Ref: ${reference})`,
      html: client.html,
      text: client.text,
      attachments,
    });
  }

  if (staff.to.length) {
    const log = await renderEmail({
      preheader: `${reference} -> ${decision} by ${staffName}`,
      heading: "Company Registration decision recorded",
      intro: `${staffName} recorded a decision on ${companyName || reference}.${
        email ? ` The client (${email}) has been emailed.` : " No client email address is on file."
      }`,
      reference,
      rows: [...rows, ["Status", status], ["Client", name], ["Client email", email]],
      quote: notes || undefined,
      cta: recordId ? { label: "Open in admin", url: `${appUrl}/admin/company-registration-new?open=${recordId}` } : undefined,
    });
    await sendMail({
      to: staff.to,
      cc: staff.cc,
      bcc: staff.bcc,
      subject: `[DECISION LOG] Company Registration ${reference} -> ${decision}`,
      html: log.html,
      text: log.text,
      attachments,
    });
  }
  return true;
};

module.exports = {
  sendEnquiryStaffAlert,
  sendEnquiryConfirmation,
  sendApplicationStaffAlert,
  sendCompanyApplicationReceipt,
  sendCompanyDecisionEmails,
};
