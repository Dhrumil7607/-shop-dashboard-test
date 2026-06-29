import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Search, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

export default function MarketplaceLayout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const accountRef = useRef(null);
    const navigate = useNavigate();
    const { getTotalItems } = useCart();
    const { isLoggedIn, user, logout } = useAuth();
    const cartCount = getTotalItems();

    // Close account dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) {
                setAccountMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
            setMobileMenuOpen(false);
        }
    };

    const navLinks = [
        { label: "Home", to: "/" },
        { label: "Shop", to: "/marketplace" },
        { label: "Collections", to: "/shops" },
        { label: "Become a Seller", to: "/become-a-seller", highlight: true },
    ];

    return (
        <div className="min-h-screen bg-ivory text-espresso flex flex-col">

            {/* ── HEADER ── */}
            <header className="sticky top-0 z-40 bg-[#0a0a0a] text-white border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                        <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true"
                            className="group-hover:scale-105 transition-transform duration-200">
                            <path d="M12 10 Q12 3 24 3 Q36 3 36 10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            <rect x="10" y="10" width="28" height="32" rx="2" stroke="white" strokeWidth="2" fill="none" />
                            <polygon points="21,17 21,31 33,24" fill="#FF9500" />
                        </svg>
                        <div className="flex flex-col leading-none">
                            <span className="font-bold text-sm tracking-tight text-white">ShopLiveBharat</span>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-medium">Indian Luxury, Worldwide</span>
                        </div>
                    </Link>

                    {/* Desktop search */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
                        <div className="flex w-full border border-white/20 rounded-lg overflow-hidden bg-white/5">
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search for sarees, lehengas…"
                                className="flex-1 px-4 py-2 bg-transparent text-white placeholder-white/40 text-sm outline-none"
                            />
                            <button type="submit" className="px-3 text-white/60 hover:text-white transition">
                                <Search size={16} />
                            </button>
                        </div>
                    </form>

                    {/* Nav links – desktop */}
                    <nav className="hidden lg:flex items-center gap-6 text-sm">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`font-medium transition-colors ${
                                    link.highlight
                                        ? "text-champagne hover:text-champagne/80"
                                        : "text-white/80 hover:text-white"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Cart */}
                        <Link to="/cart" className="relative p-2 text-white/70 hover:text-white transition" aria-label="Cart">
                            <ShoppingCart size={20} />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-maroon text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Account */}
                        <div ref={accountRef} className="relative">
                            <button
                                onClick={() => setAccountMenuOpen(v => !v)}
                                className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition"
                                aria-expanded={accountMenuOpen}
                            >
                                {isLoggedIn ? (
                                    <>
                                        <div className="w-7 h-7 bg-maroon rounded-full flex items-center justify-center text-xs font-bold text-white">
                                            {(user?.name || "U")[0].toUpperCase()}
                                        </div>
                                        <span className="hidden sm:block">{user?.name?.split(" ")[0]}</span>
                                        <ChevronDown size={14} className={`transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
                                    </>
                                ) : (
                                    <>
                                        <User size={18} />
                                        <span className="hidden sm:block">Login</span>
                                    </>
                                )}
                            </button>

                            {accountMenuOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-white border border-line-soft rounded-xl shadow-xl z-50 py-1">
                                    {isLoggedIn ? (
                                        <>
                                            <div className="px-4 py-3 border-b border-line-soft">
                                                <p className="text-sm font-semibold text-espresso truncate">{user?.name}</p>
                                                <p className="text-xs text-espresso/50 truncate">{user?.email}</p>
                                            </div>
                                            <Link to="/account" onClick={() => setAccountMenuOpen(false)}
                                                className="block px-4 py-2.5 text-sm text-espresso hover:bg-gray-50 transition">
                                                My Account
                                            </Link>
                                            <Link to="/orders" onClick={() => setAccountMenuOpen(false)}
                                                className="block px-4 py-2.5 text-sm text-espresso hover:bg-gray-50 transition">
                                                My Orders
                                            </Link>
                                            <Link to="/become-a-seller" onClick={() => setAccountMenuOpen(false)}
                                                className="block px-4 py-2.5 text-sm text-maroon font-semibold hover:bg-gray-50 transition">
                                                Become a Seller
                                            </Link>
                                            <div className="border-t border-line-soft mt-1">
                                                <button onClick={() => { logout(); setAccountMenuOpen(false); navigate("/"); }}
                                                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                                                    <LogOut size={14} /> Logout
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/login" onClick={() => setAccountMenuOpen(false)}
                                                className="block px-4 py-2.5 text-sm text-espresso hover:bg-gray-50 transition">
                                                Login
                                            </Link>
                                            <Link to="/register" onClick={() => setAccountMenuOpen(false)}
                                                className="block px-4 py-2.5 text-sm text-maroon font-semibold hover:bg-gray-50 transition">
                                                Create Account
                                            </Link>
                                            <div className="border-t border-line-soft">
                                                <Link to="/become-a-seller" onClick={() => setAccountMenuOpen(false)}
                                                    className="block px-4 py-2.5 text-sm text-champagne font-semibold hover:bg-gray-50 transition">
                                                    Register Your Store
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(v => !v)}
                            className="lg:hidden p-2 text-white/70 hover:text-white transition"
                            aria-label="Menu"
                        >
                            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-white/10 bg-[#111] px-6 py-5 space-y-4">
                        <form onSubmit={handleSearch} className="mb-2">
                            <div className="flex items-center border border-white/20 rounded-lg overflow-hidden bg-white/5">
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search…"
                                    className="flex-1 px-4 py-2 bg-transparent text-white placeholder-white/40 text-sm outline-none"
                                />
                                <button type="submit" className="px-3 text-white/60"><Search size={16} /></button>
                            </div>
                        </form>
                        {navLinks.map(link => (
                            <Link key={link.to} to={link.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block text-sm font-medium py-1 ${link.highlight ? "text-champagne" : "text-white/80"}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="border-t border-white/10 pt-4 space-y-3">
                            {isLoggedIn ? (
                                <>
                                    <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70">My Account</Link>
                                    <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70">My Orders</Link>
                                    <button onClick={() => { logout(); setMobileMenuOpen(false); navigate("/"); }} className="block text-sm text-red-400">Logout</button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70">Login</Link>
                                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70">Create Account</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* ── PAGE CONTENT ── */}
            <main className="flex-1">
                {children}
            </main>

            {/* ── FOOTER ── */}
            <Footer />
        </div>
    );
}
