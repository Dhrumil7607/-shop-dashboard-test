/**
 * SellerProducts.jsx — /seller/products
 * Seller product management: list, add, edit, archive/unarchive, live toggle.
 */

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Archive, Eye, EyeOff, Search, Package,
  Edit3, Trash2, CheckCircle2, AlertTriangle, X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getSellerProducts, sellerCreateProduct, sellerUpdateProduct, sellerDeleteProduct } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import {
  ALL_CATEGORIES, getSizeType, getDefaultSizeOptions,
  MENS_STANDARD_SIZES, MENS_NUMERIC_SIZES, WOMENS_STANDARD_SIZES, KIDS_SIZES
} from "@/lib/sizeConfig";

const inp = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-maroon transition";
const lbl = "block text-xs font-semibold uppercase tracking-wider mb-1.5" ;

const STATUS_BADGE = {
  live:         { label: "Live",         bg: "rgba(45,122,58,0.1)",  text: "#2D7A3A" },
  hidden:       { label: "Hidden",       bg: "rgba(155,139,122,0.12)", text: "#6B5E52" },
  out_of_stock: { label: "Out of Stock", bg: "rgba(201,168,76,0.15)", text: "#9B7520" },
  draft:        { label: "Draft",        bg: "rgba(27,42,107,0.1)",  text: "#1B2A6B" },
};

