import { useState, useEffect } from "react";
import { Search, X, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import AdminLayout from "@/layouts/AdminLayout";
import bookingService from "@/services/bookingService";
import { isValidMeetUrl } from "@/utils/validators";

export const MOCK_BOOKINGS = [
    {
        id: "BK-001",
        bookingId: "BK-001",
        slotId: "SLOT-001",
        consultantName: "Priya Sharma",
        customerName: "Rajesh Kumar",
        customerEmail: "rajesh@example.com",
        customerPhone: "+91 98765 43210",
        shopName: "Eternal Threads",
        date: "2026-07-05",
        time: "14:00",
        duration: 30,
        category: "Wedding Wear",
        price: 2999,
        status: "confirmed",
        paymentStatus: "paid",
        notes: "Bridal lehenga consultation",
        googleMeetLink: null,
        userId: null,
        appointmentIST: "2026-07-05T14:00:00.000+05:30",
    },
    {
        id: "BK-002",
        bookingId: "BK-002",
        slotId: "SLOT-002",
        consultantName: "Ananya Desai",
        customerName: "Priya Singh",
        customerEmail: "priya@example.com",
        customerPhone: "+91 98765 54321",
        shopName: "Festive Flourish",
        date: "2026-07-10",
        time: "10:00",
        duration: 45,
        category: "Festive Collections",
        price: 4499,
        status: "confirmed",
        paymentStatus: "paid",
        notes: "Diwali wardrobe consultation",
        googleMeetLink: null,
        userId: null,
        appointmentIST: "2026-07-10T10:00:00.000+05:30",
    },
    {
        id: "BK-003",
        bookingId: "BK-003",
        slotId: "SLOT-003",
        consultantName: "Meera Kapoor",
        customerName: "Amit Patel",
        customerEmail: "amit@example.com",
        customerPhone: "+91 99876 54321",
        shopName: "Heritage Creations",
        date: "2026-06-20",
        time: "15:30",
        duration: 30,
        category: "Wedding Wear",
        price: 2999,
        status: "completed",
        paymentStatus: "paid",
        notes: "Mehndi outfit selection",
        googleMeetLink: null,
        userId: null,
        appointmentIST: "2026-06-20T15:30:00.000+05:30",
    },
    {
        id: "BK-004",
        bookingId: "BK-004",
        slotId: "SLOT-004",
        consultantName: "Priya Sharma",
        customerName: "Neha Desai",
        customerEmail: "neha@example.com",
        customerPhone: "+91 97654 32109",
        shopName: "Eternal Threads",
        date: "2026-07-15",
        time: "11:00",
        duration: 30,
        category: "Casual Wear",
        price: 1999,
        status: "pending",
        paymentStatus: "pending",
        notes: "Casual wardrobe consultation",
        googleMeetLink: null,
        userId: null,
        appointmentIST: "2026-07-15T11:00:00.000+05:30",
    },
];

/**
 * Returns true if the booking's appointmentIST is within the next 24 hours.
 * @param {Object} booking
 * @returns {boolean}
 */
function isWithin24Hours(booking) {
    const appt = new Date(booking.appointmentIST || `${booking.date}T${booking.time}:00.000+05:30`);
    const now = Date.now();
    const diff = appt.getTime() - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

function BookingRow({ booking, onEdit, onDelete, formatPrice, onUpdate }) {
    // Google Meet Link state
    const [meetUrl, setMeetUrl] = useState(booking.googleMeetLink || "");
    const [meetError, setMeetError] = useState("");
    const [confirmingMeet, setConfirmingMeet] = useState(false);

    // Postpone state
    const [postponeDateTime, setPostponeDateTime] = useState("");
    const [postponing, setPostponing] = useState(false);

    const meetUrlValid = isValidMeetUrl(meetUrl);

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed":
                return "bg-green-100 text-green-700";
            case "pending":
                return "bg-yellow-100 text-yellow-700";
            case "cancelled":
                return "bg-red-100 text-red-700";
            case "completed":
                return "bg-blue-100 text-blue-700";
            case "postponed":
                return "bg-purple-100 text-purple-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const handleConfirmMeet = async () => {
        if (!meetUrlValid) {
            setMeetError("Invalid Meet URL. Expected format: https://meet.google.com/abc-abcd-abc");
            return;
        }
        setConfirmingMeet(true);
        try {
            const bookingId = booking.bookingId || booking.id;
            const userId = booking.userId || null;
            const patch = { status: "confirmed", googleMeetLink: meetUrl };
            let updated = null;
            if (userId) {
                updated = bookingService.update(userId, bookingId, patch);
            }
            // For MOCK_BOOKINGS (userId null), update local state only
            if (updated !== null || !userId) {
                onUpdate(bookingId, patch);
                toast.success("Booking confirmed");
                setMeetError("");
            } else {
                toast.error("Failed to confirm booking — please try again.");
            }
        } catch {
            toast.error("Failed to confirm booking — please try again.");
        } finally {
            setConfirmingMeet(false);
        }
    };

    const handlePostpone = () => {
        if (!postponeDateTime) return;
        setPostponing(true);
        try {
            const bookingId = booking.bookingId || booking.id;
            const userId = booking.userId || null;
            const patch = {
                status: "postponed",
                originalAppointmentIST: booking.appointmentIST || `${booking.date}T${booking.time}:00.000+05:30`,
                appointmentIST: new Date(postponeDateTime).toISOString(),
            };
            if (userId) {
                bookingService.update(userId, bookingId, patch);
            }
            onUpdate(bookingId, patch);
            toast.success("Booking postponed");
            setPostponeDateTime("");
        } catch {
            toast.error("Failed to postpone booking.");
        } finally {
            setPostponing(false);
        }
    };

    const handleSendReminder = () => {
        try {
            const email = booking.customerEmail || "customer";
            toast.success(`Reminder notification queued for ${email}`);
        } catch {
            toast.error("Failed to queue reminder notification.");
        }
    };

    const showReminder = booking.status === "confirmed" && isWithin24Hours(booking);

    return (
        <tr className="border-b border-line-soft hover:bg-gray-50 transition">
            {/* Existing columns */}
            <td className="px-6 py-4 text-sm text-espresso font-medium">{booking.id || booking.bookingId}</td>
            <td className="px-6 py-4 text-sm text-espresso">{booking.customerName}</td>
            <td className="px-6 py-4 text-sm text-espresso">{booking.consultantName}</td>
            <td className="px-6 py-4 text-sm text-espresso">{booking.shopName || booking.storeName}</td>
            <td className="px-6 py-4 text-sm text-espresso">
                {booking.date
                    ? new Date(booking.date).toLocaleDateString()
                    : booking.appointmentIST
                        ? new Date(booking.appointmentIST).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                        : "—"}
            </td>
            <td className="px-6 py-4 text-sm text-maroon font-bold">{formatPrice(booking.price || booking.sessionFee || 0)}</td>
            <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status
                        ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
                        : "—"}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                }`}>
                    {booking.paymentStatus === "paid" ? "Paid" : "Pending"}
                </span>
            </td>
            {/* Existing edit/delete actions */}
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(booking)}
                        className="p-2 text-maroon hover:bg-maroon/10 rounded-lg transition"
                        title="Edit booking"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(booking.id || booking.bookingId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete booking"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>

            {/* Google Meet Link column */}
            <td className="px-6 py-4 min-w-[260px]">
                <div className="flex flex-col gap-1">
                    {booking.googleMeetLink ? (
                        <a
                            href={booking.googleMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 underline break-all"
                        >
                            {booking.googleMeetLink}
                        </a>
                    ) : (
                        <>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={meetUrl}
                                    onChange={(e) => {
                                        setMeetUrl(e.target.value);
                                        setMeetError("");
                                    }}
                                    placeholder="https://meet.google.com/abc-abcd-abc"
                                    className="flex-1 px-2 py-1 border border-line-soft rounded text-xs focus:border-maroon outline-none min-w-0"
                                    aria-label="Google Meet URL"
                                />
                                <button
                                    onClick={handleConfirmMeet}
                                    disabled={!meetUrlValid || confirmingMeet}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                                >
                                    Confirm
                                </button>
                            </div>
                            {meetError && (
                                <p className="text-xs text-red-600 mt-0.5">{meetError}</p>
                            )}
                            {meetUrl && !meetUrlValid && (
                                <p className="text-xs text-red-600 mt-0.5">
                                    Invalid URL. Use format: https://meet.google.com/abc-abcd-abc
                                </p>
                            )}
                        </>
                    )}
                </div>
            </td>

            {/* Actions (Confirm/Postpone/Reminder) column */}
            <td className="px-6 py-4 min-w-[220px]">
                <div className="flex flex-col gap-2">
                    {/* Postpone */}
                    <div className="flex gap-2 items-center">
                        <input
                            type="datetime-local"
                            value={postponeDateTime}
                            onChange={(e) => setPostponeDateTime(e.target.value)}
                            className="flex-1 px-2 py-1 border border-line-soft rounded text-xs focus:border-maroon outline-none min-w-0"
                            aria-label="New appointment date/time for postponement"
                        />
                        <button
                            onClick={handlePostpone}
                            disabled={!postponeDateTime || postponing}
                            className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                        >
                            Postpone
                        </button>
                    </div>

                    {/* Send Reminder — only for confirmed bookings within 24 hours */}
                    {showReminder && (
                        <button
                            onClick={handleSendReminder}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition w-fit"
                        >
                            Send Reminder
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default function AdminBookings() {
    const { formatPrice } = useCurrency();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Load bookings from bookingService (merges MOCK_BOOKINGS + localStorage)
    useEffect(() => {
        const all = bookingService.listAll();
        setBookings(all);
    }, []);

    // Filter bookings
    useEffect(() => {
        let filtered = bookings;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (b) =>
                    (b.id || b.bookingId || "").toLowerCase().includes(query) ||
                    (b.customerName || "").toLowerCase().includes(query) ||
                    (b.consultantName || "").toLowerCase().includes(query) ||
                    (b.customerEmail || "").toLowerCase().includes(query) ||
                    (b.customerPhone || "").includes(query)
            );
        }

        if (filterStatus !== "all") {
            filtered = filtered.filter((b) => b.status === filterStatus);
        }

        setFilteredBookings(filtered);
    }, [bookings, searchQuery, filterStatus]);

    const handleDelete = (bookingId) => {
        if (confirm("Are you sure you want to delete this booking?")) {
            setBookings((prev) => prev.filter((b) => (b.id || b.bookingId) !== bookingId));
            toast.success("Booking deleted");
        }
    };

    const handleEdit = (booking) => {
        setSelectedBooking(booking);
    };

    const handleStatusChange = (newStatus) => {
        if (selectedBooking) {
            setBookings((prev) =>
                prev.map((b) =>
                    (b.id || b.bookingId) === (selectedBooking.id || selectedBooking.bookingId)
                        ? { ...b, status: newStatus }
                        : b
                )
            );
            toast.success(`Booking status updated to ${newStatus}`);
            setSelectedBooking(null);
        }
    };

    // Called by BookingRow after a Meet-confirm or Postpone action
    const handleRowUpdate = (bookingId, patch) => {
        setBookings((prev) =>
            prev.map((b) =>
                (b.id || b.bookingId) === bookingId ? { ...b, ...patch } : b
            )
        );
    };

    // Calculate stats
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
    const totalRevenue = bookings.reduce(
        (sum, b) => sum + (b.paymentStatus === "paid" ? (b.price || b.sessionFee || 0) : 0),
        0
    );
    const pendingPayments = bookings.filter((b) => b.paymentStatus === "pending").length;

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-espresso mb-2">Bookings Management</h1>
                    <p className="text-espresso/60">Manage all consultation slot bookings</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg border border-line-soft p-6">
                        <p className="text-sm text-espresso/60 mb-2">Total Bookings</p>
                        <p className="text-3xl font-bold text-espresso">{totalBookings}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-line-soft p-6">
                        <p className="text-sm text-espresso/60 mb-2">Confirmed</p>
                        <p className="text-3xl font-bold text-green-600">{confirmedBookings}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-line-soft p-6">
                        <p className="text-sm text-espresso/60 mb-2">Total Revenue</p>
                        <p className="text-3xl font-bold text-maroon">{formatPrice(totalRevenue)}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-line-soft p-6">
                        <p className="text-sm text-espresso/60 mb-2">Pending Payments</p>
                        <p className="text-3xl font-bold text-orange-600">{pendingPayments}</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg border border-line-soft p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-espresso/40" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none text-sm"
                            />
                        </div>

                        {/* Status Filter — includes 'postponed' */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="postponed">Postponed</option>
                        </select>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-lg border border-line-soft overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-line-soft">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Consultant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Shop
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Actions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Google Meet Link
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-espresso uppercase tracking-wider">
                                        Actions (Confirm/Postpone/Reminder)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking) => (
                                        <BookingRow
                                            key={booking.bookingId || booking.id}
                                            booking={booking}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            formatPrice={formatPrice}
                                            onUpdate={handleRowUpdate}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="px-6 py-8 text-center text-espresso/60">
                                            No bookings found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Info */}
                    <div className="px-6 py-4 border-t border-line-soft text-sm text-espresso/60">
                        Showing {filteredBookings.length} of {totalBookings} bookings
                    </div>
                </div>

                {/* Edit Modal — preserved exactly as before */}
                {selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm">
                        <div className="bg-white rounded-lg max-w-md w-full p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-espresso">Update Booking</h2>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-espresso/60 mb-2">Booking ID</p>
                                <p className="font-semibold text-espresso">{selectedBooking.id || selectedBooking.bookingId}</p>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-espresso/60 mb-2">Customer: {selectedBooking.customerName}</p>
                                <p className="text-sm text-espresso/60">Consultant: {selectedBooking.consultantName}</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-espresso mb-3">Update Status</label>
                                <select
                                    value={selectedBooking.status}
                                    onChange={(e) =>
                                        setSelectedBooking({ ...selectedBooking, status: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="postponed">Postponed</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-espresso mb-3">Payment Status</label>
                                <select
                                    value={selectedBooking.paymentStatus || "pending"}
                                    onChange={(e) =>
                                        setSelectedBooking({ ...selectedBooking, paymentStatus: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="flex-1 px-4 py-2 border border-line-soft text-espresso rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleStatusChange(selectedBooking.status);
                                    }}
                                    className="flex-1 px-4 py-2 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition font-medium"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
