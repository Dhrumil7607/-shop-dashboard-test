/**
 * SellerOrders.jsx — /seller/orders
 * Full order list with status management for the seller.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Search, Package, ChevronDown, User, MapPin, Phone, ChevronRight, Truck } from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getSellerOrders, sellerUpdateOrder } from "@/lib/api";

/** Normalise a backend order into the row shape this page renders. */
function _fromApi(o) {
  const first = (o.items && o.items[0]) || {};
  return {
    id: o.id,
    product: first.product_name || (o.items?.length ? `${o.items.length} items` : "Order"),
    customer: o.customer_name || "Customer",
    email: o.customer_email || "",
    phone: o.customer_phone || "",
    address: o.customer_address || "",
    country: (o.shipping_address && o.shipping_address.country) || "",
    amount: o.total || 0,
    status: o.status || "pending",
    date: (o.created_at || "").slice(0, 10),
    awb: o.tracking_number || o.awb || "",
    _api: true,
  };
}

const STATUS_OPTS = ["pending","processing","confirmed","shipped","delivered","cancelled"];
const STATUS_STYLE = {
  pending:    { bg: "rgba(201,168,76,0.12)", text: "#9B7520"  },
  processing: { bg: "rgba(27,42,107,0.1)",  text: "#1B2A6B"  },
  confirmed:  { bg: "rgba(45,122,58,0.1)",  text: "#2D7A3A"  },
  shipped:    { bg: "rgba(162,70,107,0.1)", text: "#A2466B"  },
  delivered:  { bg: "rgba(45,122,58,0.15)", text: "#1A6B2A"  },
  cancelled:  { bg: "rgba(139,58,58,0.1)",  text: "#8B3A3A"  },
};

export default function SellerOrders() {
  const { isLoggedIn, isSeller } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isLoggedIn || !isSeller) { navigate("/login", { replace: true }); return; }
    // Backend is the single source of truth for seller orders.
    (async () => {
      try {
        const apiOrders = await getSellerOrders();
        setOrders(Array.isArray(apiOrders) ? apiOrders.map(_fromApi) : []);
      } catch {
        setOrders([]);
      }
    })();
  }, [isLoggedIn, isSeller, navigate]);

  const updateStatus = async (id, status) => {
    const prevOrders = orders;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      await sellerUpdateOrder(id, { status });
      toast.success(`Order ${id} marked as ${status}`);
    } catch {
      setOrders(prevOrders); // revert on failure
      toast.error("Could not save status to server");
    }
  };

  const visible = orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.product.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
    }
    return true;
  });

  if (!isLoggedIn || !isSeller) return null;

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">

          <div className="flex items-center gap-4 mb-8">
            <Link to="/seller/dashboard" className="p-2 rounded-xl hover:bg-stone-100 transition">
              <ChevronLeft size={20} style={{ color: "#6B5E52" }} />
            </Link>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C9A84C" }}>SELLER PORTAL</p>
              <h1 className="font-serif text-2xl md:text-3xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                Orders <span className="text-lg font-sans font-normal" style={{ color: "#9B8B7A" }}>({orders.length})</span>
              </h1>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search orders, products, customers…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#E8E4DF", backgroundColor: "white" }} />
            </div>
            <div className="relative">
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border text-sm outline-none capitalize"
                style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#1a1a1a" }}>
                <option value="all">All Statuses</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9B8B7A" }} />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} className="mx-auto mb-3" style={{ color: "#E8E4DF" }} />
              <p style={{ color: "#9B8B7A" }}>No orders match your search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((o, i) => {
                const s = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
                return (
                  <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="p-5 rounded-2xl border" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold font-mono" style={{ color: "#9B8B7A" }}>{o.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                            style={{ backgroundColor: s.bg, color: s.text }}>{o.status}</span>
                        </div>
                        <p className="font-serif text-base truncate" style={{ color: "#1a1a1a" }}>{o.product}</p>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <p className="text-xs inline-flex items-center gap-1.5" style={{ color: "#6B5E52" }}>
                            <User size={11} style={{ color: "#9B8B7A" }} />
                            <span className="font-medium">{o.customer}</span>
                            {o.country ? <span style={{ color: "#9B8B7A" }}>· {o.country}</span> : null}
                            <span style={{ color: "#9B8B7A" }}>· {o.date}</span>
                          </p>
                          {o.phone && (
                            <p className="text-xs inline-flex items-center gap-1.5" style={{ color: "#6B5E52" }}>
                              <Phone size={11} style={{ color: "#9B8B7A" }} /> {o.phone}
                            </p>
                          )}
                          {o.address && (
                            <p className="text-xs inline-flex items-center gap-1.5" style={{ color: "#6B5E52" }}>
                              <MapPin size={11} style={{ color: "#9B8B7A" }} /> {o.address}
                            </p>
                          )}
                          {o.awb && (
                            <p className="text-xs inline-flex items-center gap-1.5" style={{ color: "#2D7A3A" }}>
                              <Truck size={11} style={{ color: "#2D7A3A" }} /> AWB: <span className="font-mono">{o.awb}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-base font-bold" style={{ color: "#1a1a1a" }}>
                          ₹{o.amount.toLocaleString("en-IN")}
                        </span>
                        {/* Status updater */}
                        <div className="relative">
                          <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 rounded-xl border text-xs outline-none capitalize cursor-pointer"
                            style={{ borderColor: "#E8E4DF", backgroundColor: "#FAF9F6", color: "#1a1a1a" }}>
                            {STATUS_OPTS.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
                          </select>
                          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9B8B7A" }} />
                        </div>
                        {/* Manage / detail — only for real backend orders */}
                        {o._api && (
                          <Link to={`/seller/orders/${o.id}`}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                            style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}>
                            <span style={{ color: "#ffffff" }}>Manage</span> <ChevronRight size={13} color="#ffffff" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
