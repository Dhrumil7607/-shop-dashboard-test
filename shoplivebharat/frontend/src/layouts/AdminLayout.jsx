import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Menu, X, Store, Settings, Users, Package, Home, Bell, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({ children }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { icon: Home, label: "Dashboard", path: "/admin/dashboard" },
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: Store, label: "Shops", path: "/admin/shops" },
        { icon: Users, label: "Orders", path: "/admin/orders" },
        { icon: Settings, label: "Settings", path: "/admin/settings" },
    ];

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div
                className={`fixed md:static top-0 left-0 h-screen bg-espresso text-ivory transition-all duration-300 z-40 ${
                    sidebarOpen ? "w-64" : "w-20"
                } md:translate-x-0 overflow-y-auto`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-maroon sticky top-0 bg-espresso">
                    <Link to="/" className="font-serif text-xl font-bold">
                        {sidebarOpen ? "ShopLiveBharat" : "SLB"}
                    </Link>
                </div>

                {/* Menu */}
                <nav className="py-6">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-6 py-3 transition border-r-4 ${
                                    isActive(item.path)
                                        ? "bg-maroon border-maroon"
                                        : "border-transparent hover:bg-opacity-80"
                                }`}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-maroon bg-espresso/95">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-maroon transition"
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="px-6 py-4 flex items-center justify-between">
                        {/* Left: Hamburger + Search */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition hidden md:flex"
                            >
                                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>

                            {/* Search Bar */}
                            <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 flex-1 max-w-md">
                                <Search size={18} className="text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search products, shops..."
                                    className="flex-1 bg-transparent outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-6">
                            {/* Notifications */}
                            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                                <Bell size={20} />
                                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* User Menu */}
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-maroon rounded-full flex items-center justify-center text-white font-bold">
                                    A
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-medium text-espresso">Admin</p>
                                    <p className="text-xs text-gray-500">Shop Manager</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breadcrumb / Page Title Bar */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <div>
                            <h1 className="font-semibold text-gray-800">
                                {menuItems.find((item) => isActive(item.path))?.label || "Admin Dashboard"}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {new Date().toLocaleDateString("en-IN", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </p>
                        </div>
                        <Link
                            to="/"
                            className="px-4 py-2 bg-ivory text-espresso rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                        >
                            View Store
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 md:p-8">
                    {children}
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
