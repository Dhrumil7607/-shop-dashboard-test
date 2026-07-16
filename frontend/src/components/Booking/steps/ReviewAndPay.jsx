/**
 * ReviewAndPay.jsx — Step 5 of LiveBookingFlow
 *
 * Full booking summary:
 *   - Store name + banner
 *   - Selected products (up to 10, shows name/price)
 *   - Appointment date+time in IST AND in the user's selected timezone
 *   - Session fee ₹699 formatted via useCurrency().formatPrice
 *   - "Pay ₹699" button — the ONLY place payment is initiated
 *
 * Auth check: if not logged in, calls onAuthRequired() instead of rendering.
 *
 * Props:
 *   bookingState    {object}    complete booking state
 *   onPay           {function}  callback to trigger payment
 *   isPaying        {boolean}   loading state during payment
 *   onAuthRequired  {function}  called when user is not authenticated
 *
 * Requirements: 8.6, 8.7, 8.9, 12.7, 15.6
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Globe, ShoppingBag, CreditCard, Store, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getPublicSettings } from "@/lib/api";

const DEFAULT_SESSION_FEE_INR = 699;

// Timezone offset map (minutes from UTC) — mirrors TimezoneSelector
const TZ_OFFSETS = {
  IST:  330,
  UTC:    0,
  EST: -300,
  PST: -480,
  GMT:    0,
  GST:  240,
  AEST: 600,
  SGT:  480,
};

const IST_OFFSET = 330;

/**
 * Format a date string (YYYY-MM-DD) + time string (HH:mm) in a given timezone
 * (specified as its offset in minutes from UTC) into a human-readable string.
 *
 * The date+time is treated as the appointment time IN the supplied timezone.
 */
function formatInTimezone(dateStr, timeStr, offsetMinutes, label) {
  if (!dateStr || !timeStr) return "—";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    // UTC timestamp for this wall-clock time in the given tz
    const utcMs =
      Date.UTC(year, month - 1, day, hour, minute) -
      offsetMinutes * 60 * 1000;
    // Wall-clock in target tz
    const tzMs = utcMs + offsetMinutes * 60 * 1000;
    const d = new Date(tzMs);
    const formatted = d.toLocaleString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
    return `${formatted} ${label}`;
  } catch {
    return "—";
  }
}

/**
 * Convert the appointment from the user's selected timezone into IST.
 */
function getISTDisplay(dateStr, timeStr, userTzLabel) {
  const fromOffset = TZ_OFFSETS[userTzLabel] ?? IST_OFFSET;
  if (fromOffset === IST_OFFSET) {
    // Already in IST
    return formatInTimezone(dateStr, timeStr, IST_OFFSET, "IST");
  }
  if (!dateStr || !timeStr) return "—";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    // UTC time
    const utcMs =
      Date.UTC(year, month - 1, day, hour, minute) -
      fromOffset * 60 * 1000;
    // IST time
    const istMs = utcMs + IST_OFFSET * 60 * 1000;
    const d = new Date(istMs);
    return (
      d.toLocaleString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      }) + " IST"
    );
  } catch {
    return "—";
  }
}

