/**
 * LiveShopping.jsx — LiveBookingFlow orchestrator
 *
 * 5-step booking flow for live video shopping sessions.
 *
 * Steps:
 *   1. Choose Store        (StoreSelector)
 *   2. Select Products     (ProductPicker)
 *   3. Appointment Details (AppointmentForm)
 *   4. Timezone & Schedule (TimezoneSelector)
 *   5. Review & Pay        (ReviewAndPay)
 *
 * Requirements: 8.1, 8.7, 8.8, 8.9
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import BookingProgressBar from "@/components/Booking/BookingProgressBar";
import StoreSelector from "@/components/Booking/steps/StoreSelector";
import ProductPicker from "@/components/Booking/steps/ProductPicker";
import AppointmentForm from "@/components/Booking/steps/AppointmentForm";
import TimezoneSelector from "@/components/Booking/steps/TimezoneSelector";
import ReviewAndPay from "@/components/Booking/steps/ReviewAndPay";
import { useAuth } from "@/contexts/AuthContext";
import * as bookingService from "@/services/bookingService";

// ── Timezone offset map (minutes from UTC) — mirrors TimezoneSelector ──────
const TZ_OFFSETS = {
  IST:   330,
  UTC:     0,
  EST:  -300,
  PST:  -480,
  GMT:     0,
  GST:   240,
  AEST:  600,
  SGT:   480,
};

const IST_OFFSET = 330; // +05:30 in minutes

/**
 * Build an ISO 8601 string for the appointment in IST (+05:30).
 * dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
 */
function buildAppointmentIST(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  // Combine into a string that JS can parse as an IST wall-clock time.
  // We construct a UTC ms by subtracting the IST offset, then format with +05:30.
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  // UTC timestamp for this wall-clock time in IST
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET * 60 * 1000;
  const d = new Date(utcMs);
  // Format as ISO with explicit +05:30 offset
  const pad = (n) => String(n).padStart(2, "0");
  const utcYear = d.getUTCFullYear();
  const utcMonth = pad(d.getUTCMonth() + 1);
  const utcDay = pad(d.getUTCDate());
  const utcHour = pad(d.getUTCHours() + 5);
  const utcMin = pad(d.getUTCMinutes() + 30);
  // Simpler: just construct the string directly from inputs
  return `${dateStr}T${timeStr}:00.000+05:30`;
}

/**
 * Build an ISO 8601 string for the appointment in the user's selected timezone.
 * If the timezone is IST, returns the same value as appointmentIST.
 */
function buildAppointmentUserTz(dateStr, timeStr, tzLabel) {
  if (!dateStr || !timeStr) return null;
  if (tzLabel === "IST") {
    return buildAppointmentIST(dateStr, timeStr);
  }
  const offsetMinutes = TZ_OFFSETS[tzLabel] ?? IST_OFFSET;
  // Determine the UTC offset sign and value
  const absOffset = Math.abs(offsetMinutes);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const offsetMins = String(absOffset % 60).padStart(2, "0");
  return `${dateStr}T${timeStr}:00.000${sign}${offsetHours}:${offsetMins}`;
}

/**
 * Generate a booking ID: "BK-" + 8 random uppercase chars.
 */
function generateBookingId() {
  return "BK-" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

// ── Step validation ──────────────────────────────────────────────────────────

/**
 * Returns true if the given step is valid based on current bookingState.
 */
function isStepValid(step, bookingState) {
  switch (step) {
    case 1:
      return !!bookingState.storeId;
    case 2:
      return Array.isArray(bookingState.selectedProducts) &&
        bookingState.selectedProducts.length > 0;
    case 3:
      return !!bookingState.appointmentDate && !!bookingState.appointmentTime;
    case 4:
      return !!bookingState.timezone;
    default:
      return true;
  }
}

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  "Choose Store",
  "Select Products",
  "Appointment Details",
  "Timezone & Schedule",
  "Review & Pay",
];

// ── Variants for step animation ───────────────────────────────────────────────
const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

