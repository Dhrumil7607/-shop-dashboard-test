/**
 * SellerLoginPage.jsx — /seller/login
 *
 * Completely isolated seller login. No customer navbar, no customer footer.
 * Not linked from the main site — sellers navigate here directly.
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle, Store, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function SellerLoginPage() {
  const navigate = useNavigate();
  const { loginUser, isLoggedIn, isSeller } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  // Already logged in as seller → go to portal
  useEffect(() => {
    if (isLoggedIn && isSeller) navigate("/seller/dashboard", { replace: true });
  }, [isLoggedIn, isSeller, navigate]);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await loginUser(email, password);
      // After login check role
      const userData = JSON.parse(localStorage.getItem("slb_user") || "{}");
      if (userData.role === "seller") {
        toast.success("Welcome to your Seller Portal!");
        navigate("/seller/dashboard");
      } else {
        toast.error("This account is not a seller account.");
        localStorage.removeItem("slb_token");
        localStorage.removeItem("slb_user");
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>

      {/* ── Isolated seller header ── */}
      <header className="border-b px-8 py-4 flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: "#C9A84C" }}>
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

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-3xl p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Icon + Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "linear-gradient(135deg, rgba(162,70,107,0.3), rgba(201,168,76,0.2))", border: "1px solid rgba(162,70,107,0.3)" }}>
                <Store size={28} style={{ color: "#C9A84C" }} />
              </div>
              <h1 className="font-serif text-3xl text-white mb-1" style={{ fontWeight: 400 }}>
                Seller Login
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Access your seller dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                  style={{ color: "rgba(255,255,255,0.4)" }}>
                  Email Address
                </label>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                  placeholder="seller@shoplivebharat.com"
                  className="w-full py-3.5 px-4 rounded-xl outline-none text-sm"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1.5px solid ${errors.email ? "#ef4444" : "rgba(255,255,255,0.12)"}`,
                    color: "white",
                  }} />
                {errors.email && (
                  <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                  style={{ color: "rgba(255,255,255,0.4)" }}>
                  Password
                </label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                    placeholder="••••••••"
                    className="w-full py-3.5 pl-4 pr-11 rounded-xl outline-none text-sm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1.5px solid ${errors.password ? "#ef4444" : "rgba(255,255,255,0.12)"}`,
                      color: "white",
                    }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                    <AlertCircle size={12} /> {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2.5 mt-2"
                style={{ background: "linear-gradient(135deg, #A2466B, #C9A84C)", color: "white", opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>Enter Seller Portal <ArrowRight size={16} strokeWidth={2.5} /></>
                )}
              </motion.button>
            </form>

            {/* Not a seller? */}
            <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Want to sell on ShopLive Bharat?{" "}
              <a href="/become-a-seller"
                className="font-semibold hover:underline" style={{ color: "#C9A84C" }}>
                Apply here
              </a>
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Minimal footer ── */}
      <footer className="text-center py-5 text-[11px]"
        style={{ color: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        © {new Date().getFullYear()} ShopLiveBharat · Seller Portal ·{" "}
        <a href="/privacy" className="hover:underline" style={{ color: "rgba(255,255,255,0.35)" }}>Privacy</a>
      </footer>
    </div>
  );
}
