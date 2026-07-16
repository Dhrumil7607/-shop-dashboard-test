/**
 * CustomerTryOn.jsx — customer-facing AI Try-On
 * The customer uploads (or captures) a photo of themselves and the AI dresses
 * them in this product. The photo is processed only and never stored.
 *
 * Rendered like the other modals here: the parent mounts it only while open
 * and it returns a plain fixed overlay.
 *
 * Props: onClose(), product
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, UploadCloud, Camera, Download, RotateCcw, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { customerTryOn } from "@/lib/api";

const MAROON = "#8B3A3A";
const GOLD = "#C8A146";
const INK = "#1a1a1a";
const BORDER = "#ECE8E1";
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const LOADING_MSGS = [
  "Analysing your photo…",
  "Studying the garment’s fabric & colours…",
  "Tailoring the perfect fit…",
  "Draping the outfit on you…",
  "Rendering your look…",
];

export default function CustomerTryOn({ onClose, product }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const inputRef = useRef(null);

  // Rotate the status messages while the AI works.
  useEffect(() => {
    if (!loading) { setMsgIdx(0); return undefined; }
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MSGS.length), 2200);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = () => inputRef.current?.click();

  const onFile = (f) => {
    if (!f) return;
    if (!ACCEPT.includes(f.type)) { toast.error("Upload a JPEG, PNG or WebP photo."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Photo must be under 10MB."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const generate = useCallback(async () => {
    if (!file) { toast.error("Add a photo of yourself first."); return; }
    setLoading(true); setResult(null);
    try {
      const d = await customerTryOn(product.id, file);
      setResult(d);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Try-on failed. Use a clear, full-body photo.");
    } finally { setLoading(false); }
  }, [file, product]);

  const download = () => {
    if (!result?.image) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${result.image}`;
    a.download = `shoplivebharat-tryon.png`;
    a.click();
  };

  const glass = {
    background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)", border: `1px solid ${BORDER}`,
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="tryon-title"
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4"
      style={{ background: "rgba(20,18,16,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative w-full sm:max-w-[560px] max-h-[94vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl"
        style={{ background: "linear-gradient(180deg,#FDFBF7,#F6F1E9)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: "rgba(253,251,247,0.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${GOLD}, ${MAROON})` }}>
              <Sparkles size={16} className="text-white" />
            </span>
            <div>
              <h2 id="tryon-title" className="font-serif text-lg leading-none" style={{ color: INK }}>AI Try-On</h2>
              <p className="mt-1 text-[11px]" style={{ color: "#9B8B7A" }}>See this piece on you</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border transition hover:bg-black/5" style={{ borderColor: BORDER }}>
            <X size={15} style={{ color: "#6B5E52" }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ── Animated processing state ── */}
          {loading && (
            <div className="py-3">
              <div className="relative mx-auto overflow-hidden rounded-2xl" style={{ aspectRatio: "3/4", maxWidth: 260, background: "#EDE7DE" }}>
                <img src={preview || product?.image_url} alt="Generating" className="h-full w-full object-cover"
                  onError={(e) => { e.target.style.opacity = 0.3; }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(rgba(20,18,16,0.35), rgba(20,18,16,0.12))" }} />
                {/* moving scan shimmer */}
                <motion.div className="absolute inset-x-0 h-20"
                  style={{ background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.55), transparent)" }}
                  initial={{ y: "-25%" }} animate={{ y: "125%" }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
                {/* pulsing ring */}
                <motion.div className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: "inset 0 0 0 2px rgba(201,168,76,0.5)" }}
                  animate={{ opacity: [0.35, 0.85, 0.35] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles size={12} className="text-white" />
                  </motion.span>
                  <span className="text-[10px] font-medium text-white">ShopLive AI</span>
                </div>
              </div>

              <div className="mt-4 h-6 overflow-hidden text-center">
                <AnimatePresence mode="wait">
                  <motion.p key={msgIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }} className="text-sm font-semibold" style={{ color: INK }}>
                    {LOADING_MSGS[msgIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="mt-3 mx-auto h-1.5 w-56 overflow-hidden rounded-full" style={{ background: "#EEE7DB" }}>
                <motion.div className="h-full w-1/3 rounded-full" style={{ background: `linear-gradient(90deg, ${GOLD}, ${MAROON})` }}
                  animate={{ x: ["-110%", "320%"] }} transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }} />
              </div>
              <p className="mt-3 text-center text-[11px]" style={{ color: "#9B8B7A" }}>This usually takes 15–30 seconds…</p>
            </div>
          )}

          {!result && !loading && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl overflow-hidden" style={{ ...glass, aspectRatio: "3/4" }}>
                  {preview ? (
                    <img src={preview} alt="Your photo" className="h-full w-full object-cover" />
                  ) : (
                    <button type="button" onClick={pick} className="flex h-full w-full flex-col items-center justify-center gap-2">
                      <UploadCloud size={26} style={{ color: GOLD }} />
                      <span className="text-xs font-semibold" style={{ color: "#5B5147" }}>Your photo</span>
                    </button>
                  )}
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#EDE7DE", aspectRatio: "3/4" }}>
                  <img src={product?.image_url} alt={product?.name} className="h-full w-full object-cover"
                    onError={(e) => { e.target.style.opacity = 0.3; }} />
                </div>
              </div>

              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])} />

              <div className="flex gap-2">
                <button type="button" onClick={pick}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold transition hover:bg-black/5"
                  style={{ borderColor: BORDER, color: "#3C3027" }}>
                  <Camera size={14} /> {preview ? "Change photo" : "Upload / take a photo"}
                </button>
              </div>

              <ul className="space-y-1.5 rounded-2xl p-3 text-[11px]" style={{ ...glass, color: "#5B5147" }}>
                <li>• Use a clear, well-lit, full-body photo facing the camera.</li>
                <li>• Plain background works best; avoid baggy clothing.</li>
              </ul>

              <button type="button" onClick={generate} disabled={!file || loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${MAROON}, #6E2D2D)` }}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Creating your look…</> : <><Sparkles size={15} /> Try it on me</>}
              </button>
            </>
          )}

          {result?.image && (
            <>
              <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
                <img src={`data:image/png;base64,${result.image}`} alt="AI try-on result" className="w-full" />
              </div>
              {result.ai_optimized && (
                <p className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: "#8A6D1B" }}>
                  <Sparkles size={12} /> Enhanced with this product’s AI-optimized data
                </p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={download}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white" style={{ background: MAROON }}>
                  <Download size={15} /> Save image
                </button>
                <button type="button" onClick={() => { setResult(null); }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 text-xs font-semibold" style={{ borderColor: BORDER, color: INK }}>
                  <RotateCcw size={13} /> Try again
                </button>
              </div>
            </>
          )}

          <p className="flex items-center justify-center gap-1.5 text-[10px]" style={{ color: "#9B8B7A" }}>
            <ShieldCheck size={11} /> Your photo is processed only for this preview and is never stored.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
