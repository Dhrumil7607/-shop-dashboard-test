import { useState, useEffect, useCallback } from "react";
import { Save, AlertCircle, Plus, X, GripVertical } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import { adminChangePassword, api, getAdminSettings, updateAdminSettings } from "@/lib/api";
import { toast } from "sonner";

const DEFAULT_SETTINGS = {
    storeName: "ShopLive Bharat",
    storeEmail: "support@shoplivebharat.com",
    storePhone: "+91 98765 43210",
    storeLocation: "Worldwide",
    shippingCost: "Free shipping above the threshold",
    platformFeePct: 12,
    freeShippingThreshold: 15000,
    domesticFlat: 499,
    videoCallRate: 2999,
    videoCallCredit: "₹500 on purchase",
    maintenanceMode: false,
    enableNewsletter: true,
    enableLiveChat: true,
    maxProductsPerPage: 12,
    defaultCurrency: "INR",
};

const ADMIN_KEY = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";

export default function AdminSettings() {
    const [settings, setSettings] = useState(() => {
        // Load from localStorage or use defaults
        try {
            const saved = localStorage.getItem("slb_admin_settings");
            return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
        } catch (error) {
            console.error("Error loading settings:", error);
            return DEFAULT_SETTINGS;
        }
    });

    const [isSaving, setIsSaving] = useState(false);

    // Load the persisted global settings from the backend on mount.
    useEffect(() => {
        getAdminSettings(ADMIN_KEY).then((s) => {
            if (!s || !Object.keys(s).length) return;
            setSettings(prev => ({
                ...prev,
                storeName: s.store_name ?? prev.storeName,
                storeEmail: s.store_email ?? prev.storeEmail,
                storePhone: s.store_phone ?? prev.storePhone,
                storeLocation: s.store_location ?? prev.storeLocation,
                defaultCurrency: s.default_currency ?? prev.defaultCurrency,
                shippingCost: s.shipping_policy ?? prev.shippingCost,
                platformFeePct: s.platform_fee_rate != null ? Math.round(s.platform_fee_rate * 100) : prev.platformFeePct,
                freeShippingThreshold: s.free_shipping_threshold ?? prev.freeShippingThreshold,
                domesticFlat: s.domestic_flat ?? prev.domesticFlat,
                videoCallRate: s.video_call_rate ?? prev.videoCallRate,
            }));
        }).catch(() => {});
    }, []);

    // Ensure maintenance mode is explicitly false on load
    useEffect(() => {
        if (settings.maintenanceMode === undefined || settings.maintenanceMode === null) {
            setSettings(prev => ({
                ...prev,
                maintenanceMode: false
            }));
        }
    }, [settings.maintenanceMode]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({
            ...settings,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Persist the global settings to the backend (drives fees + shipping site-wide).
            await updateAdminSettings({
                store_name: settings.storeName,
                store_email: settings.storeEmail,
                store_phone: settings.storePhone,
                store_location: settings.storeLocation,
                default_currency: settings.defaultCurrency,
                shipping_policy: settings.shippingCost,
                platform_fee_rate: (Number(settings.platformFeePct) || 0) / 100,
                free_shipping_threshold: Number(settings.freeShippingThreshold) || 0,
                domestic_flat: Number(settings.domesticFlat) || 0,
                video_call_rate: Number(settings.videoCallRate) || 0,
            }, ADMIN_KEY);
            // UI-only toggles stay local.
            localStorage.setItem("slb_admin_settings", JSON.stringify(settings));
            toast.success("Settings saved and applied site-wide!");
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-espresso">Settings</h1>
                    <button
                        type="submit"
                        form="settings-form"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition disabled:opacity-50"
                    >
                        <Save size={20} />
                        {isSaving ? "Saving..." : "Save Settings"}
                    </button>
                </div>

                <form id="settings-form" onSubmit={handleSave} className="space-y-8">
                    {/* Store Information */}
                    <div className="bg-white rounded-lg border border-line-soft p-8">
                        <h2 className="text-2xl font-bold text-espresso mb-6">Store Information</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Store Name
                                </label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={settings.storeName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Store Email
                                </label>
                                <input
                                    type="email"
                                    name="storeEmail"
                                    value={settings.storeEmail}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Store Phone
                                </label>
                                <input
                                    type="tel"
                                    name="storePhone"
                                    value={settings.storePhone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Store Location
                                </label>
                                <input
                                    type="text"
                                    name="storeLocation"
                                    value={settings.storeLocation}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Shipping & Pricing */}
                    <div className="bg-white rounded-lg border border-line-soft p-8">
                        <h2 className="text-2xl font-bold text-espresso mb-6">Shipping & Pricing</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Platform Fee (%)
                                </label>
                                <input
                                    type="number" min="0" max="90" step="any"
                                    name="platformFeePct"
                                    value={settings.platformFeePct}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                                <p className="text-xs mt-1 text-espresso/60">
                                    Commission taken per product sold. The ShopLive Bharat main store is exempt (0%).
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Free Shipping Above (₹)
                                </label>
                                <input
                                    type="number" min="0" step="any"
                                    name="freeShippingThreshold"
                                    value={settings.freeShippingThreshold}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                                <p className="text-xs mt-1 text-espresso/60">
                                    India orders at or above this subtotal ship free.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Domestic Flat Shipping (₹)
                                </label>
                                <input
                                    type="number" min="0" step="any"
                                    name="domesticFlat"
                                    value={settings.domesticFlat}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                                <p className="text-xs mt-1 text-espresso/60">
                                    India shipping charged below the free-shipping threshold.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Default Currency
                                </label>
                                <select
                                    name="defaultCurrency"
                                    value={settings.defaultCurrency}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="CAD">CAD (C$)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Video Call Rate (₹)
                                </label>
                                <input
                                    type="number" min="0" step="any"
                                    name="videoCallRate"
                                    value={settings.videoCallRate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Shipping Policy (display text)
                                </label>
                                <input
                                    type="text"
                                    name="shippingCost"
                                    value={settings.shippingCost}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Display Settings */}
                    <div className="bg-white rounded-lg border border-line-soft p-8">
                        <h2 className="text-2xl font-bold text-espresso mb-6">Display Settings</h2>
                        
                        <div>
                            <label className="block text-sm font-semibold text-espresso mb-4">
                                Products Per Page
                            </label>
                            <select
                                name="maxProductsPerPage"
                                value={settings.maxProductsPerPage}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                            >
                                <option value={6}>6 Products</option>
                                <option value={12}>12 Products</option>
                                <option value={24}>24 Products</option>
                                <option value={48}>48 Products</option>
                            </select>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="bg-white rounded-lg border border-line-soft p-8">
                        <h2 className="text-2xl font-bold text-espresso mb-6">Features</h2>
                        
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-line-soft rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    name="enableNewsletter"
                                    checked={settings.enableNewsletter}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 accent-maroon cursor-pointer"
                                />
                                <div>
                                    <p className="font-semibold text-espresso">Enable Newsletter Signup</p>
                                    <p className="text-sm text-espresso/60">Allow customers to subscribe to newsletters</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer p-3 border border-line-soft rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    name="enableLiveChat"
                                    checked={settings.enableLiveChat}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 accent-maroon cursor-pointer"
                                />
                                <div>
                                    <p className="font-semibold text-espresso">Enable Live Chat</p>
                                    <p className="text-sm text-espresso/60">Enable real-time customer support</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Admin Credentials */}
                    <div className="bg-white rounded-lg border border-line-soft p-8">
                        <h2 className="text-2xl font-bold text-espresso mb-4">Admin Credentials</h2>
                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-blue-800">
                                Admin credentials are managed securely on the backend. To change your admin password or username, please update them directly through the server configuration or contact your system administrator.
                            </p>
                        </div>
                    </div>

                    {/* System Settings */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h1 className="text-2xl font-bold text-amber-900 mb-2">System Settings</h1>
                                <p className="text-sm text-amber-800">Dangerous operations - use with caution</p>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition">
                            <input
                                type="checkbox"
                                name="maintenanceMode"
                                checked={settings.maintenanceMode === true}
                                onChange={handleInputChange}
                                className="w-4 h-4 accent-amber-600 cursor-pointer"
                            />
                            <div className="flex-grow">
                                <p className="font-semibold text-amber-900">Maintenance Mode</p>
                                <p className="text-sm text-amber-700">Disable storefront during maintenance</p>
                            </div>
                        </label>

        {settings.maintenanceMode && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSettings(prev => ({ ...prev, maintenanceMode: false }));
                                    toast.info("Maintenance mode disabled — click Save to confirm");
                                }}
                                className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                                ⚠️ Disable Maintenance Mode Now
                            </button>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-6 py-3 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {isSaving ? "Saving..." : "Save All Settings"}
                        </button>
                    </div>
                </form>

                {/* ── ADMIN ACCOUNT SECURITY ─────────────────────────────── */}
                <div className="mt-8">
                    <ChangePasswordCard submitFn={(cur, next) => adminChangePassword(cur, next)} />
                </div>

                {/* ── HOMEPAGE TICKER ──────────────────────────────────────── */}
                <TickerSettings />
            </div>
        </AdminLayout>
    );
}

function TickerSettings() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";

    const load = useCallback(() => {
        api.get("/ticker").then(res => {
            setItems(res.data?.items || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        const filtered = items.filter(i => i.trim());
        if (filtered.length === 0) { toast.error("Add at least one ticker item"); return; }
        setSaving(true);
        try {
            await api.put("/admin/ticker", { items: filtered }, { headers: { "X-Admin-Key": adminKey } });
            toast.success("Ticker updated — visible on the homepage now");
            setItems(filtered);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Could not save ticker");
        } finally { setSaving(false); }
    };

    const add = () => setItems(prev => [...prev, ""]);
    const remove = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
    const update = (idx, val) => setItems(prev => prev.map((item, i) => i === idx ? val : item));

    if (loading) return null;

    return (
        <div className="mt-8 rounded-2xl border p-6" style={{ borderColor: "#E8E4DF", background: "white" }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>Homepage Ticker</h3>
                    <p className="text-xs" style={{ color: "#9B8B7A" }}>The scrolling marquee banner below the hero. Edit the messages customers see.</p>
                </div>
                <button onClick={add} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
                    <Plus size={13} /> Add Item
                </button>
            </div>
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <GripVertical size={14} style={{ color: "#C4B9AE", flexShrink: 0 }} />
                        <input
                            value={item}
                            onChange={e => update(idx, e.target.value)}
                            placeholder="e.g. FREE WORLDWIDE SHIPPING OVER ₹15,000"
                            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none uppercase"
                            style={{ borderColor: "#E8E4DF", letterSpacing: "0.05em" }}
                        />
                        <button onClick={() => remove(idx)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "#C0392B" }}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-sm py-3" style={{ color: "#9B8B7A" }}>No ticker items. Add one to display the marquee banner.</p>
                )}
            </div>
            <button onClick={save} disabled={saving}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "#1a1a1a", opacity: saving ? 0.6 : 1 }}>
                <Save size={14} /> {saving ? "Saving…" : "Save Ticker"}
            </button>
        </div>
    );
}
