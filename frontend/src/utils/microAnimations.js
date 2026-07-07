/**
 * 🎀 MICRO-ANIMATIONS LIBRARY
 * Premium, smooth, minimal micro-interactions for shopping
 */

import { toast } from "sonner";
import { motion } from "framer-motion";

// ============================================================================
// TOAST ANIMATIONS - Premium success/info messages
// ============================================================================

export const showAddToCartToast = () => {
    toast.custom((t) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white backdrop-blur-xl border border-gold/30 rounded-lg shadow-lg p-4 max-w-sm"
        >
            <div className="flex items-start gap-3">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-gold text-xl"
                >
                    ✨
                </motion.div>
                <div className="flex-1">
                    <p className="font-medium text-espresso">Added to your cart</p>
                    <div className="flex gap-2 mt-3">
                        <motion.button
                            onClick={() => toast.dismiss(t)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-gold/10 text-gold hover:bg-gold/20 transition"
                        >
                            View Cart
                        </motion.button>
                        <motion.button
                            onClick={() => toast.dismiss(t)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-espresso/10 text-espresso hover:bg-espresso/20 transition"
                        >
                            Continue Shopping
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    ), {
        duration: 4000,
    });
};

export const showWishlistToast = (saved) => {
    toast.custom((t) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white backdrop-blur-xl border border-maroon/30 rounded-lg shadow-lg p-4"
        >
            <div className="flex items-center gap-2">
                <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    className="text-maroon text-xl"
                >
                    ♡
                </motion.span>
                <span className="font-medium text-espresso">
                    {saved ? "Saved to wishlist" : "Removed from wishlist"}
                </span>
            </div>
        </motion.div>
    ), {
        duration: 3000,
    });
};

export const showSuccessToast = (message, duration = 3000) => {
    toast.custom((t) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white backdrop-blur-xl border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3"
        >
            <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
                className="text-green-600"
            >
                ✓
            </motion.div>
            <span className="font-medium text-espresso">{message}</span>
        </motion.div>
    ), {
        duration,
    });
};

// ============================================================================
// ADD TO CART ANIMATION VARIANTS
// ============================================================================

export const addToCartVariants = {
    productImage: {
        initial: { scale: 1, opacity: 1 },
        animate: { scale: 1.05, opacity: 1 },
        transition: { duration: 0.2 },
    },

    flyingItem: {
        initial: { opacity: 0, scale: 0.3, x: 0, y: 0 },
        animate: { opacity: 0, scale: 0 },
        transition: { duration: 0.8, ease: "easeInOut" },
    },

    cartIconBounce: {
        animate: {
            scale: [1, 0.9, 1.1, 1],
            transition: { duration: 0.6, ease: "easeInOut" },
        },
    },

    button: {
        initial: { scale: 1 },
        added: { scale: 1.05, backgroundColor: "#e8f5e9" },
        afterAdded: { scale: 1 },
        transition: { duration: 0.3 },
    },
};

// ============================================================================
// WISHLIST HEART ANIMATION
// ============================================================================

export const wishlistHeartVariants = {
    heart: {
        initial: { scale: 1, color: "currentColor" },
        filled: {
            scale: [1, 1.3, 1],
            transition: { duration: 0.4, ease: "easeOut" },
        },
        filledColor: { color: "#A2466B" }, // maroon
    },

    floatingHearts: {
        initial: (i) => ({
            opacity: 1,
            scale: 0.6,
            x: 0,
            y: 0,
        }),
        animate: (i) => ({
            opacity: 0,
            scale: 0,
            x: (i - 2) * 40,
            y: -80,
        }),
        transition: { duration: 0.8, ease: "easeOut" },
    },
};

// ============================================================================
// BUY NOW ANIMATION
// ============================================================================

export const buyNowVariants = {
    button: {
        initial: { scale: 1 },
        glowing: {
            scale: 1.02,
            boxShadow: [
                "0 0 0 0 rgba(201, 168, 76, 0.7)",
                "0 0 0 12px rgba(201, 168, 76, 0)",
            ],
            transition: { duration: 0.8, ease: "easeOut" },
        },
    },

    pageTransition: {
        initial: { opacity: 1 },
        exit: { opacity: 0, y: 40 },
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
    },
};

// ============================================================================
// PRODUCT CARD HOVER ANIMATION
// ============================================================================

