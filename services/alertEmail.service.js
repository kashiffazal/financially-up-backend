/**
 * Alert Email Service
 * ===================
 * Emails sent on website activity (all use the branded layout in mail.service):
 *   - sendEnquiryStaffAlert()     staff inbox (EMAIL_RECEIVER, cc EMAIL_CC), Reply-To = visitor
 *   - sendEnquiryConfirmation()   "we received your enquiry" to the visitor
 *   - sendApplicationStaffAlert() staff inbox when an application form is submitted
 *
 * Every function throws on failure so callers can record the delivery status.
 */

const { sendMail, renderEmail, mailConfig } = require("./mail.service");

const SOURCE_LABELS = { contact_page: "Contact page", contact_modal: "Contact Us popup" };

const fullNameOf = (e) => [e.firstName, e.lastName].filter(Boolean).join(" ") || e.email;

/**
 * Staff alert for a new website enquiry.
 * @param {object} enquiry - ContactEnquiry (plain or instance)
 */
const sendEnquiryStaffAlert = async (enquiry) => {
  const { staffTo, staffCc, appUrl } = mailConfig();
  if (!staffTo) throw new Error("EMAIL_RECEIVER is not configured.");
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
  const { staffTo } = mailConfig();
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
    replyTo: staffTo || undefined,
    subject: `We've received your enquiry (${enquiry.referenceNumber}) — Financially Up`,
    html,
    text,
  });
};

/**
 * Staff alert for a new application form submission.
 * @param {object} info - { moduleName, route, recordId, reference, clientName, email, phone }
 */
const sendApplicationStaffAlert = async ({ moduleName, route, recordId, reference, clientName, email, phone }) => {
  const { staffTo, staffCc, appUrl } = mailConfig();
  if (!staffTo) throw new Error("EMAIL_RECEIVER is not configured.");

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
    replyTo: email || undefined,
    subject: `New ${moduleName} · ${clientName} · ${reference}`,
    html,
    text,
  });
};

module.exports = {
  sendEnquiryStaffAlert,
  sendEnquiryConfirmation,
  sendApplicationStaffAlert,
};
