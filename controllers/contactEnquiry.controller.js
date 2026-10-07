/**
 * Contact Enquiry Controller
 * ==========================
 * Public:  POST /api/contact-enquiries      (website Contact page + "Contact Us" popup)
 * Staff:   GET / GET :id / PUT :id / DELETE :id   (/admin/enquiries)
 */

const { ContactEnquiry } = require("../models");
const notificationService = require("../services/notification.service");
const { sendEnquiryStaffAlert, sendEnquiryConfirmation } = require("../services/alertEmail.service");

const ENQUIRY_STATUSES = ["New", "Contacted", "Closed", "Spam"];

// Anti-spam: hidden field with a name browsers never autofill (the old "website"
// name was being autofilled by Chrome, which silently dropped real enquiries).
const HONEYPOT_FIELD = "fu_contact_trap";
// Real people take longer than this between opening the form and submitting it
const MIN_HUMAN_FILL_MS = 3000;
const SOURCES = ["contact_page", "contact_modal"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[\d\s+()-]{6,20}$/;

const clean = (value, max) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "");
const cleanMultiline = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/**
 * Browsers and password managers sometimes autofill the hidden trap with the
 * visitor's own name / email / phone. Bots put arbitrary text there instead.
 */
const isBrowserAutofill = (trapValue, data) => {
  const norm = (v) => String(v || "").toLowerCase().replace(/[\s()+-]/g, "");
  const trap = norm(trapValue);
  if (!trap) return false;
  const own = [
    data.firstName,
    data.lastName,
    `${data.firstName} ${data.lastName || ""}`,
    data.email,
    data.phone,
  ].map(norm);
  return own.some((value) => value && value === trap);
};

