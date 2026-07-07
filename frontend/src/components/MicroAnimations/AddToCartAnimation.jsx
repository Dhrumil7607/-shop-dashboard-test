import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
    addToCartProductLift,
    productThumbnailFly,
    cartIconBounce,
    sparkleParticle,
    createSparkles,
    getCartIconPosition,
} from "@/utils/microAnimations";
import { Sonner, toast } from "sonner";

/**
 * Add to Cart Toast with buttons and animation
 */
export function AddToCartToast({ productName, productImage, onViewCart, onContinueShopping }) {
    const [isAdded, setIsAdded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg p-4 md:p-5 backdrop-blur-md border border-maroon/10 max-w-sm z-50"
        >
            <div className="flex gap-3 items-start">
                {/* Product thumbnail */}
                <motion.img
                    src={productImage}
                    alt={productName}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />

                {/* Content */}
                <div className="flex-1">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <h4 className="text-sm font-semibold text-espresso flex items-center gap-2">
                            Added to your cart
                            <span className="text-lg">✨</span>
                        </h4>
                        <p className="text-xs text-stone mt-1">{productName}</p>
                    </motion.div>

                    {/* Sparkles */}
                    <motion.div className="absolute top-0 right-0 w-8 h-8">
                        {createSparkles(3).map((sparkle) => (
                            <motion.div
                                key={sparkle.id}
                                className="absolute w-1 h-1 bg-gold rounded-full"
                                variants={sparkleParticle}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: sparkle.delay }}
                            />
                        ))}
                    </motion.div>

                    {/* Buttons */}
                    <div className="flex gap-2 mt-3">
                        <motion.button
                            onClick={onViewCart}
                            className="flex-1 px-3 py-2 bg-maroon text-white text-xs font-medium rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            View Cart
                        </motion.button>
                        <motion.button
                            onClick={onContinueShopping}
                            className="flex-1 px-3 py-2 border border-maroon text-maroon text-xs font-medium rounded-lg hover:bg-maroon/5"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            Continue Shopping
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Add to Cart Button with complete animation
 */
export function AddToCartButton({ product, onAddComplete }) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [showSparkles, setShowSparkles] = useState(false);

    const handleAddToCart = async () => {
        setIsAnimating(true);
        setShowSparkles(true);

        // Trigger cart icon bounce
        const cartEvent = new CustomEvent("cartBounce");
        window.dispatchEvent(cartEvent);

        // Reset button after 1 second
        setTimeout(() => {
            setIsAnimating(false);
        }, 1000);

        setTimeout(() => {
            setShowSparkles(false);
        }, 600);

        onAddComplete?.();
    };

    return (
        <div className="relative">
            <motion.button
                onClick={handleAddToCart}
                className="w-full px-4 py-3 bg-maroon text-white rounded-lg font-medium text-sm"
                variants={addToCartProductLift}
                initial="initial"
                animate={isAnimating ? "animate" : "initial"}
                whileHover={{ scale: isAnimating ? 1.02 : 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                disabled={isAnimating}
            >
                <motion.span
                    initial={{ opacity: 1 }}
                    animate={isAnimating ? { opacity: 0 } : { opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {isAnimating ? "Added ✓" : "Add to Cart"}
                </motion.span>
            </motion.button>

            {/* Sparkle effect */}
            <AnimatePresence>
                {showSparkles && (
                    <motion.div className="absolute inset-0 pointer-events-none">
                        {createSparkles(6).map((sparkle) => (
                            <motion.div
                                key={sparkle.id}
                                className="absolute w-1.5 h-1.5 bg-gold rounded-full"
                                style={{
                                    left: "50%",
                                    top: "50%",
                                    marginLeft: -3,
                                    marginTop: -3,
                                }}
                                variants={sparkleParticle}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: sparkle.delay }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Flying product thumbnail animation
 */
export function FlyingProductThumbnail({ productImage, targetPosition, onComplete }) {
    return (
        <motion.img
            src={productImage}
            alt="product"
            className="fixed w-16 h-16 object-cover rounded-lg pointer-events-none z-50"
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
            animate={{
                opacity: [1, 0.8, 0],
                scale: [0.5, 0.4],
                x: targetPosition?.x || 0,
                y: targetPosition?.y || 0,
            }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            onAnimationComplete={onComplete}
        />
    );
}

/**
 * Cart Icon Bounce Trigger
 */
export function CartIconBounceContainer({ cartRef }) {
    const [shouldBounce, setShouldBounce] = useState(false);

    // Listen for cart bounce event
    React.useEffect(() => {
        const handleCartBounce = () => {
            setShouldBounce(true);
            setTimeout(() => setShouldBounce(false), 500);
        };

        window.addEventListener("cartBounce", handleCartBounce);
        return () => window.removeEventListener("cartBounce", handleCartBounce);
    }, []);

    return (
        <motion.div
            ref={cartRef}
            data-cart-icon
            animate={shouldBounce ? cartIconBounce.animate : {}}
            transition={shouldBounce ? cartIconBounce.transition : {}}
        >
            {/* Cart icon content */}
        </motion.div>
    );
}

export default AddToCartButton;
