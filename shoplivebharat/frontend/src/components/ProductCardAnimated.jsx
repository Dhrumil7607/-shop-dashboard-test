import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { showAddToCartToast, showWishlistToast, productCardVariants, transitionPresets } from "@/utils/microAnimations";

export default function ProductCardAnimated({ product, onAddToCart }) {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    const handleAddToCart = () => {
        setAddedToCart(true);
        onAddToCart?.(product);
        showAddToCartToast();

        // Reset button state after 1 second
        setTimeout(() => setAddedToCart(false), 1000);
    };

    const handleWishlist = () => {
        setIsWishlisted(!isWishlisted);
        showWishlistToast(!isWishlisted);
    };

    return (
        <motion.div
            className="relative rounded-xl overflow-hidden bg-white border border-stone/10"
            variants={productCardVariants.card}
            initial="initial"
            whileHover="hover"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative h-64 md:h-80 bg-stone/5 overflow-hidden group">
                {/* Primary Image */}
                <motion.img
                    src={product.images?.[0] || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    transition={transitionPresets.standard}
                    whileHover={{ scale: 1.08 }}
                />

                {/* Secondary Image on Hover */}
                <AnimatePresence>
                    {isHovered && product.images?.[1] && (
                        <motion.img
                            key="secondary"
                            src={product.images[1]}
                            alt={`${product.name} alternate`}
                            className="absolute inset-0 w-full h-full object-cover"
                            variants={productCardVariants.secondImage}
                            initial="initial"
                            animate="visible"
                            exit={{ opacity: 0, scale: 0.95 }}
                        />
                    )}
                </AnimatePresence>

                {/* Wishlist Button */}
                <motion.button
                    onClick={handleWishlist}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={transitionPresets.quick}
                >
                    <motion.div
                        animate={isWishlisted ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <Heart
                            size={18}
                            className={isWishlisted ? "fill-maroon text-maroon" : "text-stone"}
                        />
                    </motion.div>
                </motion.button>

                {/* Sale Badge */}
                {product.discount && (
                    <motion.div
                        className="absolute top-3 left-3 bg-maroon text-white px-2 py-1 rounded-md text-xs font-semibold"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={transitionPresets.quick}
                    >
                        -{product.discount}%
                    </motion.div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Category */}
                <motion.p
                    className="text-xs text-gold font-medium uppercase tracking-wider mb-1"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                >
                    {product.category}
                </motion.p>

                {/* Name */}
                <motion.h3
                    className="text-sm font-semibold text-espresso mb-2 line-clamp-2 hover:text-maroon transition"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                </motion.h3>

                {/* Rating */}
                {product.rating && (
                    <motion.div
                        className="flex items-center gap-1 mb-3"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                    >
                        <span className="text-xs text-gold">★★★★★</span>
                        <span className="text-xs text-stone">({product.reviews || 0})</span>
                    </motion.div>
                )}

                {/* Price */}
                <motion.div
                    className="flex items-baseline gap-2 mb-4"
                    variants={productCardVariants.price}
                    initial="initial"
                    animate="visible"
                >
                    <span className="text-lg font-bold text-espresso">
                        ${product.price}
                    </span>
                    {product.originalPrice && (
                        <span className="text-sm text-stone line-through">
                            ${product.originalPrice}
                        </span>
                    )}
                </motion.div>

                {/* Buttons */}
                <AnimatePresence mode="popLayout">
                    <motion.div
                        className="flex gap-2"
                        variants={productCardVariants.buttons}
                        initial="initial"
                        animate={isHovered ? "visible" : "initial"}
                        exit="initial"
                        transition={transitionPresets.quick}
                    >
                        <motion.button
                            onClick={handleAddToCart}
                            disabled={addedToCart}
                            className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${
                                addedToCart
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gold/10 text-gold hover:bg-gold/20"
                            }`}
                            whileHover={!addedToCart ? { scale: 1.05 } : {}}
                            whileTap={!addedToCart ? { scale: 0.95 } : {}}
                            transition={transitionPresets.quick}
                        >
                            {addedToCart ? "Added ✓" : "Add to Cart"}
                        </motion.button>

                        <motion.button
                            className="flex-1 py-2 rounded-lg font-medium text-sm bg-espresso/10 text-espresso hover:bg-espresso/20 transition"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={transitionPresets.quick}
                        >
                            <Link to={`/product/${product.id}`}>View</Link>
                        </motion.button>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
