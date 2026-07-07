import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Valid coupon codes and their discount percentages.
 * Add new codes here as a simple key → percent mapping.
 */
export const VALID_COUPONS = {
  DIWALI10: 10,
  WELCOME20: 20,
};

/**
 * CouponField — discount-code input for the Luxury Checkout.
 *
 * Props:
 *   onCouponApply  {(discountPercent: number) => void}  — called when a valid
 *                  coupon is successfully applied; called with 0 when removed.
 *   cartSubtotal   {number}   — used to calculate and display the savings
 *                  amount in the success badge.
 */
const CouponField = ({ onCouponApply, cartSubtotal = 0 }) => {
  const [inputValue, setInputValue] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, percent }
  const [shakeKey, setShakeKey] = useState(0); // increment to retrigger shake
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  const handleApply = () => {
    const code = inputValue.trim().toUpperCase();
    const percent = VALID_COUPONS[code];

    if (percent !== undefined) {
      // Valid coupon
      setAppliedCoupon({ code, percent });
      setInputValue('');
      if (onCouponApply) onCouponApply(percent);
    } else {
      // Invalid coupon — trigger shake
      setShakeKey((k) => k + 1);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 220);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setInputValue('');
    if (onCouponApply) onCouponApply(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply();
  };

  // Savings amount for the badge
  const savingsAmount =
    appliedCoupon && cartSubtotal > 0
      ? ((cartSubtotal * appliedCoupon.percent) / 100).toFixed(2)
      : null;

  return (
    <div className="space-y-3">
      {/* Input row */}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <label
            htmlFor="coupon-code-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Coupon Code
          </label>

          <motion.input
            key={shakeKey}
            id="coupon-code-input"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. DIWALI10"
            disabled={!!appliedCoupon}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-400
                       disabled:bg-gray-100 disabled:text-gray-400
                       disabled:cursor-not-allowed"
            /* Shake keyframe animation on invalid code */
            animate={
              isShaking
                ? { x: [0, -8, 8, -6, 6, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          />
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={!!appliedCoupon || !inputValue.trim()}
          className="mt-6 min-h-[44px] px-4 rounded-lg text-sm font-semibold
                     bg-amber-500 text-white
                     hover:bg-amber-600 active:bg-amber-700
                     disabled:bg-gray-200 disabled:text-gray-400
                     disabled:cursor-not-allowed
                     transition-colors duration-150"
          aria-label="Apply coupon code"
        >
          Apply
        </button>
      </div>

      {/* Success badge — slides in via AnimatePresence */}
      <AnimatePresence>
        {appliedCoupon && (
          <motion.div
            key="coupon-badge"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center justify-between
                         bg-green-50 border border-green-300
                         rounded-lg px-3 py-2 text-sm"
            >
              <span className="font-medium text-green-800">
                <span className="font-mono">{appliedCoupon.code}</span> applied
                {' — '}{appliedCoupon.percent}% off
                {savingsAmount && (
                  <span className="ml-1 text-green-700">
                    (saves ₹{savingsAmount})
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={handleRemove}
                aria-label="Remove coupon"
                className="ml-3 text-green-600 hover:text-green-800
                           font-bold text-base leading-none min-h-[44px]
                           min-w-[44px] flex items-center justify-center
                           rounded transition-colors"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponField;
