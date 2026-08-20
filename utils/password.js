/**
 * Password Security Utility (Argon2id)
 * ====================================
 * Implements password hashing and verification using the state-of-the-art
 * Argon2id algorithm (Password Hashing Competition winner).
 *
 * Argon2id combines data-dependent memory access (Argon2d) and data-independent
 * memory access (Argon2i) to provide maximal resistance against side-channel
 * attacks, GPU cracking, and ASIC brute-forcing.
 */

const argon2 = require("argon2");
const bcrypt = require("bcryptjs");

/**
 * Hash a plaintext password using Argon2id with automatic bcrypt fallback.
 *
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Encoded hash string
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 65,536 KiB (64 MiB)
      timeCost: 3,        // 3 iterations
      parallelism: 1,     // 1 thread
    });
  } catch (argonError) {
    console.warn("Argon2 hashing error, falling back to bcrypt:", argonError.message);
    return await bcrypt.hash(password, 10);
  }
};

/**
 * Verify a candidate plaintext password against an Argon2 or bcrypt hash.
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
    // If stored hash is bcrypt format ($2a$, $2b$, $2y$)
    if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
      return await bcrypt.compare(password, hash);
    }

    // If stored hash is Argon2 format ($argon2...)
    if (hash.startsWith("$argon2")) {
      return await argon2.verify(hash, password);
    }

    // Generic attempt: try argon2 first, then bcrypt
    try {
      return await argon2.verify(hash, password);
    } catch {
      return await bcrypt.compare(password, hash);
    }
  } catch (error) {
    console.error("Password verification error:", error.message);
    return false;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
};

