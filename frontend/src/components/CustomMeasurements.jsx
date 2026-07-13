/**
 * CustomMeasurements.jsx
 * Manual, category-aware measurement entry for women's stitched wear.
 * The customer can order a garment tailored to their exact measurements
 * (chest/bust, waist, hip, sleeve, length, etc.) instead of a standard size.
 *
 * Props:
 *   category   string   product category (decides which fields to show)
 *   onApply    ({ label, measurements }) => void   called when measurements confirmed
 *   onClear    () => void   called when custom measurements are removed
 *   active     bool     whether custom measurements are currently applied
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, ChevronDown, Check, X } from "lucide-react";
import { toast } from "sonner";
import { getMeasurementConfig, getRequiredKeys, formatMeasurementLabel } from "@/lib/customMeasurements";

export default function CustomMeasurements({ category, onApply, onClear, active }) {
  const config = getMeasurementConfig(category);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});

  const setVal = useCallback((key, v) => {
    // Allow only numbers + one decimal point
    if (v !== "" && !/^\d*\.?\d*$/.test(v)) return;
    setValues((prev) => ({ ...prev, [key]: v }));
  }, []);

  // Category doesn't support custom stitching → render nothing.
  if (!config) return null;

  const required = getRequiredKeys();

  const apply = () => {
    const missing = required.filter((k) => !values[k] || String(values[k]).trim() === "");
    if (missing.length) {
      toast.error("Please enter at least your Chest/Bust and Waist.");
      return;
    }
    // Sanity check ranges (inches)
    for (const f of config.fields) {
      const raw = values[f.key];
      if (raw === undefined || String(raw).trim() === "") continue;
      const n = Number(raw);
      const max = f.unit === "cm" ? 250 : 80;
      if (isNaN(n) || n <= 0 || n > max) {
        toast.error(`Please enter a valid ${f.label.toLowerCase()} value.`);
        return;
      }
    }
    const cleaned = {};
    config.fields.forEach((f) => {
      if (values[f.key] !== undefined && String(values[f.key]).trim() !== "") {
        cleaned[f.key] = `${values[f.key]}${f.unit}`;
      }
    });
    const label = formatMeasurementLabel(config, values);
    onApply?.({ label, measurements: cleaned });
    toast.success("Custom measurements applied");
  };

  const clear = () => {
    setValues({});
    onClear?.();
  };

  return (
    <div className="mb-5">
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ borderColor: active ? "#A2466B" : "#E8E4DF", background: active ? "rgba(162,70,107,0.04)" : "white" }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-3 px-5 py-4"
        >
          <div className="flex items-center gap-3 text-left">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #C9A84C, #A2466B)" }}>
              <Ruler size={17} className="text-white" />
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>
                {config.title} — Made to Your Measurements
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: active ? "#A2466B" : "#9B8B7A" }}>
                {active ? "Custom measurements applied ✓" : "Prefer a perfect fit? Enter your measurements instead of a size."}
              </p>
            </div>
          </div>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} style={{ color: "#A2466B" }} />
          </motion.span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t" style={{ borderColor: "#E8E4DF" }}>
                <p className="text-xs mt-3 mb-3" style={{ color: "#6B5E52" }}>{config.note}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {config.fields.map((f) => (
                    <div key={f.key} className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium" style={{ color: "#6B5E52" }}>
                        {f.label} ({f.unit})
                        {["chest", "waist"].includes(f.key) && <span style={{ color: "#A2466B" }}> *</span>}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values[f.key] ?? ""}
                        onChange={(e) => setVal(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 min-h-[42px]"
                        style={{ borderColor: "#E8E4DF" }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={apply}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition min-h-[44px]"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #A2466B)" }}
                  >
                    <Check size={14} /> Use These Measurements
                  </button>
                  {active && (
                    <button
                      type="button"
                      onClick={clear}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition min-h-[44px]"
                      style={{ borderColor: "#E8E4DF", color: "#C0392B" }}
                    >
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>

                <p className="text-[10px] mt-3" style={{ color: "#9B8B7A" }}>
                  Tip: measure over well-fitting garments. Our tailor may contact you to confirm before stitching.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
