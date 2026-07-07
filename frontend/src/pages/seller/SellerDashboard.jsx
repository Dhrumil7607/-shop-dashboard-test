/**
 * SellerDashboard.jsx — /seller/dashboard
 *
 * Demo seller portal for Heritage Couture (demo_seller account).
 * Shows store overview, product stats, orders, bookings, and quick actions.
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, ShoppingBag, Star, Users, TrendingUp,
  Plus, Settings, Video, Tag, BarChart3, CheckCircle2,
  ArrowRight, Eye, Radio, CalendarDays, ClipboardList, Power,
} from "lucide-react";
import { toast } from "sonner";
import SellerLayout from "@/layouts/SellerLayout";
import { useAuth } from "@/contexts/AuthContext";

// Human-readable labels for the profile-completion banner
const FIELD_LABELS = {
  name: "a store name",
  description: "a store description",
  image_url: "a logo image",
  banner_image: "a banner image",
  specialty: "a category / specialty",
  city: "your city",
  return_policy: "a return/refund policy",
  shipping_policy: "shipping details",
  shipping_details: "shipping details",
  phone: "a contact phone number",
};

const QUICK_ACTIONS = [
  { label: "Manage Products",  to: "/seller/products",  icon: Package,       color: "#A2466B" },
  { label: "Schedule Live",    to: "/seller/live",       icon: Radio,         color: "#C0392B" },
  { label: "View Orders",      to: "/seller/orders",     icon: ClipboardList, color: "#1B2A6B" },
  { label: "My Bookings",      to: "/seller/bookings",   icon: CalendarDays,  color: "#2D7A3A" },
  { label: "Manage Coupons",   to: "/seller/coupons",    icon: Tag,           color: "#C9A84C" },
  { label: "View My Store",    to: "/shops/shop-heritage-couture", icon: Eye, color: "#6B5E52" },
];

const STATUS_STYLE = {
  confirmed:  { bg: "rgba(45,122,58,0.1)",   text: "#2D7A3A",   label: "Confirmed" },
  shipped:    { bg: "rgba(27,42,107,0.1)",    text: "#1B2A6B",   label: "Shipped" },
  delivered:  { bg: "rgba(45,122,58,0.15)",   text: "#1A6B2A",   label: "Delivered" },
  processing: { bg: "rgba(201,168,76,0.12)",  text: "#9B7520",   label: "Processing" },
};

export default function SellerDashboard() {
  const { isLoggedIn, isSeller, user } = useAuth();
  const navigate = useNavigate();

  const storeId = user?.store_id || "";
  const storeName = user?.store_name || "Your Store";
  const [online, setOnline] = useState(true);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [stats, setStats] = useState({ products: 0, liveProducts: 0, oosProducts: 0, slots: 0, bookings: 0, rating: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [completion, setCompletion] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [shopData, setShopData] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isSeller) {
      toast.error("Seller access required.");
      navigate("/account", { replace: true });
      return;
    }
    // Load current store settings + real stats from the backend (source of truth)
    (async () => {
      try {
        const { getSellerShop, getSellerProducts, getSellerSlots, getSellerBookings } = await import("@/lib/api");
        const shop = await getSellerShop().catch(() => null);
        if (shop) {
          setOnline(shop.online !== false);
          setLiveEnabled(shop.liveShoppingEnabled !== false);
          setCompletion(shop.completion || null);
          setIsPublic(shop.is_public !== false);
          // Store admin restriction flags for UI
          setShopData(shop);
        }
        const { getSellerOrders } = await import("@/lib/api");
        const [prods, slots, bookings, orders] = await Promise.all([
          getSellerProducts().catch(() => []),
          getSellerSlots().catch(() => []),
          getSellerBookings().catch(() => []),
          getSellerOrders().catch(() => []),
        ]);
        setStats({
          products: prods.length,
          liveProducts: prods.filter(p => p.status === "live").length,
          oosProducts: prods.filter(p => p.status === "out_of_stock").length,
          slots: slots.filter(s => s.status === "available").length,
          bookings: bookings.length,
          rating: shop?.rating ?? 0,
        });
        setRecentOrders(orders.slice(0, 5));
      } catch {}
    })();
  }, [isLoggedIn, isSeller, navigate, storeId]);

  // Seller may only toggle public/live features once profile is complete + 3 products.
  const isSuspendedByAdmin = shopData?.isSuspended || shopData?.is_archived;
  const canGoPublic = !isSuspendedByAdmin && (completion
    ? (completion.profile_complete && completion.meets_product_minimum)
    : true);

  const toggleOnline = async () => {
    if (isSuspendedByAdmin) { toast.error("Your store is suspended. Contact admin."); return; }
    if (!canGoPublic) {
      toast.error("Complete your profile and add 3 products before going online.");
      navigate("/seller/settings");
      return;
    }
    const next = !online;
    setOnline(next);
    try {
      const { updateSellerShop } = await import("@/lib/api");
      const res = await updateSellerShop({ online: next });
      // Backend is source of truth — honour coerced value
      if (res && typeof res.online === "boolean") setOnline(res.online);
      toast.success(next ? "🟢 Store is now online" : "🔴 Store is now offline");
    } catch {
      setOnline(!next); // revert on failure
      toast.error("Could not update store status");
    }
  };

  const toggleLive = async () => {
    if (isSuspendedByAdmin) { toast.error("Your store is suspended. Contact admin."); return; }
    if (shopData?.admin_live_disabled) { toast.error("Live video has been disabled by admin. Contact support."); return; }
    if (!canGoPublic) {
      toast.error("Complete your profile and add 3 products before enabling live shopping.");
      navigate("/seller/settings");
      return;
    }
    const next = !liveEnabled;
    setLiveEnabled(next);
    try {
      const { updateSellerShop } = await import("@/lib/api");
      const res = await updateSellerShop({ liveShoppingEnabled: next });
      if (res && typeof res.liveShoppingEnabled === "boolean") setLiveEnabled(res.liveShoppingEnabled);
      toast.success(next ? "Live Shopping enabled" : "Live Shopping disabled");
    } catch {
      setLiveEnabled(!next); // revert on failure
      toast.error("Could not update live shopping");
    }
  };

  if (!isLoggedIn || !isSeller) return null;

  return (
    <SellerLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "80vh" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#C9A84C" }}>
                SELLER PORTAL
              </p>
              <h1 className="font-serif text-3xl md:text-4xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                Welcome, {user?.name?.split(" ")[0] || "Seller"} 👋
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span className="text-sm" style={{ color: "#6B5E52" }}>
                  {storeName} · Verified Seller
                </span>
              </div>
            </div>
            <Link
              to={`/shops/${storeId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
              style={{ backgroundColor: "#1a1a1a", color: "white" }}
            >
              <Eye size={15} /> View Your Store
            </Link>
          </div>

          {/* ── Admin suspension banner ──────────────────────────── */}
          {shopData?.isSuspended && (
            <div className="mb-6 rounded-2xl p-5" style={{ backgroundColor: "#FEF2F2", border: "2px solid #FCA5A5" }}>
              <p className="font-bold text-sm mb-1" style={{ color: "#C0392B" }}>
                🚫 Your store has been suspended by the admin
              </p>
              <p className="text-xs" style={{ color: "#C0392B" }}>
                Your store and all products are hidden from the public. You cannot go online or publish products until the suspension is lifted.
                {shopData.suspension_reason && <span> Reason: <strong>{shopData.suspension_reason}</strong></span>}
              </p>
              <p className="text-xs mt-2" style={{ color: "#9B3A3A" }}>Contact support to resolve this issue.</p>
            </div>
          )}

          {/* ── Admin archived banner ───────────────────────────── */}
          {shopData?.is_archived && (
            <div className="mb-6 rounded-2xl p-5" style={{ backgroundColor: "#F9FAFB", border: "2px solid #D1D5DB" }}>
              <p className="font-bold text-sm mb-1" style={{ color: "#374151" }}>
                🗃 Your store has been archived
              </p>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                Your store has been disabled. Please contact admin support.
              </p>
            </div>
          )}

          {/* ── Admin live video disabled banner ─────────────────── */}
          {shopData?.admin_live_disabled && !shopData?.isSuspended && (
            <div className="mb-6 rounded-2xl p-4" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5" }}>
              <p className="text-sm font-medium" style={{ color: "#C0392B" }}>
                🔴 Live video shopping has been disabled for your store by the admin. Your store will not appear in Live Shopping.
                Contact admin to re-enable.
              </p>
            </div>
          )}

          {/* ── Public-visibility / profile-completion banner ───────── */}
          {completion && !isPublic && (
            <div className="mb-6 rounded-2xl p-5" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FCD34D" }}>
              <p className="font-semibold text-sm mb-2" style={{ color: "#92400E" }}>
                ⚠️ Your store is not visible to customers yet
              </p>
              <p className="text-xs mb-3" style={{ color: "#92400E" }}>
                To appear on the marketplace and Shop by Stores, complete your profile and list at least 3 valid products.
              </p>
              <div className="flex flex-wrap gap-2">
                {(completion.missing_fields || []).map((f) => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                    Add {FIELD_LABELS[f] || f}
                  </span>
                ))}
                {!completion.meets_product_minimum && (
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                    Add {completion.products_needed} more valid product{completion.products_needed !== 1 ? "s" : ""} ({completion.valid_products}/3)
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Link to="/seller/settings" className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#92400E" }}>Complete Profile</Link>
                <Link to="/seller/products" className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: "#FCD34D", color: "#92400E" }}>Add Products</Link>
              </div>
            </div>
          )}
          {completion && isPublic && (
            <div className="mb-6 rounded-2xl p-4 flex items-center gap-2" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
              <CheckCircle2 size={16} style={{ color: "#2D7A3A" }} />
              <p className="text-sm font-medium" style={{ color: "#166534" }}>Your store is live and visible to customers.</p>
            </div>
          )}

          {/* ── Store status controls ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl border p-5 flex items-center justify-between"
              style={{ backgroundColor: "white", borderColor: online ? "#2D7A3A" : "#E8E4DF" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: online ? "rgba(45,122,58,0.1)" : "rgba(139,58,58,0.08)" }}>
                  <Power size={18} style={{ color: online ? "#2D7A3A" : "#8B3A3A" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Store Status</p>
                  <p className="text-xs" style={{ color: "#9B8B7A" }}>
                    {online ? "🟢 Online — visible to customers" : "🔴 Offline — hidden from storefront"}
                  </p>
                </div>
              </div>
              <button onClick={toggleOnline}
                type="button" disabled={!canGoPublic}
                className="relative flex-shrink-0 rounded-full"
                style={{ width: 48, height: 26, padding: 0, border: "none",
                  cursor: canGoPublic ? "pointer" : "not-allowed", opacity: canGoPublic ? 1 : 0.5,
                  backgroundColor: online ? "#2D7A3A" : "#D1CFC9", transition: "background-color 0.2s ease" }}
                aria-pressed={online} aria-label="Toggle store online"
                title={canGoPublic ? "Toggle store online" : "Complete your profile first"}>
                <span className="rounded-full"
                  style={{ position: "absolute", top: 3, left: 3, width: 20, height: 20,
                    backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    transform: online ? "translateX(22px)" : "translateX(0)",
                    transition: "transform 0.2s ease" }} />
              </button>
            </div>

            <div className="rounded-2xl border p-5 flex items-center justify-between"
              style={{ backgroundColor: "white", borderColor: liveEnabled ? "#C0392B" : "#E8E4DF" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: liveEnabled ? "rgba(192,57,43,0.1)" : "rgba(155,139,122,0.1)" }}>
                  <Radio size={18} style={{ color: liveEnabled ? "#C0392B" : "#9B8B7A" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Live Shopping</p>
                  <p className="text-xs" style={{ color: "#9B8B7A" }}>
                    {liveEnabled ? "Enabled — appears in /live-shopping" : "Disabled — hidden from live shopping"}
                  </p>
                </div>
              </div>
              <button onClick={toggleLive}
                type="button" disabled={!canGoPublic}
                className="relative flex-shrink-0 rounded-full"
                style={{ width: 48, height: 26, padding: 0, border: "none",
                  cursor: canGoPublic ? "pointer" : "not-allowed", opacity: canGoPublic ? 1 : 0.5,
                  backgroundColor: liveEnabled ? "#C0392B" : "#D1CFC9", transition: "background-color 0.2s ease" }}
                aria-pressed={liveEnabled} aria-label="Toggle live shopping"
                title={canGoPublic ? "Toggle live shopping" : "Complete your profile first"}>
                <span className="rounded-full"
                  style={{ position: "absolute", top: 3, left: 3, width: 20, height: 20,
                    backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    transform: liveEnabled ? "translateX(22px)" : "translateX(0)",
                    transition: "transform 0.2s ease" }} />
              </button>
            </div>
          </div>

          {/* ── Seller nav tabs ─────────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
            {[
              { label: "Overview",  to: "/seller/dashboard" },
              { label: "Products",  to: "/seller/products" },
              { label: "Orders",    to: "/seller/orders" },
              { label: "Bookings",  to: "/seller/bookings" },
              { label: "Live",      to: "/seller/live" },
              { label: "Coupons",   to: "/seller/coupons" },
              { label: "Settings",  to: "/seller/settings" },
            ].map(tab => (
              <Link key={tab.to} to={tab.to}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition"
                style={{
                  backgroundColor: tab.to === "/seller/dashboard" ? "#1a1a1a" : "#F0EBE3",
                  color: tab.to === "/seller/dashboard" ? "white" : "#6B5E52",
                }}>
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Total Products", value: String(stats.products), icon: Package, color: "#C9A84C", bg: "rgba(201,168,76,0.1)" },
              { label: "Live Products", value: String(stats.liveProducts), icon: CheckCircle2, color: "#2D7A3A", bg: "rgba(45,122,58,0.1)" },
              { label: "Out of Stock", value: String(stats.oosProducts), icon: BarChart3, color: "#9B7520", bg: "rgba(201,168,76,0.12)" },
              { label: "Open Slots", value: String(stats.slots), icon: CalendarDays, color: "#1B2A6B", bg: "rgba(27,42,107,0.1)" },
              { label: "Bookings", value: String(stats.bookings), icon: Video, color: "#C0392B", bg: "rgba(192,57,43,0.1)" },
              { label: "Store Rating", value: `${Number(stats.rating).toFixed(1)} ★`, icon: Star, color: "#A2466B", bg: "rgba(162,70,107,0.1)" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-2xl p-4 border"
                  style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: s.bg }}>
                    <Icon size={17} style={{ color: s.color }} />
                  </div>
                  <p className="text-xl font-bold" style={{ color: "#1a1a1a" }}>{s.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#9B8B7A" }}>{s.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Recent orders ────────────────────────────────────── */}
            <div className="lg:col-span-2 rounded-2xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-base" style={{ color: "#1a1a1a" }}>Recent Orders</h2>
                {recentOrders.filter(o => ["pending", "processing", "confirmed"].includes(o.status)).length > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: "rgba(139,58,58,0.08)", color: "#8B3A3A" }}>
                    {recentOrders.filter(o => ["pending", "processing", "confirmed"].includes(o.status)).length} pending
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "#9B8B7A" }}>No orders yet.</p>
                ) : recentOrders.map((order) => {
                  const s = STATUS_STYLE[order.status] || STATUS_STYLE.processing;
                  const first = (order.items && order.items[0]) || {};
                  const productName = first.product_name || (order.items?.length ? `${order.items.length} items` : "Order");
                  return (
                    <div key={order.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition"
                      style={{ backgroundColor: "#FAF9F6" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>{productName}</p>
                        <p className="text-xs truncate" style={{ color: "#9B8B7A" }}>
                          {order.customer_name || "Customer"} · {(order.created_at || "").slice(0, 10)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>₹{(order.total || 0).toLocaleString("en-IN")}</p>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                          style={{ backgroundColor: s.bg, color: s.text }}>
                          {s.label || order.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Quick actions ────────────────────────────────────── */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
              <h2 className="font-semibold text-base mb-4" style={{ color: "#1a1a1a" }}>Quick Actions</h2>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const to = action.label === "View My Store" ? `/shops/${storeId}` : action.to;
                  return (
                    <Link key={action.label} to={to}
                      className="flex items-center gap-3 p-3 rounded-xl transition hover:opacity-90"
                      style={{ backgroundColor: "#FAF9F6" }}
                    >
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${action.color}18` }}>
                        <Icon size={15} style={{ color: action.color }} />
                      </span>
                      <span className="text-sm font-medium flex-1" style={{ color: "#1a1a1a" }}>
                        {action.label}
                      </span>
                      <ArrowRight size={14} style={{ color: "#9B8B7A" }} />
                    </Link>
                  );
                })}
              </div>

              {/* Upgrade nudge */}
              <div className="mt-5 rounded-xl p-4"
                style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(162,70,107,0.1))", border: "1px solid rgba(201,168,76,0.25)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#C9A84C" }}>
                  Go Premium
                </p>
                <p className="text-xs mb-3" style={{ color: "#6B5E52" }}>
                  Get unlimited live sessions, priority placement, and analytics.
                </p>
                <button className="w-full py-2 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #A2466B)" }}
                  onClick={() => toast("Premium plans coming soon!")}>
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>

          {/* ── Store connection notice ─────────────────────────────────── */}
          <div className="mt-6 rounded-xl p-4 text-sm flex items-start gap-3"
            style={{ backgroundColor: "#F0F7F1", border: "1px solid #BEE3C6" }}>
            <span>🟢</span>
            <p style={{ color: "#2D5A36" }}>
              <strong>Live store:</strong> You are managing <strong>{storeName}</strong>. Products, slots,
              bookings and store status you change here update the public storefront, marketplace and
              live shopping in real time.
            </p>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
