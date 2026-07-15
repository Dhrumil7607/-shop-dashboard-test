/**
 * HomePage.jsx — ShopLiveBharat (Editorial Luxury redesign)
 * A magazine-style, asymmetric layout. All data hooks preserved:
 * fetchProducts, fetchCategories, ProductCard, StoreDiscoverySection,
 * LiveSessionsShowcase, TrustSection, backend /ticker.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Star, Radio, MapPin, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { fetchProducts, fetchCategories } from "@/lib/api";
import StoreDiscoverySection from "@/components/Store/StoreDiscoverySection";
import TrustSection from "@/components/TrustSection";
import LiveSessionsShowcase from "@/components/LiveSessionsShowcase";
import ProductCard from "@/components/ProductCard";

/* ── Design tokens (new editorial palette) ─────────────────────── */
const INK = "#141210";
const IVORY = "#F5EFE6";
const GOLD = "#B08D3B";
const SAND = "#EDE4D6";

const CATEGORY_SEED = [
  { label: "Sarees", img: "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=900&q=80" },
  { label: "Lehengas", img: "https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?w=900&q=80" },
  { label: "Kurtas", img: "https://images.unsplash.com/photo-1744551358303-46edae8b374b?w=900&q=80" },
  { label: "Sherwanis", img: "https://images.unsplash.com/photo-1760080838961-4208536db385?w=900&q=80" },
  { label: "Chaniya Choli", img: "https://images.unsplash.com/photo-1668371679302-a8ec781e876e?w=900&q=80" },
  { label: "Wedding Wear", img: "https://images.unsplash.com/photo-1703045199207-5312874d9e54?w=900&q=80" },
];

const OCCASIONS = [
  { label: "Bridal", q: "Bridal Wear", img: "https://images.unsplash.com/photo-1600685890506-593fdf55949b?w=800&q=80" },
  { label: "Wedding Guest", q: "Wedding Wear", img: "https://images.unsplash.com/photo-1610173827043-9db50e0d8ef9?w=800&q=80" },
  { label: "Festive", q: "Festival Wear", img: "https://images.unsplash.com/photo-1468234847176-28606331216a?w=800&q=80" },
  { label: "Everyday", q: "Kurti / Kurtis", img: "https://images.unsplash.com/photo-1744551358303-46edae8b374b?w=800&q=80" },
];

const STATES = [
  { label: "Banarasi · UP", q: "Sarees" },
  { label: "Rajasthan", q: "Lehengas" },
  { label: "Gujarat", q: "Chaniya Choli" },
  { label: "Bengal", q: "Sarees" },
  { label: "South India", q: "Sarees" },
  { label: "Punjab", q: "Salwar Suit" },
];

const STORIES = [
  { q: "Wore my Banarasi to a wedding in London — every single guest asked where it was from.", who: "Ananya · United Kingdom" },
  { q: "The packing video before dispatch is genius. I knew exactly what was coming.", who: "Rahul · Canada" },
  { q: "Felt like shopping in a boutique in Jaipur, from my living room in Sydney.", who: "Meera · Australia" },
];

const WHY = [
  { n: "01", t: "Direct from India", d: "Sourced straight from trusted local ateliers — no middlemen, no fakes." },
  { n: "02", t: "Delivered Worldwide", d: "USA, UK, Canada, Australia, UAE and 45+ more countries." },
  { n: "03", t: "Packing Video", d: "A transparency video of your order, sent before every dispatch." },
  { n: "04", t: "Made-to-Measure", d: "Custom stitching to your exact measurements on women's wear." },
];

const DEFAULT_TICKER = [
  "FREE WORLDWIDE SHIPPING OVER ₹15,000",
  "100% AUTHENTIC FROM LOCAL INDIAN ATELIERS",
  "MADE-TO-MEASURE STITCHING AVAILABLE",
  "A PACKING VIDEO BEFORE EVERY DISPATCH",
];

