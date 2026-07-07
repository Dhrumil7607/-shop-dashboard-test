import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, Check, RefreshCw, Plus, X, ImageIcon, Ban, Trash2, RotateCcw, Star, Search, AlertTriangle, ShieldCheck, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/layouts/AdminLayout";
import { api, adminAddSeller, adminSuspendSeller, adminUnsuspendSeller, adminArchiveSeller, adminRestoreSeller } from "@/lib/api";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

const STATUS_TABS = ["all", "active", "pending", "suspended", "archived", "rejected"];
const STATUS_BADGE = {
  active:     { bg: "#D1FAE5", text: "#065F46", label: "Active" },
  approved:   { bg: "#D1FAE5", text: "#065F46", label: "Approved" },
  offline:    { bg: "#F3F4F6", text: "#374151", label: "Offline" },
  pending:    { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  pending_review: { bg: "#FEF3C7", text: "#92400E", label: "Pending Review" },
  suspended:  { bg: "#FEE2E2", text: "#991B1B", label: "Suspended" },
  archived:   { bg: "#F3F4F6", text: "#6B7280", label: "Archived" },
  rejected:   { bg: "#FEE2E2", text: "#991B1B", label: "Rejected" },
  head_store: { bg: "rgba(201,168,76,0.2)", text: "#7A5800", label: "★ Head Store" },
};

function ConfirmModal({ title, message, danger, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle size={22} style={{ color: danger ? "#C0392B" : "#C9A84C" }} />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: "#6B5E52" }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "#E8E4DF" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition"
            style={{ backgroundColor: danger ? "#C0392B" : "#1a1a1a", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Processing…" : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminSellers() {
  const [sellers, setSellers] = useState(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCreds, setNewCreds] = useState(null);
  const [editImageFor, setEditImageFor] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null); // { type, shopId, name }
  const [actionLoading, setActionLoading] = useState(false);
  const location = useLocation();
  const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";

  const load = useCallback(() => {
    setSellers(null); setError("");
    api.get("/admin/sellers", { headers: { "X-Admin-Key": adminKey } })
      .then(res => setSellers(Array.isArray(res?.data) ? res.data : []))
      .catch(err => {
        setError(err.response?.data?.detail || err.message || "Could not load sellers");
        setSellers([]);
      });
  }, [adminKey]);

  useEffect(() => { load(); }, [location.pathname, load]);

  const doAction = async (fn, successMsg, errorMsg) => {
    setActionLoading(true);
    try {
      await fn();
      toast.success(successMsg);
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || errorMsg);
    } finally { setActionLoading(false); }
  };

  const filtered = (sellers || []).filter(item => {
    const shop = item.shop || {};
    const app = item.application || {};
    const seller = item.seller || {};
    const shopStatus = shop.shop_status || shop.status || (app.status === "pending_review" ? "pending" : app.status) || "pending";
    const isHeadStore = shop.is_admin_store === true || shopStatus === "head_store";

    if (activeTab !== "all") {
      if (isHeadStore) return activeTab === "active"; // head store shows under "active" tab
      if (activeTab === "active" && !["active","offline","approved","head_store"].includes(shopStatus)) return false;
      if (activeTab === "pending" && !["pending","pending_review"].includes(shopStatus)) return false;
      if (activeTab === "suspended" && shopStatus !== "suspended") return false;
      if (activeTab === "archived" && shopStatus !== "archived") return false;
      if (activeTab === "rejected" && shopStatus !== "rejected") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (shop.name || app.applicant_name || seller.name || "").toLowerCase();
      const email = (seller.email || app.applicant_email || shop.owner_email || "").toLowerCase();
      const phone = (seller.phone || "").toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
    }
    return true;
  // Always pin head store to the top
  }).sort((a, b) => {
    const aHead = a.shop?.is_admin_store === true;
    const bHead = b.shop?.is_admin_store === true;
    if (aHead && !bHead) return -1;
    if (!aHead && bHead) return 1;
    return 0;
  });

  const tabCounts = {};
  (sellers || []).forEach(item => {
    const shop = item.shop || {};
    const app = item.application || {};
    const s = shop.shop_status || shop.status || (app.status === "pending_review" ? "pending" : app.status) || "pending";
    const key = ["active","offline","approved"].includes(s) ? "active" : s;
    tabCounts[key] = (tabCounts[key] || 0) + 1;
    tabCounts.all = (tabCounts.all || 0) + 1;
  });

  const toggleOnline = (shopId, current) => doAction(
    () => api.patch(`/admin/shops/${shopId}`, { online: !current, is_active: true, status: !current ? "active" : "offline" }, { headers: { "X-Admin-Key": adminKey } }),
    !current ? "Seller is now online" : "Seller is now offline", "Failed to update"
  );
  const toggleLiveVideo = (shopId, disabled) => doAction(
    () => api.patch(`/admin/shops/${shopId}`, { admin_live_disabled: !disabled }, { headers: { "X-Admin-Key": adminKey } }),
    !disabled ? "Seller live video disabled" : "Seller live video re-enabled", "Failed to update"
  );
  const togglePremium = (shopId, current) => doAction(
    () => api.patch(`/admin/shops/${shopId}/order`, { is_premium: !current }, { headers: { "X-Admin-Key": adminKey } }),
    !current ? "Marked as premium store" : "Removed premium status", "Failed to update"
  );
  const toggleApprovePublic = (shopId, current) => doAction(
    () => api.patch(`/admin/shops/${shopId}/order`, { admin_approved_public: !current }, { headers: { "X-Admin-Key": adminKey } }),
    !current ? "✅ Store approved for public — bypasses profile gate" : "Approval removed", "Failed to update"
  );
  const toggleBookingPage = (shopId, current) => doAction(
    () => api.patch(`/admin/shops/${shopId}/order`, { show_in_booking_page: !current }, { headers: { "X-Admin-Key": adminKey } }),
    !current ? "Added to Live Booking page" : "Removed from Live Booking page", "Failed to update"
  );
  const approveSeller = (appId) => doAction(
    () => api.post(`/admin/seller-applications/${appId}/approve`, {}, { headers: { "X-Admin-Key": adminKey } }),
    "Seller approved!", "Failed to approve"
  );

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Sellers</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: "#1a1a1a" }}>
              <Plus size={14} /> Add Seller
            </button>
            <button onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "#E8E4DF" }} />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition"
              style={{ backgroundColor: activeTab === tab ? "#1a1a1a" : "#F0EBE3", color: activeTab === tab ? "white" : "#6B5E52" }}>
              {tab} {tabCounts[tab] ? `(${tabCounts[tab]})` : ""}
            </button>
          ))}
        </div>

        {newCreds && (
          <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: "#F0FFF4", border: "1px solid #BBF7D0" }}>
            <p className="text-sm font-semibold text-green-800">Seller created:</p>
            <p className="text-sm font-mono mt-1">Login: {newCreds.email} · Password: {newCreds.temp_password}</p>
            <button onClick={() => setNewCreds(null)} className="text-xs underline mt-1 text-green-700">Dismiss</button>
          </div>
        )}

        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>}

        {sellers === null ? (
          <div className="text-center py-16"><p style={{ color: "#9B8B7A" }}>Loading sellers…</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
            <p className="text-lg font-semibold mb-2" style={{ color: "#1a1a1a" }}>No sellers found</p>
            <p style={{ color: "#9B8B7A" }}>Try adjusting the filter or search.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((item, idx) => {
                const shop = item.shop || {};
                const seller = item.seller || {};
                const application = item.application || {};
                const stats = item.stats || {};
                const creds = item.credentials || application.seller_credentials || null;
                const name = shop.name || application.applicant_name || seller.name || "Unknown";
                const email = seller.email || application.applicant_email || shop.owner_email || "";
                const city = shop.city || (application.store_information?.city) || "";
                const isOnline = shop.online !== false && !!shop.id;
                const hasShop = !!shop.id;
                const shopStatus = shop.shop_status || shop.status || "pending";
                const isHeadStore = shop.is_admin_store === true || shopStatus === "head_store";
                const isPending = !isHeadStore && (["pending_review","pending"].includes(shopStatus) || ["pending_review","pending"].includes(application.status || ""));
                const isSuspended = !isHeadStore && (shopStatus === "suspended" || shop.isSuspended);
                const isArchived = !isHeadStore && (shopStatus === "archived" || shop.is_archived);
                const isRejected = !isHeadStore && (shopStatus === "rejected" || application.status === "rejected");
                const liveAdminDisabled = shop.admin_live_disabled === true;
                const isPremium = shop.is_premium === true;
                const isApprovedPublic = shop.admin_approved_public === true;
                const isInBookingPage = shop.show_in_booking_page === true;
                const displayBadge = isHeadStore ? STATUS_BADGE.head_store : isSuspended ? STATUS_BADGE.suspended : isArchived ? STATUS_BADGE.archived : isRejected ? STATUS_BADGE.rejected : isPending ? STATUS_BADGE.pending : STATUS_BADGE.active;

                return (
                  <motion.div key={shop.id || application.id || idx}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="rounded-xl border p-4"
                    style={{
                      backgroundColor: isHeadStore ? "rgba(201,168,76,0.04)" : isSuspended ? "#FFF5F5" : isArchived ? "#F9FAFB" : "white",
                      borderColor: isHeadStore ? "#C9A84C" : isSuspended ? "#FCA5A5" : "#E8E4DF",
                      boxShadow: isHeadStore ? "0 0 0 1px rgba(201,168,76,0.3), 0 2px 8px rgba(201,168,76,0.1)" : "none",
                    }}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Avatar */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="w-11 h-11 rounded-xl overflow-hidden" style={{ backgroundColor: "#F0EBE3" }}>
                          {shop.image_url
                            ? <img src={shop.image_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: "#9B8B7A" }}>{(name || "?").slice(0,2).toUpperCase()}</div>
                          }
                        </div>
                        {hasShop && (
                          <button onClick={() => setEditImageFor({ shopId: shop.id, logo: shop.image_url || "", banner: shop.banner_image || "" })}
                            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border"
                            style={{ borderColor: "#E8E4DF", color: "#9B8B7A" }}>
                            <ImageIcon size={10} /> img
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>{name}</p>
                          {isPremium && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(201,168,76,0.15)", color: "#9B6B00" }}>⭐ Premium</span>}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: displayBadge.bg, color: displayBadge.text }}>{displayBadge.label}</span>
                          {hasShop && !isSuspended && !isArchived && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: isOnline ? "rgba(45,122,58,0.1)" : "rgba(139,58,58,0.08)", color: isOnline ? "#2D7A3A" : "#8B3A3A" }}>
                              {isOnline ? "● Online" : "○ Offline"}
                            </span>
                          )}
                          {liveAdminDisabled && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(139,58,58,0.08)", color: "#8B3A3A" }}>Live: Off</span>}
                        </div>
                        <p className="text-xs" style={{ color: "#9B8B7A" }}>{email}{city ? ` · ${city}` : ""}</p>
                        {isSuspended && <p className="text-xs font-semibold mt-1" style={{ color: "#C0392B" }}>⚠ Suspended — hidden from public</p>}
                        {isArchived && <p className="text-xs font-semibold mt-1" style={{ color: "#6B7280" }}>🗃 Archived — removed from public</p>}
                        {/* Profile completion status */}
                        {hasShop && !isHeadStore && !isSuspended && !isArchived && (() => {
                          const missing = [];
                          if (!shop.name) missing.push("name");
                          if (!shop.description || shop.description.length < 10) missing.push("description");
                          if (!shop.image_url) missing.push("logo");
                          if (!shop.banner_image) missing.push("banner");
                          if (!shop.city) missing.push("city");
                          if (!shop.specialty) missing.push("category");
                          if (!shop.return_policy) missing.push("return policy");
                          if (!shop.shipping_policy) missing.push("shipping policy");
                          if (!shop.phone) missing.push("phone");
                          if (missing.length > 0) {
                            return (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                <span className="text-[10px] font-semibold" style={{ color: "#9B7520" }}>⚠ Profile incomplete:</span>
                                {missing.map(f => (
                                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(201,168,76,0.12)", color: "#9B7520" }}>{f}</span>
                                ))}
                              </div>
                            );
                          }
                          return <p className="text-[10px] mt-1 font-semibold" style={{ color: "#2D7A3A" }}>✓ Profile complete</p>;
                        })()}
                        {isApprovedPublic && !isHeadStore && (
                          <p className="text-[10px] mt-1 font-semibold" style={{ color: "#1B2A6B" }}>🛡 Admin approved — bypasses profile gate</p>
                        )}
                        {creds && (
                          <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: "#F0FFF4", border: "1px solid #BBF7D0" }}>
                            <span className="font-semibold text-green-700">Login: </span><span className="font-mono">{creds.email}</span>
                            <span className="mx-2 text-green-400">|</span>
                            <span className="font-semibold text-green-700">Password: </span><span className="font-mono">{creds.temp_password}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-center flex-shrink-0">
                        {[["Products",stats.products||0],["Orders",stats.orders||0],[`₹${((stats.revenue||0)/1000).toFixed(0)}k`,"Revenue"]].map(([val,lbl])=>(
                          <div key={lbl}><p className="text-xs font-bold" style={{ color: "#1a1a1a" }}>{val}</p><p className="text-[9px]" style={{ color: "#9B8B7A" }}>{lbl}</p></div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                        {isPending && application.id && !hasShop && (
                          <button onClick={() => approveSeller(application.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "#2D7A3A", color: "#fff" }}>
                            <Check size={11} className="inline mr-1" />Approve
                          </button>
                        )}
                        {hasShop && !isSuspended && !isArchived && (
                          <button onClick={() => toggleOnline(shop.id, isOnline)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ backgroundColor: isOnline ? "rgba(139,58,58,0.08)" : "rgba(45,122,58,0.1)", color: isOnline ? "#8B3A3A" : "#2D7A3A" }}>
                            {isOnline ? <><EyeOff size={11} className="inline mr-1" />Offline</> : <><Eye size={11} className="inline mr-1" />Online</>}
                          </button>
                        )}
                        {hasShop && !isSuspended && !isArchived && (
                          <button onClick={() => togglePremium(shop.id, isPremium)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ backgroundColor: isPremium ? "rgba(201,168,76,0.15)" : "#F0EBE3", color: isPremium ? "#9B6B00" : "#6B5E52" }}
                            title={isPremium ? "Remove premium" : "Set as premium store"}>
                            <Star size={11} className="inline mr-1" />{isPremium ? "Premium" : "Set Premium"}
                          </button>
                        )}
                        {/* Admin Approve Public — bypasses profile/product gate */}
                        {hasShop && !isHeadStore && !isSuspended && !isArchived && (
                          <button onClick={() => toggleApprovePublic(shop.id, isApprovedPublic)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ backgroundColor: isApprovedPublic ? "rgba(27,42,107,0.12)" : "#F0EBE3", color: isApprovedPublic ? "#1B2A6B" : "#6B5E52" }}
                            title={isApprovedPublic ? "Remove public approval bypass" : "Approve for public (bypasses profile gate)"}>
                            <ShieldCheck size={11} className="inline mr-1" />{isApprovedPublic ? "Approved ✓" : "Approve Public"}
                          </button>
                        )}
                        {/* Show in Booking Page */}
                        {hasShop && !isHeadStore && !isSuspended && !isArchived && (
                          <button onClick={() => toggleBookingPage(shop.id, isInBookingPage)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ backgroundColor: isInBookingPage ? "rgba(45,122,58,0.12)" : "#F0EBE3", color: isInBookingPage ? "#2D7A3A" : "#6B5E52" }}
                            title={isInBookingPage ? "Remove from booking page" : "Add to Live Booking page"}>
                            <Calendar size={11} className="inline mr-1" />{isInBookingPage ? "In Booking ✓" : "Add to Booking"}
                          </button>
                        )}
                        {hasShop && !isArchived && (
                          isSuspended
                            ? <button onClick={() => setConfirm({ type: "unsuspend", shopId: shop.id, name })}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: "rgba(45,122,58,0.1)", color: "#2D7A3A" }}>
                                <RotateCcw size={11} className="inline mr-1" />Unsuspend
                              </button>
                            : !isHeadStore && <button onClick={() => setConfirm({ type: "suspend", shopId: shop.id, name })}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: "rgba(201,168,76,0.12)", color: "#9B7520" }}>
                                <Ban size={11} className="inline mr-1" />Suspend
                              </button>
                        )}
                        {hasShop && (
                          isArchived
                            ? <button onClick={() => setConfirm({ type: "restore", shopId: shop.id, name })}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: "rgba(45,122,58,0.1)", color: "#2D7A3A" }}>
                                <RotateCcw size={11} className="inline mr-1" />Restore
                              </button>
                            : !isHeadStore && <button onClick={() => setConfirm({ type: "archive", shopId: shop.id, name })}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: "rgba(139,58,58,0.08)", color: "#8B3A3A" }}>
                                <Trash2 size={11} className="inline mr-1" />Archive
                              </button>
                        )}
                        {hasShop && !isArchived && (
                          <Link to={`/admin/sellers/${shop.id}`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}>Manage →</Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.type === "suspend" ? "Suspend Seller" : confirm.type === "archive" ? "Archive Seller" : confirm.type === "unsuspend" ? "Unsuspend Seller" : "Restore Seller"}
          message={
            confirm.type === "suspend" ? `Suspend "${confirm.name}"? They will be hidden from the public storefront and cannot go online.`
            : confirm.type === "archive" ? `Archive "${confirm.name}"? This will soft-delete the account and hide all products. Historical orders are preserved.`
            : confirm.type === "unsuspend" ? `Unsuspend "${confirm.name}"? They can come back online according to normal visibility rules.`
            : `Restore "${confirm.name}"? Their account and products will be reactivated.`
          }
          danger={confirm.type === "suspend" || confirm.type === "archive"}
          loading={actionLoading}
          onClose={() => !actionLoading && setConfirm(null)}
          onConfirm={() => {
            if (confirm.type === "suspend") doAction(() => adminSuspendSeller(confirm.shopId, "Suspended by admin", adminKey), "Seller suspended", "Failed to suspend");
            else if (confirm.type === "archive") doAction(() => adminArchiveSeller(confirm.shopId, adminKey), "Seller archived", "Failed to archive");
            else if (confirm.type === "unsuspend") doAction(() => adminUnsuspendSeller(confirm.shopId, adminKey), "Seller unsuspended", "Failed to unsuspend");
            else doAction(() => adminRestoreSeller(confirm.shopId, adminKey), "Seller restored", "Failed to restore");
          }}
        />
      )}

      {showAdd && <AddSellerModal onClose={() => setShowAdd(false)} onAdd={async (form) => {
        try {
          const res = await adminAddSeller(form, adminKey);
          setNewCreds(res?.credentials || null);
          toast.success("Seller account created"); setShowAdd(false); load();
        } catch (err) { toast.error(err?.response?.data?.detail || "Could not add seller"); }
      }} />}

      {editImageFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">Edit Store Images</h3>
              <button onClick={() => setEditImageFor(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            {/* Logo / Avatar */}
            <div className="mb-5">
              <ImageUpload
                label="Logo / Avatar (shown on store card)"
                value={editImageFor.logo}
                onUpload={url => setEditImageFor(prev => ({ ...prev, logo: url }))}
              />
            </div>

            {/* Banner */}
            <div className="mb-5">
              <ImageUpload
                label="Banner Image (shown as card background)"
                value={editImageFor.banner}
                onUpload={url => setEditImageFor(prev => ({ ...prev, banner: url }))}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditImageFor(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "#E8E4DF" }}>Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await api.patch(`/admin/shops/${editImageFor.shopId}`,
                      { image_url: editImageFor.logo, banner_image: editImageFor.banner },
                      { headers: { "X-Admin-Key": adminKey } }
                    );
                    toast.success("Images updated");
                    setEditImageFor(null);
                    load();
                  } catch { toast.error("Could not update images"); }
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#1a1a1a" }}>
                Save Images
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function AddSellerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ owner_name: "", email: "", phone: "", store_name: "", city: "", specialty: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <form onSubmit={e => { e.preventDefault(); if (!form.email || !form.store_name) { return; } onAdd(form); }}
        className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Seller Manually</h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          {[["store_name","Store name *"],["owner_name","Owner name"],["email","Login email *"],["phone","Phone"],["city","City"],["specialty","Specialty"]].map(([k,p])=>(
            <input key={k} placeholder={p} value={form[k]} onChange={e => set(k, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: "#E8E4DF" }} />
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "#E8E4DF" }}>Cancel</button>
          <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#1a1a1a" }}>Create Seller</button>
        </div>
      </form>
    </div>
  );
}
