/**
 * TimezoneSelector.jsx — Step 4 of LiveBookingFlow
 *
 * <select> with 8 timezone options.
 * After selection: shows IST equivalent of the appointment date/time
 * from bookingState.
 *
 * Auth check: if not logged in, calls onAuthRequired() instead of rendering.
 *
 * Props:
 *   bookingState    {object}    shared booking state (needs .appointmentDate, .appointmentTime, .timezone)
 *   onUpdate        {function}  patch callback: onUpdate({ timezone })
 *   onAuthRequired  {function}  called when user is not authenticated
 *
 * Requirements: 8.5, 8.9, 12.7
 */

import { useEffect } from "react";
import { Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Offset in minutes from UTC for each timezone label
const TIMEZONES = [
  { value: "IST",  label: "IST (+05:30) — India Standard Time",          offsetMinutes:  330 },
  { value: "UTC",  label: "UTC (+00:00) — Coordinated Universal Time",   offsetMinutes:    0 },
  { value: "EST",  label: "EST (−05:00) — Eastern Standard Time",        offsetMinutes: -300 },
  { value: "PST",  label: "PST (−08:00) — Pacific Standard Time",        offsetMinutes: -480 },
  { value: "GMT",  label: "GMT (+00:00) — Greenwich Mean Time",          offsetMinutes:    0 },
  { value: "GST",  label: "GST (+04:00) — Gulf Standard Time",           offsetMinutes:  240 },
  { value: "AEST", label: "AEST (+10:00) — Australian Eastern Standard", offsetMinutes:  600 },
  { value: "SGT",  label: "SGT (+08:00) — Singapore Time",               offsetMinutes:  480 },
];

const IST_OFFSET_MINUTES = 330; // +05:30

/**
 * Given an appointment date string (YYYY-MM-DD), time string (HH:mm),
 * and the selected timezone offset (minutes from UTC),
 * returns the equivalent time in IST as a formatted string.
 *
 * The appointment date+time is treated as wall-clock time in the
 * *selected* timezone. We convert to UTC, then to IST.
 */
function toISTEquivalent(dateStr, timeStr, fromOffsetMinutes) {
  if (!dateStr || !timeStr) return null;

  try {
    // Parse the date/time as if it's in the selected timezone
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);

    if (isNaN(year) || isNaN(hour)) return null;

    // Build a UTC timestamp by subtracting the from-timezone offset
    // (fromOffsetMinutes is how many minutes ahead of UTC that tz is)
    const utcMs =
      Date.UTC(year, month - 1, day, hour, minute) -
      fromOffsetMinutes * 60 * 1000;

    // Add IST offset to get IST wall-clock
    const istMs = utcMs + IST_OFFSET_MINUTES * 60 * 1000;
    const istDate = new Date(istMs);

    return istDate.toLocaleString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC", // we already manually adjusted, so treat as UTC here
    });
  } catch {
    return null;
  }
}

export default function TimezoneSelector({ bookingState, onUpdate, onAuthRequired }) {
  const { isLoggedIn } = useAuth();

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn && onAuthRequired) {
      onAuthRequired();
    }
  }, [isLoggedIn, onAuthRequired]);

  if (!isLoggedIn) return null;

  const selectedTz = bookingState.timezone || "IST";
  const { appointmentDate, appointmentTime } = bookingState;

  const selectedTzObj = TIMEZONES.find((tz) => tz.value === selectedTz);

  // Compute the IST equivalent only when a different timezone is selected
  // (if IST is selected, IST equivalent = the date/time itself)
  const istEquivalent =
    selectedTzObj && appointmentDate && appointmentTime
      ? toISTEquivalent(appointmentDate, appointmentTime, selectedTzObj.offsetMinutes)
      : null;

  function handleChange(e) {
    onUpdate({ timezone: e.target.value });
  }

  return (
    <div className="space-y-6">
      <p className="text-stone text-sm">
        Select your local timezone so we can schedule the session at the right time for you.
      </p>

      {/* Timezone select */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="timezone-select"
          className="text-sm font-medium text-espresso"
        >
          Your Timezone <span className="text-maroon">*</span>
        </label>
        <select
          id="timezone-select"
          value={selectedTz}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-stone/20 rounded-lg text-sm text-espresso bg-white focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon/50 transition min-h-[44px]"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* IST equivalent display */}
      {istEquivalent && (
        <div className="flex items-start gap-3 p-4 bg-maroon/5 border border-maroon/20 rounded-xl">
          <Clock size={18} className="text-maroon flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-maroon uppercase tracking-wide mb-0.5">
              IST Equivalent
            </p>
            <p className="text-sm text-espresso font-semibold">{istEquivalent}</p>
            <p className="text-xs text-stone/50 mt-1">
              This is when your session will take place in India Standard Time.
            </p>
          </div>
        </div>
      )}

      {/* Prompt when no appointment date/time set */}
      {(!appointmentDate || !appointmentTime) && (
        <p className="text-xs text-stone/50 italic">
          Set your appointment date and time in Step 3 to see the IST equivalent here.
        </p>
      )}
    </div>
  );
}
