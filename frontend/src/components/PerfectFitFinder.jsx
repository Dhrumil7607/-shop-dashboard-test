/**
 * PerfectFitFinder.jsx — Smart Size Recommendation
 *
 * Premium, mobile-first flow:
 *   1. Intro + privacy consent
 *   2. Height + weight (cm/ft, kg/lbs)
 *   3. Guided 360° body scan (camera → sampled frames)
 *   4. AI analysis (Gemini vision anchored on height/weight, server-side)
 *   5. Recommended size + confidence + expected fit + alternative
 *
 * Rendered like the working modals here: the parent mounts it only while open
 * and it returns a plain fixed overlay (no portal / no AnimatePresence gating).
 *
 * Props: onClose(), product, sizes[], onSizeSelect(size)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X, Sparkles, Camera, Ruler, Check, ShieldCheck, RotateCcw,
  ArrowRight, Trash2, Loader2, MoveVertical, Scale,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeBodyScan, recommendSize, getBodyProfile, deleteBodyProfile } from "@/lib/api";

const MAROON = "#8B3A3A";
const GOLD = "#C8A146";
const INK = "#1a1a1a";
const BORDER = "#ECE8E1";

const SCAN_STEPS = [
  "Face the camera", "Slowly turn to your left", "Turn to show your back",
  "Turn to your right", "Face forward again", "Hold still…",
];
const FRAME_COUNT = 6;
const FRAME_INTERVAL = 1300;

const CONF_COLOR = { High: "#2D7A3A", Medium: "#C8A146", Low: "#9B8B7A" };

function ftToCm(ft, inch) { return (Number(ft) || 0) * 30.48 + (Number(inch) || 0) * 2.54; }
function lbsToKg(lbs) { return (Number(lbs) || 0) * 0.453592; }

export default function PerfectFitFinder({ onClose, product, sizes = [], onSizeSelect }) {
  const { isLoggedIn } = useAuth();

  const [step, setStep] = useState("intro"); // intro | measure | scan | analyzing | result
  const [hUnit, setHUnit] = useState("cm");   // cm | ft
  const [wUnit, setWUnit] = useState("kg");   // kg | lbs
  const [cm, setCm] = useState("");
  const [ft, setFt] = useState("");
  const [inch, setInch] = useState("");
  const [wt, setWt] = useState("");
  const [gender, setGender] = useState(guessGender(product?.category));
  const [consent, setConsent] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanIdx, setScanIdx] = useState(0);
  const [scanMsg, setScanMsg] = useState("");
  const [result, setResult] = useState(null);       // recommendation
  const [measurements, setMeasurements] = useState(null);
  const [savedProfile, setSavedProfile] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const framesRef = useRef([]);

  const stopStream = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  // Escape + scroll lock + cleanup camera
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { stopStream(); onClose?.(); } };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      stopStream();
    };
  }, [onClose, stopStream]);

  // Detect an existing saved profile (logged-in users)
  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    getBodyProfile().then((d) => { if (alive && d?.exists) setSavedProfile(d.profile); }).catch(() => {});
    return () => { alive = false; };
  }, [isLoggedIn]);

  const heightCm = hUnit === "ft" ? ftToCm(ft, inch) : Number(cm);
  const weightKg = wUnit === "lbs" ? lbsToKg(wt) : Number(wt);
  const hwValid = heightCm >= 120 && heightCm <= 220 && weightKg >= 25 && weightKg <= 250;

  const runRecommend = useCallback(async (meas) => {
    try {
      const rec = await recommendSize({
        product_id: product?.id, category: product?.category,
        measurements: meas, size_chart: product?.size_chart || undefined,
      });
      setResult(rec);
      setStep("result");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Couldn't compute a recommendation.");
      setStep("measure");
    }
  }, [product]);

  const runAnalyze = useCallback(async (frameBlobs) => {
    setStep("analyzing");
    const fd = new FormData();
    fd.append("height", String(Math.round(heightCm)));
    fd.append("weight", String(Math.round(weightKg)));
    fd.append("height_unit", "cm");
    fd.append("weight_unit", "kg");
    fd.append("gender", gender);
    fd.append("consent_save", String(!!(consent && isLoggedIn)));
    (frameBlobs || []).forEach((b, i) => fd.append("frames", b, `frame_${i}.jpg`));
    try {
      const data = await analyzeBodyScan(fd);
      if (data.ok === false && data.retry) {
        toast.error(data.reason || "Please rescan.");
        setScanMsg(data.reason || "");
        setStep("scan");
        return;
      }
      setMeasurements(data.measurements);
      await runRecommend(data.measurements);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Scan analysis failed. Try again.");
      setStep("scan");
    }
  }, [heightCm, weightKg, gender, consent, isLoggedIn, runRecommend]);

  const captureFrame = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return;
    const w = 480, h = Math.round((v.videoHeight / v.videoWidth) * w) || 640;
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(v, 0, 0, w, h);
    c.toBlob((blob) => { if (blob) framesRef.current.push(blob); }, "image/jpeg", 0.82);
  }, []);

  const startScan = useCallback(async () => {
    setScanMsg("");
    framesRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setScanning(true);
      setScanIdx(0);
      let n = 0;
      timerRef.current = setInterval(() => {
        captureFrame();
        n += 1;
        setScanIdx(n);
        if (n >= FRAME_COUNT) {
          stopStream();
          runAnalyze(framesRef.current);
        }
      }, FRAME_INTERVAL);
    } catch (err) {
      toast.error("Camera unavailable. You can continue with height & weight instead.");
      setScanMsg("Camera access was blocked. Use “Skip scan” to continue with height & weight.");
    }
  }, [captureFrame, stopStream, runAnalyze]);

  const useSavedProfile = useCallback(async () => {
    if (!savedProfile?.measurements) return;
    setMeasurements(savedProfile.measurements);
    setStep("analyzing");
    await runRecommend(savedProfile.measurements);
  }, [savedProfile, runRecommend]);

  const handleDeleteProfile = useCallback(async () => {
    try { await deleteBodyProfile(); setSavedProfile(null); toast.success("Your body profile was deleted."); }
    catch { toast.error("Could not delete profile."); }
  }, []);

  const applySize = (size) => { onSizeSelect?.(size); onClose?.(); };

  const glass = {
    background: "rgba(255,255,255,0.72)", backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)", border: `1px solid ${BORDER}`,
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="pf-title"
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4"
      style={{ background: "rgba(20,18,16,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) { stopStream(); onClose?.(); } }}
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
            <span className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${MAROON})` }}>
              <Sparkles size={16} className="text-white" />
            </span>
            <div>
              <h2 id="pf-title" className="font-serif text-lg leading-none" style={{ color: INK }}>Find My Perfect Size</h2>
              <p className="mt-1 text-[11px]" style={{ color: "#9B8B7A" }}>AI sizing in under 30 seconds</p>
            </div>
          </div>
          <button type="button" onClick={() => { stopStream(); onClose?.(); }} aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border transition hover:bg-black/5"
            style={{ borderColor: BORDER }}>
            <X size={15} style={{ color: "#6B5E52" }} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ── INTRO ── */}
          {step === "intro" && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: "#5B5147" }}>
                Enter your height and weight, then record a quick guided 360° scan. Our AI estimates your
                measurements and matches them to this product’s size chart — you never type measurements yourself.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[[MoveVertical, "Height & weight"], [Camera, "360° scan"], [Ruler, "Perfect size"]].map(([Icon, label], i) => (
                  <div key={i} className="rounded-2xl p-3 text-center" style={glass}>
                    <Icon size={18} className="mx-auto mb-1.5" style={{ color: MAROON }} />
                    <p className="text-[11px] font-medium" style={{ color: "#5B5147" }}>{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-2xl p-3 text-[11px]" style={{ background: "rgba(45,122,58,0.06)", color: "#3B6B45" }}>
                <ShieldCheck size={15} className="mt-0.5 flex-shrink-0" />
                <span>Your scan is processed securely and encrypted. Images are never stored and never shared with sellers. You can delete your saved profile anytime.</span>
              </div>
              {savedProfile && (
                <div className="rounded-2xl p-3 flex items-center justify-between gap-3" style={glass}>
                  <p className="text-xs" style={{ color: "#5B5147" }}>You have a saved size profile.</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={useSavedProfile}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-white" style={{ background: MAROON }}>Use it</button>
                    <button type="button" onClick={handleDeleteProfile} aria-label="Delete profile"
                      className="rounded-lg border p-2" style={{ borderColor: BORDER }}><Trash2 size={13} style={{ color: "#9B8B7A" }} /></button>
                  </div>
                </div>
              )}
              <button type="button" onClick={() => setStep("measure")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${MAROON}, #6E2D2D)` }}>
                Get started <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* ── MEASURE ── */}
          {step === "measure" && (
            <div className="space-y-5">
              {/* Height */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[13px] font-semibold" style={{ color: "#4A3F35" }}>Height</label>
                  <UnitToggle value={hUnit} onChange={setHUnit} options={[["cm", "cm"], ["ft", "ft/in"]]} />
                </div>
                {hUnit === "cm" ? (
                  <IconInput icon={MoveVertical} value={cm} onChange={setCm} placeholder="e.g. 168" suffix="cm" />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <IconInput icon={MoveVertical} value={ft} onChange={setFt} placeholder="5" suffix="ft" />
                    <IconInput icon={MoveVertical} value={inch} onChange={setInch} placeholder="6" suffix="in" />
                  </div>
                )}
              </div>
              {/* Weight */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[13px] font-semibold" style={{ color: "#4A3F35" }}>Weight</label>
                  <UnitToggle value={wUnit} onChange={setWUnit} options={[["kg", "kg"], ["lbs", "lbs"]]} />
                </div>
                <IconInput icon={Scale} value={wt} onChange={setWt} placeholder={wUnit === "kg" ? "e.g. 62" : "e.g. 137"} suffix={wUnit} />
              </div>
              {/* Gender (improves estimate) */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: "#4A3F35" }}>Body type</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[["female", "Women’s fit"], ["male", "Men’s fit"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setGender(v)}
                      className="rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition"
                      style={{ borderColor: gender === v ? MAROON : BORDER, background: gender === v ? "rgba(139,58,58,0.05)" : "white", color: INK }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {isLoggedIn && (
                <label className="flex items-start gap-2.5 text-xs" style={{ color: "#5B5147" }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                  <span>Securely save my encrypted size profile so I don’t have to scan again. Used only for sizing.</span>
                </label>
              )}
              <div className="flex flex-col gap-2">
                <button type="button" disabled={!hwValid} onClick={() => setStep("scan")}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${MAROON}, #6E2D2D)` }}>
                  <Camera size={15} /> Continue to 360° scan
                </button>
                <button type="button" disabled={!hwValid} onClick={() => runAnalyze([])}
                  className="w-full rounded-2xl border py-3 text-xs font-semibold transition disabled:opacity-50"
                  style={{ borderColor: BORDER, color: "#6B5E52" }}>
                  Skip scan — estimate from height & weight
                </button>
              </div>
            </div>
          )}

          {/* ── SCAN ── */}
          {step === "scan" && (
            <div className="space-y-4">
              <div className="relative mx-auto overflow-hidden rounded-3xl" style={{ aspectRatio: "3/4", maxWidth: 320, background: "#1a1714" }}>
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" style={{ transform: "scaleX(-1)" }} />
                {/* silhouette guide */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-[50%]" style={{ width: "56%", height: "82%", border: `2px dashed rgba(255,255,255,0.5)` }} />
                </div>
                {scanning && (
                  <div className="absolute inset-x-0 bottom-0 p-3 text-center" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                    <p className="text-sm font-semibold text-white">{SCAN_STEPS[Math.min(scanIdx, SCAN_STEPS.length - 1)]}</p>
                    <div className="mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-white/25">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(scanIdx / FRAME_COUNT) * 100}%`, background: GOLD }} />
                    </div>
                  </div>
                )}
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera size={40} style={{ color: "rgba(255,255,255,0.6)" }} />
                  </div>
                )}
              </div>
              <ul className="space-y-1.5 rounded-2xl p-3 text-[11px]" style={{ ...glass, color: "#5B5147" }}>
                <li>• Stand 2–3 m from the camera so your whole body is visible.</li>
                <li>• Wear fitted clothing for the most accurate result.</li>
                <li>• Slowly rotate 360°: front → left → back → right → front.</li>
              </ul>
              {scanMsg && <p className="text-xs" style={{ color: MAROON }}>{scanMsg}</p>}
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex flex-col gap-2">
                <button type="button" disabled={scanning} onClick={startScan}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${MAROON}, #6E2D2D)` }}>
                  {scanning ? <><Loader2 size={15} className="animate-spin" /> Scanning… hold still</> : <><Camera size={15} /> Start 360° scan</>}
                </button>
                <button type="button" disabled={scanning} onClick={() => runAnalyze([])}
                  className="w-full rounded-2xl border py-3 text-xs font-semibold transition disabled:opacity-50"
                  style={{ borderColor: BORDER, color: "#6B5E52" }}>
                  Skip scan — estimate from height & weight
                </button>
              </div>
            </div>
          )}

          {/* ── ANALYZING ── */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${GOLD}, ${MAROON})` }}>
                <Loader2 size={24} className="animate-spin text-white" />
              </span>
              <p className="font-serif text-xl" style={{ color: INK }}>Analysing your fit…</p>
              <p className="max-w-xs text-xs" style={{ color: "#9B8B7A" }}>
                Estimating your measurements and matching them to this product’s size chart.
              </p>
            </div>
          )}

          {/* ── RESULT ── */}
          {step === "result" && result && (
            <div className="space-y-4">
              <div className="rounded-3xl p-5 text-center" style={{ background: "linear-gradient(135deg,#FBF6EC,#F3ECDD)", border: `1px solid ${BORDER}` }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Recommended Size</p>
                <p className="font-serif" style={{ color: INK, fontSize: 56, lineHeight: 1.05 }}>{result.recommended_size}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: CONF_COLOR[result.confidence] || "#9B8B7A" }}>
                    {result.confidence} confidence
                  </span>
                  <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: BORDER, color: "#5B5147" }}>
                    {result.fit} fit
                  </span>
                </div>
              </div>

              {measurements && (
                <div className="grid grid-cols-3 gap-2">
                  {[["Bust/Chest", measurements.bust ?? measurements.chest], ["Waist", measurements.waist], ["Hip", measurements.hip]].map(([l, v]) => (
                    <div key={l} className="rounded-2xl p-3 text-center" style={glass}>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9B8B7A" }}>{l}</p>
                      <p className="text-sm font-bold" style={{ color: INK }}>{v ? `${Math.round(v)}"` : "—"}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => applySize(result.recommended_size)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
                  style={{ background: MAROON }}>
                  <Check size={15} /> Select size {result.recommended_size}
                </button>
                {result.alternative?.size && (
                  <button type="button" onClick={() => applySize(result.alternative.size)}
                    className="w-full rounded-2xl border py-3 text-xs font-semibold" style={{ borderColor: BORDER, color: INK }}>
                    Or choose {result.alternative.size} — {result.alternative.note}
                  </button>
                )}
                <button type="button" onClick={() => { setResult(null); setStep("measure"); }}
                  className="flex items-center justify-center gap-1.5 pt-1 text-xs font-semibold" style={{ color: "#9B8B7A" }}>
                  <RotateCcw size={12} /> Start over
                </button>
              </div>

              {!result.used_seller_chart && (
                <p className="text-center text-[10px]" style={{ color: "#B5A896" }}>
                  Based on a standard size chart for this category.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function guessGender(category) {
  const c = (category || "").toLowerCase();
  if (["sherwani", "kurta ", "men", "shirt", "blazer", "waistcoat"].some((k) => c.includes(k))) return "male";
  return "female";
}

function UnitToggle({ value, onChange, options }) {
  return (
    <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className="px-2.5 py-1 text-[11px] font-semibold transition"
          style={{ background: value === v ? INK : "white", color: value === v ? "white" : "#6B5E52" }}>
          {l}
        </button>
      ))}
    </div>
  );
}

function IconInput({ icon: Icon, value, onChange, placeholder, suffix }) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#B5A896" }} />
      <input type="number" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border bg-white py-3 pl-9 pr-12 text-sm outline-none focus:border-[#C8A146]"
        style={{ borderColor: BORDER }} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#9B8B7A" }}>{suffix}</span>
    </div>
  );
}
