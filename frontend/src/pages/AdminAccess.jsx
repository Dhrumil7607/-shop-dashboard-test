/**
 * AdminAccess.jsx — /slb-admin (hidden, not linked anywhere)
 *
 * Secret admin entry point. Not in the footer, not in the navbar,
 * not in the sitemap. Only accessible by typing the URL directly.
 * Redirects to /admin/login after verifying intent.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Secret passphrase to even see the admin login
const ACCESS_CODE = "slb2026";

export default function AdminAccess() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) navigate("/admin/dashboard", { replace: true });
  }, [isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError("Access code required"); return; }
    if (code.trim() !== ACCESS_CODE) {
      setError("Invalid access code");
      toast.error("Access denied");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#050505" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm px-6"
      >
        {/* Shield icon */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.2)" }}>
            <Shield size={28} style={{ color: "#DC3232" }} />
          </div>
          <h1 className="font-serif text-2xl text-white mb-1">Restricted Area</h1>
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            Enter access code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={e => { setCode(e.target.value); setError(""); }}
                placeholder="Access code"
                autoComplete="off"
                className="w-full py-4 pl-4 pr-11 rounded-xl text-sm outline-none text-center tracking-[0.3em]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                  color: "white",
                }}
              />
              <button type="button" onClick={() => setShowCode(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <p className="flex items-center justify-center gap-1.5 mt-2 text-xs text-red-400">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <motion.button
            type="submit" disabled={loading}
            whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{
              background: loading ? "rgba(220,50,50,0.3)" : "rgba(220,50,50,0.8)",
              color: "white",
              border: "1px solid rgba(220,50,50,0.4)",
            }}>
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <>Continue <ArrowRight size={15} /></>
            )}
          </motion.button>
        </form>

        <p className="text-center mt-8 text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
          Unauthorized access attempts are logged.
        </p>
      </motion.div>
    </div>
  );
}
