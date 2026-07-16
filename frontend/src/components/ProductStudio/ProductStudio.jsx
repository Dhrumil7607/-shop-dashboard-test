/**
 * ProductStudio.jsx — Premium Product Creation & Editing Studio
 *
 * A full-page, multi-section product editor used by both Admin and Seller.
 * All backend logic, APIs, and validation rules are preserved exactly.
 * Only the UI/UX is redesigned.
 *
 * Props:
 *   mode          "admin" | "seller"
 *   editProduct   object | null   (null = create new)
 *   shops         array           (admin only)
 *   storeId       string          (seller only)
 *   storeName     string          (seller only)
 *   adminKey      string          (admin only)
 *   onSave        (data) => void  called with validated form data
 *   onCancel      () => void
 */

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Save, Eye, Send, Package, Image as ImageIcon,
  Ruler, DollarSign, Truck, Tag, Star, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, X, Plus, Minus,
  Info, Sparkles, TrendingUp, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import MultiImageUploader from "@/components/ProductStudio/MultiImageUploader";
import AIModelGenerator from "@/components/ProductStudio/AIModelGenerator";
import AIVideoUploader from "@/components/ProductStudio/AIVideoUploader";
import { uploadImage as sellerUploadImage, adminUploadImage } from "@/lib/api";
import {
  ALL_CATEGORIES, getSizeType, getDefaultSizeOptions, parseSizeOptions,
  MENS_STANDARD_SIZES, MENS_NUMERIC_SIZES, WOMENS_STANDARD_SIZES, KIDS_SIZES,
} from "@/lib/sizeConfig";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  maroon:   "#8B3A3A",
  rose:     "#A2466B",
  gold:     "#C9A84C",
  espresso: "#2C241B",
  stone:    "#736B5E",
  muted:    "#9B8B7A",
  border:   "#E8E4DF",
  cream:    "#F0EBE3",
  ivory:    "#FAF9F6",
  surface:  "#FAFAF8",
};

const EMPTY = {
  shop_id: "", name: "", category: "", description: "",
  price: "", compare_at_price: "", stock: "",
  currency: "INR", image_url: "", hover_image_url: "",
  badge: "", is_featured: false, is_active: true,
  color: "", size_options: "", sku: "",
  ready_to_ship: false, status: "live", weight_grams: "", images: [],
  size_chart: null,
};

// Garment-measurement fields for the seller size catalogue, per body type.
const SIZE_CHART_FIELDS = {
  women: [["bust", "Bust"], ["waist", "Waist"], ["hip", "Hip"], ["shoulder", "Shoulder"], ["sleeve", "Sleeve"], ["length", "Length"]],
  men: [["chest", "Chest"], ["waist", "Waist"], ["hip", "Hip"], ["shoulder", "Shoulder"], ["sleeve", "Sleeve"], ["length", "Length"]],
  kids: [["chest", "Chest"], ["waist", "Waist"], ["hip", "Hip"], ["length", "Length"]],
};

