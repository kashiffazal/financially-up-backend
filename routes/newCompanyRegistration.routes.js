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

/* ─── Public Client API ─── */

/* Submit complete 12-step company registration form with file uploads */
router.post(
  "/",
  upload.fields([
    { name: "idDocument", maxCount: 5 },
    { name: "photoId", maxCount: 5 },
    { name: "occupierConsent", maxCount: 1 },
    { name: "asicExtract", maxCount: 5 },
    { name: "trustDeed", maxCount: 5 },
    { name: "structureChart", maxCount: 1 },
    { name: "sourceOfWealthEvidence", maxCount: 5 },
    { name: "nomineeAgreement", maxCount: 5 },
    { name: "authorityDocument", maxCount: 1 },
    { name: "signatureFile", maxCount: 5 },
  ]),
  createRegistration
);

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

/* Download/view generated PDF by type */
router.get("/:id/pdf/:type", getPdf);

/* Regenerate PDFs on demand */
router.post("/:id/regenerate-pdf", regeneratePdf);

module.exports = router;
