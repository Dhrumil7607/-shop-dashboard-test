/**
 * SellerCoupons.jsx — /seller/coupons
 * Create and manage discount coupons for the seller's store.
 */

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Tag, Trash2, Copy, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSellerCoupons, createSellerCoupon, updateSellerCoupon, deleteSellerCoupon } from "@/lib/api";

// Map a backend coupon (snake_case) to the shape this UI renders
const _fromApi = (c) => ({
  id: c.id,
  code: c.code,
  type: c.type === "fixed" ? "flat" : c.type,
  value: c.value,
  minOrder: c.min_order ?? 0,
  uses: c.used ?? 0,
  active: c.active !== false,
  expires: c.expiry || "",
});

function AddCouponModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ code: "", type: "percent", value: "", minOrder: "", expires: "" });
  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) { toast.error("Code and value required"); return; }
    const ok = await onAdd({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_order: Number(form.minOrder) || 0,
      expiry: form.expires || "",
      active: true,
    });
    if (ok) onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: "white" }}>
        <h3 className="font-serif text-xl mb-5" style={{ color: "#1a1a1a" }}>Create Coupon</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Coupon Code</label>
            <input value={form.code} onChange={e => handle("code", e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none font-mono uppercase"
              style={{ borderColor: "#E8E4DF" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Type</label>
              <select value={form.type} onChange={e => handle("type", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E8E4DF" }}>
                <option value="percent">Percent Off</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>
                {form.type === "percent" ? "% Off" : "₹ Off"}
              </label>
              <input type="number" value={form.value} onChange={e => handle("value", e.target.value)}
                placeholder={form.type === "percent" ? "10" : "500"}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E8E4DF" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Min Order (₹)</label>
              <input type="number" value={form.minOrder} onChange={e => handle("minOrder", e.target.value)}
                placeholder="0" className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E8E4DF" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9B8B7A" }}>Expires</label>
              <input type="date" value={form.expires} onChange={e => handle("expires", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E8E4DF" }} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: "#A2466B" }}>Create Coupon</button>
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm border"
              style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>Cancel</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function SellerCoupons() {
  const { isLoggedIn, isSeller } = useAuth();
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchSellerCoupons();
      setCoupons(data.map(_fromApi));
    } catch {
      setCoupons([]);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isSeller) { navigate("/login", { replace: true }); return; }
    load();
  }, [isLoggedIn, isSeller, navigate, load]);

  const addCoupon = async (payload) => {
    try {
      await createSellerCoupon(payload);
      await load();
      toast.success(`Coupon "${payload.code}" created!`);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.detail;
      toast.error(typeof msg === "string" ? msg : "Could not create coupon");
      return false;
    }
  };

  const toggle = async (id) => {
    const c = coupons.find(x => x.id === id);
    if (!c) return;
    try { await updateSellerCoupon(id, { active: !c.active }); await load(); }
    catch { toast.error("Could not update coupon"); }
  };

  const remove = async (id, code) => {
    if (!window.confirm(`Delete "${code}"?`)) return;
    try { await deleteSellerCoupon(id); await load(); toast.success("Coupon deleted"); }
    catch { toast.error("Could not delete coupon"); }
  };

  const copy = (code) => { navigator.clipboard.writeText(code); toast.success(`"${code}" copied!`); };

  if (!isLoggedIn || !isSeller) return null;

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-10">

          <div className="flex items-center gap-4 mb-8">
            <Link to="/seller/dashboard" className="p-2 rounded-xl hover:bg-stone-100 transition">
              <ChevronLeft size={20} style={{ color: "#6B5E52" }} />
            </Link>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>SELLER PORTAL</p>
              <h1 className="font-serif text-2xl md:text-3xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>Coupons</h1>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: "#A2466B" }}>
              <Plus size={15} /> New Coupon
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {coupons.map((c, i) => (
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22, delay: i * 0.05 }}
                  className="p-5 rounded-2xl border" style={{ backgroundColor: "white", borderColor: "#E8E4DF",
                    opacity: c.active ? 1 : 0.6 }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "rgba(201,168,76,0.1)" }}>
                      <Tag size={18} style={{ color: "#C9A84C" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-base" style={{ color: "#1a1a1a" }}>{c.code}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: c.active ? "rgba(45,122,58,0.1)" : "rgba(139,58,58,0.1)",
                            color: c.active ? "#2D7A3A" : "#8B3A3A" }}>
                          {c.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: "#6B5E52" }}>
                        {c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                        {c.minOrder > 0 ? ` · Min ₹${c.minOrder.toLocaleString("en-IN")}` : ""}
                        {c.expires ? ` · Expires ${c.expires}` : ""}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#9B8B7A" }}>{c.uses} uses</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => copy(c.code)} className="p-2 rounded-xl hover:bg-stone-50 transition" title="Copy code">
                        <Copy size={15} style={{ color: "#6B5E52" }} />
                      </button>
                      <button onClick={() => toggle(c.id)} className="p-2 rounded-xl hover:bg-stone-50 transition" title="Toggle">
                        {c.active ? <ToggleRight size={20} style={{ color: "#2D7A3A" }} /> : <ToggleLeft size={20} style={{ color: "#9B8B7A" }} />}
                      </button>
                      <button onClick={() => remove(c.id, c.code)} className="p-2 rounded-xl hover:bg-red-50 transition" title="Delete">
                        <Trash2 size={15} style={{ color: "#C0392B" }} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {showAdd && <AddCouponModal onClose={() => setShowAdd(false)} onAdd={addCoupon} />}
    </SellerLayout>
  );
}
