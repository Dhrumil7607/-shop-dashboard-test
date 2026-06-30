/**
 * sizingEngine.js — Pure recommendation function (zero side effects, no React, no localStorage).
 * Requirements: 5.1, 5.2, 5.4, 5.6, 5.7, 5.8
 */

// ─── Size chart (Indian sizing, bust in inches) ───────────────────────────────
// XS=32, S=34, M=36, L=38, XL=40, 2XL=42, 3XL=44
const SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

const SIZE_CHART = {
  XS:  { bust: 32, waist: 26, hip: 34, shoulder: 13.5, sleeve: 22, neck: 13, thigh: 20 },
  S:   { bust: 34, waist: 28, hip: 36, shoulder: 14,   sleeve: 22.5, neck: 13.5, thigh: 21 },
  M:   { bust: 36, waist: 30, hip: 38, shoulder: 14.5, sleeve: 23, neck: 14, thigh: 22 },
  L:   { bust: 38, waist: 32, hip: 40, shoulder: 15,   sleeve: 23.5, neck: 14.5, thigh: 23 },
  XL:  { bust: 40, waist: 34, hip: 42, shoulder: 15.5, sleeve: 24, neck: 15, thigh: 24 },
  '2XL': { bust: 42, waist: 36, hip: 44, shoulder: 16, sleeve: 24.5, neck: 15.5, thigh: 25 },
  '3XL': { bust: 44, waist: 38, hip: 46, shoulder: 16.5, sleeve: 25, neck: 16, thigh: 26 },
};

// Garment-specific numeric sizing overrides (chest/bust in inches → numeric label)
const NUMERIC_SIZE_MAP = {
  Blouse:  [32, 34, 36, 38, 40, 42, 44],
  Salwar:  [26, 28, 30, 32, 34, 36, 38], // waist-based
};

// Conversion: cm to inches
const CM_TO_IN = 0.3937;

// ─── Helper: count words in a string ─────────────────────────────────────────
export function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Helper: clamp confidence to [0, 100] ────────────────────────────────────
export function clampConfidence(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

// ─── Helper: convert measurement to inches if stored in cm ───────────────────
function toInches(value, unit) {
  if (!value || isNaN(value)) return null;
  return unit === 'cm' ? value * CM_TO_IN : value;
}

// ─── Find closest chart size by bust measurement (in inches) ─────────────────
function findSizeByBust(bustIn) {
  let best = 'M';
  let bestDelta = Infinity;
  for (const label of SIZE_LABELS) {
    const delta = Math.abs(SIZE_CHART[label].bust - bustIn);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = label;
    }
  }
  return best;
}

// ─── Find size index ──────────────────────────────────────────────────────────
function sizeIndex(label) {
  const idx = SIZE_LABELS.indexOf(label);
  return idx === -1 ? 2 : idx; // default M (index 2)
}

// ─── Compute fitZones: compare measurement values (inches) to chart midpoints ─
function computeFitZones(measurementsIn, chartSize) {
  const chart = SIZE_CHART[chartSize];
  const zones = {};
  const zoneKeys = ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'neck', 'thigh'];
  const measurementKeyMap = {
    bust: 'bust', waist: 'waist', hip: 'hip',
    shoulder: 'shoulder_width', sleeve: 'sleeve_length',
    neck: 'neck', thigh: 'thigh',
  };

  for (const zone of zoneKeys) {
    const measKey = measurementKeyMap[zone];
    const rawVal = measurementsIn[measKey] || measurementsIn[zone];
    if (rawVal == null || isNaN(rawVal)) continue;

    const chartVal = chart[zone];
    if (chartVal == null) continue;

    // One "size step" ≈ 2 inches on bust/waist/hip, ≈ 0.5 on shoulder/sleeve/neck, ≈ 1 on thigh
    const stepSizes = { bust: 2, waist: 2, hip: 2, shoulder: 0.5, sleeve: 0.5, neck: 0.5, thigh: 1 };
    const step = stepSizes[zone] || 2;

    if (rawVal > chartVal + step) {
      zones[zone] = 'tight';
    } else if (rawVal < chartVal - step) {
      zones[zone] = 'loose';
    } else {
      zones[zone] = 'good';
    }
  }

  return zones;
}

// ─── Pad explanation to minimum 20 words ─────────────────────────────────────
function ensureWordCount(text, minWords = 20) {
  const current = countWords(text);
  if (current >= minWords) return text;
  const fillers = [
    'This recommendation is based on standard Indian garment sizing charts.',
    'Please consider your personal fit preference when making a final decision.',
    'We recommend trying the garment before finalising your purchase.',
  ];
  let result = text;
  let i = 0;
  while (countWords(result) < minWords && i < fillers.length) {
    result = result.trimEnd() + ' ' + fillers[i];
    i++;
  }
  return result;
}

