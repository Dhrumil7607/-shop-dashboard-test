import { useEffect, useState, useMemo } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import ProductCard from "@/components/ProductCard";
import { fetchProducts } from "@/lib/api";
import { MOCK_PRODUCTS } from "@/lib/testData";

const CATEGORIES = [
    "All Categories","Sarees","Lehengas","Kurtas","Sherwanis","Chaniya Choli",
    "Kids Traditional","Wedding Collection","Festival Collection",
    "Couple Matching","Bridal Wear","Groom Wear",
];

const SORT_OPTIONS = [
    { label: "Newest",          value: "newest" },
    { label: "Price: Low → High", value: "price_low" },
    { label: "Price: High → Low", value: "price_high" },
    { label: "Most Popular",    value: "popular" },
];

const inp = {
    style: {
        backgroundColor: "white",
        border: "1px solid #E8E4DF",
        color: "#1a1a1a",
        borderRadius: "6px",
        fontSize: "13px",
        outline: "none",
        padding: "8px 12px",
    }
};

export default function Marketplace() {
    const [products,       setProducts]       = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [sort,           setSort]           = useState("newest");
    const [category,       setCategory]       = useState("All Categories");
    const [minPrice,       setMinPrice]       = useState("");
    const [maxPrice,       setMaxPrice]       = useState("");
    const [readyToShip,    setReadyToShip]    = useState(false);
    const [search,         setSearch]         = useState("");

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchProducts({ active_only: true, limit: 200 });
                setProducts(data?.length ? data : MOCK_PRODUCTS);
            } catch {
                setProducts(MOCK_PRODUCTS);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    let filtered = [...products];
    if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.shop_name || "").toLowerCase().includes(q) ||
            (p.category || "").toLowerCase().includes(q)
        );
    }
    if (category !== "All Categories") filtered = filtered.filter(p => p.category === category);
    if (minPrice) filtered = filtered.filter(p => p.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice));
    if (readyToShip) filtered = filtered.filter(p => p.ready_to_ship);
    switch (sort) {
        case "price_low":  filtered = filtered.sort((a, b) => a.price - b.price); break;
        case "price_high": filtered = filtered.sort((a, b) => b.price - a.price); break;
        case "popular":    filtered = filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break;
        default:           filtered = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const reset = () => { setCategory("All Categories"); setMinPrice(""); setMaxPrice(""); setReadyToShip(false); setSearch(""); };

    return (
        <MarketplaceLayout>
            {/* Page header */}
            <div className="px-6 md:px-12 py-8" style={{ backgroundColor: "#FAF9F6" }}>
                <div className="max-w-7xl mx-auto">
                    <h1 className="font-serif text-4xl md:text-5xl mb-2" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                        The Collection
                    </h1>
                    <p className="text-sm" style={{ color: "#9B8B7A" }}>
                        Every weave tells a story. Every thread, a tradition.
                    </p>
                </div>
            </div>

            <div className="px-6 md:px-12 pb-16" style={{ backgroundColor: "#FAF9F6" }}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* ── SIDEBAR ── */}
                        <aside className="lg:col-span-1 space-y-6">

                            {/* Search */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9B8B7A" }}>SEARCH</p>
                                <div className="relative">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Find your outfit…"
                                        className="w-full pl-8 pr-3 py-2 text-xs rounded border outline-none"
                                        style={{ backgroundColor: "white", border: "1px solid #E8E4DF", color: "#1a1a1a" }}
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9B8B7A" }}>CATEGORY</p>
                                <ul className="space-y-0.5">
                                    {CATEGORIES.map(cat => (
                                        <li key={cat}>
                                            <button
                                                onClick={() => setCategory(cat)}
                                                className="w-full text-left px-3 py-2 text-sm rounded transition"
                                                style={{
                                                    backgroundColor: category === cat ? "#1a1a1a" : "transparent",
                                                    color: category === cat ? "white" : "#4A3F35",
                                                    fontWeight: category === cat ? 600 : 400,
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Price */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9B8B7A" }}>PRICE (₹)</p>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                                        className="w-full py-2 px-3 text-xs rounded border outline-none"
                                        style={{ backgroundColor: "white", border: "1px solid #E8E4DF", color: "#1a1a1a" }} />
                                    <span style={{ color: "#9B8B7A" }}>–</span>
                                    <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                                        className="w-full py-2 px-3 text-xs rounded border outline-none"
                                        style={{ backgroundColor: "white", border: "1px solid #E8E4DF", color: "#1a1a1a" }} />
                                </div>
                            </div>

                            {/* Ready to ship */}
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={readyToShip} onChange={e => setReadyToShip(e.target.checked)}
                                    className="w-4 h-4 cursor-pointer accent-[#1a1a1a]" />
                                <span className="text-sm" style={{ color: "#4A3F35" }}>Ready to Ship</span>
                            </label>

                            {/* Reset */}
                            {(category !== "All Categories" || minPrice || maxPrice || readyToShip || search) && (
                                <button onClick={reset} className="text-xs underline transition hover:opacity-70" style={{ color: "#8B3A3A" }}>
                                    Clear all filters
                                </button>
                            )}
                        </aside>

                        {/* ── PRODUCTS ── */}
                        <div className="lg:col-span-3">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-5">
                                <p className="text-sm" style={{ color: "#9B8B7A" }}>
                                    {loading ? "Loading…" : `${filtered.length} pieces`}
                                </p>
                                <div className="relative">
                                    <select value={sort} onChange={e => setSort(e.target.value)}
                                        className="appearance-none pl-3 pr-8 py-2 text-sm rounded border outline-none cursor-pointer"
                                        style={{ backgroundColor: "white", border: "1px solid #E8E4DF", color: "#1a1a1a" }}>
                                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9B8B7A" }} />
                                </div>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="rounded-lg mb-3 bg-gray-200" style={{ aspectRatio: "3/4" }} />
                                            <div className="h-2 bg-gray-200 rounded w-1/2 mb-1.5" />
                                            <div className="h-3 bg-gray-200 rounded w-full mb-1.5" />
                                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                                        </div>
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <p className="font-serif text-2xl mb-3" style={{ color: "#1a1a1a" }}>No products found</p>
                                    <p className="text-sm mb-6" style={{ color: "#9B8B7A" }}>Try adjusting your filters.</p>
                                    <button onClick={reset} className="px-5 py-2 rounded text-sm font-semibold text-white transition hover:opacity-90"
                                        style={{ backgroundColor: "#1a1a1a" }}>
                                        Clear filters
                                    </button>
                                </div>
            ) : (
                                <motion.div
                                    className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: {},
                                        visible: { transition: { staggerChildren: 0.04 } }
                                    }}
                                >
                                    {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
