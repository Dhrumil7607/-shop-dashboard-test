/**
 * Store Details Panel Component
 * Displays detailed information about a selected store
 * Shows hero image, shop details, info cards, and featured products
 * Desktop side panel or mobile full-screen view
 */

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, MapPin, ShoppingBag, Instagram, Heart, Share2, Star, Users, Truck, ExternalLink } from "lucide-react";
import ProductGrid from "./ProductGrid";

const StoreDetailsPanel = memo(function StoreDetailsPanel({
    store,
    products = [],
    onClose,
    onProductClick,
    onAddToCart,
    loading = false,
    isMobile = false,
}) {
    // Hooks must be called before any early returns
    const navigate = useNavigate();
    const handleProductClick = useCallback(
        (product) => {
            onProductClick?.(product);
        },
        [onProductClick]
    );

    const handleAddToCart = useCallback(
        (product) => {
            onAddToCart?.(product);
        },
        [onAddToCart]
    );

    if (!store) return null;

    const {
        name,
        image_url,
        owner_name,
        rating = 0,
        followers = 0,
        productCount = 0,
        location = "Ahmedabad",
        specialty,
        description,
        instagram_handle,
        verified = false,
        deliveryDays = 2,
        shippingEstimate = "2-5 days",
    } = store;

    // Humanize follower count
    const humanizedFollowers = followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : followers.toString();

    const panelVariants = {
        hidden: { x: "100%" },
        visible: {
            x: 0,
            transition: {
                duration: 0.4,
                ease: [0.22, 0.61, 0.36, 1],
            },
        },
        exit: {
            x: "100%",
            transition: {
                duration: 0.3,
            },
        },
    };

    const contentVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                delay: 0.1,
            },
        },
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-40"
                />
            )}

            {/* Panel */}
            <motion.div
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`fixed inset-y-0 right-0 bg-white overflow-y-auto z-50 lg:static lg:inset-auto ${isMobile ? "w-full" : "w-full lg:w-1/2"}`}
            >
                {/* Header with Close Button */}
                <div className="sticky top-0 bg-white border-b border-maroon/10 p-4 md:p-6 flex items-center justify-between lg:hidden z-10">
                    <h2 className="font-serif text-2xl text-espresso">{name}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-maroon/10 rounded-lg transition-colors"
                        aria-label="Close store details"
                    >
                        <X size={24} className="text-espresso" />
                    </button>
                </div>

                {/* Content */}
                <motion.div variants={contentVariants} initial="hidden" animate="visible" className="p-6 md:p-8 lg:p-0">
                    {/* Hero Image */}
                    {image_url && (
                        <motion.div
                            className="relative overflow-hidden h-64 md:h-80 rounded-2xl mb-8 group"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img
                                src={image_url}
                                alt={name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                            {/* Action Buttons */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-3 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg transition-all"
                                    aria-label="Add to favorites"
                                >
                                    <Heart size={20} className="text-maroon" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-3 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg transition-all"
                                    aria-label="Share store"
                                >
                                    <Share2 size={20} className="text-maroon" />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Store Header Info */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="font-serif text-4xl md:text-5xl text-espresso mb-2">{name}</h1>
                                {owner_name && (
                                    <p className="text-lg text-espresso/60 mb-2">by {owner_name}</p>
                                )}
                                {specialty && (
                                    <p className="text-espresso/70 font-medium">{specialty}</p>
                                )}
                            </div>
                        </div>

                        {verified && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                                <span className="text-sm font-semibold text-green-700">Verified Seller</span>
                            </div>
                        )}

                        {/* Visit Store CTA */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/shops/${store.id}`)}
                            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                            style={{ backgroundColor: "#1a1a1a", color: "white" }}
                        >
                            <ExternalLink size={14} />
                            Visit Full Store
                        </motion.button>
                    </div>

                    {/* Description */}
                    {description && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-espresso/70 leading-relaxed mb-8 italic"
                        >
                            "{description}"
                        </motion.p>
                    )}

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        {/* Rating */}
                        <div className="bg-maroon/5 rounded-xl p-4 border border-maroon/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-2xl font-bold text-espresso">{rating}</span>
                            </div>
                            <p className="text-xs text-espresso/60 uppercase tracking-wide">Rating</p>
                        </div>

                        {/* Followers */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={18} className="text-blue-600" />
                                <span className="text-2xl font-bold text-espresso">{humanizedFollowers}</span>
                            </div>
                            <p className="text-xs text-espresso/60 uppercase tracking-wide">Followers</p>
                        </div>

                        {/* Products */}
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <ShoppingBag size={18} className="text-purple-600" />
                                <span className="text-2xl font-bold text-espresso">{productCount}</span>
                            </div>
                            <p className="text-xs text-espresso/60 uppercase tracking-wide">Products</p>
                        </div>

                        {/* Delivery */}
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Truck size={18} className="text-emerald-600" />
                                <span className="text-2xl font-bold text-espresso">{deliveryDays}d</span>
                            </div>
                            <p className="text-xs text-espresso/60 uppercase tracking-wide">Delivery</p>
                        </div>
                    </motion.div>

                    {/* Info Cards */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                    >
                        {/* Location Card */}
                        <div className="bg-white border border-maroon/10 rounded-xl p-4 hover:border-maroon/30 transition-colors">
                            <div className="flex items-start gap-3">
                                <MapPin size={20} className="text-maroon flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-espresso/60 font-semibold mb-1">
                                        Location
                                    </p>
                                    <p className="text-espresso font-medium">{location}</p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Card */}
                        <div className="bg-white border border-maroon/10 rounded-xl p-4 hover:border-maroon/30 transition-colors">
                            <div className="flex items-start gap-3">
                                <Truck size={20} className="text-maroon flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-espresso/60 font-semibold mb-1">
                                        Shipping
                                    </p>
                                    <p className="text-espresso font-medium">{shippingEstimate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Instagram Card */}
                        {instagram_handle && (
                            <a
                                href={`https://instagram.com/${instagram_handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white border border-maroon/10 rounded-xl p-4 hover:border-maroon/30 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <Instagram size={20} className="text-maroon flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-espresso/60 font-semibold mb-1">
                                            Follow
                                        </p>
                                        <p className="text-maroon font-medium hover:text-maroon/70">
                                            @{instagram_handle}
                                        </p>
                                    </div>
                                </div>
                            </a>
                        )}
                    </motion.div>

                    {/* Featured Products Section */}
                    {products.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <h2 className="text-2xl md:text-3xl font-serif text-espresso mb-6 flex items-center gap-2">
                                <span>Featured Products</span>
                                <span className="text-lg text-espresso/50">({products.length})</span>
                            </h2>

                            <ProductGrid
                                products={products}
                                loading={loading}
                                onProductClick={handleProductClick}
                                onAddToCart={handleAddToCart}
                                hasMore={false}
                            />

                            {/* View All Products Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/shops/${store.id}`)}
                                className="mt-8 w-full py-4 bg-gradient-to-r from-maroon to-maroon/80 text-ivory rounded-xl font-semibold hover:shadow-lg hover:shadow-maroon/30 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                View All Products from {name}
                                <span>→</span>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Spacing for sticky header on mobile */}
                    <div className="h-8" />
                </motion.div>
            </motion.div>
        </>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo
    return (
        prevProps.store?.id === nextProps.store?.id &&
        prevProps.products === nextProps.products &&
        prevProps.loading === nextProps.loading
    );
});

StoreDetailsPanel.displayName = "StoreDetailsPanel";

export default StoreDetailsPanel;