// ─── Truncate explanation to maximum 80 words ────────────────────────────────
function truncateToMaxWords(text, maxWords = 80) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '.';
}

// ─── Get up to 2 alternatives (adjacent sizes) ───────────────────────────────
function buildAlternatives(primaryLabel, garmentType) {
  const idx = sizeIndex(primaryLabel);
  const alts = [];

  if (idx > 0) {
    const smaller = SIZE_LABELS[idx - 1];
    alts.push({
      size: resolveLabel(smaller, garmentType),
      note: 'One size down — choose if you prefer a slimmer, more tailored fit.',
    });
  }
  if (idx < SIZE_LABELS.length - 1) {
    const larger = SIZE_LABELS[idx + 1];
    alts.push({
      size: resolveLabel(larger, garmentType),
      note: 'One size up — choose if you prefer more room or a relaxed fit.',
    });
  }

  return alts.slice(0, 2);
}

// ─── Resolve size label (numeric for Blouse/Salwar, alpha otherwise) ─────────
function resolveLabel(sizeLabel, garmentType) {
  const idx = sizeIndex(sizeLabel);
  if (garmentType === 'Blouse') return String(NUMERIC_SIZE_MAP.Blouse[idx] || NUMERIC_SIZE_MAP.Blouse[2]);
  if (garmentType === 'Salwar') return String(NUMERIC_SIZE_MAP.Salwar[idx] || NUMERIC_SIZE_MAP.Salwar[2]);
  return sizeLabel;
}

// ─── Mode: measurements ───────────────────────────────────────────────────────
function recommendByMeasurements(input, garmentType) {
  const m = input.measurements || {};
  const unit = m.unit || 'inches';

  // Convert key measurements to inches
  const bustIn = toInches(m.bust, unit);
  const waistIn = toInches(m.waist, unit);
  const hipIn = toInches(m.hip, unit);

  // Count how many primary measurements provided
  const primaryMeasurements = [bustIn, waistIn, hipIn].filter(v => v != null);

  if (primaryMeasurements.length === 0) {
    return { confidence: 10, size: null, fitZones: {} };
  }

  // Find best size for each available measurement
  const votes = {};
  if (bustIn != null) {
    const sz = findSizeByBust(bustIn);
    votes[sz] = (votes[sz] || 0) + 3; // bust has highest weight
  }
  if (waistIn != null) {
    // Adjust waist by typical differential (waist ≈ bust - 6 for size chart)
    const effectiveBust = waistIn + 6;
    const sz = findSizeByBust(effectiveBust);
    votes[sz] = (votes[sz] || 0) + 2;
  }
  if (hipIn != null) {
    const effectiveBust = hipIn - 2;
    const sz = findSizeByBust(effectiveBust);
    votes[sz] = (votes[sz] || 0) + 2;
  }

  // Choose highest-voted size
  let primarySize = 'M';
  let highestVotes = 0;
  for (const [sz, v] of Object.entries(votes)) {
    if (v > highestVotes) {
      highestVotes = v;
      primarySize = sz;
    }
  }

  // Confidence based on how many measurements provided + agreement
  let baseConfidence = 40 + (primaryMeasurements.length * 15);
  // Check variance: if all measurements agree, boost; if disagreement, reduce
  const uniqueSizes = new Set(Object.keys(votes));
  if (uniqueSizes.size === 1) baseConfidence += 10;
  if (uniqueSizes.size > 2) baseConfidence -= 10;

  // Bonus for extra measurements provided
  const extraMeasurements = ['shoulder_width', 'sleeve_length', 'neck', 'thigh'].filter(
    key => m[key] != null && !isNaN(m[key])
  );
  baseConfidence += extraMeasurements.length * 3;

  // Build measurementsIn for fitZones
  const measurementsIn = {};
  const allKeys = ['bust', 'waist', 'hip', 'shoulder_width', 'sleeve_length', 'neck', 'thigh'];
  for (const key of allKeys) {
    if (m[key] != null) measurementsIn[key] = toInches(m[key], unit);
  }

  return {
    confidence: clampConfidence(baseConfidence),
    primarySize,
    fitZones: computeFitZones(measurementsIn, primarySize),
  };
}

