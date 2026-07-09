import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, Lock, Shield, Trash2, Eye, EyeOff,
    Check, ChevronRight, LogOut, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useAuth } from "@/contexts/AuthContext";

const SECTIONS = ["Notifications", "Password", "Privacy", "Danger Zone"];

export default function UserSettings() {
    const navigate = useNavigate();
    const { user, isLoggedIn, logout } = useAuth();

    const [activeSection, setActiveSection] = useState("Notifications");

    // Notification prefs (stored in localStorage for demo)
    const [notifs, setNotifs] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("slb_notif_prefs") || "null") || {
                orderUpdates: true,
                promotions: false,
                wishlistAlerts: true,
                newArrivals: false,
                smsAlerts: false,
            };
        } catch { return { orderUpdates: true, promotions: false, wishlistAlerts: true, newArrivals: false, smsAlerts: false }; }
    });
    const [notifSaving, setNotifSaving] = useState(false);

    // Password fields
    const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
    const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
    const [pwdSaving, setPwdSaving] = useState(false);

    // Privacy prefs
    const [privacy, setPrivacy] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("slb_privacy_prefs") || "null") || {
                profilePublic: false,
                shareData: true,
                analytics: true,
            };
        } catch { return { profilePublic: false, shareData: true, analytics: true }; }
    });
    const [privacySaving, setPrivacySaving] = useState(false);

    // Redirect if not logged in — must come AFTER all hooks
    useEffect(() => {
        if (!isLoggedIn) navigate("/login", { replace: true });
    }, [isLoggedIn, navigate]);

    /* ── handlers ── */
    const saveNotifs = async () => {
        setNotifSaving(true);
        await new Promise(r => setTimeout(r, 400));
        localStorage.setItem("slb_notif_prefs", JSON.stringify(notifs));
        setNotifSaving(false);
        toast.success("Notification preferences saved");
    };

    const savePassword = async (e) => {
        e.preventDefault();
        if (!pwdForm.current) { toast.error("Enter your current password"); return; }
        if (pwdForm.next !== pwdForm.confirm) { toast.error("Passwords do not match"); return; }
        setPwdSaving(true);
        try {
            const { changePassword } = await import("@/lib/api");
            await changePassword(pwdForm.current, pwdForm.next);
            toast.success("Password updated successfully");
            setPwdForm({ current: "", next: "", confirm: "" });
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not change password. Use a stronger password (8+ chars, mixed case, number, symbol).");
        } finally {
            setPwdSaving(false);
        }
    };

    const savePrivacy = async () => {
        setPrivacySaving(true);
        await new Promise(r => setTimeout(r, 400));
        localStorage.setItem("slb_privacy_prefs", JSON.stringify(privacy));
        setPrivacySaving(false);
        toast.success("Privacy settings saved");
    };

    const handleDeleteAccount = () => {
        toast.error("Account deletion requires contacting support at support@shoplivebharat.com");
    };

    const handleLogout = () => {
        logout();
        navigate("/");
        toast.success("Logged out successfully");
    };

    /* ── animated checkbox ── */
    const AnimatedCheckbox = ({ checked, onChange, id }) => (
        <label
            htmlFor={id}
            style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}
        >
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: checked ? "2px solid #A2466B" : "2px solid #D1D5DB",
                    backgroundColor: checked ? "#A2466B" : "#ffffff",
                    transition: "background-color 0.18s ease, border-color 0.18s ease",
                    flexShrink: 0,
                }}
            >
                {/* SVG checkmark with draw animation */}
                <svg
                    width="13"
                    height="10"
                    viewBox="0 0 13 10"
                    fill="none"
                    style={{
                        overflow: "visible",
                        opacity: checked ? 1 : 0,
                        transform: checked ? "scale(1)" : "scale(0.5)",
                        transition: "opacity 0.15s ease, transform 0.15s ease",
                    }}
                >
                    <polyline
                        points="1.5,5 5,8.5 11.5,1.5"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                </svg>
            </span>
        </label>
    );

    const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
    const inputStyle = { border: "1.5px solid #E8E4DF", background: "#FAFAF9", color: "#2C241B" };
    const onFocus = e => { e.target.style.borderColor = "#A2466B"; e.target.style.boxShadow = "0 0 0 3px rgba(162,70,107,0.08)"; };
    const onBlur  = e => { e.target.style.borderColor = "#E8E4DF";  e.target.style.boxShadow = "none"; };

    return (
        <MarketplaceLayout>
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "#8B8680" }}>
                    <Link to="/account" className="hover:underline">My Account</Link>
                    <ChevronRight size={14} />
                    <span style={{ color: "#2C241B" }}>Settings</span>
                </div>

                {/* Header */}
                <div className="mb-10">
                    <h1 className="font-serif text-4xl md:text-5xl mb-2" style={{ color: "#2C241B" }}>Settings</h1>
                    <p className="text-sm" style={{ color: "#8B8680" }}>Manage your account preferences and security</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* ── Sidebar nav — scrollable tab strip on mobile ── */}
                    <aside className="md:w-56 flex-shrink-0">
                        {/* Mobile: horizontal scrollable tabs */}
                        <div className="flex md:hidden gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                            {[
                                { label: "Notifications", short: "Notifs", icon: Bell },
                                { label: "Password",      short: "Password", icon: Lock },
                                { label: "Privacy",       short: "Privacy", icon: Shield },
                                { label: "Danger Zone",   short: "Danger", icon: AlertTriangle },
                            ].map(({ label, short, icon: Icon }) => (
                                <button
                                    key={label}
                                    onClick={() => setActiveSection(label)}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px]"
                                    style={{
                                        background: activeSection === label ? "#A2466B" : "#F5F1ED",
                                        color: activeSection === label ? "#fff" : "#6B5E4C",
                                    }}
                                >
                                    <Icon size={13} /> {short}
                                </button>
                            ))}
                        </div>

                        {/* Desktop: vertical nav */}
                        <nav className="hidden md:block space-y-1">
                            {[
                                { label: "Notifications", icon: Bell },
                                { label: "Password",      icon: Lock },
                                { label: "Privacy",       icon: Shield },
                                { label: "Danger Zone",   icon: AlertTriangle },
                            ].map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    onClick={() => setActiveSection(label)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all min-h-[44px]"
                                    style={{
                                        background: activeSection === label ? "#F5F1ED" : "transparent",
                                        color: activeSection === label ? "#A2466B" : "#6B5E4C",
                                    }}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}

                            <div className="pt-4 border-t" style={{ borderColor: "#E8E4DF" }}>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition hover:bg-red-50 min-h-[44px]"
                                    style={{ color: "#ef4444" }}
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        </nav>
                    </aside>

                    {/* ── Content panel ── */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.22 }}
                            >

                                {/* ── NOTIFICATIONS ── */}
                                {activeSection === "Notifications" && (
                                    <div className="bg-white rounded-2xl border p-6 md:p-8" style={{ borderColor: "#E8E4DF" }}>
                                        <h2 className="text-xl font-semibold mb-1" style={{ color: "#2C241B" }}>Notification Preferences</h2>
                                        <p className="text-sm mb-8" style={{ color: "#8B8680" }}>Choose how you want to be notified</p>

                                        <div className="space-y-1">
                                            {[
                                                { key: "orderUpdates",   label: "Order Updates",       desc: "Shipping, delivery, and order status changes" },
                                                { key: "promotions",     label: "Promotions & Offers", desc: "Discounts, sales, and special deals" },
                                                { key: "wishlistAlerts", label: "Wishlist Alerts",     desc: "Price drops on your saved items" },
                                                { key: "newArrivals",    label: "New Arrivals",        desc: "Freshly added collections and products" },
                                                { key: "smsAlerts",      label: "SMS Alerts",          desc: "Text messages for important updates" },
                                            ].map(({ key, label, desc }) => (
                                                <label
                                                    key={key}
                                                    htmlFor={`notif-${key}`}
                                                    className="flex items-start gap-4 py-4 px-3 rounded-xl cursor-pointer border-b last:border-0 hover:bg-stone-50 transition-colors"
                                                    style={{ borderColor: "#F5F1ED" }}
                                                >
                                                    <div className="mt-0.5">
                                                        <AnimatedCheckbox
                                                            id={`notif-${key}`}
                                                            checked={notifs[key]}
                                                            onChange={v => setNotifs(p => ({ ...p, [key]: v }))}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold" style={{ color: "#2C241B" }}>{label}</p>
                                                        <p className="text-xs mt-0.5" style={{ color: "#8B8680" }}>{desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        <div className="mt-8">
                                            <motion.button
                                                onClick={saveNotifs}
                                                disabled={notifSaving}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                                                style={{ background: "#A2466B" }}
                                            >
                                                {notifSaving ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}
                                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                                ) : <Check size={16} />}
                                                {notifSaving ? "Saving…" : "Save Preferences"}
                                            </motion.button>
                                        </div>
                                    </div>
                                )}

                                {/* ── PASSWORD ── */}
                                {activeSection === "Password" && (
                                    <div className="bg-white rounded-2xl border p-6 md:p-8" style={{ borderColor: "#E8E4DF" }}>
                                        <h2 className="text-xl font-semibold mb-1" style={{ color: "#2C241B" }}>Change Password</h2>
                                        <p className="text-sm mb-8" style={{ color: "#8B8680" }}>Use a strong password to keep your account secure</p>

                                        <form onSubmit={savePassword} className="space-y-5 max-w-md">
                                            {[
                                                { key: "current", label: "Current Password",  placeholder: "Enter current password" },
                                                { key: "next",    label: "New Password",       placeholder: "Min. 6 characters" },
                                                { key: "confirm", label: "Confirm New Password", placeholder: "Repeat new password" },
                                            ].map(({ key, label, placeholder }) => (
                                                <div key={key}>
                                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#8B8680" }}>
                                                        {label}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPwd[key] ? "text" : "password"}
                                                            value={pwdForm[key]}
                                                            onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                                                            placeholder={placeholder}
                                                            required
                                                            className={inputCls + " pr-11"}
                                                            style={inputStyle}
                                                            onFocus={onFocus}
                                                            onBlur={onBlur}
                                                        />
                                                        <button type="button"
                                                            onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                                            style={{ color: "#C9A4B0" }}>
                                                            {showPwd[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                    {/* Live match indicator */}
                                                    {key === "confirm" && pwdForm.confirm && (
                                                        <p className="text-xs mt-1.5 flex items-center gap-1"
                                                            style={{ color: pwdForm.next === pwdForm.confirm ? "#16a34a" : "#ef4444" }}>
                                                            {pwdForm.next === pwdForm.confirm
                                                                ? <><Check size={12} /> Passwords match</>
                                                                : "Passwords do not match"
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            ))}

                                            <motion.button
                                                type="submit"
                                                disabled={pwdSaving}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                                                style={{ background: "#A2466B" }}
                                            >
                                                {pwdSaving ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}
                                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                                ) : <Lock size={16} />}
                                                {pwdSaving ? "Updating…" : "Update Password"}
                                            </motion.button>
                                        </form>
                                    </div>
                                )}

                                {/* ── PRIVACY ── */}
                                {activeSection === "Privacy" && (
                                    <div className="bg-white rounded-2xl border p-6 md:p-8" style={{ borderColor: "#E8E4DF" }}>
                                        <h2 className="text-xl font-semibold mb-1" style={{ color: "#2C241B" }}>Privacy & Data</h2>
                                        <p className="text-sm mb-8" style={{ color: "#8B8680" }}>Control how your data is used</p>

                                        <div className="space-y-1">
                                            {[
                                                { key: "profilePublic", label: "Public Profile",       desc: "Allow other users to view your profile" },
                                                { key: "shareData",     label: "Personalisation Data", desc: "Help us improve recommendations for you" },
                                                { key: "analytics",     label: "Usage Analytics",      desc: "Share anonymous usage data to improve the app" },
                                            ].map(({ key, label, desc }) => (
                                                <label
                                                    key={key}
                                                    htmlFor={`priv-${key}`}
                                                    className="flex items-start gap-4 py-4 px-3 rounded-xl cursor-pointer border-b last:border-0 hover:bg-stone-50 transition-colors"
                                                    style={{ borderColor: "#F5F1ED" }}
                                                >
                                                    <div className="mt-0.5">
                                                        <AnimatedCheckbox
                                                            id={`priv-${key}`}
                                                            checked={privacy[key]}
                                                            onChange={v => setPrivacy(p => ({ ...p, [key]: v }))}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold" style={{ color: "#2C241B" }}>{label}</p>
                                                        <p className="text-xs mt-0.5" style={{ color: "#8B8680" }}>{desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        <div className="mt-8">
                                            <motion.button
                                                onClick={savePrivacy}
                                                disabled={privacySaving}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                                                style={{ background: "#A2466B" }}
                                            >
                                                {privacySaving ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}
                                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                                ) : <Check size={16} />}
                                                {privacySaving ? "Saving…" : "Save Privacy Settings"}
                                            </motion.button>
                                        </div>
                                    </div>
                                )}

                                {/* ── DANGER ZONE ── */}
                                {activeSection === "Danger Zone" && (
                                    <div className="bg-white rounded-2xl border p-6 md:p-8" style={{ borderColor: "#E8E4DF" }}>
                                        <h2 className="text-xl font-semibold mb-1" style={{ color: "#2C241B" }}>Danger Zone</h2>
                                        <p className="text-sm mb-8" style={{ color: "#8B8680" }}>Irreversible actions — please proceed with caution</p>

                                        <div className="space-y-4">
                                            {/* Sign out all devices */}
                                            <div className="flex items-start justify-between gap-4 p-5 rounded-xl border" style={{ borderColor: "#E8E4DF" }}>
                                                <div>
                                                    <p className="font-medium text-sm" style={{ color: "#2C241B" }}>Sign out of all devices</p>
                                                    <p className="text-xs mt-0.5" style={{ color: "#8B8680" }}>Remove all active sessions except this one</p>
                                                </div>
                                                <motion.button
                                                    onClick={handleLogout}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition"
                                                    style={{ borderColor: "#E8E4DF", color: "#2C241B" }}
                                                >
                                                    Sign Out
                                                </motion.button>
                                            </div>

                                            {/* Delete account */}
                                            <div className="flex items-start justify-between gap-4 p-5 rounded-xl border bg-red-50" style={{ borderColor: "#FCA5A5" }}>
                                                <div>
                                                    <p className="font-semibold text-sm text-red-700">Delete Account</p>
                                                    <p className="text-xs mt-0.5 text-red-600">
                                                        Permanently delete your account and all data. This cannot be undone.
                                                    </p>
                                                </div>
                                                <motion.button
                                                    onClick={handleDeleteAccount}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* Account info callout */}
                                        <div className="mt-6 p-4 rounded-xl" style={{ background: "#FFFBF0", border: "1px solid #EBD97A" }}>
                                            <p className="text-xs font-semibold mb-1" style={{ color: "#B8960C" }}>Logged in as</p>
                                            <p className="text-sm font-medium" style={{ color: "#2C241B" }}>{user?.name}</p>
                                            <p className="text-xs" style={{ color: "#8B8680" }}>{user?.email}</p>
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
