/**
 * ScrollFadeUp.jsx
 * Wraps any children in a framer-motion scroll-triggered fade-up.
 * Uses whileInView so it only fires once when element enters viewport.
 *
 * Usage:
 *   import ScrollFadeUp from "@/components/LuxeAnimations/ScrollFadeUp";
 *
 *   <ScrollFadeUp delay={0.1}>
 *     <YourComponent />
 *   </ScrollFadeUp>
 *
 *   // Grid of staggered cards:
 *   {items.map((item, i) => (
 *     <ScrollFadeUp key={item.id} delay={i * 0.06}>
 *       <Card item={item} />
 *     </ScrollFadeUp>
 *   ))}
 */
import { motion } from "framer-motion";

export default function ScrollFadeUp({
  children,
  delay = 0,
  duration = 0.6,
  y = 24,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
