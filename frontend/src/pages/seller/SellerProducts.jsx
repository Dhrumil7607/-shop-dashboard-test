/**
 * SellerProducts.jsx — /seller/products
 * Seller product management using the premium ProductStudio editor.
 */

import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Search, Package, Edit3, Trash2, CheckCircle2, AlertTriangle, EyeOff } from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getSellerProducts, sellerCreateProduct, sellerUpdateProduct, sellerDeleteProduct } from "@/lib/api";
import ProductStudio from "@/components/ProductStudio/ProductStudio";

const STATUS_BADGE = {
  live:         { label: "Live",         bg: "rgba(45,122,58,0.1)",  text: "#2D7A3A" },
  hidden:       { label: "Hidden",       bg: "rgba(155,139,122,0.12)", text: "#6B5E52" },
  out_of_stock: { label: "Out of Stock", bg: "rgba(201,168,76,0.15)", text: "#9B7520" },
  draft:        { label: "Draft",        bg: "rgba(27,42,107,0.1)",  text: "#1B2A6B" },
};

export default function SellerProducts() {
  const { isLoggedIn, isSeller, user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const storeId   = user?.store_id   || "";
  const storeName = user?.store_name || "";

  const [products,    setProducts]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  const [studioOpen,  setStudioOpen]  = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading,     setLoading]     = useState(true);

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
      await sellerUpdateProduct(id, { status: newStatus, is_active: newStatus === "live" });
      await refresh();
      const labels = { live: "set live", hidden: "hidden from storefront", out_of_stock: "marked out of stock" };
      toast.success(`Product ${labels[newStatus] || newStatus}`);
    } catch { toast.error("Could not update product"); }
  }, [refresh]);

  const deleteProduct = useCallback(async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await sellerDeleteProduct(id); await refresh(); toast.success("Product deleted"); }
    catch { toast.error("Could not delete product"); }
  }, [refresh]);

  const handleStudioSave = useCallback(async (data) => {
    if (editProduct?.id) {
      await sellerUpdateProduct(editProduct.id, data);
      toast.success("Product updated!");
    } else {
      await sellerCreateProduct(data);
      toast.success("Product published!");
    }
    await refresh();
  }, [refresh, editProduct]);

  const visible = products.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search.trim().length >= 2 && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!isLoggedIn || !isSeller) return null;

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>

        {/* Studio overlay */}
        {studioOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "#FAF9F6" }}>
            <ProductStudio
              mode="seller"
              editProduct={editProduct}
              storeId={storeId}
              storeName={storeName}
              onSave={async (data) => {
                await handleStudioSave(data);
                setStudioOpen(false);
                setEditProduct(null);
              }}
              onCancel={() => { setStudioOpen(false); setEditProduct(null); }}
            />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#C9A84C" }}>SELLER PORTAL</p>
              <h1 className="font-serif text-2xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>My Products</h1>
            </div>
            <button onClick={() => { setEditProduct(null); setStudioOpen(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#A2466B" }}>
              <Plus size={15} /> Add Product
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E8E4DF", backgroundColor: "white" }} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all","live","hidden","out_of_stock"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap"
                  style={{ backgroundColor: filter === f ? "#1a1a1a" : "white", color: filter === f ? "white" : "#6B5E52",
                    border: filter === f ? "none" : "1px solid #E8E4DF" }}>
                  {f === "all" ? `All (${products.length})` : f === "out_of_stock" ? "Out of Stock" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Product list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-maroon/20 border-t-maroon rounded-full animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} className="mx-auto mb-3" style={{ color: "#E8E4DF" }} />
              <p className="mb-4" style={{ color: "#9B8B7A" }}>No products yet. Create your first product.</p>
              <button onClick={() => { setEditProduct(null); setStudioOpen(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#A2466B" }}>
                <Plus size={14} /> Add Product
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {visible.map((p) => {
                  const badge = STATUS_BADGE[p.status] || STATUS_BADGE.live;
                  const lowStock = p.stock > 0 && p.stock <= 5;
                  return (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 p-4 rounded-2xl border bg-white"
                      style={{ borderColor: "#E8E4DF" }}>
                      <img src={p.image_url} alt={p.name}
                        className="rounded-xl object-cover flex-shrink-0"
                        style={{ width: 56, height: 72, backgroundColor: "#F0EBE3" }}
                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=200&q=60"; }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>{p.category}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                          {lowStock && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(192,57,43,0.1)", color: "#C0392B" }}>
                              <AlertTriangle size={9} /> Only {p.stock} left
                            </span>
                          )}
                        </div>
                        <p className="font-serif text-base truncate" style={{ color: "#1a1a1a" }}>{p.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-sm font-semibold" style={{ color: "#A2466B" }}>₹{p.price?.toLocaleString("en-IN")}</p>
                          {p.size_options && <p className="text-[10px]" style={{ color: "#9B8B7A" }}>Sizes: {p.size_options}</p>}
                          <p className="text-[10px]" style={{ color: "#9B8B7A" }}>Stock: {p.stock}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { setEditProduct(p); setStudioOpen(true); }}
                          className="p-2 rounded-xl hover:bg-blue-50 transition" title="Edit">
                          <Edit3 size={15} style={{ color: "#2563EB" }} />
                        </button>
                        <Link to={`/product/${p.id}`}
                          className="p-2 rounded-xl hover:bg-stone-50 transition" title="View">
                          <Eye size={15} style={{ color: "#6B5E52" }} />
                        </Link>
                        {p.status === "live"
                          ? <button onClick={() => toggleStatus(p.id, "hidden")}
                              className="p-2 rounded-xl hover:bg-amber-50 transition" title="Hide">
                              <EyeOff size={15} style={{ color: "#9B7520" }} />
                            </button>
                          : <button onClick={() => toggleStatus(p.id, "live")}
                              className="p-2 rounded-xl hover:bg-green-50 transition" title="Set Live">
                              <CheckCircle2 size={15} style={{ color: "#2D7A3A" }} />
                            </button>
                        }
                        <button onClick={() => deleteProduct(p.id, p.name)}
                          className="p-2 rounded-xl hover:bg-red-50 transition" title="Delete">
                          <Trash2 size={15} style={{ color: "#C0392B" }} />
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
    </SellerLayout>
  );
}
