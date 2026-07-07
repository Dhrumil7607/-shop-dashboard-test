import { motion } from "framer-motion";
import {
    loadingIconSpin,
    loadingSparkle,
    loadingTextPulse,
} from "@/utils/microAnimations";
import { ShoppingBag } from "lucide-react";

/**
 * Premium Loading Animation with shopping bag and sparkles
 */
export function LoadingAnimation({ text = "Bringing India closer…" }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            {/* Loading Icon Container */}
            <div className="relative w-24 h-24">
                {/* Main spinning icon */}
                <motion.div
                    animate={loadingIconSpin.animate}
                    transition={loadingIconSpin.transition}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <ShoppingBag size={48} className="text-maroon" strokeWidth={1.5} />
                </motion.div>

                {/* Sparkles around icon */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={`sparkle-${i}`}
                        className="absolute w-1.5 h-1.5 bg-gold rounded-full"
                        style={{
                            top: "50%",
                            left: "50%",
                            transformOrigin: "60px 0px",
                            transform: `rotate(${i * 120}deg)`,
                        }}
                        variants={loadingSparkle}
                        initial="initial"
                        animate="animate"
                        transition={{
                            ...loadingSparkle.transition,
                            delay: i * 0.3,
                        }}
                    />
                ))}
            </div>

            {/* Loading Text */}
            <motion.p
                className="text-center text-sm md:text-base text-stone"
                animate={loadingTextPulse.animate}
                transition={loadingTextPulse.transition}
            >
                {text}
            </motion.p>
        </div>
    );
}

/**
 * Inline Loading Spinner (for buttons, small areas)
 */
export function InlineLoadingSpinner({ size = 20, showText = true }) {
    return (
        <div className="flex items-center gap-2">
            <motion.div
                animate={loadingIconSpin.animate}
                transition={loadingIconSpin.transition}
            >
                <ShoppingBag size={size} className="text-maroon" />
            </motion.div>
            {showText && (
                <motion.span
                    className="text-sm text-stone"
                    animate={loadingTextPulse.animate}
                    transition={loadingTextPulse.transition}
                >
                    Loading...
                </motion.span>
            )}
        </div>
    );
}

/**
 * Page transition loading with progress
 */
export function PageLoadingScreen() {
    return (
        <motion.div
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="flex flex-col items-center gap-8">
                {/* Animated Icon */}
                <motion.div
                    className="relative w-20 h-20"
                    animate={loadingIconSpin.animate}
                    transition={loadingIconSpin.transition}
                >
                    <ShoppingBag size={40} className="text-maroon absolute inset-2" />
                </motion.div>

                {/* Progress Bar */}
                <div className="w-48 h-1 bg-stone/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-maroon to-gold"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: [0, 0.3, 0.6, 0.9] }}
                        transition={{
                            duration: 2,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                        style={{ originX: 0 }}
                    />
                </div>

                {/* Text */}
                <motion.p
                    className="text-sm text-stone text-center"
                    animate={loadingTextPulse.animate}
                    transition={loadingTextPulse.transition}
                >
                    Bringing India closer…
                </motion.p>
            </div>
        </motion.div>
    );
}

/**
 * Skeleton Loader with shimmer effect
 */
export function SkeletonLoader({ width = "w-full", height = "h-4", count = 3 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className={`${width} ${height} bg-stone/10 rounded-lg overflow-hidden`}
                >
                    <motion.div
                        className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent"
                        animate={{
                            x: ["−100%", "100%"],
                        }}
                        transition={{
                            duration: 2,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Loading component for specific actions
 */
export function LoadingOverlay({ isOpen, text = "Loading..." }) {
    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="flex flex-col items-center gap-4">
                <InlineLoadingSpinner size={32} showText={false} />
                <motion.p
                    className="text-sm text-white font-medium"
                    animate={loadingTextPulse.animate}
                    transition={loadingTextPulse.transition}
                >
                    {text}
                </motion.p>
            </div>
        </motion.div>
    );
}

export default LoadingAnimation;
