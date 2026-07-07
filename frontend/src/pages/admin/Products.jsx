import { useEffect, useState } from "react";
import { Plus, Archive, Edit2, Eye, EyeOff, AlertTriangle, Tag, Package } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchProducts, createProduct, archiveProduct, updateProduct, fetchShops } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import {
  ALL_CATEGORIES, getSizeType, getDefaultSizeOptions,
  MENS_STANDARD_SIZES, MENS_NUMERIC_SIZES, WOMENS_STANDARD_SIZES, KIDS_SIZES
} from "@/lib/sizeConfig";

const emptyProduct = {
    shop_id: "",
    name: "",
    category: "",
    description: "",
    price: 0,
    compare_at_price: null,
    currency: "INR",
    image_url: "",
    hover_image_url: "",
    stock: 0,
    badge: "New",
    is_featured: false,
    is_active: true,
    color: "",
    size_options: "",
    sku: "",
    ready_to_ship: false,
};

// ── Shared input style ────────────────────────────────────────────────────────
const inp = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-maroon transition bg-white";
const lbl = "block text-xs font-semibold uppercase tracking-wider mb-1.5 text-stone/70";

// ── Size quick-fill chips ─────────────────────────────────────────────────────
function SizeChips({ sizeType, category, value, onChange }) {
  if (sizeType === "none") return (
    <p className="text-xs text-stone/50 italic">No size needed for this category (free size / one size fits all).</p>
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
                const next = active
                  ? current.filter(s => s !== size)
                  : [...current, size];
                onChange(next.join(","));
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition"
              style={{
                backgroundColor: active ? "#8B3A3A" : "white",
                color: active ? "white" : "#6B5E52",
                borderColor: active ? "#8B3A3A" : "#E8E4DF",
              }}>
              {size}
            </button>
          );
        })}
        <button type="button"
          onClick={() => onChange(allSelected ? "" : presets.join(","))}
          className="px-3 py-1 rounded-full text-xs font-semibold border transition"
          style={{ backgroundColor: "#F0EBE3", color: "#6B5E52", borderColor: "#E8E4DF" }}>
          {allSelected ? "Clear All" : "Select All"}
        </button>
      </div>
      {/* Custom size input for women's */}
      {sizeType === "women" && (
        <div>
          <input value={value} onChange={e => onChange(e.target.value)}
            placeholder="Or type custom sizes e.g. 32,34,36,38 or S,M,L,XL,Free Size"
            className={inp + " text-xs mt-1"}/>
          <p className="text-[10px] text-stone/50 mt-1">Women can use standard sizes OR custom measurements. Separate with commas.</p>
        </div>
      )}
      {sizeType !== "women" && (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder="Or type custom sizes separated by commas"
          className={inp + " text-xs"}/>
      )}
    </div>
  );
}

