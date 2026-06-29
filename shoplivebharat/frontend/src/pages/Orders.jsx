import { useEffect, useState } from "react";
import { Loader, Package } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOrders } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Orders() {
    const { isLoggedIn } = useAuth();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoggedIn) {
            window.location.href = "/login";
            return;
        }

        loadOrders();
    }, [isLoggedIn]);

    const loadOrders = async () => {
        try {
            const data = await fetchOrders();
            setOrders(data.orders || []);
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            shipped: "bg-purple-100 text-purple-800",
            delivered: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                        My Orders
                    </h1>
                    <p className="text-lg text-espresso/70">
                        Track and manage your orders
                    </p>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="flex flex-col items-center gap-4">
                            <Loader size={32} className="animate-spin text-maroon" />
                            <p className="text-espresso/60">Loading your orders...</p>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96">
                        <Package size={48} className="text-espresso/30 mb-4" />
                        <p className="text-espresso/60 text-lg mb-4">No orders yet</p>
                        <a
                            href="/shop"
                            className="text-maroon font-medium hover:text-maroon/70 transition"
                        >
                            Start shopping
                        </a>
                    </div>
                ) : (
                    /* Orders List */
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="border border-line-soft rounded-lg p-6 hover:shadow-md transition"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-1">
                                            Order ID
                                        </p>
                                        <p className="font-medium text-espresso">#{order.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-1">
                                            Date
                                        </p>
                                        <p className="text-espresso">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-1">
                                            Total
                                        </p>
                                        <p className="font-medium text-espresso">
                                            {formatPrice(order.total ?? 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-1">
                                            Status
                                        </p>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                order.status || "pending"
                                            )}`}
                                        >
                                            {order.status?.charAt(0).toUpperCase() +
                                                order.status?.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-end">
                                        <button className="text-maroon font-medium hover:text-maroon/70 transition">
                                            View Details →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MarketplaceLayout>
    );
}
