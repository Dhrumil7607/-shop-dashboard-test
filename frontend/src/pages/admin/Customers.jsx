import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Download, RefreshCw, UserRound, Mail, Phone, MapPin,
  ShoppingBag, Calendar, Heart, Ban, CheckCircle2, KeyRound, Trash2, Ruler,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import {
  fetchAdminCustomers, fetchAdminCustomer, suspendCustomer, reactivateCustomer,
  adminResetCustomerPassword, deleteCustomer, adminCustomersExportUrl,
} from "@/lib/api";

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const fmtDateTime = (s) => (s ? new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const money = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;

/* ─── Customer detail drawer ─────────────────────────────────── */
function CustomerDetail({ userId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setData(await fetchAdminCustomer(userId)); }
    catch { toast.error("Could not load customer"); onClose(); }
  }, [userId, onClose]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, msg) => {
    setBusy(true);
    try { await fn(); toast.success(msg); await load(); onChanged?.(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Action failed"); }
    finally { setBusy(false); }
  };

  const resetPw = async () => {
    const pw = window.prompt("Enter a new password for this customer (min 8 chars, mixed case, number, symbol):");
    if (!pw) return;
    try { await adminResetCustomerPassword(userId, pw); toast.success("Password reset"); }
    catch (e) { toast.error(e?.response?.data?.detail || "Could not reset password"); }
  };

  const del = async () => {
    if (!window.confirm("Permanently delete this customer account? This cannot be undone.")) return;
    setBusy(true);
    try { await deleteCustomer(userId); toast.success("Customer deleted"); onChanged?.(); onClose(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Could not delete"); setBusy(false); }
  };

  const c = data?.customer;
  const stats = data?.stats || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full bg-white overflow-y-auto shadow-2xl">
        {!data ? (
          <div className="p-8 text-center" style={{ color: "#9B8B7A" }}>Loading…</div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10" style={{ borderColor: "#E8E4DF" }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold" style={{ background: "#F0EBE3", color: "#8B3A3A" }}>
                  {(c.name || c.email || "?").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "#1a1a1a" }}>{c.name || "Customer"}</p>
                  <p className="text-xs" style={{ color: "#9B8B7A" }}>{c.email}</p>
                </div>
                {c.is_suspended && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "#FEE2E2", color: "#991B1B" }}>SUSPENDED</span>}
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Contact + meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2" style={{ color: "#4A3F35" }}><Mail size={14} style={{ color: "#9B8B7A" }} /> {c.email}</div>
                <div className="flex items-center gap-2" style={{ color: "#4A3F35" }}><Phone size={14} style={{ color: "#9B8B7A" }} /> {c.phone || "—"}</div>
                <div className="flex items-center gap-2" style={{ color: "#4A3F35" }}><MapPin size={14} style={{ color: "#9B8B7A" }} /> {c.city || "—"}</div>
                <div className="flex items-center gap-2" style={{ color: "#4A3F35" }}><Calendar size={14} style={{ color: "#9B8B7A" }} /> Joined {fmtDate(c.created_at)}</div>
                <div className="col-span-2 text-xs" style={{ color: "#9B8B7A" }}>Last login: {fmtDateTime(c.last_login_at)}</div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[["Orders", stats.order_count, ShoppingBag], ["Bookings", stats.booking_count, Calendar], ["Spent", money(stats.total_spent), null]].map(([label, val, Icon]) => (
                  <div key={label} className="rounded-xl border p-3 text-center" style={{ borderColor: "#E8E4DF" }}>
                    <p className="text-lg font-bold" style={{ color: "#1a1a1a" }}>{val}</p>
                    <p className="text-[11px]" style={{ color: "#9B8B7A" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {c.is_suspended ? (
                  <button disabled={busy} onClick={() => act(() => reactivateCustomer(userId), "Customer reactivated")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#2D7A3A" }}>
                    <CheckCircle2 size={14} /> Reactivate
                  </button>
                ) : (
                  <button disabled={busy} onClick={() => act(() => suspendCustomer(userId), "Customer suspended")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: "#FEF3C7", color: "#92400E" }}>
                    <Ban size={14} /> Suspend
                  </button>
                )}
                <button disabled={busy} onClick={resetPw}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
                  <KeyRound size={14} /> Reset Password
                </button>
                <button disabled={busy} onClick={del}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              {/* Orders */}
              <Section title={`Order History (${data.orders.length})`} icon={ShoppingBag}>
                {data.orders.length === 0 ? <Empty text="No orders yet" /> : data.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0" style={{ borderColor: "#F0EBE3" }}>
                    <div><span className="font-mono font-semibold">{o.id}</span> <span className="text-xs capitalize" style={{ color: "#9B8B7A" }}>· {o.status}</span></div>
                    <div className="text-right"><span className="font-semibold">{money(o.total)}</span><br /><span className="text-[11px]" style={{ color: "#9B8B7A" }}>{fmtDate(o.created_at)}</span></div>
                  </div>
                ))}
              </Section>

              {/* Bookings */}
              <Section title={`Live Bookings (${data.bookings.length})`} icon={Calendar}>
                {data.bookings.length === 0 ? <Empty text="No bookings" /> : data.bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0" style={{ borderColor: "#F0EBE3" }}>
                    <div>{b.store_name || "Store"} <span className="text-xs capitalize" style={{ color: "#9B8B7A" }}>· {b.status}</span></div>
                    <span className="text-[11px]" style={{ color: "#9B8B7A" }}>{b.date} {b.time}</span>
                  </div>
                ))}
              </Section>

              {/* Wishlist */}
              <Section title={`Wishlist (${data.wishlist.length})`} icon={Heart}>
                {data.wishlist.length === 0 ? <Empty text="Empty wishlist" /> : (
                  <div className="grid grid-cols-2 gap-2">
                    {data.wishlist.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        {p.image_url && <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                        <span className="truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Addresses */}
              <Section title={`Saved Addresses (${data.addresses.length})`} icon={MapPin}>
                {data.addresses.length === 0 ? <Empty text="No addresses on record" /> : data.addresses.map((a, i) => (
                  <p key={i} className="text-sm py-1.5 border-b last:border-0" style={{ borderColor: "#F0EBE3", color: "#4A3F35" }}>
                    {[a.name || a.full_name, a.address, a.city, a.state, a.country, a.pincode || a.zip].filter(Boolean).join(", ")}
                  </p>
                ))}
              </Section>

              {/* Size profiles */}
              <Section title={`AI Size Profiles (${(data.size_profiles || []).length})`} icon={Ruler}>
                {(data.size_profiles || []).length === 0
                  ? <Empty text="No size profiles saved to the account" />
                  : data.size_profiles.map((sp, i) => (
                    <p key={i} className="text-sm py-1" style={{ color: "#4A3F35" }}>{sp.name || `Profile ${i + 1}`}</p>
                  ))}
              </Section>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9B8B7A" }}>
        {Icon && <Icon size={13} />} {title}
      </p>
      {children}
    </div>
  );
}
const Empty = ({ text }) => <p className="text-sm py-2" style={{ color: "#C4B9AE" }}>{text}</p>;

/* ─── Main page ──────────────────────────────────────────────── */
export default function AdminCustomers() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (status !== "all") params.status = status;
      const data = await fetchAdminCustomers(params);
      setRows(data.customers || []); setTotal(data.total || 0);
    } catch { setRows([]); }
    finally { setLoading(false); }
  }, [q, status]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const exportCsv = () => {
    const key = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";
    // Fetch with header then trigger download (avoids exposing key in a URL)
    fetch(adminCustomersExportUrl(), { headers: { "X-Admin-Key": key } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "shoplivebharat-customers.csv"; a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Export failed"));
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Customers</h1>
            <p className="text-sm mt-1" style={{ color: "#9B8B7A" }}>{total} registered customer{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#1a1a1a" }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email, or phone…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
          </div>
          <div className="flex gap-2">
            {["all", "active", "suspended"].map(f => (
              <button key={f} onClick={() => setStatus(f)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
                style={{ backgroundColor: status === f ? "#1a1a1a" : "#f0ebe3", color: status === f ? "#fff" : "#6B5E52" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center py-16" style={{ color: "#9B8B7A" }}>Loading…</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border" style={{ borderColor: "#E8E4DF" }}>
            <UserRound size={32} className="mx-auto mb-2" style={{ color: "#C4B9AE" }} />
            <p className="font-semibold">No customers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: "#E8E4DF" }}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b" style={{ borderColor: "#E8E4DF" }}>
                <tr>
                  {["Customer", "Contact", "Orders", "Bookings", "Spent", "Joined", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c.id)} className="border-b last:border-0 cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: "#E8E4DF" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#F0EBE3", color: "#8B3A3A" }}>
                          {(c.name || c.email || "?").slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-medium">{c.name || "Customer"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B5E52" }}>{c.email}<br />{c.phone}</td>
                    <td className="px-4 py-3 font-semibold">{c.order_count}</td>
                    <td className="px-4 py-3">{c.booking_count}</td>
                    <td className="px-4 py-3 font-semibold">{money(c.total_spent)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9B8B7A" }}>{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={c.is_suspended ? { background: "#FEE2E2", color: "#991B1B" } : { background: "#DCFCE7", color: "#166534" }}>
                        {c.is_suspended ? "SUSPENDED" : "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <CustomerDetail userId={selected} onClose={() => setSelected(null)} onChanged={load} />}
      </AnimatePresence>
    </AdminLayout>
  );
}
