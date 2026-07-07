import { useState, useEffect } from "react";
import { Search, Truck } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import { api, adminCreateShipment } from "@/lib/api";

const STATUS_STYLE = {
    confirmed: "bg-green-100 text-green-700",
    shipped: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    processing: "bg-amber-100 text-amber-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";
        api.get("/admin/orders", { headers: { "X-Admin-Key": adminKey } })
            .then(res => setOrders(res.data?.orders || []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = orders.filter(o => {
        if (filter !== "All" && o.status?.toLowerCase() !== filter.toLowerCase()) return false;
        if (search) {
            const q = search.toLowerCase();
            return (o.id || "").toLowerCase().includes(q) || (o.customer_name || "").toLowerCase().includes(q);
        }
        return true;
    });

    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const delivered = orders.filter(o => o.status === "delivered").length;
    const pending = orders.filter(o => ["pending", "processing", "confirmed"].includes(o.status)).length;

    const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";
    const createShipment = async (orderId) => {
        try {
            const ship = await adminCreateShipment(orderId, null, adminKey);
            toast.success(`Shipment created — AWB ${ship.awb}${ship.test_mode ? " (test mode)" : ""}`);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_number: ship.awb, shipment_status: "created" } : o));
        } catch {
            toast.error("Could not create shipment");
        }
    };

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
                        <p className="text-2xl font-bold">₹{(totalRevenue/100000).toFixed(1)}L</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
                        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by ID or customer..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
                            style={{ borderColor: "#E8E4DF" }} />
                    </div>
                    <div className="flex gap-2">
                        {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map(f => (
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
                        <p className="text-lg font-semibold mb-2">No orders yet</p>
                        <p style={{ color: "#9B8B7A" }}>Orders will appear here when customers place them.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E4DF" }}>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b" style={{ borderColor: "#E8E4DF" }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Order ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Shipment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(o => (
                                    <tr key={o.id} className="border-b last:border-0" style={{ borderColor: "#E8E4DF" }}>
                                        <td className="px-4 py-3 font-mono font-bold">{o.id}</td>
                                        <td className="px-4 py-3">{o.customer_name || "Customer"}</td>
                                        <td className="px-4 py-3 font-semibold">₹{(o.total || 0).toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_STYLE[o.status] || "bg-gray-100 text-gray-600"}`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: "#9B8B7A" }}>{(o.created_at || "").slice(0, 10)}</td>
                                        <td className="px-4 py-3">
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
        </AdminLayout>
    );
}
