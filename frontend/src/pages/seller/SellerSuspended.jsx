/**
 * SellerSuspended.jsx — /seller/suspended
 *
 * Shown when a seller's account has been suspended, archived, or deleted.
 * Sellers land here on login (403) or when an active session is revoked.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, Mail, ExternalLink } from "lucide-react";

const SUPPORT_EMAIL = "support@shoplivebharat.com";

export default function SellerSuspended() {
  // Ensure any stale seller session is cleared while on this page.
  useEffect(() => {
    try {
      localStorage.removeItem("slb_token");
      localStorage.removeItem("slb_user");
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Header */}
      <header className="border-b px-8 py-4 flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "#C9A84C" }}>
            <span className="font-serif font-bold text-xs" style={{ color: "#C9A84C" }}>S</span>
          </div>
          <div className="leading-none">
            <span className="font-bold text-sm text-white">ShopLive</span>
            <span className="font-bold text-sm" style={{ color: "#C9A84C" }}>Bharat</span>
          </div>
          <span className="ml-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ backgroundColor: "rgba(162,70,107,0.3)", color: "#E8A4C0" }}>
            Seller Portal
          </span>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs transition hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.45)" }}>
          Visit Store <ExternalLink size={12} />
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md rounded-3xl p-8 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(192,57,43,0.18)", border: "1px solid rgba(192,57,43,0.4)" }}>
            <ShieldAlert size={30} style={{ color: "#F1948A" }} />
          </div>

          <h1 className="font-serif text-3xl text-white mb-2" style={{ fontWeight: 400 }}>
            Account Not Active
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            Your seller account has been suspended or removed, so the Seller Portal is
            currently unavailable. If you believe this is a mistake, please contact our
            support team and we'll help resolve it.
          </p>

          <a href={`mailto:${SUPPORT_EMAIL}?subject=Seller%20account%20support`}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm mb-3"
            style={{ background: "linear-gradient(135deg, #A2466B, #C9A84C)", color: "white" }}>
            <Mail size={16} /> Contact Support
          </a>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            or email us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold hover:underline" style={{ color: "#C9A84C" }}>
              {SUPPORT_EMAIL}
            </a>
          </p>

          <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Link to="/seller/login" className="text-xs hover:underline" style={{ color: "rgba(255,255,255,0.45)" }}>
              ← Back to Seller Login
            </Link>
          </div>
        </motion.div>
      </div>

      <footer className="text-center py-5 text-[11px]"
        style={{ color: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        © {new Date().getFullYear()} ShopLiveBharat · Seller Portal
      </footer>
    </div>
  );
}
