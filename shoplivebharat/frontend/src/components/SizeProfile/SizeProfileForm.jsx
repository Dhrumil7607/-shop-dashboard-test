import { useState, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { isValidMeasurement, isValidProfileName } from "@/utils/validators";

// ─────────────────────────────────────────────────────────────────────────────
// Field definitions
// ─────────────────────────────────────────────────────────────────────────────

/** All 17 numeric measurement fields */
const NUMERIC_FIELDS = [
  { key: "height",            label: "Height" },
  { key: "weight",            label: "Weight" },
  { key: "bust",              label: "Bust" },
  { key: "waist",             label: "Waist" },
  { key: "hip",               label: "Hip" },
  { key: "shoulder_width",    label: "Shoulder Width" },
  { key: "sleeve_length",     label: "Sleeve Length" },
  { key: "arm_circumference", label: "Arm Circumference" },
  { key: "neck",              label: "Neck" },
  { key: "thigh",             label: "Thigh" },
  { key: "calf",              label: "Calf" },
  { key: "inseam",            label: "Inseam" },
  { key: "kurti_length",      label: "Kurti Length" },
  { key: "blouse_length",     label: "Blouse Length" },
  { key: "lehenga_waist",     label: "Lehenga Waist" },
  { key: "lehenga_length",    label: "Lehenga Length" },
];

/** Free-text preference fields */
const TEXT_FIELDS = [
  { key: "saree_fall_preference",      label: "Saree Fall Preference" },
  { key: "dupatta_length_preference",  label: "Dupatta Length Preference" },
];

/** Unit toggle options */
const UNIT_OPTIONS = [
  { value: "cm",     label: "cm" },
  { value: "inches", label: "in" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared style helpers (mirror Login / Register conventions)
// ─────────────────────────────────────────────────────────────────────────────
const INPUT_BASE =
  "w-full py-3 px-3.5 rounded-xl outline-none text-sm transition-[border-color,box-shadow] duration-200";

const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5";

function inputStyle(hasError) {
  return {
    border: `1.5px solid ${hasError ? "#ef4444" : "#E8E4DF"}`,
    background: "#FAFAF9",
    color: "#2C241B",
  };
}

function onFocusStyle(e) {
  e.target.style.borderColor = "#A2466B";
  e.target.style.boxShadow   = "0 0 0 3px rgba(162,70,107,0.09)";
}

function onBlurStyle(e, hasError) {
  e.target.style.borderColor = hasError ? "#ef4444" : "#E8E4DF";
  e.target.style.boxShadow   = "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline error pill
// ─────────────────────────────────────────────────────────────────────────────
function FieldError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 mt-1 text-xs text-red-600"
          role="alert"
        >
          <AlertCircle size={11} aria-hidden="true" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SizeProfileForm
 *
 * Props:
 *   existingNames   string[]          – profile names already taken by this user
 *   initialValues   Partial<SizeProfile> – pre-fills all fields (edit mode)
 *   onSubmit        (formData) => void  – called with complete form data object
 *   onCancel        () => void
 */
export default function SizeProfileForm({
  existingNames = [],
  initialValues = {},
  onSubmit,
  onCancel,
}) {
  const uid = useId(); // stable prefix for all htmlFor/id pairs

  // ── Form state ──────────────────────────────────────────────────────────────
  const [unit, setUnit]   = useState(initialValues.unit ?? "cm");
  const [values, setValues] = useState(() => {
    const base = {};
    NUMERIC_FIELDS.forEach(({ key }) => {
      base[key] = initialValues[key] !== undefined ? String(initialValues[key]) : "";
    });
    TEXT_FIELDS.forEach(({ key }) => {
      base[key] = initialValues[key] ?? "";
    });
    base.profile_name = initialValues.profile_name ?? "";
    return base;
  });

  // ── Error state ─────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  // ── Validation helpers ───────────────────────────────────────────────────────
  const validateProfileName = useCallback(
    (name) => {
      if (!name.trim()) return "Profile name is required";
      if (name.length > 40) return "Name must be 40 characters or fewer";
      // When editing, exclude current name from duplicate check
      const namesForValidation = initialValues.profile_name
        ? existingNames.filter((n) => n !== initialValues.profile_name)
        : existingNames;
      if (!isValidProfileName(name, namesForValidation))
        return "A profile with this name already exists";
      return "";
    },
    [existingNames, initialValues.profile_name]
  );

  const validateMeasurement = useCallback(
    (value) => {
      if (value === "") return ""; // blank = optional, no error
      if (!isValidMeasurement(value, unit)) {
        const bounds =
          unit === "cm"
            ? "1 – 500 cm"
            : "0.4 – 196.9 in";
        const numeric = parseFloat(value);
        if (!isFinite(numeric)) return "Please enter a numeric value";
        return `Value must be between ${bounds}`;
      }
      return "";
    },
    [unit]
  );

  // ── Field change handlers ────────────────────────────────────────────────────
  const handleChange = useCallback(
    (key, value) => {
      setValues((prev) => ({ ...prev, [key]: value }));

      // Clear / update inline error immediately on change
      setErrors((prev) => {
        const updated = { ...prev };
        if (key === "profile_name") {
          updated[key] = validateProfileName(value);
        } else if (NUMERIC_FIELDS.some((f) => f.key === key)) {
          updated[key] = validateMeasurement(value);
        } else {
          delete updated[key]; // text preference fields have no validation
        }
        return updated;
      });
    },
    [validateProfileName, validateMeasurement]
  );

  // Toggling unit only re-renders labels — stored values stay as-is
  const handleUnitChange = useCallback((newUnit) => {
    setUnit(newUnit);
    // Re-validate all numeric fields under the new unit
    setErrors((prev) => {
      const updated = { ...prev };
      NUMERIC_FIELDS.forEach(({ key }) => {
        const v = values[key];
        if (v !== "") {
          const bounds =
            newUnit === "cm" ? "1 – 500 cm" : "0.4 – 196.9 in";
          if (!isValidMeasurement(v, newUnit)) {
            const numeric = parseFloat(v);
            updated[key] = !isFinite(numeric)
              ? "Please enter a numeric value"
              : `Value must be between ${bounds}`;
          } else {
            delete updated[key];
          }
        }
      });
      return updated;
    });
  }, [values]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      // Validate all fields upfront
      const newErrors = {};
      const nameErr = validateProfileName(values.profile_name);
      if (nameErr) newErrors.profile_name = nameErr;

      NUMERIC_FIELDS.forEach(({ key }) => {
        const err = validateMeasurement(values[key]);
        if (err) newErrors[key] = err;
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Build the form data object
      const formData = { unit, profile_name: values.profile_name };
      NUMERIC_FIELDS.forEach(({ key }) => {
        if (values[key] !== "") {
          formData[key] = parseFloat(values[key]);
        }
      });
      TEXT_FIELDS.forEach(({ key }) => {
        if (values[key].trim() !== "") {
          formData[key] = values[key].trim();
        }
      });

      onSubmit?.(formData);
    },
    [values, unit, validateProfileName, validateMeasurement, onSubmit]
  );

  // ── Has any error → disable submit ──────────────────────────────────────────
  const hasErrors = Object.values(errors).some(Boolean);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="bg-white border rounded-2xl p-6 sm:p-8 w-full max-w-3xl mx-auto"
      style={{
        borderColor: "#E8E4DF",
        boxShadow: "0 4px 24px rgba(44,36,27,0.08)",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="font-serif text-xl sm:text-2xl"
            style={{ color: "#2C241B" }}
          >
            {initialValues.profile_name ? (
              <>
                Edit{" "}
                <span style={{ fontStyle: "italic", color: "#A2466B" }}>
                  Profile
                </span>
              </>
            ) : (
              <>
                New{" "}
                <span style={{ fontStyle: "italic", color: "#A2466B" }}>
                  Profile
                </span>
              </>
            )}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#8B8680" }}>
            All numeric fields are optional; leave blank if unknown.
          </p>
        </div>

        {/* Cancel icon button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel and close form"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors hover:bg-[#F5F1ED]"
            style={{ color: "#8B8680" }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Unit toggle ── */}
        <div className="mb-6">
          <span
            className={`${labelClass}`}
            style={{ color: "#8B8680" }}
            id={`${uid}-unit-label`}
          >
            Measurement Unit
          </span>
          <div
            className="inline-flex rounded-xl overflow-hidden"
            style={{ border: "1.5px solid #E8E4DF" }}
            role="radiogroup"
            aria-labelledby={`${uid}-unit-label`}
          >
            {UNIT_OPTIONS.map(({ value, label }) => {
              const active = unit === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleUnitChange(value)}
                  className="px-5 py-2.5 text-sm font-semibold min-w-[64px] min-h-[44px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84C]"
                  style={{
                    background: active ? "#2C241B" : "transparent",
                    color: active ? "#FFF8F0" : "#8B8680",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Profile name ── */}
        <div className="mb-6">
          <label
            htmlFor={`${uid}-profile_name`}
            className={`${labelClass}`}
            style={{ color: "#8B8680" }}
          >
            Profile Name <span aria-hidden="true" style={{ color: "#A2466B" }}>*</span>
          </label>
          <input
            id={`${uid}-profile_name`}
            type="text"
            value={values.profile_name}
            onChange={(e) => handleChange("profile_name", e.target.value)}
            placeholder="e.g. Wedding, Casual, Office…"
            maxLength={40}
            className={INPUT_BASE}
            style={inputStyle(!!errors.profile_name)}
            onFocus={onFocusStyle}
            onBlur={(e) => onBlurStyle(e, !!errors.profile_name)}
            aria-describedby={errors.profile_name ? `${uid}-profile_name-err` : undefined}
            aria-invalid={!!errors.profile_name}
          />
          <div className="flex items-start justify-between">
            <div id={`${uid}-profile_name-err`}>
              <FieldError message={errors.profile_name} />
            </div>
            <span
              className="text-[10px] mt-1 ml-2 shrink-0"
              style={{ color: values.profile_name.length > 36 ? "#ef4444" : "#8B8680" }}
            >
              {values.profile_name.length}/40
            </span>
          </div>
        </div>

        {/* ── Section heading for measurements ── */}
        <div className="mb-4">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "#C9A84C" }}
          >
            Body Measurements
            <span className="ml-2 font-normal normal-case tracking-normal" style={{ color: "#8B8680" }}>
              ({unit === "cm" ? "centimetres, 1 – 500" : "inches, 0.4 – 196.9"})
            </span>
          </p>
          <div className="mt-1.5 h-px" style={{ background: "#E8E4DF" }} />
        </div>

        {/* ── Numeric fields grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 mb-6">
          {NUMERIC_FIELDS.map(({ key, label }) => {
            const fieldId = `${uid}-${key}`;
            const errId   = `${fieldId}-err`;
            const hasErr  = !!errors[key];
            return (
              <div key={key}>
                <label
                  htmlFor={fieldId}
                  className={`${labelClass}`}
                  style={{ color: "#8B8680" }}
                >
                  {label}
                  <span className="ml-1.5 font-normal normal-case tracking-normal text-[10px]" style={{ color: "#B0A898" }}>
                    ({unit})
                  </span>
                </label>
                <input
                  id={fieldId}
                  type="text"
                  inputMode="decimal"
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={`e.g. ${unit === "cm" ? "60" : "23.6"}`}
                  className={INPUT_BASE}
                  style={inputStyle(hasErr)}
                  onFocus={onFocusStyle}
                  onBlur={(e) => onBlurStyle(e, hasErr)}
                  aria-describedby={hasErr ? errId : undefined}
                  aria-invalid={hasErr}
                />
                <div id={errId}>
                  <FieldError message={errors[key]} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Preference text fields ── */}
        <div className="mb-4">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "#C9A84C" }}
          >
            Style Preferences
          </p>
          <div className="mt-1.5 h-px" style={{ background: "#E8E4DF" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 mb-8">
          {TEXT_FIELDS.map(({ key, label }) => {
            const fieldId = `${uid}-${key}`;
            return (
              <div key={key}>
                <label
                  htmlFor={fieldId}
                  className={`${labelClass}`}
                  style={{ color: "#8B8680" }}
                >
                  {label}
                </label>
                <textarea
                  id={fieldId}
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="Free text — describe your preference…"
                  rows={3}
                  className="w-full px-3.5 py-3 rounded-xl outline-none text-sm resize-none transition-[border-color,box-shadow] duration-200"
                  style={{
                    border: "1.5px solid #E8E4DF",
                    background: "#FAFAF9",
                    color: "#2C241B",
                  }}
                  onFocus={onFocusStyle}
                  onBlur={(e) => onBlurStyle(e, false)}
                />
              </div>
            );
          })}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            type="submit"
            disabled={hasErrors}
            whileHover={hasErrors ? {} : { scale: 1.015 }}
            whileTap={hasErrors ? {} : { scale: 0.975 }}
            className="flex-1 py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2.5 min-h-[48px] transition-opacity duration-200"
            style={{
              background: hasErrors ? "#C4B8B0" : "#A2466B",
              color: "#FFF8F0",
              cursor: hasErrors ? "not-allowed" : "pointer",
            }}
            aria-disabled={hasErrors}
          >
            {initialValues.profile_name ? "Save Changes" : "Create Profile"}
            <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </motion.button>

          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ background: "#F5F1ED" }}
              whileTap={{ scale: 0.975 }}
              className="sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm min-h-[48px]"
              style={{
                border: "1.5px solid #E8E4DF",
                color: "#2C241B",
                background: "transparent",
              }}
            >
              Cancel
            </motion.button>
          )}
        </div>

        {/* Global validation hint when errors are present */}
        <AnimatePresence>
          {hasErrors && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 mt-3 text-xs text-red-600"
              role="alert"
            >
              <AlertCircle size={12} aria-hidden="true" />
              Please fix the highlighted errors before saving.
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
