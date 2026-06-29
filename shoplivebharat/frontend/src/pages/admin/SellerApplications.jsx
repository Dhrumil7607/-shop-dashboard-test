import { useEffect, useState, useCallback } from "react";
import { Eye, Check, X, Pause, Loader, RefreshCw } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    fetchAdminSellerApplications,
    approveSellerApplication,
    rejectSellerApplication,
    suspendSellerApplication,
} from "@/lib/sellerApplicationsApi";
import { MOCK_SHOPS } from "@/lib/testData";

// ── convert testData shops into mock applications ──────────────────────────
const MOCK_APPS = MOCK_SHOPS.map((shop, i) => ({
    id: shop.id,
    applicant_name: shop.owner_name,
    applicant_email: shop.owner_email || `${shop.slug}@shop.in`,
    phone: `+91 98765 1000${i + 1}`,
    store_information: { store_name: shop.name, city: shop.city, specialty: shop.specialty },
    business_details:  { city: shop.city, state: shop.country === "India" ? "Uttar Pradesh" : "Gujarat" },
    product_categories: { primary_category: shop.specialty },
    status: i < 4 ? "approved" : "pending_review",
    productCount: [3, 8, 5, 2, 9][i] || 4,
    submitted_at: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
    history: [],
    admin_notes: [],
}));

const FILTER_TABS = [
    { key: "all",            label: "All" },
    { key: "pending_review", label: "Pending" },
    { key: "approved",       label: "Approved" },
    { key: "rejected",       label: "Rejected" },
];

const STATUS_BADGE = {
    pending_review: { cls: "bg-amber-100 text-amber-700 border border-amber-200",  label: "pending"  },
    approved:       { cls: "bg-green-100 text-green-700 border border-green-200",   label: "approved" },
    rejected:       { cls: "bg-red-100 text-red-700 border border-red-200",         label: "rejected" },
    needs_changes:  { cls: "bg-blue-100 text-blue-700 border border-blue-200",      label: "changes"  },
    suspended:      { cls: "bg-gray-100 text-gray-600 border border-gray-200",      label: "suspended"},
};

// Initials avatar
function Avatar({ name, img }) {
    const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    if (img) return <img src={img} alt={name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />;
    return (
        <div className="w-11 h-11 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
        </div>
    );
}

// Confirm reason dialog (Reject / Suspend)
function ReasonDialog({ title, onConfirm, onCancel, loading }) {
    const [text, setText] = useState("");
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <h3 className="font-bold text-[#1a1a1a] text-base mb-4">{title}</h3>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
                    placeholder="Enter reason (min 10 characters)…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1a1a1a] resize-none" />
                <p className="text-xs text-gray-400 mt-1">{text.length}/min 10 chars</p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button onClick={() => onConfirm(text)} disabled={text.trim().length < 10 || loading}
                        className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-gray-800 transition">
                        {loading && <Loader size={13} className="animate-spin" />}
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminSellerApplications() {
    const { adminKey } = useAuth();
    const [filter,      setFilter]      = useState("all");
    const [apps,        setApps]        = useState(MOCK_APPS);
    const [loading,     setLoading]     = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // id of item being acted on
    const [dialog,      setDialog]      = useState(null); // { type, id }

    // Try real API; fall back to mock data
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAdminSellerApplications(adminKey, {});
            if (Array.isArray(data) && data.length) setApps(data);
            else setApps(MOCK_APPS);
        } catch {
            setApps(MOCK_APPS);
        } finally {
            setLoading(false);
        }
    }, [adminKey]);

    useEffect(() => { load(); }, [load]);

    const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

    // ── inline optimistic status update ──
    const updateStatus = (id, status) =>
        setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));

    const handleApprove = async (id) => {
        setActionLoading(id + "_approve");
        try {
            await approveSellerApplication(id, adminKey);
            updateStatus(id, "approved");
            toast.success("Seller approved");
        } catch {
            toast.error("Failed to approve");
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmDialog = async (reason) => {
        if (!dialog) return;
        setActionLoading(dialog.id + "_" + dialog.type);
        try {
            if (dialog.type === "reject")  await rejectSellerApplication(dialog.id, reason, adminKey);
            if (dialog.type === "suspend") await suspendSellerApplication(dialog.id, reason, adminKey);
            updateStatus(dialog.id, dialog.type === "reject" ? "rejected" : "suspended");
            toast.success("Done");
        } catch {
            toast.error("Action failed");
        } finally {
            setActionLoading(null);
            setDialog(null);
        }
    };

    return (
        <AdminLayout>
            {/* Filter pills */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
                {FILTER_TABS.map(tab => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                            filter === tab.key
                                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}>
                        {tab.label}
                    </button>
                ))}
                <button onClick={load} title="Refresh"
                    className="ml-auto p-2 text-gray-400 hover:text-[#1a1a1a] transition">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Seller rows */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader size={26} className="animate-spin text-gray-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">No sellers in this category.</div>
                ) : filtered.map(app => {
                    const badge = STATUS_BADGE[app.status] || STATUS_BADGE.pending_review;
                    const isPending  = app.status === "pending_review";
                    const isApproved = app.status === "approved";
                    const storeName  = app.store_information?.store_name || app.applicant_name || "—";
                    const city       = app.store_information?.city || app.business_details?.city || "—";
                    const state      = app.business_details?.state || "";
                    const date       = new Date(app.submitted_at).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" });
                    const actionId   = actionLoading?.startsWith(app.id);

                    return (
                        <div key={app.id}
                            className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-gray-300 transition">

                            {/* Avatar */}
                            <Avatar name={app.applicant_name} />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#1a1a1a] text-sm truncate">{storeName}</p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {app.applicant_name} · {app.applicant_email} · {app.phone || "—"}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {city}{state ? `, ${state}` : ""} · {app.productCount || 0} products · {date}
                                </p>
                            </div>

                            {/* Status badge */}
                            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold ${badge.cls}`}>
                                {badge.label}
                            </span>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Review — always visible */}
                                <button
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                                    onClick={() => toast.info(`Viewing ${storeName}`)}>
                                    <Eye size={13} /> Review
                                </button>

                                {/* Pending: Approve + Reject */}
                                {isPending && (
                                    <>
                                        <button
                                            disabled={!!actionId}
                                            onClick={() => handleApprove(app.id)}
                                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition disabled:opacity-50">
                                            {actionLoading === app.id + "_approve"
                                                ? <Loader size={12} className="animate-spin" />
                                                : <Check size={13} />}
                                            Approve
                                        </button>
                                        <button
                                            disabled={!!actionId}
                                            onClick={() => setDialog({ type: "reject", id: app.id })}
                                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition disabled:opacity-50">
                                            <X size={13} /> Reject
                                        </button>
                                    </>
                                )}

                                {/* Approved: Suspend */}
                                {isApproved && (
                                    <button
                                        disabled={!!actionId}
                                        onClick={() => setDialog({ type: "suspend", id: app.id })}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                                        {actionLoading === app.id + "_suspend"
                                            ? <Loader size={12} className="animate-spin" />
                                            : <Pause size={13} />}
                                        Suspend
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reason dialog */}
            {dialog && (
                <ReasonDialog
                    title={dialog.type === "reject" ? "Reject Seller" : "Suspend Seller"}
                    onConfirm={handleConfirmDialog}
                    onCancel={() => setDialog(null)}
                    loading={!!actionLoading}
                />
            )}
        </AdminLayout>
    );
}
