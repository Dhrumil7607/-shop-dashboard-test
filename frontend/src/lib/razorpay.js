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

import { toast } from "sonner";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";

// Visible step indicator (one updating toast) so we can SEE exactly where the
// flow stops without digging through console noise.
const PAY_TOAST = "pay-status";
function step(msg, kind = "loading") {
  console.info("[pay]", msg);
  try {
    if (kind === "loading") toast.loading(msg, { id: PAY_TOAST });
    else if (kind === "success") toast.success(msg, { id: PAY_TOAST });
    else if (kind === "error") toast.error(msg, { id: PAY_TOAST });
    else if (kind === "dismiss") toast.dismiss(PAY_TOAST);
  } catch { /* toast optional */ }
}

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
  step("1/4 Loading payment library…");
  const loaded = await loadScript();
  if (!loaded) { step("Razorpay failed to load. Check your connection.", "error"); throw new Error("Razorpay failed to load. Check your connection."); }
  if (!window.Razorpay) { step("Razorpay SDK unavailable.", "error"); throw new Error("Razorpay SDK unavailable."); }

  // 1. Create the order on the backend
  step("2/4 Creating payment order…");
  let order;
  try {
    order = await createRazorpayOrder(amount, currency);
  } catch (e) {
    console.error("[pay] order creation failed", e);
    step("Could not start payment. Please try again.", "error");
    throw new Error(e?.response?.data?.detail || "Could not start payment. Please try again.");
  }
  console.info("[pay] order created", order);
  if (!order?.id || !order?.key_id) {
    step("Payment gateway is not configured.", "error");
    throw new Error("Payment gateway is not configured. Please contact support.");
  }

  // Absolute logo URL (a relative path resolves against api.razorpay.com and 404s).
  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/shop-assets/logo/logo.svg`
      : undefined;

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
        image: logoUrl,
        prefill: {
          name: prefill.name || "",
          email: prefill.email || "",
          contact: prefill.contact || prefill.phone || "",
        },
        notes,
        theme: { color: "#8B3A3A" },
        // Disable Razorpay's internal retry so a failed method can't spin forever.
        retry: { enabled: false },
        // Auto-close the modal after 10 minutes if abandoned (prevents a stuck UI).
        timeout: 600,
        modal: {
          escape: true,
          ondismiss: () => {
            step("Payment cancelled.", "dismiss");
            reject({ dismissed: true });
          },
        },
        handler: (resp) => {
          step("Payment received — saving your order…", "loading");
          resolve(resp);
        },
      };
      step("3/4 Opening Razorpay checkout…");
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (r) => {
        console.error("[pay] payment.failed", r?.error);
        step(r?.error?.description || "Payment failed. Please try again.", "error");
        reject(new Error(r?.error?.description || "Payment failed. Please try again."));
      });
      rzp.open();
      step("4/4 Payment window open — complete payment");

      // Ensure the Razorpay modal sits above any parent stacking context.
      // IMPORTANT: never move the container in the DOM (e.g. body.appendChild).
      // Re-parenting the element forces its internal <iframe> to RELOAD, which
      // restarts Razorpay's checkout over and over — an endless loop / perpetual
      // spinner. We only adjust z-index and pointer-events in place, which does
      // NOT reload the iframe.
      const liftModal = () => {
        const el = document.querySelector(".razorpay-container");
        if (el) {
          el.style.setProperty("z-index", "2147483647", "important");
          el.style.setProperty("pointer-events", "auto", "important");
        }
      };
      // Run once shortly after Razorpay injects its DOM (no reparenting, no loop).
      setTimeout(liftModal, 300);
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
    step("Payment verified", "dismiss");
    return { ...rzpResponse, verified: true };
  } catch {
    step("Payment verified", "dismiss");
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
