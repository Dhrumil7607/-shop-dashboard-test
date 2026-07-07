/**
 * Error State Component
 * Displayed when an error occurs during data loading
 * Provides error message, retry button, and support contact info
 * Used by StoreGrid, ProductGrid, and other components
 */

import { motion } from "framer-motion";
import { AlertTriangle, Mail, Phone, ArrowRight } from "lucide-react";

export default function ErrorState({
    title = "Something Went Wrong",
    description = "We encountered an error while loading. Please try again.",
    errorCode = null,
    onRetry,
    showContactSupport = true,
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
                className="relative mb-6"
            >
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                <div className="relative p-4 bg-red-100 rounded-full">
                    <AlertTriangle size={40} className="text-red-600" />
                </div>
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
                className="text-lg text-espresso/60 text-center max-w-md mb-4"
            >
                {description}
            </motion.p>

            {/* Error Code */}
            {errorCode && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="text-sm text-espresso/40 font-mono mb-8"
                >
                    Error Code: {errorCode}
                </motion.p>
            )}

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 mb-12"
            >
                {onRetry && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRetry}
                        className="px-8 py-3 bg-gradient-to-r from-maroon to-maroon/80 text-ivory rounded-lg font-semibold hover:shadow-lg hover:shadow-maroon/30 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        Try Again
                        <ArrowRight size={18} />
                    </motion.button>
                )}

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = "/"}
                    className="px-8 py-3 bg-white/60 backdrop-blur-md border border-white/40 text-espresso rounded-lg font-semibold hover:bg-white/80 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    Go Home
                    <ArrowRight size={18} />
                </motion.button>
            </motion.div>

            {/* Support Section */}
            {showContactSupport && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="border-t border-maroon/10 pt-8 w-full max-w-md"
                >
                    <p className="text-center text-espresso/60 font-medium mb-4">
                        Need help? Contact our support team
                    </p>
                    <div className="flex flex-col gap-3">
                        <a
                            href="mailto:support@shoplivebharat.com"
                            className="flex items-center gap-3 px-4 py-3 bg-white/40 rounded-lg hover:bg-white/60 transition-colors"
                        >
                            <Mail size={18} className="text-maroon flex-shrink-0" />
                            <span className="text-espresso/80">support@shoplivebharat.com</span>
                        </a>
                        <a
                            href="tel:+91-0000-000-000"
                            className="flex items-center gap-3 px-4 py-3 bg-white/40 rounded-lg hover:bg-white/60 transition-colors"
                        >
                            <Phone size={18} className="text-maroon flex-shrink-0" />
                            <span className="text-espresso/80">+91 (000) 000-0000</span>
                        </a>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
