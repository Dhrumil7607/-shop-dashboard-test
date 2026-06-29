import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

// Pages
import HomePage from "@/pages/HomePage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Orders from "@/pages/Orders";
import Account from "@/pages/Account";
import About from "@/pages/About";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import Terms from "@/pages/Terms";
import Marketplace from "@/pages/Marketplace";
import ShopsDirectory from "@/pages/ShopsDirectory";
import PartnerStores from "@/pages/PartnerStores";
import LiveShopping from "@/pages/LiveShopping";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Contact from "@/pages/Contact";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminShops from "@/pages/admin/Shops";
import AdminSettings from "@/pages/admin/Settings";
import AdminOrders from "@/pages/admin/Orders";

// Protected Route Component
function ProtectedAdminRoute({ children }) {
    const { isAdmin, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!isAdmin) {
        return <Navigate to="/admin/login" />;
    }

    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            {/* Home route now points to marketplace */}
            <Route
                path="/"
                element={<HomePage />}
            />
            <Route
                path="/shop"
                element={<Marketplace />}
            />
            <Route
                path="/marketplace"
                element={<Marketplace />}
            />
            <Route
                path="/shops"
                element={<ShopsDirectory />}
            />
            <Route
                path="/live-shopping"
                element={<LiveShopping />}
            />
            <Route
                path="/product/:productId"
                element={<ProductDetail />}
            />
            <Route
                path="/partner-stores"
                element={<PartnerStores />}
            />
            <Route
                path="/cart"
                element={<Cart />}
            />
            <Route
                path="/checkout"
                element={<Checkout />}
            />
            <Route
                path="/contact"
                element={<Contact />}
            />
            <Route
                path="/login"
                element={<Login />}
            />
            <Route
                path="/register"
                element={<Register />}
            />
            <Route
                path="/account"
                element={<Account />}
            />
            <Route
                path="/orders"
                element={<Orders />}
            />
            <Route
                path="/about"
                element={<About />}
            />
            <Route
                path="/privacy"
                element={<PrivacyPolicy />}
            />
            <Route
                path="/refund"
                element={<RefundPolicy />}
            />
            <Route
                path="/terms"
                element={<Terms />}
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedAdminRoute>
                        <AdminDashboard />
                    </ProtectedAdminRoute>
                }
            />
            <Route
                path="/admin/products"
                element={
                    <ProtectedAdminRoute>
                        <AdminProducts />
                    </ProtectedAdminRoute>
                }
            />
            <Route
                path="/admin/shops"
                element={
                    <ProtectedAdminRoute>
                        <AdminShops />
                    </ProtectedAdminRoute>
                }
            />
            <Route
                path="/admin/orders"
                element={
                    <ProtectedAdminRoute>
                        <AdminOrders />
                    </ProtectedAdminRoute>
                }
            />
            <Route
                path="/admin/settings"
                element={
                    <ProtectedAdminRoute>
                        <AdminSettings />
                    </ProtectedAdminRoute>
                }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <CartProvider>
                        <AppRoutes />
                    </CartProvider>
                </AuthProvider>
            </BrowserRouter>
            <Toaster
                position="top-center"
                richColors={false}
                toastOptions={{
                    style: {
                        background: "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid #E8E4DF",
                        color: "#2C241B",
                        fontFamily: "Outfit, sans-serif",
                        letterSpacing: "0.02em",
                    },
                }}
            />
        </div>
    );
}

export default App;
