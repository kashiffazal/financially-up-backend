/**
 * Express Application Setup
 * ==========================
 * Creates and configures the Express app with:
 * - CORS (allows Old App and Admin Panel to call the API)
 * - Helmet (security headers)
 * - JSON body parsing
 * - Route registration
 * - Global error handler
 *
 * This file does NOT start the server — that's done in index.js.
 * PDF Engine Version: Part 20 Spec with new_individual_pdfs table.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");

// Import route files
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

// Create Express app
const app = express();

// ============================
// Middleware
// ============================

// Security headers (XSS protection, content-type sniffing prevention, etc.)
app.use(helmet());

// CORS — allow requests from the frontend (New App) and the Old App
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies if needed in the future
  }),
);

// Parse incoming JSON request bodies (form data from Old App will arrive as JSON)
app.use(express.json({ limit: "10mb" })); // 10mb limit to handle base64 signatures

const path = require("path");

// Parse URL-encoded bodies (for traditional form submissions)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static uploaded files (PDFs, signatures, documents)
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "public/uploads")));

// ============================
// Routes
// ============================

// Health check endpoint — useful for monitoring and deployment checks
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Financially Up API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Individual Engagement routes
app.use("/api/individual-engagement", individualEngagementRoutes);

// Apply TFN & ABNs routes
app.use("/api/apply-tfn-abns", applyTfnAbnsRoutes);

// GST Registrations routes
app.use("/api/gst-registrations", gstRegistrationRoutes);

// Business Name Registrations routes
app.use("/api/business-name-registrations", businessNameRegistrationRoutes);

// Medicare routes
app.use("/api/medicare", medicareRoutes);

// Trust Registrations routes
app.use("/api/trust-registrations", trustRegistrationRoutes);

// Entity Engagements routes
app.use("/api/entity-engagements", entityEngagementRoutes);

// Changes to Company Details routes
app.use("/api/changes-to-company-details", changesToCompanyDetailsRoutes);

// SMSF Registration routes
app.use("/api/smsf-registrations", smsfRegistrationRoutes);

// Company Registration routes
app.use("/api/company-registrations", companyRegistrationRoutes);

// New Individual Engagement routes
app.use("/api/new-individual-engagements", newIndividualEngagementRoutes);

// ============================
// Future Route Registrations
// ============================
// As new forms are added, register their routes here:
// app.use("/api/company-registration", companyRegistrationRoutes);

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
