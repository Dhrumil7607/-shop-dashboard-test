/**
 * bookingService.js
 * Pure utility module — no React, no hooks.
 * Manages Booking objects persisted to localStorage under slb_bookings_{userId}.
 *
 * Booking shape:
 * {
 *   bookingId: string,           // "BK-" + 8 random chars
 *   userId: string,
 *   storeId: string,
 *   storeName: string,
 *   selectedProducts: Array<{id, name, image_url, price}>,  // up to 10
 *   appointmentIST: string,      // ISO 8601
 *   appointmentUserTz: string,   // ISO 8601 in user's tz
 *   timezone: string,            // e.g. "IST", "EST"
 *   googleMeetLink: string|null,
 *   status: 'pending'|'confirmed'|'completed'|'cancelled'|'postponed',
 *   originalAppointmentIST?: string,
 *   createdAt: string,           // ISO 8601
 *   sessionFee: number,          // 699
 * }
 *
 * Requirements: 8.8, 9.1, 10.1, 14.2
 */

const KEY_PREFIX = "slb_bookings_";

/**
 * Builds the localStorage key for a given userId.
 * @param {string} userId
 * @returns {string}
 */
function storageKey(userId) {
    return `${KEY_PREFIX}${userId}`;
}

/**
 * Reads the bookings array for a user from localStorage.
 * Returns an empty array on any read/parse error.
 * @param {string} userId
 * @returns {Array}
 */
function readBookings(userId) {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Writes the bookings array for a user to localStorage.
 * Silently swallows errors (e.g., quota exceeded, private mode).
 * @param {string} userId
 * @param {Array} bookings
 */
function writeBookings(userId, bookings) {
    try {
        localStorage.setItem(storageKey(userId), JSON.stringify(bookings));
    } catch {
        /* storage unavailable — no-op */
    }
}

// ---------------------------------------------------------------------------
// Helpers (also exported for use by components and tests)
// ---------------------------------------------------------------------------

/**
 * Sorts an array of bookings by appointmentIST descending
 * (newest appointment first). Does not mutate the original array.
 * @param {Array} bookings
 * @returns {Array}
 */
export function sortBookings(bookings) {
    return [...bookings].sort((a, b) => {
        const tA = new Date(a.appointmentIST).getTime();
        const tB = new Date(b.appointmentIST).getTime();
        return tB - tA;
    });
}

/**
 * Returns true iff the appointment is more than 48 hours in the future,
 * meaning cancellation is still permitted.
 * @param {{ appointmentIST: string }} booking
 * @returns {boolean}
 */
export function cancellationAllowed(booking) {
    return (new Date(booking.appointmentIST) - Date.now()) > 48 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// CRUD functions
// ---------------------------------------------------------------------------

/**
 * Appends a new booking to the user's bookings array in localStorage.
 * @param {string} userId
 * @param {Object} booking  Complete Booking object (caller generates bookingId, etc.)
 * @returns {void}
 */
export function save(userId, booking) {
    const existing = readBookings(userId);
    const updated = [...existing, booking];
    writeBookings(userId, updated);
}

/**
 * Returns all bookings for a user, sorted by appointmentIST descending.
 * @param {string} userId
 * @returns {Array}  Booking[]
 */
export function list(userId) {
    const bookings = readBookings(userId);
    return sortBookings(bookings);
}

/**
 * Finds the booking with the given bookingId, merges the patch object into it,
 * and writes the entire array back in a single localStorage.setItem call.
 * @param {string} userId
 * @param {string} bookingId
 * @param {Object} patch  Partial Booking fields to merge
 * @returns {Object|null}  The updated Booking, or null if not found
 */
export function update(userId, bookingId, patch) {
    const bookings = readBookings(userId);
    let updatedBooking = null;

    const updated = bookings.map((b) => {
        if (b.bookingId === bookingId) {
            updatedBooking = { ...b, ...patch };
            return updatedBooking;
        }
        return b;
    });

    if (updatedBooking !== null) {
        // Single atomic write
        writeBookings(userId, updated);
    }

    return updatedBooking;
}

/**
 * Scans ALL localStorage keys matching slb_bookings_* pattern,
 * collects every booking found, and returns a flat Booking[] sorted by
 * appointmentIST descending. No mock/demo data is ever included.
 * @returns {Array}  Booking[]
 */
export function listAll() {
    const allBookings = [];

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(KEY_PREFIX)) {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            allBookings.push(...parsed);
                        }
                    }
                } catch {
                    /* skip malformed entry */
                }
            }
        }
    } catch {
        /* localStorage iteration failed — return what we have */
    }

    return sortBookings(allBookings);
}

// Named default export grouping all functions for convenience
const bookingService = { save, list, update, listAll, sortBookings, cancellationAllowed };

export default bookingService;
