import { useEffect, useState } from "react";
import { Filter, Grid3x3, List, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import ProductCard from "@/components/ProductCard";
import { fetchProducts, fetchShops } from "@/lib/api";
import { MOCK_PRODUCTS, MOCK_SHOPS } from "@/lib/testData";

export default function Marketplace() {
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("grid");
    const [sortBy, setSortBy] = useState("newest");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterPrice, setFilterPrice] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsData, shopsData] = await Promise.all([
                fetchProducts({ active_only: true, limit: 200 }),
                fetchShops({ active_only: true, limit: 100 }),
            ]);
            
            if (productsData && productsData.length > 0) {
                setProducts(productsData);
            } else {
                setProducts(MOCK_PRODUCTS);
            }
            
            if (shopsData && shopsData.length > 0) {
                setShops(shopsData);
            } else {
                setShops(MOCK_SHOPS);
            }
            
            console.log("✓ Loaded from API:", { productsData, shopsData });
        } catch (error) {
            console.error("❌ API Error - Using mock data:", error.message);
            console.error("Full error:", error);
            
            // Show error toast so users know API isn't working
            toast.error("Backend not available - showing sample data. Make sure the backend is running on port 8001.");
            
            // Fallback to mock data
            setProducts(MOCK_PRODUCTS);
            setShops(MOCK_SHOPS);
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories
    const categories = ["all", ...new Set(products.map((p) => p.category))];

    // Filter and sort products
    let filteredProducts = products;

    if (filterCategory !== "all") {
        filteredProducts = filteredProducts.filter((p) => p.category === filterCategory);
    }

    if (filterPrice !== "all") {
        const [min, max] = filterPrice.split("-").map(Number);
        filteredProducts = filteredProducts.filter((p) => p.price >= min && p.price <= max);
    }

    // Sort
    switch (sortBy) {
        case "price_low":
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case "price_high":
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case "popular":
            filteredProducts.sort((a, b) => b.is_featured - a.is_featured);
            break;
        case "newest":
        default:
            filteredProducts.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
    }

    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                        Marketplace
                    </h1>
                    <p className="text-lg text-espresso/70 mb-6">
                        Discover curated collection of Indian luxury fashion from {shops.length} exclusive
                        artisans and designers.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/shops"
                            className="flex items-center gap-2 px-6 py-3 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition font-medium"
                        >
                            Explore Ahmedabad Shops
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
                        <div className="bg-gray-50 rounded-lg p-6 border border-line-soft sticky top-20">
                            <div className="flex items-center justify-between mb-6 lg:mb-0">
                                <h2 className="font-semibold text-lg text-espresso">Filters</h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="lg:hidden text-espresso/60 hover:text-espresso"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Sort */}
                            <div className="mb-8 pb-8 border-b border-line-soft">
                                <label className="block text-xs uppercase tracking-widest text-maroon font-semibold mb-4">
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-3 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none text-sm"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="popular">Most Popular</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-8 pb-8 border-b border-line-soft">
                                <label className="block text-xs uppercase tracking-widest text-maroon font-semibold mb-4">
                                    Category
                                </label>
                                <div className="space-y-3">
                                    {categories.map((cat) => (
                                        <label
                                            key={cat}
                                            className="flex items-center gap-3 cursor-pointer"
                                        >
                                            <input
                                                type="radio"
                                                name="category"
                                                value={cat}
                                                checked={filterCategory === cat}
                                                onChange={(e) => setFilterCategory(e.target.value)}
                                                className="rounded border-line-soft accent-maroon"
                                            />
                                            <span className="text-sm text-espresso capitalize">
                                                {cat === "all" ? "All Categories" : cat}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Filter */}
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-maroon font-semibold mb-4">
                                    Price Range
                                </label>
                                <div className="space-y-3">
                                    {[
                                        { label: "All Prices", value: "all" },
                                        { label: "Under ₹2,500", value: "0-2500" },
                                        { label: "₹2,500 - ₹5,000", value: "2500-5000" },
                                        { label: "₹5,000 - ₹10,000", value: "5000-10000" },
                                        { label: "Above ₹10,000", value: "10000-999999" },
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="price"
                                                value={option.value}
                                                checked={filterPrice === option.value}
                                                onChange={(e) => setFilterPrice(e.target.value)}
                                                className="rounded border-line-soft accent-maroon"
                                            />
                                            <span className="text-sm text-espresso">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Reset Filters */}
                            <button
                                onClick={() => {
                                    setSortBy("newest");
                                    setFilterCategory("all");
                                    setFilterPrice("all");
                                }}
                                className="w-full mt-8 py-2 border border-maroon text-maroon rounded-lg hover:bg-maroon/5 transition font-medium text-sm"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Products Section */}
                    <div className="lg:col-span-3">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-line-soft">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-line-soft rounded-lg hover:bg-gray-50 transition"
                                >
                                    <Filter size={18} />
                                    Filters
                                </button>
                                <p className="text-sm text-espresso/70">
                                    Showing {filteredProducts.length} products
                                </p>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="hidden md:flex items-center gap-2 border border-line-soft rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 transition ${
                                        viewMode === "grid"
                                            ? "bg-maroon text-ivory"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    <Grid3x3 size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 transition ${
                                        viewMode === "list"
                                            ? "bg-maroon text-ivory"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Products Grid/List */}
                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <p className="text-espresso/60">Loading products...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-96">
                                <p className="text-espresso/60 text-lg mb-4">
                                    No products found with your filters
                                </p>
                                <button
                                    onClick={() => {
                                        setSortBy("newest");
                                        setFilterCategory("all");
                                        setFilterPrice("all");
                                    }}
                                    className="text-maroon hover:text-maroon/70 font-medium transition"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div
                                className={
                                    viewMode === "grid"
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                        : "space-y-6"
                                }
                            >
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}

