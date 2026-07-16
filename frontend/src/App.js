import "@/App.css";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import MaintenanceMode from "@/components/MaintenanceMode";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConsentBanner from "@/components/ConsentBanner";
import PageLoader from "@/components/PageLoader";

/**
 * Route-level code splitting.
 *
 * Each page is loaded as its own chunk so the initial bundle only contains
 * what the first paint needs. Admin pages in particular never ship to regular
 * shoppers. Keeping the import factories as named consts lets us prefetch
 * high-intent routes during idle time (see prefetchLikelyRoutes below).
 */
const importHomePage = () => import("@/pages/HomePage");
const importMarketplace = () => import("@/pages/Marketplace");
const importProductDetail = () => import("@/pages/ProductDetail");

const HomePage = lazy(importHomePage);
const Marketplace = lazy(importMarketplace);
const ProductDetail = lazy(importProductDetail);
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Orders = lazy(() => import("@/pages/Orders"));
const Account = lazy(() => import("@/pages/Account"));
const UserSettings = lazy(() => import("@/pages/UserSettings"));
const About = lazy(() => import("@/pages/About"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const Terms = lazy(() => import("@/pages/Terms"));
const ShopsDirectory = lazy(() => import("@/pages/ShopsDirectory"));
const StorePage = lazy(() => import("@/pages/StorePage"));
const WishlistPage = lazy(() => import("@/pages/Wishlist"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const PartnerStores = lazy(() => import("@/pages/PartnerStores"));
const LiveShopping = lazy(() => import("@/pages/LiveShopping"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Contact = lazy(() => import("@/pages/Contact"));
const BookingConfirmation = lazy(() => import("@/pages/BookingConfirmation"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin (separate chunks, only fetched when an admin navigates there)
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminShops = lazy(() => import("@/pages/admin/Shops"));
const AdminSellers = lazy(() => import("@/pages/admin/Sellers"));
const AdminSellerDetail = lazy(() => import("@/pages/admin/SellerDetail"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminCoupons  = lazy(() => import("@/pages/admin/Coupons"));
const AdminReturns = lazy(() => import("@/pages/admin/Returns"));
const AdminStaff = lazy(() => import("@/pages/admin/Staff"));
const AdminStoreOrdering = lazy(() => import("@/pages/admin/StoreOrdering"));
const AdminCategories = lazy(() => import("@/pages/admin/Categories"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminBookings = lazy(() => import("@/pages/admin/Bookings"));
const AdminSellerApplications = lazy(() => import("@/pages/admin/SellerApplications"));
const AdminAITraining = lazy(() => import("@/pages/admin/AITraining"));

const SizeProfiles = lazy(() => import("@/pages/account/SizeProfiles"));
const AccountBookings = lazy(() => import("@/pages/account/Bookings"));

// Seller registration (separate chunk — never loaded by regular shoppers)
const BecomeASeller = lazy(() => import("@/pages/seller/BecomeASeller"));
const ApplicationStatus = lazy(() => import("@/pages/seller/ApplicationStatus"));
const SellerDashboard = lazy(() => import("@/pages/seller/SellerDashboard"));
const SellerProducts  = lazy(() => import("@/pages/seller/SellerProducts"));
const SellerLive      = lazy(() => import("@/pages/seller/SellerLive"));
const SellerOrders    = lazy(() => import("@/pages/seller/SellerOrders"));
const SellerOrderDetail = lazy(() => import("@/pages/seller/SellerOrderDetail"));
const SellerBookings  = lazy(() => import("@/pages/seller/SellerBookings"));
const SellerCoupons   = lazy(() => import("@/pages/seller/SellerCoupons"));
const SellerSettings  = lazy(() => import("@/pages/seller/SellerSettings"));
const SellerAIStudio  = lazy(() => import("@/pages/seller/SellerAIStudio"));
const SellerLoginPage = lazy(() => import("@/pages/seller/SellerLoginPage"));
const SellerSuspended = lazy(() => import("@/pages/seller/SellerSuspended"));
const AdminAccess     = lazy(() => import("@/pages/AdminAccess"));

// Protected Route Component
function ProtectedAdminRoute({ children }) {
    const { isAdmin, loading } = useAuth();
    if (loading) return <PageLoader />;
    if (!isAdmin) return <Navigate to="/slb-admin" replace />;
    return children;
}

function ProtectedSellerRoute({ children }) {
    const { isLoggedIn, isSeller, loading } = useAuth();
    if (loading) return <PageLoader />;
    if (!isLoggedIn || !isSeller) return <Navigate to="/seller/login" replace />;
    return children;
}

/**
 * Warm the cache for the routes a shopper is most likely to hit next,
 * without competing with the initial render. Runs once during idle time.
 */
function usePrefetchLikelyRoutes() {
    useEffect(() => {
        const prefetch = () => {
            importMarketplace();
            importProductDetail();
        };

        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            const id = window.requestIdleCallback(prefetch, { timeout: 2500 });
            return () => window.cancelIdleCallback?.(id);
        }

        const timer = setTimeout(prefetch, 2000);
        return () => clearTimeout(timer);
    }, []);
}

function AppRoutes() {
    usePrefetchLikelyRoutes();

    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public Routes */}
                {/* Home route now points to marketplace */}
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<Marketplace />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/shops" element={<ShopsDirectory />} />
                <Route path="/shops/:shopId" element={<StorePage />} />
                <Route path="/stores/:shopId" element={<StorePage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/order-tracking" element={<OrderTracking />} />
                <Route path="/live-shopping" element={<LiveShopping />} />
                <Route path="/product/:productId" element={<ProductDetail />} />
                <Route path="/partner-stores" element={<PartnerStores />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/account" element={<Account />} />
                <Route path="/account/size-profiles" element={<SizeProfiles />} />
                <Route path="/account/bookings" element={<AccountBookings />} />
                <Route path="/settings" element={<UserSettings />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/refund" element={<RefundPolicy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Seller Registration (public) */}
                <Route path="/become-a-seller" element={<BecomeASeller />} />
                <Route path="/become-a-seller/status/:applicationId" element={<ApplicationStatus />} />

                {/* ── SELLER PORTAL — separate isolated login + pages ── */}
                <Route path="/seller/login"     element={<SellerLoginPage />} />
                <Route path="/seller/suspended" element={<SellerSuspended />} />
                <Route path="/seller/dashboard" element={<ProtectedSellerRoute><SellerDashboard /></ProtectedSellerRoute>} />
                <Route path="/seller/products"  element={<ProtectedSellerRoute><SellerProducts /></ProtectedSellerRoute>} />
                <Route path="/seller/live"      element={<ProtectedSellerRoute><SellerLive /></ProtectedSellerRoute>} />
                <Route path="/seller/orders"    element={<ProtectedSellerRoute><SellerOrders /></ProtectedSellerRoute>} />
                <Route path="/seller/orders/:orderId" element={<ProtectedSellerRoute><SellerOrderDetail /></ProtectedSellerRoute>} />
                <Route path="/seller/bookings"  element={<ProtectedSellerRoute><SellerBookings /></ProtectedSellerRoute>} />
                <Route path="/seller/coupons"   element={<ProtectedSellerRoute><SellerCoupons /></ProtectedSellerRoute>} />
                <Route path="/seller/settings"  element={<ProtectedSellerRoute><SellerSettings /></ProtectedSellerRoute>} />
                <Route path="/seller/ai-studio" element={<ProtectedSellerRoute><SellerAIStudio /></ProtectedSellerRoute>} />

                {/* ── ADMIN — hidden entry point, not linked anywhere ── */}
                <Route path="/slb-admin"        element={<AdminAccess />} />
                <Route path="/admin/login"      element={<AdminLogin />} />
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
                    path="/admin/sellers"
                    element={
                        <ProtectedAdminRoute>
                            <AdminSellers />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/sellers/:shopId"
                    element={
                        <ProtectedAdminRoute>
                            <AdminSellerDetail />
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
                    path="/admin/customers"
                    element={
                        <ProtectedAdminRoute>
                            <AdminCustomers />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/bookings"
                    element={
                        <ProtectedAdminRoute>
                            <AdminBookings />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/seller-applications"
                    element={<Navigate to="/admin/sellers" replace />}
                />
                <Route
                    path="/admin/settings"
                    element={
                        <ProtectedAdminRoute>
                            <AdminSettings />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/coupons"
                    element={
                        <ProtectedAdminRoute>
                            <AdminCoupons />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/returns"
                    element={
                        <ProtectedAdminRoute>
                            <AdminReturns />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/ai-training"
                    element={
                        <ProtectedAdminRoute>
                            <AdminAITraining />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/staff"
                    element={
                        <ProtectedAdminRoute>
                            <AdminStaff />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/store-ordering"
                    element={
                        <ProtectedAdminRoute>
                            <AdminStoreOrdering />
                        </ProtectedAdminRoute>
                    }
                />
                <Route
                    path="/admin/categories"
                    element={
                        <ProtectedAdminRoute>
                            <AdminCategories />
                        </ProtectedAdminRoute>
                    }
                />

                {/* Catch all - show 404 page */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
}

function App() {
    return (
        <div className="App">
            <ErrorBoundary>
                <BrowserRouter>
                    <AuthProvider>
                        <CartProvider>
                            <CurrencyProvider>
                                <WishlistProvider>
                                <MaintenanceMode />
                                <AppRoutes />
                                <ConsentBanner />
                                </WishlistProvider>
                            </CurrencyProvider>
                        </CartProvider>
                    </AuthProvider>
                </BrowserRouter>
            </ErrorBoundary>
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