export default function ReviewAndPay({
  bookingState,
  onPay,
  isPaying,
  onAuthRequired,
}) {
  const { isLoggedIn } = useAuth();
  const { formatPrice } = useCurrency();
  const [sessionFee, setSessionFee] = useState(DEFAULT_SESSION_FEE_INR);

  // The session fee is set by admin in Settings (video_call_rate).
  useEffect(() => {
    getPublicSettings().then((s) => {
      if (s && s.video_call_rate != null) setSessionFee(Number(s.video_call_rate));
    }).catch(() => {});
  }, []);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn && onAuthRequired) {
      onAuthRequired();
    }
  }, [isLoggedIn, onAuthRequired]);

  if (!isLoggedIn) return null;

  const {
    storeName,
    storeBanner,
    storeRating,
    selectedProducts = [],
    appointmentDate,
    appointmentTime,
    timezone = "IST",
    notes,
  } = bookingState;

  const userTzOffset = TZ_OFFSETS[timezone] ?? IST_OFFSET;
  const istDisplay = getISTDisplay(appointmentDate, appointmentTime, timezone);
  const userTzDisplay =
    timezone === "IST"
      ? istDisplay
      : formatInTimezone(appointmentDate, appointmentTime, userTzOffset, timezone);

  const formattedFee = formatPrice(sessionFee);

  return (
    <div className="space-y-6">
      <p className="text-stone text-sm">
        Review your booking details before confirming payment.
      </p>

      {/* Store summary */}
      <div className="rounded-2xl border border-stone/15 overflow-hidden">
        {storeBanner && (
          <div className="h-32 w-full overflow-hidden bg-stone/10">
            <img
              src={storeBanner}
              alt={`${storeName} banner`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-4 flex items-center gap-3 bg-white">
          <Store size={20} className="text-maroon flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-stone/50 uppercase tracking-wide">Store</p>
            <p className="text-sm font-semibold text-espresso">{storeName || "—"}</p>
            {storeRating && (
              <p className="text-xs text-amber-500 font-medium">★ {storeRating}</p>
            )}
          </div>
        </div>
      </div>

      {/* Selected products */}
      <div className="rounded-2xl border border-stone/15 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-stone/10 flex items-center gap-2">
          <ShoppingBag size={16} className="text-maroon" />
          <p className="text-sm font-semibold text-espresso">
            Selected Products ({selectedProducts.length})
          </p>
        </div>
        {selectedProducts.length === 0 ? (
          <p className="px-4 py-3 text-sm text-stone/50 italic">No products selected.</p>
        ) : (
          <ul className="divide-y divide-stone/10">
            {selectedProducts.slice(0, 10).map((product) => (
              <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-stone/10">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone/30">
                      <Package size={14} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-espresso line-clamp-1">{product.name}</p>
                  {product.price != null && (
                    <p className="text-xs text-stone/50">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Appointment details */}
      <div className="rounded-2xl border border-stone/15 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-stone/10 flex items-center gap-2">
          <Calendar size={16} className="text-maroon" />
          <p className="text-sm font-semibold text-espresso">Appointment</p>
        </div>
        <div className="px-4 py-3 space-y-3">
          {/* IST time */}
          <div className="flex items-start gap-3">
            <Clock size={15} className="text-stone/40 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-stone/50 uppercase tracking-wide">
                India Standard Time (IST)
              </p>
              <p className="text-sm text-espresso font-medium">{istDisplay}</p>
            </div>
          </div>
          {/* User's timezone — show only if different from IST */}
          {timezone !== "IST" && (
            <div className="flex items-start gap-3">
              <Globe size={15} className="text-stone/40 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-stone/50 uppercase tracking-wide">
                  Your Time ({timezone})
                </p>
                <p className="text-sm text-espresso font-medium">{userTzDisplay}</p>
              </div>
            </div>
          )}
          {/* Notes */}
          {notes && notes.trim() && (
            <div className="pt-2 border-t border-stone/10">
              <p className="text-xs font-medium text-stone/50 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-espresso/80 italic">"{notes}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment section */}
      <div className="rounded-2xl border border-stone/15 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-stone/10 flex items-center gap-2">
          <CreditCard size={16} className="text-maroon" />
          <p className="text-sm font-semibold text-espresso">Session Fee</p>
        </div>
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-espresso">Live Video Shopping Session</p>
            <p className="text-xs text-stone/50 mt-0.5">
              One-on-one styling consultation with the store
            </p>
          </div>
          <p className="text-base font-bold text-espresso">{formattedFee}</p>
        </div>
        <div className="px-4 pb-4">
          <p className="text-xs text-stone/40 mb-4">
            Secure payment · Your details are encrypted and never stored.
          </p>

          {/* Pay button — the ONLY place payment is initiated */}
          <motion.button
            type="button"
            onClick={onPay}
            disabled={isPaying}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon/90 disabled:opacity-60 disabled:cursor-not-allowed text-ivory font-semibold py-3.5 rounded-xl transition-colors min-h-[44px]"
            aria-label={`Pay ${formattedFee} and confirm booking`}
          >
            {isPaying ? (
              <>
                <span className="w-4 h-4 border-2 border-ivory/40 border-t-ivory rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Pay {formattedFee}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
