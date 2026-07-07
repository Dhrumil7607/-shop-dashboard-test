/**
 * AdminLayout.jsx
 * Isolated layout for the Admin Panel — completely separate from the
 * customer-facing site. No storefront nav, no cart, no wishlist.
 */

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { LogOut, LayoutDashboard, Package, ShoppingBag, BookOpen, Users, Settings, Tag, RotateCcw, Shield, ListOrdered, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

const NAV_TABS = [
  { label: "Dashboard",    path: "/admin/dashboard",             icon: LayoutDashboard },
  { label: "Sellers",      path: "/admin/sellers",               icon: Users },
  { label: "Products",     path: "/admin/products",              icon: Package },
  { label: "Orders",       path: "/admin/orders",                icon: ShoppingBag },
  { label: "Bookings",     path: "/admin/bookings",              icon: BookOpen },
  { label: "Returns",      path: "/admin/returns",               icon: RotateCcw },
  { label: "Coupons",      path: "/admin/coupons",               icon: Tag },
  { label: "Categories",   path: "/admin/categories",            icon: LayoutGrid },
  { label: "Store Order",  path: "/admin/store-ordering",        icon: ListOrdered },
  { label: "Staff",        path: "/admin/staff",                 icon: Shield },
  { label: "Settings",     path: "/admin/settings",              icon: Settings },
];

export default function AdminLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast("Logged out of Admin Panel");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f5f5f0" }}>

      {/* ── ADMIN HEADER ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: "#C9A84C" }}>
              <span className="font-serif font-bold text-xs" style={{ color: "#C9A84C" }}>S</span>
            </div>
            <div className="leading-none">
              <span className="font-bold text-sm text-white">ShopLive</span>
              <span className="font-bold text-sm" style={{ color: "#C9A84C" }}>Bharat</span>
              <span className="ml-2 text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(220,50,50,0.25)", color: "#FF9999" }}>
                ADMIN
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: "rgba(201,168,76,0.2)", color: "#C9A84C" }}>
                A
              </div>
              <span className="text-sm font-medium text-white">Admin</span>
            </div>
            <Link to="/" className="text-xs px-3 py-1.5 rounded-lg transition hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              ← View Site
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ backgroundColor: "#111", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-[1400px] mx-auto px-6 flex items-center overflow-x-auto">
            {NAV_TABS.map(({ label, path, icon: Icon }) => {
              const active = location.pathname === path ||
                location.pathname.startsWith(path + "/") ||
                (path === "/admin/sellers" && (location.pathname === "/admin/seller-applications" || location.pathname === "/admin/shops"));
              return (
                <Link key={path} to={path}
                  className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap relative transition"
                  style={{ color: active ? "#C9A84C" : "rgba(255,255,255,0.45)" }}>
                  <Icon size={14} />
                  {label}
                  {active && (
                    <motion.span layoutId="admin-tab-indicator"
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
        className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
