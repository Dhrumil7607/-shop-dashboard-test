import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-[#0a0a0a] text-white pt-16 pb-10 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2.5 mb-5 group">
                            <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                                <path d="M12 10 Q12 3 24 3 Q36 3 36 10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <rect x="10" y="10" width="28" height="32" rx="2" stroke="white" strokeWidth="2" fill="none" />
                                <polygon points="21,17 21,31 33,24" fill="#FF9500" />
                            </svg>
                            <span className="font-bold text-sm text-white">ShopLiveBharat</span>
                        </Link>
                        <p className="text-white/50 text-xs leading-relaxed max-w-xs">
                            Bringing authentic Indian traditional fashion to the world, from local stores to
                            your doorstep.
                        </p>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Shop</h4>
                        <ul className="space-y-3">
                            {[
                                { label: "Sarees", to: "/marketplace?category=Sarees" },
                                { label: "Lehengas", to: "/marketplace?category=Lehengas" },
                                { label: "Sherwanis", to: "/marketplace?category=Sherwanis" },
                                { label: "Kurtas", to: "/marketplace?category=Kurtas" },
                                { label: "Bridal", to: "/marketplace?category=Wedding+Collection" },
                                { label: "Festival", to: "/marketplace?category=Festival+Collection" },
                            ].map(l => (
                                <li key={l.label}>
                                    <Link to={l.to} className="text-sm text-white/60 hover:text-white transition">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Help</h4>
                        <ul className="space-y-3">
                            {[
                                { label: "How It Works", to: "/#how" },
                                { label: "Contact Us", to: "/contact" },
                                { label: "Track Order", to: "/orders" },
                                { label: "About Us", to: "/about" },
                            ].map(l => (
                                <li key={l.label}>
                                    <Link to={l.to} className="text-sm text-white/60 hover:text-white transition">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Sellers */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">For Sellers</h4>
                        <ul className="space-y-3">
                            {[
                                { label: "Register Your Store", to: "/become-a-seller" },
                                { label: "Seller Login", to: "/login" },
                                { label: "Admin Login", to: "/admin/login" },
                            ].map(l => (
                                <li key={l.label}>
                                    <Link to={l.to} className="text-sm text-white/60 hover:text-white transition">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-white/40 text-xs">
                            © {new Date().getFullYear()} ShopLiveBharat. Crafted with care for the Indian diaspora.
                        </p>
                        <div className="flex items-center gap-5 text-white/40 text-xs">
                            <span>Worldwide Shipping</span>
                            <span>•</span>
                            <span>Secure Payments</span>
                            <span>•</span>
                            <span>Authentic Local Stores</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
