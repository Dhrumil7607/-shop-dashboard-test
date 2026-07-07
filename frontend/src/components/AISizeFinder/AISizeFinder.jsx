/**
 * AISizeFinder.jsx — Main AI Size Finder component
 *
 * Four input modes (tabs), a persistent garment-type selector, profile
 * pre-fill for logged-in users, and a rich results panel with
 * ConfidenceRing, BodySilhouette, alternatives, and add-to-cart.
 *
 * Requirements: 4.1–4.8, 5.1–5.9, 13.5, 15.1
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recommend } from "@/lib/sizingEngine";
import ConfidenceRing from "@/components/AISizeFinder/ConfidenceRing";
import BodySilhouette from "@/components/AISizeFinder/BodySilhouette";
import sizeProfileService from "@/services/sizeProfileService";
import { useAuth } from "@/contexts/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "measurements",    label: "Enter Measurements" },
  { id: "height_weight",   label: "Height & Weight Only" },
  { id: "existing_garment", label: "From Existing Garment" },
  { id: "body_shape_fit",  label: "Body Shape & Fit" },
];

const GARMENT_TYPES = ["Saree", "Lehenga", "Kurta", "Blouse", "Salwar"];

const MEASUREMENT_FIELDS = [
  { key: "height",           label: "Height" },
  { key: "weight",           label: "Weight" },
  { key: "bust",             label: "Bust" },
  { key: "waist",            label: "Waist" },
  { key: "hip",              label: "Hip" },
  { key: "shoulder_width",   label: "Shoulder Width" },
  { key: "sleeve_length",    label: "Sleeve Length" },
  { key: "arm_circumference", label: "Arm Circumference" },
  { key: "neck",             label: "Neck" },
  { key: "thigh",            label: "Thigh" },
  { key: "calf",             label: "Calf" },
  { key: "inseam",           label: "Inseam" },
  { key: "kurti_length",     label: "Kurti Length" },
  { key: "blouse_length",    label: "Blouse Length" },
  { key: "lehenga_waist",    label: "Lehenga Waist" },
  { key: "lehenga_length",   label: "Lehenga Length" },
];

const BODY_SHAPES = [
  { value: "Hourglass",          emoji: "⌛", desc: "Equal bust & hip, defined waist" },
  { value: "Pear",               emoji: "🍐", desc: "Hips wider than bust" },
  { value: "Apple",              emoji: "🍎", desc: "Broader shoulders & bust" },
  { value: "Rectangle",          emoji: "▭",  desc: "Similar bust, waist & hip" },
  { value: "Inverted Triangle",  emoji: "🔺", desc: "Broad shoulders, narrow hips" },
];

const FIT_PREFERENCES = ["Loose", "Regular", "Tailored", "Slim", "Comfort"];


// ─── Small helpers ─────────────────────────────────────────────────────────────

function emptyMeasurements() {
  return MEASUREMENT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});
}

function emptyExistingGarment() {
  return { type: "", brand: "", sizeLabel: "", fitDescription: "" };
}

function emptyBodyShape() {
  return { bodyShape: "", fitPreference: "" };
}

// Inline error message component
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <AnimatePresence>
      <motion.p
        key={msg}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="text-red-500 text-xs mt-1"
        role="alert"
      >
        {msg}
      </motion.p>
    </AnimatePresence>
  );
}

// Reusable number input
function NumberInput({ label, value, onChange, error, placeholder = "" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        min="0"
        step="any"
        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px] ${
          error ? "border-red-400 bg-red-50" : "border-stone-300 bg-white"
        }`}
      />
      <FieldError msg={error} />
    </div>
  );
}


// ─── Tab: Enter Measurements ──────────────────────────────────────────────────

function MeasurementsTab({ values, onChange, errors }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {MEASUREMENT_FIELDS.map((f) => (
        <NumberInput
          key={f.key}
          label={f.label}
          value={values[f.key] ?? ""}
          onChange={(v) => onChange(f.key, v)}
          error={errors[f.key]}
        />
      ))}
    </div>
  );
}

// ─── Tab: Height & Weight Only ────────────────────────────────────────────────

function HeightWeightTab({ height, weight, onChangeHeight, onChangeWeight, errors }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span className="mt-0.5 text-base" aria-hidden="true">⚠️</span>
        <span>Lower confidence estimate — providing full measurements gives more accurate results.</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Height (cm)" value={height} onChange={onChangeHeight} error={errors.height} placeholder="e.g. 162" />
        <NumberInput label="Weight (kg)" value={weight} onChange={onChangeWeight} error={errors.weight} placeholder="e.g. 58" />
      </div>
    </div>
  );
}

// ─── Tab: From Existing Garment ───────────────────────────────────────────────

function ExistingGarmentTab({ values, onChange, errors }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Garment Type */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">Garment Type</label>
        <select
          value={values.type}
          onChange={(e) => onChange("type", e.target.value)}
          className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px] ${
            errors.type ? "border-red-400 bg-red-50" : "border-stone-300 bg-white"
          }`}
        >
          <option value="">Select garment type</option>
          {GARMENT_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <FieldError msg={errors.type} />
      </div>
      {/* Brand */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">Brand</label>
        <input
          type="text"
          value={values.brand}
          onChange={(e) => onChange("brand", e.target.value)}
          placeholder="e.g. Biba, Fabindia"
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px] bg-white"
        />
      </div>
      {/* Size Label */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">Size Label</label>
        <input
          type="text"
          value={values.sizeLabel}
          onChange={(e) => onChange("sizeLabel", e.target.value)}
          placeholder="e.g. M, L, 38"
          className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px] ${
            errors.sizeLabel ? "border-red-400 bg-red-50" : "border-stone-300 bg-white"
          }`}
        />
        <FieldError msg={errors.sizeLabel} />
      </div>
      {/* Fit Description */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">Fit Description</label>
        <input
          type="text"
          value={values.fitDescription}
          onChange={(e) => onChange("fitDescription", e.target.value)}
          placeholder="e.g. slightly tight, loose, perfect"
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px] bg-white"
        />
      </div>
    </div>
  );
}


