import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe, ShieldCheck, CreditCard, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { fetchProducts, fetchCategories } from "@/lib/api";
import StoreDiscoverySection from "@/components/Store/StoreDiscoverySection";
import TrustSection from "@/components/TrustSection";
import LiveSessionsShowcase from "@/components/LiveSessionsShowcase";
import ProductCard from "@/components/ProductCard";

/* ─── Data ───────────────────────────────────────────────────── */
const CATEGORIES = [
    { label: "Sarees",            img: "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=800&q=80" },
    { label: "Lehengas",          img: "https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?w=800&q=80" },
    { label: "Kurtas",            img: "https://images.unsplash.com/photo-1744551358303-46edae8b374b?w=800&q=80" },
    { label: "Sherwanis",         img: "https://images.unsplash.com/photo-1760080838961-4208536db385?w=800&q=80" },
    { label: "Chaniya Choli",     img: "https://images.unsplash.com/photo-1668371679302-a8ec781e876e?w=800&q=80" },
    { label: "Kids Traditional",  img: "https://images.unsplash.com/photo-1605292356183-a77d0a9c9d1d?w=800&q=80" },
    { label: "Wedding Collection",img: "https://images.unsplash.com/photo-1703045199207-5312874d9e54?w=800&q=80" },
    { label: "Festival Collection",img:"https://images.unsplash.com/photo-1468234847176-28606331216a?w=800&q=80" },
];

/* Featured products loaded from backend in component */

const HOW_IT_WORKS = [
    { n:"01", title:"Browse",           desc:"Discover from local Indian stores." },
    { n:"02", title:"Add to Cart",      desc:"Pick your favourites." },
    { n:"03", title:"Pay Securely",     desc:"Razorpay, PayPal, cards & UPI." },
    { n:"04", title:"We Verify",        desc:"ShopLiveBharat checks each order." },
    { n:"05", title:"Packed Safely",    desc:"Premium packaging for your treasure." },
    { n:"06", title:"Delivered Worldwide", desc:"To your doorstep, beautifully." },
];

/* New arrivals loaded from backend in component */

const TICKER_ITEMS = [
    "FREE WORLDWIDE SHIPPING OVER ₹15,000",
    "100% AUTHENTIC FROM LOCAL INDIAN STORES",
    "SECURE PAYMENTS — RAZORPAY, PAYPAL, STRIPE",
    "RETURNS & REFUNDS — EASY & TRANSPARENT",
];

/* ─── Hero carousel slides (bridal & ethnic fashion) ─────────── */
const HERO_SLIDES = [
    "https://images.unsplash.com/photo-1600685890506-593fdf55949b?fm=jpg&q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1610173827043-9db50e0d8ef9?fm=jpg&q=80&w=1920&auto=format&fit=crop",
    "https://i.pinimg.com/736x/ae/80/69/ae8069dc37538de9f7b88421a3e7cd56.jpg",
    "https://images.pexels.com/photos/28941551/pexels-photo-28941551.jpeg?w=1920",
];

/* Fallback images proven to load in this project (used if a slide errors) */
const HERO_FALLBACKS = [
    "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=1920&q=85",
    "https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?w=1920&q=85",
    "https://images.unsplash.com/photo-1668371459824-094a960a227d?w=1920&q=85",
    "https://images.unsplash.com/photo-1703045199207-5312874d9e54?w=1920&q=85",
];

const HERO_FEATURES = [
    { icon: Globe,       label: "Worldwide Shipping" },
    { icon: ShieldCheck, label: "Trusted Indian Stores" },
    { icon: CreditCard,  label: "Secure Payments" },
    { icon: Sparkles,    label: "Authentic Local Fashion" },
];

