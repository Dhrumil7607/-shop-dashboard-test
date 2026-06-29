import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";

const IMAGE_URL =
    "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=85";

export default function Login() {
    const navigate = useNavigate();
    const { loginUser, isLoggedIn } = useAuth();

    const [email, setEmail]               = useState("");
    const [password, setPassword]         = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading]           = useState(false);
    const [errors, setErrors]             = useState({});
    const [attempts, setAttempts]         = useState(0);

    useEffect(() => {
        if (isLoggedIn) navigate("/account");
    }, [isLoggedIn, navigate]);

    const validate = () => {
        const e = {};
        if (!email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            e.email = "Enter a valid email";
        if (!password) e.password = "Password is required";
        else if (password.length < 6) e.password = "Minimum 6 characters";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        if (attempts >= 5) {
            toast.error("Too many attempts. Try again later.");
            return;
        }
        setLoading(true);
        try {
            await loginUser(email, password);
            setAttempts(0);
            toast.success("Welcome back! 🎉");
            navigate("/account");
        } catch (err) {
            setAttempts((p) => p + 1);
            toast.error(err.message || "Login failed. Please try again.");
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
        <MarketplaceLayout hideFooter>
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
                            style={{ height: 480 }}
                        >
                            <img
                                src={IMAGE_URL}
                                alt="Indian fashion"
                                className="w-full h-full object-cover object-center"
                                loading="eager"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                            {/* Floating badge */}
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
                                <p
                                    className="text-[10px] font-bold uppercase tracking-[0.26em] mb-1"
                                    style={{ color: "#C9A84C" }}
                                >
                                    ShopLiveBharat
                                </p>
                                <p className="font-serif text-sm font-semibold" style={{ color: "#2C241B" }}>
                                    Authentic Indian Fashion
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "#8B8680" }}>
                                    From India to Your Doorstep
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
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-1.5 mb-5">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                        stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                                        <line x1="3" y1="6" x2="21" y2="6"/>
                                        <path d="M16 10a4 4 0 01-8 0"/>
                                    </svg>
                                    <span className="font-bold text-sm" style={{ color: "#C9A84C" }}>ShopLive</span>
                                    <span className="font-bold text-sm" style={{ color: "#2C241B" }}>Bharat</span>
                                </div>
                                <h1 className="font-serif leading-none mb-2" style={{ fontSize: "clamp(1.75rem, 5vw, 2.35rem)", color: "#2C241B" }}>
                                    Welcome{" "}
                                    <span style={{ fontStyle: "italic", color: "#A2466B" }}>Back</span>
                                </h1>
                                <p className="text-sm" style={{ color: "#8B8680" }}>
                                    Sign in to continue shopping authentic Indian fashion
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                                        style={{ color: "#8B8680" }}>
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                                            }}
                                            placeholder="you@example.com"
                                            className="w-full py-3.5 pl-4 pr-11 rounded-xl outline-none text-sm"
                                            style={{
                                                border: `1.5px solid ${errors.email ? "#ef4444" : "#E8E4DF"}`,
                                                background: "#FAFAF9",
                                                color: "#2C241B",
                                                transition: "border-color 0.2s, box-shadow 0.2s",
                                            }}
                                            onFocus={focusStyle}
                                            onBlur={(e) => blurStyle(e, !!errors.email)}
                                        />
                                        <Mail size={16}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                            style={{ color: "#C9A4B0" }} />
                                    </div>
                                    <AnimatePresence>
                                        {errors.email && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600"
                                            >
                                                <AlertCircle size={12} /> {errors.email}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                                        style={{ color: "#8B8680" }}>
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                                            }}
                                            placeholder="••••••••"
                                            className="w-full py-3.5 pl-4 pr-11 rounded-xl outline-none text-sm"
                                            style={{
                                                border: `1.5px solid ${errors.password ? "#ef4444" : "#E8E4DF"}`,
                                                background: "#FAFAF9",
                                                color: "#2C241B",
                                                transition: "border-color 0.2s, box-shadow 0.2s",
                                            }}
                                            onFocus={focusStyle}
                                            onBlur={(e) => blurStyle(e, !!errors.password)}
                                        />
                                        <button type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                            style={{ color: "#C9A4B0" }}
                                            aria-label="Toggle password">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {errors.password && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600"
                                            >
                                                <AlertCircle size={12} /> {errors.password}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Forgot password */}
                                <div className="flex justify-end">
                                    <Link to="#" className="text-xs font-semibold hover:underline"
                                        style={{ color: "#A2466B" }}>
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* Rate limit warning */}
                                <AnimatePresence>
                                    {attempts >= 3 && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 p-3 rounded-xl text-xs text-red-700 bg-red-50 border border-red-200"
                                        >
                                            <AlertCircle size={13} className="flex-shrink-0" />
                                            {5 - attempts} attempts remaining before lockout
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Sign In button */}
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.975 }}
                                    className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2.5"
                                    style={{ background: "#A2466B", color: "#FFF8F0" }}
                                >
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                    ) : (
                                        <>Sign In <ArrowRight size={16} strokeWidth={2.5} /></>
                                    )}
                                </motion.button>

                                {/* Divider */}
                                <div className="relative my-1" style={{ height: 1, background: "#E8E4DF" }}>
                                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-xs"
                                        style={{ background: "rgba(255,255,255,0.88)", color: "#8B8680" }}>
                                        New customer?
                                    </span>
                                </div>

                                {/* Create account link */}
                                <Link to="/register" className="block">
                                    <motion.div
                                        whileHover={{ background: "#F5F1ED" }}
                                        whileTap={{ scale: 0.975 }}
                                        className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm text-center"
                                        style={{ border: "1.5px solid #E8E4DF", color: "#2C241B", background: "transparent" }}
                                    >
                                        Create New Account
                                    </motion.div>
                                </Link>
                            </form>

                            {/* Demo accounts */}
                            <div className="mt-6 p-4 rounded-2xl"
                                style={{ background: "#FFFBF0", border: "1px solid #EBD97A" }}>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1.5"
                                    style={{ color: "#B8960C" }}>
                                    🧪 Demo Accounts
                                </p>
                                <div className="space-y-1.5 text-xs" style={{ color: "#6B5E4C" }}>
                                    <p>
                                        <span className="font-semibold">Admin: </span>
                                        <span className="font-mono">admin@shoplivebharat.com / admin123</span>
                                    </p>
                                    <p>
                                        <span className="font-semibold">Customer: </span>
                                        <span className="font-mono">customer@shoplivebharat.com / customer123</span>
                                    </p>
                                </div>
                            </div>

                            <p className="text-center mt-5 text-xs" style={{ color: "#8B8680" }}>
                                <Link to="/" className="hover:underline">← Back to Home</Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
