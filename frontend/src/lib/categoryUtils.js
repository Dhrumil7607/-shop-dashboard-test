/**
 * categoryUtils.js
 *
 * Utilities for detecting product category gender and type.
 * Used by ProductDetail and sizing components to determine
 * which UI to show (AI Size Finder vs Standard Size Guide).
 */

// ── Women's categories ────────────────────────────────────────────────────────
const WOMENS_CATEGORIES = new Set([
  // Exact matches
  "Saree", "Sarees",
  "Lehenga", "Lehengas",
  "Chaniya Choli",
  "Kurti", "Kurtis",
  "Suit",
  "Salwar Suit", "Salwar",
  "Gown", "Gowns",
  "Dress", "Dresses",
  "Blouse", "Blouses",
  "Anarkali",
  "Dupatta",
  "Festival Wear",
  "Wedding Wear",
  "Bridal Wear",
]);

// ── Men's categories ──────────────────────────────────────────────────────────
const MENS_CATEGORIES = new Set([
  "Kurta", "Kurtas",
  "Sherwani", "Sherwanis",
  "Shirt", "Shirts",
  "Jacket", "Jackets",
  "Waistcoat", "Waistcoats",
  "Blazer", "Blazers",
  "Pants", "Trouser", "Trousers",
  "Dhoti",
  "Men's Ethnic",
  "Wedding Wear Men",
]);

// ── Partial keyword matching helpers ─────────────────────────────────────────
const WOMENS_KEYWORDS = [
  "saree", "lehenga", "chaniya", "choli", "kurti", "suit", "salwar",
  "gown", "dress", "blouse", "anarkali", "dupatta", "bridal", "mehendi",
];

const MENS_KEYWORDS = [
  "sherwani", "kurta", "shirt", "jacket", "waistcoat", "blazer",
  "trousers", "trouser", "pants", "dhoti", "bandhgala", "jodhpuri",
];

/**
 * Returns "women" | "men" | "unisex" for a product category string.
 *
 * Priority:
 * 1. Exact Set match (fastest)
 * 2. Partial keyword match on lowercased category
 * 3. Default "unisex"
 *
 * @param {string} category
 * @returns {"women" | "men" | "unisex"}
 */
export function getCategoryGender(category) {
  if (!category) return "unisex";

  // 1. Exact match (case-sensitive)
  if (WOMENS_CATEGORIES.has(category)) return "women";
  if (MENS_CATEGORIES.has(category)) return "men";

  // 2. Partial keyword match (case-insensitive)
  const lower = category.toLowerCase();
  if (WOMENS_KEYWORDS.some((k) => lower.includes(k))) return "women";
  if (MENS_KEYWORDS.some((k) => lower.includes(k))) return "men";

  return "unisex";
}

/**
 * Returns true if the category is a women's clothing category
 * that should show the AI Size Finder.
 */
export function isWomensCategory(category) {
  return getCategoryGender(category) === "women";
}

/**
 * Returns true if the category is a men's clothing category
 * that should show the standard size selector + Size Guide.
 */
export function isMensCategory(category) {
  return getCategoryGender(category) === "men";
}

/**
 * Standard men's sizes for size button rendering.
 */
export const MENS_STANDARD_SIZES = ["S", "M", "L", "XL", "XXL"];

/**
 * Numeric men's sizes for sherwanis/kurtas/shirts.
 */
export const MENS_NUMERIC_SIZES = ["38", "40", "42", "44", "46"];

/**
 * Returns appropriate size buttons for a men's category.
 * @param {string} category
 * @returns {string[]}
 */
export function getMensSizes(category) {
  if (!category) return MENS_STANDARD_SIZES;
  const lower = category.toLowerCase();
  if (
    lower.includes("sherwani") ||
    lower.includes("kurta") ||
    lower.includes("shirt") ||
    lower.includes("jacket") ||
    lower.includes("blazer")
  ) {
    return MENS_NUMERIC_SIZES;
  }
  return MENS_STANDARD_SIZES;
}
