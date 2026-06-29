import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { registerUser } = useAuth();

    // Password strength checker
    const getPasswordStrength = (pwd) => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^A-Za-z0-9]/.test(pwd)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(password);
    const strengthLabel = ["Weak", "Fair", "Good", "Strong", "Very Strong"][passwordStrength - 1] || "";
    const strengthColor = {
        1: "bg-red-500",
        2: "bg-orange-500",
        3: "bg-yellow-500",
        4: "bg-green-500",
        5: "bg-green-600",
    }[passwordStrength] || "bg-gray-300";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Validation
            if (!name || !email || !password || !confirmPassword) {
                throw new Error("Please fill in all fields");
            }

            if (name.length < 2) {
                throw new Error("Name must be at least 2 characters");
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new Error("Please enter a valid email");
            }

            if (password.length < 8) {
                throw new Error("Password must be at least 8 characters");
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }

            // Register
            await registerUser(name, email, password);
            toast.success("Account created successfully!");
            navigate("/");
        } catch (err) {
            const errorMsg = err.message || "Registration failed. Please try again.";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ivory text-espresso flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-ivory border-b border-line-soft">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Logo />
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Page Title */}
                    <div className="mb-12 text-center">
                        <h1 className="font-serif text-4xl md:text-5xl mb-4 text-espresso">
                            Create Account
                        </h1>
                        <p className="text-espresso/70">
                            Join ShopLiveBharat and start shopping
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-espresso mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon focus:ring-1 focus:ring-maroon outline-none transition text-espresso placeholder:text-espresso/40"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-espresso mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon focus:ring-1 focus:ring-maroon outline-none transition text-espresso placeholder:text-espresso/40"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-espresso mb-2">
                                Password
                            </label>
                            <div className="relative mb-2">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon focus:ring-1 focus:ring-maroon outline-none transition text-espresso placeholder:text-espresso/40"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/60 hover:text-espresso transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password Strength */}
                            {password && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${strengthColor}`}
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-espresso/60">{strengthLabel}</span>
                                    </div>
                                    <p className="text-xs text-espresso/60">
                                        Password should be at least 8 characters with uppercase, lowercase, numbers, and symbols
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-espresso mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon focus:ring-1 focus:ring-maroon outline-none transition text-espresso placeholder:text-espresso/40"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/60 hover:text-espresso transition"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>

                                {/* Match indicator */}
                                {confirmPassword && (
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                        {password === confirmPassword ? (
                                            <Check size={18} className="text-green-500" />
                                        ) : (
                                            <X size={18} className="text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-maroon text-ivory rounded-lg font-semibold hover:bg-maroon/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader size={18} className="animate-spin" />}
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-line-soft"></div>
                        <span className="text-sm text-espresso/60">Already have an account?</span>
                        <div className="flex-1 h-px bg-line-soft"></div>
                    </div>

                    {/* Login Link */}
                    <Link
                        to="/login"
                        className="w-full py-3 px-4 border border-maroon text-maroon rounded-lg font-semibold hover:bg-maroon/5 transition text-center block"
                    >
                        Sign In
                    </Link>

                    {/* Back to Home */}
                    <div className="text-center mt-6">
                        <Link to="/" className="text-sm text-espresso/70 hover:text-espresso transition">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-line-soft mt-12">
                <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-espresso/60">
                    <p>© {new Date().getFullYear()} ShopLiveBharat. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
