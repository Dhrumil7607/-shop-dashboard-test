/**
 * razorpay.js — Razorpay payment integration
 *
 * Opens the Razorpay checkout modal and returns a Promise that resolves
 * on success or rejects on failure/dismiss.
 *
 * Usage:
 *   import { openRazorpay } from "@/lib/razorpay";
 *   try {
 *     const response = await openRazorpay({ amount: 69900, ... });
 *     // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 *   } catch (err) {
 *     if (err.dismissed) { // user closed modal } else { // payment failed }
 *   }
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
 * Open Razorpay modal — returns a Promise.
 * Resolves with payment response on success.
 * Rejects with { dismissed: true } if user closes modal.
 * Rejects with Error on payment failure or SDK load failure.
 */
export function openRazorpay({ amount, currency = "INR", orderId, name = "ShopLiveBharat", description = "Secure Payment", prefill = {} }) {
    return new Promise(async (resolve, reject) => {
        const loaded = await loadScript();
        if (!loaded) {
            return reject(new Error("Razorpay SDK failed to load. Check your internet connection."));
        }
        if (!RZP_KEY) {
            return reject(new Error("Razorpay key not configured. Set REACT_APP_RAZORPAY_KEY_ID."));
        }

        const options = {
            key: RZP_KEY,
            amount,
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
            theme: { color: "#8B3A3A" },
            modal: {
                ondismiss: () => reject({ dismissed: true }),
            },
            handler: (response) => resolve(response),
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) => {
            reject(new Error(resp?.error?.description || "Payment failed."));
        });
        rzp.open();
    });
}

/**
 * Open Razorpay for cart checkout.
 * amountINR in rupees (not paise).
 */
export function openRazorpayCheckout({ amountINR, user, description }) {
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
    });
}

/**
 * Open Razorpay for live shopping session fee (₹699).
 */
export function openRazorpayBooking({ user, storeName }) {
    return openRazorpay({
        amount: 69900,
        currency: "INR",
        name: "ShopLiveBharat",
        description: `Live Shopping Session — ${storeName || "Store"}`,
        prefill: {
            name:    user?.name  || "",
            email:   user?.email || "",
            contact: user?.phone || "",
        },
    });
}