// ─── Tab: Body Shape & Fit ────────────────────────────────────────────────────

function BodyShapeFitTab({ bodyShape, fitPreference, onBodyShape, onFitPreference, errors }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Body Shape selector */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">Body Shape</p>
        <div className="flex flex-wrap gap-3">
          {BODY_SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onBodyShape(s.value)}
              aria-pressed={bodyShape === s.value}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 text-sm transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                bodyShape === s.value
                  ? "border-amber-500 bg-amber-50 text-amber-800 font-semibold shadow-sm"
                  : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"
              }`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">{s.emoji}</span>
              <span>{s.value}</span>
              <span className="text-xs text-stone-400 font-normal text-center max-w-[100px]">{s.desc}</span>
            </button>
          ))}
        </div>
        <FieldError msg={errors.bodyShape} />
      </div>

      {/* Fit Preference selector */}
      <div>
        <p className="text-sm font-medium text-stone-700 mb-3">Fit Preference</p>
        <div className="flex flex-wrap gap-2">
          {FIT_PREFERENCES.map((fp) => (
            <button
              key={fp}
              type="button"
              onClick={() => onFitPreference(fp)}
              aria-pressed={fitPreference === fp}
              className={`px-4 py-2 rounded-full border text-sm transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                fitPreference === fp
                  ? "border-amber-500 bg-amber-500 text-white font-semibold shadow-sm"
                  : "border-stone-300 bg-white text-stone-700 hover:border-amber-400"
              }`}
            >
              {fp}
            </button>
          ))}
        </div>
        <FieldError msg={errors.fitPreference} />
      </div>
    </div>
  );
}


// ─── Results Panel ────────────────────────────────────────────────────────────

function ResultsPanel({ result, onAddToCart, productName }) {
  const { size, confidence, explanation, alternatives, fitZones } = result;

  const isInsufficient = confidence < 20;
  const showAlternatives = !isInsufficient && confidence < 75 && alternatives && alternatives.length > 0;
  const canAddToCart = !isInsufficient && size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-6 border border-stone-200 rounded-2xl p-5 bg-stone-50 flex flex-col gap-5"
      aria-live="polite"
    >
      <h3 className="text-base font-semibold text-stone-800">
        Recommendation{productName ? ` for ${productName}` : ""}
      </h3>

      {isInsufficient ? (
        /* Insufficient data state */
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="text-base mt-0.5" aria-hidden="true">ℹ️</span>
          <p>{explanation}</p>
        </div>
      ) : (
        <>
          {/* Size + ConfidenceRing row */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <ConfidenceRing value={confidence} duration={800} size={120} />
              <span className="text-xs text-stone-500 text-center">Confidence</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-stone-600 text-sm">Recommended size</p>
              <p className="text-4xl font-bold text-stone-900 leading-none">{size}</p>
              <p className="text-sm text-stone-600 leading-relaxed mt-1">{explanation}</p>
            </div>
          </div>

          {/* Body Silhouette */}
          {fitZones && Object.keys(fitZones).length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-stone-700 self-start">Fit Zone Preview</p>
              <div className="w-full max-w-[200px]">
                <BodySilhouette zones={fitZones} />
              </div>
            </div>
          )}

          {/* Alternatives */}
          {showAlternatives && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-stone-700">Alternative Sizes</p>
              <div className="flex flex-col gap-2">
                {alternatives.slice(0, 2).map((alt) => (
                  <div
                    key={alt.size}
                    className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm"
                  >
                    <span className="font-bold text-stone-800 min-w-[28px]">{alt.size}</span>
                    <span className="text-stone-600">{alt.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart button */}
          {canAddToCart && onAddToCart && (
            <button
              type="button"
              onClick={() => onAddToCart(size)}
              className="mt-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold px-6 py-3 text-sm transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              Add size {size} to cart
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}


// ─── Validation helpers ───────────────────────────────────────────────────────

function validateMeasurements(values) {
  // Measurements tab — all fields optional but at least one must be present
  const errors = {};
  let hasAny = false;
  for (const f of MEASUREMENT_FIELDS) {
    const v = values[f.key];
    if (v === "" || v === undefined || v === null) continue;
    hasAny = true;
    const num = parseFloat(v);
    if (isNaN(num)) {
      errors[f.key] = "Please enter a valid number";
    }
  }
  if (!hasAny) {
    // Mark the first field as required to guide the user
    errors["height"] = "Enter at least one measurement to get a recommendation";
  }
  return errors;
}

function validateHeightWeight(height, weight) {
  const errors = {};
  if (!height || height === "") errors.height = "Height is required";
  else if (isNaN(parseFloat(height))) errors.height = "Please enter a valid number";

  if (!weight || weight === "") errors.weight = "Weight is required";
  else if (isNaN(parseFloat(weight))) errors.weight = "Please enter a valid number";
  return errors;
}

function validateExistingGarment(values) {
  const errors = {};
  if (!values.sizeLabel || values.sizeLabel.trim() === "") {
    errors.sizeLabel = "Size label is required";
  }
  return errors;
}

function validateBodyShapeFit(bodyShape, fitPreference) {
  const errors = {};
  if (!bodyShape) errors.bodyShape = "Please select a body shape";
  if (!fitPreference) errors.fitPreference = "Please select a fit preference";
  return errors;
}


// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * AISizeFinder
 *
 * @param {Object}   props
 * @param {Function} props.onAddToCart  — called with the recommended size string
 * @param {string}   props.productName  — displayed in the results header
 */
export default function AISizeFinder({ onAddToCart, productName }) {
  const { user, isLoggedIn } = useAuth();

  // ── Garment type (always visible above tabs) ─────────────────────────────
  const [garmentType, setGarmentType] = useState("Kurta");

  // ── Active tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("measurements");

  // ── Tab-specific form state ───────────────────────────────────────────────
  const [measurements, setMeasurements] = useState(emptyMeasurements());
  const [heightVal, setHeightVal] = useState("");
  const [weightVal, setWeightVal] = useState("");
  const [existingGarment, setExistingGarment] = useState(emptyExistingGarment());
  const [bodyShape, setBodyShape] = useState("");
  const [fitPreference, setFitPreference] = useState("");

  // ── Field-level errors ────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  // ── Saved profiles (for "Use my saved profile" button) ───────────────────
  const [savedProfiles, setSavedProfiles] = useState([]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      const profiles = sizeProfileService.list(user.id);
      setSavedProfiles(profiles);
    } else {
      setSavedProfiles([]);
    }
  }, [isLoggedIn, user?.id]);

  const defaultProfile = savedProfiles.find((p) => p.is_default) || savedProfiles[0] || null;
  const hasSavedProfiles = savedProfiles.length > 0;

  // ── Pre-fill from saved profile ───────────────────────────────────────────
  const handleUseSavedProfile = useCallback(() => {
    if (!defaultProfile) return;
    const prefilled = { ...emptyMeasurements() };
    for (const f of MEASUREMENT_FIELDS) {
      if (defaultProfile[f.key] !== undefined && defaultProfile[f.key] !== null) {
        prefilled[f.key] = String(defaultProfile[f.key]);
      }
    }
    if (defaultProfile.height) setHeightVal(String(defaultProfile.height));
    if (defaultProfile.weight) setWeightVal(String(defaultProfile.weight));
    setMeasurements(prefilled);
    setActiveTab("measurements");
    setErrors({});
  }, [defaultProfile]);

  // ── Loading + results ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);


  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setResult(null);

      // Build input + run validation
      let newErrors = {};
      let input = { mode: activeTab, garmentType };

      if (activeTab === "measurements") {
        newErrors = validateMeasurements(measurements);
        if (Object.keys(newErrors).length === 0) {
          // Convert non-empty string values to numbers
          const m = {};
          for (const f of MEASUREMENT_FIELDS) {
            const v = measurements[f.key];
            if (v !== "" && v !== undefined && v !== null) {
              const num = parseFloat(v);
              if (!isNaN(num)) m[f.key] = num;
            }
          }
          input.measurements = m;
        }
      } else if (activeTab === "height_weight") {
        newErrors = validateHeightWeight(heightVal, weightVal);
        if (Object.keys(newErrors).length === 0) {
          input.height = parseFloat(heightVal);
          input.weight = parseFloat(weightVal);
        }
      } else if (activeTab === "existing_garment") {
        newErrors = validateExistingGarment(existingGarment);
        if (Object.keys(newErrors).length === 0) {
          input.existingGarment = { ...existingGarment };
        }
      } else if (activeTab === "body_shape_fit") {
        newErrors = validateBodyShapeFit(bodyShape, fitPreference);
        if (Object.keys(newErrors).length === 0) {
          input.bodyShape = bodyShape;
          input.fitPreference = fitPreference;
        }
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) return;

      // Brief loading state for UX feel
      setLoading(true);
      await new Promise((r) => setTimeout(r, 400));

      try {
        const recommendation = recommend(input, garmentType);
        setResult(recommendation);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, garmentType, measurements, heightVal, weightVal, existingGarment, bodyShape, fitPreference]
  );

  // ── Tab change clears errors + results ────────────────────────────────────
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setErrors({});
    setResult(null);
  }, []);

  // ── Update handlers ───────────────────────────────────────────────────────
  const handleMeasurementChange = useCallback((key, value) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  const handleExistingGarmentChange = useCallback((key, value) => {
    setExistingGarment((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }, []);


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto font-sans">
      <form onSubmit={handleSubmit} noValidate>

        {/* ── Garment type selector (always visible) ── */}
        <div className="flex flex-col gap-1 mb-5">
          <label htmlFor="ai-garment-type" className="text-sm font-semibold text-stone-700">
            Garment Type
          </label>
          <select
            id="ai-garment-type"
            value={garmentType}
            onChange={(e) => { setGarmentType(e.target.value); setResult(null); }}
            className="border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px] w-full sm:w-56"
          >
            {GARMENT_TYPES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* ── "Use my saved profile" button ── */}
        <AnimatePresence>
          {isLoggedIn && hasSavedProfiles && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <button
                type="button"
                onClick={handleUseSavedProfile}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium px-4 py-2 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <span aria-hidden="true">📋</span>
                Use my saved profile
                {defaultProfile?.profile_name && (
                  <span className="text-amber-600 font-normal">({defaultProfile.profile_name})</span>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tab row — horizontally scrollable on < 640px ── */}
        <div
          className="overflow-x-auto whitespace-nowrap flex gap-2 mb-5 pb-1 -mx-1 px-1"
          role="tablist"
          aria-label="Input mode"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tab-panel-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                activeTab === tab.id
                  ? "bg-amber-500 text-white shadow-sm"
                  : "border border-stone-300 bg-white text-stone-700 hover:border-amber-400 hover:text-amber-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div
          id={`tab-panel-${activeTab}`}
          role="tabpanel"
          aria-label={TABS.find((t) => t.id === activeTab)?.label}
          className="min-h-[180px]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "measurements" && (
                <MeasurementsTab
                  values={measurements}
                  onChange={handleMeasurementChange}
                  errors={errors}
                />
              )}
              {activeTab === "height_weight" && (
                <HeightWeightTab
                  height={heightVal}
                  weight={weightVal}
                  onChangeHeight={(v) => { setHeightVal(v); setErrors((p) => { const n = {...p}; delete n.height; return n; }); }}
                  onChangeWeight={(v) => { setWeightVal(v); setErrors((p) => { const n = {...p}; delete n.weight; return n; }); }}
                  errors={errors}
                />
              )}
              {activeTab === "existing_garment" && (
                <ExistingGarmentTab
                  values={existingGarment}
                  onChange={handleExistingGarmentChange}
                  errors={errors}
                />
              )}
              {activeTab === "body_shape_fit" && (
                <BodyShapeFitTab
                  bodyShape={bodyShape}
                  fitPreference={fitPreference}
                  onBodyShape={(v) => { setBodyShape(v); setErrors((p) => { const n = {...p}; delete n.bodyShape; return n; }); }}
                  onFitPreference={(v) => { setFitPreference(v); setErrors((p) => { const n = {...p}; delete n.fitPreference; return n; }); }}
                  errors={errors}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Submit button ── */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stone-800 hover:bg-stone-900 active:bg-black disabled:opacity-60 text-white font-semibold px-8 py-3 text-sm transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                  className="inline-block text-base"
                  aria-hidden="true"
                >
                  ⏳
                </motion.span>
                Finding your size…
              </>
            ) : (
              "Find My Size"
            )}
          </button>
        </div>
      </form>

      {/* ── Results ── */}
      <AnimatePresence>
        {result && (
          <ResultsPanel
            result={result}
            onAddToCart={onAddToCart}
            productName={productName}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
