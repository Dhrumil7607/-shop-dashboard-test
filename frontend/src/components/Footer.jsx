import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";
import {
    containerVariants,
    itemVariants,
    hoverVariants,
    viewportSettings,
} from "@/utils/animations";

// Chevron icon for mobile accordion toggle
function ChevronIcon({ open }) {
    return (
        <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden="true"
        >
            <polyline points="4 6 8 10 12 6" />
        </motion.svg>
    );
}

// FooterGroup renders an accordion on mobile (<640px) and a static heading on desktop
function FooterGroup({ id, title, headingDelay, children }) {
    const [open, setOpen] = useState(false);

    return (
        <motion.div variants={itemVariants.fadeInUp}>
            {/* Mobile toggle button — visible only below sm (640px) */}
            <button
                id={`${id}-btn`}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center justify-between w-full min-h-[44px] sm:hidden text-left"
                style={{ color: "rgba(255,255,255,0.4)" }}
            >
                <span className="text-xs font-bold uppercase tracking-widest">
                    {title}
                </span>
                <ChevronIcon open={open} />
            </button>

            {/* Desktop static heading — visible only at sm and above */}
            <motion.h4
                className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.22em] mb-5"
                style={{ color: "rgba(255,255,255,0.4)" }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: headingDelay }}
            >
                {title}
            </motion.h4>

            {/* Mobile: collapsible content via AnimatePresence */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key={id}
                        id={id}
                        role="region"
                        aria-labelledby={`${id}-btn`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden sm:hidden"
                    >
                        <div className="pt-3 pb-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop: always-visible content */}
            <div className="hidden sm:block">{children}</div>
        </motion.div>
    );
}

const SOCIAL = [
    { label: "Instagram", href: "https://instagram.com/shoplivebharat", icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    ) },
    { label: "Facebook", href: "https://facebook.com/shoplivebharat", icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    ) },
    { label: "Twitter", href: "https://twitter.com/shoplivebharat", icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ) },
    { label: "YouTube", href: "https://youtube.com/@shoplivebharat", icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    ) },
];

export default function Footer() {
    const footerBgVariants = containerVariants.fadeInUp(0);
    const sectionVariants = itemVariants.fadeInUp;
    
    return (
        <footer style={{ backgroundColor: "#141210", color: "#F5EFE6" }} className="pt-16 pb-8 px-6 md:px-12">
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
                                <BrandLogo variant="mark" height={40} dark />
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
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-100"
                                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                                    variants={itemVariants.scaleInRotate}
                                    whileHover={{ scale: 1.15, color: "#B08D3B" }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {s.icon}
                                </motion.a>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Shop */}
                    <FooterGroup id="footer-shop" title="Shop" headingDelay={0.1}>
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
                                { label: "Bridal",    to: "/marketplace?category=Wedding%20Collection" },
                                { label: "Festival",  to: "/marketplace?category=Festival%20Collection" },
                            ].map((l) => (
                                <motion.li 
                                    key={l.label}
                                    variants={itemVariants.fadeInUp}
                                    whileHover={{ x: 6 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Link to={l.to} className="text-sm transition hover:text-white"
                                        style={{ color: "rgba(255,255,255,0.6)" }}>{l.label}</Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </FooterGroup>

                    {/* Help */}
                    <FooterGroup id="footer-help" title="Help" headingDelay={0.15}>
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
                                { label: "Track Order",  to: "/order-tracking" },
                                { label: "About Us",     to: "/about" },
                                { label: "Privacy Policy", to: "/privacy" },
                                { label: "Refund Policy",  to: "/refund" },
                            ].map((l) => (
                                <motion.li 
                                    key={l.label}
                                    variants={itemVariants.fadeInUp}
                                    whileHover={{ x: 6 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Link to={l.to} className="text-sm transition hover:text-white"
                                        style={{ color: "rgba(255,255,255,0.6)" }}>{l.label}</Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </FooterGroup>

                    {/* For Sellers */}
                    <FooterGroup id="footer-sellers" title="For Sellers" headingDelay={0.2}>
                        <motion.ul 
                            className="space-y-3"
                            variants={containerVariants.fadeInUp(0.05)}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportSettings.normal}
                        >
                            {[
                                { label: "Register Your Store", to: "/become-a-seller" },
                            ].map((l) => (
                                <motion.li 
                                    key={l.label}
                                    variants={itemVariants.fadeInUp}
                                    whileHover={{ x: 6 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Link to={l.to}
                                        className="text-sm transition hover:text-white"
                                        style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
                                        {l.label}
                                    </Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </FooterGroup>
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
                            className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-4 text-xs" 
                            style={{ color: "rgba(255,255,255,0.35)" }}
                            variants={containerVariants.fadeInFast()}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportSettings.normal}
                        >
                            {["Worldwide Shipping", "Secure Payments", "Authentic Local Stores"].map((item, i) => (
                                <motion.span key={item} className="flex items-center gap-2" variants={itemVariants.fadeInLeft}>
                                    {item}
                                    {i < 2 && <span className="hidden md:inline">•</span>}
                                </motion.span>
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </footer>
    );
}
