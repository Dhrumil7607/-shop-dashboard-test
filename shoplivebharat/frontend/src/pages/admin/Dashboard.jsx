import { useEffect, useState } from "react";
import { Package, Store, Users, TrendingUp } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchMarketplaceStats, fetchShops, fetchProducts } from "@/lib/api";
import { toast } from "sonner";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, shopsData, productsData] = await Promise.all([
                    fetchMarketplaceStats(),
                    fetchShops({ active_only: true, limit: 100 }),
                    fetchProducts({ active_only: true, limit: 100 }),
                ]);
                setStats(statsData);
                setShops(shopsData);
                setProducts(productsData);
            } catch (error) {
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div className="bg-white rounded-lg p-6 border border-line-soft">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-espresso/60 mb-2">{label}</p>
                    <p className="text-3xl font-bold text-espresso">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout>
            <div>
                <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-espresso/60">Loading...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={TrendingUp}
                                label="Total Revenue"
                                value={stats?.total_revenue || "$0"}
                                color="bg-maroon"
                            />
                            <StatCard
                                icon={Store}
                                label="Active Shops"
                                value={shops.length}
                                color="bg-blue-500"
                            />
                            <StatCard
                                icon={Package}
                                label="Products"
                                value={products.length}
                                color="bg-green-500"
                            />
                            <StatCard
                                icon={Users}
                                label="Waitlist"
                                value={stats?.total_members || 0}
                                color="bg-purple-500"
                            />
                        </div>

                        {/* Recent Shops */}
                        <div className="bg-white rounded-lg border border-line-soft p-6 mb-8">
                            <h2 className="text-xl font-bold mb-6">Recent Shops</h2>
                            <div className="space-y-4">
                                {shops.slice(0, 5).map((shop) => (
                                    <div
                                        key={shop.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-semibold text-espresso">{shop.name}</p>
                                            <p className="text-sm text-espresso/60">
                                                {shop.owner_name} • {shop.city}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full ${
                                                shop.is_active
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {shop.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Products */}
                        <div className="bg-white rounded-lg border border-line-soft p-6">
                            <h2 className="text-xl font-bold mb-6">Recent Products</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {products.slice(0, 6).map((product) => (
                                    <div
                                        key={product.id}
                                        className="border border-line-soft rounded-lg p-4 hover:shadow-lg transition"
                                    >
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-40 object-cover rounded mb-4"
                                        />
                                        <p className="font-semibold text-espresso">{product.name}</p>
                                        <p className="text-sm text-maroon font-bold mt-2">
                                            {product.currency} {product.price}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
