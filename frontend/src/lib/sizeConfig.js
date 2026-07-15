/**
 * sizeConfig.js
 * Central source of truth for product categories, size options,
 * and size-type detection used across admin + seller product forms
 * and the frontend ProductDetail page.
 */

// ── All product categories ───────────────────────────────────────────────────
export const ALL_CATEGORIES = [
  // Women's
  "Sarees",
  "Lehengas",
  "Chaniya Choli",
  "Kurti / Kurtis",
  "Salwar Suit",
  "Anarkali",
  "Gown",
  "Festival Wear",
  "Bridal Wear",
  "Wedding Wear",
  "Dupatta / Shawl",
  // Men's
  "Kurtas",
  "Sherwanis",
  "Men's Ethnic",
  "Wedding Wear Men",
  "Shirts",
  "Jackets",
  "Waistcoat",
  // Kids
  "Kids Traditional",
  "Kids Wear",
  // Western — Tops
  "T-Shirts",
  "Polo Shirts",
  "Tops",
  "Blouses",
  "Tank Tops",
  "Crop Tops",
  "Hoodies",
  "Sweatshirts",
  // Western — Bottoms
  "Jeans",
  "Trousers",
  "Cargo Pants",
  "Joggers",
  "Shorts",
  "Skirts",
  "Leggings",
  // Western — Outerwear
  "Blazers",
  "Coats",
  // Western — Dresses & One-piece
  "Dresses",
  "Jumpsuits",
  "Rompers",
  // Western — Activewear / Loungewear
  "Activewear",
  "Gym Wear",
  "Loungewear",
  "Nightwear",
  "Innerwear",
  // Accessories / No Size
  "Jewellery",
  "Accessories",
  "Bags",
  "Backpacks",
  "Handbags",
  "Wallets",
  "Belts",
  "Caps",
  "Socks",
  "Footwear",
  "Sneakers",
  "Boots",
  "Sandals",
  "Heels",
  "Flats",
  "Home Décor",
  "Fabric",
  "Other",
];

// ── Categories that need NO size selection ──────────────────────────────────
export const NO_SIZE_CATS = new Set([
  "Sarees",
  "Dupatta / Shawl",
  "Jewellery",
  "Accessories",
  "Bags",
  "Backpacks",
  "Handbags",
  "Wallets",
  "Belts",
  "Caps",
  "Socks",
  "Footwear",
  "Sneakers",
  "Boots",
  "Sandals",
  "Heels",
  "Flats",
  "Home Décor",
  "Fabric",
  "Other",
]);

// ── Western unisex apparel (standard XS–XXL sizing) ──────────────────────────
export const WESTERN_CATS = new Set([
  "T-Shirts", "Polo Shirts", "Tops", "Blouses", "Tank Tops", "Crop Tops",
  "Hoodies", "Sweatshirts", "Jeans", "Trousers", "Cargo Pants", "Joggers",
  "Shorts", "Skirts", "Leggings", "Blazers", "Coats", "Dresses", "Jumpsuits",
  "Rompers", "Activewear", "Gym Wear", "Loungewear", "Nightwear", "Innerwear",
]);
export const WESTERN_STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// ── Men's categories ─────────────────────────────────────────────────────────
export const MENS_CATS = new Set([
  "Kurtas",
  "Sherwanis",
  "Men's Ethnic",
  "Wedding Wear Men",
  "Shirts",
  "Jackets",
  "Waistcoat",
]);

// ── Women's categories (custom size / measurement-based) ─────────────────────
export const WOMENS_CATS = new Set([
  "Lehengas",
  "Chaniya Choli",
  "Kurti / Kurtis",
  "Salwar Suit",
  "Anarkali",
  "Gown",
  "Festival Wear",
  "Bridal Wear",
  "Wedding Wear",
]);

// ── Men's standard sizes (XS → XXL) ─────────────────────────────────────────
export const MENS_STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// ── Men's numeric sizes (for tailored garments) ───────────────────────────────
export const MENS_NUMERIC_SIZES = ["38", "40", "42", "44", "46", "48"];

// ── Women's standard sizes ────────────────────────────────────────────────────
export const WOMENS_STANDARD_SIZES = ["XS", "S", "M", "L", "XL"];

// ── Kids sizes ────────────────────────────────────────────────────────────────
export const KIDS_SIZES = ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"];

/**
 * Returns "men" | "women" | "kids" | "none" for a given category.
 */
export function getSizeType(category) {
  if (!category) return "none";
  if (NO_SIZE_CATS.has(category)) return "none";
  if (WESTERN_CATS.has(category)) return "western";
  if (MENS_CATS.has(category)) return "men";
  if (WOMENS_CATS.has(category)) return "women";
  if (category.toLowerCase().includes("kid")) return "kids";
  // Fallback keyword matching
  const lower = category.toLowerCase();
  if (["sherwani","kurta","shirt","jacket","waistcoat"].some(k => lower.includes(k))) return "men";
  if (["lehenga","saree","kurti","salwar","gown","anarkali","chaniya"].some(k => lower.includes(k))) return "women";
  return "none";
}

/**
 * Returns the default size options string for a category.
 * Used to pre-fill the size_options field in product forms.
 */
export function getDefaultSizeOptions(category) {
  const type = getSizeType(category);
  if (type === "none") return "";
  if (type === "men") {
    const lower = (category || "").toLowerCase();
    if (["sherwani","kurta","shirt","jacket"].some(k => lower.includes(k))) {
      return MENS_NUMERIC_SIZES.join(",");
    }
    return MENS_STANDARD_SIZES.join(",");
  }
  if (type === "women") return WOMENS_STANDARD_SIZES.join(",");
  if (type === "western") return WESTERN_STANDARD_SIZES.join(",");
  if (type === "kids") return KIDS_SIZES.join(",");
  return "";
}

/**
 * Parse a size_options string into an array of size labels.
 * e.g. "XS,S,M,L,XL" → ["XS","S","M","L","XL"]
 */
export function parseSizeOptions(sizeOptionsStr) {
  if (!sizeOptionsStr) return [];
  return sizeOptionsStr.split(",").map(s => s.trim()).filter(Boolean);
}