function SizeChartEditor({ sizeType, sizeOptions, value, onChange }) {
  const labels = parseSizeOptions(sizeOptions);
  const type = ["men", "kids"].includes(sizeType) ? sizeType : "women";
  const fields = SIZE_CHART_FIELDS[type];
  const unit = value?.unit || "in";
  const bySize = {};
  (value?.sizes || []).forEach((r) => { if (r.size) bySize[r.size] = r; });

  if (!labels.length) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: C.cream }}>
        <Info size={14} style={{ color: C.muted }} />
        <p className="text-xs" style={{ color: C.muted }}>Select available sizes above to add garment measurements.</p>
      </div>
    );
  }

  const rebuild = (nextUnit, mutate) => {
    const sizes = labels.map((l) => {
      const row = { ...(bySize[l] || {}), size: l };
      if (mutate) mutate(l, row);
      return row;
    });
    onChange({ unit: nextUnit, sizes });
  };
  const update = (size, key, v) => rebuild(unit, (l, row) => {
    if (l === size) { if (v === "") delete row[key]; else row[key] = Number(v); }
  });

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: C.surface }}>
        <p className="text-[11px] font-semibold" style={{ color: C.stone }}>
          Garment measurements — powers AI “Find My Perfect Size”
        </p>
        <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: C.border }}>
          {["in", "cm"].map((u) => (
            <button key={u} type="button" onClick={() => rebuild(u)}
              className="px-2.5 py-1 text-[11px] font-semibold transition"
              style={{ background: unit === u ? C.espresso : "white", color: unit === u ? "white" : C.stone }}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: C.cream }}>
              <th className="px-2 py-2 text-left font-semibold" style={{ color: C.espresso }}>Size</th>
              {fields.map(([k, l]) => (
                <th key={k} className="px-2 py-2 text-left font-semibold whitespace-nowrap" style={{ color: C.espresso }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((size) => (
              <tr key={size} className="border-t" style={{ borderColor: C.border }}>
                <td className="px-2 py-1.5 font-bold" style={{ color: C.espresso }}>{size}</td>
                {fields.map(([k]) => (
                  <td key={k} className="px-1 py-1.5">
                    <input type="number" inputMode="decimal"
                      value={bySize[size]?.[k] ?? ""} onChange={(e) => update(size, k, e.target.value)}
                      placeholder="—"
                      className="w-16 rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-400"
                      style={{ borderColor: C.border }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 py-2 text-[10px]" style={{ color: C.muted }}>
        Enter finished garment measurements ({unit}). Leave blank if not applicable. The AI compares these to the customer’s body scan.
      </p>
    </div>
  );
}

// ── Shared input ──────────────────────────────────────────────────────────────
const Field = memo(({ label, hint, required, error, children }) => (
  <div className="space-y-1.5">
    {label && (
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: C.muted }}>
          {label}{required && <span style={{ color: C.maroon }}> *</span>}
        </label>
        {hint && (
          <span className="text-[10px]" style={{ color: C.muted }} title={hint}>
            <Info size={11} />
          </span>
        )}
      </div>
    )}
    {children}
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }} className="flex items-center gap-1 text-[11px] font-medium"
          style={{ color: "#C0392B" }}>
          <AlertTriangle size={11} />{error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
));

const inp = {
  base: `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200`,
  style: { borderColor: C.border, backgroundColor: "white", color: C.espresso },
  focus: "focus:ring-2 focus:ring-offset-0",
};

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, children, accent, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = accent || C.gold;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: C.border, backgroundColor: "white",
        boxShadow: "0 1px 2px rgba(44,36,27,0.04), 0 4px 16px rgba(44,36,27,0.04)" }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left transition hover:bg-stone-50/50">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: C.espresso }}>{title}</p>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{subtitle}</p>}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: C.muted }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            style={{ overflow: "hidden" }}>
            <div className="px-6 pb-6 pt-1 border-t" style={{ borderColor: C.border }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Live product preview card ─────────────────────────────────────────────────
function PreviewCard({ form, storeName }) {
  const discount = form.compare_at_price && Number(form.compare_at_price) > Number(form.price)
    ? Math.round(((Number(form.compare_at_price) - Number(form.price)) / Number(form.compare_at_price)) * 100)
    : null;
  const stock = Number(form.stock) || 0;
  const lowStock = stock > 0 && stock <= 5;

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ borderColor: C.border, backgroundColor: "white",
        boxShadow: "0 4px 24px rgba(44,36,27,0.08)" }}>
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: C.cream }}>
        {form.image_url ? (
          <img src={form.image_url} alt="" className="w-full h-full object-cover"
            onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <ImageIcon size={28} style={{ color: C.border }} />
            <p className="text-[10px]" style={{ color: C.muted }}>No image yet</p>
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {form.badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
              style={{ backgroundColor: C.maroon }}>{form.badge}</span>
          )}
          {form.ready_to_ship && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
              style={{ backgroundColor: "#2D7A3A" }}>Ready to Ship</span>
          )}
          {lowStock && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: "rgba(192,57,43,0.12)", color: "#C0392B" }}>
              Only {stock} left
            </span>
          )}
        </div>
        {discount && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: "#1a1a1a", color: "white" }}>−{discount}%</span>
        )}
        {stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "rgba(250,249,246,0.6)" }}>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "#1a1a1a", color: "white" }}>Out of Stock</span>
          </div>
        )}
        {form.is_featured && (
          <div className="absolute bottom-2 right-2">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(201,168,76,0.2)", color: C.gold }}>
              ✦ Featured
            </span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: C.gold }}>
          {form.category || "Category"}
        </p>
        <p className="font-serif text-base leading-snug mb-1 line-clamp-2"
          style={{ color: C.espresso, fontWeight: 400 }}>
          {form.name || "Product Name"}
        </p>
        {storeName && (
          <p className="text-[10px] mb-2" style={{ color: C.muted }}>{storeName}</p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold" style={{ color: C.espresso }}>
            {form.price ? `₹${Number(form.price).toLocaleString("en-IN")}` : "₹0"}
          </span>
          {form.compare_at_price && Number(form.compare_at_price) > Number(form.price) && (
            <span className="text-[11px] line-through" style={{ color: C.muted }}>
              ₹{Number(form.compare_at_price).toLocaleString("en-IN")}
            </span>
          )}
        </div>
        {form.size_options && (
          <p className="text-[10px] mt-1.5" style={{ color: C.muted }}>
            Sizes: {form.size_options.split(",").slice(0,4).join(", ")}{form.size_options.split(",").length > 4 ? "…" : ""}
          </p>
        )}
      </div>
      <div className="px-3.5 pb-3.5">
        <p className="text-[9px] uppercase tracking-[0.12em] font-semibold"
          style={{ color: form.status === "live" ? "#2D7A3A" : form.status === "hidden" ? C.muted : "#1B2A6B" }}>
          {form.status === "live" ? "● Live" : form.status === "hidden" ? "○ Hidden" : "○ Draft"}
        </p>
      </div>
    </div>
  );
}

