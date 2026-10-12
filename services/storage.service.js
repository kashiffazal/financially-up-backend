/**
 * Storage Service
 * ===============
 * Handles converting base64 signature canvas data into PNG image files
 * and saving them to storage/uploads/signatures/ (private, unguessable names).
 */

const fs = require("fs");
const path = require("path");
const { privateMonthDir, randomToken } = require("../utils/privateFiles");

/**
 * Saves a base64 signature data string to a PNG file.
 * @param {string} base64Data - Base64 image string (e.g. data:image/png;base64,...)
 * @param {string} prefix - Filename prefix (e.g. 'client_sig' or 'taxagent_sig')
 * @returns {string|null} Relative file path to stored PNG
 */

function saveBase64Signature(base64Data, prefix = "sig") {
  if (!base64Data || typeof base64Data !== "string") return null;

  try {
    const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const imageBuffer = Buffer.from(matches[2], "base64");
    const { dir, urlBase } = privateMonthDir("signatures");
    const fileName = `${String(prefix).replace(/[^a-zA-Z0-9_-]/g, "_")}-${randomToken()}.png`;

    fs.writeFileSync(path.join(dir, fileName), imageBuffer);

    // Link used by the admin panel and PDFs
    return `${urlBase}/${fileName}`;
  } catch (error) {
    console.error("Failed to save base64 signature:", error);
    return null;
  }
}

module.exports = {
  saveBase64Signature,
};
