/**
 * HeroSection.jsx
 * Luxury hero with ken-burns bg, grain overlay, veil gradient, and framer motion entrance.
 * Drop-in replacement / wrapper — keep your own hero content as children.
 *
 * Usage:
 *   import HeroSection from "@/components/LuxeAnimations/HeroSection";
 *
 *   <HeroSection
 *     image="https://..."
 *     videoSrc="https://..."   // optional
 *     minHeight="92vh"
 *   >
 *     <h1>Your content</h1>
 *   </HeroSection>
 */
import { motion } from "framer-motion";

export default function HeroSection({
  image,
  videoSrc,
  minHeight = "92vh",
  children,
  className = "",
}) {
  return (
    <section
      className={`relative flex items-end overflow-hidden isolate ${className}`}
      style={{ minHeight }}
    >
      {/* Background image with ken-burns */}
      {image && (
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
          aria-hidden="true"
        />
      )}

      {/* Optional background video (overlays image) */}
      {videoSrc && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={image}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* Dark-to-cream veil gradient */}
      <div className="absolute inset-0 hero-veil" aria-hidden="true" />

      {/* Film grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Content with entrance animation */}
      <div className="relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
