/**
 * MultiImageUploader.jsx
 * Premium multi-image uploader for products (up to N images).
 *  • Drag & drop + multi-select + bulk upload
 *  • Client-side compression before upload
 *  • Per-image upload progress
 *  • Preview grid with lazy-loaded thumbnails
 *  • Drag-to-reorder (Framer Motion Reorder — GPU transforms, lightweight)
 *  • Set primary / delete / replace
 *  • Uploads to backend storage (Cloudinary when configured) via uploadFn
 *
 * Props:
 *   value     string[]   ordered list of hosted image URLs (index 0 = primary)
 *   onChange  (urls) => void
 *   uploadFn  async (dataUrl) => hostedUrl
 *   max       number (default 20)
 *   disabled  bool
 */
import { useState, useRef, useCallback } from "react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { Upload, X, Star, RefreshCw, GripVertical, ImageOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ACCEPT = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 25;

// Compress an image file to a JPEG/WebP data URL (max dimension + quality).
function compressImage(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        // PNG with transparency → keep PNG; else JPEG for smaller size.
        const isPng = file.type === "image/png";
        const out = canvas.toDataURL(isPng ? "image/png" : "image/jpeg", quality);
        resolve(out);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MultiImageUploader({ value = [], onChange, uploadFn, max = 20, disabled = false }) {
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // [{ id, progress, error }]
  const inputRef = useRef();
  const replaceIndexRef = useRef(null);
  const replaceInputRef = useRef();

  const images = Array.isArray(value) ? value : [];

  const uploadOne = useCallback(async (file) => {
    if (!ACCEPT.includes(file.type)) { toast.error(`${file.name}: only JPG, PNG or WebP`); return null; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { toast.error(`${file.name}: must be under ${MAX_SIZE_MB}MB`); return null; }
    const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setUploads((u) => [...u, { id, progress: 8, error: false }]);
    const tick = setInterval(() => {
      setUploads((u) => u.map((x) => (x.id === id && x.progress < 88 ? { ...x, progress: x.progress + 9 } : x)));
    }, 200);
    try {
      const dataUrl = await compressImage(file);
      const hosted = await uploadFn(dataUrl);
      clearInterval(tick);
      setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: 100 } : x)));
      setTimeout(() => setUploads((u) => u.filter((x) => x.id !== id)), 500);
      return hosted;
    } catch (e) {
      clearInterval(tick);
      setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: true } : x)));
      setTimeout(() => setUploads((u) => u.filter((x) => x.id !== id)), 2500);
      toast.error(`Could not upload ${file.name}`);
      return null;
    }
  }, [uploadFn]);

  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const room = max - images.length;
    if (room <= 0) { toast.error(`Maximum ${max} images`); return; }
    const batch = files.slice(0, room);
    if (files.length > room) toast.error(`Only ${room} more image(s) allowed (max ${max})`);
    const results = await Promise.all(batch.map(uploadOne));
    const added = results.filter(Boolean);
    if (added.length) onChange([...images, ...added]);
  }, [images, max, onChange, uploadOne]);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeAt = (idx) => onChange(images.filter((_, i) => i !== idx));
  const makePrimary = (idx) => {
    if (idx === 0) return;
    const next = [...images];
    const [it] = next.splice(idx, 1);
    next.unshift(it);
    onChange(next);
  };
  const triggerReplace = (idx) => { replaceIndexRef.current = idx; replaceInputRef.current?.click(); };
  const handleReplace = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || replaceIndexRef.current == null) return;
    const hosted = await uploadOne(file);
    if (hosted) {
      const next = [...images];
      next[replaceIndexRef.current] = hosted;
      onChange(next);
    }
    replaceIndexRef.current = null;
  };

  const canAddMore = images.length < max && !disabled;

  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#9B8B7A" }}>
          Product Images <span style={{ color: "#8B3A3A" }}>*</span>
        </p>
        <span className="text-[11px]" style={{ color: "#9B8B7A" }}>{images.length}/{max}</span>
      </div>

      {/* Dropzone */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition mb-3"
          style={{ borderColor: dragging ? "#C9A84C" : "#E8E4DF", backgroundColor: dragging ? "rgba(201,168,76,0.06)" : "#FAFAF8" }}
        >
          <Upload size={22} className="mx-auto mb-1.5" style={{ color: "#C9A84C" }} />
          <p className="text-sm font-medium" style={{ color: "#6B5E52" }}>
            Drag & drop images, or click to browse
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#9B8B7A" }}>
            Up to {max} images · JPG, PNG, WebP · max {MAX_SIZE_MB}MB each · auto-compressed
          </p>
          <input ref={inputRef} type="file" accept={ACCEPT.join(",")} multiple className="hidden"
            onChange={(e) => addFiles(e.target.files)} />
        </div>
      )}
      <input ref={replaceInputRef} type="file" accept={ACCEPT.join(",")} className="hidden" onChange={handleReplace} />

      {/* In-flight uploads */}
      <AnimatePresence>
        {uploads.map((u) => (
          <motion.div key={u.id}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-2">
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: u.error ? "#C0392B" : "#6B5E52" }}>
              {u.error ? <X size={13} /> : <Loader2 size={13} className="animate-spin" />}
              {u.error ? "Upload failed" : "Uploading & optimizing…"}
            </div>
            {!u.error && (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F0EBE3" }}>
                <motion.div className="h-full" style={{ background: "linear-gradient(90deg,#C9A84C,#A2466B)" }}
                  animate={{ width: `${u.progress}%` }} transition={{ duration: 0.2 }} />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Preview grid — drag to reorder */}
      {images.length > 0 ? (
        <Reorder.Group axis="y" values={images} onReorder={onChange} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((url, idx) => (
            <Reorder.Item key={url} value={url}
              className="relative rounded-xl overflow-hidden border group cursor-grab active:cursor-grabbing"
              style={{ borderColor: idx === 0 ? "#A2466B" : "#E8E4DF", background: "#F0EBE3" }}
              whileDrag={{ scale: 1.04, zIndex: 20, boxShadow: "0 12px 30px rgba(0,0,0,0.18)" }}>
              <div style={{ aspectRatio: "3/4" }}>
                <img src={url} alt={`Product ${idx + 1}`} loading="lazy" className="w-full h-full object-cover pointer-events-none"
                  onError={(e) => { e.target.style.opacity = 0.2; }} />
              </div>
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md text-white" style={{ background: "#A2466B" }}>
                  PRIMARY
                </span>
              )}
              <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center opacity-70"
                style={{ background: "rgba(0,0,0,0.35)" }} title="Drag to reorder">
                <GripVertical size={13} color="white" />
              </span>
              {/* Hover actions */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 p-2 opacity-0 group-hover:opacity-100 transition"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}>
                {idx !== 0 && (
                  <button type="button" title="Set as primary" onClick={() => makePrimary(idx)}
                    className="w-7 h-7 rounded-md bg-white flex items-center justify-center"><Star size={13} style={{ color: "#A2466B" }} /></button>
                )}
                <button type="button" title="Replace" onClick={() => triggerReplace(idx)}
                  className="w-7 h-7 rounded-md bg-white flex items-center justify-center"><RefreshCw size={13} style={{ color: "#2563EB" }} /></button>
                <button type="button" title="Delete" onClick={() => removeAt(idx)}
                  className="w-7 h-7 rounded-md bg-white flex items-center justify-center"><X size={13} style={{ color: "#C0392B" }} /></button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        uploads.length === 0 && (
          <div className="rounded-xl flex flex-col items-center justify-center gap-1.5 py-8"
            style={{ background: "#F5F1ED", border: "1px dashed #E8E4DF" }}>
            <ImageOff size={22} style={{ color: "#C9A84C" }} />
            <p className="text-xs" style={{ color: "#9B8B7A" }}>No images yet</p>
          </div>
        )
      )}
      {images.length > 1 && (
        <p className="text-[11px] mt-2" style={{ color: "#9B8B7A" }}>
          Drag to reorder · the first image is the primary shown on cards. Hover an image for options.
        </p>
      )}
    </div>
  );
}
