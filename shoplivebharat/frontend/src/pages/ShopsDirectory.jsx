import { useEffect, useState } from "react";
import { MapPin, Instagram, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import ProductCard from "@/components/ProductCard";
import { fetchShops, fetchProducts } from "@/lib/api";
import { MOCK_SHOPS, MOCK_PRODUCTS } from "@/lib/testData";

export default function ShopsDirectory() {
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [shopsData, productsData] = await Promise.all([
                fetchShops({ active_only: true, limit: 100 }),
                fetchProducts({ active_only: true, limit: 200 }),
            ]);

            if (shopsData && shopsData.length > 0) {
                setShops(shopsData);
                setSelectedShop(shopsData[0]?.id || null);
            } else {
                setShops(MOCK_SHOPS);
                setSelectedShop(MOCK_SHOPS[0]?.id || null);
            }

            if (productsData && productsData.length > 0) {
                setProducts(productsData);
            } else {
                setProducts(MOCK_PRODUCTS);
            }

            console.log("✓ Loaded shops data");
        } catch (error) {
            console.error("❌ API Error - Using mock data:", error.message);
            toast.error("Backend not available - showing sample data");
            setShops(MOCK_SHOPS);
            setProducts(MOCK_PRODUCTS);
            setSelectedShop(MOCK_SHOPS[0]?.id || null);
        } finally {
            setLoading(false);
        }
    };

    // Get products for selected shop
    const shopProducts = selectedShop
        ? products.filter((p) => p.shop_id === selectedShop)
        : [];

    // Get selected shop details
    const currentShop = shops.find((s) => s.id === selectedShop);

    // Filter shops by search
    const filteredShops = shops.filter(
        (shop) =>
            shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <MarketplaceLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-espresso/60">Loading shops...</p>
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                        Ahmedabad Shops
                    </h1>
                    <p className="text-lg text-espresso/70">
                        Explore traditional clothing shops from Ahmedabad and discover authentic handcrafted pieces
                        from local artisans and designers.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Shops Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-line-soft p-6 sticky top-20">
                            {/* Search */}
                            <div className="mb-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-espresso/40" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search shops..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Shops List */}
                            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                                {filteredShops.length === 0 ? (
                                    <p className="text-sm text-espresso/60 text-center py-8">
                                        No shops found
                                    </p>
                                ) : (
                                    filteredShops.map((shop) => (
                                        <button
                                            key={shop.id}
                                            onClick={() => setSelectedShop(shop.id)}
                                            className={`w-full text-left p-4 rounded-lg transition border-2 ${
                                                selectedShop === shop.id
                                                    ? "border-maroon bg-maroon/5"
                                                    : "border-line-soft hover:border-maroon/50 hover:bg-gray-50"
                                            }`}
                                        >
                                            <h3 className="font-semibold text-espresso mb-1">
                                                {shop.name}
                                            </h3>
                                            <p className="text-xs text-espresso/60 mb-2">
                                                {shop.specialty}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-espresso/50">
                                                <MapPin size={14} />
                                                {shop.city}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {currentShop ? (
                            <>
                                {/* Shop Detail Card */}
                                <div className="bg-white rounded-lg border border-line-soft overflow-hidden mb-8">
                                    {/* Shop Image */}
                                    <div className="h-64 bg-gray-100 overflow-hidden">
                                        <img
                                            src={currentShop.image_url}
                                            alt={currentShop.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = "/shop-assets/banner-1.jpg";
                                            }}
                                        />
                                    </div>

                                    {/* Shop Info */}
                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h2 className="font-serif text-4xl text-espresso mb-2">
                                                    {currentShop.name}
                                                </h2>
                                                <p className="text-lg text-maroon font-semibold mb-4">
                                                    {currentShop.specialty}
                                                </p>
                                            </div>
                                            {currentShop.instagram_url && (
                                                <a
                                                    href={currentShop.instagram_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 border border-maroon text-maroon rounded-lg hover:bg-maroon hover:text-ivory transition"
                                                >
                                                    <Instagram size={18} />
                                                    Follow
                                                </a>
                                            )}
                                        </div>

                                        {/* Shop Description */}
                                        <p className="text-espresso/70 mb-6 leading-relaxed">
                                            {currentShop.description}
                                        </p>

                                        {/* Shop Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-line-soft">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-2">
                                                    Owner
                                                </p>
                                                <p className="text-espresso font-medium">
                                                    {currentShop.owner_name}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-2">
                                                    Location
                                                </p>
                                                <div className="flex items-center gap-2 text-espresso">
                                                    <MapPin size={16} className="text-maroon" />
                                                    {currentShop.city}, {currentShop.country}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-maroon font-semibold mb-2">
                                                    Email
                                                </p>
                                                <a
                                                    href={`mailto:${currentShop.owner_email}`}
                                                    className="text-maroon hover:text-maroon/70 transition"
                                                >
                                                    {currentShop.owner_email}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Products Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-bold text-espresso">
                                            Featured Products
                                        </h3>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/marketplace?shop=${currentShop.id}`
                                                )
                                            }
                                            className="flex items-center gap-2 text-maroon hover:text-maroon/70 transition font-medium"
                                        >
                                            View All
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>

                                    {shopProducts.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-line-soft">
                                            <p className="text-espresso/60">
                                                No products from this shop yet. Check back soon!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {shopProducts.slice(0, 6).map((product) => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-espresso/60">
                                    No shops available
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
