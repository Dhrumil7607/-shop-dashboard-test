import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Heart, Search, Menu, X, ChevronDown, LogOut } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import Footer from "@/components/Footer";
import CurrencySelector from "@/components/CurrencySelector";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
    { label: "Home",          to: "/" },
    { label: "Collections",   to: "/marketplace" },
    { label: "Shop by Stores", to: "/shops" },
    { label: "Live Shopping", to: "/live-shopping" },
    { label: "About",         to: "/about" },
    { label: "Contact",       to: "/contact" },
];

const dropAnim = {
    hidden:  { opacity: 0, scale: 0.96, y: -8 },
    visible: { opacity: 1, scale: 1,    y: 0,
        transition: { type: "spring", stiffness: 400, damping: 28 } },
    exit:    { opacity: 0, scale: 0.97, y: -4,
        transition: { duration: 0.15 } },
};

const mobileAnim = {
    hidden:  { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto",
        transition: { duration: 0.28, ease: [0.22, 0.61, 0.36, 1] } },
    exit:    { opacity: 0, height: 0,
        transition: { duration: 0.2 } },
};

export default function MarketplaceLayout({ children, hideFooter = false }) {
    const [mobileOpen,    setMobileOpen]    = useState(false);
    const [accountOpen,   setAccountOpen]   = useState(false);
    const [search,        setSearch]        = useState("");
    const [scrolled,      setScrolled]      = useState(false);
    const [desktopSearch, setDesktopSearch] = useState(false);
    const [desktopQuery,  setDesktopQuery]  = useState("");
    const desktopInputRef = useRef(null);

    const accountRef = useRef(null);
    const navigate   = useNavigate();
    const location   = useLocation();
    const { getTotalItems } = useCart();
    const { isLoggedIn, user, logout, isAdmin, isSeller } = useAuth();
    const { getCount: getWishlistCount } = useWishlist();
    const cartCount = getTotalItems();
    const wishlistCount = getWishlistCount();

    /* Scroll-aware header elevation */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    /* Close dropdown on outside click */
    useEffect(() => {
        const h = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target))
                setAccountOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    /* Close desktop search on Escape */
    useEffect(() => {
        const h = (e) => {
            if (e.key === "Escape") {
                setDesktopSearch(false);
                setDesktopQuery("");
            }
        };
        if (desktopSearch) {
            document.addEventListener("keydown", h);
            // Focus input after animation
            setTimeout(() => desktopInputRef.current?.focus(), 50);
        }
        return () => document.removeEventListener("keydown", h);
    }, [desktopSearch]);

    /* Close mobile menu on route change */
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const handleSearch = useCallback((e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/marketplace?search=${encodeURIComponent(search)}`);
            setSearch("");
        }
    }, [search, navigate]);

    const handleDesktopSearch = useCallback((e) => {
        e.preventDefault();
        if (desktopQuery.trim()) {
            navigate(`/marketplace?search=${encodeURIComponent(desktopQuery)}`);
            setDesktopQuery("");
            setDesktopSearch(false);
        }
    }, [desktopQuery, navigate]);

    const isActive = (to) =>
        location.pathname === to ||
        (to === "/marketplace" && location.pathname === "/shop");

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FAF9F6" }}>

            {/* ── HEADER ── */}
            <motion.header
                className="sticky top-0 z-40 border-b transition-all duration-300"
                style={{
                    backgroundColor: scrolled ? "rgba(250,249,246,0.88)" : "#FAF9F6",
                    borderColor: "#E8E4DF",
                    backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
                    WebkitBackdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
                    boxShadow: scrolled ? "0 2px 20px rgba(44,36,27,0.06), 0 1px 0 rgba(255,255,255,0.8)" : "none",
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap min-w-0">

    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 min-w-0 group">
                        <motion.div
                            whileHover={{ scale: 1.04 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="flex items-center"
                        >
                            <BrandLogo variant="icon" height={48} />
                        </motion.div>
                    </Link>

                    {/* Center nav */}
                    <nav className="hidden lg:flex items-center gap-5 text-sm flex-1 justify-center">
                        {NAV.map(link => (
                            <Link key={link.to} to={link.to}
                                className="relative font-medium transition-colors py-1 whitespace-nowrap"
                                aria-current={isActive(link.to) ? "page" : undefined}
                                style={{ color: isActive(link.to) ? "#1a1a1a" : "#6B5E52" }}
                            >
                                {link.label}
                                {isActive(link.to) && (
                                    <motion.span
                                        layoutId="nav-indicator"
                                        className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                                        style={{ backgroundColor: "#C9A84C" }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </Link>
                        ))}
                        <Link to="/become-a-seller"
                            className="flex items-center gap-1 font-medium transition-colors hover:opacity-80"
                            style={{ color: "#C9A84C" }}>
                            <span>✦</span> Become a Seller
                        </Link>
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-0.5">
                        {/* Currency Selector */}
                        <div className="hidden md:block mr-1">
                            <CurrencySelector />
                        </div>

                        {/* Search */}
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setDesktopSearch(v => !v)}
                            className="p-2 rounded-lg transition-colors hover:bg-black/5"
                            aria-label="Search" style={{ color: "#6B5E52" }}>
                            <Search size={18} />
                        </motion.button>

                        {/* Wishlist */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                to="/wishlist"
                                className="relative p-2 rounded-lg transition-colors hover:bg-black/5 flex"
                                aria-label="Wishlist"
                                style={{ color: "#6B5E52" }}
                            >
                                <Heart size={18} />
                                <AnimatePresence>
                                    {wishlistCount > 0 && (
                                        <motion.span
                                            key={wishlistCount}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                                            style={{ backgroundColor: "#A2466B" }}
                                        >
                                            {wishlistCount > 9 ? "9+" : wishlistCount}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </motion.div>

                        {/* Cart */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link to="/cart"
                                className="relative p-2 rounded-lg transition-colors hover:bg-black/5 flex"
                                aria-label="Cart" style={{ color: "#6B5E52" }}>
                                <ShoppingCart size={18} />
                                <AnimatePresence>
                                    {cartCount > 0 && (
                                        <motion.span
                                            key="badge"
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{   scale: 0, opacity: 0 }}
                                            className="absolute -top-0.5 -right-0.5 h-4 w-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: "#8B3A3A" }}
                                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                        >
                                            {cartCount}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </motion.div>

                        {/* Admin pill — only when admin logged in */}
                        {isAdmin && (
                            <Link to="/admin/dashboard"
                                className="hidden sm:block px-3 py-1.5 text-xs font-semibold rounded-lg ml-1 transition hover:opacity-80"
                                style={{ backgroundColor: "#1a1a1a", color: "white" }}>
                                Admin ↗
                            </Link>
                        )}

                        {/* Account dropdown */}
                        <div ref={accountRef} className="relative ml-1">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setAccountOpen(v => !v)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition hover:bg-black/5"
                                style={{ color: "#1a1a1a", borderColor: "#E8E4DF" }}>
                                {isLoggedIn ? (user?.name?.split(" ")[0] || "Account") : "Login"}
                                <motion.span
                                    animate={{ rotate: accountOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown size={12} />
                                </motion.span>
                            </motion.button>

                            <AnimatePresence>
                                {accountOpen && (
                                    <motion.div
                                        variants={dropAnim}
                                        initial="hidden" animate="visible" exit="exit"
                                        className="absolute right-0 mt-2 w-52 rounded-xl shadow-xl z-50 py-1 border overflow-hidden"
                                        style={{ backgroundColor: "#FAF9F6", borderColor: "#E8E4DF",
                                            boxShadow: "0 8px 32px rgba(44,36,27,0.12), 0 2px 8px rgba(44,36,27,0.06)" }}
                                    >
                                        {isLoggedIn ? (
                                            <>
                                                <div className="px-4 py-3 border-b" style={{ borderColor: "#E8E4DF" }}>
                                                    <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{user?.name}</p>
                                                    <p className="text-xs truncate" style={{ color: "#9B8B7A" }}>{user?.email}</p>
                                                </div>
                                                {[
                                                    { label: "My Account", to: "/account" },
                                                    { label: "My Orders", to: "/orders" },
                                                    { label: "My Size Profiles", to: "/account/size-profiles" },
                                                    { label: "My Bookings", to: "/account/bookings" },
                                                ].map(item => (
                                                    <Link key={item.to} to={item.to} onClick={() => setAccountOpen(false)}
                                                        className="block px-4 py-2.5 text-sm transition hover:bg-black/5"
                                                        style={{ color: "#1a1a1a" }}>
                                                        {item.label}
                                                    </Link>
                                                ))}
                                                {isSeller && (
                                                    <>
                                                    <Link to="/seller/dashboard" onClick={() => setAccountOpen(false)}
                                                        className="block px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
                                                        style={{ color: "#A2466B" }}>
                                                        🏪 Seller Portal ↗
                                                    </Link>
                                                    </>
                                                )}
                                                {isAdmin && (
                                                    <Link to="/admin/dashboard" onClick={() => setAccountOpen(false)}
                                                        className="block px-4 py-2.5 text-sm transition hover:bg-black/5"
                                                        style={{ color: "#1a1a1a" }}>
                                                        ⚙️ Admin Panel
                                                    </Link>
                                                )}
                                                <Link to="/become-a-seller" onClick={() => setAccountOpen(false)}
                                                    className="block px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
                                                    style={{ color: "#8B3A3A" }}>
                                                    Become a Seller
                                                </Link>
                                                {isAdmin && (
                                                    <Link to="/admin/dashboard" onClick={() => setAccountOpen(false)}
                                                        className="block px-4 py-2.5 text-sm transition hover:bg-black/5"
                                                        style={{ color: "#1a1a1a" }}>
                                                        Admin Panel
                                                    </Link>
                                                )}
                                                <div className="border-t mt-1" style={{ borderColor: "#E8E4DF" }}>
                                                    <button
                                                        onClick={() => { logout(); setAccountOpen(false); navigate("/"); }}
                                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-red-50 text-red-600">
                                                        <LogOut size={14} /> Logout
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Link to="/login" onClick={() => setAccountOpen(false)}
                                                    className="block px-4 py-2.5 text-sm transition hover:bg-black/5"
                                                    style={{ color: "#1a1a1a" }}>Login</Link>
                                                <Link to="/register" onClick={() => setAccountOpen(false)}
                                                    className="block px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
                                                    style={{ color: "#8B3A3A" }}>Create Account</Link>
                                                <div className="border-t" style={{ borderColor: "#E8E4DF" }}>
                                                    <Link to="/become-a-seller" onClick={() => setAccountOpen(false)}
                                                        className="block px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
                                                        style={{ color: "#C9A84C" }}>Register Your Store</Link>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile hamburger */}
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setMobileOpen(v => !v)}
                            className="lg:hidden p-2 ml-1 rounded-lg transition hover:bg-black/5"
                            aria-label="Menu" style={{ color: "#1a1a1a" }}>
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={mobileOpen ? "x" : "menu"}
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{   rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                                </motion.span>
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>

                {/* Desktop search overlay */}
                <AnimatePresence>
                    {desktopSearch && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
                            className="hidden lg:block border-t px-6 py-4"
                            style={{ borderColor: "#E8E4DF", backgroundColor: "#FAF9F6" }}
                        >
                            <form onSubmit={handleDesktopSearch} className="max-w-2xl mx-auto flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{ color: "#9B8B7A" }} />
                                    <input
                                        ref={desktopInputRef}
                                        type="search"
                                        value={desktopQuery}
                                        onChange={e => setDesktopQuery(e.target.value)}
                                        placeholder="Search sarees, lehengas, sherwanis…"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                                        style={{
                                            borderColor: "#E8E4DF",
                                            backgroundColor: "white",
                                            color: "#1a1a1a",
                                        }}
                                        aria-label="Search products"
                                    />
                                </div>
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                                    style={{ backgroundColor: "#A2466B", color: "white" }}
                                >
                                    Search
                                </motion.button>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setDesktopSearch(false); setDesktopQuery(""); }}
                                    className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                                    style={{ color: "#6B5E52" }}
                                    aria-label="Close search"
                                >
                                    <X size={18} />
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            variants={mobileAnim}
                            initial="hidden" animate="visible" exit="exit"
                            className="lg:hidden border-t px-6 py-5 space-y-3 overflow-hidden"
                            style={{ borderColor: "#E8E4DF", backgroundColor: "#FAF9F6" }}>
                            <form onSubmit={handleSearch} className="mb-3">
                                <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search…"
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                                    style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#1a1a1a" }} />
                            </form>
                            {NAV.map(link => (
                                <Link key={link.to} to={link.to}
                                    className="flex items-center min-h-[44px] text-sm font-medium px-2"
                                    aria-current={isActive(link.to) ? "page" : undefined}
                                    style={{ color: isActive(link.to) ? "#1a1a1a" : "#6B5E52" }}>
                                    {link.label}
                                </Link>
                            ))}
                            <Link to="/become-a-seller"
                                className="flex items-center min-h-[44px] text-sm font-semibold px-2"
                                style={{ color: "#C9A84C" }}>
                                ✦ Become a Seller
                            </Link>

                            {/* Currency selector in mobile menu */}
                            <div className="pt-2 border-t" style={{ borderColor: "#E8E4DF" }}>
                                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8B8680" }}>Currency</p>
                                <div className="flex items-center min-h-[44px]">
                                    <CurrencySelector />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            <main className="flex-1">{children}</main>
            {!hideFooter && <Footer />}
        </div>
    );
}
