/**
 * Australian Phone Numbers (server side)
 * ======================================
 * Same rules as the frontend (financially-up-frontend/lib/auPhone.js):
 *   Mobile 04XX XXX XXX · Landline 0X XXXX XXXX (02/03/07/08) · 1300/1800 XXX XXX · 13 XX XX
 * Spaces, dashes, dots, brackets and a +61 / 61 / 0061 prefix are accepted.
 */

const MOBILE = /^04\d{8}$/;
const LANDLINE = /^0[2378]\d{8}$/;
const BUSINESS_1300_1800 = /^1[38]00\d{6}$/;
const BUSINESS_13 = /^13\d{4}$/;

/** Digits only, with any +61 / 61 / 0061 prefix converted to a leading 0. */
const normalizeAuPhone = (value) => {
  if (value === null || value === undefined) return "";
  let digits = String(value).replace(/[\s\-().]/g, "");
  if (digits.startsWith("+61")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("0061")) digits = `0${digits.slice(4)}`;
  else if (/^61[2-478]\d{8}$/.test(digits)) digits = `0${digits.slice(2)}`;
  if (/^00[2-478]/.test(digits)) digits = digits.slice(1); // "+61 (0) 4…"
  return digits;
};

const isAuMobile = (value) => MOBILE.test(normalizeAuPhone(value));

const isAuPhone = (value) => {
  const d = normalizeAuPhone(value);
  return MOBILE.test(d) || LANDLINE.test(d) || BUSINESS_1300_1800.test(d) || BUSINESS_13.test(d);
};

/** Standard Australian display format; unrecognised input is returned trimmed. */
const formatAuPhone = (value) => {
  const d = normalizeAuPhone(value);
  if (MOBILE.test(d) || BUSINESS_1300_1800.test(d)) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (LANDLINE.test(d)) return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
  if (BUSINESS_13.test(d)) return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4)}`;
  return value === null || value === undefined ? "" : String(value).trim();
};

module.exports = { normalizeAuPhone, isAuMobile, isAuPhone, formatAuPhone };
