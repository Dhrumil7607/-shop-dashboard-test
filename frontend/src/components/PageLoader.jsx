import { motion } from "framer-motion";

/**
 * Cinematic Suspense fallback.
 * GPU-only: opacity + transform only, no layout thrash.
 * Respects prefers-reduced-motion automatically via Framer Motion.
 */
export default function PageLoader() {
    return (
        <motion.div
            role="status" aria-live="polite" aria-busy="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="flex min-h-screen flex-col items-center justify-center gap-7"
            style={{ backgroundColor: "#FAF9F6" }}
        >
            <span className="sr-only">Loading…</span>

            {/* Animated logo mark */}
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
            >
                <motion.div
                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: "#C9A84C" }}
                    animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <span className="font-serif font-bold text-lg" style={{ color: "#C9A84C" }}>S</span>
                </motion.div>
            </motion.div>

            {/* Shimmer progress bar */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="w-36 h-0.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "#E8E4DF" }}
            >
                <motion.div
                    className="h-full w-1/3 rounded-full"
                    style={{
                        background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                        willChange: "transform",
                    }}
                    animate={{ x: ["-100%", "400%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.div>
        </motion.div>
    );
}