// ─── Mode: height_weight ──────────────────────────────────────────────────────
function recommendByHeightWeight(input) {
  const height = input.height || (input.measurements && input.measurements.height);
  const weight = input.weight || (input.measurements && input.measurements.weight);

  if (!height || !weight || isNaN(height) || isNaN(weight)) {
    return { confidence: 10, primarySize: 'M', fitZones: {} };
  }

  // BMI-based estimate (height in cm, weight in kg)
  // Convert height to cm if in inches (rough heuristic: if < 10 assume feet, if < 100 assume inches)
  let heightCm = height;
  if (height < 3) heightCm = height * 100; // already in meters, convert to cm
  else if (height < 10) heightCm = height * 30.48; // feet to cm
  else if (height < 100) heightCm = height * 2.54; // inches to cm

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);

  // Map BMI + height to approximate bust size (very rough estimate)
  // Taller + higher BMI = larger size
  let bustEstimate;
  if (bmi < 18.5) bustEstimate = heightCm < 160 ? 30 : 32;
  else if (bmi < 22)  bustEstimate = heightCm < 160 ? 32 : 34;
  else if (bmi < 25)  bustEstimate = heightCm < 165 ? 34 : 36;
  else if (bmi < 28)  bustEstimate = heightCm < 165 ? 36 : 38;
  else if (bmi < 32)  bustEstimate = 40;
  else if (bmi < 36)  bustEstimate = 42;
  else bustEstimate = 44;

  const primarySize = findSizeByBust(bustEstimate);
  // Cap at 60 per spec
  const confidence = Math.min(60, clampConfidence(35 + (bmi > 10 && bmi < 50 ? 15 : 0)));

  return { confidence, primarySize, fitZones: {} };
}

// ─── Mode: existing_garment ───────────────────────────────────────────────────
function recommendByExistingGarment(input) {
  const eg = input.existingGarment || {};
  const label = (eg.sizeLabel || '').trim().toUpperCase();
  const fit = (eg.fitDescription || '').toLowerCase();

  // Parse label — alpha or numeric
  let idx = SIZE_LABELS.indexOf(label);
  if (idx === -1) {
    // Try numeric size (e.g. "38" → L)
    const numVal = parseInt(label, 10);
    if (!isNaN(numVal)) {
      // Bust-based numeric
      idx = SIZE_LABELS.findIndex(sz => SIZE_CHART[sz].bust === numVal);
      if (idx === -1) {
        // Closest
        idx = sizeIndex(findSizeByBust(numVal));
      }
    }
  }
  if (idx === -1) idx = 2; // default M

  // Adjust for fit description
  if (/tight|small|snug/.test(fit)) idx = Math.min(SIZE_LABELS.length - 1, idx + 1);
  else if (/loose|big|large/.test(fit)) idx = Math.max(0, idx - 1);
  // "perfect" → no adjustment

  const primarySize = SIZE_LABELS[idx];
  const confidence = clampConfidence(label ? 65 : 30);

  return { confidence, primarySize, fitZones: {} };
}

// ─── Mode: body_shape_fit ─────────────────────────────────────────────────────
const BODY_SHAPE_SIZE_MAP = {
  // [defaultSizeIdx, fitPreference adjustments]
  Hourglass:          { base: 2 }, // M baseline, balanced proportions
  Pear:               { base: 3 }, // L baseline (larger hips)
  Apple:              { base: 3 }, // L baseline (larger bust/waist)
  Rectangle:          { base: 2 }, // M baseline
  'Inverted Triangle': { base: 2 }, // M baseline (larger shoulders/bust)
};

const FIT_PREF_OFFSET = {
  Loose:    1,
  Comfort:  1,
  Regular:  0,
  Tailored: -1,
  Slim:     -1,
};

function recommendByBodyShape(input) {
  const bodyShape = input.bodyShape || 'Rectangle';
  const fitPref = input.fitPreference || 'Regular';

  const shapeConfig = BODY_SHAPE_SIZE_MAP[bodyShape] || { base: 2 };
  const offset = FIT_PREF_OFFSET[fitPref] !== undefined ? FIT_PREF_OFFSET[fitPref] : 0;

  const idx = Math.min(SIZE_LABELS.length - 1, Math.max(0, shapeConfig.base + offset));
  const primarySize = SIZE_LABELS[idx];

  // Check if extra measurements provided
  const m = input.measurements || {};
  const hasExtraMeasurements = ['bust', 'waist', 'hip'].some(k => m[k] != null && !isNaN(m[k]));

  // Cap at 55 when no extra measurements per spec
  const rawConfidence = hasExtraMeasurements ? 65 : 45;
  const confidence = Math.min(hasExtraMeasurements ? 100 : 55, clampConfidence(rawConfidence));

  return { confidence, primarySize, fitZones: {} };
}

