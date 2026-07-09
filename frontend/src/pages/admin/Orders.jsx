import { useState, useEffect, useCallback } from "react";
import { Search, Truck, X, Package, MapPin, CreditCard, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import { api, adminCreateShipment } from "@/lib/api";

const STATUS_STYLE = {
    confirmed: "bg-green-100 text-green-700",
    shipped: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    processing: "bg-amber-100 text-amber-700",
    pending: "bg-yellow-100 text-yellow-700",
    pending_payment: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
};
const STATUS_OPTIONS = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled"];

const adminKey = () => localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";

/* ─── Order detail modal ─────────────────────────────────────── */
function OrderDetail({ order, onClose, onUpdated, onShip }) {
    const [status, setStatus] = useState(order.status || "confirmed");
    const [tracking, setTracking] = useState(order.tracking_number || "");
    const [saving, setSaving] = useState(false);
    const addr = order.shipping_address || {};

    const save = async () => {
        setSaving(true);
        try {
            const changes = { status };
            if (tracking && tracking !== order.tracking_number) changes.tracking_number = tracking;
            const { data } = await api.patch(`/admin/orders/${order.id}`, changes, { headers: { "X-Admin-Key": adminKey() } });
            toast.success("Order updated — customer notified by email");
            onUpdated({ ...order, ...data });
            onClose();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Could not update order");
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10" style={{ borderColor: "#E8E4DF" }}>
                    <div>
                        <p className="font-mono font-bold text-lg" style={{ color: "#1a1a1a" }}>{order.id}</p>
                        <p className="text-xs" style={{ color: "#9B8B7A" }}>{(order.created_at || "").slice(0, 16).replace("T", " ")}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Items */}
                    <div>
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9B8B7A" }}>
                            <Package size={13} /> Items ({(order.items || []).length})
                        </p>
                        <div className="rounded-xl border divide-y" style={{ borderColor: "#E8E4DF" }}>
                            {(order.items || []).map((it, i) => (
                                <div key={i} className="flex items-center gap-3 p-3">
                                    {it.image_url && <img src={it.image_url} alt="" className="w-11 h-11 rounded-lg object-cover" style={{ background: "#F0EBE3" }} />}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>{it.product_name || "Item"}</p>
                                        <p className="text-xs" style={{ color: "#9B8B7A" }}>
                                            Qty {it.quantity}{it.size ? ` · Size ${it.size}` : ""}{it.color ? ` · ${it.color}` : ""}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold">₹{(it.line_total ?? it.price ?? 0).toLocaleString("en-IN")}</p>
                                </div>
                            ))}
                            {(order.items || []).length === 0 && <p className="p-3 text-sm" style={{ color: "#9B8B7A" }}>No item details.</p>}
                        </div>
                        <div className="flex justify-between mt-2 px-1">
                            <span className="text-sm font-semibold">Total</span>
                            <span className="text-sm font-bold">₹{(order.total || 0).toLocaleString("en-IN")}</span>
                        </div>
                    </div>

                    {/* Customer + address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border p-3" style={{ borderColor: "#E8E4DF" }}>
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9B8B7A" }}>
                                <User size={13} /> Customer
                            </p>
                            <p className="text-sm font-medium">{order.customer_name || addr.name || addr.full_name || "Customer"}</p>
                            <p className="text-xs" style={{ color: "#6B5E52" }}>{order.customer_email || addr.email || "—"}</p>
                            <p className="text-xs" style={{ color: "#6B5E52" }}>{order.customer_phone || addr.phone || "—"}</p>
                        </div>
                        <div className="rounded-xl border p-3" style={{ borderColor: "#E8E4DF" }}>
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9B8B7A" }}>
                                <MapPin size={13} /> Shipping
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: "#6B5E52" }}>
                                {[addr.address, addr.city, addr.state, addr.country, addr.pincode || addr.zip].filter(Boolean).join(", ") || "No address"}
                            </p>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="rounded-xl border p-3" style={{ borderColor: "#E8E4DF" }}>
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9B8B7A" }}>
                            <CreditCard size={13} /> Payment
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: "#6B5E52" }}>
                            <span>Method: <strong>{order.payment_method || "razorpay"}</strong></span>
                            <span>Status: <strong>{order.payment_status || "—"}</strong></span>
                            {order.razorpay_payment_id && <span>Payment ID: <span className="font-mono" style={{ color: "#0B6E4F" }}>{order.razorpay_payment_id}</span></span>}
                            {order.razorpay_order_id && <span>RZP order: <span className="font-mono">{order.razorpay_order_id}</span></span>}
                        </div>
                    </div>

                    {/* Status management */}
                    <div className="rounded-xl border p-4" style={{ borderColor: "#E8E4DF", backgroundColor: "#FAFAF8" }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9B8B7A" }}>Update Order</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs mb-1" style={{ color: "#6B5E52" }}>Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-white capitalize" style={{ borderColor: "#E8E4DF" }}>
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs mb-1" style={{ color: "#6B5E52" }}>Tracking number</label>
                                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="AWB / tracking"
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none" style={{ borderColor: "#E8E4DF" }} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <button onClick={save} disabled={saving}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#1a1a1a", opacity: saving ? 0.6 : 1 }}>
                                {saving ? "Saving…" : "Save & Notify Customer"}
                            </button>
                            {!order.tracking_number && (
                                <button onClick={() => onShip(order.id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "#E8E4DF", color: "#1B2A6B" }}>
                                    <Truck size={14} /> Create Shipment
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] mt-2" style={{ color: "#9B8B7A" }}>Changing the status emails the customer automatically.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        api.get("/admin/orders", { headers: { "X-Admin-Key": adminKey() } })
            .then(res => setOrders(res.data?.orders || []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = orders.filter(o => {
        if (filter !== "All" && o.status?.toLowerCase() !== filter.toLowerCase()) return false;
        if (search) {
            const q = search.toLowerCase();
            return (o.id || "").toLowerCase().includes(q)
                || (o.customer_name || "").toLowerCase().includes(q)
                || (o.razorpay_payment_id || "").toLowerCase().includes(q);
        }
        return true;
    });

    const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
    const delivered = orders.filter(o => o.status === "delivered").length;
    const pending = orders.filter(o => ["pending", "processing", "confirmed"].includes(o.status)).length;

    const createShipment = async (orderId) => {
        try {
            const ship = await adminCreateShipment(orderId, null, adminKey());
            toast.success(`Shipment created — AWB ${ship.awb}${ship.test_mode ? " (test mode)" : ""}`);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_number: ship.awb, shipment_status: "created" } : o));
            setSelected(prev => prev && prev.id === orderId ? { ...prev, tracking_number: ship.awb } : prev);
        } catch {
            toast.error("Could not create shipment");
        }
    };

    const onUpdated = (updated) => setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));

    return (
        <AdminLayout>
            <div>
                <h1 className="text-3xl font-bold text-espresso mb-6">Orders</h1>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
                        <p className="text-xs uppercase tracking-wider" style={{ color: "#9B8B7A" }}>Total Orders</p>
                        <p className="text-2xl font-bold">{orders.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
                        <p className="text-xs uppercase tracking-wider" style={{ color: "#9B8B7A" }}>Delivered</p>
                        <p className="text-2xl font-bold text-green-600">{delivered}</p>
                    </div>
                    <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
                        <p className="text-xs uppercase tracking-wider" style={{ color: "#9B8B7A" }}>Pending</p>
                        <p className="text-2xl font-bold text-amber-600">{pending}</p>
                    </div>
                    <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E8E4DF" }}>
                        <p className="text-xs uppercase tracking-wider" style={{ color: "#9B8B7A" }}>Revenue</p>
                        <p className="text-2xl font-bold">₹{(totalRevenue / 100000).toFixed(1)}L</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
                        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by ID, customer, or payment ID..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
                            style={{ borderColor: "#E8E4DF" }} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {["All", "Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: filter === f ? "#1a1a1a" : "#f0ebe3", color: filter === f ? "#fff" : "#6B5E52" }}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <p className="text-center py-16" style={{ color: "#9B8B7A" }}>Loading...</p>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border" style={{ borderColor: "#E8E4DF" }}>
                        <p className="text-lg font-semibold mb-2">No orders found</p>
                        <p style={{ color: "#9B8B7A" }}>Orders will appear here when customers place them.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: "#E8E4DF" }}>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b" style={{ borderColor: "#E8E4DF" }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Order ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Payment</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Shipment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(o => (
                                    <tr key={o.id} onClick={() => setSelected(o)}
                                        className="border-b last:border-0 cursor-pointer hover:bg-gray-50 transition" style={{ borderColor: "#E8E4DF" }}>
                                        <td className="px-4 py-3 font-mono font-bold">{o.id}</td>
                                        <td className="px-4 py-3">{o.customer_name || "Customer"}</td>
                                        <td className="px-4 py-3 font-semibold">₹{(o.total || 0).toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-3">
                                            {o.razorpay_payment_id ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold" style={{ color: "#0B6E4F" }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#0B6E4F" }} />
                                                    {o.razorpay_payment_id}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                                    style={{ backgroundColor: "#F3F4F6", color: "#9B8B7A" }}>
                                                    {o.payment_method === "cod" ? "COD" : "—"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_STYLE[o.status] || "bg-gray-100 text-gray-600"}`}>
                                                {(o.status || "").replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: "#9B8B7A" }}>{(o.created_at || "").slice(0, 10)}</td>
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            {o.tracking_number ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-mono" style={{ color: "#2D7A3A" }}>
                                                    <Truck size={12} /> {o.tracking_number}
                                                </span>
                                            ) : (
                                                <button onClick={() => createShipment(o.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border"
                                                    style={{ borderColor: "#E8E4DF", color: "#1B2A6B" }}>
                                                    <Truck size={12} /> Ship
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selected && (
                    <OrderDetail
                        order={selected}
                        onClose={() => setSelected(null)}
                        onUpdated={onUpdated}
                        onShip={createShipment}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
