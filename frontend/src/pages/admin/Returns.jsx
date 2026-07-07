/**
 * Returns.jsx — /admin/returns
 * Admin view of all customer return/refund requests. Backend is source of truth.
 */
import { useState, useEffect, useCallback } from "react";
import { Search, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchAdminReturns, updateAdminReturn } from "@/lib/api";

const STATUS_STYLE = {
  requested: "bg-yellow-100 text-yellow-700",
  approved:  "bg-blue-100 text-blue-700",
  received:  "bg-purple-100 text-purple-700",
  rejected:  "bg-red-100 text-red-700",
  refunded:  "bg-green-100 text-green-700",
};

export default function AdminReturns() {
  const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReturns(await fetchAdminReturns(adminKey, filter));
    } catch {
      setReturns([]);
      toast.error("Could not load returns");
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = returns.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (r.id || "").toLowerCase().includes(q) ||
           (r.order_id || "").toLowerCase().includes(q) ||
           (r.customer_name || "").toLowerCase().includes(q);
  });

  const saveRefund = async (form) => {
    try {
      await updateAdminReturn(selected.id, form, adminKey);
      toast.success("Return updated");
      setSelected(null);
      load();
    } catch {
      toast.error("Could not update return");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Returns & Refunds</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by return ID, order, customer..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
        </div>
        <div className="flex gap-2">
          {["all", "requested", "approved", "received", "refunded", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
              style={{ backgroundColor: filter === f ? "#1a1a1a" : "#f0ebe3", color: filter === f ? "#fff" : "#6B5E52" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center py-16" style={{ color: "#9B8B7A" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border" style={{ borderColor: "#E8E4DF" }}>
          <RotateCcw size={40} className="mx-auto mb-3" style={{ color: "#E8E4DF" }} />
          <p className="text-lg font-semibold mb-1">No return requests</p>
          <p style={{ color: "#9B8B7A" }}>Customer return requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E8E4DF" }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold font-mono" style={{ color: "#9B8B7A" }}>{r.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_STYLE[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                    <span className="text-xs" style={{ color: "#9B8B7A" }}>Order {r.order_id}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{r.customer_name} <span className="font-normal" style={{ color: "#9B8B7A" }}>{r.customer_email}</span></p>
                  <p className="text-sm mt-1" style={{ color: "#6B5E52" }}><strong>Reason:</strong> {r.reason}{r.details ? ` — ${r.details}` : ""}</p>
                  {r.refund_status && r.refund_status !== "pending" && (
                    <div className="mt-2 p-2 rounded-lg text-xs inline-block" style={{ backgroundColor: "#F0FFF4", border: "1px solid #BBF7D0", color: "#065F46" }}>
                      Refund: {r.refund_status} · ₹{r.refund_amount ?? "—"} · {r.refund_method || "—"} · Ref {r.refund_reference || "—"} · {r.refund_timeline || ""}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(r)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: "#1a1a1a", color: "#fff" }}>
                  Process
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <RefundModal ret={selected} onClose={() => setSelected(null)} onSave={saveRefund} />}
    </AdminLayout>
  );
}

function RefundModal({ ret, onClose, onSave }) {
  const [form, setForm] = useState({
    status: ret.status || "approved",
    refund_amount: ret.refund_amount || "",
    refund_method: ret.refund_method || "UPI",
    refund_status: ret.refund_status || "pending",
    refund_reference: ret.refund_reference || "",
    refund_timeline: ret.refund_timeline || "5-7 business days",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Process Return {ret.id}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase" style={{ color: "#9B8B7A" }}>Return Status
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }}>
              {["requested", "approved", "received", "rejected", "refunded"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold uppercase" style={{ color: "#9B8B7A" }}>Refund Amount (₹)
              <input type="number" value={form.refund_amount} onChange={e => set("refund_amount", e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }} />
            </label>
            <label className="block text-xs font-semibold uppercase" style={{ color: "#9B8B7A" }}>Method
              <select value={form.refund_method} onChange={e => set("refund_method", e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }}>
                {["UPI", "Card", "Bank Transfer", "Store Credit", "Original Payment"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold uppercase" style={{ color: "#9B8B7A" }}>Refund Status
              <select value={form.refund_status} onChange={e => set("refund_status", e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }}>
                {["pending", "processing", "processed", "failed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase" style={{ color: "#9B8B7A" }}>Reference / TXN ID
              <input value={form.refund_reference} onChange={e => set("refund_reference", e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }} />
            </label>
          </div>
          <label className="block text-xs font-semibold uppercase" style={{ color: "#9B8B7A" }}>Expected Timeline
            <input value={form.refund_timeline} onChange={e => set("refund_timeline", e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }} />
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "#E8E4DF" }}>Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#2D7A3A" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
