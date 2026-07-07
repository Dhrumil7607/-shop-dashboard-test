/**
 * SellerBookings.jsx — /seller/bookings
 * View and manage all live-shopping session bookings for this seller.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, CalendarDays, Search, Video, User, Clock, CheckCircle2, XCircle, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getSellerBookings, updateBookingApi } from "@/lib/api";

/** Map a backend booking into the row shape this page renders. */
function _fromApi(b) {
  return {
    id: b.id,
    customer: b.customer_name || "Customer",
    email: b.customer_email || "",
    phone: b.customer_phone || "",
    address: b.customer_address || "",
    date: b.date || "",
    time: b.time || "",
    products: b.selected_products?.length ? b.selected_products.map(p => p.name || p) : ["Live shopping session"],
    status: b.status === "pending_payment" ? "pending" : (b.status || "pending"),
    meetLink: b.google_meet_link || b.googleMeetLink || null,
    fee: b.session_fee || 0,
    _api: true,
  };
}

const STATUS_STYLE = {
  pending:   { bg: "rgba(201,168,76,0.12)", text: "#9B7520",  label: "Pending" },
  confirmed: { bg: "rgba(45,122,58,0.1)",  text: "#2D7A3A",  label: "Confirmed" },
  completed: { bg: "rgba(27,42,107,0.1)",  text: "#1B2A6B",  label: "Completed" },
  cancelled: { bg: "rgba(139,58,58,0.1)",  text: "#8B3A3A",  label: "Cancelled" },
};

export default function SellerBookings() {
  const { isLoggedIn, isSeller } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoggedIn || !isSeller) { navigate("/login", { replace: true }); return; }
    (async () => {
      // Backend is the single source of truth for seller bookings.
      try {
        const apiBookings = await getSellerBookings();
        setBookings(Array.isArray(apiBookings) ? apiBookings.map(_fromApi) : []);
      } catch {
        setBookings([]);
      }
    })();
  }, [isLoggedIn, isSeller, navigate]);

  const updateStatus = async (id, status) => {
    try {
      await updateBookingApi(id, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    } catch {
      toast.error("Could not save to server");
    }
  };

  const visible = bookings.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.customer.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
  });

  if (!isLoggedIn || !isSeller) return null;

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">

          <div className="flex items-center gap-4 mb-8">
            <Link to="/seller/dashboard" className="p-2 rounded-xl hover:bg-stone-100 transition">
              <ChevronLeft size={20} style={{ color: "#6B5E52" }} />
            </Link>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>SELLER PORTAL</p>
              <h1 className="font-serif text-2xl md:text-3xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>My Bookings</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer or booking ID…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: "#E8E4DF", backgroundColor: "white" }} />
          </div>

          <div className="space-y-4">
            {visible.map((b, i) => {
              const s = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                  className="p-5 rounded-2xl border" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold font-mono" style={{ color: "#9B8B7A" }}>{b.id}</span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <User size={13} style={{ color: "#9B8B7A" }} />
                        <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{b.customer}</p>
                        <span className="text-xs" style={{ color: "#9B8B7A" }}>{b.email}</span>
                      </div>
                      {(b.phone || b.address) && (
                        <div className="flex flex-col gap-0.5 mb-2">
                          {b.phone && (
                            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#6B5E52" }}>
                              <Phone size={11} style={{ color: "#9B8B7A" }} /> {b.phone}
                            </span>
                          )}
                          {b.address && (
                            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#6B5E52" }}>
                              <MapPin size={11} style={{ color: "#9B8B7A" }} /> {b.address}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#9B8B7A" }}>
                          <CalendarDays size={11} /> {b.date}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#9B8B7A" }}>
                          <Clock size={11} /> {b.time} IST
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {b.products.map(p => (
                          <span key={p} className="text-[11px] px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: "#F0EBE3", color: "#6B5E52" }}>{p}</span>
                        ))}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#A2466B" }}>
                        ₹{b.fee.toLocaleString("en-IN")} session fee
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {b.meetLink && (
                        <a href={b.meetLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
                          style={{ backgroundColor: "#1B2A6B" }}>
                          <Video size={13} /> Join Meeting
                        </a>
                      )}
                      {b.status === "pending" && (
                        <button onClick={() => updateStatus(b.id, "confirmed")}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
                          style={{ backgroundColor: "#2D7A3A" }}>
                          <CheckCircle2 size={13} /> Confirm
                        </button>
                      )}
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <button onClick={() => updateStatus(b.id, "cancelled")}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border"
                          style={{ borderColor: "#E8E4DF", color: "#8B3A3A" }}>
                          <XCircle size={13} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