// ── Size chips ────────────────────────────────────────────────────────────────
function SizeChips({ sizeType, category, value, onChange }) {
  if (sizeType === "none") return (
    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: C.cream }}>
      <CheckCircle2 size={14} style={{ color: "#2D7A3A" }} />
      <p className="text-xs" style={{ color: C.stone }}>
        Free size — no size selection needed for this category.
      </p>
    </div>
  );
  const presets = sizeType === "men"
    ? (["sherwani","kurta","shirt","jacket","blazer"].some(k => category.toLowerCase().includes(k)) ? MENS_NUMERIC_SIZES : MENS_STANDARD_SIZES)
    : sizeType === "kids" ? KIDS_SIZES : WOMENS_STANDARD_SIZES;
  const current = value.split(",").map(s => s.trim()).filter(Boolean);
  const allSelected = presets.every(s => current.includes(s));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map(size => {
          const active = current.includes(size);
          return (
            <motion.button key={size} type="button"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => {
                const next = active ? current.filter(s => s !== size) : [...current, size];
                onChange(next.join(","));
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
              style={{
                backgroundColor: active ? C.maroon : "white",
                color: active ? "white" : C.stone,
                borderColor: active ? C.maroon : C.border,
                boxShadow: active ? `0 4px 12px rgba(139,58,58,0.25)` : "none",
              }}>
              {size}
            </motion.button>
          );
        })}
        <button type="button" onClick={() => onChange(allSelected ? "" : presets.join(","))}
          className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
          style={{ borderColor: C.border, color: C.muted, backgroundColor: C.cream }}>
          {allSelected ? "Clear" : "All"}
        </button>
      </div>
      <div>
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder={sizeType === "women"
            ? "Or enter custom sizes e.g. 32,34,36 or XS,S,M,L,Free Size"
            : "Or enter custom sizes separated by commas"}
          className={`${inp.base} text-xs`} style={inp.style} />
        {sizeType === "women" && (
          <p className="text-[10px] mt-1.5" style={{ color: C.muted }}>
            Women's: use standard sizes above or enter custom measurements (bust inches, waist, etc.)
          </p>
        )}
      </div>
    </div>
  );
}

