/**
 * customMeasurements.js
 * Category-aware custom stitching measurements for WOMEN'S wear only.
 * Returns the right measurement fields per garment type (a lehenga needs skirt
 * length + blouse measurements; a kurti needs top length; a saree needs blouse
 * stitching, etc.). Returns null for categories that don't need custom sizing
 * (dupatta/shawl, jewellery, accessories, and all men's/kids categories).
 */
import { getCategoryGender } from "@/lib/categoryUtils";

// Reusable field definitions (all in inches unless noted).
const F = {
  chest:        { key: "chest",        label: "Chest / Bust",     unit: "in", placeholder: "36" },
  waist:        { key: "waist",        label: "Waist",            unit: "in", placeholder: "30" },
  hip:          { key: "hip",          label: "Hip",              unit: "in", placeholder: "38" },
  shoulder:     { key: "shoulder",     label: "Shoulder",         unit: "in", placeholder: "14.5" },
  sleeve:       { key: "sleeve",       label: "Sleeve Length",    unit: "in", placeholder: "18" },
  armhole:      { key: "armhole",      label: "Armhole",          unit: "in", placeholder: "16" },
  blouseLength: { key: "blouseLength", label: "Blouse Length",    unit: "in", placeholder: "15" },
  topLength:    { key: "topLength",    label: "Top / Kurti Length", unit: "in", placeholder: "42" },
  bottomWaist:  { key: "bottomWaist",  label: "Bottom Waist",     unit: "in", placeholder: "30" },
  bottomLength: { key: "bottomLength", label: "Bottom Length",    unit: "in", placeholder: "38" },
  lehengaWaist: { key: "lehengaWaist", label: "Lehenga Waist",    unit: "in", placeholder: "28" },
  lehengaLength:{ key: "lehengaLength",label: "Lehenga Length",   unit: "in", placeholder: "40" },
  dressLength:  { key: "dressLength",  label: "Full Length",      unit: "in", placeholder: "52" },
  height:       { key: "height",       label: "Height",           unit: "cm", placeholder: "162", optional: true },
};

// Fields the customer MUST fill (others are recommended/optional).
const REQUIRED = ["chest", "waist"];

/**
 * Returns { title, note, fields[] } for a women's stitched garment, or null.
 * @param {string} category
 */
export function getMeasurementConfig(category) {
  if (!category) return null;
  if (getCategoryGender(category) !== "women") return null;

  const lower = category.toLowerCase();

  // Free-size / no-stitch women's items → no custom measurements.
  if (lower.includes("dupatta") || lower.includes("shawl")) return null;

  // Saree (blouse stitching) / standalone blouse
  if (lower.includes("saree") || lower.includes("blouse")) {
    return {
      title: "Custom Blouse Stitching",
      note: "Your saree blouse will be tailored to these measurements.",
      fields: [F.chest, F.waist, F.blouseLength, F.shoulder, F.sleeve, F.armhole],
    };
  }

  // Lehenga / Chaniya Choli (blouse + skirt)
  if (lower.includes("lehenga") || lower.includes("chaniya") || lower.includes("choli")) {
    return {
      title: "Custom Lehenga Stitching",
      note: "Blouse and skirt will be tailored to these measurements.",
      fields: [F.chest, F.waist, F.blouseLength, F.sleeve, F.shoulder, F.lehengaWaist, F.hip, F.lehengaLength],
    };
  }

  // Salwar Suit / Suit (top + bottom)
  if (lower.includes("salwar") || lower.includes("suit")) {
    return {
      title: "Custom Suit Stitching",
      note: "Top and bottom will be tailored to these measurements.",
      fields: [F.chest, F.waist, F.hip, F.shoulder, F.sleeve, F.topLength, F.bottomWaist, F.bottomLength],
    };
  }

  // Anarkali
  if (lower.includes("anarkali")) {
    return {
      title: "Custom Anarkali Stitching",
      note: "Your Anarkali will be tailored to these measurements.",
      fields: [F.chest, F.waist, F.shoulder, F.sleeve, F.dressLength],
    };
  }

  // Kurti / Kurtis
  if (lower.includes("kurti") || lower.includes("kurta")) {
    return {
      title: "Custom Kurti Stitching",
      note: "Your kurti will be tailored to these measurements.",
      fields: [F.chest, F.waist, F.hip, F.shoulder, F.sleeve, F.topLength],
    };
  }

  // Gown / Dress
  if (lower.includes("gown") || lower.includes("dress")) {
    return {
      title: "Custom Gown Stitching",
      note: "Your gown will be tailored to these measurements.",
      fields: [F.chest, F.waist, F.hip, F.shoulder, F.sleeve, F.dressLength],
    };
  }

  // Bridal / Wedding / Festival wear — comprehensive set
  if (lower.includes("bridal") || lower.includes("wedding") || lower.includes("festival")) {
    return {
      title: "Custom Outfit Stitching",
      note: "This outfit will be tailored to your exact measurements.",
      fields: [F.chest, F.waist, F.hip, F.shoulder, F.sleeve, F.blouseLength, F.lehengaWaist, F.lehengaLength],
    };
  }

  // Any other women's stitched category — sensible default
  return {
    title: "Custom Stitching",
    note: "This outfit will be tailored to your measurements.",
    fields: [F.chest, F.waist, F.hip, F.shoulder, F.sleeve, F.topLength],
  };
}

export function getRequiredKeys() {
  return [...REQUIRED];
}

/**
 * Build a human-readable label from filled measurements, e.g.
 * "Custom stitch — Chest 36", Waist 30", Length 42" (in)".
 */
export function formatMeasurementLabel(config, values) {
  const parts = config.fields
    .filter((f) => values[f.key] !== undefined && String(values[f.key]).trim() !== "")
    .map((f) => `${f.label} ${values[f.key]}${f.unit}`);
  return `Custom stitch — ${parts.join(", ")}`;
}
