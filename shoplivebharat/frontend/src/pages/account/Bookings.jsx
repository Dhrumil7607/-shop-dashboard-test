/**
 * Bookings.jsx
 *
 * Page component for /account/bookings — the Customer Booking Dashboard.
 *
 * Requirements: 9.1, 9.2, 9.5, 9.6, 14.4
 *
 * Auth guard: redirects unauthenticated users to
 *   /login?returnTo=/account/bookings
 * Wrapping: the route in App.js already wraps this in MarketplaceLayout; this
 *           file exports the raw page content rendered inside MarketplaceLayout.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import bookingService from "@/services/bookingService";
import BookingCard from "@/components/Booking/BookingCard";

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-4"
      role="status"
      aria-label="Loading bookings"
    >
      <Loader2
        size={36}
        className="animate-spin"
        style={{ color: "#A2466B" }}
        aria-hidden="true"
      />
      <span className="text-sm text-espresso/60 tracking-wide">
        Loading your bookings…
      </span>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(162,70,107,0.08)" }}
      >
        <CalendarDays
          size={36}
          style={{ color: "#A2466B" }}
          aria-hidden="true"
        />
      </div>
      <h2 className="font-serif text-2xl text-espresso mb-2">
        No bookings yet
      </h2>
      <p className="text-espresso/60 mb-8 max-w-sm">
        No bookings yet. Book a live shopping session to get started.
      </p>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Link
          to="/live-shopping"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm min-h-[48px]"
          style={{ background: "#A2466B", color: "#FFF8F0" }}
        >
          Book a Live Session
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function Bookings() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login?returnTo=/account/bookings", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // ── Load bookings on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    try {
      // bookingService.list() already sorts descending by appointmentIST
      const loaded = bookingService.list(user.id);
      setBookings(loaded);
    } catch (err) {
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  // ── Cancel handler ────────────────────────────────────────────────────────
  // The 48-hour enforcement is already handled inside BookingCard's UI;
  // this handler is only called when the user clicks a non-blocked Cancel.
  const handleCancel = useCallback(
    (bookingId) => {
      try {
        const updated = bookingService.update(user.id, bookingId, {
          status: "cancelled",
        });
        if (updated) {
          setBookings((prev) =>
            prev.map((b) =>
              b.bookingId === bookingId ? { ...b, status: "cancelled" } : b
            )
          );
          toast.success("Booking cancelled successfully.");
        } else {
          toast.error("Could not find the booking to cancel.");
        }
      } catch (err) {
        toast.error("Failed to cancel booking. Please try again.");
      }
    },
    [user]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* ── Page Header ── */}
      <div className="mb-8 md:mb-10">
        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl mb-3 text-espresso">
          My{" "}
          <span style={{ fontStyle: "italic", color: "#A2466B" }}>
            Bookings
          </span>
        </h1>
        <p className="text-lg text-espresso/70">
          View and manage your live shopping session bookings.
        </p>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          layout
          className="flex flex-col gap-4"
          role="list"
          aria-label="Your bookings"
        >
          <AnimatePresence mode="popLayout">
            {bookings.map((booking) => (
              <motion.div
                key={booking.bookingId}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                role="listitem"
              >
                <BookingCard booking={booking} onCancel={handleCancel} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
