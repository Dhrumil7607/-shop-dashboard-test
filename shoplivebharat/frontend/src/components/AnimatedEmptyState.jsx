import { motion } from "framer-motion";
import { ShoppingBag, Heart, Search } from "lucide-react";
import { emptyStateVariants, transitionPresets } from "@/utils/microAnimations";
import { Link } from "react-router-dom";

export function EmptyCart() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-16 md:py-24 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transitionPresets.standard}
        >
            {/* Floating Shopping Bag */}
            <motion.div
                variants={emptyStateVariants.illustration}
                initial="initial"
                animate={["visible", "float"]}
                transition={transitionPresets.standard}
                className="mb-6"
            >
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-gold" strokeWidth={1.5} />
                </div>
            </motion.div>

            {/* Text */}
            <motion.p
                variants={emptyStateVariants.text}
                initial="initial"
                animate="visible"
                className="text-center text-lg md:text-xl font-medium text-espresso mb-2"
            >
                Your cart is waiting
            </motion.p>

            <motion.p
                variants={emptyStateVariants.text}
                initial="initial"
                animate="visible"
                className="text-center text-sm text-stone mb-8"
            >
                for some desi magic ✨
            </motion.p>

            {/* Button */}
            <motion.div
                variants={emptyStateVariants.button}
                initial="initial"
                animate="visible"
            >
                <Link
                    to="/shop"
                    className="px-6 py-3 bg-gold text-white rounded-lg font-medium hover:bg-gold/90 transition inline-block"
                >
                    Start Shopping
                </Link>
            </motion.div>
        </motion.div>
    );
}

export function EmptyWishlist() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-16 md:py-24 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transitionPresets.standard}
        >
            {/* Floating Heart */}
            <motion.div
                variants={emptyStateVariants.illustration}
                initial="initial"
                animate={["visible", "float"]}
                className="mb-6"
            >
                <div className="w-20 h-20 rounded-full bg-maroon/10 flex items-center justify-center">
                    <Heart size={40} className="text-maroon" strokeWidth={1.5} />
                </div>
            </motion.div>

            {/* Text */}
            <motion.p
                variants={emptyStateVariants.text}
                initial="initial"
                animate="visible"
                className="text-center text-lg md:text-xl font-medium text-espresso mb-2"
            >
                Save your favourite outfits here
            </motion.p>

            <motion.p
                variants={emptyStateVariants.text}
                initial="initial"
                animate="visible"
                className="text-center text-sm text-stone mb-8"
            >
                Start adding items to your wishlist ♡
            </motion.p>

            {/* Button */}
            <motion.div
                variants={emptyStateVariants.button}
                initial="initial"
                animate="visible"
            >
                <Link
                    to="/shop"
                    className="px-6 py-3 bg-maroon text-white rounded-lg font-medium hover:bg-maroon/90 transition inline-block"
                >
                    Explore Collections
                </Link>
            </motion.div>
        </motion.div>
    );
}

export function NoResultsFound() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-16 md:py-24 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transitionPresets.standard}
        >
            {/* Animated Search Icon */}
            <motion.div
                variants={emptyStateVariants.illustration}
                initial="initial"
                animate={["visible", "float"]}
                className="mb-6"
            >
                <motion.div
                    className="w-20 h-20 rounded-full bg-stone/10 flex items-center justify-center"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Search size={40} className="text-stone" strokeWidth={1.5} />
                </motion.div>
            </motion.div>

            {/* Text */}
            <motion.p
                variants={emptyStateVariants.text}
                initial="initial"
                animate="visible"
                className="text-center text-lg md:text-xl font-medium text-espresso mb-2"
            >
                No matching outfits found
            </motion.p>

            <motion.p
                variants={emptyStateVariants.text}
                initial="initial"
                animate="visible"
                className="text-center text-sm text-stone mb-8"
            >
                Try adjusting your search or filters
            </motion.p>

            {/* Button */}
            <motion.div
                variants={emptyStateVariants.button}
                initial="initial"
                animate="visible"
            >
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-espresso text-white rounded-lg font-medium hover:bg-espresso/90 transition inline-block"
                >
                    Try Again
                </button>
            </motion.div>
        </motion.div>
    );
}

export function NoSellerOrders() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-16 md:py-24 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transitionPresets.standard}
        >
            {/* Floating Shopping Bag */}
            <motion.div
                variants={emptyStateVariants.illustration}
                initial="initial"
                animate={["visible", "float"]}
                className="mb-6"
            >
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-gold" strokeWidth={1.5} />
                </div>
            </motion.div>

            {/* Text */}
            <motion.p
                variants={emptyStateVariants.text}
                initial="initial"
                animate="visible"
                className="text-center text-lg md:text-xl font-medium text-espresso mb-2"
            >
                No orders yet
            </motion.p>

            <motion.p
                variants={emptyStateVariants.text}
                initial="initial"
                animate="visible"
                className="text-center text-sm text-stone mb-8"
            >
                Your orders will appear here
            </motion.p>
        </motion.div>
    );
}
