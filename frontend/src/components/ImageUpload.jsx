/**
 * ImageUpload.jsx — Reusable image upload component.
 * Accepts file drag/drop, file picker, or a direct URL paste.
 * Converts files to base64 and passes the URL (data: or hosted) to onUpload.
 * No external image service required in dev — stores as data-URL.
 * Swap uploadImage() to point at Cloudinary/S3 for production.
 */
import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X, ImageOff } from "lucide-react";
import { toast } from "sonner";

const MAX_SIZE_MB = 4;

export default function ImageUpload({ value, onUpload, label = "Image", hint = "", disabled = false }) {
  const [tab, setTab] = useState("file"); // "file" | "url"
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { toast.error(`Image must be under ${MAX_SIZE_MB}MB`); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpload(e.target.result);
      setUploading(false);
    };
    reader.onerror = () => { toast.error("Could not read file"); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlSave = () => {
    const u = urlInput.trim();
    if (!u) return;
    if (!u.startsWith("http://") && !u.startsWith("https://") && !u.startsWith("data:")) {
      toast.error("Enter a valid URL (https://...)"); return;
    }
    onUpload(u);
    setUrlInput("");
  };

  const clear = (e) => { e.stopPropagation(); onUpload(""); };

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      {label && <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9B8B7A" }}>{label}</p>}
      {hint && <p className="text-xs mb-2" style={{ color: "#B5A896" }}>{hint}</p>}

      {/* Preview */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden mb-3" style={{ height: 140, backgroundColor: "#F0EBE3" }}>
          <img src={value} alt="" className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }} />
          <button onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <X size={13} color="white" />
          </button>
        </div>
      ) : (
        <div className="rounded-xl mb-3 flex flex-col items-center justify-center gap-1.5"
          style={{ height: 80, backgroundColor: "#F5F1ED", border: "1px dashed #E8E4DF" }}>
          <ImageOff size={20} style={{ color: "#C9A84C" }} />
          <p className="text-xs" style={{ color: "#9B8B7A" }}>No image</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {[{ id: "file", icon: Upload, label: "Upload" }, { id: "url", icon: LinkIcon, label: "URL" }].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              backgroundColor: tab === t.id ? "#1a1a1a" : "#F0EBE3",
              color: tab === t.id ? "white" : "#6B5E52",
            }}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "file" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition"
          style={{ borderColor: dragging ? "#C9A84C" : "#E8E4DF", backgroundColor: dragging ? "rgba(201,168,76,0.05)" : "white" }}
        >
          <Upload size={20} className="mx-auto mb-1" style={{ color: "#9B8B7A" }} />
          <p className="text-xs" style={{ color: "#9B8B7A" }}>
            {uploading ? "Processing..." : "Drag & drop or click to browse"}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "#B5A896" }}>JPG, PNG, WebP up to {MAX_SIZE_MB}MB</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleFile(e.target.files?.[0])} />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleUrlSave()}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E8E4DF" }}
          />
          <button type="button" onClick={handleUrlSave}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ backgroundColor: "#1a1a1a" }}>
            Use
          </button>
        </div>
      )}
    </div>
  );
}