// ── Size selector chips (reused from admin) ───────────────────────────────────
function SizeChips({ sizeType, category, value, onChange }) {
  if (sizeType === "none") return (
    <p className="text-xs italic" style={{ color: "#9B8B7A" }}>No size needed — free size / one size fits all.</p>
  );
  let presets = [];
  if (sizeType === "men") {
    const lower = (category || "").toLowerCase();
    const isNumeric = ["sherwani","kurta","shirt","jacket","blazer"].some(k => lower.includes(k));
    presets = isNumeric ? MENS_NUMERIC_SIZES : MENS_STANDARD_SIZES;
  } else if (sizeType === "women") {
    presets = WOMENS_STANDARD_SIZES;
  } else if (sizeType === "kids") {
    presets = KIDS_SIZES;
  }
  const current = value.split(",").map(s => s.trim()).filter(Boolean);
  const allSelected = presets.every(s => current.includes(s));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {presets.map(size => {
          const active = current.includes(size);
          return (
            <button key={size} type="button"
              onClick={() => {
                const next = active ? current.filter(s => s !== size) : [...current, size];
                onChange(next.join(","));
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition"
              style={{ backgroundColor: active ? "#A2466B" : "white", color: active ? "white" : "#6B5E52", borderColor: active ? "#A2466B" : "#E8E4DF" }}>
              {size}
            </button>
          );
        })}
        <button type="button"
          onClick={() => onChange(allSelected ? "" : presets.join(","))}
          className="px-3 py-1 rounded-full text-xs border transition"
          style={{ backgroundColor: "#F0EBE3", color: "#6B5E52", borderColor: "#E8E4DF" }}>
          {allSelected ? "Clear All" : "Select All"}
        </button>
      </div>
      {sizeType === "women" ? (
        <>
          <input value={value} onChange={e => onChange(e.target.value)}
            placeholder="Or enter custom sizes e.g. 32,34,36 or XS,S,M,L,Free Size"
            className={inp + " text-xs"} style={{ borderColor: "#E8E4DF" }} />
          <p className="text-[10px]" style={{ color: "#9B8B7A" }}>
            Women's sizing: use standard sizes above OR enter custom measurements (bust size in inches, waist, etc.)
          </p>
        </>
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="Or type custom sizes separated by commas"
          className={inp + " text-xs"} style={{ borderColor: "#E8E4DF" }} />
      )}
    </div>
  );
}

// ── Add / Edit Product Modal ───────────────────────────────────────────────────
function ProductModal({ onClose, onSave, storeId, storeName, editProduct }) {
  const isEdit = !!editProduct;
  const [form, setForm] = useState(editProduct ? { ...editProduct } : {
    name: "", category: "", price: "", compare_at_price: "",
    description: "", stock: "", sku: "", color: "", size_options: "",
    image_url: "", hover_image_url: "", badge: "", ready_to_ship: false, status: "live",
  });

  const sizeType = getSizeType(form.category);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill sizes when category changes (only on new product)
  const handleCategoryChange = (cat) => {
    set("category", cat);
    if (!isEdit) set("size_options", getDefaultSizeOptions(cat));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast.error("Product name is required"); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error("Price must be greater than 0"); return; }
    if (!form.image_url) { toast.error("Please upload a product image"); return; }
    if (!form.description?.trim()) { toast.error("Description is required"); return; }
    if (!form.category) { toast.error("Please select a category"); return; }
    if (form.stock === "" || form.stock === undefined) { toast.error("Stock quantity is required"); return; }
    onSave({
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
      description: form.description.trim(),
      stock: Number(form.stock) || 0,
      sku: form.sku || "",
      color: form.color || "",
      size_options: form.size_options || "",
      image_url: form.image_url,
      hover_image_url: form.hover_image_url || "",
      badge: form.badge || "",
      ready_to_ship: !!form.ready_to_ship,
      shop_id: storeId,
      shop_name: storeName,
      is_active: form.status === "live",
      status: form.status || "live",
    });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-2xl p-6" style={{ backgroundColor: "white", maxHeight: "90vh", overflowY: "auto" }}>

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-xl" style={{ color: "#1a1a1a" }}>{isEdit ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Product Image */}
            <div className="sm:col-span-2 rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
              <ImageUpload label="Product Image *" hint="Main image shown on marketplace"
                value={form.image_url} onUpload={url => set("image_url", url)} />
            </div>

            {/* Hover Image */}
            <div className="sm:col-span-2 rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
              <ImageUpload label="Hover Image (optional)" hint="Shown when customer hovers over product card"
                value={form.hover_image_url} onUpload={url => set("hover_image_url", url)} />
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label className={lbl} style={{ color: "#9B8B7A" }}>Product Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. Maharani Bridal Lehenga" required className={inp} style={{ borderColor: "#E8E4DF" }} />
            </div>

            {/* Category */}
            <div>
              <label className={lbl} style={{ color: "#9B8B7A" }}>Category *</label>
              <select value={form.category} onChange={e => handleCategoryChange(e.target.value)} required
                className={inp} style={{ borderColor: "#E8E4DF" }}>
                <option value="">Select category</option>
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {form.category && (
                <p className="text-[10px] mt-1" style={{ color: "#9B8B7A" }}>
                  {sizeType === "none" ? "✓ Free size / no size selection needed"
                    : sizeType === "men" ? "✓ Men's sizing — XS to XXL or numeric"
                    : sizeType === "women" ? "✓ Women's sizing — standard or custom measurements"
                    : "✓ Kids sizing"}
                </p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label className={lbl} style={{ color: "#9B8B7A" }}>SKU (optional)</label>
              <input value={form.sku} onChange={e => set("sku", e.target.value)}
                placeholder="e.g. LHG-001-RED" className={inp} style={{ borderColor: "#E8E4DF" }} />
            </div>

            {/* Price */}
            <div>
              <label className={lbl} style={{ color: "#9B8B7A" }}>Price (₹) *</label>
              <input type="number" min="1" value={form.price} onChange={e => set("price", e.target.value)} required
                placeholder="e.g. 2999" className={inp} style={{ borderColor: "#E8E4DF" }} />
            </div>

            {/* Compare at Price */}
            <div>
              <label className={lbl} style={{ color: "#9B8B7A" }}>Original / MRP (₹)</label>
              <input type="number" min="0" value={form.compare_at_price}
                onChange={e => set("compare_at_price", e.target.value)}
                placeholder="Shows as strikethrough price" className={inp} style={{ borderColor: "#E8E4DF" }} />
            </div>

            {/* Stock */}
            <div>
              <label className={lbl} style={{ color: "#9B8B7A" }}>Stock Quantity *</label>
              <input type="number" min="0" value={form.stock}
                onChange={e => set("stock", e.target.value)} required
                className={inp} style={{ borderColor: "#E8E4DF" }} />
              {Number(form.stock) > 0 && Number(form.stock) <= 5 && (
                <p className="flex items-center gap-1 text-[11px] mt-1 font-semibold" style={{ color: "#C0392B" }}>
                  <AlertTriangle size={11} /> Only {form.stock} left — "Only X left" badge will show on product page
                </p>
              )}
              {Number(form.stock) === 0 && form.stock !== "" && (
                <p className="text-[11px] mt-1" style={{ color: "#9B7520" }}>⚠ Product will show as Out of Stock</p>
              )}
            </div>

            {/* Badge */}
            <div>
              <label className={lbl} style={{ color: "#9B8B7A" }}>Badge</label>
              <input value={form.badge} onChange={e => set("badge", e.target.value)}
                placeholder="e.g. New, Bestseller, Sale" className={inp} style={{ borderColor: "#E8E4DF" }} />
            </div>

            {/* Color */}
            <div className="sm:col-span-2">
              <label className={lbl} style={{ color: "#9B8B7A" }}>Colors Available</label>
              <input value={form.color} onChange={e => set("color", e.target.value)}
                placeholder="e.g. Red, Royal Blue, Ivory Gold (comma separated)"
                className={inp} style={{ borderColor: "#E8E4DF" }} />
            </div>

            {/* Size Options — smart based on category */}
            {form.category && (
              <div className="sm:col-span-2 rounded-xl border p-4" style={{ borderColor: "#E8E4DF", backgroundColor: "#FAFAF8" }}>
                <label className={lbl} style={{ color: "#9B8B7A" }}>
                  {sizeType === "none" ? "Size / Fit Info" : `Available Sizes`}
                </label>
                <SizeChips sizeType={sizeType} category={form.category}
                  value={form.size_options} onChange={v => set("size_options", v)} />
              </div>
            )}

            {/* Description */}
            <div className="sm:col-span-2">
              <label className={lbl} style={{ color: "#9B8B7A" }}>Description *</label>
              <textarea rows={4} value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="Describe the product — fabric, occasion, care instructions, measurements…" required
                className={inp} style={{ borderColor: "#E8E4DF" }} />
            </div>

            {/* Ready to ship + Status */}
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "#E8E4DF" }}>
              <input type="checkbox" id="rts" checked={!!form.ready_to_ship}
                onChange={e => set("ready_to_ship", e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-maroon" />
              <label htmlFor="rts" className="cursor-pointer text-sm" style={{ color: "#1a1a1a" }}>
                Ready to Ship (dispatches in 24–48 hrs)
              </label>
            </div>

            <div>
              <label className={lbl} style={{ color: "#9B8B7A" }}>Visibility</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className={inp} style={{ borderColor: "#E8E4DF" }}>
                <option value="live">Live — visible to customers</option>
                <option value="hidden">Hidden — not visible publicly</option>
                <option value="draft">Draft — save for later</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#A2466B" }}>
              {isEdit ? "Save Changes" : "Add Product"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm border transition hover:bg-gray-50"
              style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function SellerProducts() {
  const { isLoggedIn, isSeller, user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const storeId = user?.store_id || "";
  const storeName = user?.store_name || "";

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getSellerProducts();
      setProducts((list || []).filter(p => p.status !== "removed"));
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isSeller) { navigate("/login", { replace: true }); return; }
    refresh();
  }, [isLoggedIn, isSeller, navigate, refresh]);

  const toggleStatus = useCallback(async (id, newStatus) => {
    try {

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error("Name and price are required"); return; }
    if (!form.image_url) { toast.error("Please upload a product image"); return; }
    if (!form.description) { toast.error("Description is required"); return; }
    if (!form.category) { toast.error("Please select a category"); return; }
    if (!form.stock) { toast.error("Stock quantity is required"); return; }
    onAdd({
      name: form.name, category: form.category, price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
      description: form.description,
      stock: Number(form.stock) || 0,
      sku: form.sku || "", color: form.color || "",
      size_options: form.size_options || "",
      image_url: form.image_url,
      shop_id: storeId, shop_name: storeName,
      is_active: true, status: form.status,
      created_at: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto" style={{ backgroundColor: "white", maxHeight: "90vh" }}>
        <h3 className="font-serif text-xl mb-5" style={{ color: "#1a1a1a" }}>Add New Product</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <ImageUpload
            label="Product Image *"
            hint="First image shown on marketplace"
            value={form.image_url}
            onUpload={url => setForm(f => ({ ...f, image_url: url }))}
          />

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Product Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Maharani Bridal Lehenga" required
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Category *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }}>
              <option value="">Select category</option>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Description *</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the product, fabric, occasion..." required
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
          </div>

          {/* Price / Sale Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Price (₹) *</label>
              <input type="number" min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Original / MRP (₹)</label>
              <input type="number" min="1" value={form.compare_at_price} onChange={e => setForm(f => ({ ...f, compare_at_price: e.target.value }))}
                placeholder="For strike-through"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
          </div>

          {/* Stock / SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Stock Qty *</label>
              <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>SKU</label>
              <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="Optional"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
          </div>

          {/* Color / Sizes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Colour(s)</label>
              <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                placeholder="Red, Blue, Ivory"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Sizes / Options</label>
              <input value={form.size_options} onChange={e => setForm(f => ({ ...f, size_options: e.target.value }))}
                placeholder="XS, S, M, L, XL"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E8E4DF" }}>
              <option value="live">Live (visible to customers)</option>
              <option value="hidden">Hidden (not visible publicly)</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#A2466B" }}>Add Product</button>
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm border" style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
