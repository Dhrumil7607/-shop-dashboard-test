/**
 * ChangePasswordCard — reusable secure password change for any logged-in user
 * (admin, seller, customer). Requires the current password and enforces a
 * strong-password policy. Talks to POST /auth/change-password.
 */
import { useMemo, useState } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/lib/api";

const RULES = [
  { test: (p) => p.length >= 8, label: "8+ characters" },
  { test: (p) => /[a-z]/.test(p), label: "lowercase" },
  { test: (p) => /[A-Z]/.test(p), label: "uppercase" },
  { test: (p) => /\d/.test(p), label: "number" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: "symbol" },
];

export default function ChangePasswordCard({ dark = false, submitFn }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checks = useMemo(() => RULES.map((r) => ({ ...r, ok: r.test(next) })), [next]);
  const allOk = checks.every((c) => c.ok);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!current) return setError("Enter your current password.");
    if (!allOk) return setError("New password does not meet all requirements.");
    if (next !== confirm) return setError("New passwords do not match.");
    setLoading(true);
    try {
      await (submitFn ? submitFn(current, next) : changePassword(current, next));
      toast.success("Password updated successfully");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      const detail = err?.response?.data?.detail || "Could not change password";
      setError(detail); toast.error(detail);
    } finally { setLoading(false); }
  };

  const label = dark ? { color: "rgba(255,255,255,0.5)" } : { color: "#8B8680" };
  const inputStyle = dark
    ? { background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", color: "white" }
    : { background: "#FAFAF9", border: "1.5px solid #E8E4DF", color: "#2C241B" };
  const heading = dark ? "#fff" : "#1a1a1a";
  const sub = dark ? "rgba(255,255,255,0.5)" : "#9B8B7A";

  const fieldRow = (lbl, val, set) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={label}>{lbl}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={val} onChange={(e) => set(e.target.value)} placeholder="••••••••"
          className="w-full py-3 pl-4 pr-11 rounded-xl outline-none text-sm" style={inputStyle} />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: sub }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl p-6" style={dark ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" } : { background: "white", border: "1px solid #E8E4DF" }}>
      <div className="flex items-center gap-2 mb-4">
        <KeyRound size={17} style={{ color: "#C9A84C" }} />
        <h3 className="font-semibold" style={{ color: heading }}>Change Password</h3>
      </div>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        {fieldRow("Current Password", current, setCurrent)}
        {fieldRow("New Password", next, setNext)}
        {fieldRow("Confirm New Password", confirm, setConfirm)}

        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {checks.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-1 text-[11px]" style={{ color: c.ok ? "#2D7A3A" : sub }}>
              <CheckCircle2 size={12} style={{ opacity: c.ok ? 1 : 0.3 }} /> {c.label}
            </span>
          ))}
        </div>

        {error && <p className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle size={12} /> {error}</p>}

        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#C9A84C", color: "#1a1a1a", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
