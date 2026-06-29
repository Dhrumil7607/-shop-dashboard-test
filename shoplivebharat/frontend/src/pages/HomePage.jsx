import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";

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

const FEATURED_PRODUCTS = [
    { id:"fp1", badge:"31% OFF", tag:"HERITAGE COUTURE", name:"Couple Matching Set — Ivory & Gold", price:44999, original:64999, color:"Ivory", img:"https://images.unsplash.com/photo-1656402356161-cf01c632c1bc?w=900&q=85" },
    { id:"fp2", badge:"28% OFF", tag:"ROYAL THREADS JAIPUR", name:"Ivory Royal Sherwani with Gold Embroidery", price:27999, original:38999, color:"Ivory", img:"https://images.unsplash.com/photo-1760080838961-4208536db385?w=900&q=85" },
    { id:"fp3", badge:"29% OFF", tag:"READY TO SHIP · BANARASI SILKS CO.", name:"Ivory Tissue Saree with Real Zari", price:24999, original:34999, color:"Ivory", img:"https://images.unsplash.com/photo-1727430228383-aa1fb59db8bf?w=900&q=85" },
    { id:"fp4", badge:"30% OFF", tag:"READY TO SHIP · HERITAGE COUTURE", name:"Pastel Pink Embroidered Lehenga Set", price:39999, original:56999, color:"Pastel Pink", img:"https://images.unsplash.com/photo-1668371459824-094a960a227d?w=900&q=85" },
    { id:"fp5", badge:"31% OFF", tag:"READY TO SHIP · ROYAL THREADS JAIPUR", name:"Navy Silk Kurta with Mirror Work", price:8999, original:12999, color:"Navy", img:"https://images.unsplash.com/photo-1727835523545-70ee992b5763?w=900&q=85" },
    { id:"fp6", badge:"31% OFF", tag:"READY TO SHIP · BANARASI SILKS CO.", name:"Royal Banarasi Silk Saree — Maroon & Gold", price:19999, original:28999, color:"Maroon", img:"https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=900&q=85" },
    { id:"fp7", badge:"28% OFF", tag:"HERITAGE COUTURE", name:"Maharani Bridal Lehenga — Crimson Velvet", price:64999, original:89999, color:"Crimson", img:"https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?w=900&q=85" },
    { id:"fp8", badge:"38% OFF", tag:"READY TO SHIP · GARBA TRENDS SURAT", name:"Navratri Rani Pink Chaniya Choli", price:9999, original:15999, color:"Rani Pink", img:"https://images.unsplash.com/photo-1668371679302-a8ec781e876e?w=900&q=85" },
];

const HOW_IT_WORKS = [
    { n:"01", title:"Browse",           desc:"Discover from local Indian stores." },
    { n:"02", title:"Add to Cart",      desc:"Pick your favourites." },
    { n:"03", title:"Pay Securely",     desc:"Razorpay, PayPal, cards & UPI." },
    { n:"04", title:"We Verify",        desc:"ShopLiveBharat checks each order." },
    { n:"05", title:"Packed Safely",    desc:"Premium packaging for your treasure." },
    { n:"06", title:"Delivered Worldwide", desc:"To your doorstep, beautifully." },
];

