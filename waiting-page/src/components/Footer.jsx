import { Instagram as InstagramIcon, Mail, Youtube as YoutubeIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const footerSections = [
    {
        title: "Shop",
        links: [
            { label: "Home", to: "/" },
            { label: "Marketplace", to: "/shop" },
            { label: "Collections", to: "/collections" },
            { label: "All Shops", to: "/shops" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About Us", to: "/about" },
            { label: "Contact", to: "/contact" },
            { label: "Blog", to: "#" },
            { label: "Careers", to: "#" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Privacy Policy", to: "/privacy" },
            { label: "Refund Policy", to: "/refund" },
            { label: "Terms of Service", to: "/terms" },
        ],
    },
];

const socialLinks = [
    { icon: InstagramIcon, label: "Instagram", href: "#", testid: "social-instagram" },
    { icon: YoutubeIcon, label: "YouTube", href: "#", testid: "social-youtube" },
    { icon: Mail, label: "Email", href: "mailto:hello@shoplivebharat.com", testid: "social-mail" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1],
        },
    },
};

export default function Footer() {
    return (
        <footer data-testid="site-footer" className="relative bg-espresso text-ivory pt-24 pb-16 px-6 md:px-12 lg:px-20 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 -z-10">
                <motion.div
                    className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-t from-maroon/10 to-transparent rounded-full blur-3xl"
                    animate={{
                        y: [0, 30, 0],
                        x: [0, 20, 0],
                    }}
                    transition={{
                        duration: 20,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                />
                <motion.div
                    className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-b from-gold/5 to-transparent rounded-full blur-3xl"
                    animate={{
                        y: [0, -25, 0],
                        x: [0, -15, 0],
                    }}
                    transition={{
                        duration: 25,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    {/* Brand Section */}
                    <motion.div className="md:col-span-5" variants={itemVariants}>
                        <motion.div
                            className="flex items-center gap-3 mb-6"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.svg
                                width="72"
                                height="72"
                                viewBox="0 0 48 48"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="flex-shrink-0"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.4 }}
                            >
                                {/* Bag handle */}
                                <path d="M 12 10 Q 12 3 24 3 Q 36 3 36 10" stroke="#FAF8F5" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Bag body */}
                                <rect x="10" y="10" width="28" height="32" rx="2" stroke="#FAF8F5" strokeWidth="2" fill="none" strokeLinejoin="round" />
                                {/* Play button */}
                                <motion.polygon
                                    points="24,18 24,30 34,24"
                                    fill="#FF9500"
                                    animate={{
                                        opacity: [1, 0.7, 1],
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                    }}
                                />
                            </motion.svg>
                            <div>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="font-serif text-3xl font-normal text-ivory">Shop</span>
                                    <span className="font-serif text-3xl font-normal text-maroon">Live</span>
                                    <span className="font-serif text-3xl font-normal" style={{ color: '#FF9500' }}>Bharat</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.p
                            className="mt-8 text-ivory/70 max-w-sm leading-relaxed smooth-transition hover:text-ivory/90"
                            variants={itemVariants}
                        >
                            India's first luxury live-shopping marketplace, designed for the
                            Indian diaspora — couture conversations, delivered worldwide.
                        </motion.p>

                        <motion.div className="mt-8 flex items-center gap-4" variants={containerVariants}>
                            {socialLinks.map((social) => (
                                <motion.a
                                    key={social.label}
                                    href={social.href}
                                    data-testid={social.testid}
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-full border border-ivory/25 flex items-center justify-center hover:bg-ivory hover:text-espresso smooth-transition group"
                                    variants={itemVariants}
                                    whileHover={{
                                        scale: 1.15,
                                        backgroundColor: "rgba(250,248,245,0.2)",
                                        borderColor: "rgba(250,248,245,0.5)",
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <social.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.4} />
                                </motion.a>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Links Sections */}
                    {footerSections.map((section, index) => (
                        <motion.div
                            key={section.title}
                            className={index === 0 ? "md:col-span-2 md:col-start-7" : "md:col-span-2"}
                            variants={itemVariants}
                        >
                            <motion.p
                                className="text-[10px] uppercase tracking-[0.3em] text-champagne mb-5"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                            >
                                {section.title}
                            </motion.p>
                            <motion.ul className="space-y-3 text-sm text-ivory/80" variants={containerVariants}>
                                {section.links.map((link) => (
                                    <motion.li
                                        key={link.label}
                                        variants={itemVariants}
                                        whileHover={{ x: 4 }}
                                    >
                                        <Link
                                            to={link.to}
                                            className="under-link hover:text-ivory transition-colors duration-300"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Divider */}
                <motion.div
                    className="hairline"
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(250,248,245,0.18), transparent)",
                    }}
                />

                {/* Footer Bottom */}
                <motion.div
                    className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] uppercase tracking-[0.28em] text-ivory/55"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                >
                    <motion.span
                        variants={itemVariants}
                        className="smooth-transition hover:text-ivory/75"
                    >
                        © {new Date().getFullYear()} ShopLiveBharat · All rights reserved
                    </motion.span>
                    <motion.span
                        className="serif-italic normal-case tracking-normal text-ivory/65 smooth-transition hover:text-ivory/85"
                        variants={itemVariants}
                    >
                        Made with reverence for India's ateliers.
                    </motion.span>
                </motion.div>
            </div>
        </footer>
    );
}
