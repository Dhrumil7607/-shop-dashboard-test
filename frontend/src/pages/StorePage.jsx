/**
 * StorePage.jsx — Luxury branded storefront at /shops/:shopId
 *
 * Features: Hero Banner, Store Logo, Verified Badge, Location, Followers,
 * Products Count, Rating, Store Story, Categories, Featured Products,
 * New Arrivals, Wedding Collection, Best Sellers, Customer Reviews,
 * Policies, Contact, Follow/Share, All Products Search/Filter/Sort.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2, Heart, MapPin, Star, Users, Package,
  Search, Instagram, Mail, Phone, Share2, ArrowRight,
  Filter, ChevronDown, X, SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";

// ── localStorage helpers ──────────────────────────────────────────────────────
function getFollowedStores(userId) {
  if (!userId) return {};
  try { return JSON.parse(localStorage.getItem(`slb_followed_stores_${userId}`) || "{}"); }
  catch { return {}; }
}
function setFollowedStores(userId, data) {
  if (!userId) return;
  try { localStorage.setItem(`slb_followed_stores_${userId}`, JSON.stringify(data)); }
  catch {}
}

// ── Star rating component ─────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={size}
          className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-stone-200 fill-stone-200"} />
      ))}
      <span className="ml-1 text-sm font-medium" style={{ color: "#6B5E52" }}>{Number(rating).toFixed(1)}</span>
    </span>
  );
}

// ── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest",   label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

function sortProducts(products, sort) {
  const p = [...products];
  if (sort === "newest") return p.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (sort === "price_asc") return p.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") return p.sort((a, b) => b.price - a.price);
  return p.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
}

// ── Mock reviews ─────────────────────────────────────────────────────────────
const MOCK_REVIEWS = [
  { id: 1, author: "Priya M.", avatar: "PM", rating: 5, text: "Absolutely stunning craftsmanship. The lehenga arrived beautifully packaged and exactly as described. Will definitely order again!", date: "2 weeks ago" },
  { id: 2, author: "Anjali S.", avatar: "AS", rating: 5, text: "Best purchase I've made online. The fabric quality is exceptional and the embroidery is intricate and perfect. Highly recommend!", date: "1 month ago" },
  { id: 3, author: "Meera K.", avatar: "MK", rating: 4, text: "Lovely pieces, very authentic. Delivery was prompt and packaging was premium. Minor alteration needed but store helped right away.", date: "6 weeks ago" },
  { id: 4, author: "Nisha P.", avatar: "NP", rating: 5, text: "I wore this for my daughter's wedding and received so many compliments. The colors are vibrant and the material is pure silk.", date: "2 months ago" },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function StorePage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [shop,     setShop]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [search,   setSearch]   = useState("");
  const [sort,     setSort]     = useState("featured");
  const [category, setCategory] = useState("All");
  const [showSort, setShowSort] = useState(false);

  const [isFollowed,         setIsFollowed]         = useState(false);
  const [localFollowerDelta, setLocalFollowerDelta] = useState(0);
  const [refetchKey, setRefetchKey] = useState(0);

  // Re-fetch on window focus (so admin changes reflect instantly when switching tabs)
  useEffect(() => {
    const onFocus = () => setRefetchKey(k => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // ── Fetch data (backend is source of truth) ─────────────────────────────────
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const { fetchPublicShops, fetchProducts } = await import("@/lib/api");
        const shops = await fetchPublicShops(1000).catch(() => []);
        const found = (shops || []).find((s) => s.id === shopId || s.slug === shopId);
        if (!found) {
          toast.error("This store is not available");
          navigate("/shops");
          return;
        }
        setShop(found);
        const prods = await fetchProducts({ shop_id: found.id, active_only: true, limit: 500 }).catch(() => []);
        setProducts(Array.isArray(prods) ? prods : []);
      } catch {
        toast.error("Failed to load store");
        navigate("/shops");
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId, navigate, refetchKey]);

  // ── Follow state ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !shop?.id) return;
    const stored = getFollowedStores(user.id);
    setIsFollowed(stored[shop.id] === true);
  }, [user?.id, shop?.id]);

  const handleFollow = useCallback(() => {
    if (!isLoggedIn) { toast("Please log in to follow stores"); return; }
    const stored = getFollowedStores(user.id);
    if (isFollowed) {
      const updated = { ...stored }; delete updated[shop.id];
      setFollowedStores(user.id, updated);
      setIsFollowed(false); setLocalFollowerDelta((d) => d - 1);
      toast("Unfollowed store");
    } else {
      setFollowedStores(user.id, { ...stored, [shop.id]: true });
      setIsFollowed(true); setLocalFollowerDelta((d) => d + 1);
      toast.success("Following store!");
    }
  }, [isLoggedIn, isFollowed, user?.id, shop?.id]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: shop?.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copied!"));
    }
  }, [shop]);

  // ── Derived product lists ────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (search.trim().length >= 2) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return sortProducts(list, sort);
  }, [products, category, search, sort]);

  const featured   = useMemo(() => products.filter((p) => p.is_featured).slice(0, 4), [products]);
  const newArrivals = useMemo(() => sortProducts(products, "newest").slice(0, 4), [products]);
  const weddingColl = useMemo(() => products.filter((p) =>
    ["Wedding Wear", "Lehengas", "Sherwanis", "Bridal Wear"].includes(p.category)).slice(0, 4), [products]);
  const bestSellers = useMemo(() => products.filter((p) => p.is_active && p.stock > 0)
    .sort((a, b) => (b.compare_at_price || 0) - (a.compare_at_price || 0)).slice(0, 4), [products]);

  const displayFollowers = (shop?.followers ?? 0) + localFollowerDelta;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <MarketplaceLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div className="w-10 h-10 rounded-full border-2"
          style={{ borderColor: "#C9A84C" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
          <span className="w-full h-full flex items-center justify-center font-serif font-bold text-sm" style={{ color: "#C9A84C" }}>S</span>
        </motion.div>
      </div>
    </MarketplaceLayout>
  );

  if (!shop) return null;

  const bannerSrc = shop.banner_image || shop.image_url;
  const productCount = shop.product_count ?? shop.productCount ?? products.length;

  return (
    <MarketplaceLayout>
      <motion.div style={{ backgroundColor: "#FAF9F6" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

        {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden" style={{ height: "380px", maxHeight: "480px" }}>
          {bannerSrc ? (
            <img src={bannerSrc} alt={`${shop.name} banner`}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 30%" }}
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }} />
          ) : null}
          {/* Fallback banner — gradient + store initials */}
          <div className="w-full h-full flex items-center justify-center"
            style={{ display: bannerSrc ? "none" : "flex", height: "380px",
              background: "linear-gradient(135deg, #1a1a1a 0%, #2C241B 50%, #3a2a1a 100%)" }}>
            <span className="font-serif text-8xl font-bold opacity-15" style={{ color: "#C9A84C" }}>
              {shop.name?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          {/* Gradient scrim */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,10,10,0.1) 0%, rgba(26,10,10,0.55) 100%)" }} />
          {/* Breadcrumb */}
          <div className="absolute top-6 left-8 flex items-center gap-2 text-xs text-white/80">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <span>›</span>
            <Link to="/shops" className="hover:text-white transition">Stores</Link>
            <span>›</span>
            <span className="text-white">{shop.name}</span>
          </div>
          {/* Share + Follow buttons on banner */}
          <div className="absolute top-6 right-8 flex items-center gap-2">
            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs font-medium transition hover:bg-white/30 min-h-[40px]">
              <Share2 size={13} /> Share
            </button>
            <button onClick={handleFollow}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition min-h-[40px]"
              style={{ backgroundColor: isFollowed ? "white" : "rgba(162,70,107,0.9)", color: isFollowed ? "#A2466B" : "white" }}>
              <Heart size={13} className={isFollowed ? "fill-rose-500 text-rose-500" : ""} />
              {isFollowed ? "Following" : "Follow Store"}
            </button>
          </div>
        </div>

        {/* ── STORE IDENTITY STRIP ─────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="relative -mt-14 flex items-end gap-5 pb-6 border-b" style={{ borderColor: "#E8E4DF" }}>
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: "#F0EBE3" }}>
              {(shop.image_url || shop.logo) ? (
                <img src={shop.image_url || shop.logo} alt={shop.name} className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }} />
              ) : null}
              <span className="font-serif text-2xl font-bold w-full h-full flex items-center justify-center"
                style={{ color: "#2C241B", display: (shop.image_url || shop.logo) ? "none" : "flex" }}>
                {shop.name?.slice(0, 2).toUpperCase()}
              </span>
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0 pt-14">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif text-2xl md:text-3xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                  {shop.name}
                </h1>
                {shop.verified && (
                  <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-50 flex-shrink-0" aria-label="Verified store" />
                )}
                {/* Online / offline status */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: shop.online !== false ? "rgba(45,122,58,0.1)" : "rgba(139,58,58,0.08)",
                    color: shop.online !== false ? "#2D7A3A" : "#8B3A3A",
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: shop.online !== false ? "#2D7A3A" : "#8B3A3A" }} />
                  {shop.online !== false ? "Online" : "Offline"}
                </span>
                {shop.liveShoppingEnabled !== false && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(192,57,43,0.1)", color: "#C0392B" }}>
                    ● Live Shopping
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap mt-2">
                {shop.city && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: "#9B8B7A" }}>
                    <MapPin size={13} /> {shop.city}{shop.country ? `, ${shop.country}` : ""}
                  </span>
                )}
                <Stars rating={shop.rating ?? 4.8} size={13} />
                <span className="flex items-center gap-1 text-sm" style={{ color: "#9B8B7A" }}>
                  <Users size={13} />
                  <strong style={{ color: "#1a1a1a" }}>
                    {displayFollowers >= 1000 ? `${(displayFollowers / 1000).toFixed(1)}k` : displayFollowers}
                  </strong> followers
                </span>
                <span className="flex items-center gap-1 text-sm" style={{ color: "#9B8B7A" }}>
                  <Package size={13} />
                  <strong style={{ color: "#1a1a1a" }}>{productCount}</strong> products
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-16">

          {/* ── STORE STORY + CATEGORIES ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Story */}
            <div className="lg:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>OUR STORY</p>
              <h2 className="font-serif text-2xl mb-4" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                {shop.specialty || "Handcrafted with love"}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#6B5E52" }}>
                {shop.description || "A trusted artisan store bringing you authentic Indian craftsmanship."}
              </p>
              {shop.instagram_url && (
                <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-xs font-medium transition hover:opacity-70"
                  style={{ color: "#A2466B" }}>
                  <Instagram size={14} /> Follow on Instagram
                </a>
              )}
            </div>

            {/* Categories */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#F0EBE3" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8B7A" }}>CATEGORIES</p>
              <div className="flex flex-wrap gap-2">
                {categories.filter((c) => c !== "All").map((cat) => (
                  <button key={cat}
                    onClick={() => { setCategory(cat); document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" }); }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition border"
                    style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#3C3027" }}>
                    {cat}
                  </button>
                ))}
                {categories.length <= 1 && (
                  <span className="text-xs" style={{ color: "#9B8B7A" }}>
                    {shop.specialty || "All categories"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── FEATURED PRODUCTS ────────────────────────────────────────── */}
          {featured.length > 0 && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>FEATURED</p>
              <h2 className="font-serif text-2xl mb-6" style={{ color: "#1a1a1a", fontWeight: 400 }}>Signature Pieces</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
                {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </section>
          )}

          {/* ── NEW ARRIVALS ─────────────────────────────────────────────── */}
          {newArrivals.length > 0 && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>JUST IN</p>
              <h2 className="font-serif text-2xl mb-6" style={{ color: "#1a1a1a", fontWeight: 400 }}>New Arrivals</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
                {newArrivals.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </section>
          )}

          {/* ── WEDDING COLLECTION ───────────────────────────────────────── */}
          {weddingColl.length > 0 && (
            <section className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#2C1810" }}>
              <div className="px-8 py-10">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>BRIDAL & GROOM</p>
                <h2 className="font-serif text-3xl mb-8 text-white" style={{ fontWeight: 400 }}>
                  Wedding Collection
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
                  {weddingColl.map((p, i) => <ProductCard key={p.id} product={p} index={i} darkBg={true} />)}
                </div>
              </div>
            </section>
          )}

          {/* ── BEST SELLERS ─────────────────────────────────────────────── */}
          {bestSellers.length > 0 && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>TOP PICKS</p>
              <h2 className="font-serif text-2xl mb-6" style={{ color: "#1a1a1a", fontWeight: 400 }}>Best Sellers</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
                {bestSellers.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </section>
          )}

          {/* ── CUSTOMER REVIEWS ─────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>WHAT CUSTOMERS SAY</p>
            <div className="flex items-end gap-4 mb-6">
              <h2 className="font-serif text-2xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>Customer Reviews</h2>
              <div className="mb-0.5"><Stars rating={shop.rating ?? 4.8} size={16} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_REVIEWS.map((review) => (
                <div key={review.id} className="rounded-2xl p-5 border" style={{ borderColor: "#E8E4DF", backgroundColor: "white" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "#F0EBE3", color: "#2C241B" }}>
                      {review.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{review.author}</p>
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} size={11} />
                        <span className="text-xs" style={{ color: "#9B8B7A" }}>{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B5E52" }}>{review.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── POLICIES & CONTACT ───────────────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Policies */}
            <div className="rounded-2xl p-6 border" style={{ borderColor: "#E8E4DF", backgroundColor: "white" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8B7A" }}>STORE POLICIES</p>
              <div className="space-y-3 text-sm" style={{ color: "#6B5E52" }}>
                {[
                  ["🚚 Delivery", `${shop.shippingEstimate || "5-8 days"} worldwide`],
                  ["✏️ Alterations", "Free alterations ±2\" within 7 days of delivery"],
                  ["↩️ Returns", "7-day easy return for unworn items with tags"],
                  ["🔒 Authenticity", "100% authentic handcrafted products"],
                  ["💎 Quality", "Each piece inspected before dispatch"],
                ].map(([icon, text]) => (
                  <div key={icon} className="flex items-start gap-3">
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-2xl p-6 border" style={{ borderColor: "#E8E4DF", backgroundColor: "white" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9B8B7A" }}>GET IN TOUCH</p>
              <div className="space-y-3">
                {shop.owner_email && (
                  <a href={`mailto:${shop.owner_email}`}
                    className="flex items-center gap-3 text-sm transition hover:opacity-70"
                    style={{ color: "#6B5E52" }}>
                    <Mail size={15} style={{ color: "#C9A84C" }} />
                    {shop.owner_email}
                  </a>
                )}
                {shop.instagram_url && (
                  <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm transition hover:opacity-70"
                    style={{ color: "#6B5E52" }}>
                    <Instagram size={15} style={{ color: "#C9A84C" }} />
                    Instagram
                  </a>
                )}
                <div className="flex items-center gap-3 text-sm" style={{ color: "#6B5E52" }}>
                  <MapPin size={15} style={{ color: "#C9A84C" }} />
                  {shop.city}{shop.country ? `, ${shop.country}` : ""}
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={handleFollow}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition min-h-[44px]"
                  style={{ backgroundColor: isFollowed ? "#F0EBE3" : "#1a1a1a", color: isFollowed ? "#1a1a1a" : "white" }}>
                  <Heart size={14} className={isFollowed ? "fill-rose-500 text-rose-500" : ""} />
                  {isFollowed ? "Following" : "Follow Store"}
                </button>
                <button onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition min-h-[44px]"
                  style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>
          </section>

          {/* ── ALL PRODUCTS ─────────────────────────────────────────────── */}
          <section id="all-products">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>BROWSE</p>
            <h2 className="font-serif text-2xl mb-6" style={{ color: "#1a1a1a", fontWeight: 400 }}>All Products</h2>

            {/* Search + Sort + Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px]"
                  style={{ borderColor: "#E8E4DF", backgroundColor: "white" }} />
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button onClick={() => setShowSort((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition min-h-[44px]"
                  style={{ borderColor: "#E8E4DF", backgroundColor: "white", color: "#3C3027" }}>
                  <SlidersHorizontal size={14} />
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-1 right-0 z-20 rounded-xl border shadow-lg overflow-hidden min-w-[180px]"
                      style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value}
                          onClick={() => { setSort(opt.value); setShowSort(false); }}
                          className="w-full text-left px-4 py-3 text-sm transition hover:bg-stone-50"
                          style={{ color: sort === opt.value ? "#A2466B" : "#3C3027", fontWeight: sort === opt.value ? 600 : 400 }}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition min-h-[36px]"
                  style={{
                    backgroundColor: category === cat ? "#1a1a1a" : "#F0EBE3",
                    color: category === cat ? "white" : "#3C3027",
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Product grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                {filteredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: "#9B8B7A" }}>
                  {search.trim().length >= 2
                    ? `No products match "${search}"`
                    : `No products in ${category} yet.`}
                </p>
                {(search || category !== "All") && (
                  <button onClick={() => { setSearch(""); setCategory("All"); }}
                    className="mt-3 text-xs font-medium underline" style={{ color: "#A2466B" }}>
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </section>

        </div>
      </motion.div>
    </MarketplaceLayout>
  );
}
