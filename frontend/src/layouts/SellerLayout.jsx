/**
 * SellerLayout.jsx
 * Isolated layout for the Seller Portal — completely separate from the
 * customer-facing site. No customer navbar, no cart, no wishlist.
 */

import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Package, Radio, ClipboardList, CalendarDays, Tag, Eye, LayoutDashboard, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const NAV_TABS = [
  { label: "Overview",  to: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Products",  to: "/seller/products",  icon: Package },
  { label: "Orders",    to: "/seller/orders",     icon: ClipboardList },
  { label: "Bookings",  to: "/seller/bookings",   icon: CalendarDays },
  { label: "Live",      to: "/seller/live",       icon: Radio },
  { label: "Coupons",   to: "/seller/coupons",    icon: Tag },
  { label: "Settings",  to: "/seller/settings",   icon: Settings },
];

export default function SellerLayout({ children }) {
  const { isLoggedIn, isSeller, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route guard — only sellers can see this layout
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/seller/login", { replace: true });
      return;
    }
    if (!isSeller) {
      toast.error("Seller access required.");
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, isSeller, navigate]);

  const handleLogout = () => {
    logout();
    toast("Logged out of Seller Portal");
    navigate("/seller/login");
  };

  if (!isLoggedIn || !isSeller) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FAF9F6" }}>

      {/* ── SELLER HEADER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "#1a1a1a", borderColor: "#333" }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: "#C9A84C" }}>
              <span className="font-serif font-bold text-xs" style={{ color: "#C9A84C" }}>S</span>
            </div>
            <div className="leading-none">
              <span className="font-bold text-sm text-white">ShopLive</span>
              <span className="font-bold text-sm" style={{ color: "#C9A84C" }}>Bharat</span>
              <span className="ml-2 text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(162,70,107,0.3)", color: "#E8A4C0" }}>
                SELLER
              </span>
            </div>
          </div>

          {/* Right — store name + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: "rgba(201,168,76,0.2)", color: "#C9A84C" }}>
                {user?.name?.charAt(0) || "S"}
              </div>
              <span className="text-sm font-medium text-white">{user?.store_name || "My Store"}</span>
            </div>
            <Link to="/" className="text-xs px-3 py-1.5 rounded-lg transition hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.6)" }}>
              View Site
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.6)" }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#141414" }}>
          <div className="max-w-7xl mx-auto px-6 flex items-center overflow-x-auto">
            {NAV_TABS.map(({ label, to, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to}
                  className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap relative transition"
                  style={{ color: active ? "#C9A84C" : "rgba(255,255,255,0.5)" }}>
                  <Icon size={14} />
                  {label}
                  {active && (
                    <motion.span layoutId="seller-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                      style={{ backgroundColor: "#C9A84C" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── PAGE CONTENT ──────────────────────────────────────────── */}
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </div>
  );
}
