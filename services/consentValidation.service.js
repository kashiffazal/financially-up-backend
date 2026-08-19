/**
 * Consent Validation & Invalidation Service
 * ==========================================
 * Implements the shareholding consent invalidation rule:
 * When share details (numberOfShares, shareClass, amountPaidPerShare,
 * amountUnpaidPerShare, memberType) change AFTER a consent was given,
 * the consent status flips to 'Outdated' and blocks final submission
 * until a new consent is recorded.
 */

const crypto = require("crypto");
const NewCompanyConsent = require("../models/NewCompanyConsent");

/**
 * Compute a deterministic SHA-256 hash of the shareholding parameters.
 * Used to detect changes that would invalidate an existing consent.
 * @param {object} params - { shareClass, numberOfShares, amountPaidPerShare, amountUnpaidPerShare, memberType }
 * @returns {string} 64-character hex digest
 */
function computeConsentHash(params) {
  const normalized = JSON.stringify({
    shareClass: params.shareClass || "Ordinary",
    numberOfShares: Number(params.numberOfShares) || 0,
    amountPaidPerShare: Number(params.amountPaidPerShare) || 0,
    amountUnpaidPerShare: Number(params.amountUnpaidPerShare) || 0,
    memberType: params.memberType || "Individual",
  });
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Create a new consent record with a snapshot and hash.
 * @param {object} data - Consent record data
 * @returns {object} Created consent record
 */
async function createConsent(data) {
  const hash = data.snapshotData ? computeConsentHash(data.snapshotData) : null;
  return await NewCompanyConsent.create({
    ...data,
    consentDataHash: hash,
    status: "Active",
    signedAt: new Date(),
  });
}

/**
 * Check if a shareholder's active consent is still valid.
 * Compares the current share parameters against the stored hash.
 * @param {number} registrationId - Application ID
 * @param {number} personId - Shareholder ID
 * @param {object} currentParams - Current shareholding parameters
 * @returns {object} { isValid: boolean, consent: object|null }
 */
async function validateShareholderConsent(registrationId, personId, currentParams) {
  const activeConsent = await NewCompanyConsent.findOne({
    where: {
      registrationId,
      personId,
      personType: "Member",
      consentType: "MemberConsent",
      status: "Active",
    },
    order: [["signedAt", "DESC"]],
  });

  if (!activeConsent) {
    return { isValid: false, consent: null, reason: "No active consent found" };
  }

  const currentHash = computeConsentHash(currentParams);

  if (currentHash !== activeConsent.consentDataHash) {
    return { isValid: false, consent: activeConsent, reason: "Share details have changed since consent was given" };
  }

  return { isValid: true, consent: activeConsent };
}

/**
 * Invalidate all active consents for a specific member when share details change.
 * Called automatically by the controller when shareholder data is updated.
 * @param {number} registrationId - Application ID
 * @param {number} personId - Shareholder ID
 * @param {object} newParams - Updated shareholding parameters
 * @returns {number} Number of consents invalidated
 */
async function invalidateOutdatedConsents(registrationId, personId, newParams) {
  const newHash = computeConsentHash(newParams);

  // Find all active consents for this person that no longer match
  const activeConsents = await NewCompanyConsent.findAll({
    where: {
      registrationId,
      personId,
      personType: "Member",
      consentType: "MemberConsent",
      status: "Active",
    },
  });

  let invalidatedCount = 0;

  for (const consent of activeConsents) {
    if (consent.consentDataHash !== newHash) {
      await consent.update({ status: "Outdated" });
      invalidatedCount++;
    }
  }

  return invalidatedCount;
}

/**
 * Check if all required consents are active and valid for final submission.
 * @param {number} registrationId - Application ID
 * @returns {object} { canSubmit: boolean, missingConsents: array, outdatedConsents: array }
 */
async function checkAllConsentsValid(registrationId) {
  const allConsents = await NewCompanyConsent.findAll({
    where: { registrationId },
  });

  const outdatedConsents = allConsents.filter((c) => c.status === "Outdated");

  return {
    canSubmit: outdatedConsents.length === 0,
    totalConsents: allConsents.length,
    activeConsents: allConsents.filter((c) => c.status === "Active").length,
    outdatedConsents: outdatedConsents.map((c) => ({
      id: c.id,
      personName: c.personName,
      consentType: c.consentType,
      status: c.status,
    })),
  };
}

module.exports = {
  computeConsentHash,
  createConsent,
  validateShareholderConsent,
  invalidateOutdatedConsents,
  checkAllConsentsValid,
};
