/**
 * BrandedLoader.jsx
 * Luxury dual-ring mandala spinner — ported from SHOPLiveRealest.
 * Fully isolated, no deps on other project files.
 *
 * Usage:
 *   import { BrandedLoader, FullScreenLoader } from "@/components/LuxeAnimations/BrandedLoader";
 *   <BrandedLoader />
 *   <BrandedLoader message="Loading your store…" />
 *   <FullScreenLoader message="Please wait…" />
 */
import { motion } from "framer-motion";

export function BrandedLoader({ message = "Bringing India closer…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="relative h-16 w-16">
        {/* Outer ring — clockwise gold */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#D4AF37", borderRightColor: "rgba(212,175,55,0.6)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner ring — counter-clockwise maroon */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{ borderBottomColor: "#8B3A3A", borderLeftColor: "rgba(139,58,58,0.4)" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* Centre dot */}
        <motion.div
          className="absolute rounded-full bg-gold"
          style={{ inset: "42%", backgroundColor: "#D4AF37" }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      </div>
      <div
        className="text-xs uppercase tracking-[0.3em]"
        style={{ color: "#D4AF37" }}
      >
        {message}
      </div>
    </div>
  );
}

export function FullScreenLoader({ message }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(253,251,247,0.95)", backdropFilter: "blur(12px)" }}
    >
      <BrandedLoader message={message} />
    </div>
  );
}