const generateReference = () =>
  `ENQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;

/**
 * POST /api/contact-enquiries (public)
 */
const create = async (req, res) => {
  try {
    const body = req.body || {};

    const data = {
      firstName: clean(body.firstName, 100),
      lastName: clean(body.lastName, 100) || null,
      email: clean(body.email, 190).toLowerCase(),
      phone: clean(body.phone, 40) || null,
      service: clean(body.service, 150) || null,
      preferredContact: clean(body.preferredContact, 40) || null,
      message: cleanMultiline(body.message, 5000) || null,
      source: SOURCES.includes(body.source) ? body.source : "contact_page",
    };

    const errors = {};
    if (!data.firstName) errors.firstName = "Please enter your first name.";
    if (!EMAIL_REGEX.test(data.email)) errors.email = "Please enter a valid email address.";
    if (data.phone && !PHONE_REGEX.test(data.phone)) errors.phone = "Please enter a valid phone number.";
    if (Object.keys(errors).length) {
      return res.status(400).json({
        success: false,
        message: Object.values(errors)[0],
        errors,
      });
    }

    // Suspected spam is kept (status "Spam", no alerts) so a false positive never loses a real enquiry
    const elapsedMs = Number(body.formElapsedMs);
    const trapValue = clean(body[HONEYPOT_FIELD], 200);
    let spamReason = null;
    if (trapValue && !isBrowserAutofill(trapValue, data)) {
      spamReason = `Hidden anti-spam field was filled: "${trapValue.slice(0, 40)}"`;
    } else if (Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs < MIN_HUMAN_FILL_MS) {
      spamReason = `Submitted ${Math.round(elapsedMs)}ms after the form opened`;
    }
    const isSpam = Boolean(spamReason);

    let enquiry = null;
    for (let attempt = 0; attempt < 5 && !enquiry; attempt++) {
      try {
        enquiry = await ContactEnquiry.create({
          ...data,
          referenceNumber: generateReference(),
          status: isSpam ? "Spam" : "New",
          spamReason,
          staffEmailStatus: isSpam ? "skipped" : "pending",
          confirmationEmailStatus: isSpam ? "skipped" : "pending",
          ipAddress: req.ip || null,
          userAgent: clean(req.get("user-agent"), 255) || null,
        });
      } catch (error) {
        if (error.name !== "SequelizeUniqueConstraintError") throw error;
      }
    }
    if (!enquiry) throw new Error("Could not allocate an enquiry reference.");

    if (isSpam) {
      console.warn(`[ContactEnquiry] ${enquiry.referenceNumber} flagged as spam: ${spamReason}`);
    } else {
      // Notify staff in-app now; send emails after the response so the visitor never waits on SMTP
      notificationService.notifyContactEnquiry(enquiry);
      setImmediate(() => deliverEnquiryEmails(enquiry));
    }

    return res.status(201).json({
      success: true,
      message: "Thank you, your enquiry has been received.",
      data: { referenceNumber: enquiry.referenceNumber },
    });
  } catch (error) {
    console.error("[ContactEnquiry] create error:", error);
    return res.status(500).json({
      success: false,
      message: "We couldn't send your enquiry right now. Please try again or call us.",
    });
  }
};

/**
 * Send the staff alert + visitor confirmation and record each delivery status.
 */
const deliverEnquiryEmails = async (enquiry) => {
  const [staff, confirmation] = await Promise.allSettled([
    sendEnquiryStaffAlert(enquiry),
    sendEnquiryConfirmation(enquiry),
  ]);
  const outcome = (result) =>
    result.status === "fulfilled"
      ? { status: "sent", error: null }
      : { status: "failed", error: String(result.reason?.message || result.reason).slice(0, 1000) };
  const s = outcome(staff);
  const c = outcome(confirmation);
  if (s.error) console.error(`[ContactEnquiry] Staff alert failed for ${enquiry.referenceNumber}:`, s.error);
  if (c.error) console.error(`[ContactEnquiry] Confirmation failed for ${enquiry.referenceNumber}:`, c.error);
  try {
    await enquiry.update({
      staffEmailStatus: s.status,
      staffEmailError: s.error,
      confirmationEmailStatus: c.status,
      confirmationEmailError: c.error,
    });
  } catch (error) {
    console.error("[ContactEnquiry] Could not record email status:", error.message);
  }
};

/**
 * GET /api/contact-enquiries (staff)
 */
const list = async (req, res) => {
  try {
    const records = await ContactEnquiry.findAll({
      attributes: { exclude: ["ipAddress", "userAgent"] },
      order: [["createdAt", "DESC"]],
      limit: 2000,
    });
    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("[ContactEnquiry] list error:", error);
    return res.status(500).json({ success: false, message: "Failed to load enquiries." });
  }
};

/**
 * GET /api/contact-enquiries/:id (staff)
 */
const getById = async (req, res) => {
  try {
    const record = await ContactEnquiry.findByPk(req.params.id, {
      attributes: { exclude: ["ipAddress", "userAgent"] },
    });
    if (!record) return res.status(404).json({ success: false, message: "Enquiry not found." });
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("[ContactEnquiry] getById error:", error);
    return res.status(500).json({ success: false, message: "Failed to load enquiry." });
  }
};

/**
 * PUT /api/contact-enquiries/:id (staff) — { status?, staffNotes? }
 */
const update = async (req, res) => {
  try {
    const record = await ContactEnquiry.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Enquiry not found." });

    const changes = {};
    if (req.body?.status !== undefined) {
      if (!ENQUIRY_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: "Invalid enquiry status." });
      }
      changes.status = req.body.status;
      if (req.body.status !== record.status) {
        changes.handledByUserId = req.user?.id || null;
        changes.handledByName = req.user?.fullName || req.user?.email || null;
        changes.handledAt = new Date();
      }
    }
    if (req.body?.staffNotes !== undefined) {
      changes.staffNotes = cleanMultiline(req.body.staffNotes, 5000) || null;
    }

    const wasSpam = record.status === "Spam";
    await record.update(changes);

    // "Not spam" (Spam → New): send the in-app notification + emails that were skipped when it was flagged
    if (wasSpam && changes.status === "New" && record.staffEmailStatus === "skipped") {
      await record.update({ staffEmailStatus: "pending", confirmationEmailStatus: "pending", spamReason: null });
      notificationService.notifyContactEnquiry(record);
      setImmediate(() => deliverEnquiryEmails(record));
    }

    const { ipAddress, userAgent, ...safe } = record.get({ plain: true });
    return res.status(200).json({ success: true, message: "Enquiry updated.", data: safe });
  } catch (error) {
    console.error("[ContactEnquiry] update error:", error);
    return res.status(500).json({ success: false, message: "Failed to update enquiry." });
  }
};

/**
 * DELETE /api/contact-enquiries/:id (staff)
 */
const remove = async (req, res) => {
  try {
    const record = await ContactEnquiry.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Enquiry not found." });
    await record.destroy();
    return res.status(200).json({ success: true, message: "Enquiry deleted." });
  } catch (error) {
    console.error("[ContactEnquiry] remove error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete enquiry." });
  }
};

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  ENQUIRY_STATUSES,
};
