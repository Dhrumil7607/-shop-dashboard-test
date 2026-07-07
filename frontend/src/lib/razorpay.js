/**
 * razorpay.js — Razorpay payment integration
 *
 * Loads the Razorpay checkout script on demand and opens the payment modal.
 * Key is read from REACT_APP_RAZORPAY_KEY_ID env var.
 *
 * Usage:
 *   import { openRazorpay } from "@/lib/razorpay";
 *
 *   await openRazorpay({
 *     amount: 69900,           // in paise (₹699 = 69900)
 *     currency: "INR",
 *     name: "ShopLiveBharat",
 *     description: "Live Shopping Session",
 *     orderId: "order_xxx",    // optional Razorpay order_id from backend
 *     prefill: { name, email, contact },
 *     onSuccess: (response) => { ... },
 *     onDismiss: () => { ... },
 *   });
 */

const RZP_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID || "";

/** Lazily load the Razorpay checkout.js script (idempotent) */
function loadScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload  = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

/**
 * Open the Razorpay payment modal.
 *
 * @param {object} opts
 * @param {number}   opts.amount       - Amount in paise (₹1 = 100 paise)
 * @param {string}   [opts.currency]   - "INR" (default)
 * @param {string}   [opts.orderId]    - Razorpay order_id if you created one on backend
 * @param {string}   [opts.name]       - Merchant display name
 * @param {string}   [opts.description]
 * @param {object}   [opts.prefill]    - { name, email, contact }
 * @param {function} opts.onSuccess    - Called with Razorpay payment response on success
 * @param {function} [opts.onDismiss]  - Called when modal is closed without paying
 * @param {function} [opts.onError]    - Called on hard error
 */
export async function openRazorpay({
    amount,
    currency = "INR",
    orderId,
    name = "ShopLiveBharat",
    description = "Secure Payment",
    prefill = {},
    onSuccess,
    onDismiss,
    onError,
}) {
    const loaded = await loadScript();
    if (!loaded) {
        const err = new Error("Razorpay SDK failed to load. Check your internet connection.");
        onError?.(err);
        return;
    }

    if (!RZP_KEY) {
        const err = new Error("Razorpay key not configured. Set REACT_APP_RAZORPAY_KEY_ID.");
        console.error("[Razorpay]", err.message);
        onError?.(err);
        return;
    }

    const options = {
        key: RZP_KEY,
        amount,                    // in paise
        currency,
        name,
        description,
        image: "/shop-assets/logo/logo.svg",
        ...(orderId ? { order_id: orderId } : {}),
        prefill: {
            name:    prefill.name    || "",
            email:   prefill.email   || "",
            contact: prefill.contact || prefill.phone || "",
        },
        theme: { color: "#8B3A3A" },  // maroon brand colour
        modal: {
            ondismiss: () => onDismiss?.(),
        },
        handler: (response) => {
            // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
            onSuccess?.(response);
        },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
        onError?.(new Error(resp?.error?.description || "Payment failed"));
    });
    rzp.open();
}

/**
 * Convenience: open Razorpay for a cart checkout.
 * amount in INR (not paise) — conversion handled internally.
 */
export async function openRazorpayCheckout({ amountINR, user, description, onSuccess, onDismiss, onError }) {
    return openRazorpay({
        amount: Math.round(amountINR * 100),
        currency: "INR",
        name: "ShopLiveBharat",
        description: description || "Order Payment",
        prefill: {
            name:    user?.name  || "",
            email:   user?.email || "",
            contact: user?.phone || "",
        },
        onSuccess,
        onDismiss,
        onError,
    });
}

/**
 * Convenience: open Razorpay for live shopping session fee (₹699).
 */
export async function openRazorpayBooking({ user, storeName, onSuccess, onDismiss, onError }) {
    return openRazorpay({
        amount: 69900,   // ₹699 in paise
        currency: "INR",
        name: "ShopLiveBharat",
        description: `Live Shopping Session — ${storeName || "Store"}`,
        prefill: {
            name:    user?.name  || "",
            email:   user?.email || "",
            contact: user?.phone || "",
        },
        onSuccess,
        onDismiss,
        onError,
    });
}
