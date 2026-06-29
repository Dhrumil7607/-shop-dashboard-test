import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { loginUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Validation
            if (!email || !password) {
                throw new Error("Please fill in all fields");
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new Error("Please enter a valid email");
            }

            // Login
            await loginUser(email, password);
            toast.success("Login successful!");
            navigate("/");
        } catch (err) {
            const errorMsg = err.message || "Login failed. Please try again.";
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
                            Welcome Back
                        </h1>
                        <p className="text-espresso/70">
                            Sign in to your account to continue shopping
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-espresso">
                                    Password
                                </label>
                                <Link to="#" className="text-xs text-maroon hover:text-maroon/70 transition">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
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
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-line-soft"></div>
                        <span className="text-sm text-espresso/60">Don't have an account?</span>
                        <div className="flex-1 h-px bg-line-soft"></div>
                    </div>

                    {/* Create Account Link */}
                    <Link
                        to="/register"
                        className="w-full py-3 px-4 border border-maroon text-maroon rounded-lg font-semibold hover:bg-maroon/5 transition text-center block"
                    >
                        Create Account
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
