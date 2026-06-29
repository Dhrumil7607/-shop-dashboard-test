import { motion } from "framer-motion";
import { loadingVariants, transitionPresets } from "@/utils/microAnimations";
import { ShoppingBag, Sparkles } from "lucide-react";

export default function AnimatedLoader({ message = "Bringing India closer…" }) {
    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionPresets.quick}
        >
            <div className="flex flex-col items-center gap-4">
                {/* Animated Shopping Bag Icon */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <motion.div
                        animate={loadingVariants.spinIcon.animate}
                        transition={loadingVariants.spinIcon.transition}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <ShoppingBag
                            size={40}
                            className="text-gold"
                            strokeWidth={1.5}
                        />
                    </motion.div>

                    {/* Sparkle animation around icon */}
                    {[0, 1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            animate={{
                                opacity: [0.8, 0, 0.8],
                                scale: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1.5,
                                delay: i * 0.3,
                                repeat: Infinity,
                            }}
                            style={{
                                transform: `rotate(${i * 90}deg) translateY(-30px)`,
                            }}
                        >
                            <Sparkles size={12} className="text-maroon" />
                        </motion.div>
                    ))}
                </div>

                {/* Loading Text */}
                <motion.p
                    className="text-center text-sm text-espresso font-medium"
                    animate={loadingVariants.shimmerText.animate}
                    transition={loadingVariants.shimmerText.transition}
                >
                    {message}
                </motion.p>

                {/* Animated Dots */}
                <motion.div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-gold"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{
                                duration: 1,
                                delay: i * 0.2,
                                repeat: Infinity,
                            }}
                        />
                    ))}
                </motion.div>
            </div>
        </motion.div>
    );
}

// Lightweight inline loader
export function InlineLoader({ size = 24, className = "" }) {
    return (
        <motion.div
            animate={loadingVariants.spinIcon.animate}
            transition={loadingVariants.spinIcon.transition}
            className={className}
        >
            <ShoppingBag size={size} className="text-gold" />
        </motion.div>
    );
}

// Page loading skeleton
export function LoadingSkeletonGrid({ count = 6 }) {
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transitionPresets.standard}
        >
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="rounded-lg overflow-hidden bg-stone/10"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                    }}
                >
                    <div className="h-64 bg-gradient-to-r from-transparent via-stone/20 to-transparent" />
                    <div className="p-4 space-y-2">
                        <div className="h-4 bg-stone/20 rounded w-3/4" />
                        <div className="h-3 bg-stone/20 rounded w-1/2" />
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
