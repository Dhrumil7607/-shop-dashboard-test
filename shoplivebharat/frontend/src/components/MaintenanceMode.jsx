import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function MaintenanceMode() {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const { isAdmin } = useAuth();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    useEffect(() => {
        // Check maintenance mode on mount and every 5 seconds
        const checkMaintenance = () => {
            try {
                const settings = JSON.parse(
                    localStorage.getItem("slb_admin_settings") || "{}"
                );
                setIsMaintenanceMode(settings.maintenanceMode === true);
            } catch {
                setIsMaintenanceMode(false);
            }
        };

        checkMaintenance();

        // Check every 5 seconds
        const interval = setInterval(checkMaintenance, 5000);

        return () => clearInterval(interval);
    }, []);

    // Don't show maintenance mode if:
    // 1. Maintenance mode is off
    // 2. User is admin and on admin route
    // 3. User is on admin login page
    if (!isMaintenanceMode) {
        return null; // Don't show anything if not in maintenance mode
    }

    // Allow admin access to admin routes
    if (isAdmin && currentPath.startsWith('/admin')) {
        return null;
    }

    // Allow access to admin login
    if (currentPath === '/admin/login') {
        return null;
    }

    // Show maintenance mode page for all other routes
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center z-50">
            <div className="text-center px-6 py-12">
                <div className="flex justify-center mb-6">
                    <div className="bg-red-500/20 p-6 rounded-full">
                        <AlertTriangle size={64} className="text-red-500" />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    We'll Be Right Back
                </h1>

                <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto">
                    ShopLiveBharat is currently under maintenance. We're working hard to
                    serve you better. Please check back soon!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => {
                            // Copy email to clipboard
                            navigator.clipboard.writeText("support@shoplivebharat.com");
                            alert("Email copied to clipboard!");
                        }}
                        className="px-8 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
                    >
                        Contact Support
                    </button>
                </div>

                <div className="mt-12 text-gray-400 text-sm">
                    <p>Expected to be back online shortly</p>
                    <p className="mt-2">Questions? Email us at support@shoplivebharat.com</p>
                </div>

                {/* Admin-only bypass */}
                <div className="mt-12 pt-8 border-t border-gray-700">
                    <p className="text-gray-500 text-xs mb-2">Admin Access</p>
                    <button
                        onClick={() => (window.location.href = "/admin/login")}
                        className="text-gray-400 hover:text-gray-300 text-sm transition"
                    >
                        Go to Admin Panel
                    </button>
                </div>
            </div>
        </div>
    );
}
