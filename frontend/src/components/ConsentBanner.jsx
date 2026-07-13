/**
 * ConsentBanner.jsx
 * DPDP Act 2023 (India) + cookie consent banner. Shows once until the user
 * accepts or declines; the choice is stored in localStorage. Declining disables
 * non-essential analytics (PostHog opt-out).
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const KEY = "slb_consent_v1";

export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch { /* storage blocked — don't show */ }
  }, []);

  const decide = (value) => {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    // Respect a decline by opting out of analytics if PostHog is present.
    if (value === "declined" && typeof window !== "undefined" && window.posthog?.opt_out_capturing) {
      try { window.posthog.opt_out_capturing(); } catch { /* ignore */ }
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Privacy and cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 pointer-events-none"
    >
      <div
        className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border bg-white/95 backdrop-blur-md shadow-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5"
        style={{ borderColor: "#E8E4DF" }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "#3a2f26" }}>
          We use cookies and similar technologies to run the store, remember your cart, and
          understand how the site is used. Under India's Digital Personal Data Protection Act,
          we ask for your consent to non-essential analytics. Read our{" "}
          <Link to="/privacy" className="underline" style={{ color: "#8B3A3A" }}>Privacy Policy</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => decide("declined")}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition"
            style={{ borderColor: "#E8E4DF", color: "#6B5E52", background: "white" }}
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition"
            style={{ background: "linear-gradient(135deg, #C9A84C, #8B3A3A)" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
