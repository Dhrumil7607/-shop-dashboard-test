import { motion, AnimatePresence } from "framer-motion";
import { orderSuccessVariants, transitionPresets } from "@/utils/microAnimations";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export default function OrderSuccessAnimation({ orderNumber = "ORD123456" }) {
    // Confetti pieces
    const confetti = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
    }));

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-white/80 to-gold/10 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionPresets.quick}
        >
            {/* Confetti Animation */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {confetti.map((piece) => (
                    <motion.div
                        key={piece.id}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            left: `${piece.left}%`,
                            top: "-10px",
                            backgroundColor: [
                                "#C9A84C",
                                "#A2466B",
                                "#2C241B",
                                "#E8E4DF",
                            ][Math.floor(Math.random() * 4)],
                        }}
                        variants={orderSuccessVariants.confetti}
                        initial="initial"
                        animate="animate"
                        transition={{
                            ...transitionPresets.smooth,
                            delay: piece.delay,
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <motion.div
                className="text-center px-4 z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={transitionPresets.standard}
            >
                {/* Checkmark Circle */}
                <motion.div
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
                    variants={orderSuccessVariants.checkmark}
                    initial="initial"
                    animate="visible"
                >
                    <Check size={40} className="text-green-600" strokeWidth={3} />
                </motion.div>

                {/* Success Message */}
                <motion.h2
                    className="text-3xl md:text-4xl font-serif text-espresso mb-2"
                    variants={orderSuccessVariants.successMessage}
                    initial="initial"
                    animate="visible"
                >
                    Order Placed Successfully
                </motion.h2>

                <motion.p
                    className="text-lg text-gold mb-6"
                    variants={orderSuccessVariants.successMessage}
                    initial="initial"
                    animate="visible"
                    transition={{ delay: 0.15 }}
                >
                    ✨
                </motion.p>

                {/* Order Number */}
                <motion.div
                    className="bg-white/60 backdrop-blur rounded-lg p-4 mb-6 inline-block"
                    variants={orderSuccessVariants.orderNumber}
                    initial="initial"
                    animate="visible"
                >
                    <p className="text-sm text-stone mb-1">Order Number</p>
                    <p className="text-2xl font-bold text-maroon font-mono">
                        {orderNumber}
                    </p>
                </motion.div>

                {/* Description */}
                <motion.p
                    className="text-stone mb-8 max-w-sm mx-auto"
                    variants={orderSuccessVariants.successMessage}
                    initial="initial"
                    animate="visible"
                    transition={{ delay: 0.25 }}
                >
                    We've sent a confirmation email with your order details. Your
                    authentic Indian pieces are on their way!
                </motion.p>

                {/* Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                    variants={orderSuccessVariants.trackButton}
                    initial="initial"
                    animate="visible"
                >
                    <motion.button
                        className="px-6 py-3 bg-gold text-white rounded-lg font-medium hover:bg-gold/90 transition"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={transitionPresets.quick}
                    >
                        <Link to="/orders">Track Order</Link>
                    </motion.button>

                    <motion.button
                        className="px-6 py-3 bg-espresso/10 text-espresso rounded-lg font-medium hover:bg-espresso/20 transition"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={transitionPresets.quick}
                    >
                        <Link to="/shop">Continue Shopping</Link>
                    </motion.button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

// Compact success notification
export function CompactOrderSuccess({ orderNumber }) {
    return (
        <motion.div
            className="fixed bottom-4 right-4 bg-white backdrop-blur-xl rounded-lg shadow-lg p-4 border border-green-200"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={transitionPresets.standard}
        >
            <div className="flex items-center gap-3">
                <motion.div
                    className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <Check size={20} className="text-green-600" />
                </motion.div>

                <div className="flex-1">
                    <p className="font-semibold text-espresso text-sm">
                        Order Confirmed!
                    </p>
                    <p className="text-xs text-stone">{orderNumber}</p>
                </div>
            </div>
        </motion.div>
    );
}
