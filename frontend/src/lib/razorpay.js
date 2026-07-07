/**
 * razorpay.js — Razorpay Checkout with server-side order creation.
 *
 * Flow:
 *  1. Ask backend to create a Razorpay Order (returns order_id + key_id).
 *  2. Open Razorpay checkout with that order_id.
 *  3. On success, verify the signature on the backend.
 *
 * The key_id comes from the backend so there's no frontend env mismatch.
 * The key_secret NEVER touches the frontend.
 */

import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";

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
 * Open Razorpay with a server-created order.
 * @returns Promise<{razorpay_payment_id, razorpay_order_id, razorpay_signature, verified}>
 */
export async function openRazorpay({
  amount,               // in paise
  currency = "INR",
  name = "ShopLiveBharat",
  description = "Secure Payment",
  prefill = {},
  notes = {},
}) {
  const loaded = await loadScript();
  if (!loaded) throw new Error("Razorpay failed to load. Check your connection.");
  if (!window.Razorpay) throw new Error("Razorpay SDK unavailable.");

  // 1. Create the order on the backend
  let order;
  try {
    order = await createRazorpayOrder(amount, currency);
  } catch (e) {
    throw new Error(e?.response?.data?.detail || "Could not start payment. Please try again.");
  }
  if (!order?.id || !order?.key_id) {
    throw new Error("Payment gateway is not configured. Please contact support.");
  }

  // 2. Open checkout with the order_id
  const rzpResponse = await new Promise((resolve, reject) => {
    try {
      const options = {
        key: order.key_id,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name,
        description,
        image: "/shop-assets/logo/logo.svg",
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

      // Force the Razorpay modal to be visible & on top — bypasses any
      // stacking-context / overflow issues from parent layouts.
      const forceVisible = () => {
        const el = document.querySelector(".razorpay-container");
        if (el) {
          // Move to be a direct child of body so no transformed ancestor traps it
          if (el.parentElement !== document.body) {
            document.body.appendChild(el);
          }
          el.style.setProperty("z-index", "2147483647", "important");
          el.style.setProperty("position", "fixed", "important");
          el.style.setProperty("inset", "0", "important");
          el.style.setProperty("display", "block", "important");
          el.style.setProperty("visibility", "visible", "important");
          el.style.setProperty("opacity", "1", "important");
        }
        // Release any scroll-lock a previous modal may have left on body
        document.body.style.removeProperty("overflow");
        document.documentElement.style.removeProperty("overflow");
      };
      // Run a few times as Razorpay injects the DOM asynchronously
      [100, 400, 900, 1600].forEach((t) => setTimeout(forceVisible, t));
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Could not open payment window."));
    }
  });

  // 3. Verify signature on the backend (non-blocking failure → still return)
  try {
    await verifyRazorpayPayment({
      razorpay_order_id: rzpResponse.razorpay_order_id,
      razorpay_payment_id: rzpResponse.razorpay_payment_id,
      razorpay_signature: rzpResponse.razorpay_signature,
    });
    return { ...rzpResponse, verified: true };
  } catch {
    return { ...rzpResponse, verified: false };
  }
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
