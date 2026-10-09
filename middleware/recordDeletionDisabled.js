/**
 * Record Deletion Disabled
 * ========================
 * Client applications, engagements and enquiries are never deleted: they are
 * kept for ATO / Tax Practitioners Board record-keeping and the audit trail.
 * Every DELETE /:id route of those modules uses this handler instead of the
 * controller's delete function, so records can't be removed even by calling
 * the API directly. (To retire a record, change its status instead.)
 */

const recordDeletionDisabled = (req, res) =>
  res.status(405).json({
    success: false,
    message: "Records can't be deleted. They are kept for compliance record-keeping — change the status instead.",
  });

module.exports = { recordDeletionDisabled };
