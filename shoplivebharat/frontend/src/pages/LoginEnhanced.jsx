import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LoginEnhanced() {
    const navigate = useNavigate();
    const { loginUser, isLoggedIn } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [attempts, setAttempts] = useState(0);

    // Redirect if already logged in
    useEffect(() => {
        if (isLoggedIn) {
            navigate("/account");
        }
    }, [isLoggedIn, navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Rate limiting (prevent brute force)
        if (attempts >= 5) {
            toast.error("Too many failed attempts. Please try again later.");
            return;
        }

        setLoading(true);
        try {
            await loginUser(email, password);
            setAttempts(0);
            toast.success("Welcome back! 🎉");
            navigate("/account");
        } catch (error) {
            setAttempts((prev) => prev + 1);
            toast.error(error.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-ivory via-cream to-ivory flex items-center justify-center p-4 md:p-0">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <motion.div
                    className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-maroon/5 to-transparent rounded-full blur-3xl"
                    animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-tl from-gold/5 to-transparent rounded-full blur-3xl"
                    animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
                    transition={{ duration: 25, repeat: Infinity }}
                />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md"
            >
                {/* Card Container */}
                <motion.div
                    variants={itemVariants}
                    className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-xl border border-white/40 shadow-2xl p-8 md:p-12"
                >
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-maroon/0 via-maroon/5 to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <motion.div variants={itemVariants} className="relative z-10">
                        {/* Header */}
                        <div className="mb-10 text-center">
                            <motion.h1
                                className="font-serif text-4xl md:text-5xl text-espresso tracking-tightest mb-2"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                Welcome <span className="serif-italic text-maroon">Back</span>
                            </motion.h1>
                            <motion.p
                                className="text-stone/70 text-sm md:text-base"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Step into the atelier
                            </motion.p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-xs uppercase tracking-[0.2em] text-stone/60 mb-3">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <motion.input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                                        }}
                                        placeholder="you@example.com"
                                        whileFocus={{
                                            scale: 1.02,
                                            boxShadow: "0 0 20px rgba(139, 58, 58, 0.15)",
                                        }}
                                        className="w-full px-5 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-xl outline-none text-espresso placeholder:text-stone/30 transition-all duration-300"
                                    />
                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone/30" strokeWidth={1.5} />
                                </div>
                                <AnimatePresence>
                                    {errors.email && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 mt-2 text-red-600 text-xs"
                                        >
                                            <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
                                            {errors.email}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Password Field */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-xs uppercase tracking-[0.2em] text-stone/60 mb-3">
                                    Password
                                </label>
                                <div className="relative">
                                    <motion.input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                                        }}
                                        placeholder="••••••••"
                                        whileFocus={{
                                            scale: 1.02,
                                            boxShadow: "0 0 20px rgba(139, 58, 58, 0.15)",
                                        }}
                                        className="w-full px-5 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-xl outline-none text-espresso placeholder:text-stone/30 transition-all duration-300"
                                    />
                                    <motion.button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone/40 hover:text-stone/70 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                                        ) : (
                                            <Eye className="w-5 h-5" strokeWidth={1.5} />
                                        )}
                                    </motion.button>
                                </div>
                                <AnimatePresence>
                                    {errors.password && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 mt-2 text-red-600 text-xs"
                                        >
                                            <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
                                            {errors.password}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Rate Limit Warning */}
                            {attempts >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                    <p className="text-sm text-red-600">
                                        {5 - attempts} attempts remaining before account lockout
                                    </p>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 px-6 bg-gradient-to-r from-maroon to-maroon/80 hover:from-maroon/90 hover:to-maroon/70 text-ivory rounded-xl font-semibold text-sm uppercase tracking-[0.1em] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full"
                                    />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                                    </>
                                )}
                            </motion.button>

                            {/* Divider */}
                            <motion.div variants={itemVariants} className="relative h-px bg-white/20">
                                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-ivory px-3 text-xs text-stone/60">
                                    New to ShopLive Bharat?
                                </span>
                            </motion.div>

                            {/* Register Link */}
                            <motion.div variants={itemVariants}>
                                <Link
                                    to="/register"
                                    className="block text-center py-3 px-6 bg-white/40 hover:bg-white/60 border border-white/40 text-espresso rounded-xl font-semibold text-sm uppercase tracking-[0.1em] transition-all duration-300"
                                >
                                    Create Account
                                </Link>
                            </motion.div>

                            {/* Forgot Password */}
                            <motion.div
                                variants={itemVariants}
                                className="text-center"
                            >
                                <Link
                                    to="#"
                                    className="text-xs text-stone/70 hover:text-maroon transition-colors"
                                >
                                    Forgot your password?
                                </Link>
                            </motion.div>
                        </form>
                    </motion.div>
                </motion.div>

                {/* Footer Link */}
                <motion.div
                    variants={itemVariants}
                    className="text-center mt-8"
                >
                    <Link
                        to="/"
                        className="text-sm text-stone/60 hover:text-espresso transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