export default function AdminProducts() {
    const { adminKey } = useAuth();
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyProduct);
    const [togglingId, setTogglingId] = useState(null);

    const sizeType = getSizeType(formData.category);

    useEffect(() => { loadProducts(); loadShops(); }, []);

    // Auto-fill size_options when category changes
    useEffect(() => {
      if (!isEditing) {
        setFormData(f => ({ ...f, size_options: getDefaultSizeOptions(f.category) }));
      }
    }, [formData.category]);

    const loadShops = async () => {
        try {
            const data = await fetchShops({ active_only: false, limit: 500 });
            const seen = new Set();
            const deduped = (Array.isArray(data) ? data : []).filter(s => {
                if (seen.has(s.id)) return false;
                seen.add(s.id); return true;
            });
            setShops(deduped);
        } catch { setShops([]); }
    };

    const loadProducts = async () => {
        try {
            const data = await fetchProducts({ active_only: false, limit: 500 });
            setProducts(Array.isArray(data) ? data : []);
        } catch { setProducts([]); }
        finally { setLoading(false); }
    };

    const handleToggleActive = async (productId, currentStatus) => {
        setTogglingId(productId);
        try {
            await updateProduct(productId, { is_active: !currentStatus, status: !currentStatus ? "live" : "hidden" }, adminKey);
            await loadProducts();
            toast.success(!currentStatus ? "Product is now LIVE" : "Product hidden");
        } catch { toast.error("Failed to toggle product status"); }
        finally { setTogglingId(null); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.shop_id) { toast.error("Please select a shop"); return; }
        if (!formData.price || formData.price <= 0) { toast.error("Price must be greater than 0"); return; }
        if (!formData.image_url) { toast.error("Please upload a product image"); return; }
        if (!formData.category) { toast.error("Please select a category"); return; }
        if (formData.description.length < 10) { toast.error("Description must be at least 10 characters"); return; }
        try {
            if (isEditing && editingId) {
                await updateProduct(editingId, formData, adminKey);
                toast.success("Product updated!");
            } else {
                const newProduct = await createProduct(formData, adminKey);
                if (newProduct?.id) toast.success("Product created and LIVE!");
            }
            setShowForm(false); setIsEditing(false); setEditingId(null); setFormData(emptyProduct);
            loadProducts();
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Failed to save product");
        }
    };

    const handleEdit = (product) => {
        setFormData({ ...emptyProduct, ...product });
        setIsEditing(true); setEditingId(product.id); setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false); setIsEditing(false); setEditingId(null); setFormData(emptyProduct);
    };

    const handleArchive = async (productId) => {
        if (!window.confirm("Archive this product? It will be hidden from the storefront.")) return;
        try {
            await archiveProduct(productId, adminKey);
            toast.success("Product archived");
            loadProducts();
        } catch { toast.error("Failed to archive product"); }
    };

    const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));

    return (
        <AdminLayout>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Products</h1>
                    <button onClick={() => { setIsEditing(false); setEditingId(null); setFormData(emptyProduct); setShowForm(v => !v); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: "#8B3A3A" }}>
                        <Plus size={15} /> {showForm ? "Close" : "Add Product"}
                    </button>
                </div>

                {/* ── Product Form ── */}
                {showForm && (
                    <motion.form onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border p-6 mb-8 shadow-sm"
                        style={{ borderColor: "#E8E4DF" }}>
                        <h2 className="text-lg font-bold mb-6" style={{ color: "#1a1a1a" }}>
                            {isEditing ? "Edit Product" : "Create New Product"}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* Shop */}
                            <div>
                                <label className={lbl}>Shop *</label>
                                <select value={formData.shop_id} onChange={e => set("shop_id", e.target.value)} className={inp} required>
                                    <option value="">Select a shop</option>
                                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* Name */}
                            <div>
                                <label className={lbl}>Product Name *</label>
                                <input value={formData.name} onChange={e => set("name", e.target.value)}
                                    placeholder="e.g. Maharani Bridal Lehenga" className={inp} required />
                            </div>

                            {/* Category */}
                            <div>
                                <label className={lbl}>Category *</label>
                                <select value={formData.category} onChange={e => set("category", e.target.value)} className={inp} required>
                                    <option value="">Select category</option>
                                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {formData.category && (
                                    <p className="text-[10px] mt-1" style={{ color: "#9B8B7A" }}>
                                        Size type: <strong>{sizeType === "none" ? "Free Size / No Size Needed" : sizeType === "men" ? "Men's (XS–XXL or 38–48)" : sizeType === "women" ? "Women's (Standard + Custom)" : "Kids"}</strong>
                                    </p>
                                )}
                            </div>

                            {/* SKU */}
                            <div>
                                <label className={lbl}>SKU (optional)</label>
                                <input value={formData.sku} onChange={e => set("sku", e.target.value)}
                                    placeholder="e.g. LHG-001-RED" className={inp} />
                            </div>

                            {/* Price */}
                            <div>
                                <label className={lbl}>Price (₹) *</label>
                                <input type="number" min="1" value={formData.price || ""}
                                    onChange={e => set("price", parseInt(e.target.value) || 0)}
                                    placeholder="e.g. 2999" className={inp} required />
                            </div>

                            {/* Compare at Price */}
                            <div>
                                <label className={lbl}>Compare at Price (₹)</label>
                                <input type="number" min="0" value={formData.compare_at_price || ""}
                                    onChange={e => set("compare_at_price", e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="Original price (shows strikethrough)" className={inp} />
                            </div>

                            {/* Stock */}
                            <div>
                                <label className={lbl}>Stock Quantity *</label>
                                <input type="number" min="0" value={formData.stock}
                                    onChange={e => set("stock", parseInt(e.target.value) || 0)}
                                    className={inp} required />
                                {formData.stock > 0 && formData.stock <= 5 && (
                                    <p className="flex items-center gap-1 text-[11px] mt-1 font-semibold" style={{ color: "#C0392B" }}>
                                        <AlertTriangle size={11} /> Only {formData.stock} left — low stock warning will show on frontend
                                    </p>
                                )}
                                {formData.stock === 0 && (
                                    <p className="text-[11px] mt-1" style={{ color: "#9B7520" }}>⚠ Product will be marked Out of Stock</p>
                                )}
                            </div>

                            {/* Badge */}
                            <div>
                                <label className={lbl}>Badge</label>
                                <input value={formData.badge} onChange={e => set("badge", e.target.value)}
                                    placeholder="e.g. New, Sale, Bestseller" className={inp} />
                            </div>

                            {/* Color */}
                            <div>
                                <label className={lbl}>Colors Available</label>
                                <input value={formData.color} onChange={e => set("color", e.target.value)}
                                    placeholder="e.g. Red, Blue, Gold (comma separated)" className={inp} />
                            </div>

                            {/* Ready to Ship */}
                            <div className="flex items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: "#E8E4DF" }}>
                                <input type="checkbox" id="ready_ship" checked={formData.ready_to_ship}
                                    onChange={e => set("ready_to_ship", e.target.checked)}
                                    className="w-4 h-4 cursor-pointer accent-maroon" />
                                <label htmlFor="ready_ship" className="cursor-pointer text-sm font-medium" style={{ color: "#1a1a1a" }}>
                                    Ready to Ship (dispatches within 24–48 hrs)
                                </label>
                            </div>

                            {/* Featured */}
                            <div className="flex items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: "#E8E4DF" }}>
                                <input type="checkbox" id="featured" checked={formData.is_featured}
                                    onChange={e => set("is_featured", e.target.checked)}
                                    className="w-4 h-4 cursor-pointer accent-maroon" />
                                <label htmlFor="featured" className="cursor-pointer text-sm font-medium" style={{ color: "#1a1a1a" }}>Featured Product</label>
                            </div>

                            {/* Product Image */}
                            <div className="rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
                                <ImageUpload label="Product Image *" hint="Upload from your device or paste a URL"
                                    value={formData.image_url}
                                    onUpload={url => set("image_url", url)} />
                            </div>

                            {/* Hover Image */}
                            <div className="rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
                                <ImageUpload label="Hover Image (optional)" hint="Shown on mouse hover over the product card"
                                    value={formData.hover_image_url}
                                    onUpload={url => set("hover_image_url", url)} />
                            </div>

                            {/* Size Options — full width */}
                            {formData.category && (
                                <div className="md:col-span-2 rounded-xl border p-4" style={{ borderColor: "#E8E4DF", backgroundColor: "#FAFAF8" }}>
                                    <label className={lbl}>
                                        {sizeType === "none" ? "Size / Fit" : `Available Sizes — ${sizeType === "men" ? "Men's" : sizeType === "women" ? "Women's" : "Kids"}`}
                                    </label>
                                    <SizeChips sizeType={sizeType} category={formData.category}
                                        value={formData.size_options}
                                        onChange={v => set("size_options", v)} />
                                </div>
                            )}

                            {/* Description — full width */}
                            <div className="md:col-span-2">
                                <label className={lbl}>Description *</label>
                                <textarea value={formData.description}
                                    onChange={e => set("description", e.target.value)}
                                    placeholder="Describe the product — fabric, occasion, features, care instructions…"
                                    className={inp} rows={4} required />
                                <p className="text-[10px] mt-1" style={{ color: "#9B8B7A" }}>{formData.description.length}/10 characters minimum</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button type="submit"
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                                style={{ backgroundColor: "#8B3A3A" }}>
                                {isEditing ? "Update Product" : "Create Product"}
                            </button>
                            <button type="button" onClick={handleCancel}
                                className="px-6 py-2.5 rounded-xl text-sm font-medium border transition hover:bg-gray-50"
                                style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
                                Cancel
                            </button>
                        </div>
                    </motion.form>
                )}

                {/* ── Products Table ── */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-10 h-10 border-4 border-maroon/20 border-t-maroon rounded-full animate-spin" />
                    </div>
                ) : (
                    <div>
                        <h2 className="text-lg font-bold mb-4" style={{ color: "#1a1a1a" }}>All Products ({products.length})</h2>
                        <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: "#E8E4DF" }}>
                            <table className="w-full min-w-[700px]">
                                <thead style={{ backgroundColor: "#F0EBE3" }}>
                                    <tr>
                                        {["Product","Shop","Category","Price","Stock","Sizes","Status","Actions"].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B5E52" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ divideColor: "#F0EBE3" }}>
                                    {products.map((product, idx) => {
                                        const lowStock = product.stock > 0 && product.stock <= 5;
                                        return (
                                            <tr key={product.id} className="hover:bg-stone/5 transition">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={product.image_url} alt="" className="w-10 h-12 rounded-lg object-cover flex-shrink-0"
                                                            style={{ backgroundColor: "#F0EBE3" }}
                                                            onError={e => { e.target.style.display = "none"; }} />
                                                        <div>
                                                            <p className="text-sm font-medium line-clamp-1" style={{ color: "#1a1a1a" }}>{product.name}</p>
                                                            {product.badge && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: "rgba(139,58,58,0.1)", color: "#8B3A3A" }}>{product.badge}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "#9B8B7A" }}>{product.shop_name || "—"}</td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "#6B5E52" }}>{product.category}</td>
                                                <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                                                    ₹{product.price?.toLocaleString()}
                                                    {product.compare_at_price > product.price && (
                                                        <span className="block text-[10px] line-through" style={{ color: "#9B8B7A" }}>₹{product.compare_at_price?.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-bold ${product.stock === 0 ? "text-red-600" : lowStock ? "text-amber-600" : "text-green-700"}`}>
                                                        {product.stock === 0 ? "Out of Stock" : lowStock ? `⚠ Only ${product.stock} left` : `${product.stock} in stock`}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "#9B8B7A" }}>
                                                    {product.size_options ? product.size_options.split(",").slice(0,4).join(", ") + (product.size_options.split(",").length > 4 ? "…" : "") : "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => handleToggleActive(product.id, product.is_active)}
                                                        disabled={togglingId === product.id}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                                                        style={{
                                                            backgroundColor: product.is_active ? "rgba(45,122,58,0.1)" : "rgba(155,139,122,0.12)",
                                                            color: product.is_active ? "#2D7A3A" : "#6B5E52"
                                                        }}>
                                                        {product.is_active ? <><Eye size={11} /> Live</> : <><EyeOff size={11} /> Off</>}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleEdit(product)} className="p-1.5 rounded-lg hover:bg-blue-50 transition" title="Edit">
                                                            <Edit2 size={14} style={{ color: "#2563EB" }} />
                                                        </button>
                                                        <button onClick={() => handleArchive(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition" title="Archive">
                                                            <Archive size={14} style={{ color: "#8B3A3A" }} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {products.length === 0 && (
                                <div className="text-center py-16">
                                    <Package size={40} className="mx-auto mb-3" style={{ color: "#E8E4DF" }} />
                                    <p className="text-sm" style={{ color: "#9B8B7A" }}>No products yet. Add your first product above.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

const emptyProduct = {
    shop_id: "",
    name: "",
    category: "",
    description: "",
    price: 0,
    compare_at_price: null,
    currency: "INR",
    image_url: "",
    hover_image_url: "",
    stock: 0,
    badge: "New",
    is_featured: false,
    is_active: true,
};

export default function AdminProducts() {
    const { adminKey } = useAuth();
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyProduct);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        loadProducts();
        loadShops();
    }, []);

    const loadShops = async () => {
        try {
            const data = await fetchShops({ active_only: false, limit: 500 });
            // Deduplicate by id before setting — prevents duplicate options in dropdown
            const seen = new Set();
            const deduped = (Array.isArray(data) ? data : []).filter(s => {
                if (seen.has(s.id)) return false;
                seen.add(s.id);
                return true;
            });
            setShops(deduped);
        } catch {
            setShops([]);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await fetchProducts({ active_only: false, limit: 500 });
            setProducts(Array.isArray(data) ? data : []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (productId, currentStatus) => {
        setTogglingId(productId);
        try {
            const newActive = !currentStatus;
            // Set both is_active AND the status field so backend visibility filters work
            const patch = {
                is_active: newActive,
                status: newActive ? "live" : "hidden",
            };
            await updateProduct(productId, patch, adminKey);
            // Re-fetch from backend to confirm
            await loadProducts();
            toast.success(newActive ? "🟢 Product is now LIVE!" : "🔴 Product is now offline/hidden");
        } catch (error) {
            toast.error("Failed to toggle product status");
        } finally {
            setTogglingId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.shop_id) { toast.error("Please select a shop"); return; }
            if (!formData.price || formData.price <= 0) { toast.error("Price must be greater than 0"); return; }
            if (!formData.image_url) { toast.error("Please upload or enter an image for the product"); return; }
            if (formData.description.length < 10) { toast.error("Description must be at least 10 characters"); return; }

            if (isEditing && editingId) {
                await updateProduct(editingId, formData, adminKey);
                setProducts(products.map(p => p.id === editingId ? formData : p));
                toast.success("Product updated successfully!");
            } else {
                const newProduct = await createProduct(formData, adminKey);
                if (newProduct?.id) {
                    setProducts([newProduct, ...products]);
                    toast.success("Product is now LIVE!");
                }
            }
            setShowForm(false); setIsEditing(false); setEditingId(null); setFormData(emptyProduct);
            loadProducts();
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Failed to save product");
        }
    };

    const handleEdit = (product) => {
        setFormData(product);
        setIsEditing(true);
        setEditingId(product.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
        setFormData(emptyProduct);
    };

    const handleArchive = async (productId) => {
        if (!window.confirm("Archive this product? It will be hidden from the storefront.")) return;
        try {
            await archiveProduct(productId, adminKey);
            toast.success("Product archived");
            loadProducts();
        } catch (error) {
            toast.error("Failed to archive product");
        }
    };

    return (
        <AdminLayout>
            <div className="relative">
                {/* Animated background elements */}
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <motion.div
                        className="absolute top-20 right-1/4 w-80 h-80 bg-gradient-to-br from-maroon/5 to-transparent rounded-full blur-3xl"
                        animate={{
                            y: [0, 40, 0],
                            x: [0, 30, 0],
                        }}
                        transition={{
                            duration: 20,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                </div>

                <motion.div className="flex items-center justify-between mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-3xl font-bold">Products</h1>
                    <motion.button
                        onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                            setFormData(emptyProduct);
                            setShowForm(!showForm);
                        }}
                        whileHover={{ scale: 1.05, boxShadow: "0 8px 32px rgba(139, 58, 58, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-maroon to-maroon-deep text-ivory rounded-lg smooth-transition shadow-lg"
                    >
                        <Plus size={20} />
                        Add Product
                    </motion.button>
                </motion.div>

                {/* Form */}
                {showForm && (
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="glass backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 rounded-2xl border border-white/30 shadow-glass-lg p-8 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-6 text-espresso">{isEditing ? "Edit Product" : "Create New Product"}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Shop Selection */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <label className="block text-sm font-medium mb-2 text-espresso">Shop *</label>
                                <select
                                    value={formData.shop_id}
                                    onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                                    className="w-full px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                    required
                                >
                                    <option value="">
                                        {shops.length === 0 ? "No shops available - create one first" : "Select a shop"}
                                    </option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                                {shops.length === 0 && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ No shops found. Please create a shop in the Shops tab first.</p>
                                )}
                            </motion.div>

                            {/* Product Name */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                type="text"
                                placeholder="Product Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                required
                            />

                            {/* Category */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                type="text"
                                placeholder="Category *"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                required
                            />

                            {/* Price */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                type="number"
                                placeholder="Price *"
                                min="1"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                required
                            />

                            {/* Compare at Price */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                type="number"
                                placeholder="Compare at Price"
                                min="0"
                                value={formData.compare_at_price || ""}
                                onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value ? parseInt(e.target.value) : null })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                            />

                            {/* Stock */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                type="number"
                                placeholder="Stock"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                            />

                            {/* Badge */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                type="text"
                                placeholder="Badge (e.g., New, Sale)"
                                value={formData.badge}
                                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                            />

                            {/* Image Upload (file or URL) */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                className="rounded-xl p-4 border"
                                style={{ borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.3)" }}
                            >
                                <ImageUpload
                                    label="Product Image *"
                                    value={formData.image_url}
                                    onUpload={url => setFormData({ ...formData, image_url: url })}
                                    hint="Upload from your device or paste a URL"
                                />
                            </motion.div>

                            {/* Hover Image Upload */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="rounded-xl p-4 border"
                                style={{ borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.3)" }}
                            >
                                <ImageUpload
                                    label="Hover Image (optional)"
                                    value={formData.hover_image_url}
                                    onUpload={url => setFormData({ ...formData, hover_image_url: url })}
                                    hint="Shown on mouse hover over the product card"
                                />
                            </motion.div>

                            {/* Is Featured */}
                            <motion.div
                                className="flex items-center gap-3 rounded-lg glass backdrop-blur-md bg-white/30 border border-white/40 px-4 py-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                            >
                                <input
                                    type="checkbox"
                                    id="featured"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="w-4 h-4 cursor-pointer accent-maroon"
                                />
                                <label htmlFor="featured" className="cursor-pointer text-espresso">Featured Product</label>
                            </motion.div>

                            {/* Description */}
                            <motion.textarea
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                placeholder="Description (min 10 characters) *"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40 md:col-span-2"
                                rows="4"
                                required
                            />
                        </div>
                        <div className="flex gap-4 mt-8">
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2 bg-gradient-to-r from-maroon to-maroon-deep text-ivory rounded-lg shadow-lg smooth-transition"
                            >
                                {isEditing ? "Update Product" : "Create Product"}
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleCancel}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg smooth-transition"
                            >
                                Cancel
                            </motion.button>
                        </div>
                    </motion.form>
                )}

                {/* Products Grid View */}
                {loading ? (
                    <motion.div
                        className="flex items-center justify-center h-64"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-12 h-12 border-4 border-maroon/20 border-t-maroon rounded-full"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        className="space-y-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Grid Preview */}
                        <div>
                            <h2 className="text-xl font-bold text-espresso mb-6">Products Preview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {products.slice(0, 12).map((product, idx) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -8 }}
                                        className={`group relative glass backdrop-blur-md rounded-2xl overflow-hidden border-2 smooth-transition shadow-glass ${
                                            product.is_active
                                                ? "border-green-300/50 from-white/40 to-white/20"
                                                : "border-gray-300/30 from-white/20 to-white/10 opacity-75"
                                        }`}
                                    >
                                        {/* Product Image */}
                                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                                            <motion.img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                whileHover={{ scale: 1.08 }}
                                                transition={{ duration: 0.4 }}
                                                onError={(e) => {
                                                    e.target.src = "/shop-assets/banner-1.jpg";
                                                }}
                                            />

                                            {/* Badge */}
                                            {product.badge && (
                                                <motion.div
                                                    className="absolute top-3 left-3 bg-gradient-to-r from-maroon to-maroon-deep text-ivory px-3 py-1 rounded-lg text-xs font-bold shadow-lg"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.2 }}
                                                >
                                                    {product.badge}
                                                </motion.div>
                                            )}

                                            {/* Discount Badge */}
                                            {product.compare_at_price && product.compare_at_price > product.price && (
                                                <motion.div
                                                    className="absolute top-3 right-3 bg-gradient-to-r from-green-400 to-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 }}
                                                >
                                                    -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                                                </motion.div>
                                            )}

                                            {/* Status Overlay */}
                                            {!product.is_active && (
                                                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                                    <span className="bg-gray-700/80 text-white px-3 py-1 rounded-lg text-xs font-bold backdrop-blur">
                                                        OFFLINE
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="p-4">
                                            <p className="text-xs text-maroon font-semibold uppercase mb-1">
                                                {product.category}
                                            </p>
                                            <h3 className="text-sm font-serif text-espresso mb-3 line-clamp-2 group-hover:text-maroon smooth-transition">
                                                {product.name}
                                            </h3>

                                            {/* Price */}
                                            <div className="mb-3">
                                                <p className="text-lg font-bold gradient-text">
                                                    {product.currency} {product.price.toLocaleString()}
                                                </p>
                                                {product.compare_at_price && product.compare_at_price > product.price && (
                                                    <p className="text-xs text-espresso/50 line-through">
                                                        {product.currency} {product.compare_at_price.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Stock */}
                                            <p className={`text-xs font-semibold mb-3 smooth-transition ${
                                                product.stock > 0 ? "text-green-600" : "text-red-600"
                                            }`}>
                                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                                            </p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    onClick={() => handleToggleActive(product.id, product.is_active)}
                                                    disabled={togglingId === product.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`flex-1 text-xs px-2 py-2 rounded-lg font-medium smooth-transition flex items-center justify-center gap-1 ${
                                                        product.is_active
                                                            ? "bg-gradient-to-r from-green-200/50 to-green-100/50 text-green-700 hover:from-green-300/60 hover:to-green-200/60 border border-green-300/30"
                                                            : "bg-gradient-to-r from-gray-200/50 to-gray-100/50 text-gray-700 hover:from-gray-300/60 hover:to-gray-200/60 border border-gray-300/30"
                                                    } disabled:opacity-50`}
                                                >
                                                    {togglingId === product.id ? (
                                                        <>⏳</>
                                                    ) : product.is_active ? (
                                                        <>👁️ LIVE</>
                                                    ) : (
                                                        <>👁️‍🗨️ OFF</>
                                                    )}
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleEdit(product)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex-1 text-xs px-2 py-2 bg-gradient-to-r from-blue-200/50 to-blue-100/50 text-blue-700 rounded-lg hover:from-blue-300/60 hover:to-blue-200/60 font-medium smooth-transition border border-blue-300/30"
                                                >
                                                    Edit
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <motion.div
                            className="border-t-2 border-gradient-to-r from-maroon/20 via-gold/20 to-maroon/20 my-8"
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            transition={{ duration: 0.8 }}
                        />

                        {/* Table View */}
                        <div>
                            <h2 className="text-xl font-bold text-espresso mb-6">All Products ({products.length})</h2>
                            <motion.div
                                className="glass backdrop-blur-md bg-white/30 rounded-2xl border border-white/30 overflow-x-auto shadow-glass-lg"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                        <table className="w-full min-w-full">
                            <thead className="bg-gradient-to-r from-maroon/5 to-gold/5 border-b border-white/20 backdrop-blur-sm sticky top-0">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-espresso whitespace-nowrap">Name</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-espresso whitespace-nowrap">Shop</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-espresso whitespace-nowrap">Category</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-espresso whitespace-nowrap">Price</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-espresso whitespace-nowrap">Stock</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-espresso whitespace-nowrap">Status</th>
                                    <th className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-semibold text-espresso whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product, idx) => (
                                    <motion.tr
                                        key={product.id}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="border-b border-white/20 hover:bg-white/20 smooth-transition"
                                    >
                                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-espresso font-medium whitespace-nowrap">{product.name}</td>
                                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-espresso/60 whitespace-nowrap">{product.shop_name || "N/A"}</td>
                                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-espresso/60 whitespace-nowrap">{product.category}</td>
                                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-maroon whitespace-nowrap">
                                            {product.currency} {product.price}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-espresso whitespace-nowrap">{product.stock}</td>
                                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                                            <motion.button
                                                onClick={() => handleToggleActive(product.id, product.is_active)}
                                                disabled={togglingId === product.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`px-2 sm:px-3 py-2 rounded-lg font-medium text-xs smooth-transition flex items-center gap-1 whitespace-nowrap ${
                                                    product.is_active
                                                        ? "bg-gradient-to-r from-green-200/50 to-green-100/50 text-green-700 hover:from-green-300/60 hover:to-green-200/60 border border-green-300/30"
                                                        : "bg-gradient-to-r from-gray-200/50 to-gray-100/50 text-gray-700 hover:from-gray-300/60 hover:to-gray-200/60 border border-gray-300/30"
                                                } disabled:opacity-50`}
                                            >
                                                {togglingId === product.id ? (
                                                    <>⏳</>
                                                ) : product.is_active ? (
                                                    <>
                                                        <Eye size={14} />
                                                        <span className="hidden sm:inline">LIVE</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff size={14} />
                                                        <span className="hidden sm:inline">OFF</span>
                                                    </>
                                                )}
                                            </motion.button>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 sm:gap-3">
                                                <motion.button
                                                    onClick={() => handleEdit(product)}
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-blue-600 hover:text-blue-700 smooth-transition"
                                                >
                                                    <Edit2 size={16} />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleArchive(product.id)}
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-maroon hover:text-maroon/70 smooth-transition"
                                                >
                                                    <Archive size={16} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
}
