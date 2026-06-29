import { useEffect, useState } from "react";
import { Package, Eye, Download, Filter } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "sonner";

const MOCK_ORDERS = [
    {
        id: "ORD-001",
        customer: "Priya Sharma",
        email: "priya@example.com",
        date: "2026-06-24",
        amount: 12490,
        currency: "INR",
        status: "Delivered",
        items: 3,
        shipping: "Ahmedabad",
        paymentMethod: "Credit Card"
    },
    {
        id: "ORD-002",
        customer: "Rajesh Kumar",
        email: "rajesh@example.com",
        date: "2026-06-23",
        amount: 8990,
        currency: "INR",
        status: "Processing",
        items: 2,
        shipping: "Mumbai",
        paymentMethod: "UPI"
    },
    {
        id: "ORD-003",
        customer: "Meera Patel",
        email: "meera@example.com",
        date: "2026-06-22",
        amount: 15890,
        currency: "INR",
        status: "Shipped",
        items: 4,
        shipping: "Delhi",
        paymentMethod: "Net Banking"
    },
    {
        id: "ORD-004",
        customer: "John Smith",
        email: "john@example.com",
        date: "2026-06-21",
        amount: 25490,
        currency: "USD",
        status: "Delivered",
        items: 5,
        shipping: "New York, USA",
        paymentMethod: "Credit Card"
    },
    {
        id: "ORD-005",
        customer: "Sarah Johnson",
        email: "sarah@example.com",
        date: "2026-06-20",
        amount: 18990,
        currency: "CAD",
        status: "Processing",
        items: 3,
        shipping: "Toronto, Canada",
        paymentMethod: "PayPal"
    }
];

export default function AdminOrders() {
    const [orders, setOrders] = useState(MOCK_ORDERS);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    const statuses = ["all", "Processing", "Shipped", "Delivered", "Cancelled"];
    const statusColors = {
        Processing: "bg-blue-100 text-blue-700",
        Shipped: "bg-orange-100 text-orange-700",
        Delivered: "bg-green-100 text-green-700",
        Cancelled: "bg-red-100 text-red-700"
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        const matchesSearch = 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => {
        if (order.currency === "INR") return sum + order.amount;
        if (order.currency === "USD") return sum + (order.amount * 83);
        if (order.currency === "CAD") return sum + (order.amount * 62);
        return sum;
    }, 0);

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === "Delivered").length;
    const pendingOrders = orders.filter(o => o.status === "Processing" || o.status === "Shipped").length;

    return (
        <AdminLayout>
            <div>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg border border-line-soft p-6">
                        <p className="text-sm text-espresso/60 mb-2">Total Orders</p>
                        <p className="text-3xl font-bold text-espresso">{totalOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-line-soft p-6">
                        <p className="text-sm text-espresso/60 mb-2">Completed</p>
                        <p className="text-3xl font-bold text-green-600">{completedOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-line-soft p-6">
                        <p className="text-sm text-espresso/60 mb-2">Pending</p>
                        <p className="text-3xl font-bold text-orange-600">{pendingOrders}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-line-soft p-6">
                        <p className="text-sm text-espresso/60 mb-2">Total Revenue</p>
                        <p className="text-3xl font-bold text-maroon">₹{(totalRevenue / 1000000).toFixed(1)}M</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-line-soft p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by order ID, customer name, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none text-sm"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Filter size={20} className="text-espresso/60 mt-2" />
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg transition capitalize text-sm font-medium ${
                                        filterStatus === status
                                            ? "bg-maroon text-ivory"
                                            : "bg-gray-100 text-espresso hover:bg-gray-200"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg border border-line-soft overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-line-soft">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Order ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Items</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="border-b border-line-soft hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-semibold text-maroon">{order.id}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div>
                                            <p className="font-medium text-espresso">{order.customer}</p>
                                            <p className="text-xs text-espresso/60">{order.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-espresso/60">
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-espresso">
                                        {order.currency} {order.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-espresso">{order.items}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100"}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toast.info(`Viewing order ${order.id}`)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => toast.success(`Downloaded invoice for ${order.id}`)}
                                                className="p-2 text-maroon hover:bg-maroon/5 rounded-lg transition"
                                                title="Download Invoice"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                            <Package size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-espresso/60 text-lg">No orders found</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {filteredOrders.length > 0 && (
                    <div className="mt-8 flex items-center justify-between">
                        <p className="text-sm text-espresso/60">
                            Showing {filteredOrders.length} of {totalOrders} orders
                        </p>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 border border-line-soft rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                                Previous
                            </button>
                            <button className="px-4 py-2 border border-line-soft rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
