/**
 * Empty State Component
 * Displayed when no results are found
 * Provides helpful messaging and action CTAs
 * Used by StoreGrid, ProductGrid, and other list components
 */

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function EmptyState({
    title = "No Results Found",
    description = "Try adjusting your search or filters",
    icon = "🔍",
    action = null,
    secondaryAction = null,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex flex-col items-center justify-center py-16 md:py-24 px-6"
        >
            {/* Icon */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-6xl md:text-8xl mb-6"
            >
                {icon}
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="font-serif text-3xl md:text-4xl text-espresso mb-3 text-center"
            >
                {title}
            </motion.h2>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-lg text-espresso/60 text-center max-w-md mb-8"
            >
                {description}
            </motion.p>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                {action && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={action.onClick}
                        className="px-8 py-3 bg-gradient-to-r from-maroon to-maroon/80 text-ivory rounded-lg font-semibold hover:shadow-lg hover:shadow-maroon/30 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        {action.label}
                        <ArrowRight size={18} />
                    </motion.button>
                )}

                {secondaryAction && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={secondaryAction.onClick}
                        className="px-8 py-3 bg-white/60 backdrop-blur-md border border-white/40 text-espresso rounded-lg font-semibold hover:bg-white/80 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        {secondaryAction.label}
                        <ArrowRight size={18} />
                    </motion.button>
                )}
            </motion.div>
        </motion.div>
    );
}
