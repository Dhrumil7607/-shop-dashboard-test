/**
 * SellerAIStudio.jsx — /seller/ai-studio
 * AI-powered Virtual Try-On + Product Image Generator for sellers.
 * Uses Gemini API via the backend (key never touches the frontend).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Upload, Download, Image, Wand2, RefreshCw, Camera, Palette } from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { api } from "@/lib/api";

const MODEL_TYPES = [
  { value: "female_indian", label: "Female — Indian" },
  { value: "male_indian", label: "Male — Indian" },
  { value: "female_western", label: "Female — Western" },
  { value: "male_western", label: "Male — Western" },
];
const CATEGORIES = ["Saree", "Lehenga", "Kurta", "Jewellery", "Western", "Accessory", "Sherwani", "Chaniya Choli"];
const STYLES = [
  { value: "studio_white", label: "Studio White" },
  { value: "lifestyle_warm", label: "Lifestyle Warm" },
  { value: "dark_luxury", label: "Dark Luxury" },
  { value: "outdoor_natural", label: "Outdoor Natural" },
];

function DropZone({ file, setFile, label }) {
  const ref = useRef(null);
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div
      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-[#C9A84C] transition"
      style={{ borderColor: file ? "#C9A84C" : "#E8E4DF", background: file ? "#FFFDF7" : "#FAFAF8" }}
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
    >
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
      {preview ? (
        <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
      ) : (
        <div className="py-8">
          <Upload size={32} className="mx-auto mb-3" style={{ color: "#C9A84C" }} />
          <p className="text-sm font-medium" style={{ color: "#6B5E52" }}>{label || "Drop an image or click to upload"}</p>
          <p className="text-xs mt-1" style={{ color: "#9B8B7A" }}>JPEG, PNG, or WebP — max 10MB</p>
        </div>
      )}
    </div>
  );
}

function ResultImage({ base64, label }) {
  const download = () => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${base64}`;
    a.download = `shoplivebharat-ai-${label || "result"}.png`;
    a.click();
  };
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E8E4DF" }}>
      <img src={`data:image/png;base64,${base64}`} alt={label} className="w-full" />
      <div className="p-3 flex items-center justify-between" style={{ background: "#FAFAF8" }}>
        <span className="text-xs font-medium" style={{ color: "#6B5E52" }}>{label}</span>
        <button onClick={download} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "#C9A84C", color: "#1a1a1a" }}>
          <Download size={12} /> Save
        </button>
      </div>
    </div>
  );
}

export default function SellerAIStudio() {
  const [tab, setTab] = useState("tryon");
  const [usage, setUsage] = useState(null);

  // Try-on state
  const [tryonFile, setTryonFile] = useState(null);
  const [modelType, setModelType] = useState("female_indian");
  const [tryonCat, setTryonCat] = useState("Saree");
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonResult, setTryonResult] = useState(null);

  // Product images state
  const [prodFile, setProdFile] = useState(null);
  const [prodStyle, setProdStyle] = useState("studio_white");
  const [prodCat, setProdCat] = useState("Saree");
  const [prodLoading, setProdLoading] = useState(false);
  const [prodResult, setProdResult] = useState(null);

  // Gallery
  const [gallery, setGallery] = useState([]);

  const loadUsage = useCallback(() => {
    api.get("/seller/ai/usage").then(r => setUsage(r.data)).catch(() => {});
  }, []);

  const loadGallery = useCallback(() => {
    api.get("/seller/ai/gallery").then(r => setGallery(r.data?.generations || [])).catch(() => {});
  }, []);

  useEffect(() => { loadUsage(); loadGallery(); }, [loadUsage, loadGallery]);

  const handleTryon = async () => {
    if (!tryonFile) { toast.error("Upload a product image first"); return; }
    setTryonLoading(true); setTryonResult(null);
    const fd = new FormData();
    fd.append("image", tryonFile);
    fd.append("model_type", modelType);
    fd.append("category", tryonCat.toLowerCase());
    try {
      const { data } = await api.post("/seller/ai/tryon", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 });
      setTryonResult(data);
      setUsage(data.usage);
      toast.success("Try-on generated!");
      loadGallery();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI generation failed. Try a different image.");
    } finally { setTryonLoading(false); }
  };

  const handleProductImages = async () => {
    if (!prodFile) { toast.error("Upload a product image first"); return; }
    setProdLoading(true); setProdResult(null);
    const fd = new FormData();
    fd.append("image", prodFile);
    fd.append("style", prodStyle);
    fd.append("category", prodCat.toLowerCase());
    try {
      const { data } = await api.post("/seller/ai/product-images", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 90000 });
      setProdResult(data);
      setUsage(data.usage);
      toast.success("Product images generated!");
      loadGallery();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI generation failed. Try a different image.");
    } finally { setProdLoading(false); }
  };

  const selectStyle = { borderColor: "#E8E4DF", background: "white", color: "#1a1a1a", padding: "8px 12px", borderRadius: "8px", fontSize: "14px", border: "1px solid #E8E4DF" };

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A84C, #8B3A3A)" }}>
                <Sparkles size={20} color="white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>AI Studio</h1>
                <p className="text-xs" style={{ color: "#9B8B7A" }}>Powered by Google Gemini — generate professional product visuals</p>
              </div>
            </div>
            {usage && (
              <div className="text-right text-xs" style={{ color: "#6B5E52" }}>
                <p>Try-ons: <strong>{usage.tryon_remaining}/{usage.tryon_limit}</strong> left today</p>
                <p>Product sets: <strong>{usage.product_img_remaining}/{usage.product_img_limit}</strong> left today</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[["tryon", "Virtual Try-On", Camera], ["product", "Product Images", Palette]].map(([k, l, Icon]) => (
              <button key={k} onClick={() => setTab(k)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: tab === k ? "#1a1a1a" : "#F0EBE3", color: tab === k ? "#fff" : "#6B5E52" }}>
                <Icon size={15} /> {l}
              </button>
            ))}
          </div>

          {/* Virtual Try-On */}
          {tab === "tryon" && (
            <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: "#E8E4DF" }}>
              <h2 className="font-semibold flex items-center gap-2" style={{ color: "#1a1a1a" }}>
                <Wand2 size={18} style={{ color: "#C9A84C" }} /> Virtual Try-On
              </h2>
              <p className="text-sm" style={{ color: "#9B8B7A" }}>Upload a product image and our AI will generate a model wearing it.</p>
              <DropZone file={tryonFile} setFile={setTryonFile} label="Upload your product image" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6B5E52" }}>Model Type</label>
                  <select value={modelType} onChange={e => setModelType(e.target.value)} style={selectStyle} className="w-full">
                    {MODEL_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6B5E52" }}>Category</label>
                  <select value={tryonCat} onChange={e => setTryonCat(e.target.value)} style={selectStyle} className="w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleTryon} disabled={tryonLoading || !tryonFile}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #C9A84C, #8B3A3A)" }}>
                {tryonLoading ? <><RefreshCw size={15} className="animate-spin" /> Generating…</> : <><Sparkles size={15} /> Generate Try-On</>}
              </button>
              {tryonLoading && <div className="h-64 rounded-xl animate-pulse" style={{ background: "#F0EBE3" }} />}
              {tryonResult && (
                <div className="space-y-3">
                  {tryonResult.generated === false && (
                    <div className="rounded-lg p-3 text-xs" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
                      AI image generation is not enabled on this account yet, so we're showing your original photo with an AI styling analysis below. To produce brand-new model/product photos, enable billing on the Gemini API project (Imagen &amp; image models require a paid plan).
                    </div>
                  )}
                  <ResultImage base64={tryonResult.image} label="Virtual Try-On" />
                  {tryonResult.caption && <p className="text-sm italic" style={{ color: "#6B5E52" }}>{tryonResult.caption}</p>}
                </div>
              )}
            </div>
          )}

          {/* Product Images */}
          {tab === "product" && (
            <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: "#E8E4DF" }}>
              <h2 className="font-semibold flex items-center gap-2" style={{ color: "#1a1a1a" }}>
                <Image size={18} style={{ color: "#C9A84C" }} /> Product Image Generator
              </h2>
              <p className="text-sm" style={{ color: "#9B8B7A" }}>Generate 3 professional shots: hero, detail, and lifestyle — powered by AI.</p>
              <DropZone file={prodFile} setFile={setProdFile} label="Upload your product image" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6B5E52" }}>Style</label>
                  <select value={prodStyle} onChange={e => setProdStyle(e.target.value)} style={selectStyle} className="w-full">
                    {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#6B5E52" }}>Category</label>
                  <select value={prodCat} onChange={e => setProdCat(e.target.value)} style={selectStyle} className="w-full">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleProductImages} disabled={prodLoading || !prodFile}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #C9A84C, #8B3A3A)" }}>
                {prodLoading ? <><RefreshCw size={15} className="animate-spin" /> Generating 3 shots…</> : <><Sparkles size={15} /> Generate Product Images</>}
              </button>
              {prodLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: "#F0EBE3" }} />)}
                </div>
              )}
              {prodResult && (
                <div className="space-y-3">
                  {prodResult.generated === false && (
                    <div className="rounded-lg p-3 text-xs" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
                      AI image generation is not enabled on this account yet, so we're showing your original photo with AI photography guidance. To generate brand-new studio shots, enable billing on the Gemini API project (image models require a paid plan).
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(prodResult.images || []).map((img, i) => (
                      <ResultImage key={i} base64={img} label={["Hero Shot", "Detail Shot", "Lifestyle Shot"][i]} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-3" style={{ color: "#1a1a1a" }}>My AI Generations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {gallery.map(g => (
                  <div key={g.id} className="rounded-xl border p-3 text-center" style={{ borderColor: "#E8E4DF", background: "white" }}>
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ background: g.type === "tryon" ? "#FEF3C7" : "#DCFCE7" }}>
                      {g.type === "tryon" ? <Camera size={14} style={{ color: "#92400E" }} /> : <Palette size={14} style={{ color: "#166534" }} />}
                    </div>
                    <p className="text-xs font-medium capitalize" style={{ color: "#1a1a1a" }}>{g.type === "tryon" ? "Try-On" : "Product Images"}</p>
                    <p className="text-[10px]" style={{ color: "#9B8B7A" }}>{g.category} · {(g.created_at || "").slice(0, 10)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
