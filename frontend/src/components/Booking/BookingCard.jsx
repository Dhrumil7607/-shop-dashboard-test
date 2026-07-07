import { motion } from "framer-motion";
import { Video, Calendar, Clock, MapPin, XCircle, ChevronRight } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";

/**
 * BookingCard
 *
 * Displays a single booking with all required information.
 *
 * Requirements: 9.2, 9.3, 9.4, 9.6, 9.7, 13.6, 15.7
 *
 * Props:
 *   booking  {Booking}               Full booking object from bookingService
 *   onCancel {(bookingId) => void}   Called when the user cancels a booking
 */

// ── Status badge colour map ──────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   "bg-amber-100  text-amber-800  border-amber-200",
  confirmed: "bg-green-100  text-green-800  border-green-200",
  completed: "bg-blue-100   text-blue-800   border-blue-200",
  cancelled: "bg-red-100    text-red-800    border-red-200",
  postponed: "bg-purple-100 text-purple-800 border-purple-200",
};

const STATUS_LABEL = {
  pending:   "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  postponed: "Postponed",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format an ISO string as a human-readable date+time string in IST locale.
 * Includes the timezone label for clarity.
 */
function formatIST(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format an ISO string in the user's stored timezone abbreviation.
 * Falls back to local time if the tz string isn't a valid IANA zone.
 */
const TZ_TO_IANA = {
  IST:  "Asia/Kolkata",
  UTC:  "UTC",
  EST:  "America/New_York",
  PST:  "America/Los_Angeles",
  GMT:  "Europe/London",
  GST:  "Asia/Dubai",
  AEST: "Australia/Sydney",
  SGT:  "Asia/Singapore",
};

function formatUserTz(iso, tzAbbr) {
  if (!iso) return "—";
  const iana = TZ_TO_IANA[tzAbbr] || "UTC";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: iana,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Returns true when the appointment is within 24 hours from now. */
function isWithin24Hours(iso) {
  if (!iso) return false;
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

/** Returns true when the appointment is within 48 hours from now. */
function isWithin48Hours(iso) {
  if (!iso) return false;
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff <= 48 * 60 * 60 * 1000;
}

/** Zero-pad a number to 2 digits. */
function pad2(n) {
  return String(n).padStart(2, "0");
}

// ── Sub-component: Countdown Timer ───────────────────────────────────────────

function CountdownTimer({ targetISO }) {
  const { hours, minutes, seconds, done } = useCountdown(targetISO);

  if (done) {
    return (
      <div
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        className="inline-flex items-center gap-1.5 text-green-700 text-sm font-medium"
      >
        <Clock size={14} aria-hidden="true" />
        <span>Session starting now</span>
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      className="flex items-center gap-2"
    >
      <Clock size={14} className="text-green-600 flex-shrink-0" aria-hidden="true" />
      <div className="flex items-center gap-1 font-mono text-sm font-semibold text-green-700">
        <span className="bg-green-50 border border-green-200 rounded px-1.5 py-0.5 min-w-[2.2rem] text-center">
          {pad2(hours)}
        </span>
        <span className="text-green-500 select-none">:</span>
        <span className="bg-green-50 border border-green-200 rounded px-1.5 py-0.5 min-w-[2.2rem] text-center">
          {pad2(minutes)}
        </span>
        <span className="text-green-500 select-none">:</span>
        <span className="bg-green-50 border border-green-200 rounded px-1.5 py-0.5 min-w-[2.2rem] text-center">
          {pad2(seconds)}
        </span>
      </div>
      <span className="text-xs text-green-600 hidden sm:inline">until session</span>
    </div>
  );
}

// ── Sub-component: Status Badge ───────────────────────────────────────────────

function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const label  = STATUS_LABEL[status]  || status;

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${styles} uppercase tracking-wide`}
    >
      {label}
    </span>
  );
}

// ── Sub-component: Product Thumbnails ────────────────────────────────────────

function ProductThumbnails({ products = [] }) {
  if (!products.length) return null;

  const visible  = products.slice(0, 3);
  const overflow = products.length - visible.length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visible.map((product) => (
        <div
          key={product.id}
          className="relative w-11 h-11 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0"
          title={product.name}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <ChevronRight size={16} />
            </div>
          )}
        </div>
      ))}

      {overflow > 0 && (
        <span className="text-xs font-medium text-stone-500 bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 flex-shrink-0 h-11 flex items-center">
          +{overflow} more
        </span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BookingCard({ booking, onCancel }) {
  const {
    bookingId,
    storeName,
    appointmentIST,
    appointmentUserTz,
    originalAppointmentIST,
    timezone,
    googleMeetLink,
    status,
    selectedProducts = [],
  } = booking;

  const isPostponed  = status === "postponed";
  const isConfirmed  = status === "confirmed";
  const isCancellable =
    status !== "cancelled" && status !== "completed";

  const within24h = isWithin24Hours(appointmentIST);
  const within48h = isWithin48Hours(appointmentIST);
  const showCountdown = isConfirmed && within24h;
  const cancelBlocked = isCancellable && within48h;

  // ── IST time display ───────────────────────────────────────────────────────
  const istDisplay = formatIST(appointmentIST);

  // For postponed: original time displayed with strikethrough
  const originalISTDisplay = isPostponed && originalAppointmentIST
    ? formatIST(originalAppointmentIST)
    : null;

  // User tz time — use appointmentUserTz if available, else derive from appointmentIST
  const userTzDisplay = formatUserTz(
    appointmentUserTz || appointmentIST,
    timezone || "IST"
  );

  // Show Google Meet link only for confirmed sessions with a valid link
  const showMeetLink = isConfirmed && !!googleMeetLink;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden"
      aria-label={`Booking for ${storeName}`}
    >
      {/* ── Countdown: pinned to top on mobile (< 640px) ── */}
      {showCountdown && (
        <div className="flex sm:hidden items-center gap-2 bg-green-50 border-b border-green-100 px-4 py-2.5">
          <span className="text-xs font-semibold text-green-700 mr-1 uppercase tracking-wide">
            Starting in
          </span>
          <CountdownTimer targetISO={appointmentIST} />
        </div>
      )}

      {/* ── Card header row ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-base font-semibold text-stone-900 truncate"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {storeName || "—"}
            </h3>
            <StatusBadge status={status} />
          </div>
          <p className="mt-0.5 text-xs text-stone-400 font-mono tracking-wider">
            {bookingId}
          </p>
        </div>

        {/* Countdown: visible on sm+ in the header row */}
        {showCountdown && (
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">
              Starting in
            </span>
            <CountdownTimer targetISO={appointmentIST} />
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-stone-100 mx-4" />

      {/* ── Body ── */}
      <div className="px-4 py-3 flex flex-col gap-3">

        {/* Appointment times */}
        <div className="flex flex-col gap-1.5">
          {/* IST time — with strikethrough if postponed */}
          <div className="flex items-start gap-2">
            <Calendar
              size={14}
              className="text-stone-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                IST
              </span>
              {isPostponed && originalISTDisplay ? (
                <div className="flex flex-col gap-0.5">
                  <del className="text-sm text-stone-400 line-through">
                    {originalISTDisplay}
                  </del>
                  <span className="text-sm font-semibold text-purple-700">
                    {istDisplay}
                    <span className="ml-1.5 text-[10px] font-bold bg-purple-100 text-purple-600 rounded px-1 py-0.5 uppercase tracking-wide">
                      New
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium text-stone-800">{istDisplay}</span>
              )}
            </div>
          </div>

          {/* User timezone time (only shown when tz != IST) */}
          {timezone && timezone !== "IST" && (
            <div className="flex items-start gap-2">
              <MapPin
                size={14}
                className="text-stone-400 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {timezone}
                </span>
                {isPostponed && originalISTDisplay ? (
                  <div className="flex flex-col gap-0.5">
                    <del className="text-sm text-stone-400 line-through">
                      {formatUserTz(originalAppointmentIST, timezone)}
                    </del>
                    <span className="text-sm font-semibold text-purple-700">
                      {userTzDisplay}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-stone-800">{userTzDisplay}</span>
                )}
              </div>
            </div>
          )}
          {/* When tz is IST, still show the userTz row with IST label for completeness */}
          {(!timezone || timezone === "IST") && (
            <div className="flex items-start gap-2">
              <MapPin
                size={14}
                className="text-stone-400 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Your Timezone (IST)
                </span>
                {isPostponed && originalISTDisplay ? (
                  <div className="flex flex-col gap-0.5">
                    <del className="text-sm text-stone-400 line-through">
                      {originalISTDisplay}
                    </del>
                    <span className="text-sm font-semibold text-purple-700">
                      {userTzDisplay}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-stone-800">{userTzDisplay}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product thumbnails */}
        {selectedProducts.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
              Selected Products
            </p>
            <ProductThumbnails products={selectedProducts} />
          </div>
        )}

        {/* Google Meet link */}
        {showMeetLink && (
          <a
            href={googleMeetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start min-h-[44px] px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            aria-label={`Join Google Meet session for ${storeName}`}
          >
            <Video size={16} aria-hidden="true" />
            Join Session
          </a>
        )}

        {/* Pending state explanation */}
        {status === "pending" && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Your booking is awaiting confirmation from the store. You&apos;ll receive
            a Google Meet link once confirmed.
          </p>
        )}
      </div>

      {/* ── Cancel section ── */}
      {isCancellable && (
        <div className="px-4 pb-4 pt-1">
          <div className="h-px bg-stone-100 mb-3" />

          {cancelBlocked ? (
            <div className="flex items-start gap-2">
              <button
                disabled
                aria-disabled="true"
                className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl border border-stone-200 text-stone-400 text-sm font-medium cursor-not-allowed bg-stone-50 select-none"
              >
                <XCircle size={15} aria-hidden="true" />
                Cancel Booking
              </button>
              <p className="text-xs text-red-600 pt-1.5 leading-tight" role="alert">
                Cancellations within 48 hours are not permitted.
              </p>
            </div>
          ) : (
            <button
              onClick={() => onCancel && onCancel(bookingId)}
              className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 active:bg-red-100 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
              aria-label={`Cancel booking for ${storeName}`}
            >
              <XCircle size={15} aria-hidden="true" />
              Cancel Booking
            </button>
          )}
        </div>
      )}
    </motion.article>
  );
}
