/**
 * SellerProducts.jsx — /seller/products
 * Seller product management: list, add, archive/unarchive, live toggle.
 */

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Archive, Eye, EyeOff, Search, Package,
  ChevronLeft, Edit3, Trash2, Radio, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getSellerProducts, sellerCreateProduct, sellerUpdateProduct, sellerDeleteProduct } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";

const CATS = ["Lehengas","Sarees","Kurtas","Sherwanis","Chaniya Choli","Wedding Wear","Gown","Kids Traditional","Jewellery","Accessories"];

const STATUS_BADGE = {
  live:         { label: "Live",         bg: "rgba(45,122,58,0.1)",  text: "#2D7A3A" },
  hidden:       { label: "Hidden",       bg: "rgba(155,139,122,0.12)", text: "#6B5E52" },
  out_of_stock: { label: "Out of Stock", bg: "rgba(201,168,76,0.15)", text: "#9B7520" },
  draft:        { label: "Draft",        bg: "rgba(27,42,107,0.1)",  text: "#1B2A6B" },
};

function AddProductModal({ onClose, onAdd, storeId, storeName }) {
  const [form, setForm] = useState({
    name: "", category: "", price: "", compare_at_price: "",
    description: "", stock: "", sku: "", color: "", size_options: "",
    image_url: "", status: "live",
  });

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
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getSellerProducts();
      // Seller sees everything except hard-removed products
      setProducts((list || []).filter(p => p.status !== "removed"));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isSeller) { navigate("/login", { replace: true }); return; }
    refresh();
  }, [isLoggedIn, isSeller, navigate, refresh]);

  const toggleStatus = useCallback(async (id, newStatus) => {
    try {
      await sellerUpdateProduct(id, { status: newStatus });
      await refresh();
      const labels = {
        live: "set live", hidden: "hidden from storefront", out_of_stock: "marked out of stock",
      };
      toast.success(`Product ${labels[newStatus] || newStatus}`);
    } catch { toast.error("Could not update product"); }
  }, [refresh]);

  const deleteProduct = useCallback(async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await sellerDeleteProduct(id); await refresh(); toast.success("Product deleted"); }
    catch { toast.error("Could not delete product"); }
  }, [refresh]);

  const addProduct = useCallback(async (p) => {
    try { await sellerCreateProduct({ ...p, status: "live" }); await refresh(); }
    catch { toast.error("Could not add product"); }
  }, [refresh]);

  const visible = products.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search.trim().length >= 2 && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!isLoggedIn || !isSeller) return null;

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/seller/dashboard" className="p-2 rounded-xl hover:bg-stone-100 transition">
              <ChevronLeft size={20} style={{ color: "#6B5E52" }} />
            </Link>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>SELLER PORTAL</p>
              <h1 className="font-serif text-2xl md:text-3xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>My Products</h1>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#A2466B" }}>
              <Plus size={15} /> Add Product
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E8E4DF", backgroundColor: "white" }} />
            </div>
            <div className="flex gap-2">
              {["all","live","hidden","out_of_stock"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition capitalize whitespace-nowrap"
                  style={{ backgroundColor: filter === f ? "#1a1a1a" : "white",
                    color: filter === f ? "white" : "#6B5E52",
                    border: filter === f ? "none" : "1px solid #E8E4DF" }}>
                  {f === "all" ? "All" : f === "out_of_stock" ? "Out of Stock" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {visible.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} style={{ color: "#E8E4DF" }} className="mx-auto mb-3" />
              <p style={{ color: "#9B8B7A" }}>No products found. Add your first product.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {visible.map((p) => {
                  const badge = STATUS_BADGE[p.status] || STATUS_BADGE.live;
                  return (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
                      className="flex items-center gap-4 p-4 rounded-2xl border"
                      style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                      {/* Image */}
                      <img src={p.image_url} alt={p.name}
                        className="w-16 h-20 rounded-xl object-cover flex-shrink-0"
                        style={{ backgroundColor: "#F0EBE3" }}
                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=200&q=60"; }} />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>
                            {p.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: badge.bg, color: badge.text }}>
                            {p.status === "live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />}
                            {badge.label}
                          </span>
                        </div>
                        <p className="font-serif text-base mt-0.5 truncate" style={{ color: "#1a1a1a" }}>{p.name}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: "#A2466B" }}>₹{p.price?.toLocaleString("en-IN")}</p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Link to={`/product/${p.id}`}
                          className="p-2 rounded-xl hover:bg-stone-50 transition" title="View product">
                          <Eye size={16} style={{ color: "#6B5E52" }} />
                        </Link>
                        {/* Set live (from hidden/out_of_stock/draft) */}
                        {p.status !== "live" && (
                          <button onClick={() => toggleStatus(p.id, "live")}
                            className="p-2 rounded-xl hover:bg-green-50 transition" title="Set live">
                            <CheckCircle2 size={16} style={{ color: "#2D7A3A" }} />
                          </button>
                        )}
                        {/* Out of stock toggle */}
                        {p.status !== "out_of_stock" ? (
                          <button onClick={() => toggleStatus(p.id, "out_of_stock")}
                            className="p-2 rounded-xl hover:bg-amber-50 transition" title="Mark out of stock">
                            <Package size={16} style={{ color: "#9B7520" }} />
                          </button>
                        ) : (
                          <button onClick={() => toggleStatus(p.id, "live")}
                            className="p-2 rounded-xl hover:bg-green-50 transition" title="Back in stock">
                            <Radio size={16} style={{ color: "#2D7A3A" }} />
                          </button>
                        )}
                        {/* Hide / show toggle */}
                        {p.status !== "hidden" ? (
                          <button onClick={() => toggleStatus(p.id, "hidden")}
                            className="p-2 rounded-xl hover:bg-stone-50 transition" title="Hide from storefront">
                            <EyeOff size={16} style={{ color: "#9B8B7A" }} />
                          </button>
                        ) : (
                          <button onClick={() => toggleStatus(p.id, "live")}
                            className="p-2 rounded-xl hover:bg-green-50 transition" title="Show on storefront">
                            <Eye size={16} style={{ color: "#2D7A3A" }} />
                          </button>
                        )}
                        <button onClick={() => deleteProduct(p.id, p.name)}
                          className="p-2 rounded-xl hover:bg-red-50 transition" title="Remove product">
                          <Trash2 size={16} style={{ color: "#C0392B" }} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onAdd={addProduct} storeId={storeId} storeName={storeName} />}
    </SellerLayout>
  );
}
