import { motion, useReducedMotion } from "framer-motion";

/**
 * ConfidenceRing
 *
 * An animated circular SVG progress ring that visualises a confidence percentage.
 * Animates from 0 → value over `duration` ms using Framer Motion.
 * Respects `prefers-reduced-motion: reduce` — renders at final value immediately.
 *
 * Props:
 *   value    {number}  0–100   — confidence percentage to display
 *   duration {number}  default 800 — animation duration in ms
 *   size     {number}  default 120 — diameter in px
 *
 * Requirements: 5.3, 15.2
 */

/** Returns a Tailwind/hex color based on confidence value */
function getColor(value) {
  if (value >= 70) return "#22C55E"; // green
  if (value >= 40) return "#F59E0B"; // amber
  return "#EF4444"; // red
}

export default function ConfidenceRing({ value = 0, duration = 800, size = 120 }) {
  // Clamp value to [0, 100]
  const clampedValue = Math.min(100, Math.max(0, value));

  const shouldReduceMotion = useReducedMotion();

  const strokeWidth = size * 0.08; // proportional stroke
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // dashoffset at 0% = full circumference (empty ring)
  // dashoffset at 100% = 0 (full ring)
  const targetOffset = circumference - (clampedValue / 100) * circumference;
  const emptyOffset = circumference; // starting offset (0% filled)

  const color = getColor(clampedValue);
  const fontSize = Math.round(size * 0.2);
  const animDurationSeconds = duration / 1000;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Confidence level"
      style={{ display: "block" }}
    >
      {/* Background track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />

      {/* Animated progress arc */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        // Start arc from top (rotate -90deg so 0% is at 12 o'clock)
        style={{ rotate: -90, transformOrigin: `${cx}px ${cy}px` }}
        strokeDasharray={circumference}
        // If reduced motion: jump straight to final value; otherwise animate from empty
        initial={
          shouldReduceMotion
            ? { strokeDashoffset: targetOffset }
            : { strokeDashoffset: emptyOffset }
        }
        animate={{ strokeDashoffset: targetOffset }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: animDurationSeconds, ease: "easeOut" }
        }
      />

      {/* Center percentage label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="700"
        fill={color}
        aria-hidden="true"
      >
        {`${Math.round(clampedValue)}%`}
      </text>
    </svg>
  );
}
