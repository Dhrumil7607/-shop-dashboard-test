import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Instagram, ShoppingBag, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { fetchShops, fetchProducts } from "@/lib/api";
import { MOCK_SHOPS, MOCK_PRODUCTS } from "@/lib/testData";

export default function PartnerStores() {
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
    const [shopProducts, setShopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadShops();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadShops = async () => {
        try {
            const data = await fetchShops({ active_only: true });
            if (data && data.length > 0) {
                setShops(data);
                setSelectedShop(data[0]);
                loadShopProducts(data[0].id);
            } else {
                setShops(MOCK_SHOPS);
                setSelectedShop(MOCK_SHOPS[0]);
                loadShopProducts(MOCK_SHOPS[0].id);
            }
        } catch (error) {
            console.error("Error loading shops:", error);
            setShops(MOCK_SHOPS);
            setSelectedShop(MOCK_SHOPS[0]);
            loadShopProducts(MOCK_SHOPS[0].id);
        } finally {
            setLoading(false);
        }
    };

    const loadShopProducts = async (shopId) => {
        try {
            const data = await fetchProducts({ active_only: true });
            if (data && data.length > 0) {
                setShopProducts(data.filter(p => p.shop_id === shopId).slice(0, 6));
            } else {
                setShopProducts(MOCK_PRODUCTS.filter(p => p.shop_id === shopId).slice(0, 6));
            }
        } catch (error) {
            console.error("Error loading products:", error);
            setShopProducts(MOCK_PRODUCTS.filter(p => p.shop_id === shopId).slice(0, 6));
        }
    };

    const handleShopSelect = (shop) => {
        setSelectedShop(shop);
        loadShopProducts(shop.id);
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                ease: [0.22, 0.61, 0.36, 1],
            },
        },
    };

    return (
        <MarketplaceLayout>
            {/* Hero Section with Glass Morphism */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-maroon/5 via-transparent to-maroon/5" />
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
                    className="relative max-w-7xl mx-auto px-6 py-16 md:py-24"
                >
                    <h1 className="font-serif text-5xl md:text-7xl text-espresso mb-4 text-center">
                        Premium Partner Stores
                    </h1>
                    <p className="text-lg md:text-xl text-espresso/60 text-center max-w-2xl mx-auto">
                        Discover curated collections from India's finest boutiques and designers
                    </p>
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Shop List with Glass Effect */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
                        className="lg:col-span-1"
                    >
                        <div className="sticky top-24 space-y-4">
                            {/* Search Input with Glass Effect */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search stores..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/40 placeholder:text-espresso/40 text-espresso focus:outline-none focus:ring-2 focus:ring-maroon/30 transition-all duration-300"
                                />
                            </div>

                            {/* Shops List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {filteredShops.map((shop, index) => (
                                    <motion.button
                                        key={shop.id}
                                        variants={itemVariants}
                                        onClick={() => handleShopSelect(shop)}
                                        className={`w-full p-4 rounded-xl transition-all duration-500 text-left group ${
                                            selectedShop?.id === shop.id
                                                ? "bg-gradient-to-br from-maroon to-maroon/80 text-ivory shadow-lg shadow-maroon/30"
                                                : "bg-white/40 backdrop-blur-sm border border-white/40 text-espresso hover:bg-white/60"
                                        }`}
                                    >
                                        <h3 className="font-semibold text-sm md:text-base line-clamp-1">
                                            {shop.name}
                                        </h3>
                                        <p className="text-xs opacity-70 line-clamp-1">
                                            {shop.owner_name}
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side - Shop Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
                        className="lg:col-span-3 space-y-8"
                    >
                        {selectedShop && (
                            <>
                                {/* Shop Hero Card with Glass Morphism */}
                                <motion.div
                                    key={selectedShop.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
                                    className="relative group rounded-3xl overflow-hidden"
                                >
                                    {/* Background Image */}
                                    {selectedShop.image_url && (
                                        <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-700">
                                            <img
                                                src={selectedShop.image_url}
                                                alt={selectedShop.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Glass Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-white/10 backdrop-blur-xl" />

                                    {/* Content */}
                                    <div className="relative p-8 md:p-12 min-h-64 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <h2 className="font-serif text-4xl md:text-5xl text-espresso mb-2">
                                                        {selectedShop.name}
                                                    </h2>
                                                    <p className="text-espresso/70 font-medium flex items-center gap-2">
                                                        <span className="text-maroon">•</span>
                                                        Curated by {selectedShop.owner_name}
                                                    </p>
                                                </div>
                                                {selectedShop.rating && (
                                                    <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/40">
                                                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                                        <span className="font-semibold text-espresso">{selectedShop.rating}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedShop.description && (
                                                <p className="text-espresso/80 text-lg leading-relaxed max-w-2xl">
                                                    {selectedShop.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30">
                                                <p className="text-xs uppercase tracking-wide text-espresso/60 font-semibold mb-1">
                                                    Location
                                                </p>
                                                <div className="flex items-center gap-2 text-espresso font-medium">
                                                    <MapPin size={16} className="text-maroon" />
                                                    <span>{selectedShop.location || "Ahmedabad"}</span>
                                                </div>
                                            </div>

                                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30">
                                                <p className="text-xs uppercase tracking-wide text-espresso/60 font-semibold mb-1">
                                                    Products
                                                </p>
                                                <div className="flex items-center gap-2 text-espresso font-medium">
                                                    <ShoppingBag size={16} className="text-maroon" />
                                                    <span>{shopProducts.length}+ Items</span>
                                                </div>
                                            </div>

                                            {selectedShop.instagram_handle && (
                                                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 col-span-2 md:col-span-1">
                                                    <p className="text-xs uppercase tracking-wide text-espresso/60 font-semibold mb-1">
                                                        Follow
                                                    </p>
                                                    <a
                                                        href={`https://instagram.com/${selectedShop.instagram_handle}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-maroon font-medium hover:text-maroon/70 transition-colors"
                                                    >
                                                        <Instagram size={16} />
                                                        <span>@{selectedShop.instagram_handle}</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Featured Products Grid */}
                                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                                    <h3 className="text-2xl md:text-3xl font-serif text-espresso mb-6">
                                        Featured Collection
                                    </h3>

                                    {shopProducts.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {shopProducts.map((product, index) => (
                                                <motion.div
                                                    key={product.id}
                                                    variants={itemVariants}
                                                    onClick={() => navigate(`/product/${product.id}`)}
                                                    className="group cursor-pointer"
                                                >
                                                    {/* Product Card with Glass Effect */}
                                                    <div className="relative rounded-2xl overflow-hidden bg-white/40 backdrop-blur-md border border-white/40 hover:border-white/60 transition-all duration-500 hover:shadow-2xl hover:shadow-maroon/10">
                                                        {/* Image Container */}
                                                        <div className="relative overflow-hidden h-64 md:h-72 bg-gradient-to-br from-maroon/5 to-maroon/10">
                                                            {product.image_url ? (
                                                                <>
                                                                    <img
                                                                        src={product.image_url}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                    />
                                                                    {product.discount && (
                                                                        <div className="absolute top-4 right-4 bg-maroon/80 backdrop-blur-md text-ivory px-3 py-1 rounded-full text-sm font-bold border border-white/30">
                                                                            -{product.discount}%
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-espresso/30">
                                                                    <ShoppingBag size={40} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="p-5">
                                                            <p className="text-xs uppercase tracking-wider text-maroon font-semibold mb-2">
                                                                {product.category}
                                                            </p>
                                                            <h4 className="font-semibold text-espresso text-lg mb-3 line-clamp-2">
                                                                {product.name}
                                                            </h4>

                                                            {/* Price */}
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <span className="text-lg font-bold text-espresso">
                                                                    ₹{Math.floor(product.price)}
                                                                </span>
                                                                {product.compare_at_price && (
                                                                    <span className="text-sm text-espresso/40 line-through">
                                                                        ₹{Math.floor(product.compare_at_price)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Stock Status */}
                                                            <div
                                                                className={`text-xs font-semibold ${
                                                                    product.stock > 0
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                }`}
                                                            >
                                                                {product.stock > 0
                                                                    ? `${product.stock} in stock`
                                                                    : "Out of stock"}
                                                            </div>
                                                        </div>

                                                        {/* Hover Button */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className="flex items-center gap-2 bg-maroon text-ivory px-6 py-2 rounded-lg font-semibold hover:bg-maroon/90 transition-colors"
                                                            >
                                                                View Details
                                                                <ArrowRight size={16} />
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-espresso/60">No products available for this shop</p>
                                        </div>
                                    )}

                                    {/* View All Products Button */}
                                    {shopProducts.length > 0 && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() =>
                                                navigate(
                                                    `/marketplace?shop=${encodeURIComponent(selectedShop.name)}`
                                                )
                                            }
                                            className="mt-8 w-full py-4 bg-gradient-to-r from-maroon to-maroon/80 text-ivory rounded-xl font-semibold hover:shadow-lg hover:shadow-maroon/30 transition-all duration-500 flex items-center justify-center gap-2"
                                        >
                                            View All Products from {selectedShop.name}
                                            <ArrowRight size={20} />
                                        </motion.button>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Info Section */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
                className="mt-20 bg-gradient-to-br from-maroon/5 to-maroon/10 border border-maroon/10 rounded-3xl p-12 max-w-7xl mx-auto mx-6 mb-20"
            >
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div>
                        <h3 className="font-serif text-3xl text-espresso mb-2">100+</h3>
                        <p className="text-espresso/60">Premium Partner Stores</p>
                    </div>
                    <div>
                        <h3 className="font-serif text-3xl text-espresso mb-2">10K+</h3>
                        <p className="text-espresso/60">Curated Collections</p>
                    </div>
                    <div>
                        <h3 className="font-serif text-3xl text-espresso mb-2">50+</h3>
                        <p className="text-espresso/60">Cities Across India</p>
                    </div>
                </div>
            </motion.div>
        </MarketplaceLayout>
    );
}