const NEW_ARRIVALS = [
    { id:"na1", badge:"33% OFF", tag:"READY TO SHIP · ROYAL THREADS JAIPUR", name:"Cream Linen Kurta Pyjama Set", price:5999, original:8999, color:"Cream", img:"https://images.unsplash.com/photo-1744551358303-46edae8b374b?w=900&q=85" },
    { id:"na2", badge:"38% OFF", tag:"READY TO SHIP · GARBA TRENDS SURAT", name:"Navratri Rani Pink Chaniya Choli", price:9999, original:15999, color:"Rani Pink", img:"https://images.unsplash.com/photo-1668371679302-a8ec781e876e?w=900&q=85" },
    { id:"na3", badge:"30% OFF", tag:"READY TO SHIP · HERITAGE COUTURE", name:"Pastel Pink Embroidered Lehenga Set", price:39999, original:56999, color:"Pastel Pink", img:"https://images.unsplash.com/photo-1668371459824-094a960a227d?w=900&q=85" },
    { id:"na4", badge:"30% OFF", tag:"READY TO SHIP · ROYAL THREADS JAIPUR", name:"Maroon Velvet Bandhgala Sherwani", price:22999, original:32999, color:"Maroon", img:"https://images.unsplash.com/photo-1681717055630-c62333c22fec?w=900&q=85" },
    { id:"na5", badge:"39% OFF", tag:"READY TO SHIP · GARBA TRENDS SURAT", name:"Yellow Cotton Chaniya Choli — Garba Special", price:5499, original:8999, color:"Yellow", img:"https://images.pexels.com/photos/20158862/pexels-photo-20158862.jpeg?w=900" },
    { id:"na6", badge:"28% OFF", tag:"HERITAGE COUTURE", name:"Maharani Bridal Lehenga — Crimson Velvet", price:64999, original:89999, color:"Crimson", img:"https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?w=900&q=85" },
    { id:"na7", badge:"31% OFF", tag:"READY TO SHIP · ROYAL THREADS JAIPUR", name:"Navy Silk Kurta with Mirror Work", price:8999, original:12999, color:"Navy", img:"https://images.unsplash.com/photo-1727835523545-70ee992b5763?w=900&q=85" },
    { id:"na8", badge:"29% OFF", tag:"READY TO SHIP · BANARASI SILKS CO.", name:"Ivory Tissue Saree with Real Zari", price:24999, original:34999, color:"Ivory", img:"https://images.unsplash.com/photo-1727430228383-aa1fb59db8bf?w=900&q=85" },
];

const TICKER_ITEMS = [
    "FREE WORLDWIDE SHIPPING OVER ₹15,000",
    "100% AUTHENTIC FROM LOCAL INDIAN STORES",
    "SECURE PAYMENTS — RAZORPAY, PAYPAL, STRIPE",
    "RETURNS & REFUNDS — EASY & TRANSPARENT",
];

const WHY_US = [
    { title:"Authentic & Direct", desc:"Sourced straight from trusted Indian local stores — no middlemen, no fakes." },
    { title:"Worldwide Shipping", desc:"USA, UK, Canada, Australia, UAE — we deliver to 50+ countries." },
    { title:"Secure & Easy", desc:"Razorpay, PayPal, international cards. Encrypted, never stored." },
    { title:"Wedding-Ready", desc:"Bridal, groom and family collections crafted for life's big days." },
    { title:"Festival Collections", desc:"Diwali, Navratri, Eid, Onam — be ready every season." },
    { title:"Easy Returns", desc:"Transparent refunds and customer support that listens." },
];

function fmt(n) { return "₹" + n.toLocaleString("en-IN"); }

