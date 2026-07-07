import { motion } from "framer-motion";
import { useState } from "react";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import {
    productCardHover,
    secondaryImageFadeIn,
    buttonGroupFadeIn,
} from "@/utils/microAnimations";

/**
 * Product Card with hover animations
 */
export function ProductCard({ product, onViewDetails, onAddCart, onWishlist }) {
    const [isHovered, setIsHovered] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const images = product.images || [product.image];
    const secondaryImage = images[1] || images[0];

    return (
        <motion.div
            variants={productCardHover}
            initial="rest"
            whileHover="hover"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="group relative bg-white rounded-2xl overflow-hidden border border-stone/10 cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative w-full aspect-square overflow-hidden bg-stone/5">
                {/* Primary Image */}
                <motion.img
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />

                {/* Secondary Image (on hover) */}
                {secondaryImage && (
                    <motion.img
                        src={secondaryImage}
                        alt={`${product.name} view 2`}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial="hidden"
                        animate={isHovered ? "hover" : "hidden"}
                        variants={secondaryImageFadeIn}
                    />
                )}

                {/* Wishlist Button */}
                <motion.button
                    onClick={(e) => {
                        e.preventDefault();
                        setIsWishlisted(!isWishlisted);
                        onWishlist?.();
                    }}
                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full hover:bg-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Heart
                        size={20}
                        className={`${
                            isWishlisted
                                ? "fill-maroon text-maroon"
                                : "text-maroon/40 group-hover:text-maroon"
                        } transition`}
                    />
                </motion.button>

                {/* Badge */}
                {product.badge && (
                    <motion.div
                        className="absolute top-4 left-4 bg-maroon text-white px-3 py-1 rounded-full text-xs font-semibold"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {product.badge}
                    </motion.div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Product Name */}
                <motion.h3
                    className="font-serif text-sm md:text-base text-espresso line-clamp-2 mb-2"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                >
                    {product.name}
                </motion.h3>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                    <motion.span className="text-lg font-bold text-maroon">
                        ${product.price}
                    </motion.span>
                    {product.originalPrice && (
                        <motion.span className="text-xs text-stone line-through opacity-50">
                            ${product.originalPrice}
                        </motion.span>
                    )}
                </div>

                {/* Rating */}
                {product.rating && (
                    <div className="flex items-center gap-1 mb-4 text-xs text-stone">
                        <span className="text-gold">★</span>
                        <span>{product.rating}</span>
                        <span className="text-stone/50">({product.reviews} reviews)</span>
                    </div>
                )}

                {/* Button Group (fade in on hover) */}
                <motion.div
                    className="flex gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    style={{ pointerEvents: isHovered ? "auto" : "none" }}
                >
                    <motion.button
                        onClick={onViewDetails}
                        className="flex-1 px-3 py-2 bg-maroon/10 text-maroon rounded-lg font-medium text-xs hover:bg-maroon/20 transition flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Eye size={16} />
                        View
                    </motion.button>
                    <motion.button
                        onClick={onAddCart}
                        className="flex-1 px-3 py-2 bg-maroon text-white rounded-lg font-medium text-xs hover:bg-maroon/90 transition flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ShoppingBag size={16} />
                        Add
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
}

/**
 * Product Grid with staggered animations
 */
export function ProductGridAnimated({ products, onViewDetails, onAddCart, onWishlist }) {
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                    },
                },
            }}
        >
            {products.map((product, index) => (
                <motion.div
                    key={product.id}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.4 }}
                >
                    <ProductCard
                        product={product}
                        onViewDetails={() => onViewDetails(product.id)}
                        onAddCart={() => onAddCart(product)}
                        onWishlist={() => onWishlist(product.id)}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}

export default ProductCard;
