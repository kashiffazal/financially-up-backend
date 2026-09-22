/**
 * NewIndividualEngagement Routes
 * ==============================
 * API routes for the New Individual Client Engagement Form.
 */

const express = require("express");
const router = express.Router();

const {
  createEngagement,
  getEngagements,
  submitAdminDecision,
  deleteEngagement,
} = require("../controllers/newIndividualEngagement.controller");

const upload = require("../middleware/upload");

// Public Client API: Submit form
router.post(
  "/",
  upload.fields([
    { name: "primaryId", maxCount: 1 },
    { name: "supportingId", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "visaEvidence", maxCount: 1 },
    { name: "atoDocuments", maxCount: 5 },
    { name: "authorityDoc", maxCount: 1 },
    { name: "signatureUploadedFile", maxCount: 1 },
  ]),
  createEngagement
);

// Admin APIs (/admin/individual-engagement-new)
router.get("/", getEngagements);

// Admin Record Deletion
router.delete("/:id", deleteEngagement);

// Admin Decision Endpoint (Supports both PUT & POST, /decision & /admin-decision)
router.put(
  "/:id/decision",
  upload.fields([{ name: "staffUploadedSignature", maxCount: 1 }]),
  submitAdminDecision
);
router.post(
  "/:id/decision",
  upload.fields([{ name: "staffUploadedSignature", maxCount: 1 }]),
  submitAdminDecision
);
router.put(
  "/:id/admin-decision",
  upload.fields([{ name: "staffUploadedSignature", maxCount: 1 }]),
  submitAdminDecision
);
router.post(
  "/:id/admin-decision",
  upload.fields([{ name: "staffUploadedSignature", maxCount: 1 }]),
  submitAdminDecision
);

module.exports = router;
