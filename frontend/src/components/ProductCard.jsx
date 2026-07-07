import { memo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, Star, Truck, RotateCcw, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useWishlist } from "@/contexts/WishlistContext";

const COLOR_MAP = {
    "Ivory":"#FAF8F5","Gold":"#D4AF37","Maroon":"#8B3A3A","Crimson":"#DC143C",
    "Navy":"#1B2A6B","Rani Pink":"#E8417A","Pastel Pink":"#FFB7C5",
    "Cream":"#F5F0E8","Yellow":"#FFD700","Green":"#2D6A4F","White":"#FFF","Black":"#000","Pink":"#E8417A",
};

const ProductCard = memo(function ProductCard({ product, index = 0, darkBg = false }) {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();
    const { isWishlisted, toggleWishlist } = useWishlist();
    const fav = isWishlisted(product.id);
    const [imgError, setImgError] = useState(false);
    const [hovering, setHovering] = useState(false);

    const discount = product.compare_at_price
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    const storeName = (product.badge || product.shop_name || "")
        .replace(/^READY TO SHIP[·•\-\s]+/i, "").trim();

    // Source label: "Exclusive by ShopLiveBharat" or "Partnered Store"
    const isExclusive = product.source === "exclusive" || product.shop_id === "shop-shoplivebharat";
    const sourceLabel = isExclusive ? "Exclusive by ShopLiveBharat" : null;

    // ── Trust / conversion signals ──
    const rating = product.rating ?? product.shop_rating ?? 4.8;
    const isReadyToShip = product.ready_to_ship || (product.badge || "").toLowerCase().includes("ready");
    const shippingEstimate = product.shipping_estimate || (isReadyToShip ? "Ships in 24-48 hrs" : "Ships in 5-8 days");
    // Out of stock if explicitly flagged by seller status OR stock <= 0
    const isOutOfStock = product.status === "out_of_stock" || (typeof product.stock === "number" && product.stock <= 0);
    const inStock = !isOutOfStock;
    const lowStock = inStock && typeof product.stock === "number" && product.stock > 0 && product.stock <= 3;

    const handleClick  = useCallback(() => navigate(`/product/${product.id}`), [navigate, product.id]);
    const handleCart   = useCallback((e) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        addToCart(product);
    }, [addToCart, product, isOutOfStock]);
    const handleFav    = (e) => { e.stopPropagation(); toggleWishlist(product); };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.05, 0.35) }}
            onClick={handleClick}
            onHoverStart={() => setHovering(true)}
            onHoverEnd={() => setHovering(false)}
            role="article"
            aria-label={product.name}
            className="group cursor-pointer flex flex-col"
            style={{ willChange: "transform" }}
        >
            {/* ── IMAGE ── */}
            <motion.div
                animate={hovering
                    ? { y: -5, boxShadow: "0 16px 40px rgba(44,36,27,0.13)" }
                    : { y: 0,  boxShadow: "0 2px 8px rgba(44,36,27,0.06)" }
                }
                transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
                className="relative overflow-hidden rounded-xl mb-3"
                style={{ aspectRatio: "3/4", backgroundColor: "#F0EBE3" }}
            >
                <motion.img
                    src={imgError ? "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=400&q=60" : product.image_url}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    animate={hovering ? { scale: 1.07 } : { scale: 1 }}
                    transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
                    className="w-full h-full object-cover"
                    style={{ willChange: "transform" }}
                    onError={() => setImgError(true)}
                />

                {/* Soft scrim on hover */}
                <motion.div
                    animate={{ opacity: hovering ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(26,10,10,0.15) 0%, transparent 60%)" }}
                />

                {/* Discount badge */}
                {discount > 0 && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20, delay: index * 0.05 }}
                        className="absolute top-2.5 left-2.5 text-white text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: "#1a1a1a" }}
                    >
                        {discount}% OFF
                    </motion.span>
                )}

                {/* Permanent wishlist heart — always visible, top-right */}
                <motion.button
                    onClick={handleFav}
                    whileTap={{ scale: 0.85 }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md z-10 transition-colors"
                    style={{
                        backgroundColor: fav ? "rgba(220,20,60,0.92)" : "rgba(255,255,255,0.88)",
                        backdropFilter: "blur(4px)",
                    }}
                    aria-label={fav ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                    aria-pressed={fav}
                >
                    <Heart
                        size={14}
                        className={fav ? "fill-white text-white" : "text-gray-500"}
                    />
                </motion.button>

                {/* Ready to ship */}
                {isReadyToShip && !isOutOfStock && (
                    <span
                        className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide"
                        style={{ backgroundColor: "#2D7A3A" }}
                    >
                        <Check size={9} strokeWidth={3} /> Ready to Ship
                    </span>
                )}

                {/* Out of stock overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ backgroundColor: "rgba(250,249,246,0.55)" }}>
                        <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md"
                            style={{ backgroundColor: "#1a1a1a", color: "white" }}>
                            Out of Stock
                        </span>
                    </div>
                )}

                {/* Hover action row — always visible on touch devices */}
                <AnimatePresence>
                    {hovering && (
                        <motion.div
                            key="actions"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.18 }}
                            className="absolute bottom-2.5 left-2.5 right-2.5 hidden md:flex items-center justify-between"
                        >
                            <motion.button
                                onClick={handleCart}
                                disabled={!inStock}
                                whileTap={{ scale: 0.93 }}
                                className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-30"
                                aria-label={`Add ${product.name} to cart`}
                            >
                                <ShoppingCart size={13} style={{ color: "#1a1a1a" }} />
                            </motion.button>
                            <motion.button
                                onClick={handleFav}
                                whileTap={{ scale: 0.9 }}
                                className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                                aria-label={fav ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                            >
                                <Heart size={13} className={fav ? "fill-red-500 text-red-500" : "text-gray-400"} />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile always-visible action buttons */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex md:hidden items-center justify-between">
                    <motion.button
                        onClick={handleCart}
                        disabled={!inStock}
                        whileTap={{ scale: 0.93 }}
                        className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-30"
                        aria-label={`Add ${product.name} to cart`}
                    >
                        <ShoppingCart size={15} style={{ color: "#1a1a1a" }} />
                    </motion.button>
                    <motion.button
                        onClick={handleFav}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
                        aria-label={fav ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                    >
                        <Heart size={15} className={fav ? "fill-red-500 text-red-500" : "text-gray-400"} />
                    </motion.button>
                </div>
            </motion.div>

            {/* ── INFO ── */}
            <div className="flex flex-col gap-1 flex-1 px-0.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {sourceLabel && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ backgroundColor: "rgba(201,168,76,0.15)", color: "#9B7520" }}>
                                ✦ Exclusive
                            </span>
                        )}
                        {!sourceLabel && storeName && (
                            <span className="text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ backgroundColor: "rgba(162,70,107,0.1)", color: "#A2466B" }}>
                                Partnered
                            </span>
                        )}
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] truncate"
                            style={{ color: "#C9A84C" }}>
                            {storeName}
                        </p>
                    </div>
                    {/* Store rating */}
                    <span className="inline-flex items-center gap-0.5 flex-shrink-0"
                        aria-label={`Rated ${rating} out of 5`}>
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-semibold"
                            style={{ color: darkBg ? "rgba(255,255,255,0.8)" : "#6B5E52" }}>
                            {Number(rating).toFixed(1)}
                        </span>
                    </span>
                </div>

                <motion.h3
                    animate={{ opacity: hovering ? 0.65 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm leading-snug line-clamp-2"
                    style={{ color: darkBg ? "#ffffff" : "#1a1a1a", fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
                >
                    {product.name}
                </motion.h3>

                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-semibold" style={{ color: darkBg ? "#ffffff" : "#1a1a1a" }}>{formatPrice(product.price)}</span>
                    {product.compare_at_price && (
                        <span className="text-xs line-through" style={{ color: darkBg ? "rgba(255,255,255,0.55)" : "#9B8B7A" }}>{formatPrice(product.compare_at_price)}</span>
                    )}
                </div>

                {/* ── Trust signals row ── */}
                <div className="flex flex-col gap-0.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px]"
                        style={{ color: darkBg ? "rgba(255,255,255,0.7)" : "#6B5E52" }}>
                        <Truck size={11} style={{ color: "#2D7A3A" }} />
                        {shippingEstimate} · Worldwide
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px]"
                        style={{ color: darkBg ? "rgba(255,255,255,0.7)" : "#6B5E52" }}>
                        <RotateCcw size={11} style={{ color: "#C9A84C" }} />
                        7-day easy returns
                    </span>
                    {lowStock && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#C0392B" }}>
                            Only {product.stock} left
                        </span>
                    )}
                    {!inStock && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#9B8B7A" }}>
                            Out of stock
                        </span>
                    )}
                </div>

                {product.color && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {product.color.split(",").map(c => c.trim()).filter(Boolean).map(c => (
                            <span key={c} title={c}
                                className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0 inline-block"
                                style={{ backgroundColor: COLOR_MAP[c] || "#ccc",
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)" }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

ProductCard.displayName = "ProductCard";
export default ProductCard;
