/**
 * Email Settings Routes (Settings > Email)
 * ========================================
 * Base path: /api/email-settings — see controllers/emailSettings.controller.js
 */

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const c = require("../controllers/emailSettings.controller");

// Test / make-default send real emails: keep them to a sensible number
const testLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many test emails. Please wait a few minutes." },
});

router.use(authenticate);
// Always fresh: the admin re-reads the list right after changing it
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/accounts", authorize("settings.view"), c.listAccounts);
router.post("/accounts", authorize("settings.update"), c.createAccount);
router.put("/accounts/:id", authorize("settings.update"), c.updateAccount);
router.delete("/accounts/:id", authorize("settings.update"), c.deleteAccount);
router.post("/accounts/:id/test", authorize("settings.update"), testLimiter, c.testAccount);
router.post("/accounts/:id/make-default", authorize("settings.update"), testLimiter, c.makeDefault);

router.get("/recipients", authorize("settings.view"), c.getRecipients);
router.put("/recipients", authorize("settings.update"), c.updateRecipients);

module.exports = router;
