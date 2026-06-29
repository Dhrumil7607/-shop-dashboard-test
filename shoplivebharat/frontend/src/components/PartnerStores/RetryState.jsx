/**
 * Retry State Component
 * Minimal retry component for inline use when data needs to be reloaded
 * Can be used in modals, cards, or inline error handling
 */

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

export default function RetryState({
    message = "Failed to load. Please try again.",
    onRetry,
    showAnimation = true,
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-8 px-6 bg-red-50/50 rounded-lg border border-red-200/50"
        >
            {/* Icon */}
            {showAnimation && (
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                    }}
                    className="mb-4"
                >
                    <RotateCcw size={32} className="text-red-600" />
                </motion.div>
            )}

            {/* Message */}
            <p className="text-center text-espresso/80 mb-4 max-w-sm">{message}</p>

            {/* Retry Button */}
            {onRetry && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRetry}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                    <RotateCcw size={18} />
                    Retry
                </motion.button>
            )}
        </motion.div>
    );
}
