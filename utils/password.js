/**
 * Password Security Utility (Pure JS Bcrypt)
 * ==========================================
 * Implements secure password hashing and verification using bcryptjs
 * (100% pure JavaScript, zero C++ native compilation dependencies).
 */

const bcrypt = require("bcryptjs");

/**
 * Hash a plaintext password using bcrypt with salt factor 10.
 *
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Encoded bcrypt hash string
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  return await bcrypt.hash(password, 10);
};

/**
 * Verify a candidate plaintext password against a stored hash.
 * Supports standard bcrypt format ($2a$, $2b$, $2y$) and legacy hashes.
 *
 * @param {string} hash - Stored hash from database
 * @param {string} password - Candidate plaintext password
 * @returns {Promise<boolean>} True if match, false otherwise
 */
const verifyPassword = async (hash, password) => {
  if (!hash || !password) {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("Password verification error:", error.message);
    return false;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
};


