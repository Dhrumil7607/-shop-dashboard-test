import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    containerVariants,
    itemVariants,
    hoverVariants,
    viewportSettings,
} from "@/utils/animations";

const SOCIAL = [
    { label: "Instagram", href: "#", icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    ) },
    { label: "Facebook", href: "#", icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    ) },
    { label: "Twitter", href: "#", icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ) },
    { label: "YouTube", href: "#", icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    ) },
];

export default function Footer() {
    const footerBgVariants = containerVariants.fadeInUp(0);
    const sectionVariants = itemVariants.fadeInUp;
    
    return (
        <footer style={{ backgroundColor: "#1a1a1a", color: "white" }} className="pt-14 pb-8 px-6 md:px-12">
            <motion.div 
                className="max-w-7xl mx-auto"
                variants={footerBgVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportSettings.normal}
            >
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10"
                    variants={containerVariants.fadeInUp(0.1)}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportSettings.normal}
                >

                    {/* Brand */}
                    <motion.div 
                        className="md:col-span-1"
                        variants={sectionVariants}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0 }}
                        >
                            <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
                                <motion.div 
                                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                    style={{ borderColor: "#C9A84C" }}
                                    whileHover={{ scale: 1.1, rotate: 10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <span className="font-serif font-bold text-xs" style={{ color: "#C9A84C" }}>S</span>
                                </motion.div>
                                <div className="leading-none">
                                    <span className="font-bold text-sm" style={{ color: "white" }}>ShopLive</span>
                                    <span className="font-bold text-sm" style={{ color: "#C9A84C" }}>Bharat</span>
                                </div>
                            </Link>
                        </motion.div>
                        
                        <motion.p 
                            className="text-xs leading-relaxed mb-6 max-w-xs" 
                            style={{ color: "rgba(255,255,255,0.5)" }}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            Bringing authentic Indian traditional fashion to the world, from local stores to your doorstep.
                        </motion.p>

                        {/* Social icons */}
                        <motion.div 
                            className="flex items-center gap-3"
                            variants={containerVariants.fadeInFast(0.3)}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportSettings.normal}
                        >
                            {SOCIAL.map((s, i) => (
                                <motion.a 
                                    key={s.label} 
                                    href={s.href} 
                                    aria-label={s.label}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-100"
                                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                                    variants={itemVariants.scaleInRotate}
                                    whileHover={{ scale: 1.2, rotate: 10, color: "#C9A84C" }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {s.icon}
                                </motion.a>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Shop */}
                    <motion.div variants={sectionVariants}>
                        <motion.h4 
                            className="text-xs font-bold uppercase tracking-widest mb-5" 
                            style={{ color: "rgba(255,255,255,0.4)" }}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            Shop
                        </motion.h4>
                        <motion.ul 
                            className="space-y-3"
                            variants={containerVariants.fadeInUp(0.05)}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportSettings.normal}
                        >
                            {[
                                { label: "Sarees",    to: "/marketplace?category=Sarees" },
                                { label: "Lehengas",  to: "/marketplace?category=Lehengas" },
                                { label: "Sherwanis", to: "/marketplace?category=Sherwanis" },
                                { label: "Kurtas",    to: "/marketplace?category=Kurtas" },
                                { label: "Bridal",    to: "/marketplace?category=Wedding+Wear" },
                                { label: "Festival",  to: "/marketplace?category=Festival+Wear" },
                            ].map((l, i) => (
                                <motion.li 
                                    key={l.label}
                                    variants={itemVariants.fadeInLeft}
                                    whileHover={{ x: 8 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link to={l.to} className="text-sm transition hover:text-white"
                                        style={{ color: "rgba(255,255,255,0.6)" }}>{l.label}</Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </motion.div>

                    {/* Help */}
                    <motion.div variants={sectionVariants}>
                        <motion.h4 
                            className="text-xs font-bold uppercase tracking-widest mb-5" 
                            style={{ color: "rgba(255,255,255,0.4)" }}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                        >
                            Help
                        </motion.h4>
                        <motion.ul 
                            className="space-y-3"
                            variants={containerVariants.fadeInUp(0.05)}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportSettings.normal}
                        >
                            {[
                                { label: "How It Works", to: "/about" },
                                { label: "Contact Us",   to: "/contact" },
                                { label: "Track Order",  to: "/orders" },
                                { label: "About Us",     to: "/about" },
                            ].map((l) => (
                                <motion.li 
                                    key={l.label}
                                    variants={itemVariants.fadeInLeft}
                                    whileHover={{ x: 8 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link to={l.to} className="text-sm transition hover:text-white"
                                        style={{ color: "rgba(255,255,255,0.6)" }}>{l.label}</Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </motion.div>

                    {/* For Sellers */}
                    <motion.div variants={sectionVariants}>
                        <motion.h4 
                            className="text-xs font-bold uppercase tracking-widest mb-5" 
                            style={{ color: "rgba(255,255,255,0.4)" }}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            For Sellers
                        </motion.h4>
                        <motion.ul 
                            className="space-y-3"
                            variants={containerVariants.fadeInUp(0.05)}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportSettings.normal}
                        >
                            {[
                                { label: "Register Your Store", to: "/become-a-seller" },
                                { label: "Seller Login",        to: "/login" },
                                { label: "Admin Login",         to: "/admin/login" },
                            ].map((l) => (
                                <motion.li 
                                    key={l.label}
                                    variants={itemVariants.fadeInLeft}
                                    whileHover={{ x: 8 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link to={l.to} className="text-sm transition hover:text-white"
                                        style={{ color: "rgba(255,255,255,0.6)" }}>{l.label}</Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </motion.div>
                </motion.div>

                {/* Bottom bar */}
                <motion.div 
                    className="border-t pt-6" 
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    viewport={viewportSettings.normal}
                >
                    <motion.div 
                        className="flex flex-col md:flex-row items-center justify-between gap-3"
                        variants={containerVariants.fadeInUp(0.05)}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportSettings.normal}
                    >
                        <motion.p 
                            className="text-xs" 
                            style={{ color: "rgba(255,255,255,0.35)" }}
                            variants={itemVariants.fadeInUp}
                        >
                            © {new Date().getFullYear()} ShopLiveBharat. Crafted with care for the Indian diaspora.
                        </motion.p>
                        <motion.div 
                            className="flex items-center gap-4 text-xs" 
                            style={{ color: "rgba(255,255,255,0.35)" }}
                            variants={containerVariants.fadeInFast()}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportSettings.normal}
                        >
                            {["Worldwide Shipping", "Secure Payments", "Authentic Local Stores"].map((item, i) => (
                                <motion.span key={item} variants={itemVariants.fadeInLeft}>
                                    {item}
                                    {i < 2 && <span className="ml-4">•</span>}
                                </motion.span>
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </footer>
    );
}
