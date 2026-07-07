import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Heart } from "lucide-react";
import {
    heartFill,
    burstHeart,
    wishlistToastSlide,
    createBurstHearts,
} from "@/utils/microAnimations";

/**
 * Wishlist Heart Button with burst animation
 */
export function WishlistHeartButton({ isWishlisted, onToggle, productId }) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleClick = () => {
        if (!isAnimating) {
            setIsAnimating(true);
            setShowToast(true);

            // Reset animation
            setTimeout(() => setIsAnimating(false), 500);
            setTimeout(() => setShowToast(false), 4000);

            onToggle?.(productId);
        }
    };

    return (
        <>
            <motion.button
                onClick={handleClick}
                className="relative p-2 rounded-full hover:bg-maroon/10 transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {isAnimating ? (
                    <>
                        {/* Filled heart */}
                        <motion.svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-maroon"
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </motion.svg>

                        {/* Burst hearts */}
                        <AnimatePresence>
                            {createBurstHearts(8).map((heart) => (
                                <motion.div
                                    key={heart.id}
                                    className="absolute w-2 h-2 bg-maroon rounded-full"
                                    style={{
                                        left: "50%",
                                        top: "50%",
                                    }}
                                    initial={{
                                        x: 0,
                                        y: 0,
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    animate={{
                                        x: Math.cos(heart.angle) * heart.distance,
                                        y: Math.sin(heart.angle) * heart.distance,
                                        opacity: 0,
                                        scale: 0,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        ease: "easeOut",
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </>
                ) : (
                    <Heart
                        size={24}
                        className={`${
                            isWishlisted
                                ? "fill-maroon text-maroon"
                                : "text-maroon/40 hover:text-maroon"
                        } transition`}
                    />
                )}
            </motion.button>

            {/* Wishlist Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg p-4 backdrop-blur-md border border-maroon/10 z-50"
                        variants={wishlistToastSlide}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <div className="flex items-center gap-2">
                            <Heart size={18} className="fill-maroon text-maroon" />
                            <span className="text-sm font-medium text-espresso">
                                Saved to wishlist ♡
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * Wishlist Badge animation (e.g., on product card)
 */
export function WishlistBadge() {
    return (
        <motion.div
            className="absolute top-3 right-3 bg-maroon text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", type: "spring", stiffness: 200 }}
        >
            <Heart size={12} className="fill-white" />
            Wishlist
        </motion.div>
    );
}

/**
 * Wishlist Page Empty State
 */
export function WishlistEmptyState() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Heart illustration */}
            <motion.div
                animate={{
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
            >
                <Heart size={64} className="text-maroon/20 mb-6" strokeWidth={1} />
            </motion.div>

            <h3 className="text-xl font-serif text-espresso mb-2">
                Save your favourite outfits here
            </h3>
            <p className="text-sm text-stone mb-6 max-w-xs">
                Add items to your wishlist to keep track of pieces you love
            </p>

            <motion.a
                href="/shop"
                className="px-6 py-3 bg-maroon text-white rounded-lg font-medium text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Start Shopping
            </motion.a>
        </motion.div>
    );
}

export default WishlistHeartButton;
