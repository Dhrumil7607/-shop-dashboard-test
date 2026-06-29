import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import {
    cartItemRemoveSlide,
    quantityPop,
    priceCountUp,
    undoToastSlide,
} from "@/utils/microAnimations";

/**
 * Cart Item with removal and undo animation
 */
export function CartItemWithAnimation({
    item,
    onQuantityChange,
    onRemove,
    onUndo,
}) {
    const [isRemoving, setIsRemoving] = useState(false);
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [undoTimeout, setUndoTimeout] = useState(null);

    const handleRemove = () => {
        setIsRemoving(true);
        setShowUndoToast(true);

        // Set auto-remove after 5 seconds
        const timeout = setTimeout(() => {
            setShowUndoToast(false);
            setIsRemoving(false);
        }, 5000);

        setUndoTimeout(timeout);
    };

    const handleUndo = () => {
        if (undoTimeout) clearTimeout(undoTimeout);
        setShowUndoToast(false);
        setIsRemoving(false);
        onUndo?.();
    };

    return (
        <>
            <AnimatePresence>
                {!isRemoving && (
                    <motion.div
                        className="flex gap-4 p-4 bg-white rounded-lg border border-stone/10 mb-4"
                        initial={{ opacity: 1, x: 0 }}
                        exit={cartItemRemoveSlide.exit}
                    >
                        {/* Product Image */}
                        <motion.img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            whileHover={{ scale: 1.05 }}
                        />

                        {/* Product Details */}
                        <div className="flex-1">
                            <h3 className="font-serif text-sm md:text-base text-espresso">
                                {item.name}
                            </h3>
                            <p className="text-xs text-stone mt-1">
                                Size: {item.size} | Color: {item.color}
                            </p>

                            {/* Quantity Control */}
                            <div className="flex items-center gap-3 mt-3">
                                <motion.button
                                    onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                                    className="w-6 h-6 rounded border border-stone/20 text-sm text-stone hover:bg-stone/5"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    −
                                </motion.button>

                                {/* Quantity with pop animation */}
                                <motion.span
                                    key={`qty-${item.id}-${item.quantity}`}
                                    className="w-6 text-center text-sm font-semibold"
                                    variants={quantityPop}
                                    initial="initial"
                                    animate="animate"
                                >
                                    {item.quantity}
                                </motion.span>

                                <motion.button
                                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                                    className="w-6 h-6 rounded border border-stone/20 text-sm text-stone hover:bg-stone/5"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    +
                                </motion.button>
                            </div>
                        </div>

                        {/* Price and Remove */}
                        <div className="flex flex-col items-end gap-4">
                            {/* Price with animation */}
                            <motion.div
                                key={`price-${item.id}-${item.totalPrice}`}
                                className="text-lg font-bold text-maroon"
                                variants={priceCountUp}
                                initial="initial"
                                animate="animate"
                            >
                                ${(item.price * item.quantity).toFixed(2)}
                            </motion.div>

                            {/* Remove Button */}
                            <motion.button
                                onClick={handleRemove}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Remove from cart"
                            >
                                <Trash2 size={18} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Undo Toast */}
            <AnimatePresence>
                {showUndoToast && (
                    <motion.div
                        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-stone/10 backdrop-blur-md z-50"
                        variants={undoToastSlide}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-espresso">
                                    Removed from cart
                                </p>
                                <p className="text-xs text-stone">{item.name}</p>
                            </div>

                            <motion.button
                                onClick={handleUndo}
                                className="flex items-center gap-1 px-4 py-2 bg-maroon text-white text-xs font-semibold rounded-lg hover:bg-maroon/90"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <RotateCcw size={14} />
                                Undo
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * Cart Summary with animated price totals
 */
export function CartSummaryWithAnimation({
    subtotal,
    shipping,
    tax,
    discount,
}) {
    const total = subtotal + shipping + tax - discount;

    return (
        <motion.div
            className="bg-stone/5 rounded-lg p-6 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            {/* Subtotal */}
            <div className="flex justify-between items-center text-sm">
                <span className="text-stone">Subtotal</span>
                <motion.span
                    key={`subtotal-${subtotal}`}
                    className="font-semibold"
                    variants={priceCountUp}
                    initial="initial"
                    animate="animate"
                >
                    ${subtotal.toFixed(2)}
                </motion.span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between items-center text-sm">
                <span className="text-stone">Shipping</span>
                <motion.span
                    key={`shipping-${shipping}`}
                    className="font-semibold"
                    variants={priceCountUp}
                    initial="initial"
                    animate="animate"
                >
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                </motion.span>
            </div>

            {/* Tax */}
            <div className="flex justify-between items-center text-sm">
                <span className="text-stone">Tax</span>
                <motion.span
                    key={`tax-${tax}`}
                    className="font-semibold"
                    variants={priceCountUp}
                    initial="initial"
                    animate="animate"
                >
                    ${tax.toFixed(2)}
                </motion.span>
            </div>

            {/* Discount */}
            {discount > 0 && (
                <motion.div
                    className="flex justify-between items-center text-sm text-green-600"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <span>Discount</span>
                    <motion.span
                        key={`discount-${discount}`}
                        className="font-semibold"
                        variants={priceCountUp}
                        initial="initial"
                        animate="animate"
                    >
                        -${discount.toFixed(2)}
                    </motion.span>
                </motion.div>
            )}

            {/* Divider */}
            <motion.div
                className="border-t border-stone/20 my-3"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4 }}
            />

            {/* Total */}
            <div className="flex justify-between items-center">
                <span className="font-semibold text-espresso">Total</span>
                <motion.span
                    key={`total-${total}`}
                    className="text-xl font-bold text-maroon"
                    variants={priceCountUp}
                    initial="initial"
                    animate="animate"
                >
                    ${total.toFixed(2)}
                </motion.span>
            </div>

            {/* CTA Button */}
            <motion.button
                className="w-full mt-6 px-4 py-3 bg-maroon text-white rounded-lg font-semibold text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
            >
                Proceed to Checkout
            </motion.button>
        </motion.div>
    );
}

/**
 * Empty Cart State with animation
 */
export function EmptyCartNotice() {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            >
                🛍️
            </motion.div>

            <h2 className="text-2xl font-serif text-espresso mb-2">
                Your cart is empty
            </h2>
            <p className="text-stone max-w-xs mb-6">
                Ready to discover beautiful Indian ethnic wear?
            </p>

            <motion.a
                href="/shop"
                className="px-6 py-2 bg-maroon text-white rounded-lg font-semibold text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Start Shopping
            </motion.a>
        </motion.div>
    );
}

/**
 * Quantity Selector with pop animation
 */
export function QuantitySelectorAnimated({ value, onChange, max = 10 }) {
    return (
        <div className="flex items-center gap-2 bg-stone/5 p-1 rounded-lg">
            <motion.button
                onClick={() => onChange(Math.max(1, value - 1))}
                className="w-8 h-8 flex items-center justify-center text-sm text-stone hover:bg-stone/20 rounded"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                −
            </motion.button>

            <motion.span
                key={`qty-${value}`}
                className="w-8 text-center text-sm font-semibold text-espresso"
                variants={quantityPop}
                initial="initial"
                animate="animate"
            >
                {value}
            </motion.span>

            <motion.button
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                className="w-8 h-8 flex items-center justify-center text-sm text-stone hover:bg-stone/20 rounded disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                +
            </motion.button>
        </div>
    );
}

/**
 * Coupon code input with reveal animation
 */
export function CouponInputAnimated() {
    const [isApplied, setIsApplied] = useState(false);
    const [coupon, setCoupon] = useState("");

    const handleApply = () => {
        if (coupon.trim()) {
            setIsApplied(true);
        }
    };

    return (
        <motion.div
            className="p-4 bg-gold/10 rounded-lg border border-gold/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {!isApplied ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 bg-white border border-gold/20 rounded-lg text-sm outline-none focus:border-gold"
                    />
                    <motion.button
                        onClick={handleApply}
                        className="px-4 py-2 bg-gold text-white rounded-lg font-semibold text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Apply
                    </motion.button>
                </div>
            ) : (
                <motion.div
                    className="flex items-center gap-3 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <span className="text-green-600 font-semibold">✓ Coupon applied</span>
                    <span className="text-espresso font-bold">{coupon}</span>
                    <motion.button
                        onClick={() => {
                            setIsApplied(false);
                            setCoupon("");
                        }}
                        className="ml-auto text-xs text-stone hover:text-espresso"
                        whileHover={{ scale: 1.1 }}
                    >
                        Remove
                    </motion.button>
                </motion.div>
            )}
        </motion.div>
    );
}

export default CartItemWithAnimation;
