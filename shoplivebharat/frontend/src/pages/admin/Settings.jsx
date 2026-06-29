import { useState } from "react";
import { Save, AlertCircle } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { toast } from "sonner";

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        storeName: "ShopLiveBharat",
        storeEmail: "support@shoplivebharat.com",
        storePhone: "+91 98765 43210",
        storeLocation: "Worldwide",
        shippingCost: "Free above ₹5,000",
        videoCallRate: "₹1,500",
        videoCallCredit: "₹500 on purchase",
        maintenanceMode: false,
        enableNewsletter: true,
        enableLiveChat: true,
        maxProductsPerPage: 12,
        defaultCurrency: "INR",
        adminId: "admin",
        adminPassword: "admin123",
        confirmPassword: "admin123"
    });

    const [isSaving, setIsSaving] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);

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
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success("Settings saved successfully!");
        } catch (error) {
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
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition disabled:opacity-50"
                    >
                        <Save size={20} />
                        {isSaving ? "Saving..." : "Save Settings"}
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
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
                                    Shipping Policy
                                </label>
                                <input
                                    type="text"
                                    name="shippingCost"
                                    value={settings.shippingCost}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
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
                                    Video Call Rate
                                </label>
                                <input
                                    type="text"
                                    name="videoCallRate"
                                    value={settings.videoCallRate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Video Call Purchase Credit
                                </label>
                                <input
                                    type="text"
                                    name="videoCallCredit"
                                    value={settings.videoCallCredit}
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
                        <h2 className="text-2xl font-bold text-espresso mb-6">Admin Credentials</h2>
                        <p className="text-sm text-espresso/60 mb-6">Change your login credentials here</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Admin ID
                                </label>
                                <input
                                    type="text"
                                    name="adminId"
                                    value={settings.adminId}
                                    onChange={(e) => {
                                        setSettings({ ...settings, adminId: e.target.value });
                                        setPasswordChanged(true);
                                    }}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                    placeholder="Enter admin ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    name="adminPassword"
                                    value={settings.adminPassword}
                                    onChange={(e) => {
                                        setSettings({ ...settings, adminPassword: e.target.value });
                                        setPasswordChanged(true);
                                    }}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-espresso mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={settings.confirmPassword}
                                    onChange={(e) => {
                                        setSettings({ ...settings, confirmPassword: e.target.value });
                                        setPasswordChanged(true);
                                    }}
                                    className="w-full px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>

                        {passwordChanged && settings.adminPassword !== settings.confirmPassword && (
                            <p className="text-red-600 text-sm mt-3">⚠️ Passwords do not match</p>
                        )}
                        {passwordChanged && settings.adminPassword === settings.confirmPassword && settings.adminPassword.length > 0 && (
                            <p className="text-green-600 text-sm mt-3">✓ Passwords match</p>
                        )}
                    </div>

                    {/* System Settings */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h2 className="text-2xl font-bold text-amber-900 mb-2">System Settings</h2>
                                <p className="text-sm text-amber-800">Dangerous operations - use with caution</p>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-amber-200 rounded-lg hover:bg-amber-50 transition">
                            <input
                                type="checkbox"
                                name="maintenanceMode"
                                checked={settings.maintenanceMode}
                                onChange={handleInputChange}
                                className="w-4 h-4 accent-amber-600 cursor-pointer"
                            />
                            <div>
                                <p className="font-semibold text-amber-900">Maintenance Mode</p>
                                <p className="text-sm text-amber-700">Disable storefront during maintenance</p>
                            </div>
                        </label>
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
            </div>
        </AdminLayout>
    );
}
