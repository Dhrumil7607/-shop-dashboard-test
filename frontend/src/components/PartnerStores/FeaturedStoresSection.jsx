/**
 * Featured & Trending Stores Section Component
 * Displays featured and trending stores in separate carousels
 * Used at the top of Partner Stores page
 * Horizontal scroll with Framer Motion animations
 */

import { memo, useCallback, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import StoreCard from "./StoreCard";
import { StoreCardSkeleton } from "./SkeletonComponents";

const FeaturedStoresSection = memo(function FeaturedStoresSection({
    featuredStores = [],
    trendingStores = [],
    loading = false,
    onStoreSelect,
    onFavoriteToggle,
    favorites = [],
}) {
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const featuredScrollRef = useRef(null);
    const trendingScrollRef = useRef(null);

    const checkScroll = useCallback((scrollRef) => {
        if (!scrollRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            checkScroll(featuredScrollRef);
            checkScroll(trendingScrollRef);
        }, 100);

        return () => clearTimeout(timer);
    }, [featuredStores, trendingStores, checkScroll]);

    const scroll = (ref, direction) => {
        if (!ref.current) return;

        const scrollAmount = 400;
        const newScrollLeft =
            ref.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);

        ref.current.scrollTo({
            left: newScrollLeft,
            behavior: "smooth",
        });

        setTimeout(() => checkScroll(ref), 300);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    const handleStoreSelect = useCallback(
        (store) => {
            onStoreSelect?.(store);
        },
        [onStoreSelect]
    );

    const handleFavoriteToggle = useCallback(
        (storeId) => {
            onFavoriteToggle?.(storeId);
        },
        [onFavoriteToggle]
    );

    return (
        <div className="space-y-16 md:space-y-20">
            {/* Featured Stores Section */}
            {featuredStores.length > 0 && (
                <motion.section
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative"
                >
                    <div className="mb-8">
                        <motion.div variants={itemVariants}>
                            <h2 className="text-3xl md:text-4xl font-serif text-espresso mb-2">
                                ✨ Featured Stores
                            </h2>
                            <p className="text-lg text-espresso/60">
                                Handpicked collections from our premium partners
                            </p>
                        </motion.div>
                    </div>

                    {/* Carousel Container */}
                    <div className="relative">
                        <motion.div
                            ref={featuredScrollRef}
                            onScroll={() => checkScroll(featuredScrollRef)}
                            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth hide-scrollbar"
                            style={{
                                scrollBehavior: "smooth",
                                WebkitOverflowScrolling: "touch",
                            }}
                        >
                            {loading && featuredStores.length === 0
                                ? [...Array(4)].map((_, i) => (
                                    <div key={`skeleton-${i}`} className="flex-shrink-0 w-80">
                                        <StoreCardSkeleton />
                                    </div>
                                ))
                                : featuredStores.map((store, idx) => (
                                    <motion.div
                                        key={store.id}
                                        variants={itemVariants}
                                        className="flex-shrink-0 w-80 snap-center"
                                    >
                                        <StoreCard
                                            store={store}
                                            onClick={handleStoreSelect}
                                            onAddToFavorites={handleFavoriteToggle}
                                            isFavorite={favorites?.includes(store.id) || false}
                                            showDeliveryInfo={false}
                                        />
                                    </motion.div>
                                ))}
                        </motion.div>

                        {/* Left Scroll Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => scroll(featuredScrollRef, "left")}
                            disabled={!canScrollLeft}
                            className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-md border border-white/40 hover:border-white/60 disabled:opacity-50 transition-all shadow-lg"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={24} className="text-espresso" />
                        </motion.button>

                        {/* Right Scroll Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => scroll(featuredScrollRef, "right")}
                            disabled={!canScrollRight}
                            className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-md border border-white/40 hover:border-white/60 disabled:opacity-50 transition-all shadow-lg"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={24} className="text-espresso" />
                        </motion.button>
                    </div>
                </motion.section>
            )}

            {/* Trending Stores Section */}
            {trendingStores.length > 0 && (
                <motion.section
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative"
                >
                    <div className="mb-8">
                        <motion.div variants={itemVariants}>
                            <h2 className="text-3xl md:text-4xl font-serif text-espresso mb-2 flex items-center gap-3">
                                <TrendingUp size={32} className="text-maroon" />
                                Trending Now
                            </h2>
                            <p className="text-lg text-espresso/60">
                                Stores gaining attention this week
                            </p>
                        </motion.div>
                    </div>

                    {/* Carousel Container */}
                    <div className="relative">
                        <motion.div
                            ref={trendingScrollRef}
                            onScroll={() => checkScroll(trendingScrollRef)}
                            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth hide-scrollbar"
                            style={{
                                scrollBehavior: "smooth",
                                WebkitOverflowScrolling: "touch",
                            }}
                        >
                            {loading && trendingStores.length === 0
                                ? [...Array(4)].map((_, i) => (
                                    <div key={`skeleton-${i}`} className="flex-shrink-0 w-80">
                                        <StoreCardSkeleton />
                                    </div>
                                ))
                                : trendingStores.map((store, idx) => (
                                    <motion.div
                                        key={store.id}
                                        variants={itemVariants}
                                        className="flex-shrink-0 w-80 snap-center"
                                    >
                                        <StoreCard
                                            store={store}
                                            onClick={handleStoreSelect}
                                            onAddToFavorites={handleFavoriteToggle}
                                            isFavorite={favorites?.includes(store.id) || false}
                                            showDeliveryInfo={false}
                                        />
                                    </motion.div>
                                ))}
                        </motion.div>

                        {/* Left Scroll Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => scroll(trendingScrollRef, "left")}
                            disabled={!canScrollLeft}
                            className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-md border border-white/40 hover:border-white/60 disabled:opacity-50 transition-all shadow-lg"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={24} className="text-espresso" />
                        </motion.button>

                        {/* Right Scroll Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => scroll(trendingScrollRef, "right")}
                            disabled={!canScrollRight}
                            className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 backdrop-blur-md border border-white/40 hover:border-white/60 disabled:opacity-50 transition-all shadow-lg"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={24} className="text-espresso" />
                        </motion.button>
                    </div>
                </motion.section>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.featuredStores === nextProps.featuredStores &&
        prevProps.trendingStores === nextProps.trendingStores &&
        prevProps.loading === nextProps.loading &&
        JSON.stringify(prevProps.favorites) === JSON.stringify(nextProps.favorites)
    );
});

FeaturedStoresSection.displayName = "FeaturedStoresSection";

export default FeaturedStoresSection;
