import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Heart, ShoppingBag, UserCircle } from "lucide-react";

/**
 * Admin layout — matches the reference screenshot exactly:
 * - Same cream/ivory background as storefront
 * - Top navigation bar (logo + nav links + Admin + Logout)
 * - "ADMIN CONSOLE" label + "Welcome, Admin" heading
 * - Horizontal tab bar: Dashboard | Sellers | Products | Orders | Coupons
 * - No sidebar
 */

const NAV_TABS = [
    { label: "Dashboard",  path: "/admin/dashboard" },
    { label: "Sellers",    path: "/admin/seller-applications" },
    { label: "Products",   path: "/admin/products" },
    { label: "Orders",     path: "/admin/orders" },
    { label: "Coupons",    path: "/admin/settings" },
];

export default function AdminLayout({ children }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    const activeTab = NAV_TABS.find(t => location.pathname.startsWith(t.path));

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>

            {/* ── Top nav bar (matches storefront style) ── */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                            <path d="M12 10 Q12 3 24 3 Q36 3 36 10" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            <rect x="10" y="10" width="28" height="32" rx="2" stroke="#1a1a1a" strokeWidth="2" fill="none" />
                            <polygon points="21,17 21,31 33,24" fill="#FF9500" />
                        </svg>
                        <div className="leading-none">
                            <span className="font-bold text-sm text-[#1a1a1a] tracking-tight">ShopLive</span>
                            <span className="font-bold text-sm tracking-tight" style={{ color: "#C9A84C" }}>Bharat</span>
                            <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-medium mt-0.5">Indian Luxury, Worldwide</p>
                        </div>
                    </Link>

                    {/* Center nav links */}
                    <nav className="hidden md:flex items-center gap-7 text-sm">
                        {["Collections", "Stores", "How It Works", "About"].map(label => (
                            <Link key={label} to="/" className="text-gray-600 hover:text-[#1a1a1a] transition font-medium">
                                {label}
                            </Link>
                        ))}
                        <Link to="/become-a-seller" className="flex items-center gap-1.5 text-gray-600 hover:text-[#1a1a1a] transition font-medium">
                            <span className="text-[#C9A84C]">✦</span> Become a Seller
                        </Link>
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-500 hover:text-[#1a1a1a] transition" aria-label="Search">
                            <Search size={18} />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-[#1a1a1a] transition" aria-label="Wishlist">
                            <Heart size={18} />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-[#1a1a1a] transition" aria-label="Cart">
                            <ShoppingBag size={18} />
                        </button>
                        <Link to="/admin/dashboard"
                            className="px-3.5 py-1.5 bg-[#1a1a1a] text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition">
                            Admin
                        </Link>
                        <button onClick={handleLogout}
                            className="px-3.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Page hero (dark band) ── */}
            <div className="bg-[#1a1a1a] text-white py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold mb-1.5">
                        Admin Console
                    </p>
                    <h1 className="font-serif text-3xl md:text-4xl text-white">Welcome, Admin</h1>
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-0.5">
                        {NAV_TABS.map(tab => {
                            const isActive = location.pathname === tab.path ||
                                (tab.path === "/admin/seller-applications" && location.pathname === "/admin/shops");
                            return (
                                <Link key={tab.path} to={tab.path}
                                    className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                                        isActive
                                            ? "border-[#1a1a1a] text-[#1a1a1a]"
                                            : "border-transparent text-gray-500 hover:text-[#1a1a1a] hover:border-gray-300"
                                    }`}>
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Page content ── */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
