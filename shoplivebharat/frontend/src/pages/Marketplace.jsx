import { useEffect, useState } from "react";
import { Filter, ChevronDown, X } from "lucide-react";
import { Link } from "react-router-dom";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import ProductCard from "@/components/ProductCard";
import { fetchProducts, fetchShops } from "@/lib/api";
import { MOCK_PRODUCTS, MOCK_SHOPS } from "@/lib/testData";

const PRICE_RANGES = [
    { label: "All Prices",         value: "all" },
    { label: "Under ₹5,000",       value: "0-5000" },
    { label: "₹5,000 – ₹15,000",  value: "5000-15000" },
    { label: "₹15,000 – ₹40,000", value: "15000-40000" },
    { label: "Above ₹40,000",      value: "40000-999999" },
];

const SORT_OPTIONS = [
    { label: "Newest First",        value: "newest" },
    { label: "Price: Low → High",   value: "price_low" },
    { label: "Price: High → Low",   value: "price_high" },
    { label: "Most Popular",        value: "popular" },
];

export default function Marketplace() {
    const [products,        setProducts]        = useState([]);
    const [loading,         setLoading]         = useState(true);
    const [sortBy,          setSortBy]          = useState("newest");
    const [filterCategory,  setFilterCategory]  = useState("all");
    const [filterPrice,     setFilterPrice]     = useState("all");
    const [showFilters,     setShowFilters]     = useState(false);
    const [searchQuery,     setSearchQuery]     = useState("");

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

    // categories derived from products
    const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    // filter + sort
    let filtered = products;
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.shop_name || "").toLowerCase().includes(q) ||
            (p.category || "").toLowerCase().includes(q)
        );
    }
    if (filterCategory !== "all") filtered = filtered.filter(p => p.category === filterCategory);
    if (filterPrice !== "all") {
        const [min, max] = filterPrice.split("-").map(Number);
        filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }
    switch (sortBy) {
        case "price_low":  filtered = [...filtered].sort((a, b) => a.price - b.price); break;
        case "price_high": filtered = [...filtered].sort((a, b) => b.price - a.price); break;
        case "popular":    filtered = [...filtered].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break;
        default:           filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const reset = () => { setSortBy("newest"); setFilterCategory("all"); setFilterPrice("all"); setSearchQuery(""); };

    return (
        <MarketplaceLayout>
            {/* ── Page header ── */}
            <div className="bg-[#0a0a0a] text-white py-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-maroon font-bold mb-3">ALL COLLECTIONS</p>
                    <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">Shop Indian Fashion</h1>
                    <p className="text-white/50 text-sm max-w-lg">
                        Authentic sarees, lehengas, sherwanis, chaniya choli and wedding collections from India's finest local stores.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

                    {/* ── Toolbar ── */}
                    <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-[#0a0a0a] hover:border-[#0a0a0a] transition"
                            >
                                <Filter size={15} />
                                Filters
                                {(filterCategory !== "all" || filterPrice !== "all") && (
                                    <span className="bg-maroon text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {(filterCategory !== "all" ? 1 : 0) + (filterPrice !== "all" ? 1 : 0)}
                                    </span>
                                )}
                            </button>
                            <span className="text-sm text-gray-500">{filtered.length} products</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative hidden sm:block">
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search products…"
                                    className="pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0a0a0a] bg-white w-52 transition"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0a0a0a]">
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0a0a0a] bg-white cursor-pointer font-medium"
                                >
                                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* ── Filters panel ── */}
                        {showFilters && (
                            <aside className="lg:col-span-1 bg-white rounded-xl border border-gray-100 p-6 h-fit sticky top-20 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-bold text-[#0a0a0a] text-sm uppercase tracking-wider">Filter</h2>
                                    <button onClick={reset} className="text-xs text-maroon hover:text-maroon/70 font-semibold transition">
                                        Reset all
                                    </button>
                                </div>

                                {/* Category */}
                                <div className="mb-7">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Category</p>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setFilterCategory(cat)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                                                    filterCategory === cat
                                                        ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                                                        : "bg-white text-[#0a0a0a] border-gray-200 hover:border-[#0a0a0a]"
                                                }`}
                                            >
                                                {cat === "all" ? "All" : cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price */}
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Price Range</p>
                                    <div className="space-y-2.5">
                                        {PRICE_RANGES.map(opt => (
                                            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${filterPrice === opt.value ? "border-[#0a0a0a] bg-[#0a0a0a]" : "border-gray-300 group-hover:border-[#0a0a0a]"}`}>
                                                    {filterPrice === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                <input type="radio" name="price" value={opt.value} checked={filterPrice === opt.value}
                                                    onChange={e => setFilterPrice(e.target.value)} className="sr-only" />
                                                <span className="text-sm text-[#0a0a0a]">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        )}

                        {/* ── Products grid ── */}
                        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
                            {loading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
                                            <div className="bg-gray-200" style={{ aspectRatio: "3/4" }} />
                                            <div className="p-4 space-y-2">
                                                <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                                                <div className="h-3.5 bg-gray-200 rounded w-full" />
                                                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                                                <div className="h-8 bg-gray-200 rounded mt-3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <p className="font-serif text-2xl text-[#0a0a0a] mb-3">No products found</p>
                                    <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or search query.</p>
                                    <button onClick={reset}
                                        className="px-6 py-2.5 bg-[#0a0a0a] text-white rounded-lg text-sm font-semibold hover:bg-maroon transition">
                                        Clear all filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                    {filtered.map(p => <ProductCard key={p.id} product={p} />)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
