/**
 * ResetPassword.jsx — /reset-password?token=...
 * Lands here from the password-reset email link.
 */
import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";

const RULES = [
  { test: (p) => p.length >= 8, label: "At least 8 characters" },
  { test: (p) => /[a-z]/.test(p), label: "A lowercase letter" },
  { test: (p) => /[A-Z]/.test(p), label: "An uppercase letter" },
  { test: (p) => /\d/.test(p), label: "A number" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: "A special character" },
];

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const checks = useMemo(() => RULES.map(r => ({ ...r, ok: r.test(pw) })), [pw]);
  const allOk = checks.every(c => c.ok);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) { setError("Missing or invalid reset link."); return; }
    if (!allOk) { setError("Password does not meet all requirements."); return; }
    if (pw !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { resetPassword } = await import("@/lib/api");
      await resetPassword(token, pw);
      setDone(true);
      toast.success("Password reset! You can now log in.");
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketplaceLayout hideFooter>
      <div className="flex items-center justify-center py-12 px-4" style={{ backgroundColor: "#EDE8E0", minHeight: "calc(100vh - 64px)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }} className="w-full max-w-[440px]">
          <div className="rounded-3xl p-8 md:p-10" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(22px)", boxShadow: "0 16px 48px rgba(44,36,27,0.13)", border: "1px solid rgba(255,255,255,0.65)" }}>
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-1.5 mb-5">
                <span className="font-bold text-sm" style={{ color: "#C9A84C" }}>ShopLive</span>
                <span className="font-bold text-sm" style={{ color: "#2C241B" }}>Bharat</span>
              </div>
              {done ? (
                <>
                  <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: "rgba(45,122,58,0.12)" }}>
                    <CheckCircle2 size={32} style={{ color: "#2D7A3A" }} />
                  </div>
                  <h1 className="font-serif text-2xl mb-2" style={{ color: "#2C241B" }}>Password Reset</h1>
                  <p className="text-sm" style={{ color: "#8B8680" }}>Redirecting you to login…</p>
                </>
              ) : (
                <>
                  <h1 className="font-serif text-2xl md:text-3xl mb-2" style={{ color: "#2C241B" }}>Choose a New Password</h1>
                  <p className="text-sm" style={{ color: "#8B8680" }}>Create a strong password for your account</p>
                </>
              )}
            </div>

            {!done && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <PwInput label="New Password" value={pw} onChange={setPw} show={show} setShow={setShow} />
                <PwInput label="Confirm Password" value={confirm} onChange={setConfirm} show={show} setShow={setShow} />

                {/* Strength checklist */}
                <ul className="space-y-1">
                  {checks.map((c) => (
                    <li key={c.label} className="flex items-center gap-2 text-xs" style={{ color: c.ok ? "#2D7A3A" : "#9B8B7A" }}>
                      <CheckCircle2 size={13} style={{ opacity: c.ok ? 1 : 0.3 }} /> {c.label}
                    </li>
                  ))}
                </ul>

                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle size={12} /> {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2.5"
                  style={{ background: "#A2466B", color: "#FFF8F0", opacity: loading ? 0.7 : 1 }}>
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    : <>Reset Password <ArrowRight size={16} strokeWidth={2.5} /></>}
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

function PwInput({ label, value, onChange, show, setShow }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: "#8B8680" }}>{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder="••••••••"
          className="w-full py-3.5 pl-4 pr-11 rounded-xl outline-none text-sm" style={{ border: "1.5px solid #E8E4DF", background: "#FAFAF9", color: "#2C241B" }} />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#C9A4B0" }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <Lock size={14} className="absolute left-[-999px]" aria-hidden />
      </div>
    </div>
  );
}
