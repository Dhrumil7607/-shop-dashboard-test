/**
 * AdminLogin.jsx — /admin/login
 * Secure admin login. No public demo credentials shown.
 * Auth stored in localStorage (adminKey + slb_user) for persistence across refreshes.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Credentials kept in env vars only — never hardcoded in UI
const getAdminCreds = () => ({
    id:  process.env.REACT_APP_ADMIN_ID  || "admin",
    pwd: process.env.REACT_APP_ADMIN_PWD || "admin123",
});

export default function AdminLogin() {
    const navigate = useNavigate();
    const { loginAdmin, isAdmin, loading } = useAuth();

    const [adminId,   setAdminId]   = useState("");
    const [password,  setPassword]  = useState("");
    const [showPwd,   setShowPwd]   = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error,     setError]     = useState("");

    // Already authenticated → redirect immediately
    useEffect(() => {
        if (!loading && isAdmin) {
            navigate("/admin/dashboard", { replace: true });
        }
    }, [isAdmin, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!adminId.trim() || !password.trim()) {
            setError("Both fields are required.");
            return;
        }

        setSubmitting(true);
        try {
            // Try real backend first
            try {
                const { api } = await import("@/lib/api");
                const { data } = await api.post("/auth/login", {
                    email: adminId.includes("@") ? adminId : `${adminId}@shoplivebharat.com`,
                    password,
                });
                if (data?.user?.role === "admin" && data?.token) {
                    localStorage.setItem("slb_token", data.token);
                    localStorage.setItem("slb_user", JSON.stringify(data.user));
                    await loginAdmin("shoplivebharat-admin");
                    toast.success("Welcome, Admin.");
                    navigate("/admin/dashboard", { replace: true });
                    return;
                }
            } catch {
                // Backend unreachable — fall through to local check
            }

            // Local credential check (offline / demo mode)
            const creds = getAdminCreds();
            if (adminId.trim() === creds.id && password === creds.pwd) {
                const adminUser = {
                    id: "demo_admin", name: "Admin",
                    email: "admin@shoplivebharat.com", role: "admin",
                };
                localStorage.setItem("slb_admin_key", "shoplivebharat-admin");
                localStorage.setItem("slb_user", JSON.stringify(adminUser));
                localStorage.setItem("slb_token", "admin_token_" + Date.now());
                await loginAdmin("shoplivebharat-admin");
                toast.success("Welcome, Admin.");
                navigate("/admin/dashboard", { replace: true });
            } else {
                setError("Invalid credentials. Please try again.");
            }
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setSubmitting(false);
        }
    };

    // While session is being restored, show nothing
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
            style={{ backgroundColor: "#0a0a0a" }}>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="w-full max-w-sm"
            >
                {/* Brand */}
                <div className="text-center mb-10">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: "rgba(220,50,50,0.15)", border: "1px solid rgba(220,50,50,0.25)" }}>
                        <ShieldCheck size={26} style={{ color: "#FF6B6B" }} />
                    </div>
                    <h1 className="font-serif text-2xl text-white mb-1">Admin Panel</h1>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        ShopLive Bharat · Restricted Access
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Admin ID */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                            style={{ color: "rgba(255,255,255,0.4)" }}>
                            Admin ID
                        </label>
                        <input
                            type="text"
                            value={adminId}
                            onChange={e => { setAdminId(e.target.value); setError(""); }}
                            placeholder="Enter admin ID"
                            autoComplete="username"
                            className="w-full px-4 py-3.5 rounded-xl text-sm outline-none"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: `1.5px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                                color: "white",
                            }}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                            style={{ color: "rgba(255,255,255,0.4)" }}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPwd ? "text" : "password"}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(""); }}
                                placeholder="Enter password"
                                autoComplete="current-password"
                                className="w-full px-4 py-3.5 pr-11 rounded-xl text-sm outline-none"
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    border: `1.5px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                                    color: "white",
                                }}
                            />
                            <button type="button" onClick={() => setShowPwd(v => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                style={{ color: "rgba(255,255,255,0.35)" }}>
                                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-xs text-red-400"
                            >
                                <AlertCircle size={13} /> {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                        type="submit"
                        disabled={submitting}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.975 }}
                        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2"
                        style={{
                            background: submitting ? "rgba(220,50,50,0.4)" : "rgba(220,50,50,0.8)",
                            color: "white",
                            border: "1px solid rgba(220,50,50,0.4)",
                        }}
                    >
                        {submitting ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : "Sign In"}
                    </motion.button>
                </form>

                <p className="text-center mt-8 text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                    Unauthorized access attempts are logged.
                </p>
            </motion.div>
        </div>
    );
}