export const productCardVariants = {
    card: {
        initial: { y: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" },
        hover: {
            y: -8,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            transition: { duration: 0.3, ease: "easeOut" },
        },
    },

    secondImage: {
        initial: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
        transition: { duration: 0.4, ease: "easeOut" },
    },

    buttons: {
        initial: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: "easeOut" },
    },

    price: {
        initial: { opacity: 1 },
        visible: { opacity: 1 },
    },
};

// ============================================================================
// PRODUCT IMAGE GALLERY ANIMATION
// ============================================================================

export const galleryVariants = {
    mainImage: {
        initial: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, ease: "easeOut" },
        hover: { scale: 1.08 },
    },

    thumbnail: {
        initial: { borderColor: "rgba(0, 0, 0, 0.1)", borderWidth: "2px" },
        selected: {
            borderColor: "#A2466B",
            borderWidth: "2px",
            transition: { duration: 0.3 },
        },
    },

    videoPreview: {
        initial: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

// ============================================================================
// CART PAGE ANIMATIONS
// ============================================================================

export const cartPageVariants = {
    quantityNumber: {
        initial: { scale: 1 },
        pop: {
            scale: [1, 1.3, 1],
            transition: { duration: 0.4, ease: "easeOut" },
        },
    },

    priceUpdate: {
        initial: { color: "currentColor" },
        updated: {
            color: "#A2466B",
            transition: { duration: 0.4 },
        },
    },

    removeCard: {
        initial: { opacity: 1, x: 0 },
        removed: {
            opacity: 0,
            x: 100,
            transition: { duration: 0.4, ease: "easeInOut" },
        },
    },

    undoButton: {
        initial: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: "easeOut" },
        exit: { opacity: 0, y: -10 },
    },
};

// ============================================================================
// CHECKOUT PROGRESS ANIMATION
// ============================================================================

export const checkoutProgressVariants = {
    progressBar: {
        initial: { width: "0%" },
        animate: (progress) => ({
            width: `${progress}%`,
            transition: { duration: 0.6, ease: "easeOut" },
        }),
    },

    stepBadge: {
        initial: { scale: 0.8, opacity: 0 },
        active: {
            scale: 1,
            opacity: 1,
            boxShadow: "0 0 20px rgba(162, 70, 107, 0.4)",
            transition: { duration: 0.4, ease: "easeOut" },
        },
    },

    stepLine: {
        initial: { scaleX: 0 },
        completed: {
            scaleX: 1,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    },
};

// ============================================================================
// ORDER SUCCESS ANIMATION
// ============================================================================

export const orderSuccessVariants = {
    confetti: {
        initial: { opacity: 1, y: 0, rotate: 0 },
        animate: { opacity: 0, y: 100, rotate: 180 },
        transition: { duration: 2, ease: "easeIn" },
    },

    checkmark: {
        initial: { scale: 0, rotate: -180 },
        visible: {
            scale: 1,
            rotate: 0,
            transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
        },
    },

    successMessage: {
        initial: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.3, ease: "easeOut" },
        },
    },

    orderNumber: {
        initial: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, delay: 0.5, ease: "easeOut" },
        },
    },

    trackButton: {
        initial: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.7, ease: "easeOut" },
        },
    },
};

// ============================================================================
// SELLER DASHBOARD ANIMATIONS
// ============================================================================

export const sellerDashboardVariants = {
    newOrderCard: {
        animate: {
            boxShadow: [
                "0 4px 12px rgba(0, 0, 0, 0.08)",
                "0 8px 24px rgba(162, 70, 107, 0.2)",
                "0 4px 12px rgba(0, 0, 0, 0.08)",
            ],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        },
    },

    progressBar: {
        animate: { width: "100%" },
        transition: { duration: 2, ease: "easeOut" },
    },

    statusBadge: {
        pending: {
            backgroundColor: "#fff3cd",
            color: "#856404",
            animation: "pulse 2s infinite",
        },
        approved: {
            backgroundColor: "#d4edda",
            color: "#155724",
        },
        rejected: {
            backgroundColor: "#f8d7da",
            color: "#721c24",
        },
    },
};

// ============================================================================
// ADMIN PANEL ANIMATIONS
// ============================================================================