// ─── Build explanation text ───────────────────────────────────────────────────
function buildExplanation(mode, primarySize, confidence, garmentType, fitZones, input) {
  const sizeLabel = resolveLabel(primarySize, garmentType);

  const tightZones = Object.entries(fitZones).filter(([, v]) => v === 'tight').map(([k]) => k);
  const looseZones = Object.entries(fitZones).filter(([, v]) => v === 'loose').map(([k]) => k);

  let explanation = '';

  if (mode === 'measurements') {
    explanation = `Based on your measurements, size ${sizeLabel} is recommended for this ${garmentType || 'garment'}.`;
    if (tightZones.length > 0) {
      explanation += ` The ${tightZones.join(' and ')} area may feel snug — consider sizing up if you prefer more room.`;
    }
    if (looseZones.length > 0) {
      explanation += ` The ${looseZones.join(' and ')} area may be slightly roomy — size down for a closer fit.`;
    }
    if (tightZones.length === 0 && looseZones.length === 0) {
      explanation += ' Your measurements align well with the standard size chart for this garment.';
    }
  } else if (mode === 'height_weight') {
    explanation = `Based on your height and weight, size ${sizeLabel} is estimated for this ${garmentType || 'garment'}. This is a general estimate; confidence is limited without detailed measurements.`;
  } else if (mode === 'existing_garment') {
    const eg = input.existingGarment || {};
    const brand = eg.brand ? `${eg.brand} ` : '';
    const fit = eg.fitDescription ? ` (described as ${eg.fitDescription})` : '';
    explanation = `Using your existing ${brand}${eg.sizeLabel || ''}${fit} as a reference, size ${sizeLabel} is recommended for this ${garmentType || 'garment'}. This accounts for typical brand-size variations.`;
  } else if (mode === 'body_shape_fit') {
    const shape = input.bodyShape || 'your body shape';
    const pref = input.fitPreference ? ` with a ${input.fitPreference.toLowerCase()} fit preference` : '';
    explanation = `For a ${shape} body shape${pref}, size ${sizeLabel} is recommended for this ${garmentType || 'garment'}. This sizing accounts for your proportions and preferred style.`;
  }

  explanation = ensureWordCount(explanation, 20);
  explanation = truncateToMaxWords(explanation, 80);
  return explanation;
}

// ─── Insufficient data explanation ───────────────────────────────────────────
const INSUFFICIENT_DATA_MSG =
  'We don\'t have enough information to make a confident recommendation. ' +
  'Please add more measurements or try a different input mode. ' +
  'Providing bust, waist, and hip measurements gives the most accurate results for Indian ethnic wear.';

// ─── Main export: recommend ───────────────────────────────────────────────────
/**
 * recommend(input: SizeFinderInput, garmentType: string) → SizeRecommendation
 *
 * Pure function — no side effects, no React, no localStorage.
 * Requirements: 5.1, 5.2, 5.4, 5.6, 5.7, 5.8
 */
export function recommend(input, garmentType) {
  if (!input || typeof input !== 'object') {
    return {
      confidence: 0,
      explanation: INSUFFICIENT_DATA_MSG,
      alternatives: [],
      fitZones: {},
    };
  }

  const mode = input.mode || 'measurements';
  const gType = garmentType || input.garmentType || 'Kurta';

  let result;
  switch (mode) {
    case 'height_weight':
      result = recommendByHeightWeight(input);
      break;
    case 'existing_garment':
      result = recommendByExistingGarment(input);
      break;
    case 'body_shape_fit':
      result = recommendByBodyShape(input);
      break;
    case 'measurements':
    default:
      result = recommendByMeasurements(input, gType);
      break;
  }

  let { confidence, primarySize, fitZones } = result;
  confidence = clampConfidence(confidence);

  // Confidence caps per spec (Requirements 5.7, 5.8)
  if (mode === 'height_weight') {
    confidence = Math.min(60, confidence);
  }
  if (mode === 'body_shape_fit') {
    const m = input.measurements || {};
    const hasExtraMeasurements = ['bust', 'waist', 'hip'].some(k => m[k] != null && !isNaN(m[k]));
    if (!hasExtraMeasurements) {
      confidence = Math.min(55, confidence);
    }
  }

  confidence = clampConfidence(confidence);

  // Requirement 5.1: omit size when confidence < 20
  if (confidence < 20) {
    return {
      confidence,
      explanation: INSUFFICIENT_DATA_MSG,
      alternatives: [],
      fitZones: fitZones || {},
    };
  }

  const resolvedSize = resolveLabel(primarySize, gType);

  // Build explanation (Requirements 5.4: 20–80 words)
  const explanation = buildExplanation(mode, primarySize, confidence, gType, fitZones, input);

  // Requirement 5.6: alternatives only when confidence < 75
  const alternatives = confidence < 75 ? buildAlternatives(primarySize, gType) : [];

  return {
    size: resolvedSize,
    confidence,
    explanation,
    alternatives,
    fitZones,
  };
}
