import { motion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * BookingProgressBar
 *
 * A 5-step horizontal progress indicator for the Live Video Shopping booking flow.
 *
 * Requirements: 8.1, 12.7
 *
 * - Full bar: hidden on < 480px, shown as `hidden sm:flex`
 * - Compact badge row: shown on < 480px as `flex sm:hidden`
 *
 * Props:
 *   currentStep  {number}  1–5, which step is active
 *   totalSteps   {number}  defaults to 5
 */

const STEP_LABELS = [
  "Choose Store",
  "Select Products",
  "Appointment Details",
  "Timezone & Schedule",
  "Review & Pay",
];

export default function BookingProgressBar({ currentStep = 1, totalSteps = 5 }) {
  const steps = STEP_LABELS.slice(0, totalSteps);

  return (
    <>
      {/* ── Full bar: hidden below sm (480px), flex on sm+ ── */}
      <div className="hidden sm:flex w-full items-start" role="list" aria-label="Booking progress">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;
          const isLast = stepNumber === totalSteps;

          return (
            <div
              key={stepNumber}
              className="flex flex-col items-center flex-1 relative"
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Connector line (drawn before each step except the first) */}
              {stepNumber > 1 && (
                <div className="absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 pr-[20px] pl-0 pointer-events-none">
                  {isCompleted ? (
                    /* Completed segment: full solid line */
                    <motion.div
                      className="h-full bg-gradient-to-r from-maroon/60 to-maroon"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{ transformOrigin: "left" }}
                    />
                  ) : (
                    /* Upcoming / current segment: dashed / muted */
                    <div className="h-full border-t-2 border-dashed border-stone/25" />
                  )}
                </div>
              )}

              {/* Circle badge */}
              <motion.div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 flex-shrink-0 transition-colors duration-300 ${
                  isCompleted
                    ? "bg-maroon border-maroon text-ivory"
                    : isCurrent
                    ? "bg-maroon border-maroon text-ivory shadow-maroon-glow"
                    : "bg-white border-stone/30 text-stone"
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={!isUpcoming ? { scale: 1.08 } : {}}
              >
                {isCompleted ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <span>{stepNumber}</span>
                )}

                {/* Pulsing ring on current step */}
                {isCurrent && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-maroon"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </motion.div>

              {/* Step label */}
              <motion.p
                className={`mt-2 text-xs text-center leading-tight max-w-[80px] transition-colors duration-300 ${
                  isCompleted
                    ? "text-maroon font-medium"
                    : isCurrent
                    ? "text-espresso font-semibold"
                    : "text-stone/60"
                }`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              >
                {label}
              </motion.p>
            </div>
          );
        })}
      </div>

      {/* ── Compact badge row: shown below sm (480px), hidden on sm+ ── */}
      <div
        className="flex sm:hidden w-full items-center justify-center gap-1.5 flex-wrap"
        role="list"
        aria-label="Booking progress"
      >
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = stepNumber === totalSteps;

          return (
            <div key={stepNumber} className="flex items-center" role="listitem">
              {/* Badge pill */}
              <motion.span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold border transition-colors duration-200 ${
                  isCompleted
                    ? "bg-maroon border-maroon text-ivory"
                    : isCurrent
                    ? "bg-maroon border-maroon text-ivory ring-2 ring-maroon/30"
                    : "bg-white border-stone/30 text-stone/60"
                }`}
                aria-label={`Step ${stepNumber}: ${label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
              >
                {isCompleted ? <Check size={12} strokeWidth={2.5} /> : stepNumber}
              </motion.span>

              {/* Arrow separator (not after the last step) */}
              {!isLast && (
                <span
                  className={`mx-0.5 text-xs font-light select-none ${
                    isCompleted ? "text-maroon/70" : "text-stone/30"
                  }`}
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
