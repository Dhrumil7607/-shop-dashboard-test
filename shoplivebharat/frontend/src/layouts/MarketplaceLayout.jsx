import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Search, Phone, MapPin, LogOut } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

export default function MarketplaceLayout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { getTotalItems } = useCart();
    const { isLoggedIn, user, logout } = useAuth();
    const cartCount = getTotalItems();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
        }
    };

    return (
        <div className="min-h-screen bg-ivory text-espresso flex flex-col">
            {/* Top Bar */}
            <div className="hidden md:flex bg-espresso text-ivory text-sm justify-between items-center gap-8 py-3 px-6">
                <div className="flex gap-8">
                    <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-maroon transition">
                        <Phone size={14} />
                        +91 98765 43210
                    </a>
                    <a href="mailto:support@shoplivebharat.com" className="hover:text-maroon transition">
                        support@shoplivebharat.com
                    </a>
                    <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        Worldwide Shipping
                    </div>
                </div>
                
                {/* Currency Selector */}
                <div className="flex items-center gap-3">
                    <span className="text-xs opacity-75">Currency:</span>
                    <select className="bg-espresso text-ivory border border-ivory/30 rounded px-2 py-1 text-xs hover:border-ivory transition cursor-pointer">
                        <option value="INR">₹ INR</option>
                        <option value="USD">$ USD</option>
                        <option value="CAD">C$ CAD</option>
                    </select>
                </div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-ivory border-b border-line-soft">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    {/* Top Row - Logo & Actions */}
                    <div className="flex items-center justify-between mb-4">
                        {/* Logo */}
                        <Logo />

                        {/* Search Bar - Desktop */}
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-8">
                            <div className="w-full max-w-sm flex items-center border border-line-soft rounded-lg overflow-hidden">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="flex-1 px-4 py-2 outline-none text-sm"
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-2 hover:bg-gray-100 transition"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </form>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link
                                to="/contact"
                                className="text-sm hover:text-maroon transition font-medium"
                            >
                                Support
                            </Link>
                            <Link
                                to="/cart"
                                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                                title="Shopping Cart"
                            >
                                <ShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 h-5 w-5 bg-maroon text-ivory text-xs rounded-full flex items-center justify-center font-bold">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* Account Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    title="Account"
                                >
                                    <User size={20} />
                                </button>

                                {/* Account Dropdown */}
                                {accountMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-line-soft rounded-lg shadow-lg z-50">
                                        {isLoggedIn ? (
                                            <>
                                                <div className="px-4 py-3 border-b border-line-soft">
                                                    <p className="text-sm font-medium text-espresso">
                                                        {user?.name || "Account"}
                                                    </p>
                                                    <p className="text-xs text-espresso/60">
                                                        {user?.email}
                                                    </p>
                                                </div>
                                                <Link
                                                    to="/account"
                                                    className="block px-4 py-2 text-sm text-espresso hover:bg-gray-50 transition"
                                                    onClick={() => setAccountMenuOpen(false)}
                                                >
                                                    My Account
                                                </Link>
                                                <Link
                                                    to="/orders"
                                                    className="block px-4 py-2 text-sm text-espresso hover:bg-gray-50 transition"
                                                    onClick={() => setAccountMenuOpen(false)}
                                                >
                                                    My Orders
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        logout();
                                                        setAccountMenuOpen(false);
                                                        navigate("/");
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-maroon hover:bg-gray-50 transition flex items-center gap-2"
                                                >
                                                    <LogOut size={16} />
                                                    Logout
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link
                                                    to="/login"
                                                    className="block px-4 py-2 text-sm text-espresso hover:bg-gray-50 transition"
                                                    onClick={() => setAccountMenuOpen(false)}
                                                >
                                                    Login
                                                </Link>
                                                <Link
                                                    to="/register"
                                                    className="block px-4 py-2 text-sm text-maroon font-medium hover:bg-gray-50 transition"
                                                    onClick={() => setAccountMenuOpen(false)}
                                                >
                                                    Create Account
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 ml-4"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Navigation Row */}
                    <nav className="hidden md:flex items-center gap-10 pb-2 border-t border-line-soft/50 pt-4">
                        <Link to="/" className="hover:text-maroon transition font-medium text-sm">
                            Home
                        </Link>
                        <Link
                            to="/marketplace"
                            className="hover:text-maroon transition font-medium text-sm"
                        >
                            Buy
                        </Link>
                        <Link
                            to="/live-shopping"
                            className="hover:text-maroon transition font-medium text-sm"
                        >
                            Live Premium Stores
                        </Link>
                        <Link
                            to="/partner-stores"
                            className="hover:text-maroon transition font-medium text-sm"
                        >
                            Partner Stores
                        </Link>
                        <div className="flex-1"></div>
                        <span className="text-xs uppercase tracking-widest text-maroon font-semibold">
                            Worldwide Shipping • Free on orders above ₹5,000
                        </span>
                    </nav>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-line-soft py-4 px-6 space-y-4">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="mb-4">
                            <div className="flex items-center border border-line-soft rounded-lg overflow-hidden">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="flex-1 px-4 py-2 outline-none text-sm"
                                />
                                <button type="submit" className="px-3 py-2 hover:bg-gray-100">
                                    <Search size={18} />
                                </button>
                            </div>
                        </form>

                        {/* Mobile Navigation */}
                        <Link 
                            to="/" 
                            className="block hover:text-maroon transition font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link 
                            to="/marketplace" 
                            className="block hover:text-maroon transition font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Buy
                        </Link>
                        <Link 
                            to="/live-shopping" 
                            className="block hover:text-maroon transition font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Live Premium Stores
                        </Link>
                        <Link 
                            to="/partner-stores" 
                            className="block hover:text-maroon transition font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Partner Stores
                        </Link>
                        <Link 
                            to="/contact" 
                            className="block hover:text-maroon transition font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Contact
                        </Link>
                        <Link 
                            to="/cart" 
                            className="block hover:text-maroon transition font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Cart {cartCount > 0 && `(${cartCount})`}
                        </Link>

                        {/* Mobile Account Links */}
                        <div className="pt-4 border-t border-line-soft">
                            {isLoggedIn ? (
                                <>
                                    <p className="text-sm font-medium text-espresso mb-2">
                                        {user?.name || "Account"}
                                    </p>
                                    <Link 
                                        to="/account" 
                                        className="block hover:text-maroon transition font-medium mb-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        My Account
                                    </Link>
                                    <Link 
                                        to="/orders" 
                                        className="block hover:text-maroon transition font-medium mb-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        My Orders
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                            navigate("/");
                                        }}
                                        className="text-maroon font-medium hover:text-maroon/70 transition"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link 
                                        to="/login" 
                                        className="block hover:text-maroon transition font-medium mb-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link 
                                        to="/register" 
                                        className="block text-maroon font-medium hover:text-maroon/70 transition"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Create Account
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
