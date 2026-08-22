/**
 * Express Application Setup
 * ==========================
 * Creates and configures the Express app with:
 * - CORS (allows Next.js App and Admin Panel to call the API)
 * - Helmet (security headers)
 * - Cookie Parser (for secure HttpOnly JWT session tokens)
 * - JSON body parsing
 * - Authentication & RBAC Route registration
 * - Global error handler
 *
 * This file does NOT start the server - that's done in index.js.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const errorHandler = require("./middleware/errorHandler");
const dynamicPdfViewer = require("./middleware/dynamicPdfViewer");

// Import Auth & RBAC Route files
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const roleRoutes = require("./routes/role.routes");
const permissionRoutes = require("./routes/permission.routes");
const auditRoutes = require("./routes/audit.routes");

// Import Application Route files
const individualEngagementRoutes = require("./routes/individualEngagement.routes");
const applyTfnAbnsRoutes = require("./routes/applyTfnAbns.routes");
const gstRegistrationRoutes = require("./routes/gstRegistration.routes");
const businessNameRegistrationRoutes = require("./routes/businessNameRegistration.routes");
const medicareRoutes = require("./routes/medicare.routes");
const trustRegistrationRoutes = require("./routes/trustRegistration.routes");
const entityEngagementRoutes = require("./routes/entityEngagement.routes");
const changesToCompanyDetailsRoutes = require("./routes/changesToCompanyDetails.routes");
const smsfRegistrationRoutes = require("./routes/smsfRegistration.routes");
const companyRegistrationRoutes = require("./routes/companyRegistration.routes");
const newIndividualEngagementRoutes = require("./routes/newIndividualEngagement.routes");
const newCompanyRegistrationRoutes = require("./routes/newCompanyRegistration.routes");

// Create Express app
const app = express();

// ============================
// Middleware
// ============================

// CORS - allow requests from the frontend (New App) and the Old App
// IMPORTANT: CORS must be registered BEFORE helmet so preflight OPTIONS
// requests get the Access-Control-Allow-Origin header without interference.
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-requested-with",
    "Accept",
    "Origin",
    "X-CSRF-Token",
    "Cache-Control",
  ],
  exposedHeaders: ["Content-Disposition", "X-Total-Count"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Security headers (XSS protection, content-type sniffing prevention, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Parse Cookie headers for HttpOnly session tokens
app.use(cookieParser());

// Parse incoming JSON request bodies
app.use(express.json({ limit: "10mb" })); // 10mb limit to handle base64 signatures and files

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static uploaded files (PDFs, signatures, documents)
const uploadsStaticDir = path.join(__dirname, "public/uploads");
const staticOptions = {
  dotfiles: "ignore",
  etag: true,
  index: false,
  maxAge: "1d",
  setHeaders: (res, filePath) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (filePath.endsWith(".pdf")) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
    }
  },
};

app.use("/uploads", express.static(uploadsStaticDir, staticOptions));
app.use("/api/uploads", express.static(uploadsStaticDir, staticOptions));

// Dynamic on-demand PDF and document generation & serving middleware
app.use("/uploads", dynamicPdfViewer);
app.use("/api/uploads", dynamicPdfViewer);

// ============================
// Routes
// ============================

// Root health check endpoints
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Financially Up Backend API is live and active.",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Financially Up API root endpoint is live.",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Financially Up API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Authentication & Identity Management
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/audit-logs", auditRoutes);

// Operational Form and Application Routes
app.use("/api/individual-engagement", individualEngagementRoutes);
app.use("/api/apply-tfn-abns", applyTfnAbnsRoutes);
app.use("/api/gst-registrations", gstRegistrationRoutes);
app.use("/api/business-name-registrations", businessNameRegistrationRoutes);
app.use("/api/medicare", medicareRoutes);
app.use("/api/trust-registrations", trustRegistrationRoutes);
app.use("/api/entity-engagements", entityEngagementRoutes);
app.use("/api/changes-to-company-details", changesToCompanyDetailsRoutes);
app.use("/api/smsf-registrations", smsfRegistrationRoutes);
app.use("/api/company-registrations", companyRegistrationRoutes);
app.use("/api/new-individual-engagements", newIndividualEngagementRoutes);
app.use("/api/new-company-registrations", newCompanyRegistrationRoutes);

// ============================
// Error Handling
// ============================

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

module.exports = app;