/* ─── Product card (HomePage inline version — delegates to shared component) ── */
function ProductCard({ product }) {
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();

    const discount = product.original
        ? Math.round(((product.original - product.price) / product.original) * 100)
        : 0;

    const storeName = (product.tag || "")
        .replace(/^READY TO SHIP[·•\-\s]+/i, "")
        .trim();

    const COLOR_HEX = {
        "Ivory":"#FAF8F5","Gold":"#D4AF37","Maroon":"#8B3A3A","Crimson":"#DC143C",
        "Navy":"#1B2A6B","Rani Pink":"#E8417A","Pastel Pink":"#FFB7C5",
        "Cream":"#F5F0E8","Yellow":"#FFD700",
    };

    return (
        <div className="group bg-white border border-[#e8e4df] rounded-xl overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300">
            {/* Image */}
            <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: "3/4" }}>
                <img src={product.img} alt={product.name} loading="lazy" decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=400&q=60"; }}
                />
                {/* Discount badge — white pill top-left */}
                {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-white text-[#0a0a0a] text-[10px] font-black px-2.5 py-1 rounded shadow-sm tracking-wide">
                        {discount}% OFF
                    </span>
                )}
                {/* Ready to ship — green pill top-right */}
                {product.tag && product.tag.includes("READY TO SHIP") && (
                    <span className="absolute top-3 right-3 bg-[#1a7a3c] text-white text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                        READY TO SHIP
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1 gap-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-maroon leading-none truncate">
                    {storeName}
                </p>
                <h3 className="font-serif text-[15px] text-[#0a0a0a] line-clamp-2 leading-snug flex-1">
                    {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-bold text-[#0a0a0a] text-sm">{formatPrice(product.price)}</span>
                    {product.original && (
                        <span className="text-xs text-gray-400 line-through">{formatPrice(product.original)}</span>
                    )}
                </div>
                {product.color && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: COLOR_HEX[product.color] || "#ccc" }} />
                        <span className="text-[10px] text-gray-500">{product.color}</span>
                    </div>
                )}
                <button type="button"
                    onClick={e => { e.stopPropagation(); addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.img }); }}
                    className="mt-auto w-full py-2.5 bg-[#0a0a0a] text-white text-xs font-semibold rounded-lg hover:bg-maroon transition-colors duration-200 flex items-center justify-center gap-1.5">
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

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
    return (
        <MarketplaceLayout>

            {/* ── HERO ── */}
            <section className="relative min-h-[92vh] flex items-center overflow-hidden" style={{ backgroundColor: "#0a0a0a" }}>
                <motion.div
                    className="absolute inset-0"
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=1600&q=85"
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        style={{ opacity: 0.28 }}
                    />
                    <div className="absolute inset-0" style={{
                        background: "linear-gradient(to right, #0a0a0a 30%, rgba(10,10,10,0.75) 65%, transparent 100%)"
                    }} />
                </motion.div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24">
                    <motion.div
                        className="max-w-2xl"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.12 } }
                        }}
                    >
                        <motion.p
                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } } }}
                            className="text-xs font-bold uppercase tracking-[0.3em] mb-5"
                            style={{ color: "#8B3A3A" }}
                        >
                            INDIA TO THE WORLD
                        </motion.p>

                        <motion.h1
                            variants={{ hidden: { opacity: 0, y: 32, filter: "blur(6px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: [0.16,1,0.3,1] } } }}
                            className="font-serif text-5xl md:text-7xl text-white leading-[1.05] mb-6"
                        >
                            Shop Authentic<br />Indian Fashion<br />
                            <span style={{ color: "#C9A84C" }}>From Anywhere<br />In The World</span>
                        </motion.h1>

                        <motion.p
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16,1,0.3,1] } } }}
                            className="text-lg leading-relaxed mb-10 max-w-lg"
                            style={{ color: "rgba(255,255,255,0.65)" }}
                        >
                            Buy sarees, lehengas, kurtas, sherwanis, chaniya choli and wedding outfits
                            directly from trusted local stores in India, with worldwide delivery.
                        </motion.p>

                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                            className="flex flex-wrap gap-3 mb-12"
                        >
                            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
                                <Link to="/marketplace" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition"
                                    style={{ backgroundColor: "#8B3A3A", color: "white" }}>
                                    Shop Now <ArrowRight size={16} />
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
                                <Link to="/shops" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition border-2"
                                    style={{ borderColor: "rgba(255,255,255,0.25)", color: "white" }}>
                                    Explore Stores
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
                                <Link to="/become-a-seller" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition border-2"
                                    style={{ borderColor: "rgba(201,168,76,0.45)", color: "#C9A84C" }}>
                                    Become a Seller
                                </Link>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: 0.1 } } }}
                            className="flex flex-wrap gap-x-7 gap-y-2"
                        >
                            {["Worldwide Shipping","Trusted Indian Stores","Secure Payments","Authentic Local Fashion"].map(f => (
                                <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "#8B3A3A" }} />
                                    {f}
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

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
                        {CATEGORIES.map(cat => (
                            <Link key={cat.label} to={`/marketplace?category=${encodeURIComponent(cat.label)}`}
                                className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                                <img src={cat.img} alt={cat.label} loading="lazy" decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=400&q=60"; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <p className="text-white text-[9px] uppercase tracking-widest font-semibold mb-0.5 opacity-70">DISCOVER</p>
                                    <p className="text-white font-semibold text-sm">{cat.label}</p>
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
                        {FEATURED_PRODUCTS.map(p => <ProductCard key={p.id} product={p} />)}
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

            {/* ── NEW ARRIVALS ── */}
            <section className="py-20 px-6 md:px-12 bg-ivory">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs uppercase tracking-[0.3em] text-maroon font-semibold mb-3">JUST IN</p>
                        <h2 className="font-serif text-4xl md:text-5xl text-espresso">New Arrivals</h2>
                        <p className="text-espresso/60 mt-3 text-sm">Fresh from India's couture houses and family-run stores.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {NEW_ARRIVALS.map(p => <ProductCard key={p.id} product={p} />)}
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

            {/* ── SELLER CTA ── */}
            <section className="py-20 px-6 md:px-12 bg-espresso text-ivory">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-champagne font-semibold mb-4">FOR INDIAN RETAILERS</p>
                            <h2 className="font-serif text-4xl md:text-5xl mb-5">Grow Your Clothing Business Worldwide</h2>
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
