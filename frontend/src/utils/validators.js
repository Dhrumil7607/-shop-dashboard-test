/**
 * Pure validation utility functions for ShopLiveBharat Premium features.
 *
 * All functions are side-effect-free and return boolean values.
 * They are designed for use in form validation and service-level guards.
 */

// ============================================================================
// MEASUREMENT VALIDATION
// ============================================================================

/** Accepted bounds per unit */
const MEASUREMENT_BOUNDS = {
  cm: { min: 1, max: 500 },
  inches: { min: 0.4, max: 196.9 },
};

/**
 * Validates a body-measurement value against the accepted numeric range.
 *
 * Accepts numeric strings and numbers.  Rejects:
 *   - null / undefined / empty string
 *   - non-numeric strings (NaN after parseFloat)
 *   - values outside [1, 500] cm  or  [0.4, 196.9] inches
 *
 * @param {string|number} value - The measurement value to validate.
 * @param {'cm'|'inches'} unit  - The unit the value is expressed in.
 * @returns {boolean}
 */
export function isValidMeasurement(value, unit) {
  if (value === null || value === undefined || value === '') return false;

  const bounds = MEASUREMENT_BOUNDS[unit];
  if (!bounds) return false;

  const numeric = typeof value === 'number' ? value : parseFloat(value);
  if (!isFinite(numeric)) return false;

  return numeric >= bounds.min && numeric <= bounds.max;
}

// ============================================================================
// PROFILE NAME VALIDATION
// ============================================================================

/**
 * Validates a Size Profile name.
 *
 * Accepts names that are:
 *   - between 1 and 40 characters (inclusive), AND
 *   - not already present in the `existingNames` array (case-sensitive).
 *
 * @param {string} name                    - The candidate profile name.
 * @param {string[]} [existingNames=[]]    - Names already taken by the user's profiles.
 * @returns {boolean}
 */
export function isValidProfileName(name, existingNames = []) {
  if (typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 40) return false;
  if (existingNames.includes(name)) return false;
  return true;
}

// ============================================================================
// GOOGLE MEET URL VALIDATION
// ============================================================================

/**
 * Regular expression for a valid Google Meet URL.
 * Format: https://meet.google.com/[3 lowercase letters]-[4 lowercase letters]-[3 lowercase letters]
 */
const MEET_URL_REGEX = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

/**
 * Validates a Google Meet URL against the required format.
 *
 * Accepts: `https://meet.google.com/abc-abcd-abc`
 * Rejects: any other format, including http, extra path segments, uppercase letters.
 *
 * @param {string} url - The URL string to validate.
 * @returns {boolean}
 */
export function isValidMeetUrl(url) {
  if (typeof url !== 'string') return false;
  return MEET_URL_REGEX.test(url);
}