export default function LiveShopping() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  // ── State machine ──────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // +1 = forward, -1 = backward
  const [isPaying, setIsPaying] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [bookingState, setBookingState] = useState({
    storeId: null,
    storeName: "",
    storeBanner: null,
    storeRating: null,
    storeSpecialties: "",
    selectedProducts: [],
    appointmentDate: "",
    appointmentTime: "",
    notes: "",
    timezone: "IST",
  });

  // ── Patch callback for step sub-components ─────────────────────────────────
  const handleUpdate = useCallback((patch) => {
    setBookingState((prev) => ({ ...prev, ...patch }));
    // Clear validation error when user makes a change
    setValidationError("");
  }, []);

  // ── Auth redirect helper ───────────────────────────────────────────────────
  const handleAuthRequired = useCallback(() => {
    navigate("/login?returnTo=/live-shopping");
  }, [navigate]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  function handleNext() {
    // Auth check for transitions beyond step 1 (Req 8.9)
    if (currentStep >= 1 && !isLoggedIn) {
      navigate("/login?returnTo=/live-shopping");
      return;
    }

    // Step validation before advancing
    if (!isStepValid(currentStep, bookingState)) {
      const messages = {
        1: "Please select a store to continue.",
        2: "Please select at least one product to continue.",
        3: "Please select an appointment date and time.",
        4: "Please select a timezone.",
      };
      setValidationError(messages[currentStep] || "Please complete this step.");
      return;
    }

    setValidationError("");
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setValidationError("");
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  // ── Payment simulation (Req 8.7, 8.8) ─────────────────────────────────────
  async function handlePay() {
    if (!isLoggedIn) {
      navigate("/login?returnTo=/live-shopping");
      return;
    }

    setIsPaying(true);
    try {
      // 1400ms payment simulation delay (matching Checkout.jsx pattern)
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const userId = user?.id || "guest";
      const {
        storeId,
        storeName,
        selectedProducts,
        appointmentDate,
        appointmentTime,
        timezone,
      } = bookingState;

      // Build ISO timestamps
      const appointmentIST = buildAppointmentIST(appointmentDate, appointmentTime);
      const appointmentUserTz = buildAppointmentUserTz(
        appointmentDate,
        appointmentTime,
        timezone
      );

      const booking = {
        bookingId: generateBookingId(),
        userId,
        storeId,
        storeName,
        selectedProducts,
        appointmentIST,
        appointmentUserTz,
        timezone,
        googleMeetLink: null,
        status: "pending",
        createdAt: new Date().toISOString(),
        sessionFee: 699,
      };

      // Persist to localStorage (Req 8.8)
      bookingService.save(userId, booking);

      // Navigate to confirmation with booking in state (Req 8.7)
      navigate("/booking-confirmation", { state: { booking } });
    } catch {
      // If save fails, still navigate — graceful degradation
      setIsPaying(false);
    }
  }

  // ── Active step renderer ──────────────────────────────────────────────────
  function renderStep() {
    const commonProps = {
      bookingState,
      onUpdate: handleUpdate,
      onAuthRequired: handleAuthRequired,
    };

    switch (currentStep) {
      case 1:
        return <StoreSelector {...commonProps} />;
      case 2:
        return <ProductPicker {...commonProps} />;
      case 3:
        return <AppointmentForm {...commonProps} />;
      case 4:
        return <TimezoneSelector {...commonProps} />;
      case 5:
        return (
          <ReviewAndPay
            {...commonProps}
            onPay={handlePay}
            isPaying={isPaying}
          />
        );
      default:
        return null;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <MarketplaceLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Page heading */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-espresso mb-2">
            Book a Live Shopping Session
          </h1>
          <p className="text-stone text-sm sm:text-base">
            A personalised one-on-one video consultation with your chosen store — ₹699.
          </p>
        </div>

        {/* Progress bar (Req 8.1) */}
        <div className="mb-8">
          <BookingProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Step card */}
        <div className="bg-white rounded-2xl border border-stone/15 shadow-sm overflow-hidden">
          {/* Step header */}
          <div className="px-6 py-4 border-b border-stone/10 flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-maroon text-ivory text-xs font-bold flex items-center justify-center flex-shrink-0">
              {currentStep}
            </span>
            <h2 className="text-base font-semibold text-espresso">
              {STEP_TITLES[currentStep - 1]}
            </h2>
          </div>

          {/* Animated step content */}
          <div className="px-6 py-6 min-h-[320px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Validation error */}
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                role="alert"
              >
                {validationError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons — step 5 "Pay ₹699" is rendered by ReviewAndPay */}
          {currentStep < TOTAL_STEPS && (
            <div className="px-6 pb-6 flex gap-3">
              {/* Back button — disabled on step 1 */}
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-5 py-2.5 rounded-xl border border-stone/25 text-stone text-sm font-medium hover:bg-stone/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                aria-label="Go to previous step"
              >
                Back
              </button>

              {/* Next button (steps 1–4) */}
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-5 py-2.5 rounded-xl bg-maroon text-ivory text-sm font-semibold hover:bg-maroon/90 transition-colors min-h-[44px]"
                aria-label="Go to next step"
              >
                Next
              </button>
            </div>
          )}

          {/* On step 5, show Back button only (Pay ₹699 is inside ReviewAndPay) */}
          {currentStep === TOTAL_STEPS && (
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={isPaying}
                className="px-5 py-2.5 rounded-xl border border-stone/25 text-stone text-sm font-medium hover:bg-stone/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                aria-label="Go to previous step"
              >
                Back
              </button>
            </div>
          )}
        </div>

        {/* Step counter for accessibility */}
        <p className="mt-4 text-center text-xs text-stone/40">
          Step {currentStep} of {TOTAL_STEPS}
        </p>
      </div>
    </MarketplaceLayout>
  );
}
