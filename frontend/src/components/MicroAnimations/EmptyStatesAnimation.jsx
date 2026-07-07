import { motion } from "framer-motion";
import { ShoppingBag, Heart, Search } from "lucide-react";
import {
    emptyStateFloat,
    emptyStateTextFade,
    emptyStateCTAGlow,
} from "@/utils/microAnimations";

/**
 * Empty Cart State
 */
export function EmptyCartState({ onStartShopping }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            {/* Illustration */}
            <motion.div
                className="mb-6"
                animate={emptyStateFloat.animate}
                transition={emptyStateFloat.transition}
            >
                <ShoppingBag size={80} className="text-maroon/20" strokeWidth={1} />
            </motion.div>

            {/* Text */}
            <motion.h3
                className="text-2xl font-serif text-espresso mb-2"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
            >
                Your cart is waiting for some desi magic ✨
            </motion.h3>

            <motion.p
                className="text-stone max-w-xs mb-8"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
            >
                Discover beautiful Indian ethnic wear and have it delivered worldwide
            </motion.p>

            {/* CTA Button */}
            <motion.a
                href="/shop"
                onClick={onStartShopping}
                className="px-8 py-3 bg-maroon text-white rounded-lg font-medium text-sm"
                animate={emptyStateCTAGlow.animate}
                transition={emptyStateCTAGlow.transition}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Start Shopping
            </motion.a>
        </motion.div>
    );
}

/**
 * Empty Wishlist State
 */
export function EmptyWishlistState() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            {/* Illustration */}
            <motion.div
                className="mb-6"
                animate={emptyStateFloat.animate}
                transition={emptyStateFloat.transition}
            >
                <Heart size={80} className="text-maroon/20" strokeWidth={1} />
            </motion.div>

            {/* Text */}
            <motion.h3
                className="text-2xl font-serif text-espresso mb-2"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
            >
                Save your favourite outfits here
            </motion.h3>

            <motion.p
                className="text-stone max-w-xs mb-8"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
            >
                Add items to your wishlist to keep track of pieces you love. We'll notify you when they go on sale.
            </motion.p>

            {/* CTA Button */}
            <motion.a
                href="/shop"
                className="px-8 py-3 bg-maroon text-white rounded-lg font-medium text-sm"
                animate={emptyStateCTAGlow.animate}
                transition={emptyStateCTAGlow.transition}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Explore Collections
            </motion.a>
        </motion.div>
    );
}

/**
 * No Products Found State
 */
export function NoProductsFoundState({ searchTerm, onClearSearch }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Animated Search Icon */}
            <motion.div
                className="mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
            >
                <Search size={80} className="text-maroon/20" strokeWidth={1} />
            </motion.div>

            {/* Text */}
            <motion.h3
                className="text-2xl font-serif text-espresso mb-2"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
            >
                No matching outfits found
            </motion.h3>

            <motion.p
                className="text-stone max-w-xs mb-8"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
            >
                {searchTerm ? (
                    <>We couldn't find any products matching "<strong>{searchTerm}</strong>". Try a different search or browse our collections.</>
                ) : (
                    <>Try adjusting your filters or search terms to find what you're looking for.</>
                )}
            </motion.p>

            {/* Action Buttons */}
            <div className="flex gap-4">
                {searchTerm && (
                    <motion.button
                        onClick={onClearSearch}
                        className="px-6 py-2 border border-maroon text-maroon rounded-lg font-medium text-sm hover:bg-maroon/5"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Clear Search
                    </motion.button>
                )}
                <motion.a
                    href="/shop"
                    className="px-6 py-2 bg-maroon text-white rounded-lg font-medium text-sm"
                    animate={emptyStateCTAGlow.animate}
                    transition={emptyStateCTAGlow.transition}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Browse All Products
                </motion.a>
            </div>
        </motion.div>
    );
}

/**
 * Order Not Found State
 */
export function OrderNotFoundState() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            {/* Illustration */}
            <motion.div
                className="mb-6"
                animate={emptyStateFloat.animate}
                transition={emptyStateFloat.transition}
            >
                <ShoppingBag size={80} className="text-maroon/20" strokeWidth={1} />
            </motion.div>

            {/* Text */}
            <motion.h3
                className="text-2xl font-serif text-espresso mb-2"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
            >
                Order not found
            </motion.h3>

            <motion.p
                className="text-stone max-w-xs mb-8"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
            >
                We couldn't find this order. Please check the order number or contact our support team.
            </motion.p>

            {/* CTA Buttons */}
            <div className="flex gap-4">
                <motion.a
                    href="/orders"
                    className="px-6 py-2 bg-maroon text-white rounded-lg font-medium text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    View Orders
                </motion.a>
                <motion.a
                    href="/contact"
                    className="px-6 py-2 border border-maroon text-maroon rounded-lg font-medium text-sm hover:bg-maroon/5"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Contact Support
                </motion.a>
            </div>
        </motion.div>
    );
}

/**
 * Error State Generic
 */
export function ErrorState({ title = "Something went wrong", message, onRetry }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Error Icon */}
            <motion.div
                className="mb-6 w-20 h-20 bg-red-50 rounded-full flex items-center justify-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            >
                <span className="text-4xl">⚠️</span>
            </motion.div>

            {/* Text */}
            <motion.h3
                className="text-2xl font-serif text-espresso mb-2"
                variants={emptyStateTextFade}
                initial="initial"
                animate="animate"
            >
                {title}
            </motion.h3>

            {message && (
                <motion.p
                    className="text-stone max-w-xs mb-8"
                    variants={emptyStateTextFade}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.1 }}
                >
                    {message}
                </motion.p>
            )}

            {/* Retry Button */}
            {onRetry && (
                <motion.button
                    onClick={onRetry}
                    className="px-6 py-2 bg-maroon text-white rounded-lg font-medium text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Try Again
                </motion.button>
            )}
        </motion.div>
    );
}

export default EmptyCartState;
