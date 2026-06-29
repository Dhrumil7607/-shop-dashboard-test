/**
 * Store Card Component - Individual store display card
 * Features verified badges, ratings, followers, product count, and hover interactions
 * Memoized for performance with React.memo
 * Follows 8-point grid system and Shopify/Airbnb card hierarchy
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, CheckCircle, Users, ShoppingBag, Truck, TrendingUp } from "lucide-react";

const StoreCard = memo(function StoreCard({
    store,
    onClick,
    onAddToFavorites,
    isFavorite = false,
    showDeliveryInfo = true,
}) {
    const {
        id,
        name,
        image_url,
        verified = false,
        rating = 0,
        followers = 0,
        productCount = 0,
        trending = false,
        featured = false,
        deliveryDays = 2,
        shippingEstimate = "2-5 days",
        owner_name,
        specialty,
    } = store;

    // Humanize follower count (e.g., 1500 -> 1.5K)
    const humanizedFollowers = useMemo(() => {
        if (followers >= 1000000) {
            return `${(followers / 1000000).toFixed(1)}M`;
        }
        if (followers >= 1000) {
            return `${(followers / 1000).toFixed(1)}K`;
        }
        return followers.toString();
    }, [followers]);

    // Memoize badge display logic
    const badges = useMemo(() => {
        const badgeList = [];
        if (featured) badgeList.push({ label: "Featured", color: "bg-amber-500/90 text-white" });
        if (trending) badgeList.push({ label: "Trending", color: "bg-rose-500/90 text-white" });
        if (verified) badgeList.push({ label: "Verified", color: "bg-green-600/90 text-white" });
        return badgeList;
    }, [featured, trending, verified]);

    const handleCardClick = () => {
        onClick?.(store);
    };

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        onAddToFavorites?.(id);
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={handleCardClick}
            className="group cursor-pointer h-full"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    handleCardClick();
                }
            }}
            aria-label={`${name} store by ${owner_name}`}
        >
            <div className="relative h-full rounded-2xl overflow-hidden bg-white/50 backdrop-blur-md border border-white/40 hover:border-white/60 transition-all duration-500 hover:shadow-2xl hover:shadow-maroon/15 flex flex-col">
                {/* Image Container */}
                <div className="relative overflow-hidden h-48 md:h-56 bg-gradient-to-br from-maroon/5 to-maroon/10 flex-shrink-0">
                    {image_url ? (
                        <motion.img
                            src={image_url}
                            alt={name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f5f5f5' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23ccc'%3EStore Image%3C/text%3E%3C/svg%3E";
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-espresso/20">
                            <ShoppingBag size={48} />
                        </div>
                    )}

                    {/* Overlay Gradient on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex flex-wrap gap-2 justify-end">
                        {badges.map((badge, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color} backdrop-blur-md border border-white/30 shadow-lg`}
                            >
                                {badge.label}
                            </motion.div>
                        ))}
                    </div>

                    {/* Favorite Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleFavoriteClick}
                        className="absolute top-4 left-4 p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-white transition-colors"
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <svg
                            className={`w-6 h-6 ${isFavorite ? "fill-maroon text-maroon" : "text-espresso/40"}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </motion.button>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-grow p-5 md:p-6">
                    {/* Specialty/Category */}
                    {specialty && (
                        <p className="text-xs uppercase tracking-wider text-maroon/70 font-semibold mb-2 line-clamp-1">
                            {specialty}
                        </p>
                    )}

                    {/* Store Name */}
                    <h3 className="font-serif text-lg md:text-xl text-espresso mb-1 line-clamp-2 leading-tight">
                        {name}
                    </h3>

                    {/* Owner Name */}
                    {owner_name && (
                        <p className="text-sm text-espresso/60 mb-4 line-clamp-1">
                            by {owner_name}
                        </p>
                    )}

                    {/* Stats Grid - Rating, Followers, Products */}
                    <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-t border-b border-maroon/10">
                        {/* Rating */}
                        <div className="flex items-center gap-1.5">
                            <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-bold text-espresso text-sm">{rating}</span>
                                <span className="text-xs text-espresso/50">Rating</span>
                            </div>
                        </div>

                        {/* Followers */}
                        <div className="flex items-center gap-1.5">
                            <Users size={16} className="text-blue-500 flex-shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-bold text-espresso text-sm">{humanizedFollowers}</span>
                                <span className="text-xs text-espresso/50">Follow</span>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="flex items-center gap-1.5">
                            <ShoppingBag size={16} className="text-purple-500 flex-shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-bold text-espresso text-sm">{productCount}</span>
                                <span className="text-xs text-espresso/50">Items</span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Information */}
                    {showDeliveryInfo && (
                        <div className="space-y-2 mb-4 py-3 bg-maroon/5 rounded-lg px-3 border border-maroon/10">
                            <div className="flex items-center gap-2 text-sm">
                                <Truck size={14} className="text-maroon flex-shrink-0" />
                                <span className="text-espresso/80 font-medium">
                                    Delivers in {deliveryDays} day{deliveryDays !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="text-xs text-espresso/60 pl-6">
                                Est. {shippingEstimate}
                            </div>
                        </div>
                    )}

                    {/* Verified Badge with Checkmark */}
                    {verified && (
                        <div className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                            <CheckCircle size={16} className="flex-shrink-0" />
                            <span className="text-xs font-semibold">Verified Seller</span>
                        </div>
                    )}

                    {/* View Button - Spacer for flex-grow */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCardClick}
                        className="mt-auto w-full py-3 bg-gradient-to-r from-maroon to-maroon/80 text-ivory rounded-lg font-semibold hover:shadow-lg hover:shadow-maroon/30 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                        aria-label={`View ${name} store`}
                    >
                        <span>View Store</span>
                        <motion.span
                            className="group-hover/btn:translate-x-1 transition-transform"
                            animate={{ x: 0 }}
                        >
                            →
                        </motion.span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo
    // Only re-render if these specific props change
    return (
        prevProps.store.id === nextProps.store.id &&
        prevProps.isFavorite === nextProps.isFavorite &&
        prevProps.store.verified === nextProps.store.verified &&
        prevProps.store.trending === nextProps.store.trending &&
        prevProps.store.featured === nextProps.store.featured
    );
});

StoreCard.displayName = "StoreCard";

export default StoreCard;
