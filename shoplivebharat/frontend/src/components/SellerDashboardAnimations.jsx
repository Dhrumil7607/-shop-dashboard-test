import { motion } from "framer-motion";
import { sellerDashboardVariants, transitionPresets } from "@/utils/microAnimations";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

export function NewOrderCard({ order }) {
    return (
        <motion.div
            className="bg-white border-2 border-gold/30 rounded-lg p-4 mb-4"
            variants={sellerDashboardVariants.newOrderCard}
            animate="animate"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={transitionPresets.standard}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <motion.h4
                        className="font-semibold text-espresso mb-1"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {order.productName}
                    </motion.h4>
                    <motion.p
                        className="text-sm text-stone"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                    >
                        Order #{order.orderId}
                    </motion.p>
                </div>

                <motion.div
                    className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <span className="text-xl">🎉</span>
                </motion.div>
            </div>

            <motion.button
                className="mt-3 w-full py-2 bg-gold text-white rounded-lg font-medium text-sm hover:bg-gold/90 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={transitionPresets.quick}
            >
                View Details
            </motion.button>
        </motion.div>
    );
}

export function UploadProgressBar({ progress = 0 }) {
    return (
        <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitionPresets.standard}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-espresso">Product Upload</p>
                <motion.span
                    className="text-sm text-gold font-semibold"
                    key={Math.floor(progress)}
                >
                    {Math.floor(progress)}%
                </motion.span>
            </div>

            <div className="relative h-2 bg-stone/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-gold to-maroon"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>

            {progress === 100 && (
                <motion.p
                    className="text-xs text-green-600 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={transitionPresets.quick}
                >
                    ✓ Upload complete!
                </motion.p>
            )}
        </motion.div>
    );
}

export function StatusBadge({ status = "pending" }) {
    const statusConfig = {
        pending: {
            bg: "bg-yellow-50",
            text: "text-yellow-700",
            border: "border-yellow-200",
            icon: Clock,
            label: "Pending Review",
            animation: "pulse",
        },
        approved: {
            bg: "bg-green-50",
            text: "text-green-700",
            border: "border-green-200",
            icon: CheckCircle,
            label: "Approved",
        },
        rejected: {
            bg: "bg-red-50",
            text: "text-red-700",
            border: "border-red-200",
            icon: AlertCircle,
            label: "Rejected",
        },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <motion.div
            className={`${config.bg} ${config.border} border rounded-lg px-4 py-3 flex items-center gap-3`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={transitionPresets.standard}
        >
            <motion.div
                animate={status === "pending" ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                    duration: 2,
                    repeat: status === "pending" ? Infinity : 0,
                }}
            >
                <Icon size={20} className={config.text} />
            </motion.div>

            <div className="flex-1">
                <p className={`font-medium text-sm ${config.text}`}>
                    {config.label}
                </p>
                {status === "pending" && (
                    <p className="text-xs text-yellow-600">
                        Review in progress...
                    </p>
                )}
            </div>

            {status === "approved" && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                >
                    <CheckCircle size={20} className="text-green-600" />
                </motion.div>
            )}
        </motion.div>
    );
}

export function DashboardStatCard({ label, value, change = null }) {
    return (
        <motion.div
            className="bg-white border border-stone/10 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={transitionPresets.standard}
            whileHover={{ boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)" }}
        >
            <motion.p
                className="text-xs text-stone uppercase tracking-wider mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                {label}
            </motion.p>

            {/* Animated Number Counter */}
            <motion.p
                className="text-3xl font-bold text-espresso"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                {value}
            </motion.p>

            {/* Change Indicator */}
            {change && (
                <motion.p
                    className={`text-xs mt-2 ${
                        change > 0 ? "text-green-600" : "text-red-600"
                    }`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {change > 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
                </motion.p>
            )}
        </motion.div>
    );
}

export function SellerMetricsGrid({ metrics = [] }) {
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transitionPresets.standard}
        >
            {metrics.map((metric, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                        ...transitionPresets.standard,
                        delay: i * 0.1,
                    }}
                >
                    <DashboardStatCard
                        label={metric.label}
                        value={metric.value}
                        change={metric.change}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}
