/**
 * New Company Registration Routes
 * ================================
 * API routes for the New Company Registration module.
 * Mounted at /api/new-company-registrations in app.js
 */

const express = require("express");
const router = express.Router();

const {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  updateShareholder,
  submitAdminDecision,
  getPdf,
  regeneratePdf,
} = require("../controllers/newCompanyRegistration.controller");

const upload = require("../middleware/upload");

const MAX_REGISTRATION_FILES = 60;

/*
 * The 12-step form posts files under many field names, including indexed ones
 * (officer_0_idAttachment, member_1_corporateExtract), so accept any field name
 * and regroup req.files into { fieldName: [files] } for the controller.
 * File type and size limits still apply via the shared upload middleware.
 */
const groupFilesByField = (req, res, next) => {
  const fileList = Array.isArray(req.files) ? req.files : [];
  if (fileList.length > MAX_REGISTRATION_FILES) {
    return res.status(400).json({
      success: false,
      message: `Too many files attached. Maximum is ${MAX_REGISTRATION_FILES}.`,
    });
  }
  req.files = fileList.reduce((grouped, file) => {
    (grouped[file.fieldname] = grouped[file.fieldname] || []).push(file);
    return grouped;
  }, {});
  next();
};

/* ─── Public Client API ─── */

/* Submit complete 12-step company registration form with file uploads */
router.post("/", upload.any(), groupFilesByField, createRegistration);

/* ─── Admin APIs ─── */

/* List all registrations with pagination, search & status filters */
router.get("/", getRegistrations);

/* Get full details of a single registration */
router.get("/:id", getRegistrationById);

/* Update a shareholder (triggers consent invalidation if shares change) */
router.put("/:id/shareholders/:memberId", updateShareholder);

/* Submit admin AML/CTF review decision */
router.put(
  "/:id/decision",
  upload.fields([{ name: "staffSignature", maxCount: 1 }]),
  submitAdminDecision
);
router.post(
  "/:id/decision",
  upload.fields([{ name: "staffSignature", maxCount: 1 }]),
  submitAdminDecision
);
router.put(
  "/:id/admin-decision",
  upload.fields([{ name: "staffSignature", maxCount: 1 }]),
  submitAdminDecision
);
router.post(
  "/:id/admin-decision",
  upload.fields([{ name: "staffSignature", maxCount: 1 }]),
  submitAdminDecision
);

/* Download/view generated PDF by type */
router.get("/:id/pdf/:type", getPdf);

/* Regenerate PDFs on demand */
router.post("/:id/regenerate-pdf", regeneratePdf);

module.exports = router;
