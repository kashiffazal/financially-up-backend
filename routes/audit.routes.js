/**
 * Audit Log Routes
 * ================
 * Endpoints for viewing and inspecting system audit records.
 */

const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");

// All audit log routes require authentication
router.use(authenticate);

router.get("/", authorize("audit.view"), auditController.getAuditLogs);
router.get("/:id", authorize("audit.view"), auditController.getAuditLogById);

module.exports = router;
