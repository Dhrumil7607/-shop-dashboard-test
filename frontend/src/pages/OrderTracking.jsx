import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Package, Truck, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchOrders } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";

const STATUS_CONFIG = {
    pending:    { label: "Pending",    color: "bg-yellow-500/10 text-yellow-700", icon: "⏳" },
    confirmed:  { label: "Confirmed",  color: "bg-blue-500/10 text-blue-700",    icon: "✅" },
    processing: { label: "Processing", color: "bg-blue-500/10 text-blue-700",    icon: "⚙️" },
    shipped:    { label: "Shipped",    color: "bg-purple-500/10 text-purple-700", icon: "🚚" },
    in_transit: { label: "In Transit", color: "bg-purple-500/10 text-purple-700", icon: "🚚" },
    delivered:  { label: "Delivered",  color: "bg-green-500/10 text-green-700",  icon: "✓" },
    cancelled:  { label: "Cancelled",  color: "bg-red-500/10 text-red-700",      icon: "✕" },
};

function buildTimeline(order) {
    const steps = [
        { step: "Order Placed",  key: "confirmed" },
        { step: "Processing",    key: "processing" },
        { step: "Shipped",       key: "shipped" },
        { step: "Delivered",     key: "delivered" },
    ];
    const statusRank = { confirmed: 0, processing: 1, shipped: 2, in_transit: 2, delivered: 3 };
    const current = statusRank[order.status] ?? 0;
    return steps.map((s, i) => ({
        step: s.step,
        date: i === 0 ? order.created_at : "",
        completed: i <= current,
    }));
}

function OrderCard({ order, index }) {
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const timeline = buildTimeline(order);
    const itemCount = order.items?.length ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="group relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/30 p-6 md:p-8 hover:shadow-lg transition-all duration-300"
        >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                    {/* Order ID + status */}
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <h3 className="font-serif text-xl text-espresso">#{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                            {config.icon} {config.label}
                        </span>
                    </div>

                    {/* Items preview */}
                    {order.items?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 text-xs border border-white/40"
                                    style={{ color: "#3C3027" }}>
                                    {item.image_url && (
                                        <img src={item.image_url} alt={item.product_name}
                                            className="w-8 h-8 rounded-lg object-cover"
                                            onError={e => { e.target.style.display = "none"; }} />
                                    )}
                                    <span className="font-semibold">{item.product_name || "Item"}</span>
                                    <span className="opacity-60">× {item.quantity}</span>
                                    <span className="font-semibold" style={{ color: "#A2466B" }}>₹{(item.line_total || item.price * item.quantity || 0).toLocaleString("en-IN")}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] opacity-50 mb-1">Items</p>
                            <p className="font-serif text-xl text-espresso">{itemCount}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] opacity-50 mb-1">Total</p>
                            <p className="font-serif text-xl text-maroon">₹{(order.total || 0).toLocaleString("en-IN")}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] opacity-50 mb-1">Date</p>
                            <p className="text-sm text-espresso">
                                {order.created_at
                                    ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2.5 mb-5">
                        {timeline.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${item.completed ? "bg-maroon shadow-sm" : "bg-stone/20"}`} />
                                <span className={`text-xs ${item.completed ? "text-espresso font-medium" : "text-stone/40"}`}>
                                    {item.step}
                                    {item.date ? ` · ${new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Shipping address */}
                    {order.shipping_address && (
                        <p className="text-xs opacity-50 flex items-center gap-1">
                            <MapPin size={11} />
                            {[order.shipping_address.full_name, order.shipping_address.city, order.shipping_address.country].filter(Boolean).join(", ")}
                        </p>
                    )}
                </div>

                {/* Side actions */}
                <div className="flex flex-col gap-3 flex-shrink-0 min-w-[140px]">
                    {order.tracking_number ? (
                        <a href={`https://shiprocket.co/tracking/${order.tracking_number}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-maroon/10 hover:bg-maroon/20 text-maroon rounded-xl font-medium text-sm transition-all">
                            <Truck className="w-4 h-4" strokeWidth={1.5} />
                            Track Shipment
                        </a>
                    ) : (
                        <div className="flex items-center justify-center gap-2 px-5 py-3 bg-stone/5 text-stone/50 rounded-xl text-xs text-center">
                            Tracking available after shipment
                        </div>
                    )}
                    <p className="text-xs text-center opacity-50">
                        Payment: <span className="font-medium capitalize">{order.payment_status || "paid"}</span>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default function OrderTracking() {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (!isLoggedIn) { navigate("/login", { replace: true }); return; }
        setLoading(true);
        fetchOrders()
            .then(data => setOrders(data?.orders || []))
            .catch(() => toast.error("Could not load orders"))
            .finally(() => setLoading(false));
    }, [isLoggedIn, navigate]);

    const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

    return (
        <MarketplaceLayout>
            <main className="min-h-screen bg-gradient-to-b from-ivory to-cream pt-20 pb-20">
                <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }} className="mb-12">
                        <Link to="/orders"
                            className="inline-flex items-center gap-2 text-maroon hover:text-maroon/70 text-sm font-medium mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                            Back to My Orders
                        </Link>
                        <h1 className="font-serif text-5xl md:text-6xl text-espresso mb-3">
                            Order <span className="italic text-maroon">Tracking</span>
                        </h1>
                        <p className="text-lg text-stone/70 max-w-2xl">
                            Follow your purchases from our atelier to your door.
                        </p>
                    </motion.div>

                    {/* Filter tabs */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }} className="flex flex-wrap gap-3 mb-10">
                        {["all", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(status => (
                            <button key={status} onClick={() => setFilter(status)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                    filter === status
                                        ? "bg-maroon text-ivory shadow-md"
                                        : "bg-white/50 text-espresso hover:bg-white/80 border border-white/30"
                                }`}>
                                {status === "all" ? "All Orders" : STATUS_CONFIG[status]?.label || status}
                            </button>
                        ))}
                    </motion.div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <motion.div animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-10 h-10 border-4 border-maroon/20 border-t-maroon rounded-full" />
                        </div>
                    ) : filteredOrders.length > 0 ? (
                        <div className="space-y-5">
                            {filteredOrders.map((order, i) => <OrderCard key={order.id} order={order} index={i} />)}
                        </div>
                    ) : (
                        <div className="text-center py-24">
                            <Package className="w-14 h-14 text-stone/20 mx-auto mb-4" strokeWidth={1} />
                            <p className="text-lg font-serif text-espresso mb-2">No orders found</p>
                            <p className="text-sm text-stone/50 mb-6">
                                {orders.length === 0 ? "Place an order to see it tracked here." : "No orders match this filter."}
                            </p>
                            <Link to="/marketplace"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-maroon text-ivory rounded-xl text-sm font-semibold hover:bg-maroon/90 transition">
                                Start Shopping →
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </MarketplaceLayout>
    );
}
