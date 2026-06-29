import { useState } from "react";
import { Eye, Download, Search } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "sonner";

const ORDERS = [
    { id:"ORD-001", customer:"Priya Sharma",    email:"priya@example.com",   date:"2026-06-24", amount:12490, currency:"INR", status:"Delivered",  items:3 },
    { id:"ORD-002", customer:"Rajesh Kumar",    email:"rajesh@example.com",  date:"2026-06-23", amount:8990,  currency:"INR", status:"Processing", items:2 },
    { id:"ORD-003", customer:"Meera Patel",     email:"meera@example.com",   date:"2026-06-22", amount:15890, currency:"INR", status:"Shipped",    items:4 },
    { id:"ORD-004", customer:"John Smith",      email:"john@example.com",    date:"2026-06-21", amount:25490, currency:"USD", status:"Delivered",  items:5 },
    { id:"ORD-005", customer:"Sarah Johnson",   email:"sarah@example.com",   date:"2026-06-20", amount:18990, currency:"CAD", status:"Processing", items:3 },
    { id:"ORD-006", customer:"Ananya Desai",    email:"ananya@example.com",  date:"2026-06-19", amount:34990, currency:"INR", status:"Delivered",  items:6 },
];

const STATUS = {
    Processing: "bg-blue-100 text-blue-700 border-blue-200",
    Shipped:    "bg-amber-100 text-amber-700 border-amber-200",
    Delivered:  "bg-green-100 text-green-700 border-green-200",
    Cancelled:  "bg-red-100 text-red-700 border-red-200",
};

const FILTERS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

const fmt = (n, cur = "INR") =>
    cur === "INR" ? "₹" + Number(n).toLocaleString("en-IN") : `${cur} ${Number(n).toLocaleString()}`;

export default function AdminOrders() {
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");

    const rows = ORDERS.filter(o => {
        const matchF = filter === "All" || o.status === filter;
        const q      = search.toLowerCase();
        const matchS = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
        return matchF && matchS;
    });

    const total    = ORDERS.length;
    const revenue  = ORDERS.reduce((s, o) => s + (o.currency === "INR" ? o.amount : o.amount * 83), 0);
    const delivered = ORDERS.filter(o => o.status === "Delivered").length;
    const pending  = ORDERS.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;

    return (
        <AdminLayout>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label:"Total Orders",  value: total },
                    { label:"Delivered",     value: delivered,    cls:"text-green-600" },
                    { label:"Pending",       value: pending,      cls:"text-amber-600" },
                    { label:"Revenue",       value:"₹" + (revenue/100000).toFixed(1) + "L", cls:"text-[#1a1a1a]" },
                ].map(c => (
                    <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5">
                        <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                        <p className={`text-2xl font-bold ${c.cls || "text-[#1a1a1a]"}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by ID or customer…"
                        className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1a1a1a] w-64 transition" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                                filter === f
                                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                            }`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {["Order ID","Customer","Date","Amount","Items","Status","Actions"].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map(o => (
                            <tr key={o.id} className="hover:bg-gray-50 transition">
                                <td className="px-5 py-4 font-mono font-bold text-[#1a1a1a] text-xs">{o.id}</td>
                                <td className="px-5 py-4">
                                    <p className="font-semibold text-[#1a1a1a]">{o.customer}</p>
                                    <p className="text-xs text-gray-400">{o.email}</p>
                                </td>
                                <td className="px-5 py-4 text-gray-500 text-xs">{new Date(o.date).toLocaleDateString("en-IN")}</td>
                                <td className="px-5 py-4 font-bold text-[#1a1a1a]">{fmt(o.amount, o.currency)}</td>
                                <td className="px-5 py-4 text-gray-600">{o.items}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS[o.status] || ""}`}>
                                        {o.status}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex gap-1">
                                        <button onClick={() => toast.info(`Order ${o.id}`)}
                                            className="p-2 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition">
                                            <Eye size={15} />
                                        </button>
                                        <button onClick={() => toast.success(`Invoice ${o.id}`)}
                                            className="p-2 text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 rounded-lg transition">
                                            <Download size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className="text-center py-14 text-gray-400 text-sm">No orders found.</div>
                )}
                <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
                    Showing {rows.length} of {total} orders
                </div>
            </div>
        </AdminLayout>
    );
}
