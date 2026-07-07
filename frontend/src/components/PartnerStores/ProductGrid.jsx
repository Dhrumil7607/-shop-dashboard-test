/**
 * Product Grid Component
 * Responsive grid layout for products with Framer Motion stagger animations
 * Handles loading states, empty states, and pagination
 * Mobile-first: 2 col mobile, 3 col tablet, 4 col desktop
 */

import { memo, useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { StoreCardSkeleton } from "./SkeletonComponents";
import EmptyState from "./EmptyState";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.22, 0.61, 0.36, 1],
        },
    },
};

const ProductGrid = memo(function ProductGrid({
    products = [],
    loading = false,
    error = null,
    onProductClick,
    onAddToCart,
    onRetry,
    hasMore = false,
    onLoadMore,
    skeletonCount = 8,
}) {
    const [visibleProducts, setVisibleProducts] = useState(products);
    const observerRef = useRef(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    // Update visible products when products prop changes
    useEffect(() => {
        setVisibleProducts(products);
    }, [products]);

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

    // Loading State
    if (loading && products.length === 0) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(skeletonCount)].map((_, i) => (
                    <div key={`skeleton-${i}`}>
                        <StoreCardSkeleton />
                    </div>
                ))}
            </div>
        );
    }

    // Error State
    if (error && products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12"
            >
                <EmptyState
                    title="Unable to Load Products"
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
    if (!loading && products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12"
            >
                <EmptyState
                    title="No Products Available"
                    description="This store doesn't have any products yet. Check back soon for new items!"
                    icon="📦"
                    action={
                        onRetry
                            ? {
                                label: "Browse Other Stores",
                                onClick: onRetry,
                            }
                            : null
                    }
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
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
                {visibleProducts.map((product) => (
                    <motion.div
                        key={product.id}
                        variants={itemVariants}
                        layout
                    >
                        <ProductCard
                            product={product}
                            onClick={handleProductClick}
                            onAddToCart={handleAddToCart}
                            showStockStatus={true}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Loading More Indicator */}
            {loading && products.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                >
                    {[...Array(4)].map((_, i) => (
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
                    className="mt-8 h-4 flex items-center justify-center"
                    aria-label="Loading more products..."
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-maroon/20 border-t-maroon rounded-full"
                    />
                </div>
            )}

            {/* Results Summary */}
            {!loading && products.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 text-center text-espresso/60 text-sm"
                >
                    Showing {visibleProducts.length} products
                    {hasMore && " • Scroll to load more"}
                </motion.div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo
    return (
        prevProps.products === nextProps.products &&
        prevProps.loading === nextProps.loading &&
        prevProps.error === nextProps.error &&
        prevProps.hasMore === nextProps.hasMore
    );
});

ProductGrid.displayName = "ProductGrid";

export default ProductGrid;
