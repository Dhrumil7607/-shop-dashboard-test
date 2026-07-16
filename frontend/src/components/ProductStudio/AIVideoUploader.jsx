/**
 * AIVideoUploader.jsx
 * Optional private 360° garment video for AI Try-On training.
 * The video is NEVER shown to customers — it is processed only by our AI.
 * Seller-only. Requires a saved product (productId).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Info, Trash2, RefreshCw, UploadCloud, CheckCircle2, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { uploadAiVideo, getAiVideo, deleteAiVideo } from "@/lib/api";

const GOLD = "#C9A84C";
const MAROON = "#8B3A3A";
const BORDER = "#E8E4DF";
const MUTED = "#9B8B7A";

const ACCEPT = ["video/mp4", "video/quicktime", "video/x-quicktime", "video/mov"];
const MAX_MB = 200;

const STATUS_META = {
  queued: { label: "Queued", color: "#9B8B7A", bg: "rgba(155,139,122,0.12)" },
  processing: { label: "Processing…", color: "#8A6D1B", bg: "rgba(201,168,76,0.16)" },
  ready: { label: "AI Optimized", color: "#2D7A3A", bg: "rgba(45,122,58,0.12)" },
  failed: { label: "Failed", color: "#C0392B", bg: "rgba(192,57,43,0.1)" },
};

export default function AIVideoUploader({ productId }) {
  const [rec, setRec] = useState(null);       // { exists, status, optimized, preview_url, ... }
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    if (!productId) { setLoading(false); return; }
    const d = await getAiVideo(productId);
    setRec(d?.exists ? d : null);
    setLoading(false);
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  // Poll while processing so the badge updates itself.
  useEffect(() => {
    const s = rec?.status;
    if (s === "queued" || s === "processing") {
      pollRef.current = setInterval(load, 4000);
      return () => clearInterval(pollRef.current);
    }
    if (pollRef.current) clearInterval(pollRef.current);
    return undefined;
  }, [rec?.status, load]);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) { toast.error("Only MP4 or MOV videos are accepted."); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`Video must be under ${MAX_MB}MB.`); return; }
    setUploading(true); setProgress(0);
    try {
      const d = await uploadAiVideo(productId, file, setProgress);
      setRec(d);
      toast.success("Video uploaded — AI is analysing it now.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false); setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    try { await deleteAiVideo(productId); setRec(null); toast.success("AI video removed."); }
    catch { toast.error("Could not delete the video."); }
  };

  if (!productId) {
    return (
      <div className="flex items-center gap-2 rounded-xl p-3" style={{ backgroundColor: "#F0EBE3" }}>
        <Info size={14} style={{ color: MUTED }} />
        <p className="text-xs" style={{ color: MUTED }}>Save the product first, then add an optional AI Try-On video.</p>
      </div>
    );
  }

  const meta = rec?.status ? STATUS_META[rec.status] : null;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
      <div className="flex items-start justify-between gap-3 p-4" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(139,58,58,0.05))" }}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${GOLD}, ${MAROON})` }}>
            <Video size={16} className="text-white" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>AI Try-On Data</p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(155,139,122,0.15)", color: MUTED }}>Optional</span>
              <button type="button" onClick={() => setShowTip((v) => !v)} aria-label="More info" className="ml-0.5">
                <Info size={13} style={{ color: MUTED }} />
              </button>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Upload a slow 360° video of the garment to improve AI Try-On accuracy. Processed only by our AI — never shown publicly.
            </p>
          </div>
        </div>
        {meta && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: meta.bg, color: meta.color }}>
            {rec.status === "processing" ? <Loader2 size={10} className="animate-spin" /> : rec.status === "ready" ? <CheckCircle2 size={10} /> : null}
            {meta.label}
          </span>
        )}
      </div>

      <AnimatePresence>
        {showTip && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }} className="overflow-hidden">
            <ul className="space-y-1 px-4 py-3 text-[11px] border-t" style={{ borderColor: BORDER, color: "#5B5147" }}>
              <li>• Private AI processing only — customers never see it.</li>
              <li>• Improves fabric, embroidery, texture, drape, sleeve & neckline understanding.</li>
              <li>• Hang the garment or use a mannequin; record a slow 360° (front, back, sides, top, bottom).</li>
              <li>• Good lighting, steady hands. MP4/MOV, 30–60s, up to {MAX_MB}MB.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 border-t" style={{ borderColor: BORDER }}>
        <input ref={inputRef} type="file" accept=".mp4,.mov,video/mp4,video/quicktime" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])} />

        {uploading ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: "#5B5147" }}>Uploading…</span>
              <span className="text-xs font-bold" style={{ color: MAROON }}>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "#Eee7db" }}>
              <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${GOLD}, ${MAROON})` }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.2 }} />
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
            <Loader2 size={13} className="animate-spin" /> Loading…
          </div>
        ) : rec?.exists ? (
          <div className="space-y-3">
            {rec.preview_url && (
              <video src={rec.preview_url} controls className="w-full rounded-xl" style={{ maxHeight: 220, background: "#000" }} />
            )}
            {rec.status === "failed" && rec.error && (
              <p className="flex items-center gap-1.5 text-[11px]" style={{ color: "#C0392B" }}>
                <AlertTriangle size={12} /> {rec.error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={pickFile}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition hover:bg-black/5"
                style={{ borderColor: BORDER, color: "#3C3027" }}>
                <RefreshCw size={13} /> Replace
              </button>
              <button type="button" onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition hover:bg-black/5"
                style={{ borderColor: BORDER, color: "#C0392B" }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={pickFile}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-8 transition hover:border-[#C9A84C]"
            style={{ borderColor: BORDER, background: "#FAFAF8" }}>
            <UploadCloud size={26} style={{ color: GOLD }} />
            <span className="text-sm font-semibold" style={{ color: "#5B5147" }}>Upload 360° garment video</span>
            <span className="text-[11px]" style={{ color: MUTED }}>MP4 or MOV · 30–60s · up to {MAX_MB}MB</span>
          </button>
        )}

        <p className="mt-3 flex items-center gap-1.5 text-[10px]" style={{ color: MUTED }}>
          <ShieldCheck size={11} /> Private &amp; encrypted. Never shown on the product page or downloadable by customers.
        </p>
      </div>
    </div>
  );
}
