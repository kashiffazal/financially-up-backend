/**
 * Shared Multer Upload Middleware
 * ===============================
 * Reusable file upload handler for all engagement forms.
 * Stores uploaded documents in storage/uploads/documents/YYYY/MM/ (private, with
 * an unguessable name; see utils/privateFiles.js). Blog images: public/uploads/blog.
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { privateMonthDir, secureFileName } = require("../utils/privateFiles");

const DOCUMENT_EXT = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, privateMonthDir("documents").dir),
  // Extension from the checked file type, never from the uploader's file name
  filename: (req, file, cb) =>
    cb(null, secureFileName(`${path.basename(file.originalname, path.extname(file.originalname))}${DOCUMENT_EXT[file.mimetype] || ""}`, "document")),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, JPG, PNG, WEBP and DOC/DOCX are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max file size
});

/**
 * Public application forms (multipart with optional evidence uploads):
 * same storage/type rules, capped at 20 files of 15MB each.
 */
upload.publicForm = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
});

/**
 * Blog images (featured image + images inside posts): /public/uploads/blog/YYYY/MM/
 * Raster images only (no SVG, which can carry scripts), 8MB each.
 */
const BLOG_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
upload.blogImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const now = new Date();
      const uploadDir = path.join(
        __dirname,
        "../public/uploads/blog",
        `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`
      );
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const basename = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
      cb(null, `${basename}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) =>
    BLOG_IMAGE_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG, WEBP or GIF images can be uploaded."), false),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

module.exports = upload;