// ── Color tag input ───────────────────────────────────────────────────────────
function ColorTags({ value, onChange }) {
  const [input, setInput] = useState("");
  const tags = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!tags.includes(v)) onChange([...tags, v].join(","));
    setInput("");
  };
  const remove = (tag) => onChange(tags.filter(t => t !== tag).join(","));
  const SUGGESTIONS = ["Red","Ivory","Navy","Gold","Emerald","Maroon","Black","White","Blush","Royal Blue","Mustard","Peach"];
  const unusedSuggestions = SUGGESTIONS.filter(s => !tags.includes(s));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-xl border"
        style={{ borderColor: C.border, backgroundColor: "white" }}>
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: C.cream, color: C.espresso }}>
            {tag}
            <button type="button" onClick={() => remove(tag)}
              className="hover:text-red-500 transition-colors"><X size={10} /></button>
          </span>
        ))}
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } if (e.key === ",") { e.preventDefault(); add(); } }}
          placeholder={tags.length === 0 ? "Type a colour and press Enter…" : "Add another…"}
          className="flex-1 min-w-[120px] px-1 py-0.5 text-xs outline-none bg-transparent"
          style={{ color: C.espresso }} />
      </div>
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px]" style={{ color: C.muted }}>Quick add:</span>
          {unusedSuggestions.slice(0, 8).map(s => (
            <button key={s} type="button" onClick={() => onChange([...tags, s].join(","))}
              className="text-[10px] px-2 py-0.5 rounded-full border transition hover:bg-stone-100"
              style={{ borderColor: C.border, color: C.muted }}>+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profit calculator ─────────────────────────────────────────────────────────
const PLATFORM_FEE_RATE = 0.12; // 12% marketplace commission per product

function ProfitCalculator({ price, comparePrice }) {
  const p = Number(price) || 0;
  const c = Number(comparePrice) || 0;
  const platform = Math.round(p * PLATFORM_FEE_RATE); // 12% platform fee
  const payout = p - platform;

  if (!p) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      className="rounded-xl p-4 mt-3 space-y-2"
      style={{ backgroundColor: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.2)` }}>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.gold }}>
        Earnings Estimate (per unit)
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "You Earn", value: `₹${payout.toLocaleString("en-IN")}`, color: "#2D7A3A" },
          { label: "Platform Fee 12%", value: `−₹${platform.toLocaleString("en-IN")}`, color: C.muted },
          { label: c > 0 ? `Discount ${Math.round(((c-p)/c)*100)}%` : "No Discount", value: c > 0 ? `-₹${(c-p).toLocaleString("en-IN")}` : "—", color: c > 0 ? C.maroon : C.muted },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className="text-base font-bold" style={{ color }}>{value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main ProductStudio component ──────────────────────────────────────────────
export default function ProductStudio({
  mode = "seller",
  editProduct = null,
  shops = [],
  storeId = "",
  storeName = "",
  adminKey = "",
  onSave,
  onCancel,
}) {
  const isEdit = !!editProduct;
  const accentColor = mode === "admin" ? C.maroon : C.rose;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => {
    if (!editProduct) return { ...EMPTY, shop_id: storeId };
    // Back-compat: derive the images[] gallery from an older single-image product.
    const derived = Array.isArray(editProduct.images) && editProduct.images.length
      ? editProduct.images
      : [editProduct.image_url, editProduct.hover_image_url].filter(Boolean);
    return { ...EMPTY, ...editProduct, images: derived };
  });

  // Upload handler routes to the admin or seller endpoint (both Cloudinary-backed).
  const uploadFn = useCallback(async (dataUrl) => {
    return mode === "admin"
      ? await adminUploadImage(dataUrl, adminKey)
      : await sellerUploadImage(dataUrl);
  }, [mode, adminKey]);

  const set = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  }, [errors]);

  const sizeType = getSizeType(form.category);

  // Auto-fill sizes when category changes (new products only)
  useEffect(() => {
    if (!isEdit && form.category) {
      set("size_options", getDefaultSizeOptions(form.category));
    }
  }, [form.category]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave draft to localStorage every 30s
  useEffect(() => {
    const key = `studio_draft_${mode}`;
    const t = setInterval(() => {
      try { localStorage.setItem(key, JSON.stringify(form)); } catch {}
    }, 30000);
    return () => clearInterval(t);
  }, [form, mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit("draft");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validation
  const validate = (status) => {
    const errs = {};
    if (mode === "admin" && !form.shop_id) errs.shop_id = "Please select a shop";
    if (!form.name?.trim()) errs.name = "Product name is required";
    if (!form.category) errs.category = "Please select a category";
    if (!form.price || Number(form.price) <= 0) errs.price = "Price must be greater than 0";
    if (!(form.images && form.images.length) && !form.image_url) errs.image_url = "Please upload at least one product image";
    if (!form.description?.trim() || form.description.trim().length < 10) errs.description = "Description must be at least 10 characters";
    if (form.stock === "" || form.stock === undefined) errs.stock = "Stock quantity is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (statusOverride) => {
    const finalStatus = statusOverride || form.status || "live";
    if (finalStatus !== "draft" && !validate(finalStatus)) {
      toast.error("Please fix the errors before publishing");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: form.name?.trim(),
        category: form.category,
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
        description: form.description?.trim(),
        stock: Number(form.stock) || 0,
        sku: form.sku || "",
        color: form.color || "",
        size_options: form.size_options || "",
        size_chart: (form.size_chart && Array.isArray(form.size_chart.sizes)
          && form.size_chart.sizes.some(r => ["bust","chest","waist","hip","shoulder","sleeve","length"].some(k => r[k] != null)))
          ? form.size_chart : null,
        weight_grams: form.weight_grams ? Number(form.weight_grams) : 0,
        images: form.images || [],
        image_url: (form.images && form.images[0]) || form.image_url,
        hover_image_url: (form.images && form.images[1]) || form.hover_image_url || "",
        badge: form.badge || "",
        is_featured: !!form.is_featured,
        ready_to_ship: !!form.ready_to_ship,
        currency: form.currency || "INR",
        shop_id: mode === "admin" ? form.shop_id : storeId,
        shop_name: mode === "admin" ? (shops.find(s => s.id === form.shop_id)?.name || "") : storeName,
        is_active: finalStatus === "live",
        status: finalStatus,
      });
      try { localStorage.removeItem(`studio_draft_${mode}`); } catch {}
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  const displayStoreName = mode === "admin"
    ? (shops.find(s => s.id === form.shop_id)?.name || "Select a store")
    : storeName;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.ivory }}>
      {/* ── Sticky Header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: "rgba(250,249,246,0.92)", borderColor: C.border,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 1px 0 rgba(44,36,27,0.06), 0 4px 16px rgba(44,36,27,0.04)" }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left — title */}
          <div className="flex items-center gap-3 min-w-0">
            <motion.button type="button" onClick={onCancel}
              whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 text-sm transition"
              style={{ color: C.muted }}>
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </motion.button>
            <div className="w-px h-5" style={{ backgroundColor: C.border }} />
            <div className="min-w-0">
              <h1 className="font-serif text-lg leading-tight truncate"
                style={{ color: C.espresso, fontWeight: 400 }}>
                {isEdit ? "Edit Product" : "Create New Product"}
              </h1>
              <p className="text-[11px] hidden sm:block" style={{ color: C.muted }}>
                {isEdit ? "Update your listing" : "Create a premium fashion listing"}
                {" · "}
                <kbd className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: C.cream, color: C.muted }}>Ctrl+S</kbd>
                {" "} to save draft
              </p>
            </div>
          </div>
          {/* Right — action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button type="button" onClick={() => handleSubmit("draft")}
              disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition disabled:opacity-50"
              style={{ borderColor: C.border, color: C.stone, backgroundColor: "white" }}>
              <Save size={13} />
              <span className="hidden sm:inline">Save Draft</span>
            </motion.button>
            <motion.button type="button" onClick={() => handleSubmit("live")}
              disabled={saving}
              whileHover={{ scale: 1.02, boxShadow: `0 8px 24px rgba(139,58,58,0.3)` }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-50"
              style={{ backgroundColor: accentColor }}>
              {saving
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={13} />}
              <span className="hidden sm:inline">{saving ? "Saving…" : isEdit ? "Update" : "Publish"}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6 items-start">

          {/* ── LEFT: Main editor (70%) ────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Admin shop selector */}
            {mode === "admin" && (
              <Section icon={Tag} title="Store Assignment" subtitle="Which store does this product belong to?" accent={C.gold}>
                <div className="mt-4">
                  <Field label="Store" required error={errors.shop_id}>
                    <select value={form.shop_id} onChange={e => set("shop_id", e.target.value)}
                      className={`${inp.base}`} style={inp.style}>
                      <option value="">Select a shop</option>
                      {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                  {shops.length === 0 && (
                    <p className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: "#C0392B" }}>
                      <AlertTriangle size={12} /> No shops found. Create a shop first.
                    </p>
                  )}
                </div>
              </Section>
            )}

            {/* Section 1: Product Information */}
            <Section icon={Package} title="Product Information" subtitle="Name, category, description and details" accent={accentColor}>
              <div className="space-y-5 mt-4">
                {/* Name */}
                <Field label="Product Name" required error={errors.name}>
                  <div className="relative">
                    <input value={form.name} onChange={e => set("name", e.target.value)}
                      placeholder="e.g. Maharani Bridal Lehenga with Mirror Work"
                      maxLength={120}
                      className={`${inp.base} pr-16`} style={inp.style} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                      style={{ color: form.name.length > 100 ? "#C0392B" : C.muted }}>
                      {form.name.length}/120
                    </span>
                  </div>
                </Field>

                {/* Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Category" required error={errors.category}>
                    <select value={form.category} onChange={e => set("category", e.target.value)}
                      className={inp.base} style={inp.style}>
                      <option value="">Select category</option>
                      {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {form.category && (
                      <p className="flex items-center gap-1 text-[10px] mt-1.5" style={{ color: sizeType === "none" ? "#2D7A3A" : C.gold }}>
                        <CheckCircle2 size={11} />
                        {sizeType === "none" ? "Free size — no size picker needed" :
                         sizeType === "men" ? "Men's sizing — XS–XXL or numeric" :
                         sizeType === "women" ? "Women's — standard or custom measurements" : "Kids sizing"}
                      </p>
                    )}
                  </Field>
                  <Field label="SKU / Reference Code">
                    <input value={form.sku} onChange={e => set("sku", e.target.value)}
                      placeholder="e.g. LHG-001-RED (optional)" className={inp.base} style={inp.style} />
                  </Field>
                </div>

                {/* Description */}
                <Field label="Description" required error={errors.description}
                  hint="Describe fabric, occasion, care instructions, and what makes this product special">
                  <textarea value={form.description} onChange={e => set("description", e.target.value)}
                    placeholder="Crafted from pure Banarasi silk with hand-embroidered zardozi work. Perfect for weddings and festive occasions. Includes matching dupatta and unstitched blouse piece. Dry clean recommended."
                    rows={5} className={`${inp.base} resize-none`} style={inp.style} />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px]" style={{ color: form.description.length < 10 ? "#C0392B" : "#2D7A3A" }}>
                      {form.description.length < 10
                        ? `${10 - form.description.length} more characters needed`
                        : `✓ ${form.description.length} characters`}
                    </p>
                  </div>
                </Field>

                {/* Badge */}
                <Field label="Product Badge" hint="Short label shown as a coloured tag on the product card">
                  <div className="flex flex-wrap gap-2">
                    {["New Arrival", "Bestseller", "Sale", "Limited Edition", "Trending", "Exclusive"].map(b => (
                      <button key={b} type="button" onClick={() => set("badge", form.badge === b ? "" : b)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
                        style={{
                          backgroundColor: form.badge === b ? accentColor : "white",
                          color: form.badge === b ? "white" : C.stone,
                          borderColor: form.badge === b ? accentColor : C.border,
                        }}>
                        {b}
                      </button>
                    ))}
                    <input value={form.badge} onChange={e => set("badge", e.target.value)}
                      placeholder="Custom badge…"
                      className="px-3 py-1.5 rounded-xl text-xs border flex-1 min-w-[120px] outline-none"
                      style={{ borderColor: C.border, color: C.espresso }} />
                  </div>
                </Field>
              </div>
            </Section>

            {/* Section 2: Media */}
            <Section icon={ImageIcon} title="Media" subtitle="Upload up to 20 images · drag to reorder · first is primary" accent="#2563EB">
              <div className="mt-4">
                {errors.image_url && (
                  <p className="flex items-center gap-1 text-[11px] mb-2 font-medium" style={{ color: "#C0392B" }}>
                    <AlertTriangle size={11} />{errors.image_url}
                  </p>
                )}
                <MultiImageUploader
                  value={form.images}
                  onChange={(urls) => {
                    setForm(f => ({ ...f, images: urls, image_url: urls[0] || "", hover_image_url: urls[1] || "" }));
                    if (errors.image_url) setErrors(e => ({ ...e, image_url: null }));
                  }}
                  uploadFn={uploadFn}
                  max={20}
                />
              </div>

              {/* AI Model Generator — seller only, needs a primary image */}
              {mode === "seller" && (
                <AIModelGenerator
                  primaryImage={form.image_url}
                  productId={editProduct?.id || ""}
                  onSetCover={url => set("image_url", url)}
                />
              )}

              {/* Private AI Try-On Data (360° video) — seller only */}
              {mode === "seller" && (
                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
                    AI Try-On Data (Optional)
                  </p>
                  <AIVideoUploader productId={editProduct?.id || ""} />
                </div>
              )}
            </Section>

            {/* Section 3: Pricing */}
            <Section icon={DollarSign} title="Pricing" subtitle="Selling price, MRP and earnings" accent="#2D7A3A">
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Selling Price (₹)" required error={errors.price}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold"
                        style={{ color: C.muted }}>₹</span>
                      <input type="number" min="1" value={form.price}
                        onChange={e => set("price", e.target.value)}
                        placeholder="2999" className={`${inp.base} pl-8`} style={inp.style} />
                    </div>
                  </Field>
                  <Field label="MRP / Compare Price (₹)" hint="Original price shown as strikethrough">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold"
                        style={{ color: C.muted }}>₹</span>
                      <input type="number" min="0" value={form.compare_at_price || ""}
                        onChange={e => set("compare_at_price", e.target.value || "")}
                        placeholder="3999 (shows strikethrough)" className={`${inp.base} pl-8`} style={inp.style} />
                    </div>
                  </Field>
                </div>
                <ProfitCalculator price={form.price} comparePrice={form.compare_at_price} />
              </div>
            </Section>

            {/* Section 4: Sizes & Colours */}
            <Section icon={Ruler} title="Variants & Sizes" subtitle="Available sizes and colour options" accent={C.gold}>
              <div className="space-y-5 mt-4">
                {form.category ? (
                  <>
                    <Field label={sizeType === "none" ? "Size Info" : `Available Sizes — ${sizeType === "men" ? "Men's" : sizeType === "women" ? "Women's" : "Kids"}`}>
                      <SizeChips sizeType={sizeType} category={form.category}
                        value={form.size_options} onChange={v => set("size_options", v)} />
                    </Field>
                    {sizeType !== "none" && (
                      <Field label="Size Chart (for AI recommendations)" hint="Optional but recommended — lets customers get an AI-matched size">
                        <SizeChartEditor sizeType={sizeType} sizeOptions={form.size_options}
                          value={form.size_chart} onChange={v => set("size_chart", v)} />
                      </Field>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: C.cream }}>
                    <Info size={14} style={{ color: C.muted }} />
                    <p className="text-xs" style={{ color: C.muted }}>Select a category above to configure sizes.</p>
                  </div>
                )}
                <Field label="Colours Available" hint="Enter each colour name — customers will see these as swatches">
                  <ColorTags value={form.color} onChange={v => set("color", v)} />
                </Field>
              </div>
            </Section>

            {/* Section 5: Inventory */}
            <Section icon={TrendingUp} title="Inventory & Shipping" subtitle="Stock quantity and dispatch details" accent="#1B2A6B">
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Stock Quantity" required error={errors.stock}>
                    <div className="flex items-center">
                      <button type="button" onClick={() => set("stock", Math.max(0, (Number(form.stock) || 0) - 1))}
                        className="w-11 h-11 flex items-center justify-center rounded-l-xl border border-r-0 transition hover:bg-stone-50"
                        style={{ borderColor: C.border }}>
                        <Minus size={14} style={{ color: C.stone }} />
                      </button>
                      <input type="number" min="0" value={form.stock}
                        onChange={e => set("stock", e.target.value)}
                        className="w-full h-11 text-center border-t border-b text-sm font-semibold outline-none"
                        style={{ borderColor: C.border, color: C.espresso }} />
                      <button type="button" onClick={() => set("stock", (Number(form.stock) || 0) + 1)}
                        className="w-11 h-11 flex items-center justify-center rounded-r-xl border border-l-0 transition hover:bg-stone-50"
                        style={{ borderColor: C.border }}>
                        <Plus size={14} style={{ color: C.stone }} />
                      </button>
                    </div>
                    {Number(form.stock) > 0 && Number(form.stock) <= 5 && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-center gap-1 text-[11px] mt-2 font-semibold"
                        style={{ color: "#C0392B" }}>
                        <AlertTriangle size={11} /> Only {form.stock} left — low stock badge will show on frontend
                      </motion.p>
                    )}
                    {(Number(form.stock) === 0 || form.stock === "") && (
                      <p className="text-[11px] mt-2" style={{ color: "#9B7520" }}>
                        ⚠ Product will show as Out of Stock
                      </p>
                    )}
                    <div className="mt-4">
                      <Field label="Shipping Weight (grams)" hint="Used to calculate international shipping. Leave blank to auto-estimate from the category.">
                        <input type="number" min="0" value={form.weight_grams}
                          onChange={e => set("weight_grams", e.target.value)}
                          placeholder="e.g. 800 (leave blank to auto-estimate)"
                          className={inp.base} style={inp.style} />
                        <p className="text-[11px] mt-1.5" style={{ color: C.muted }}>
                          Accurate weight = accurate shipping charges for overseas customers.
                        </p>
                      </Field>
                    </div>
                  </Field>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer hover:bg-stone-50"
                      style={{ borderColor: form.ready_to_ship ? "#2D7A3A" : C.border,
                        backgroundColor: form.ready_to_ship ? "rgba(45,122,58,0.04)" : "white" }}
                      onClick={() => set("ready_to_ship", !form.ready_to_ship)}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: C.espresso }}>Ready to Ship</p>
                        <p className="text-[11px]" style={{ color: C.muted }}>Dispatches within 24–48 hrs</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-all flex items-center ${form.ready_to_ship ? "pl-4" : "pl-0.5"}`}
                        style={{ backgroundColor: form.ready_to_ship ? "#2D7A3A" : C.border }}>
                        <div className="w-5 h-5 rounded-full bg-white shadow transition-all" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer hover:bg-stone-50"
                      style={{ borderColor: form.is_featured ? C.gold : C.border,
                        backgroundColor: form.is_featured ? "rgba(201,168,76,0.04)" : "white" }}
                      onClick={() => set("is_featured", !form.is_featured)}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: C.espresso }}>Featured Product</p>
                        <p className="text-[11px]" style={{ color: C.muted }}>Highlighted in collections</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-all flex items-center ${form.is_featured ? "pl-4" : "pl-0.5"}`}
                        style={{ backgroundColor: form.is_featured ? C.gold : C.border }}>
                        <div className="w-5 h-5 rounded-full bg-white shadow transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

          </div>

          {/* ── RIGHT: Preview + Publishing (30%) ─────────────────────────── */}
          <div className="hidden lg:flex flex-col gap-4 w-[320px] flex-shrink-0">

            {/* Live preview */}
            <div className="sticky top-[72px] space-y-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2.5 flex items-center gap-1.5"
                  style={{ color: C.muted }}>
                  <Sparkles size={12} style={{ color: C.gold }} /> Live Preview
                </p>
                <PreviewCard form={form} storeName={displayStoreName} />
              </div>

              {/* Publishing panel */}
              <div className="rounded-2xl border overflow-hidden"
                style={{ borderColor: C.border, backgroundColor: "white",
                  boxShadow: "0 1px 2px rgba(44,36,27,0.04), 0 4px 16px rgba(44,36,27,0.04)" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
                  <p className="text-xs font-semibold" style={{ color: C.espresso }}>
                    <ShieldCheck size={13} className="inline mr-1.5" style={{ color: C.gold }} />
                    Visibility
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { value: "live", label: "Live", desc: "Visible to all customers", color: "#2D7A3A" },
                    { value: "hidden", label: "Hidden", desc: "Not visible publicly", color: C.muted },
                    { value: "draft", label: "Draft", desc: "Save for later", color: "#1B2A6B" },
                  ].map(opt => (
                    <label key={opt.value}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:bg-stone-50"
                      style={{
                        backgroundColor: form.status === opt.value ? `${opt.color}08` : "transparent",
                        border: `1px solid ${form.status === opt.value ? opt.color + "40" : "transparent"}`,
                      }}>
                      <input type="radio" name="status" value={opt.value}
                        checked={form.status === opt.value}
                        onChange={() => set("status", opt.value)}
                        className="sr-only" />
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: form.status === opt.value ? opt.color : C.border }}>
                        {form.status === opt.value && (
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: form.status === opt.value ? opt.color : C.espresso }}>
                          {opt.label}
                        </p>
                        <p className="text-[10px]" style={{ color: C.muted }}>{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <motion.button type="button" onClick={() => handleSubmit("live")}
                    disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}>
                    {saving ? "Saving…" : isEdit ? "Update Product" : "Publish Product"}
                  </motion.button>
                  <button type="button" onClick={() => handleSubmit("draft")}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold border transition disabled:opacity-50 hover:bg-stone-50"
                    style={{ borderColor: C.border, color: C.stone }}>
                    Save as Draft
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl border p-4" style={{ borderColor: C.border, backgroundColor: C.cream }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: C.gold }}>
                  ✦ Pro Tips
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Use natural lighting for product photos",
                    "Include fabric & care instructions",
                    "Add all available sizes for more sales",
                    "Set a compare price to show discounts",
                    "Ready-to-ship products rank higher",
                  ].map((tip, i) => (
                    <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: C.stone }}>
                      <span style={{ color: C.gold }}>·</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile-only bottom action bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex gap-3 px-4 py-3 border-t"
          style={{ backgroundColor: "rgba(250,249,246,0.95)", borderColor: C.border,
            backdropFilter: "blur(12px)" }}>
          <button type="button" onClick={() => handleSubmit("draft")} disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border transition disabled:opacity-50"
            style={{ borderColor: C.border, color: C.stone, backgroundColor: "white" }}>
            Save Draft
          </button>
          <motion.button type="button" onClick={() => handleSubmit("live")} disabled={saving}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
            style={{ backgroundColor: accentColor }}>
            {saving ? "Saving…" : isEdit ? "Update" : "Publish"}
          </motion.button>
        </div>
        <div className="h-20 lg:hidden" /> {/* spacer for mobile action bar */}
      </div>
    </div>
  );
}
