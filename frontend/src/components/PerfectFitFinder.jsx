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
  X, Sparkles, Camera, SwitchCamera, Ruler, Check, ShieldCheck, RotateCcw,
  ArrowRight, Trash2, Loader2, MoveVertical, Scale,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { analyzeBodyScan, recommendSize, getBodyProfile, deleteBodyProfile } from "@/lib/api";

const MAROON = "#8B3A3A";
const GOLD = "#C8A146";
const INK = "#1a1a1a";
const BORDER = "#ECE8E1";

// Guided pose sequence — one capture per view.
const POSES = [
  { key: "front", label: "Face the camera", hint: "Stand straight, arms slightly away from your sides", done: "Front" },
  { key: "left", label: "Turn to your left", hint: "Show your left side to the camera", done: "Left side" },
  { key: "back", label: "Turn around — show your back", hint: "Face away from the camera", done: "Back" },
  { key: "right", label: "Turn to your right", hint: "Show your right side to the camera", done: "Right side" },
];
const COUNTDOWN_FROM = 3;

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

  const [facing, setFacing] = useState("user");     // user | environment
  const [camState, setCamState] = useState("idle"); // idle | starting | ready | error
  const [camError, setCamError] = useState("");
  const [poseIdx, setPoseIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [capturing, setCapturing] = useState(false);
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
    if (videoRef.current) { try { videoRef.current.srcObject = null; } catch { /* noop */ } }
    setCapturing(false);
    setCountdown(0);
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

  // Capture one frame from the live <video> onto the canvas → JPEG blob.
  const captureFrame = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return false;
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh) return false;
    const w = 480, h = Math.round((vh / vw) * w) || 640;
    c.width = w; c.height = h;
    try { c.getContext("2d").drawImage(v, 0, 0, w, h); } catch { return false; }
    const url = c.toDataURL("image/jpeg", 0.82);
    const bin = atob(url.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    framesRef.current.push(new Blob([bytes], { type: "image/jpeg" }));
    return true;
  }, []);

  // Open the camera (with the requested facing) and show the live preview.
  const startCamera = useCallback(async (facingMode) => {
    if (streamRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("error");
      setCamError("This browser can’t access the camera. Use “Skip scan” to continue with height & weight.");
      return;
    }
    setCamState("starting");
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode || "user" }, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        v.onloadedmetadata = () => { v.play().catch(() => {}); setCamState("ready"); };
        v.play().then(() => setCamState("ready")).catch(() => {});
      }
    } catch (err) {
      streamRef.current = null;
      setCamState("error");
      const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setCamError(denied
        ? "Camera permission was blocked. Allow camera access in your browser, then tap “Retry camera”. Or use “Skip scan”."
        : "We couldn’t start your camera. Tap “Retry camera”, or use “Skip scan” to continue with height & weight.");
    }
  }, []);

  // Auto-open the camera on entering the scan step; restart when facing changes.
  useEffect(() => {
    if (step !== "scan") return undefined;
    framesRef.current = [];
    setPoseIdx(0);
    startCamera(facing);
    return () => { stopStream(); setCamState("idle"); };
  }, [step, facing, startCamera, stopStream]);

  // Front/back camera switch.
  const flipCamera = useCallback(() => {
    if (capturing) return;
    stopStream();
    setCamState("idle");
    setFacing((f) => (f === "user" ? "environment" : "user"));
  }, [capturing, stopStream]);

  // Capture the CURRENT pose with a short countdown, then advance to the next.
  const captureCurrentPose = useCallback(() => {
    if (camState !== "ready" || capturing) return;
    setScanMsg("");
    setCapturing(true);
    let n = COUNTDOWN_FROM;
    setCountdown(n);
    timerRef.current = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n > 0) return;
      clearInterval(timerRef.current); timerRef.current = null;
      // Retry the grab briefly in case a frame wasn't ready.
      let ok = captureFrame();
      if (!ok) ok = captureFrame();
      setCapturing(false);
      setCountdown(0);
      if (!ok) {
        setScanMsg("Couldn’t capture that view — make sure your whole body is visible, then try again.");
        return;
      }
      setPoseIdx((idx) => {
        const next = idx + 1;
        if (next >= POSES.length) {
          stopStream();
          runAnalyze(framesRef.current);
          return idx;
        }
        toast.success(`${POSES[idx].done} captured`);
        return next;
      });
    }, 1000);
  }, [camState, capturing, captureFrame, stopStream, runAnalyze]);

  const restartScan = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    framesRef.current = [];
    setPoseIdx(0);
    setCapturing(false);
    setCountdown(0);
    setScanMsg("");
  }, []);

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
              {/* Current pose instruction */}
              <div className="rounded-2xl p-3 text-center" style={{ ...glass }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  Step {Math.min(poseIdx + 1, POSES.length)} of {POSES.length}
                </p>
                <p className="mt-1 font-serif text-xl" style={{ color: INK }}>{POSES[poseIdx].label}</p>
                <p className="text-[11px]" style={{ color: "#8B8074" }}>{POSES[poseIdx].hint}</p>
              </div>

              <div className="relative mx-auto overflow-hidden rounded-3xl" style={{ aspectRatio: "3/4", maxWidth: 320, background: "#1a1714" }}>
                <video ref={videoRef} autoPlay playsInline muted
                  className="h-full w-full object-cover"
                  style={{ transform: facing === "user" ? "scaleX(-1)" : "none", opacity: camState === "ready" ? 1 : 0.15 }} />
                {/* full-body silhouette guide */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div style={{ width: "48%", height: "88%", border: "2px dashed rgba(255,255,255,0.55)", borderRadius: "44% 44% 40% 40% / 20% 20% 12% 12%" }} />
                </div>

                {/* Flip camera button */}
                {camState === "ready" && (
                  <button type="button" onClick={flipCamera} disabled={capturing} aria-label="Switch camera"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-50"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
                    <SwitchCamera size={17} className="text-white" />
                  </button>
                )}

                {/* Pose progress dots */}
                <div className="absolute left-1/2 top-3 flex -translate-x-1/2 gap-1.5">
                  {POSES.map((p, i) => (
                    <span key={p.key} className="h-1.5 rounded-full transition-all"
                      style={{ width: i === poseIdx ? 18 : 8, background: i < poseIdx ? "#2D7A3A" : i === poseIdx ? GOLD : "rgba(255,255,255,0.4)" }} />
                  ))}
                </div>

                {camState === "starting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                    <Loader2 size={26} className="animate-spin" />
                    <p className="text-xs">Starting camera…</p>
                  </div>
                )}
                {camState === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/80">
                    <Camera size={30} />
                    <p className="text-[11px] leading-snug">{camError}</p>
                  </div>
                )}
                {capturing && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <span className="font-serif text-white" style={{ fontSize: 72, textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>{countdown}</span>
                  </div>
                )}
                {camState === "ready" && !capturing && (
                  <div className="absolute inset-x-0 bottom-0 p-3 text-center" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                    <p className="text-[11px] text-white/90">Fit your whole body inside the outline, then capture</p>
                  </div>
                )}
              </div>

              <ul className="space-y-1.5 rounded-2xl p-3 text-[11px]" style={{ ...glass, color: "#5B5147" }}>
                <li>• Stand 2–3 m back so your whole body fits the outline.</li>
                <li>• Wear fitted clothing for the most accurate result.</li>
                <li>• Use “Switch camera” + a mirror or a helper for side/back views.</li>
              </ul>
              {scanMsg && <p className="text-xs" style={{ color: MAROON }}>{scanMsg}</p>}
              <canvas ref={canvasRef} className="hidden" />

              <div className="flex flex-col gap-2">
                {camState === "error" ? (
                  <button type="button" onClick={() => startCamera(facing)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${MAROON}, #6E2D2D)` }}>
                    <RotateCcw size={15} /> Retry camera
                  </button>
                ) : (
                  <button type="button" disabled={capturing || camState !== "ready"} onClick={captureCurrentPose}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white transition disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${MAROON}, #6E2D2D)` }}>
                    {capturing
                      ? <><Loader2 size={15} className="animate-spin" /> Capturing…</>
                      : camState === "ready"
                        ? <><Camera size={15} /> Capture {POSES[poseIdx].done.toLowerCase()} view</>
                        : <><Loader2 size={15} className="animate-spin" /> Preparing camera…</>}
                  </button>
                )}
                <div className="flex gap-2">
                  {poseIdx > 0 && (
                    <button type="button" disabled={capturing} onClick={restartScan}
                      className="flex-1 rounded-2xl border py-3 text-xs font-semibold transition disabled:opacity-50"
                      style={{ borderColor: BORDER, color: "#6B5E52" }}>
                      Start over
                    </button>
                  )}
                  <button type="button" disabled={capturing} onClick={() => runAnalyze([])}
                    className="flex-1 rounded-2xl border py-3 text-xs font-semibold transition disabled:opacity-50"
                    style={{ borderColor: BORDER, color: "#6B5E52" }}>
                    Skip scan — use height & weight
                  </button>
                </div>
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
