/**
 * ForgotPassword.jsx — Password reset request page
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";

export default function ForgotPassword() {
  const [email, setEmail]   = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  const validate = () => {
    if (!email.trim()) { setError("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email"); return false; }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { forgotPassword } = await import("@/lib/api");
      await forgotPassword(email.trim());
      setSent(true);
      toast.success("If an account exists, a reset link has been sent.");
    } catch {
      // Still show the neutral success state (don't reveal if the email exists)
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketplaceLayout hideFooter>
      <div
        className="flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: "#EDE8E0", minHeight: "calc(100vh - 64px)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-[420px]"
        >
          <div
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              boxShadow: "0 16px 48px rgba(44,36,27,0.13)",
              border: "1px solid rgba(255,255,255,0.65)",
            }}
          >
            {/* Brand */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 mb-5">
                <span className="font-bold text-sm" style={{ color: "#C9A84C" }}>ShopLive</span>
                <span className="font-bold text-sm" style={{ color: "#2C241B" }}>Bharat</span>
              </div>

              {sent ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                    style={{ backgroundColor: "rgba(162,70,107,0.1)" }}
                  >
                    <CheckCircle2 size={32} style={{ color: "#A2466B" }} />
                  </motion.div>
                  <h1 className="font-serif text-2xl mb-2" style={{ color: "#2C241B" }}>Check your inbox</h1>
                  <p className="text-sm" style={{ color: "#8B8680" }}>
                    We've sent a reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs mt-2" style={{ color: "#9B8B7A" }}>
                    Didn't receive it? Check spam or{" "}
                    <button onClick={() => setSent(false)} className="underline font-medium" style={{ color: "#A2466B" }}>
                      try again
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-serif text-2xl md:text-3xl mb-2" style={{ color: "#2C241B" }}>
                    Reset Password
                  </h1>
                  <p className="text-sm" style={{ color: "#8B8680" }}>
                    Enter your email and we'll send you a reset link
                  </p>
                </>
              )}
            </div>

            {!sent && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fp-email" className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                    style={{ color: "#8B8680" }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com"
                      className="w-full py-3.5 pl-4 pr-11 rounded-xl outline-none text-sm"
                      style={{
                        border: `1.5px solid ${error ? "#ef4444" : "#E8E4DF"}`,
                        background: "#FAFAF9",
                        color: "#2C241B",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onFocus={e => { e.target.style.borderColor = "#A2466B"; e.target.style.boxShadow = "0 0 0 3px rgba(162,70,107,0.09)"; }}
                      onBlur={e => { e.target.style.borderColor = error ? "#ef4444" : "#E8E4DF"; e.target.style.boxShadow = "none"; }}
                    />
                    <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#C9A4B0" }} />
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
                        <AlertCircle size={12} /> {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.975 }}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2.5"
                  style={{ background: "#A2466B", color: "#FFF8F0" }}
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>Send Reset Link <ArrowRight size={16} strokeWidth={2.5} /></>
                  )}
                </motion.button>
              </form>
            )}

            <p className="text-center mt-6 text-xs" style={{ color: "#8B8680" }}>
              <Link to="/login" className="inline-flex items-center gap-1 hover:underline" style={{ color: "#A2466B" }}>
                <ArrowLeft size={12} /> Back to Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </MarketplaceLayout>
  );
}