/* ─── Full-screen auto-rotating hero carousel ────────────────── */
function HeroCarousel() {
    const [slide, setSlide] = useState(0);

    // Auto-advance every 5.5s
    useEffect(() => {
        const id = setInterval(() => {
            setSlide((s) => (s + 1) % HERO_SLIDES.length);
        }, 5500);
        return () => clearInterval(id);
    }, []);

    return (
        <section
            className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: "#0a0a0a" }}
        >
            {/* ── Background image carousel (crossfade + slow Ken-Burns zoom) ── */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={slide}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        opacity: { duration: 1.4, ease: "easeInOut" },
                        scale:   { duration: 7, ease: "linear" },
                    }}
                    style={{ willChange: "transform, opacity" }}
                >
                    <img
                        src={HERO_SLIDES[slide]}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover object-center"
                        onError={(e) => { e.currentTarget.src = HERO_FALLBACKS[slide]; }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* ── Cinematic dark overlays for text legibility ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0.72) 100%)" }}
            />
            <div
                className="absolute inset-0 pointer-events-none md:hidden"
                style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.45) 40%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.88) 100%)" }}
            />
            <div
                className="absolute inset-0 pointer-events-none hidden md:block"
                style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, transparent 28%, transparent 58%, rgba(10,10,10,0.8) 100%)" }}
            />

            {/* ── Centered content ── */}
            <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center py-24">
                {/* Eyebrow */}
                <motion.div
                    className="flex items-center justify-center gap-3 mb-6"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span className="h-px w-10 md:w-14" style={{ background: "rgba(201,168,76,0.55)" }} />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.34em]" style={{ color: "#C9A84C" }}>
                        India to the World
                    </span>
                    <span className="h-px w-10 md:w-14" style={{ background: "rgba(201,168,76,0.55)" }} />
                </motion.div>

                {/* Headline */}
                <motion.h1
                    className="font-serif leading-[1.06] mb-6 text-white"
                    style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 400, textShadow: "0 2px 24px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)" }}
                    initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                >
                    Shop Authentic{" "}
                    <span style={{ color: "#C9A84C" }}>Indian Fashion</span>
                    <br className="hidden sm:block" />
                    {" "}From Anywhere In The World
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-9"
                    style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                >
                    Buy sarees, lehengas, kurtas, sherwanis, chaniya choli and wedding outfits
                    directly from trusted local stores in India, with worldwide delivery.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 mb-10 max-w-md sm:max-w-none mx-auto"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.4 }}
                >
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} className="w-full sm:w-auto">
                        <Link to="/marketplace"
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 py-4 sm:py-3.5 rounded-xl font-bold text-base sm:text-sm shadow-xl"
                            style={{ backgroundColor: "#C9A84C", color: "#1a1a1a" }}>
                            Shop Now <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} className="w-full sm:w-auto">
                        <Link to="/shops"
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 py-4 sm:py-3.5 rounded-xl font-bold text-base sm:text-sm border-2"
                            style={{ borderColor: "rgba(255,255,255,0.55)", color: "white", backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)" }}>
                            Explore Stores
                        </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} className="w-full sm:w-auto">
                        <Link to="/live-shopping"
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-5 py-4 sm:py-3.5 rounded-xl font-bold text-base sm:text-sm"
                            style={{ color: "#C9A84C" }}>
                            Watch Live <span>●</span>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Feature pills */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-2.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.55 }}
                >
                    {HERO_FEATURES.map(({ icon: Icon, label }) => (
                        <span key={label}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium"
                            style={{
                                background: "rgba(255,255,255,0.1)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                border: "1px solid rgba(255,255,255,0.16)",
                                color: "rgba(255,255,255,0.88)",
                            }}>
                            <Icon size={13} style={{ color: "#C9A84C" }} />
                            {label}
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* ── Slide indicator dots ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                {HERO_SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === slide ? "true" : undefined}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                            width: i === slide ? 30 : 16,
                            background: i === slide ? "#C9A84C" : "rgba(255,255,255,0.4)",
                        }}
                    />
                ))}
            </div>
        </section>
    );
}

