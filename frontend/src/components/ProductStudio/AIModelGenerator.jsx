/**
 * AIModelGenerator.jsx
 * "Generate AI Model" — turns a seller's flat/mannequin product photo into a
 * photorealistic model shot while preserving the exact garment. Used inside
 * ProductStudio's Media section.
 *
 * Props:
 *   primaryImage  string   the uploaded product image (data URL or hosted URL)
 *   productId     string   the product id (may be empty for brand-new products)
 *   onSetCover    (url) => void   set a generated image as the product cover
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Download, Trash2, RefreshCw, Star, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import {
  aiModelUsage, aiModelImages, aiGenerateModel, aiRegenerateModel,
  aiDeleteModelImage, aiSetPrimaryModelImage,
} from "@/lib/api";

const OPTIONS = {
  gender: [["female", "Female"], ["male", "Male"], ["kids_girl", "Kids Girl"], ["kids_boy", "Kids Boy"]],
  age: [["teen", "Teen"], ["young_adult", "Young Adult"], ["adult", "Adult"], ["mature", "Mature"]],
  body_type: [["slim", "Slim"], ["regular", "Regular"], ["athletic", "Athletic"], ["plus_size", "Plus Size"]],
  skin_tone: [["fair", "Fair"], ["wheatish", "Wheatish"], ["brown", "Brown"], ["dark", "Dark"]],
  pose: [["standing", "Standing"], ["front", "Front"], ["side", "Side"], ["walking", "Walking"]],
  background: [["white_studio", "White Studio"], ["luxury_studio", "Luxury Studio"], ["lifestyle_indoor", "Lifestyle Indoor"], ["outdoor", "Outdoor"]],
};
const C = { gold: "#C9A84C", rose: "#A2466B", border: "#E8E4DF", muted: "#9B8B7A", espresso: "#2C241B" };

// Before/After slider
function BeforeAfter({ before, after }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative w-full rounded-xl overflow-hidden select-none" style={{ aspectRatio: "3/4", background: "#F0EBE3" }}>
      <img src={after} alt="AI model" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Original" className="absolute inset-0 h-full object-cover" style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }} draggable={false} />
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md text-white" style={{ background: "rgba(0,0,0,0.5)" }}>Original</span>
      </div>
      <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md text-white" style={{ background: C.rose }}>AI Model</span>
      <div className="absolute top-0 bottom-0" style={{ left: `${pos}%`, width: 2, background: "white", boxShadow: "0 0 4px rgba(0,0,0,0.4)" }} />
      <input type="range" min="0" max="100" value={pos} onChange={e => setPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" aria-label="Reveal slider" />
    </div>
  );
}

export default function AIModelGenerator({ primaryImage, productId, onSetCover }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    gender: "female", age: "adult", body_type: "regular",
    skin_tone: "wheatish", pose: "standing", background: "white_studio",
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [usage, setUsage] = useState(null);
  const [images, setImages] = useState([]);
  const [latest, setLatest] = useState(null); // { id, image }
  const timerRef = useRef(null);

  const loadUsage = useCallback(() => { aiModelUsage().then(setUsage).catch(() => {}); }, []);
  const loadImages = useCallback(() => {
    if (productId) aiModelImages(productId).then(setImages).catch(() => {});
  }, [productId]);

  useEffect(() => { if (open) { loadUsage(); loadImages(); } }, [open, loadUsage, loadImages]);

  const startProgress = () => {
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(p => (p >= 92 ? 92 : p + Math.random() * 8));
    }, 900);
  };
  const stopProgress = () => { clearInterval(timerRef.current); setProgress(100); };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const setOpt = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const generate = async (regen = false) => {
    if (!primaryImage) { toast.error("Upload a product image first."); return; }
    if (!primaryImage.startsWith("data:image/")) {
      toast.error("AI generation needs the uploaded image. Re-upload the product photo and try again.");
      return;
    }
    setLoading(true); setLatest(null); startProgress();
    try {
      const fn = regen ? aiRegenerateModel : aiGenerateModel;
      const data = await fn({ image_data_url: primaryImage, product_id: productId || null, ...settings });
      setLatest({ id: data.id, image: data.image });
      setUsage(data.usage);
      loadImages();
      toast.success("AI model generated!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI generation failed. Try a different photo or settings.");
    } finally { stopProgress(); setTimeout(() => setLoading(false), 300); }
  };

  const download = (url, id) => {
    const a = document.createElement("a");
    a.href = url; a.download = `shoplivebharat-ai-model-${id || "image"}.png`; a.click();
  };
  const remove = async (id) => {
    try { await aiDeleteModelImage(id); toast.success("Deleted"); if (latest?.id === id) setLatest(null); loadImages(); }
    catch { toast.error("Could not delete"); }
  };
  const setCover = async (img) => {
    try {
      if (img.id) await aiSetPrimaryModelImage(img.id);
      onSetCover?.(img.image || img.generated_image);
      toast.success("Set as product cover");
      loadImages();
    } catch { toast.error("Could not set cover"); }
  };

  const usageLabel = usage
    ? (usage.premium ? "Unlimited (Premium)" : `${usage.remaining}/${usage.limit} left this month`)
    : "";

  return (
    <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: C.border, background: "linear-gradient(135deg,#FFFDF7,#FBF7FA)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#C9A84C,#A2466B)" }}>
            <Wand2 size={17} color="white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: C.espresso }}>Generate AI Model</p>
            <p className="text-[11px]" style={{ color: C.muted }}>Turn your product photo into a photorealistic model shot — your garment stays exactly the same.</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(o => !o)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#C9A84C,#A2466B)" }}>
          {open ? "Close" : "Open Studio"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {usageLabel && <p className="text-[11px] font-semibold" style={{ color: C.rose }}>{usageLabel}</p>}

          {/* Settings */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(OPTIONS).map(([key, opts]) => (
              <div key={key}>
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: C.muted }}>
                  {key.replace("_", " ")}
                </label>
                <select value={settings[key]} onChange={e => setOpt(key, e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none bg-white"
                  style={{ borderColor: C.border, color: C.espresso }}>
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => generate(false)} disabled={loading || !primaryImage}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#C9A84C,#A2466B)" }}>
            {loading ? <><RefreshCw size={15} className="animate-spin" /> Generating…</> : <><Sparkles size={15} /> Generate AI Model</>}
          </button>

          {/* Loading progress */}
          {loading && (
            <div className="rounded-xl border p-4" style={{ borderColor: C.border, background: "white" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: C.espresso }}>Creating your model shot…</p>
                <p className="text-xs" style={{ color: C.muted }}>~15–30 seconds</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F0EBE3" }}>
                <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#C9A84C,#A2466B)" }} />
              </div>
            </div>
          )}

          {/* Latest result with before/after */}
          {latest && !loading && (
            <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: C.border, background: "white" }}>
              <BeforeAfter before={primaryImage} after={latest.image} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setCover(latest)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white" style={{ background: "#2D7A3A" }}>
                  <Star size={13} /> Set as Cover
                </button>
                <button type="button" onClick={() => download(latest.image, latest.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: C.border, color: C.espresso }}>
                  <Download size={13} /> Download
                </button>
                <button type="button" onClick={() => generate(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: C.border, color: C.espresso }}>
                  <RefreshCw size={13} /> Regenerate
                </button>
                <button type="button" onClick={() => remove(latest.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: C.border, color: "#C0392B" }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          )}

          {/* Gallery of past generations for this product */}
          {images.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: C.muted }}>Generated for this product</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map(img => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border" style={{ borderColor: img.is_primary ? C.rose : C.border }}>
                    <img src={img.generated_image} alt="AI model" className="w-full object-cover" style={{ aspectRatio: "3/4" }} />
                    {img.is_primary && <span className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: C.rose }}>COVER</span>}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1" style={{ background: "rgba(0,0,0,0.45)" }}>
                      <button type="button" title="Set as cover" onClick={() => setCover(img)} className="p-1.5 rounded-md bg-white"><Star size={12} style={{ color: "#2D7A3A" }} /></button>
                      <button type="button" title="Download" onClick={() => download(img.generated_image, img.id)} className="p-1.5 rounded-md bg-white"><Download size={12} style={{ color: C.espresso }} /></button>
                      <button type="button" title="Delete" onClick={() => remove(img.id)} className="p-1.5 rounded-md bg-white"><Trash2 size={12} style={{ color: "#C0392B" }} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
