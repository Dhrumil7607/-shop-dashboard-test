import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLogin() {
    const navigate = useNavigate();
    const { loginAdmin } = useAuth();
    const [adminId, setAdminId] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log("📝 Admin login attempt with ID:", adminId);
            
            if (!adminId.trim() || !password.trim()) {
                toast.error("Please enter both Admin ID and Password");
                setLoading(false);
                return;
            }

            // Default credentials - can be changed via admin settings
            const DEFAULT_ADMIN_ID = "admin";
            const DEFAULT_PASSWORD = "admin123";

            console.log("🔐 Checking credentials:", {
                entered: adminId,
                expected: DEFAULT_ADMIN_ID,
                match: adminId === DEFAULT_ADMIN_ID
            });

            if (adminId === DEFAULT_ADMIN_ID && password === DEFAULT_PASSWORD) {
                console.log("✅ Credentials matched, storing admin key");
                // Use the stored admin key for API calls
                await loginAdmin("shoplivebharat-admin");
                toast.success("✅ Admin access granted!");
                navigate("/admin/dashboard");
            } else {
                console.error("❌ Credentials don't match");
                toast.error("Invalid Admin ID or Password");
            }
        } catch (error) {
            console.error("❌ Login error:", error);
            toast.error(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ivory text-espresso flex items-center justify-center px-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-serif text-4xl mb-2">ShopLiveBharat</h1>
                    <p className="text-maroon text-sm tracking-widest uppercase">Admin Portal</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-maroon mb-2">
                            Admin ID
                        </label>
                        <input
                            type="text"
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
                            placeholder="Enter your admin ID"
                            className="w-full px-4 py-3 rounded-lg border border-line-soft bg-white focus:border-maroon outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-maroon mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 rounded-lg border border-line-soft bg-white focus:border-maroon outline-none transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-espresso text-ivory rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Access Admin Panel"}
                    </button>
                </form>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-maroon/5 rounded-lg text-center">
                    <p className="text-xs text-espresso/70 mb-2">Demo Credentials:</p>
                    <p className="text-sm font-mono text-espresso">ID: <strong>admin</strong></p>
                    <p className="text-sm font-mono text-espresso">Password: <strong>admin123</strong></p>
                    <p className="text-xs text-espresso/60 mt-3">Change credentials in Settings</p>
                </div>
            </div>
        </div>
    );
}
