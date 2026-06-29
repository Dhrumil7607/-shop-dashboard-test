import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Package, Truck, CheckCircle2, ChevronRight, Download, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { fetchOrders } from "@/lib/api";

const MOCK_ORDERS = [
    {
        id: "ORD-2026-001",
        status: "delivered",
        items: 2,
        total: 12490,
        date: "2026-06-15",
        estimatedDelivery: "2026-06-22",
        timeline: [
            { step: "Order Placed", date: "2026-06-15", completed: true },
            { step: "Processing", date: "2026-06-16", completed: true },
            { step: "Shipped", date: "2026-06-18", completed: true },
            { step: "Delivered", date: "2026-06-22", completed: true },
        ],
        tracking: "https://tracking.example.com/ORD-2026-001",
    },
    {
        id: "ORD-2026-002",
        status: "in_transit",
        items: 1,
        total: 7890,
        date: "2026-06-25",
        estimatedDelivery: "2026-07-02",
        timeline: [
            { step: "Order Placed", date: "2026-06-25", completed: true },
            { step: "Processing", date: "2026-06-26", completed: true },
            { step: "Shipped", date: "2026-06-28", completed: true },
            { step: "Delivery", date: "2026-07-02", completed: false },
        ],
        tracking: "https://tracking.example.com/ORD-2026-002",
    },
];

const STATUS_CONFIG = {
    pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-700", icon: "⏳" },
    processing: { label: "Processing", color: "bg-blue-500/10 text-blue-700", icon: "⚙️" },
    in_transit: { label: "In Transit", color: "bg-purple-500/10 text-purple-700", icon: "🚚" },
    delivered: { label: "Delivered", color: "bg-green-500/10 text-green-700", icon: "✓" },
    cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-700", icon: "✕" },
};

function OrderCard({ order, index }) {
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl border border-white/25 p-6 md:p-8 hover:shadow-lg transition-all duration-300"
        >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Order Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <h3 className="font-serif text-2xl text-espresso">{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                            {config.icon} {config.label}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-stone/60 mb-1">Items</p>
                            <p className="font-serif text-xl text-espresso">{order.items}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-stone/60 mb-1">Total</p>
                            <p className="font-serif text-xl text-maroon">₹{order.total.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-stone/60 mb-1">Order Date</p>
                            <p className="text-sm text-stone">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Timeline Progress */}
                    <div className="space-y-2 mb-6">
                        {order.timeline.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <div className={`w-2 h-2 rounded-full transition-all ${item.completed ? "bg-maroon" : "bg-stone/30"}`} />
                                <span className={`text-xs ${item.completed ? "text-espresso font-medium" : "text-stone/50"}`}>
                                    {item.step} · {new Date(item.date).toLocaleDateString()}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <motion.div
                    className="flex flex-col gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <button className="flex items-center justify-center gap-2 px-6 py-3 bg-maroon/10 hover:bg-maroon/20 text-maroon rounded-lg font-medium text-sm transition-all duration-300 group/btn">
                        <Truck className="w-4 h-4" strokeWidth={1.5} />
                        Track
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <button className="flex items-center justify-center gap-2 px-6 py-3 bg-espresso/10 hover:bg-espresso/20 text-espresso rounded-lg font-medium text-sm transition-all duration-300">
                        <Download className="w-4 h-4" strokeWidth={1.5} />
                        Invoice
                    </button>
                </motion.div>
            </div>

            {/* Hover Glow Effect */}
            <motion.div
                className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 rounded-[1.6rem] blur-2xl transition-opacity duration-300"
                style={{
                    background: "linear-gradient(135deg, rgba(139, 58, 58, 0.1), rgba(212, 175, 55, 0.05))",
                }}
            />
        </motion.div>
    );
}

export default function OrderTracking() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setOrders(MOCK_ORDERS);
            setLoading(false);
        }, 600);
    }, []);

    const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

    return (
        <main className="min-h-screen bg-gradient-to-b from-ivory to-cream pt-20 pb-20">
            <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <Link
                        to="/account"
                        className="inline-flex items-center gap-2 text-maroon hover:text-maroon/70 text-sm font-medium mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        Back to Account
                    </Link>
                    <h1 className="font-serif text-5xl md:text-6xl text-espresso tracking-tightest mb-3">
                        Order <span className="serif-italic text-maroon">Tracking</span>
                    </h1>
                    <p className="text-lg text-stone max-w-2xl">
                        Follow your purchases from our atelier to your door. Real-time updates at every step.
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-3 mb-12"
                >
                    {["all", "pending", "processing", "in_transit", "delivered"].map((status) => (
                        <motion.button
                            key={status}
                            onClick={() => setFilter(status)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                filter === status
                                    ? "bg-maroon text-ivory shadow-lg"
                                    : "bg-white/40 text-espresso hover:bg-white/60 backdrop-blur-sm border border-white/25"
                            }`}
                        >
                            {status === "all" ? "All Orders" : STATUS_CONFIG[status]?.label || status}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Orders List */}
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-20"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-maroon/20 border-t-maroon rounded-full"
                        />
                    </motion.div>
                ) : filteredOrders.length > 0 ? (
                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } },
                        }}
                    >
                        {filteredOrders.map((order, i) => (
                            <OrderCard key={order.id} order={order} index={i} />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Package className="w-16 h-16 text-stone/30 mx-auto mb-4" strokeWidth={1} />
                        <p className="text-lg text-stone">No orders found</p>
                        <p className="text-sm text-stone/60 mt-2">Start shopping to see your orders here</p>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
