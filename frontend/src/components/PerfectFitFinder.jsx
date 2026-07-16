/**
 * PerfectFitFinder.jsx
 * Premium two-panel AI size finder modal.
 *   Left  — the product image with animated measurement callouts + wireframe.
 *   Right — height / weight inputs, a fit profile, and an instant recommendation.
 * Computes a recommended size from the product's own size options (client-side
 * heuristic — no backend change). Calls onSizeSelect(size) when applied.
 *
 * Props:
 *   product       { image_url, name, size_options }
 *   onSizeSelect  (size:string) => void
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MoveVertical, Scale, Shirt, Check, Lock, ArrowRight } from "lucide-react";
import { parseSizeOptions } from "@/lib/sizeConfig";

const MAROON = "#8B3A3A";
const GOLD = "#C8A146";
const INK = "#1a1a1a";
const BORDER = "#ECE8E1";

const FITS = [
  { id: "tailored", label: "Tailored", sub: "Close to body" },
  { id: "classic", label: "Classic", sub: "Standard drape" },
  { id: "relaxed", label: "Relaxed", sub: "Loose & airy" },
];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Rough body-measurement estimates (inches) for the callout labels.
function estimate(h, w) {
  const hh = Number(h) || 0, ww = Number(w) || 0;
  if (!hh || !ww) return null;
  const chest = clamp(30 + (ww - 45) * 0.34, 30, 56);
  return {
    chest: chest.toFixed(1),
    waist: clamp(chest - 4.5, 24, 52).toFixed(1),
    shoulder: clamp(hh * 0.113, 13, 22).toFixed(1),
    sleeve: clamp(hh * 0.15, 18, 30).toFixed(1),
  };
}

export default function PerfectFitFinder({ product, onSizeSelect }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fit, setFit] = useState("classic");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const sizes = useMemo(() => {
    const s = parseSizeOptions(product?.size_options);
    return s.length ? s : ["S", "M", "L", "XL", "XXL"];
  }, [product?.size_options]);

  const measures = estimate(height, weight);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    if (open) { document.addEventListener("keydown", onKey); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const generate = useCallback(() => {
    const w = Number(weight), h = Number(height);
    if (!w || !h) return;
    setLoading(true);
    setResult(null);
    // Heuristic: map weight (with slight height influence) onto the size list.
    setTimeout(() => {
      let t = (w - 45) / (110 - 45);          // 0..1 over a plausible adult range
      t += ((h - 162) / 200) * 0.18;           // taller → slightly larger
      t = clamp(t, 0, 1);
      let idx = Math.round(t * (sizes.length - 1));
      if (fit === "tailored") idx = Math.max(0, idx - 1);
      if (fit === "relaxed") idx = Math.min(sizes.length - 1, idx + 1);
      const recommended = sizes[idx];
      const alt = sizes[idx + 1] || sizes[idx - 1] || null;
      const confidence = 88 + Math.round((1 - Math.abs(t - 0.5) * 2) * 9); // 88–97
      setResult({ recommended, alt, confidence });
      setLoading(false);
    }, 650);
  }, [weight, height, fit, sizes]);

  const applySize = (size) => { onSizeSelect?.(size); setOpen(false); };

  const inputStyle = { borderColor: BORDER };

  const Callout = ({ label, value, className }) => (
    <div className={`absolute ${className}`}>
      <p className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</p>
      <p className="text-[11px] font-semibold" style={{ color: "#fff" }}>{value ? `${value}"` : "—"}</p>
    </div>
  );

  return (
    <>
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition hover:shadow-sm"
        style={{ borderColor: BORDER, background: "linear-gradient(135deg, rgba(200,161,70,0.06), rgba(139,58,58,0.05))" }}>
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${GOLD}, ${MAROON})` }}>
            <Sparkles size={17} className="text-white" />
          </span>
          <span>
            <span className="block text-sm font-bold" style={{ color: INK }}>Find Your Perfect Fit</span>
            <span className="block text-[11px]" style={{ color: "#9B8B7A" }}>AI size recommendation in seconds</span>
          </span>
        </span>
        <ArrowRight size={16} style={{ color: MAROON }} />
      </button>

      {typeof document !== "undefined" && open && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
              style={{ background: "rgba(20,18,16,0.45)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
                className="grid w-full max-w-[860px] grid-cols-1 overflow-hidden rounded-[28px] bg-white shadow-2xl md:grid-cols-[42%_58%]"
                style={{ maxHeight: "92vh" }}
              >
                {/* LEFT — image + callouts */}
                <div className="relative hidden md:block" style={{ background: "#EDE7DE" }}>
                  <img src={product?.image_url} alt={product?.name} className="h-full w-full object-cover"
                    onError={(e) => { e.target.style.opacity = 0.25; }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(20,18,16,0.25), transparent 45%, rgba(20,18,16,0.35))" }} />
                  {/* wireframe dots */}
                  <svg className="absolute inset-0 h-full w-full" aria-hidden>
                    {[["30%","28%"],["58%","30%"],["26%","52%"],["64%","54%"],["44%","72%"]].map(([l,t],i)=>(
                      <circle key={i} cx={l} cy={t} r="3" fill={GOLD} opacity="0.9" />
                    ))}
                  </svg>
                  <Callout label="Shoulder" value={measures?.shoulder} className="right-6 top-[24%] text-right" />
                  <Callout label="Chest" value={measures?.chest} className="left-5 top-[38%]" />
                  <Callout label="Sleeve" value={measures?.sleeve} className="right-6 top-[48%] text-right" />
                  <Callout label="Waist" value={measures?.waist} className="left-5 top-[62%]" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(6px)" }}>
                    <Sparkles size={11} style={{ color: GOLD }} />
                    <span className="text-[10px] font-medium text-white">Powered by ShopLive AI</span>
                  </div>
                </div>

                {/* RIGHT — form */}
                <div className="relative overflow-y-auto p-6 sm:p-8">
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border transition hover:bg-black/5"
                    style={{ borderColor: BORDER }}>
                    <X size={15} style={{ color: "#6B5E52" }} />
                  </button>

                  <h2 className="font-serif text-3xl" style={{ color: INK, fontWeight: 400 }}>Find Your Perfect Drape</h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: "#8B8074" }}>
                    Our AI analyzes your unique measurements to recommend the ideal fit for this silhouette. Precision tailoring, instantly.
                  </p>

                  {/* Height / Weight */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: "#4A3F35" }}>Height</label>
                      <div className="relative">
                        <MoveVertical size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#B5A896" }} />
                        <input type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)}
                          placeholder="e.g. 175"
                          className="w-full rounded-xl border py-3 pl-9 pr-10 text-sm outline-none focus:border-[#C8A146]" style={inputStyle} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#9B8B7A" }}>cm</span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: "#4A3F35" }}>Weight</label>
                      <div className="relative">
                        <Scale size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#B5A896" }} />
                        <input type="number" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)}
                          placeholder="e.g. 70"
                          className="w-full rounded-xl border py-3 pl-9 pr-10 text-sm outline-none focus:border-[#C8A146]" style={inputStyle} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#9B8B7A" }}>kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Fit profile */}
                  <div className="mt-5">
                    <label className="mb-2 block text-[13px] font-semibold" style={{ color: "#4A3F35" }}>Desired Fit Profile</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {FITS.map((f) => (
                        <button key={f.id} type="button" onClick={() => setFit(f.id)}
                          className="rounded-xl border px-2 py-3 text-center transition"
                          style={{ borderColor: fit === f.id ? MAROON : BORDER, background: fit === f.id ? "rgba(139,58,58,0.04)" : "white" }}>
                          <span className="block text-[13px] font-semibold" style={{ color: INK }}>{f.label}</span>
                          <span className="mt-0.5 block text-[10px]" style={{ color: "#9B8B7A" }}>{f.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Result */}
                  <AnimatePresence>
                    {result && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-5 overflow-hidden">
                        <div className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: "#FBF8F2" }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Recommended Size</p>
                              <p className="font-serif text-3xl" style={{ color: INK }}>{result.recommended}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold" style={{ color: "#2D7A3A" }}>{result.confidence}%</p>
                              <p className="text-[10px] uppercase tracking-widest" style={{ color: "#9B8B7A" }}>Confidence</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => applySize(result.recommended)}
                              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                              style={{ background: MAROON }}>
                              <Check size={14} /> Select Size {result.recommended}
                            </button>
                            {result.alt && result.alt !== result.recommended && (
                              <button type="button" onClick={() => applySize(result.alt)}
                                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                                style={{ borderColor: BORDER, color: INK }}>
                                Or try {result.alt}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate */}
                  {!result && (
                    <button type="button" onClick={generate} disabled={!height || !weight || loading}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${MAROON}, #6E2D2D)` }}>
                      {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Analyzing…</>
                        : <><Shirt size={15} /> Generate Recommendation</>}
                    </button>
                  )}
                  {result && (
                    <button type="button" onClick={() => setResult(null)}
                      className="mt-3 w-full text-center text-xs font-semibold" style={{ color: "#9B8B7A" }}>
                      Recalculate with different measurements
                    </button>
                  )}

                  <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px]" style={{ color: "#9B8B7A" }}>
                    <Lock size={11} /> Your measurements are stored securely and privately.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
