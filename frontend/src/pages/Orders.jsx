import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader, Package, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOrders, fetchMyReturns, createReturn } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Orders() {
    const { isLoggedIn } = useAuth();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [returnFor, setReturnFor] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login", { replace: true });
            return;
        }

        loadOrders();
    }, [isLoggedIn, navigate]);

    const loadOrders = async () => {
        try {
            const [data, rets] = await Promise.all([
                fetchOrders(),
                fetchMyReturns().catch(() => []),
            ]);
            setOrders(data.orders || []);
            setReturns(rets || []);
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const returnForOrder = (orderId) => returns.find(r => r.order_id === orderId);

    const submitReturn = async (form) => {
        try {
            await createReturn({ order_id: returnFor.id, reason: form.reason, details: form.details });
            toast.success("Return request submitted");
            setReturnFor(null);
            loadOrders();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not submit return");
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            shipped: "bg-purple-100 text-purple-800",
            delivered: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                        My Orders
                    </h1>
                    <p className="text-lg text-espresso/70">
                        Track and manage your orders
                    </p>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="flex flex-col items-center gap-4">
                            <Loader size={32} className="animate-spin text-maroon" />
                            <p className="text-espresso/60">Loading your orders...</p>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96">
                        <Package size={48} className="text-espresso/30 mb-4" />
                        <p className="text-espresso/60 text-lg mb-4">No orders yet</p>
                        <Link
                            to="/marketplace"
                            className="text-maroon font-medium hover:text-maroon/70 transition"
                        >
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    /* Orders List */
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="border border-line-soft rounded-lg p-6 hover:shadow-md transition"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-1">
                                            Order ID
                                        </p>
                                        <p className="font-medium text-espresso">#{order.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-1">
                                            Date
                                        </p>
                                        <p className="text-espresso">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-1">
                                            Total
                                        </p>
                                        <p className="font-medium text-espresso">
                                            {formatPrice(order.total ?? 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-1">
                                            Status
                                        </p>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                order.status || "pending"
                                            )}`}
                                        >
                                            {order.status?.charAt(0).toUpperCase() +
                                                order.status?.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <Link
                                            to={`/order-tracking`}
                                            className="text-maroon font-medium hover:text-maroon/70 transition"
                                        >
                                            View Details →
                                        </Link>
                                    </div>
                                </div>

                                {/* Return / refund section */}
                                {(() => {
                                    const ret = returnForOrder(order.id);
                                    if (ret) {
                                        return (
                                            <div className="mt-2 p-3 rounded-lg text-sm" style={{ backgroundColor: "#FAF7F2", border: "1px solid #E8E4DF" }}>
                                                <p className="font-semibold text-espresso flex items-center gap-1.5">
                                                    <RotateCcw size={14} /> Return {ret.id} — <span className="capitalize">{ret.status}</span>
                                                </p>
                                                <p className="text-espresso/60 text-xs mt-1">Reason: {ret.reason}</p>
                                                {ret.refund_status && ret.refund_status !== "pending" && (
                                                    <p className="text-xs mt-1 text-green-700">
                                                        Refund: {ret.refund_status} · {ret.refund_amount ? formatPrice(ret.refund_amount) : "—"} · {ret.refund_method || "—"}
                                                        {ret.refund_reference ? ` · Ref ${ret.refund_reference}` : ""}
                                                        {ret.refund_timeline ? ` · ${ret.refund_timeline}` : ""}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }
                                    if (["delivered", "shipped"].includes(order.status)) {
                                        return (
                                            <button onClick={() => setReturnFor(order)}
                                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                                                style={{ borderColor: "#E8E4DF", color: "#8B3A3A" }}>
                                                <RotateCcw size={13} /> Request Return
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {returnFor && <ReturnModal order={returnFor} onClose={() => setReturnFor(null)} onSubmit={submitReturn} />}
        </MarketplaceLayout>
    );
}

function ReturnModal({ order, onClose, onSubmit }) {
    const [form, setForm] = useState({ reason: "", details: "" });
    const submit = (e) => {
        e.preventDefault();
        if (!form.reason.trim()) { toast.error("Please provide a reason"); return; }
        onSubmit(form);
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-espresso">Request Return — #{order.id}</h2>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>
                <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase" style={{ color: "#9B8B7A" }}>Reason *
                        <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }}>
                            <option value="">Select a reason</option>
                            <option>Wrong size</option>
                            <option>Damaged / defective</option>
                            <option>Not as described</option>
                            <option>Changed my mind</option>
                            <option>Received wrong item</option>
                        </select>
                    </label>
                    <label className="block text-xs font-semibold uppercase" style={{ color: "#9B8B7A" }}>Details
                        <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                            rows={3} placeholder="Tell us more..."
                            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }} />
                    </label>
                </div>
                <div className="flex gap-3 mt-5">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "#E8E4DF" }}>Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#8B3A3A" }}>Submit Return</button>
                </div>
            </form>
        </div>
    );
}
