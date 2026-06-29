import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Tag, Copy, Check, X, Percent, DollarSign, Calendar, AlertCircle } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "sonner";

const INITIAL_COUPONS = [
    { id: 1, code: "WELCOME20", type: "percent", value: 20, minOrder: 500, maxUses: 100, used: 34, expiry: "2026-12-31", active: true },
    { id: 2, code: "FLAT500",   type: "flat",    value: 500, minOrder: 2000, maxUses: 50, used: 12, expiry: "2026-09-30", active: true },
    { id: 3, code: "DIWALI25",  type: "percent", value: 25, minOrder: 1000, maxUses: 200, used: 200, expiry: "2025-11-15", active: false },
];

const EMPTY_FORM = {
    code: "", type: "percent", value: "", minOrder: "", maxUses: "", expiry: "", active: true,
};

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState(INITIAL_COUPONS);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);
    const [copied, setCopied] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [errors, setErrors] = useState({});

    /* ── helpers ── */
    const validate = () => {
        const e = {};
        if (!form.code.trim())        e.code     = "Coupon code is required";
        else if (!/^[A-Z0-9_-]+$/.test(form.code)) e.code = "Only uppercase letters, digits, - and _";
        if (!form.value || isNaN(form.value) || +form.value <= 0) e.value = "Enter a valid positive value";
        if (form.type === "percent" && +form.value > 100) e.value = "Percentage cannot exceed 100";
        if (!form.minOrder || isNaN(form.minOrder) || +form.minOrder < 0) e.minOrder = "Enter valid minimum order amount";
        if (!form.maxUses  || isNaN(form.maxUses)  || +form.maxUses  <= 0) e.maxUses  = "Enter valid max uses";
        if (!form.expiry) e.expiry = "Expiry date is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 2000);
    };

    const openAdd = () => {
        setForm(EMPTY_FORM);
        setEditId(null);
        setErrors({});
        setShowForm(true);
    };

    const openEdit = (c) => {
        setForm({ code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxUses: c.maxUses, expiry: c.expiry, active: c.active });
        setEditId(c.id);
        setErrors({});
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        if (editId) {
            setCoupons(prev => prev.map(c => c.id === editId
                ? { ...c, ...form, value: +form.value, minOrder: +form.minOrder, maxUses: +form.maxUses }
                : c
            ));
            toast.success("Coupon updated!");
        } else {
            // Check duplicate code
            if (coupons.some(c => c.code === form.code.trim())) {
                setErrors({ code: "Coupon code already exists" });
                return;
            }
            setCoupons(prev => [...prev, {
                id: Date.now(),
                ...form,
                code: form.code.trim().toUpperCase(),
                value: +form.value,
                minOrder: +form.minOrder,
                maxUses: +form.maxUses,
                used: 0,
            }]);
            toast.success("Coupon created!");
        }
        setShowForm(false);
        setEditId(null);
    };

    const handleDelete = (id) => {
        setCoupons(prev => prev.filter(c => c.id !== id));
        setDeleteConfirm(null);
        toast.success("Coupon deleted");
    };

    const toggleActive = (id) => {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    };

    const isExpired = (expiry) => new Date(expiry) < new Date();

    /* ── stat cards ── */
    const stats = [
        { label: "Total Coupons",  value: coupons.length,                             color: "#2C241B" },
        { label: "Active",         value: coupons.filter(c => c.active && !isExpired(c.expiry)).length, color: "#16a34a" },
        { label: "Expired",        value: coupons.filter(c => isExpired(c.expiry)).length, color: "#ef4444" },
        { label: "Total Redeemed", value: coupons.reduce((s, c) => s + c.used, 0),    color: "#C9A84C" },
    ];

    return (
        <AdminLayout>
            <div className="space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: "#2C241B" }}>Coupons</h1>
                        <p className="text-sm mt-1" style={{ color: "#8B8680" }}>Create and manage discount codes for customers</p>
                    </div>
                    <motion.button
                        onClick={openAdd}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white"
                        style={{ background: "#A2466B" }}
                    >
                        <Plus size={18} /> New Coupon
                    </motion.button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E8E4DF" }}>
                            <p className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color: "#8B8680" }}>{s.label}</p>
                            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E8E4DF" }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: "#E8E4DF" }}>
                        <h2 className="font-semibold text-base" style={{ color: "#2C241B" }}>All Coupons</h2>
                    </div>

                    {coupons.length === 0 ? (
                        <div className="py-20 text-center">
                            <Tag size={48} className="mx-auto mb-4" style={{ color: "#E8E4DF" }} />
                            <p className="text-lg font-medium" style={{ color: "#2C241B" }}>No coupons yet</p>
                            <p className="text-sm mt-1 mb-6" style={{ color: "#8B8680" }}>Create your first discount coupon</p>
                            <button onClick={openAdd} className="px-6 py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: "#A2466B" }}>
                                Create Coupon
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b" style={{ borderColor: "#E8E4DF", background: "#FAFAF9" }}>
                                        {["Code", "Discount", "Min Order", "Usage", "Expiry", "Status", "Actions"].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#8B8680" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map((c, i) => {
                                        const expired = isExpired(c.expiry);
                                        const statusLabel = expired ? "Expired" : c.active ? "Active" : "Disabled";
                                        const statusColor = expired ? "#ef4444" : c.active ? "#16a34a" : "#8B8680";
                                        const statusBg   = expired ? "#fef2f2" : c.active ? "#f0fdf4" : "#F5F5F4";

                                        return (
                                            <motion.tr
                                                key={c.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                                className="border-b hover:bg-stone-50 transition"
                                                style={{ borderColor: "#E8E4DF" }}
                                            >
                                                {/* Code */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <code className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg" style={{ background: "#F5F1ED", color: "#2C241B" }}>
                                                            {c.code}
                                                        </code>
                                                        <button onClick={() => copyCode(c.code)} className="p-1 rounded hover:bg-stone-100 transition" title="Copy code">
                                                            {copied === c.code ? <Check size={14} style={{ color: "#16a34a" }} /> : <Copy size={14} style={{ color: "#8B8680" }} />}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Discount */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        {c.type === "percent"
                                                            ? <Percent size={14} style={{ color: "#C9A84C" }} />
                                                            : <DollarSign size={14} style={{ color: "#C9A84C" }} />
                                                        }
                                                        <span className="font-semibold" style={{ color: "#2C241B" }}>
                                                            {c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Min Order */}
                                                <td className="px-6 py-4" style={{ color: "#6B5E4C" }}>₹{c.minOrder}</td>

                                                {/* Usage */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1.5">
                                                        <span className="text-xs" style={{ color: "#6B5E4C" }}>{c.used} / {c.maxUses}</span>
                                                        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "#E8E4DF" }}>
                                                            <div className="h-full rounded-full" style={{ width: `${Math.min((c.used / c.maxUses) * 100, 100)}%`, background: c.used >= c.maxUses ? "#ef4444" : "#C9A84C" }} />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Expiry */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={13} style={{ color: expired ? "#ef4444" : "#8B8680" }} />
                                                        <span className="text-xs" style={{ color: expired ? "#ef4444" : "#6B5E4C" }}>
                                                            {new Date(c.expiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => !expired && toggleActive(c.id)}
                                                        disabled={expired}
                                                        className="px-3 py-1 rounded-full text-xs font-semibold transition"
                                                        style={{ background: statusBg, color: statusColor }}
                                                    >
                                                        {statusLabel}
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openEdit(c)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition hover:bg-stone-50"
                                                            style={{ borderColor: "#E8E4DF", color: "#2C241B" }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(c.id)}
                                                            className="p-1.5 rounded-lg transition hover:bg-red-50"
                                                        >
                                                            <Trash2 size={15} style={{ color: "#ef4444" }} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Add / Edit Modal ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />

                        <motion.div
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
                            initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 30 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E8E4DF" }}>
                                <h3 className="text-lg font-bold" style={{ color: "#2C241B" }}>
                                    {editId ? "Edit Coupon" : "Create New Coupon"}
                                </h3>
                                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-stone-100 transition">
                                    <X size={18} style={{ color: "#8B8680" }} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Code */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8B8680" }}>Coupon Code</label>
                                    <input
                                        value={form.code}
                                        onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. SUMMER20"
                                        className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none"
                                        style={{ border: `1.5px solid ${errors.code ? "#ef4444" : "#E8E4DF"}`, background: "#FAFAF9" }}
                                    />
                                    {errors.code && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.code}</p>}
                                </div>

                                {/* Type + Value */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8B8680" }}>Discount Type</label>
                                        <select
                                            value={form.type}
                                            onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ border: "1.5px solid #E8E4DF", background: "#FAFAF9" }}
                                        >
                                            <option value="percent">Percentage (%)</option>
                                            <option value="flat">Flat Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8B8680" }}>
                                            Value {form.type === "percent" ? "(%)" : "(₹)"}
                                        </label>
                                        <input
                                            type="number" min="1" max={form.type === "percent" ? 100 : undefined}
                                            value={form.value}
                                            onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                                            placeholder={form.type === "percent" ? "20" : "500"}
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ border: `1.5px solid ${errors.value ? "#ef4444" : "#E8E4DF"}`, background: "#FAFAF9" }}
                                        />
                                        {errors.value && <p className="text-xs text-red-600 mt-1">{errors.value}</p>}
                                    </div>
                                </div>

                                {/* Min Order + Max Uses */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8B8680" }}>Min Order (₹)</label>
                                        <input
                                            type="number" min="0"
                                            value={form.minOrder}
                                            onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))}
                                            placeholder="500"
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ border: `1.5px solid ${errors.minOrder ? "#ef4444" : "#E8E4DF"}`, background: "#FAFAF9" }}
                                        />
                                        {errors.minOrder && <p className="text-xs text-red-600 mt-1">{errors.minOrder}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8B8680" }}>Max Uses</label>
                                        <input
                                            type="number" min="1"
                                            value={form.maxUses}
                                            onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                                            placeholder="100"
                                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                            style={{ border: `1.5px solid ${errors.maxUses ? "#ef4444" : "#E8E4DF"}`, background: "#FAFAF9" }}
                                        />
                                        {errors.maxUses && <p className="text-xs text-red-600 mt-1">{errors.maxUses}</p>}
                                    </div>
                                </div>

                                {/* Expiry */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#8B8680" }}>Expiry Date</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split("T")[0]}
                                        value={form.expiry}
                                        onChange={e => setForm(p => ({ ...p, expiry: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                        style={{ border: `1.5px solid ${errors.expiry ? "#ef4444" : "#E8E4DF"}`, background: "#FAFAF9" }}
                                    />
                                    {errors.expiry && <p className="text-xs text-red-600 mt-1">{errors.expiry}</p>}
                                </div>

                                {/* Active toggle */}
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        onClick={() => setForm(p => ({ ...p, active: !p.active }))}
                                        className="relative w-10 h-5 rounded-full transition"
                                        style={{ background: form.active ? "#A2466B" : "#E8E4DF" }}
                                    >
                                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                                            style={{ transform: form.active ? "translateX(20px)" : "translateX(0)" }} />
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: "#2C241B" }}>
                                        {form.active ? "Coupon is active" : "Coupon is disabled"}
                                    </span>
                                </label>

                                {/* Footer */}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 py-3 rounded-xl text-sm font-semibold border transition"
                                        style={{ borderColor: "#E8E4DF", color: "#2C241B" }}>
                                        Cancel
                                    </button>
                                    <motion.button type="submit"
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                                        style={{ background: "#A2466B" }}>
                                        {editId ? "Update Coupon" : "Create Coupon"}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Delete confirmation ── */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                        <motion.div
                            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 text-center"
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={22} style={{ color: "#ef4444" }} />
                            </div>
                            <h3 className="text-lg font-bold mb-1" style={{ color: "#2C241B" }}>Delete Coupon?</h3>
                            <p className="text-sm mb-6" style={{ color: "#8B8680" }}>This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                                    style={{ borderColor: "#E8E4DF", color: "#2C241B" }}>
                                    Cancel
                                </button>
                                <button onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition">
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
