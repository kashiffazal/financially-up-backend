/**
 * Secret Box
 * ==========
 * Encrypts small secrets (e.g. SMTP passwords) before they are stored in the
 * database, using AES-256-GCM with the key from EMAIL_ENCRYPTION_KEY
 * (.env / hPanel). Any string works as the key; it is hashed to 32 bytes.
 *
 * Stored format: "v1:<iv base64>:<auth tag base64>:<ciphertext base64>"
 * Losing or changing the key makes stored passwords unreadable (they then have
 * to be entered again in Settings > Email).
 */

const crypto = require("crypto");

const keyFromEnv = () => {
  const raw = process.env.EMAIL_ENCRYPTION_KEY;
  if (!raw) return null;
  return crypto.createHash("sha256").update(String(raw)).digest();
};

/** True when an encryption key is configured. */
const canEncrypt = () => Boolean(keyFromEnv());

/** Plain text -> stored string. Throws when no key is configured. */
const encrypt = (plain) => {
  const key = keyFromEnv();
  if (!key) throw new Error("EMAIL_ENCRYPTION_KEY is not set on the server.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
};

/** Stored string -> plain text, or null when it can't be read (wrong / missing key). */
const decrypt = (stored) => {
  const key = keyFromEnv();
  if (!key || typeof stored !== "string") return null;
  const [version, iv, tag, data] = stored.split(":");
  if (version !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
};

module.exports = { encrypt, decrypt, canEncrypt };
