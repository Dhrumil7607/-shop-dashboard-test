/**
 * Product Card Component - Individual product display card
 * Features lazy image loading with intersection observer
 * Shows price, discount badge, stock status, and hover interactions
 * Memoized with React.memo for performance
 * Follows Shopify product card design patterns
 */

import { memo, useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, BadgeCheck } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

const ProductCard = memo(function ProductCard({
    product,
    onClick,
    onAddToCart,
    showStockStatus = true,
}) {
    const {
        id,
        name,
        image_url,
        hover_image_url,
        price,
        compare_at_price,
        currency = "INR",
        stock,
        category,
        badge,
        is_featured,
        shop_name,
    } = product;

    const [imageSrc, setImageSrc] = useState(image_url);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isImageVisible, setIsImageVisible] = useState(false);
    const imageRef = useRef(null);
    const { formatPrice } = useCurrency();

    // Lazy load image using Intersection Observer
    useEffect(() => {
        if (!imageRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsImageVisible(true);
                    observer.unobserve(imageRef.current);
                }
            },
            {
                rootMargin: "50px",
            }
        );

        observer.observe(imageRef.current);
        return () => observer.disconnect();
    }, []);

    // Calculate discount percentage
    const discountPercent = useMemo(() => {
        if (!compare_at_price || !price) return null;
        const discount = ((compare_at_price - price) / compare_at_price) * 100;
        return Math.round(discount);
    }, [price, compare_at_price]);

    // Determine stock status styling
    const stockStatus = useMemo(() => {
        if (stock <= 0) {
            return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
        }
        if (stock <= 3) {
            return { label: `Only ${stock} left`, color: "bg-orange-100 text-orange-700" };
        }
        return { label: "In Stock", color: "bg-green-100 text-green-700" };
    }, [stock]);

    const handleCardClick = () => {
        onClick?.(product);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        onAddToCart?.(product);
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
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
            aria-label={`${name} from ${shop_name}`}
        >
            <div className="relative h-full rounded-2xl overflow-hidden bg-white/50 backdrop-blur-md border border-white/40 hover:border-white/60 transition-all duration-500 hover:shadow-xl hover:shadow-maroon/10 flex flex-col">
                {/* Image Container with Lazy Loading */}
                <div
                    ref={imageRef}
                    className="relative overflow-hidden h-56 md:h-64 bg-gradient-to-br from-maroon/5 to-maroon/10 flex-shrink-0"
                >
                    {isImageVisible && imageSrc ? (
                        <>
                            <motion.div
                                key={imageSrc}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isImageLoaded ? 1 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0"
                            >
                                <img
                                    src={imageSrc}
                                    alt={name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    onLoad={() => setIsImageLoaded(true)}
                                    onError={() => {
                                        setImageSrc(
                                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f5f5f5' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%23ccc'%3EProduct Image%3C/text%3E%3C/svg%3E"
                                        );
                                    }}
                                />
                            </motion.div>

                            {/* Hover Image On Hover */}
                            {hover_image_url && (
                                <motion.img
                                    src={hover_image_url}
                                    alt={`${name} hover`}
                                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    loading="lazy"
                                />
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-espresso/10">
                            <ShoppingBag size={40} />
                        </div>
                    )}

                    {/* Overlay Gradient on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Discount Badge */}
                    {discountPercent && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-4 right-4 px-3 py-1 bg-rose-500/90 text-white text-xs font-bold rounded-full backdrop-blur-md border border-white/30 shadow-lg"
                        >
                            -{discountPercent}%
                        </motion.div>
                    )}

                    {/* Featured Badge */}
                    {is_featured && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="absolute top-4 left-4 px-3 py-1 bg-amber-500/90 text-white text-xs font-bold rounded-full backdrop-blur-md border border-white/30 shadow-lg flex items-center gap-1"
                        >
                            <BadgeCheck size={12} />
                            Featured
                        </motion.div>
                    )}

                    {/* Hover Action Buttons */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCardClick}
                                className="p-3 rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-lg transition-all"
                                aria-label="View product details"
                            >
                                <Eye size={20} className="text-maroon" />
                            </motion.button>

                            {stock > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAddToCart}
                                    className="p-3 rounded-full bg-maroon hover:bg-maroon/90 shadow-lg transition-all"
                                    aria-label="Add to cart"
                                >
                                    <ShoppingBag size={20} className="text-white" />
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-grow p-4 md:p-5">
                    {/* Category */}
                    {category && (
                        <p className="text-xs uppercase tracking-wider text-maroon/70 font-semibold mb-2">
                            {category}
                        </p>
                    )}

                    {/* Product Name */}
                    <h4 className="font-semibold text-espresso text-sm md:text-base mb-3 line-clamp-2 leading-snug">
                        {name}
                    </h4>

                    {/* Stock Status */}
                    {showStockStatus && (
                        <div
                            className={`text-xs font-semibold px-2 py-1 rounded mb-3 text-center ${stockStatus.color}`}
                        >
                            {stockStatus.label}
                        </div>
                    )}

                    {/* Price Section - Spacer for flex-grow */}
                    <div className="mt-auto flex items-baseline gap-2">
                        <span className="text-lg md:text-xl font-bold text-espresso">
                            {formatPrice(price)}
                        </span>
                        {compare_at_price && (
                            <span className="text-sm text-espresso/40 line-through">
                                {formatPrice(compare_at_price)}
                            </span>
                        )}
                    </div>

                    {/* Badge */}
                    {badge && (
                        <div className="mt-3 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded text-center font-medium">
                            {badge}
                        </div>
                    )}

                    {/* Add to Cart Button - Always visible on mobile */}
                    {stock > 0 && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddToCart}
                            className="mt-4 w-full py-2 bg-maroon/10 text-maroon rounded-lg font-semibold hover:bg-maroon/20 transition-all duration-300 hidden md:block"
                        >
                            Quick Add
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo
    return (
        prevProps.product.id === nextProps.product.id &&
        prevProps.product.price === nextProps.product.price &&
        prevProps.product.stock === nextProps.product.stock
    );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
