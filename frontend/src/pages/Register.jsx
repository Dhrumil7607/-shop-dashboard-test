import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, AlertCircle, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import BrandLogo from "@/components/BrandLogo";

const IMAGE_URL =
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=85";

function getStrength(pwd) {
    let s = 0;
    if (pwd.length >= 8)           s++;
    if (/[A-Z]/.test(pwd))         s++;
    if (/[a-z]/.test(pwd))         s++;
    if (/[0-9]/.test(pwd))         s++;
    if (/[^A-Za-z0-9]/.test(pwd))  s++;
    return s;
}
const STRENGTH_LABEL = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
const STRENGTH_COLOR = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

export default function Register() {
    const navigate = useNavigate();
    const { registerUser, loginWithGoogle } = useAuth();

    const handleGoogle = async (credential) => {
        setLoading(true);
        try {
            await loginWithGoogle(credential);
            toast.success("Welcome! 🎉");
            navigate("/account");
        } catch (err) {
            toast.error(err?.response?.data?.detail || err.message || "Google sign-up failed");
        } finally {
            setLoading(false);
        }
    };

    const [name,            setName]            = useState("");
    const [email,           setEmail]           = useState("");
    const [password,        setPassword]        = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass,        setShowPass]        = useState(false);
    const [showConfirm,     setShowConfirm]     = useState(false);
    const [loading,         setLoading]         = useState(false);
    const [error,           setError]           = useState("");

    const strength = getStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (!name || !email || !password || !confirmPassword)
                throw new Error("Please fill in all fields");
            if (name.length < 2)
                throw new Error("Name must be at least 2 characters");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                throw new Error("Enter a valid email address");
            if (password.length < 8)
                throw new Error("Password must be at least 8 characters");
            if (password !== confirmPassword)
                throw new Error("Passwords do not match");
            await registerUser(name, email, password);
            toast.success("Account created! Welcome to ShopLiveBharat 🎉");
            navigate("/");
        } catch (err) {
            const msg = err.message || "Registration failed. Please try again.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const focusStyle = (e) => {
        e.target.style.borderColor = "#A2466B";
        e.target.style.boxShadow   = "0 0 0 3px rgba(162,70,107,0.09)";
    };
    const blurStyle = (e, hasErr) => {
        e.target.style.borderColor = hasErr ? "#ef4444" : "#E8E4DF";
        e.target.style.boxShadow   = "none";
    };

    return (
        <MarketplaceLayout>
            <div
                className="flex items-center justify-center py-8 px-4"
                style={{ backgroundColor: "#EDE8E0", minHeight: "calc(100vh - 64px)" }}
            >
                <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">

                    {/* ── LEFT: Image Card ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
                        className="hidden lg:block flex-shrink-0 w-[300px]"
                    >
                        <div
                            className="relative rounded-[2.2rem] overflow-hidden shadow-2xl"
                            style={{ height: 560 }}
                        >
                            <img
                                src={IMAGE_URL}
                                alt="Indian fashion"
                                className="w-full h-full object-cover object-center"
                                loading="eager"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                            <motion.div
                                animate={{ y: [0, -7, 0] }}
                                transition={{ delay: 0.6, duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute bottom-6 left-5 right-5 rounded-2xl p-4"
                                style={{
                                    background: "rgba(255,255,255,0.92)",
                                    backdropFilter: "blur(14px)",
                                    WebkitBackdropFilter: "blur(14px)",
                                }}
                            >
                                <p className="text-[10px] font-bold uppercase tracking-[0.26em] mb-1"
                                    style={{ color: "#C9A84C" }}>
                                    ShopLiveBharat
                                </p>
                                <p className="font-serif text-sm font-semibold" style={{ color: "#2C241B" }}>
                                    Join Our Community
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "#8B8680" }}>
                                    Discover Authentic Indian Fashion
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* ── RIGHT: Form Card ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.65, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full max-w-[430px]"
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
                            {/* Brand + Title */}
                            <div className="text-center mb-7">
                                <div className="inline-flex items-center justify-center mb-4">
                                    <BrandLogo height={56} />
                                </div>
                                <h1 className="font-serif leading-none mb-2" style={{ fontSize: "clamp(1.75rem, 5vw, 2.2rem)", color: "#2C241B" }}>
                                    Create{" "}
                                    <span style={{ fontStyle: "italic", color: "#A2466B" }}>Account</span>
                                </h1>
                                <p className="text-sm" style={{ color: "#8B8680" }}>
                                    Join thousands shopping authentic Indian fashion
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Global error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 p-3 rounded-xl text-xs text-red-700 bg-red-50 border border-red-200"
                                        >
                                            <AlertCircle size={13} className="flex-shrink-0" /> {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Full Name */}
                                <div>
                                    <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                                        style={{ color: "#8B8680" }}>Full Name</label>
                                    <input
                                        id="name"
                                        type="text" value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your full name"
                                        className="w-full py-3.5 px-4 rounded-xl outline-none text-sm"
                                        style={{ border: "1.5px solid #E8E4DF", background: "#FAFAF9", color: "#2C241B", transition: "border-color 0.2s, box-shadow 0.2s" }}
                                        onFocus={focusStyle} onBlur={(e) => blurStyle(e, false)}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                                        style={{ color: "#8B8680" }}>Email Address</label>
                                    <input
                                        id="email"
                                        type="email" value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full py-3.5 px-4 rounded-xl outline-none text-sm"
                                        style={{ border: "1.5px solid #E8E4DF", background: "#FAFAF9", color: "#2C241B", transition: "border-color 0.2s, box-shadow 0.2s" }}
                                        onFocus={focusStyle} onBlur={(e) => blurStyle(e, false)}
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                                        style={{ color: "#8B8680" }}>Password</label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPass ? "text" : "password"} value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            className="w-full py-3.5 pl-4 pr-11 rounded-xl outline-none text-sm"
                                            style={{ border: "1.5px solid #E8E4DF", background: "#FAFAF9", color: "#2C241B", transition: "border-color 0.2s, box-shadow 0.2s" }}
                                            onFocus={focusStyle} onBlur={(e) => blurStyle(e, false)}
                                        />
                                        <button type="button" onClick={() => setShowPass((v) => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                            style={{ color: "#C9A4B0" }} aria-label="Toggle password">
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {password && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex flex-1 gap-1">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <motion.div key={i} className="h-1 flex-1 rounded-full"
                                                        animate={{ backgroundColor: i <= strength ? (STRENGTH_COLOR[strength - 1] || "#E8E4DF") : "#E8E4DF" }}
                                                        transition={{ duration: 0.3 }} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-semibold w-20 text-right"
                                                style={{ color: STRENGTH_COLOR[strength - 1] || "#8B8680" }}>
                                                {STRENGTH_LABEL[strength - 1] || ""}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                                        style={{ color: "#8B8680" }}>Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirm ? "text" : "password"} value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full py-3.5 pl-4 pr-16 rounded-xl outline-none text-sm"
                                            style={{
                                                border: `1.5px solid ${confirmPassword && password !== confirmPassword ? "#ef4444" : "#E8E4DF"}`,
                                                background: "#FAFAF9", color: "#2C241B",
                                                transition: "border-color 0.2s, box-shadow 0.2s",
                                            }}
                                            onFocus={focusStyle}
                                            onBlur={(e) => blurStyle(e, confirmPassword && password !== confirmPassword)}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            {confirmPassword && (
                                                password === confirmPassword
                                                    ? <Check size={14} className="text-green-500" />
                                                    : <X size={14} className="text-red-400" />
                                            )}
                                            <button type="button" onClick={() => setShowConfirm((v) => !v)}
                                                style={{ color: "#C9A4B0" }} aria-label="Toggle confirm">
                                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <motion.button
                                    type="submit" disabled={loading}
                                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }}
                                    className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2.5 mt-1"
                                    style={{ background: "#A2466B", color: "#FFF8F0" }}
                                >
                                    {loading ? (
                                        <motion.div animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                    ) : (
                                        <>Create Account <ArrowRight size={16} strokeWidth={2.5} /></>
                                    )}
                                </motion.button>

                                {/* OR divider */}
                                <div className="relative my-1" style={{ height: 1, background: "#E8E4DF" }}>
                                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-xs"
                                        style={{ background: "rgba(255,255,255,0.88)", color: "#8B8680" }}>
                                        or
                                    </span>
                                </div>

                                {/* Google sign-up */}
                                <div className="flex justify-center">
                                    <GoogleSignInButton onCredential={handleGoogle} text="signup_with" />
                                </div>

                                {/* Divider */}
                                <div className="relative my-1" style={{ height: 1, background: "#E8E4DF" }}>
                                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-xs"
                                        style={{ background: "rgba(255,255,255,0.88)", color: "#8B8680" }}>
                                        Already have an account?
                                    </span>
                                </div>

                                <Link to="/login" className="block">
                                    <motion.div
                                        whileHover={{ background: "#F5F1ED" }} whileTap={{ scale: 0.975 }}
                                        className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-center"
                                        style={{ border: "1.5px solid #E8E4DF", color: "#2C241B", background: "transparent" }}
                                    >
                                        Sign In Instead
                                    </motion.div>
                                </Link>
                            </form>

                            <p className="text-center mt-6 text-xs" style={{ color: "#8B8680" }}>
                                <Link to="/" className="hover:underline">← Back to Home</Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