/* ── Thin editorial marquee ─────────────────────────────────────── */
function Ticker() {
  const [items, setItems] = useState(DEFAULT_TICKER);
  useEffect(() => {
    import("@/lib/api").then(({ api }) => {
      api.get("/ticker").then((r) => {
        if (Array.isArray(r.data?.items) && r.data.items.length) setItems(r.data.items);
      }).catch(() => {});
    });
  }, []);
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden py-2.5" style={{ backgroundColor: INK }}>
      <div className="marquee-wrap">
        {repeated.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-5 px-7 text-[10px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: "rgba(245,239,230,0.72)", whiteSpace: "nowrap" }}>
            {t}<span style={{ color: GOLD }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Section heading (editorial) ────────────────────────────────── */
function Heading({ eyebrow, title, sub, dark, right }) {
  const fg = dark ? "#F5EFE6" : INK;
  const muted = dark ? "rgba(245,239,230,0.55)" : "rgba(20,18,16,0.55)";
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[0.34em]" style={{ color: GOLD }}>{eyebrow}</span>
        <h2 className="mt-3 font-serif leading-[1.02]" style={{ color: fg, fontSize: "clamp(2rem,4.5vw,3.4rem)", fontWeight: 400 }}>{title}</h2>
        {sub && <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: muted }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const ease = [0.22, 0.61, 0.36, 1];
const rise = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.5, ease } };

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [categories, setCategories] = useState(CATEGORY_SEED);

  useEffect(() => {
    const load = () => {
      fetchProducts({ active_only: true, limit: 24 })
        .then((data) => {
          const all = Array.isArray(data) ? data : [];
          setFeatured(all.filter((p) => p.is_featured).slice(0, 6));
          const sorted = [...all].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
          setArrivals(sorted.slice(0, 8));
        })
        .catch(() => { setFeatured([]); setArrivals([]); });
    };
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    fetchCategories().then((d) => { if (Array.isArray(d) && d.length) setCategories(d); }).catch(() => {});
  }, []);

  const catImg = (c) => c.image_url || c.img || "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=600&q=60";

  return (
    <MarketplaceLayout>
      <div style={{ backgroundColor: IVORY }}>
        <Ticker />
        {/* Rest of sections appended below */}
        {/* HERO */}
        <section className="relative overflow-hidden" style={{ backgroundColor: IVORY }}>
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:py-20">
            {/* Left — editorial copy */}
            <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
              className="lg:col-span-6">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-12" style={{ background: GOLD }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.34em]" style={{ color: GOLD }}>From India, With Love</span>
              </div>
              <h1 className="font-serif" style={{ color: INK, fontSize: "clamp(2.8rem,6.5vw,5.4rem)", fontWeight: 400, lineHeight: 0.98, letterSpacing: "-0.01em" }}>
                The Soul of<br /><span style={{ fontStyle: "italic", color: GOLD }}>Indian</span> Craft,
                <br />Worn Worldwide.
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "rgba(20,18,16,0.62)" }}>
                Handpicked sarees, lehengas and heirloom occasion-wear from India's finest local ateliers —
                delivered, with a packing video, to your doorstep anywhere on earth.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.16 }}>
                  <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold" style={{ background: INK, color: IVORY }}>
                    Explore the Collection <ArrowRight size={16} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.16 }}>
                  <Link to="/live-shopping" className="inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-bold" style={{ borderColor: INK, color: INK }}>
                    <Radio size={15} style={{ color: GOLD }} /> Watch Live
                  </Link>
                </motion.div>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                {[["50+", "Countries"], ["100%", "Authentic"], ["1000s", "Artisans"]].map(([n, l]) => (
                  <div key={l}>
                    <p className="font-serif text-2xl" style={{ color: INK }}>{n}</p>
                    <p className="text-[11px] uppercase tracking-widest" style={{ color: "rgba(20,18,16,0.5)" }}>{l}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — asymmetric image stack */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease }}
              className="relative lg:col-span-6">
              <div className="relative ml-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden rounded-[28px]">
                <img src="https://images.unsplash.com/photo-1610173827043-9db50e0d8ef9?w=1200&q=85" alt="Indian couture"
                  className="h-full w-full object-cover" loading="eager"
                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1503160865267-af4660ce7bf2?w=1200&q=85"; }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,18,16,0.35), transparent 45%)" }} />
              </div>
              {/* Floating card */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.3 }}
                className="absolute -bottom-4 left-0 hidden rounded-2xl p-4 shadow-xl sm:block" style={{ background: IVORY, border: `1px solid ${SAND}`, maxWidth: 230 }}>
                <div className="flex items-center gap-1" style={{ color: GOLD }}>
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={12} fill={GOLD} />)}
                </div>
                <p className="mt-2 text-[12px] leading-snug" style={{ color: "rgba(20,18,16,0.75)" }}>
                  "Boutique-quality, delivered across oceans."
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>Verified Buyer</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── TRENDING CATEGORIES — bento grid ── */}
        <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
          <Heading eyebrow="Curated Collections" title="Trending Categories"
            sub="From the looms of Banaras to the mirrors of Kutch — explore India's finest."
            right={<Link to="/marketplace" className="hidden items-center gap-1.5 text-sm font-semibold md:inline-flex" style={{ color: INK }}>View all <ArrowUpRight size={15} /></Link>} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2" style={{ minHeight: 420 }}>
            {categories.slice(0, 6).map((c, i) => {
              const big = i === 0 || i === 3;
              return (
                <motion.div key={c.id || c.label} {...rise} transition={{ ...rise.transition, delay: i * 0.05 }}
                  className={big ? "md:col-span-2 md:row-span-1" : ""}>
                  <Link to={`/marketplace?category=${encodeURIComponent(c.label)}`}
                    className="group relative block h-full min-h-[200px] overflow-hidden rounded-2xl">
                    <img src={catImg(c)} alt={c.label} loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=600&q=60"; }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,18,16,0.75), transparent 55%)" }} />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-[9px] uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,0.6)" }}>Discover</p>
                      <p className="mt-0.5 font-serif text-xl text-white">{c.label}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── SHOP BY OCCASION ── */}
        <section style={{ background: INK }}>
          <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
            <Heading dark eyebrow="Dress for the Moment" title="Shop by Occasion" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {OCCASIONS.map((o, i) => (
                <motion.div key={o.label} {...rise} transition={{ ...rise.transition, delay: i * 0.05 }}>
                  <Link to={`/marketplace?category=${encodeURIComponent(o.q)}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl">
                    <img src={o.img} alt={o.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)" }} />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                      <p className="font-serif text-lg text-white">{o.label}</p>
                      <ArrowUpRight size={16} className="text-white transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURED COLLECTION — editorial product strip ── */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
            <Heading eyebrow="Editor's Edit" title="The Featured Edit"
              sub="Hand-selected pieces from India's most-loved ateliers this season."
              right={<Link to="/marketplace" className="hidden items-center gap-1.5 text-sm font-semibold md:inline-flex" style={{ color: INK }}>Shop all <ArrowUpRight size={15} /></Link>} />
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ── STORE DISCOVERY (preserved) ── */}
        <div style={{ background: IVORY }}><StoreDiscoverySection /></div>

        {/* ── SHOP BY STATE ── */}
        <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
          <Heading eyebrow="A Nation of Craft" title="Shop by Region"
            sub="Every Indian state tells its story in thread, weave and colour." />
          <div className="flex flex-wrap gap-3">
            {STATES.map((s, i) => (
              <motion.div key={s.label} {...rise} transition={{ ...rise.transition, delay: i * 0.04 }}>
                <Link to={`/marketplace?q=${encodeURIComponent(s.q)}`}
                  className="group inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-black/[0.04]"
                  style={{ borderColor: SAND, color: INK }}>
                  <MapPin size={14} style={{ color: GOLD }} /> {s.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── LIVE SHOPPING (preserved) ── */}
        <LiveSessionsShowcase />

        {/* ── NEW ARRIVALS ── */}
        {arrivals.length > 0 && (
          <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
            <Heading eyebrow="Just In" title="New Arrivals"
              right={<Link to="/marketplace" className="hidden items-center gap-1.5 text-sm font-semibold md:inline-flex" style={{ color: INK }}>See more <ArrowUpRight size={15} /></Link>} />
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {arrivals.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ── WHY SHOPLIVEBHARAT — numbered editorial ── */}
        <section style={{ background: SAND }}>
          <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
            <Heading eyebrow="The ShopLiveBharat Difference" title="Why Shop With Us" />
            <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {WHY.map((w, i) => (
                <motion.div key={w.n} {...rise} transition={{ ...rise.transition, delay: i * 0.06 }}>
                  <p className="font-serif text-5xl" style={{ color: GOLD, opacity: 0.5 }}>{w.n}</p>
                  <div className="mt-3 h-px w-10" style={{ background: INK, opacity: 0.2 }} />
                  <h3 className="mt-4 font-serif text-xl" style={{ color: INK }}>{w.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(20,18,16,0.6)" }}>{w.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CUSTOMER STORIES ── */}
        <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
          <Heading eyebrow="Loved Worldwide" title="Customer Stories" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {STORIES.map((s, i) => (
              <motion.div key={i} {...rise} transition={{ ...rise.transition, delay: i * 0.06 }}
                className="rounded-2xl p-7" style={{ border: `1px solid ${SAND}`, background: "#FFFFFF" }}>
                <Sparkles size={18} style={{ color: GOLD }} />
                <p className="mt-4 font-serif text-lg leading-snug" style={{ color: INK, fontStyle: "italic" }}>“{s.q}”</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>{s.who}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── TRUST (preserved) ── */}
        <TrustSection />

        {/* ── SELLER CTA ── */}
        <section style={{ background: INK }}>
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.34em]" style={{ color: GOLD }}>For Indian Ateliers</span>
              <h2 className="mt-4 font-serif" style={{ color: IVORY, fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 400, lineHeight: 1.05 }}>
                Take Your Store to the World.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: "rgba(245,239,230,0.6)" }}>
                Join ShopLiveBharat and sell authentic Indian fashion to customers across 50+ countries — with logistics, payments and trust handled for you.
              </p>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.16 }} className="mt-8 inline-block">
                <Link to="/become-a-seller" className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold" style={{ background: GOLD, color: INK }}>
                  Become a Seller <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
            <div className="hidden overflow-hidden rounded-[28px] lg:block">
              <img src="https://images.unsplash.com/photo-1571908599407-cdb918ed83bf?w=1200&q=85" alt="Indian retailer" className="h-80 w-full object-cover" loading="lazy" />
            </div>
          </div>
        </section>
      </div>
    </MarketplaceLayout>
  );
}
