import { useEffect, useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchMarketplaceStats, fetchShops, fetchProducts } from "@/lib/api";
import { Link } from "react-router-dom";

// Icon components matching the screenshot exactly
const icons = {
    sellers:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    pending:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    products:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    pendProd:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    orders:    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>,
    revenue:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    sales:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    active:    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
};

function StatCard({ icon, label, value }) {
    return (
        <div className="rounded-xl p-5 border flex items-start gap-4"
            style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#FAF9F6", color: "#C9A84C" }}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#9B8B7A" }}>
                    {label}
                </p>
                <p className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>{value}</p>
            </div>
        </div>
    );
}

const STATUS_BADGE = {
    approved: { bg: "#D1FAE5", color: "#065F46", label: "approved" },
    pending:  { bg: "#FEF3C7", color: "#92400E", label: "pending" },
    rejected: { bg: "#FEE2E2", color: "#991B1B", label: "rejected" },
    inactive: { bg: "#F3F4F6", color: "#374151", label: "inactive" },
};

export default function AdminDashboard() {
    const [shops,    setShops]    = useState([]);
    const [products, setProducts] = useState([]);
    const [orders,   setOrders]   = useState([]);
    const [apps,     setApps]     = useState([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { fetchAdminStats, fetchAdminOrders } = await import("@/lib/api");
                const { fetchAdminSellerApplications } = await import("@/lib/sellerApplicationsApi");
                const { useAuth: _useAuth } = await import("@/contexts/AuthContext");

                const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";

                const [sh, pr, ordData, appsData] = await Promise.allSettled([
                    fetchShops({ active_only: false, limit: 200 }),
                    fetchProducts({ active_only: false, limit: 500 }),
                    fetchAdminOrders(adminKey),
                    fetchAdminSellerApplications(adminKey),
                ]);

                const shopsArr = sh.status === "fulfilled" && Array.isArray(sh.value) ? sh.value : [];
                const prodsArr = pr.status === "fulfilled" && Array.isArray(pr.value) ? pr.value : [];
                const ordArr   = ordData.status === "fulfilled" ? (ordData.value?.orders || []) : [];
                const appsArr  = appsData.status === "fulfilled" && Array.isArray(appsData.value) ? appsData.value : [];

                setShops(shopsArr);
                setProducts(prodsArr);
                setOrders(ordArr);
                setApps(appsArr);
            } catch {
                setShops([]);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Derive stats from the SAME data sources as individual pages
    const totalSellers   = shops.length;
    const pendingSellers = apps.filter(a => a.status === "pending_review").length;
    const activeSellers  = shops.filter(s => s.is_active !== false).length;
    const totalProducts  = products.length;
    const totalOrders    = orders.length;
    const totalRevenue   = orders.reduce((s, o) => s + (o.total || 0), 0);
    const todaySales     = orders.filter(o => {
        const d = new Date(o.created_at || 0);
        const t = new Date();
        return d.toDateString() === t.toDateString();
    }).reduce((s, o) => s + (o.total || 0), 0);

    // Recent applications — from backend only (no mock fallback)
    const recentApps = apps.slice(0, 5);

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-64 text-sm" style={{ color: "#9B8B7A" }}>Loading…</div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            {/* Stats — 4 per row, 2 rows = 8 cards matching screenshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={icons.sellers}  label="Total Sellers"    value={totalSellers} />
                <StatCard icon={icons.pending}  label="Pending Sellers"  value={pendingSellers} />
                <StatCard icon={icons.products} label="Total Products"   value={totalProducts} />
                <StatCard icon={icons.pendProd} label="Active Sellers"   value={activeSellers} />
                <StatCard icon={icons.orders}   label="Total Orders"     value={totalOrders} />
                <StatCard icon={icons.revenue}  label="Total Revenue"    value={totalRevenue > 0 ? "₹" + (totalRevenue / 100000).toFixed(1) + "L" : "₹0"} />
                <StatCard icon={icons.sales}    label="Today's Sales"    value={todaySales > 0 ? "₹" + todaySales.toLocaleString("en-IN") : "₹0"} />
                <StatCard icon={icons.active}   label="Total Applications" value={apps.length || totalSellers} />
            </div>

            {/* Two-column grid: Recent Orders + Recent Seller Applications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Orders */}
                <div className="rounded-xl border overflow-hidden"
                    style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                    <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E8E4DF" }}>
                        <h2 className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>Recent Orders</h2>
                        <Link to="/admin/orders" className="text-xs font-semibold hover:underline" style={{ color: "#C9A84C" }}>View all →</Link>
                    </div>
                    {orders.length === 0 ? (
                        <div className="px-6 py-10 text-sm text-center" style={{ color: "#9B8B7A" }}>
                            No orders yet.
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: "#E8E4DF" }}>
                            {orders.slice(0, 5).map(order => (
                                <div key={order.id} className="flex items-center justify-between px-6 py-3.5">
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{order.id}</p>
                                        <p className="text-xs" style={{ color: "#9B8B7A" }}>
                                            {order.shipping_address?.name || "Customer"} · {new Date(order.created_at).toLocaleDateString("en-IN")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>₹{(order.total || 0).toLocaleString("en-IN")}</p>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                            style={{ backgroundColor: order.status === "delivered" ? "#D1FAE5" : "#FEF3C7",
                                                     color: order.status === "delivered" ? "#065F46" : "#92400E" }}>
                                            {order.status || "pending"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Seller Applications */}
                <div className="rounded-xl border overflow-hidden"
                    style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                    <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E8E4DF" }}>
                        <h2 className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>Recent Seller Applications</h2>
                    </div>
                    <div className="divide-y" style={{ borderColor: "#E8E4DF" }}>
                        {recentApps.map(app => {
                            const status = app.status || "pending_review";
                            const badge = STATUS_BADGE[status === "pending_review" ? "pending" : status] || STATUS_BADGE.inactive;
                            const name = app.store_information?.store_name || app.name || app.applicant_name || "—";
                            const city = app.store_information?.city || app.city || "—";
                            return (
                                <div key={app.id} className="flex items-center justify-between px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                        {app.image_url ? (
                                            <img src={app.image_url} alt={name}
                                                className="w-9 h-9 rounded-full object-cover border" style={{ borderColor: "#E8E4DF" }}
                                                onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=60&q=60"; }} />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold" style={{ color: "#1a1a1a" }}>
                                                {name.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{name}</p>
                                            <p className="text-xs" style={{ color: "#9B8B7A" }}>{city}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                                        style={{ backgroundColor: badge.bg, color: badge.color }}>
                                        {status === "pending_review" ? "pending" : badge.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="px-6 py-3 border-t" style={{ borderColor: "#E8E4DF" }}>
                        <Link to="/admin/seller-applications"
                            className="text-xs font-semibold hover:underline" style={{ color: "#C9A84C" }}>
                            View all →
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
