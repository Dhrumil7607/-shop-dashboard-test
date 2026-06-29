import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, Loader, RefreshCw } from "lucide-react";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { fetchSellerApplication } from "@/lib/sellerApplicationsApi";

const STATUS_CONFIG = {
    pending_review: {
        icon: Clock,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        badge: "bg-amber-100 text-amber-700",
        label: "Under Review",
        title: "Your application is under review",
        message: "We've received your application and our team is reviewing it. We typically respond within 2–3 business days. You'll receive a notification once a decision is made.",
    },
    needs_changes: {
        icon: AlertCircle,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        badge: "bg-blue-100 text-blue-700",
        label: "Changes Requested",
        title: "Some changes are needed",
        message: "Our team has reviewed your application and is requesting some modifications. Please review the notes below and resubmit.",
    },
    approved: {
        icon: CheckCircle,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        badge: "bg-green-100 text-green-700",
        label: "Approved",
        title: "Congratulations! You're approved 🎉",
        message: "Your seller application has been approved. Your store is now live and visible to customers on ShopLiveBharat.",
    },
    rejected: {
        icon: XCircle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        badge: "bg-red-100 text-red-700",
        label: "Rejected",
        title: "Application not approved",
        message: "Unfortunately your application was not approved at this time. Please review the reason below. You're welcome to apply again with updated information.",
    },
    suspended: {
        icon: XCircle,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-500",
        badge: "bg-gray-100 text-gray-600",
        label: "Suspended",
        title: "Account suspended",
        message: "Your seller account has been suspended. Please contact our support team for more information.",
    },
};

export default function ApplicationStatus() {
    const { applicationId } = useParams();
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = (silent = false) => {
        if (!applicationId) return;
        if (!silent) setLoading(true);
        else setRefreshing(true);
        fetchSellerApplication(applicationId)
            .then(setApp)
            .catch(() => setError("Application not found."))
            .finally(() => { setLoading(false); setRefreshing(false); });
    };

    useEffect(() => { load(); }, [applicationId]); // eslint-disable-line

    if (loading) {
        return (
            <MarketplaceLayout>
                <div className="flex items-center justify-center min-h-[70vh]">
                    <Loader size={28} className="animate-spin text-maroon" />
                </div>
            </MarketplaceLayout>
        );
    }

    if (error || !app) {
        return (
            <MarketplaceLayout>
                <section className="bg-[#0a0a0a] py-16 px-6"><div className="max-w-7xl mx-auto">
                    <h1 className="font-serif text-4xl text-white">Application Not Found</h1>
                </div></section>
                <div className="max-w-xl mx-auto px-6 py-20 text-center">
                    <p className="text-gray-500 mb-8">We couldn't find this application. It may have been removed or the ID is incorrect.</p>
                    <Link to="/become-a-seller"
                        className="inline-flex items-center gap-2 px-7 py-3 bg-[#0a0a0a] text-white rounded-lg hover:bg-maroon transition font-semibold text-sm">
                        Start New Application <ArrowRight size={16} />
                    </Link>
                </div>
            </MarketplaceLayout>
        );
    }

    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending_review;
    const Icon = cfg.icon;

    return (
        <MarketplaceLayout>
            {/* Dark hero */}
            <section className="bg-[#0a0a0a] py-16 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-maroon mb-3">SELLER APPLICATION</p>
                    <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">Application Status</h1>
                    <p className="text-white/50 text-sm">Track the progress of your seller registration</p>
                </div>
            </section>

            {/* Content */}
            <section className="bg-gray-50 py-12 px-4 min-h-[60vh]">
                <div className="max-w-2xl mx-auto space-y-5">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

                        {/* Status card */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={22} className={cfg.iconColor} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h2 className="text-lg font-bold text-[#0a0a0a]">{cfg.title}</h2>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">{cfg.message}</p>
                                </div>
                                <button onClick={() => load(true)} title="Refresh" className="p-2 text-gray-400 hover:text-[#0a0a0a] transition flex-shrink-0">
                                    <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Application Details</h3>
                            <dl className="space-y-3">
                                {[
                                    ["Application ID", <span className="font-mono text-xs">{app.id}</span>],
                                    ["Submitted",      new Date(app.submitted_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })],
                                    ["Business Name",  app.business_details?.legal_name],
                                    ["Store Name",     app.store_information?.store_name],
                                    ["Email",          app.applicant_email],
                                ].filter(([, v]) => v).map(([k, v]) => (
                                    <div key={k} className="flex items-start justify-between gap-4">
                                        <dt className="text-sm text-gray-400 flex-shrink-0">{k}</dt>
                                        <dd className="text-sm text-[#0a0a0a] font-medium text-right">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>

                        {/* Needs changes note */}
                        {app.status === "needs_changes" && app.changes_requested && (
                            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">Changes Requested</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{app.changes_requested}</p>
                            </div>
                        )}

                        {/* Rejection reason */}
                        {app.status === "rejected" && app.rejection_reason && (
                            <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Rejection Reason</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{app.rejection_reason}</p>
                            </div>
                        )}

                        {/* Admin notes visible to applicant */}
                        {(app.admin_notes || []).filter(n => n.is_visible_to_applicant).length > 0 && (
                            <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Note from our team</p>
                                {app.admin_notes.filter(n => n.is_visible_to_applicant).map(n => (
                                    <p key={n.id} className="text-sm text-gray-700 leading-relaxed">{n.body}</p>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            {app.status === "approved" && (
                                <Link to="/account"
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0a0a0a] text-white rounded-xl hover:bg-maroon transition font-semibold text-sm">
                                    Go to Seller Dashboard <ArrowRight size={15} />
                                </Link>
                            )}
                            {(app.status === "needs_changes" || app.status === "rejected") && (
                                <Link to="/become-a-seller"
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0a0a0a] text-white rounded-xl hover:bg-maroon transition font-semibold text-sm">
                                    {app.status === "needs_changes" ? "Edit & Resubmit" : "Start New Application"}
                                    <ArrowRight size={15} />
                                </Link>
                            )}
                            <Link to="/"
                                className="flex-1 flex items-center justify-center px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium text-sm">
                                Back to Home
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </MarketplaceLayout>
    );
}
