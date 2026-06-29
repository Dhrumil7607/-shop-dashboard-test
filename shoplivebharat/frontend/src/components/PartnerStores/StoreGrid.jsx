/**
 * Store Grid Component
 * Responsive grid layout with Framer Motion stagger animations
 * Handles loading states, empty states, and pagination
 * Mobile-first responsive design: 1 col mobile, 2 col tablet, 3 col desktop
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import StoreCard from "./StoreCard";
import { StoreCardSkeleton } from "./SkeletonComponents";
import EmptyState from "./EmptyState";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.22, 0.61, 0.36, 1],
        },
    },
};

const StoreGrid = memo(function StoreGrid({
    stores = [],
    loading = false,
    error = null,
    onStoreSelect,
    onRetry,
    hasMore = false,
    onLoadMore,
    skeletonCount = 6,
    favorites = [],
    onFavoriteToggle,
    showDeliveryInfo = true,
}) {
    const [visibleStores, setVisibleStores] = useState(stores);
    const observerRef = useRef(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    // Update visible stores when stores prop changes
    useEffect(() => {
        setVisibleStores(stores);
    }, [stores]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (!hasMore || loading || !observerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isIntersecting) {
                    setIsIntersecting(true);
                    onLoadMore?.();
                    setIsIntersecting(false);
                }
            },
            {
                rootMargin: "100px",
            }
        );

        observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading, onLoadMore, isIntersecting]);

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

    // Loading State - Show Skeletons
    if (loading && stores.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[...Array(skeletonCount)].map((_, i) => (
                    <div key={`skeleton-${i}`}>
                        <StoreCardSkeleton />
                    </div>
                ))}
            </div>
        );
    }

    // Error State
    if (error && stores.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12"
            >
                <EmptyState
                    title="Unable to Load Stores"
                    description={error}
                    icon="⚠️"
                    action={{
                        label: "Try Again",
                        onClick: onRetry,
                    }}
                />
            </motion.div>
        );
    }

    // Empty State
    if (!loading && stores.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12"
            >
                <EmptyState
                    title="No Stores Found"
                    description="Try adjusting your filters or search terms to find what you're looking for."
                    icon="🔍"
                    action={{
                        label: "Clear Filters",
                        onClick: onRetry,
                    }}
                />
            </motion.div>
        );
    }

    return (
        <div className="w-full">
            {/* Main Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
                {visibleStores.map((store) => (
                    <motion.div
                        key={store.id}
                        variants={itemVariants}
                        layout
                    >
                        <StoreCard
                            store={store}
                            onClick={handleStoreSelect}
                            onAddToFavorites={handleFavoriteToggle}
                            isFavorite={favorites?.includes(store.id) || false}
                            showDeliveryInfo={showDeliveryInfo}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Loading More Indicator */}
            {loading && stores.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                >
                    {[...Array(3)].map((_, i) => (
                        <div key={`loading-${i}`}>
                            <StoreCardSkeleton />
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Infinite Scroll Observer Target */}
            {hasMore && (
                <div
                    ref={observerRef}
                    className="mt-12 h-4 flex items-center justify-center"
                    aria-label="Loading more stores..."
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-maroon/20 border-t-maroon rounded-full"
                    />
                </div>
            )}

            {/* Results Summary */}
            {!loading && stores.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center text-espresso/60 text-sm"
                >
                    Showing {visibleStores.length} stores
                    {hasMore && " • Load more to see additional stores"}
                </motion.div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo optimization
    return (
        prevProps.stores === nextProps.stores &&
        prevProps.loading === nextProps.loading &&
        prevProps.error === nextProps.error &&
        prevProps.hasMore === nextProps.hasMore &&
        JSON.stringify(prevProps.favorites) === JSON.stringify(nextProps.favorites)
    );
});

StoreGrid.displayName = "StoreGrid";

export default StoreGrid;
