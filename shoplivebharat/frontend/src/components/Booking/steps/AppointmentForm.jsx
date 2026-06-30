/**
 * AppointmentForm.jsx — Step 3 of LiveBookingFlow
 *
 * Date picker (min = today), time slot <select>, and notes <textarea>.
 * All fields have explicit <label htmlFor={id}>.
 * Disables past dates via the `min` attribute on the date input.
 *
 * Auth check: if not logged in, calls onAuthRequired() instead of rendering.
 *
 * Props:
 *   bookingState    {object}    shared booking state
 *   onUpdate        {function}  patch callback: onUpdate({ appointmentDate, appointmentTime, notes })
 *   onAuthRequired  {function}  called when user is not authenticated
 *
 * Requirements: 8.4, 8.9, 12.7
 */

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AppointmentForm({ bookingState, onUpdate, onAuthRequired }) {
  const { isLoggedIn } = useAuth();

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn && onAuthRequired) {
      onAuthRequired();
    }
  }, [isLoggedIn, onAuthRequired]);

  if (!isLoggedIn) return null;

  const { appointmentDate = "", appointmentTime = "", notes = "" } = bookingState;

  function handleChange(field, value) {
    onUpdate({ [field]: value });
  }

  return (
    <div className="space-y-6">
      <p className="text-stone text-sm">
        Choose your preferred date, time slot, and any notes for the stylist.
      </p>

      {/* Date picker */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="appointment-date"
          className="text-sm font-medium text-espresso"
        >
          Appointment Date <span className="text-maroon">*</span>
        </label>
        <input
          id="appointment-date"
          type="date"
          min={todayISO()}
          value={appointmentDate}
          onChange={(e) => handleChange("appointmentDate", e.target.value)}
          className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-sm text-espresso bg-white focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon/50 transition min-h-[44px]"
          required
        />
        <p className="text-xs text-stone/50">Past dates are not available.</p>
      </div>

      {/* Time slot */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="appointment-time"
          className="text-sm font-medium text-espresso"
        >
          Preferred Time Slot <span className="text-maroon">*</span>
        </label>
        <select
          id="appointment-time"
          value={appointmentTime}
          onChange={(e) => handleChange("appointmentTime", e.target.value)}
          className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-sm text-espresso bg-white focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon/50 transition min-h-[44px]"
          required
        >
          <option value="" disabled>
            Select a time slot
          </option>
          {TIME_SLOTS.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="appointment-notes"
          className="text-sm font-medium text-espresso"
        >
          Notes for the Stylist{" "}
          <span className="text-stone/40 font-normal">(optional)</span>
        </label>
        <textarea
          id="appointment-notes"
          value={notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="E.g. I'm looking for a bridal lehenga in crimson with heavy embroidery…"
          rows={4}
          className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-sm text-espresso bg-white placeholder-stone/30 resize-y focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon/50 transition"
        />
        <p className="text-xs text-stone/40">
          Share any preferences or questions with the stylist in advance.
        </p>
      </div>
    </div>
  );
}
