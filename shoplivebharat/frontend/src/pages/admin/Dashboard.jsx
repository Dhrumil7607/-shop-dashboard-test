import { useEffect, useState } from "react";
import { Package, Store, Users, TrendingUp, ShoppingBag, ArrowUpRight } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchMarketplaceStats, fetchShops, fetchProducts } from "@/lib/api";
import { MOCK_SHOPS, MOCK_PRODUCTS } from "@/lib/testData";
import { Link } from "react-router-dom";

function StatCard({ icon: Icon, label, value, sub, color }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} className="text-white" />
                </div>
                <ArrowUpRight size={14} className="text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-[#1a1a1a] mb-1">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}

export default function AdminDashboard() {
    const [stats,    setStats]    = useState(null);
    const [shops,    setShops]    = useState([]);
    const [products, setProducts] = useState([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [s, sh, pr] = await Promise.all([
                    fetchMarketplaceStats(),
                    fetchShops({ active_only: true, limit: 100 }),
                    fetchProducts({ active_only: true, limit: 100 }),
                ]);
                setStats(s);
                setShops(sh?.length ? sh : MOCK_SHOPS);
                setProducts(pr?.length ? pr : MOCK_PRODUCTS);
            } catch {
                setShops(MOCK_SHOPS);
                setProducts(MOCK_PRODUCTS);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Store}       label="Active Stores"   value={shops.length}           color="bg-[#1a1a1a]" />
                <StatCard icon={Package}     label="Total Products"  value={products.length}        color="bg-blue-500" />
                <StatCard icon={Users}       label="Waitlist"        value={stats?.waitlist_members || "10K+"} color="bg-purple-500" />
                <StatCard icon={TrendingUp}  label="Revenue"         value="₹4.2L"                  sub="This month" color="bg-green-500" />
            </div>

            {/* Recent Stores */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-[#1a1a1a] text-sm uppercase tracking-wider">Recent Stores</h2>
                    <Link to="/admin/seller-applications" className="text-xs font-semibold text-gray-500 hover:text-[#1a1a1a] transition">View all →</Link>
                </div>
                <div className="divide-y divide-gray-100">
                    {shops.slice(0, 5).map(shop => (
                        <div key={shop.id} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {shop.name[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#1a1a1a]">{shop.name}</p>
                                    <p className="text-xs text-gray-500">{shop.owner_name} · {shop.city}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                shop.is_active
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "bg-gray-100 text-gray-500 border border-gray-200"
                            }`}>
                                {shop.is_active ? "approved" : "inactive"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Products */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-[#1a1a1a] text-sm uppercase tracking-wider">Recent Products</h2>
                    <Link to="/admin/products" className="text-xs font-semibold text-gray-500 hover:text-[#1a1a1a] transition">View all →</Link>
                </div>
                <div className="divide-y divide-gray-100">
                    {products.slice(0, 6).map(p => (
                        <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                            <img src={p.image_url} alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                                onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=80&q=60"; }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1a1a1a] truncate">{p.name}</p>
                                <p className="text-xs text-gray-400">{p.shop_name} · {p.category}</p>
                            </div>
                            <p className="text-sm font-bold text-[#1a1a1a] flex-shrink-0">
                                ₹{Number(p.price).toLocaleString("en-IN")}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
