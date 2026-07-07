/**
 * razorpay.js — Razorpay Checkout integration (Promise-based)
 *
 * openRazorpay() loads the checkout script on demand and opens the modal.
 * Resolves with the payment response on success.
 * Rejects with { dismissed: true } if the user closes the modal,
 * or with an Error on payment failure / SDK load failure.
 *
 * Key is read from REACT_APP_RAZORPAY_KEY_ID.
 */

const RZP_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID || "";

/** Load Razorpay checkout.js once (idempotent) */
function loadScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Open the Razorpay payment modal.
 * @returns Promise<{razorpay_payment_id, razorpay_order_id, razorpay_signature}>
 */
export function openRazorpay({
  amount,               // in paise
  currency = "INR",
  name = "ShopLiveBharat",
  description = "Secure Payment",
  orderId,              // optional backend order_id
  prefill = {},
  notes = {},
}) {
  return new Promise(async (resolve, reject) => {
    const loaded = await loadScript();
    if (!loaded) return reject(new Error("Razorpay failed to load. Check your connection."));
    if (!RZP_KEY) return reject(new Error("Razorpay key not configured (REACT_APP_RAZORPAY_KEY_ID)."));

    const options = {
      key: RZP_KEY,
      amount,
      currency,
      name,
      description,
      image: "/shop-assets/logo/logo.svg",
      ...(orderId ? { order_id: orderId } : {}),
      prefill: {
        name: prefill.name || "",
        email: prefill.email || "",
        contact: prefill.contact || prefill.phone || "",
      },
      notes,
      theme: { color: "#8B3A3A" },
      modal: { ondismiss: () => reject({ dismissed: true }) },
      handler: (resp) => resolve(resp),
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (r) =>
      reject(new Error(r?.error?.description || "Payment failed. Please try again."))
    );
    rzp.open();
  });
}

/** Cart checkout — amountINR in rupees */
export function openRazorpayCheckout({ amountINR, user, description }) {
  return openRazorpay({
    amount: Math.round(Number(amountINR) * 100),
    currency: "INR",
    description: description || "Order Payment",
    prefill: { name: user?.name, email: user?.email, contact: user?.phone },
  });
}

/** Live shopping session fee — ₹699 */
export function openRazorpayBooking({ user, storeName }) {
  return openRazorpay({
    amount: 69900,
    currency: "INR",
    description: `Live Shopping Session — ${storeName || "Store"}`,
    prefill: { name: user?.name, email: user?.email, contact: user?.phone },
  });
}

export function getRazorpayConfig() {
  return { keyId: RZP_KEY, merchantName: "ShopLiveBharat" };
}
