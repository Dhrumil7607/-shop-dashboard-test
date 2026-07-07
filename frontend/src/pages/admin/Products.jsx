import { useEffect, useState } from "react";
import { Plus, Archive, Edit2, Eye, EyeOff, AlertTriangle, Tag, Package } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchProducts, createProduct, archiveProduct, updateProduct, fetchShops } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import ProductStudio from "@/components/ProductStudio/ProductStudio";
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
    // Studio state
    const [studioOpen, setStudioOpen] = useState(false);
    const [studioProduct, setStudioProduct] = useState(null);

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
        setStudioProduct(product);
        setStudioOpen(true);
    };

    const handleCancel = () => {
        setShowForm(false); setIsEditing(false); setEditingId(null); setFormData(emptyProduct);
        setStudioOpen(false); setStudioProduct(null);
    };

    const handleStudioSave = async (data) => {
        try {
            if (studioProduct?.id) {
                await updateProduct(studioProduct.id, data, adminKey);
                toast.success("Product updated!");
            } else {
                const newProduct = await createProduct(data, adminKey);
                if (newProduct?.id) toast.success("Product created and LIVE!");
            }
            setStudioOpen(false); setStudioProduct(null);
            loadProducts();
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Failed to save product");
            throw error;
        }
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
                    <button onClick={() => { setStudioProduct(null); setStudioOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: "#8B3A3A" }}>
                        <Plus size={15} /> Add Product
                    </button>
                </div>

                {/* Studio overlay */}
                {studioOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "#FAF9F6" }}>
                        <ProductStudio
                            mode="admin"
                            editProduct={studioProduct}
                            shops={shops}
                            adminKey={adminKey}
                            onSave={handleStudioSave}
                            onCancel={handleCancel}
                        />
                    </div>
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
