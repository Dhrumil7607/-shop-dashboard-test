/**
 * Admin Seller Detail — full seller/shop management page.
 * Shows: profile, credentials, products, orders, bookings, revenue, controls.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Package, ShoppingBag, CalendarDays, DollarSign, Loader, Key, Video, CheckCircle2, XCircle, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api, updateShop, updateProduct } from "@/lib/api";
import { toast } from "sonner";

export default function SellerDetail() {
  const { shopId } = useParams();
  const { adminKey } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  // Live eligibility state
  const [eligibility, setEligibility] = useState(null);
  const [eligLoading, setEligLoading] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);

  const load = async () => {
    try {
      const { data: d } = await api.get(`/admin/sellers/${shopId}`, { headers: { "X-Admin-Key": adminKey } });
      setData(d);
    } catch { toast.error("Failed to load seller"); }
    finally { setLoading(false); }
  };

  const loadEligibility = async () => {
    setEligLoading(true);
    try {
      const { data: d } = await api.get(`/admin/sellers/${shopId}/live-eligibility`, { headers: { "X-Admin-Key": adminKey } });
      setEligibility(d);
    } catch { toast.error("Failed to load eligibility"); }
    finally { setEligLoading(false); }
  };

  const handleLiveOverride = async (key, value) => {
    setOverrideLoading(true);
    try {
      await api.patch(`/admin/sellers/${shopId}/live-override`, { [key]: value }, { headers: { "X-Admin-Key": adminKey } });
      toast.success(`${key} set to ${value}`);
      await loadEligibility();
      await load();
    } catch { toast.error("Override failed"); }
    finally { setOverrideLoading(false); }
  };

  useEffect(() => { load(); }, [shopId]);
  useEffect(() => { if (tab === "live") loadEligibility(); }, [tab]);

  const toggleOnline = async () => {
    const newOnline = !(data.shop?.online !== false);
    await updateShop(shopId, { online: newOnline, is_active: newOnline, status: newOnline ? "active" : "offline" }, adminKey);
    toast.success(newOnline ? "Seller online" : "Seller offline");
    load();
  };

  const toggleProductStatus = async (productId, newStatus) => {
    await updateProduct(productId, { status: newStatus, is_active: newStatus === "live" }, adminKey);
    toast.success(`Product ${newStatus}`);
    load();
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><Loader className="animate-spin" style={{ color: "#C9A84C" }} /></div></AdminLayout>;
  if (!data) return <AdminLayout><p className="text-center py-16">Seller not found</p></AdminLayout>;

  const { shop, seller, credentials, products, orders, bookings, slots, stats } = data;
  const isOnline = shop?.online !== false;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "products", label: `Products (${stats.total_products})` },
    { id: "orders", label: `Orders (${stats.total_orders})` },
    { id: "bookings", label: `Bookings (${stats.total_bookings})` },
    { id: "live", label: "Live Shopping" },
  ];

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/sellers" className="p-2 rounded-xl hover:bg-stone-100"><ChevronLeft size={20} /></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-espresso">{shop?.name || "Seller"}</h1>
            <p className="text-sm text-espresso/60">{seller?.email} · {shop?.city}</p>
          </div>
          <button onClick={toggleOnline}
            className="px-4 py-2 rounded-lg text-xs font-bold transition"
            style={{ backgroundColor: isOnline ? "rgba(45,122,58,0.1)" : "rgba(139,58,58,0.08)", color: isOnline ? "#2D7A3A" : "#8B3A3A" }}>
            {isOnline ? <><EyeOff size={13} className="inline mr-1" />Set Offline</> : <><Eye size={13} className="inline mr-1" />Set Online</>}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition"
              style={{ backgroundColor: tab === t.id ? "#1a1a1a" : "#f0ebe3", color: tab === t.id ? "#fff" : "#6B5E52" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Products", value: stats.total_products, icon: Package },
                { label: "Orders", value: stats.total_orders, icon: ShoppingBag },
                { label: "Revenue", value: `₹${(stats.total_revenue/1000).toFixed(0)}k`, icon: DollarSign },
                { label: "Bookings", value: stats.total_bookings, icon: CalendarDays },
              ].map(s => (
                <div key={s.label} className="rounded-xl border p-4" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                  <s.icon size={16} style={{ color: "#C9A84C" }} />
                  <p className="text-xl font-bold mt-2" style={{ color: "#1a1a1a" }}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#9B8B7A" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Credentials */}
            {credentials && (
              <div className="rounded-xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                <div className="flex items-center gap-2 mb-3"><Key size={16} style={{ color: "#A2466B" }} /><h3 className="font-semibold">Seller Credentials</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Email</span><p className="font-mono">{credentials.email}</p></div>
                  <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Temp Password</span><p className="font-mono">{credentials.temp_password}</p></div>
                  <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Status</span><p>{credentials.credential_status}</p></div>
                  <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Email</span><p>{credentials.email_status}</p></div>
                </div>
              </div>
            )}

            {/* Shop Profile */}
            <div className="rounded-xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
              <h3 className="font-semibold mb-3">Shop Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Name</span><p>{shop?.name}</p></div>
                <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Slug</span><p className="font-mono">/shops/{shop?.slug}</p></div>
                <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Specialty</span><p>{shop?.specialty}</p></div>
                <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>City</span><p>{shop?.city}, {shop?.country}</p></div>
                <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Online</span><p>{isOnline ? "Yes" : "No"}</p></div>
                <div><span className="text-xs uppercase" style={{ color: "#9B8B7A" }}>Live Shopping</span><p>{shop?.liveShoppingEnabled !== false ? "Enabled" : "Disabled"}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <div className="space-y-3">
            {products.length === 0 ? <p className="text-center py-8 text-espresso/50">No products</p> : products.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                {p.image_url && <img src={p.image_url} alt="" className="w-14 h-16 rounded-lg object-cover flex-shrink-0" style={{ backgroundColor: "#F0EBE3" }} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs" style={{ color: "#9B8B7A" }}>₹{p.price?.toLocaleString()} · Stock: {p.stock} · {p.status}</p>
                </div>
                <div className="flex gap-1.5">
                  {p.status !== "live" && <button onClick={() => toggleProductStatus(p.id, "live")} className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: "rgba(45,122,58,0.1)", color: "#2D7A3A" }}>Live</button>}
                  {p.status !== "hidden" && <button onClick={() => toggleProductStatus(p.id, "hidden")} className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: "rgba(155,139,122,0.1)", color: "#6B5E52" }}>Hide</button>}
                  {p.status !== "out_of_stock" && <button onClick={() => toggleProductStatus(p.id, "out_of_stock")} className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: "rgba(201,168,76,0.1)", color: "#9B7520" }}>OOS</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? <p className="text-center py-8 text-espresso/50">No orders</p> : orders.map(o => (
              <div key={o.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-bold">{o.id}</p>
                  <p className="text-xs" style={{ color: "#9B8B7A" }}>{o.customer_name} · ₹{o.total?.toLocaleString()} · {o.status}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full capitalize"
                  style={{ backgroundColor: o.status === "delivered" ? "#D1FAE5" : "#FEF3C7", color: o.status === "delivered" ? "#065F46" : "#92400E" }}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <div className="space-y-3">
            {bookings.length === 0 ? <p className="text-center py-8 text-espresso/50">No bookings</p> : bookings.map(b => (
              <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-bold">{b.id}</p>
                  <p className="text-xs" style={{ color: "#9B8B7A" }}>{b.customer_name || b.customer_email} · {b.date} {b.time} · {b.status}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(162,70,107,0.1)", color: "#A2466B" }}>
                  Managed by Seller
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Live Shopping Eligibility Tab */}
        {tab === "live" && (
          <div className="space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video size={18} style={{ color: "#C0392B" }} />
                <h3 className="font-semibold text-espresso">Live Shopping Eligibility</h3>
              </div>
              <button
                onClick={loadEligibility}
                disabled={eligLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                style={{ backgroundColor: "#F0EBE3", color: "#6B5E52" }}
              >
                <RefreshCw size={13} className={eligLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {eligLoading && !eligibility && (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin" style={{ color: "#C9A84C" }} />
              </div>
            )}

            {eligibility && (
              <>
                {/* Eligibility badge */}
                <div className={`rounded-xl p-4 flex items-center gap-3 ${eligibility.eligible ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  {eligibility.eligible
                    ? <CheckCircle2 size={22} className="text-green-600 flex-shrink-0" />
                    : <XCircle size={22} className="text-red-600 flex-shrink-0" />}
                  <div>
                    <p className={`font-semibold text-sm ${eligibility.eligible ? "text-green-800" : "text-red-800"}`}>
                      {eligibility.eligible ? "Store is visible in Live Shopping booking" : "Store is NOT showing in Live Shopping booking"}
                    </p>
                    <p className={`text-xs mt-0.5 ${eligibility.eligible ? "text-green-700" : "text-red-700"}`}>
                      {eligibility.eligible
                        ? "This store will appear in the Choose Store step."
                        : `${eligibility.checks.filter(c => !c.pass).length} check(s) failing — see details below.`}
                    </p>
                  </div>
                </div>

                {/* Checks list */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E8E4DF" }}>
                  <div className="px-4 py-3 bg-stone-50 border-b" style={{ borderColor: "#E8E4DF" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9B8B7A" }}>Eligibility Checks</p>
                  </div>
                  <div className="divide-y" style={{ divideColor: "#F0EBE3" }}>
                    {eligibility.checks.map((check) => (
                      <div key={check.key} className="flex items-start gap-3 px-4 py-3">
                        {check.pass
                          ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                          : <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${check.pass ? "text-espresso" : "text-red-700"}`}>
                            {check.label}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#9B8B7A" }}>{check.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin override controls */}
                <div className="rounded-xl border p-5" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#9B8B7A" }}>Admin Overrides</p>
                  <div className="space-y-3">
                    {[
                      {
                        key: "acceptsLiveBookings",
                        label: "Accept Bookings Without Slots",
                        desc: "Bypass the 'has available slot' requirement. Use this if the seller is ready but hasn't published slots yet.",
                        value: eligibility.overrides.acceptsLiveBookings,
                        positive: true,
                      },
                      {
                        key: "liveShoppingEnabled",
                        label: "Live Shopping Enabled",
                        desc: "Master toggle for live shopping. Should normally be set by the seller, but admin can override.",
                        value: eligibility.overrides.liveShoppingEnabled,
                        positive: true,
                      },
                      {
                        key: "online",
                        label: "Store Online",
                        desc: "Store must be online to appear in live shopping.",
                        value: eligibility.overrides.online,
                        positive: true,
                      },
                      {
                        key: "show_in_booking_page",
                        label: "Show on Booking / Home Showcase",
                        desc: "Feature this store in the homepage 'Book a Live Session' showcase. Turn off to hide it from booking promotion.",
                        value: eligibility.overrides.show_in_booking_page,
                        positive: true,
                      },
                      {
                        key: "admin_live_disabled",
                        label: "Admin Kill-Switch (disable live)",
                        desc: "Force-disables live shopping regardless of seller settings. Toggle OFF to remove the block.",
                        value: eligibility.overrides.admin_live_disabled,
                        positive: false,
                      },
                    ].map(({ key, label, desc, value, positive }) => (
                      <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-lg" style={{ backgroundColor: "#FAFAF8" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-espresso">{label}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#9B8B7A" }}>{desc}</p>
                        </div>
                        <button
                          onClick={() => handleLiveOverride(key, !value)}
                          disabled={overrideLoading}
                          className="flex-shrink-0 transition disabled:opacity-50"
                          aria-label={`Toggle ${label}`}
                          title={value ? `Click to disable ${label}` : `Click to enable ${label}`}
                        >
                          {value
                            ? <ToggleRight size={32} style={{ color: positive ? "#2D7A3A" : "#C0392B" }} />
                            : <ToggleLeft size={32} style={{ color: "#C4B9AE" }} />}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-4 p-3 rounded-lg" style={{ backgroundColor: "#FFF8E7", color: "#9B7520" }}>
                    <strong>Quick fix:</strong> If the store has live shopping enabled but no published slots, turn on <em>Accept Bookings Without Slots</em> to make it appear immediately.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