export const adminPanelVariants = {
    newApplication: {
        initial: { opacity: 0, y: 20, borderColor: "transparent" },
        visible: {
            opacity: 1,
            y: 0,
            borderColor: "rgba(162, 70, 107, 0.3)",
            boxShadow: "0 0 20px rgba(162, 70, 107, 0.1)",
            transition: { duration: 0.5, ease: "easeOut" },
        },
    },

    approveButton: {
        initial: { scale: 1 },
        clicked: {
            scale: 1.05,
            transition: { duration: 0.2 },
        },
        approved: {
            scale: 1,
            backgroundColor: "#d4edda",
            transition: { duration: 0.3 },
        },
    },

    rejectButton: {
        initial: { opacity: 1, scale: 1 },
        clicked: {
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.4, ease: "easeInOut" },
        },
    },

    dashboardNumber: {
        initial: { opacity: 0 },
        animate: (target) => ({
            opacity: 1,
            transition: { duration: 0.6 },
        }),
    },
};

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export const loadingVariants = {
    spinIcon: {
        animate: { rotate: 360 },
        transition: { duration: 2, repeat: Infinity, ease: "linear" },
    },

    pulseIcon: {
        animate: { scale: [1, 1.1, 1] },
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
    },

    shimmerText: {
        animate: { opacity: [0.5, 1, 0.5] },
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
    },
};

// ============================================================================
// EMPTY STATE ANIMATIONS
// ============================================================================

export const emptyStateVariants = {
    illustration: {
        initial: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
        },
        float: {
            y: [0, -10, 0],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        },
    },

    text: {
        initial: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.2, ease: "easeOut" },
        },
    },

    button: {
        initial: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.6, delay: 0.4, ease: "easeOut" },
        },
    },
};

// ============================================================================
// FESTIVAL ANIMATIONS
// ============================================================================

export const festivalVariants = {
    floatingElement: (delay = 0) => ({
        animate: {
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
            transition: {
                duration: 4,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
            },
        },
    }),

    diya: {
        glow: {
            boxShadow: [
                "0 0 10px rgba(255, 165, 0, 0.3)",
                "0 0 30px rgba(255, 165, 0, 0.6)",
                "0 0 10px rgba(255, 165, 0, 0.3)",
            ],
            transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        },
    },

    flower: {
        rotate: {
            rotate: [0, 360],
            transition: { duration: 8, repeat: Infinity, ease: "linear" },
        },
    },
};

// ============================================================================
// UTILITY ANIMATIONS
// ============================================================================

/**
 * Flying item animation - for cart animation
 * Use: createFlyingItem(fromPos, toPos, duration)
 */
export function createFlyingItemAnimation(fromX, fromY, toX, toY, duration = 0.8) {
    return {
        initial: { x: fromX, y: fromY, opacity: 1, scale: 0.4 },
        animate: { x: toX, y: toY, opacity: 0, scale: 0 },
        transition: { duration, ease: "easeInOut" },
    };
}

/**
 * Counter animation - for counting up numbers
 */
export function createCounterAnimation(fromValue, toValue, duration = 1) {
    const differences = toValue - fromValue;
    return {
        animate: { count: toValue },
        transition: { duration, ease: "easeOut" },
    };
}

/**
 * Pulse animation - soft, subtle pulse
 */
export const pulseAnimation = {
    animate: {
        boxShadow: [
            "0 0 0 0 rgba(162, 70, 107, 0.7)",
            "0 0 0 12px rgba(162, 70, 107, 0)",
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
        },
    },
};

/**
 * Shimmer animation - text loading effect
 */
export const shimmerAnimation = {
    initial: { backgroundPosition: "200% 0" },
    animate: { backgroundPosition: "-200% 0" },
    transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear",
    },
};

// ============================================================================
// BUTTON STATE ANIMATIONS
// ============================================================================

export const buttonStateVariants = {
    normal: { scale: 1 },
    hover: { scale: 1.05, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)" },
    tap: { scale: 0.95 },
    loading: {
        scale: 1,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    disabled: { opacity: 0.5, scale: 1 },
};

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const transitionPresets = {
    micro: { duration: 0.2, ease: "easeOut" },
    quick: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
    standard: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    smooth: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
    elastic: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
};

export default {
    showAddToCartToast,
    showWishlistToast,
    showSuccessToast,
    addToCartVariants,
    wishlistHeartVariants,
    buyNowVariants,
    productCardVariants,
    galleryVariants,
    cartPageVariants,
    checkoutProgressVariants,
    orderSuccessVariants,
    sellerDashboardVariants,
    adminPanelVariants,
    loadingVariants,
    emptyStateVariants,
    festivalVariants,
    createFlyingItemAnimation,
    createCounterAnimation,
    pulseAnimation,
    shimmerAnimation,
    buttonStateVariants,
    transitionPresets,
};
