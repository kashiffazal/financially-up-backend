/**
 * Storage Service
 * ===============
 * Handles converting base64 signature canvas data into PNG image files
 * and saving them to /public/uploads/signatures/.
 */

const fs = require("fs");
const path = require("path");

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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const targetDir = path.join(__dirname, "../public/uploads/signatures", `${year}/${month}`);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.png`;
    const fullPath = path.join(targetDir, fileName);

    fs.writeFileSync(fullPath, imageBuffer);

    // Return relative web URL path
    return `/uploads/signatures/${year}/${month}/${fileName}`;
  } catch (error) {
    console.error("Failed to save base64 signature:", error);
    return null;
  }
}

module.exports = {
  saveBase64Signature,
};