const WHY_US = [
    { title:"Authentic & Direct", desc:"Sourced straight from trusted Indian local stores — no middlemen, no fakes." },
    { title:"Worldwide Shipping", desc:"USA, UK, Canada, Australia, UAE — we deliver to 50+ countries." },
    { title:"Secure & Easy", desc:"Razorpay, PayPal, international cards. Encrypted, never stored." },
    { title:"Wedding-Ready", desc:"Bridal, groom and family collections crafted for life's big days." },
    { title:"Festival Collections", desc:"Diwali, Navratri, Eid, Onam — be ready every season." },
    { title:"Easy Returns", desc:"Transparent refunds and customer support that listens." },
];

/* ─── Ticker ─────────────────────────────────────────────────── */
function Ticker() {
    const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
    return (
        <div className="overflow-hidden py-3" style={{ backgroundColor: "#1a1a1a" }}>
            <div className="marquee-wrap">
                {items.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-6 px-8 text-xs font-semibold tracking-widest uppercase"
                        style={{ color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap" }}>
                        {t}
                        <span style={{ color: "#C9A84C" }}>✦</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [categories, setCategories] = useState(CATEGORIES); // seed with static while loading

    // Load products + categories from backend
    useEffect(() => {
        const load = () => {
            fetchProducts({ active_only: true, limit: 20 })
                .then(data => {
                    const all = Array.isArray(data) ? data : [];
                    setFeaturedProducts(all.filter(p => p.is_featured).slice(0, 8));
                    const sorted = [...all].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
                    setNewArrivals(sorted.slice(0, 8));
                })
                .catch(() => { setFeaturedProducts([]); setNewArrivals([]); });
        };
        load();
        const onFocus = () => load();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    // Load categories from backend (visible only)
    useEffect(() => {
        fetchCategories()
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setCategories(data);
                }
            })
            .catch(() => {}); // keep static fallback on error
    }, []);

    return (
        <MarketplaceLayout>

            {/* ── HERO (full-screen auto-rotating carousel) ── */}
            <HeroCarousel />

            {/* ── TICKER ── */}
            <Ticker />

            {/* ── CATEGORIES ── */}
            <section className="py-20 px-6 md:px-12 bg-ivory">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.3em] text-maroon font-semibold mb-3">CURATED COLLECTIONS</p>
                        <h2 className="font-serif text-4xl md:text-5xl text-espresso">Shop by Category</h2>
                        <p className="text-espresso/60 mt-3 text-sm">From the streets of Banaras to the heart of Jaipur — explore India's finest traditional wear.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.map(cat => (
                            <Link key={cat.id || cat.label} to={`/marketplace?category=${encodeURIComponent(cat.label)}`}
                                className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                                <img src={cat.image_url || cat.img} alt={cat.label} loading="lazy" decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=400&q=60"; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <p className="text-white text-[9px] uppercase tracking-widest font-semibold mb-0.5 opacity-70">DISCOVER</p>
                                    <p className="text-white font-semibold text-sm">{cat.label}</p>
                                    {cat.caption && (
                                        <p className="text-white/60 text-[10px] mt-0.5 leading-snug">{cat.caption}</p>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-white/70 text-xs mt-1 group-hover:text-white transition">
                                        Explore <ArrowRight size={10} />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Link to="/marketplace" className="inline-flex items-center gap-2 text-maroon font-semibold hover:text-maroon/70 transition text-sm">
                            View All Collections <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── FEATURED PRODUCTS ── */}
            <section className="py-20 px-6 md:px-12 bg-[#faf8f5]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.3em] text-maroon font-semibold mb-3">EDITOR'S PICKS</p>
                        <h2 className="font-serif text-4xl md:text-5xl text-espresso">Featured This Season</h2>
                        <p className="text-espresso/60 mt-3 text-sm">Hand-selected pieces from India's most loved local stores.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
                        {featuredProducts.length === 0 && (
                            <p className="col-span-full text-center text-sm" style={{ color: "#9B8B7A" }}>
                                No featured products available right now.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="py-20 px-6 md:px-12" style={{ backgroundColor: "#1a1a1a" }}>
                <div className="max-w-7xl mx-auto">
                    <motion.div className="text-center mb-14"
                        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>
                        <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: "#C9A84C" }}>THE PROCESS</p>
                        <h2 className="font-serif text-4xl md:text-5xl" style={{ color: "white" }}>How ShopLiveBharat Works</h2>
                        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>From a local store in India to your doorstep, anywhere in the world.</p>
                    </motion.div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {HOW_IT_WORKS.map((step, i) => (
                            <motion.div key={step.n} className="text-center"
                                initial={{ opacity: 0, y: 28, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.5, ease: [0.16,1,0.3,1], delay: i * 0.07 }}>
                                <motion.div
                                    className="w-14 h-14 rounded-full border-2 flex items-center justify-center mx-auto mb-4"
                                    style={{ borderColor: "rgba(201,168,76,0.35)" }}
                                    whileHover={{ borderColor: "#C9A84C", scale: 1.08 }}
                                    transition={{ duration: 0.2 }}>
                                    <span className="font-serif text-xl font-bold" style={{ color: "#C9A84C" }}>{step.n}</span>
                                </motion.div>
                                <h3 className="font-semibold text-sm mb-1" style={{ color: "white" }}>{step.title}</h3>
                                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STORE DISCOVERY — Req 6.1: between How It Works and New Arrivals ── */}
            <StoreDiscoverySection />

            {/* ── LIVE SHOPPING SHOWCASE ── */}
            <LiveSessionsShowcase />

            {/* ── NEW ARRIVALS ── */}
            <section className="py-20 px-6 md:px-12 bg-ivory">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.3em] text-maroon font-semibold mb-3">JUST IN</p>
                        <h2 className="font-serif text-4xl md:text-5xl text-espresso">New Arrivals</h2>
                        <p className="text-espresso/60 mt-3 text-sm">Fresh from India's couture houses and family-run stores.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
                        {newArrivals.length === 0 && (
                            <p className="col-span-full text-center text-sm" style={{ color: "#9B8B7A" }}>
                                No new arrivals right now.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ── WHY SHOPLIVEBHARAT ── */}
            <section className="py-20 px-6 md:px-12 bg-[#faf8f5]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.3em] text-maroon font-semibold mb-3">WHY SHOPLIVEBHARAT</p>
                        <h2 className="font-serif text-4xl md:text-5xl text-espresso">Crafted for the Indian Diaspora</h2>
                        <p className="text-espresso/60 mt-3 text-sm">The home you carry in your heart — now in your wardrobe.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {WHY_US.map(item => (
                            <div key={item.title} className="bg-white border border-line-soft rounded-xl p-6 hover:shadow-md transition">
                                <h3 className="font-semibold text-espresso mb-2">{item.title}</h3>
                                <p className="text-espresso/60 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TRUST & ASSURANCE BAND ── */}
            <TrustSection />

            {/* ── SELLER CTA ── */}
            <section className="py-20 px-6 md:px-12 bg-espresso text-ivory">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-champagne font-semibold mb-4">FOR INDIAN RETAILERS</p>
                            <h2 className="font-serif text-4xl md:text-5xl mb-5 text-ivory" style={{ color: "#FAF9F6" }}>Grow Your Clothing Business Worldwide</h2>
                            <p className="text-ivory/70 text-base leading-relaxed mb-8">
                                Register your store on ShopLiveBharat and sell Indian traditional clothes to
                                customers across the world.
                            </p>
                            <Link to="/become-a-seller"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition font-semibold text-sm">
                                Register Your Store <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="hidden md:block">
                            <img
                                src="https://images.unsplash.com/photo-1571908599407-cdb918ed83bf?w=1200&q=85"
                                alt="Indian retailer"
                                className="rounded-2xl w-full h-80 object-cover opacity-80"
                            />
                        </div>
                    </div>
                </div>
            </section>

        </MarketplaceLayout>
    );
}
