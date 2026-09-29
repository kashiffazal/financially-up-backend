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

const MAX_ENGAGEMENT_FILES = 30;

/*
 * Identity documents are captured as front/back pairs, so the field names vary
 * (primaryIdFront, primaryIdBack, supportingIdFront, …). Accept any field name
 * and regroup req.files into { fieldName: [files] } for the controller; the
 * shared upload middleware still enforces file type and size limits.
 */
const groupFilesByField = (req, res, next) => {
  const fileList = Array.isArray(req.files) ? req.files : [];
  if (fileList.length > MAX_ENGAGEMENT_FILES) {
    return res.status(400).json({
      success: false,
      message: `Too many files attached. Maximum is ${MAX_ENGAGEMENT_FILES}.`,
    });
  }
  req.files = fileList.reduce((grouped, file) => {
    (grouped[file.fieldname] = grouped[file.fieldname] || []).push(file);
    return grouped;
  }, {});
  next();
};

// Public Client API: Submit form
router.post("/", upload.any(), groupFilesByField, createEngagement);

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
