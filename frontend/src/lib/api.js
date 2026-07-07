/**
 * api.js — ShopLive Bharat API client
 * All calls go to REACT_APP_BACKEND_URL (default: http://localhost:8000)
 * Every function falls back gracefully when the backend is unreachable.
 */

import axios from "axios";

// Resolve the backend URL safely.
// Priority: explicit build-time env var → (in a real browser, non-localhost) the
// shared Railway backend → localhost for local dev. This guarantees a deployed
// build NEVER silently falls back to "localhost" (which only works on the machine
// running a local server), so every device loads the same shared data.
const RAILWAY_BACKEND = "https://shoplivebharat-backend-production.up.railway.app";
function resolveApiBase() {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        const isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
        if (!isLocal) {
            // Deployed: call the SAME-ORIGIN "/api", which Vercel proxies to the
            // shared Railway backend (see vercel.json). This means every device hits
            // exactly one backend with no cross-origin/CORS variability, so all
            // devices always see the same data.
            return "/api";
        }
    }
    // Local dev (or SSR): use the explicit env var or the local server.
    const backend = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
    return `${backend}/api`;
}
export const API = resolveApiBase();

export const api = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
    timeout: 30000,  // generous timeout to survive Railway cold starts (esp. on mobile networks)
});

// Warm up the backend immediately on page load (prevents cold-start delay on first real request)
if (typeof window !== "undefined") {
    setTimeout(() => {
        axios.get(`${API}/`, { timeout: 30000 }).catch(() => {});
    }, 100);
}

// ── Cold-start / network resilience ───────────────────────────────────────────
// Railway sleeps when idle. A device that opens the site "cold" (e.g. your phone)
// can hit a timeout on the very first requests while the backend wakes up, which
// makes products/orders look empty even though the data exists on the shared DB.
// Retry idempotent GET requests a few times with backoff so every device loads
// the same data regardless of whether the backend was already warm.
const MAX_RETRIES = 3;
api.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    const method = (config?.method || "get").toLowerCase();
    const isTransient =
        error.code === "ECONNABORTED" ||          // timeout
        error.code === "ERR_NETWORK" ||            // network dropped / backend waking
        error.code === "ECONNREFUSED" ||
        (error.response && error.response.status >= 500 && error.response.status < 600);

    // Only auto-retry safe, idempotent reads
    if (config && method === "get" && isTransient) {
        config.__retryCount = config.__retryCount || 0;
        if (config.__retryCount < MAX_RETRIES) {
            config.__retryCount += 1;
            const delay = 800 * config.__retryCount; // 0.8s, 1.6s, 2.4s
            await new Promise((r) => setTimeout(r, delay));
            return api(config);
        }
    }
    return Promise.reject(error);
});

// Attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("slb_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Suppress network errors in console — backend may not be running
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
            if (process.env.NODE_ENV !== "production") {
                console.warn("[API]", error.config?.url, error.response?.status || error.message);
            }
        }
        // Auto-clear stale/fake tokens on 401 so user gets redirected to login
        if (error.response?.status === 401) {
            const token = localStorage.getItem("slb_token");
            // Only clear if it looks like a mock/fake token (not a real JWT)
            if (token && !token.startsWith("ey")) {
                localStorage.removeItem("slb_token");
                localStorage.removeItem("slb_user");
                // Soft reload to reset auth state
                if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    return data; // { token, user }
}

export async function register(name, email, password, role = "customer") {
    const { data } = await api.post("/auth/register", { name, email, password, role });
    return data;
}

export async function getCurrentUser() {
    const { data } = await api.get("/auth/me");
    return data;
}

export async function updateUserProfile(payload) {
    const { data } = await api.patch("/auth/profile", payload);
    return data;
}

export async function forgotPassword(email) {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
}

export async function resetPassword(token, password) {
    const { data } = await api.post("/auth/reset-password", { token, password });
    return data;
}

export async function moveCartToWishlist(itemId) {
    const { data } = await api.post(`/cart/${itemId}/move-to-wishlist`);
    return data;
}

// ── Seller: shop settings ──────────────────────────────────────────────────────
export async function getSellerShop() {
    const { data } = await api.get("/seller/shop");
    return data;
}
export async function updateSellerShop(changes) {
    const { data } = await api.patch("/seller/shop", changes);
    return data;
}

// ── Seller: products (ownership enforced server-side) ──────────────────────────
export async function getSellerProducts() {
    const { data } = await api.get("/seller/products");
    return data?.products || [];
}
export async function sellerCreateProduct(product) {
    const { data } = await api.post("/seller/products", product);
    return data;
}
export async function sellerUpdateProduct(id, changes) {
    const { data } = await api.patch(`/seller/products/${id}`, changes);
    return data;
}
export async function sellerDeleteProduct(id) {
    const { data } = await api.delete(`/seller/products/${id}`);
    return data;
}

// ── Slots ──────────────────────────────────────────────────────────────────────
export async function getSellerSlots() {
    const { data } = await api.get("/seller/slots");
    return data?.slots || [];
}
export async function getShopSlots(shopId) {
    const { data } = await api.get(`/shops/${shopId}/slots`);
    return data?.slots || [];
}
export async function sellerCreateSlot(slot) {
    const { data } = await api.post("/seller/slots", slot);
    return data;
}
export async function sellerUpdateSlot(id, changes) {
    const { data } = await api.patch(`/seller/slots/${id}`, changes);
    return data;
}
export async function sellerDeleteSlot(id) {
    const { data } = await api.delete(`/seller/slots/${id}`);
    return data;
}
export async function getLiveShoppingShopsApi() {
    const { data } = await api.get("/live-shopping/shops");
    return data?.shops || [];
}

// ── Public shops (backend applies approved+online+not-suspended rules) ──────────
export async function fetchPublicShops(limit = 200) {
    const { data } = await api.get("/public/shops", { params: { limit } });
    return Array.isArray(data) ? data : [];
}

// ── Bookings ────────────────────────────────────────────────────────────────────
export async function createLiveBooking(payload) {
    const { data } = await api.post("/live-bookings", payload);
    return data;
}
export async function getSellerBookings() {
    const { data } = await api.get("/seller/bookings");
    return data?.bookings || [];
}
export async function updateBookingApi(id, changes) {
    const { data } = await api.patch(`/bookings/${id}`, changes);
    return data;
}

// ── Seller: orders ───────────────────────────────────────────────────────────────
export async function getSellerOrders() {
    const { data } = await api.get("/seller/orders");
    return data?.orders || [];
}
export async function getSellerOrder(id) {
    const { data } = await api.get(`/seller/orders/${id}`);
    return data;
}
export async function sellerUpdateOrder(id, changes) {
    const { data } = await api.patch(`/seller/orders/${id}`, changes);
    return data;
}


// ── Shops ─────────────────────────────────────────────────────────────────────
export async function fetchShops(params = {}) {
    // Backend is the source of truth. Return backend data directly.
    try {
        const { data } = await api.get("/shops", { params });
        if (Array.isArray(data) && data.length) {
            return data;
        }
    } catch {
        // Backend unreachable — fall through to empty
    }
    return [];
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function fetchProducts(params = {}) {
    try {
        const { data } = await api.get("/products", { params });
        return data?.length ? data : [];
    } catch {
        return [];
    }
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export async function fetchCart() {
    try {
        const { data } = await api.get("/cart");
        return data;
    } catch {
        return { items: [], total: 0 };
    }
}

export async function addCartItem(product_id, quantity = 1, size = "", color = "") {
    const { data } = await api.post("/cart", { product_id, quantity, size, color });
    return data;
}

export async function removeCartItem(item_id) {
    const { data } = await api.delete(`/cart/${item_id}`);
    return data;
}

export async function clearCart() {
    const { data } = await api.delete("/cart");
    return data;
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
export async function fetchWishlist() {
    try {
        const { data } = await api.get("/wishlist");
        return data;
    } catch {
        return { items: [] };
    }
}

export async function addWishlistItem(product_id) {
    const { data } = await api.post("/wishlist", { product_id });
    return data;
}

export async function removeWishlistItem(product_id) {
    const { data } = await api.delete(`/wishlist/${product_id}`);
    return data;
}

// ── Orders ────────────────────────────────────────────────────────────────────
export async function fetchOrders(params = {}) {
    try {
        const { data } = await api.get("/orders", { params });
        return data || { orders: [] };
    } catch {
        return { orders: [] };
    }
}

export async function createOrder(payload) {
    const { data } = await api.post("/orders", payload);
    return data;
}

// ── Razorpay (server-side order + verify) ──────────────────────────────────────
export async function createRazorpayOrder(amountPaise, currency = "INR") {
    const { data } = await api.post("/razorpay/order", { amount: amountPaise, currency });
    return data; // { id, amount, currency, key_id }
}
export async function createRazorpayCheckoutLink({ items, shipping_address, amount_paise, currency = "INR", description }) {
    const { data } = await api.post("/razorpay/checkout-link", {
        items, shipping_address, amount_paise, currency, description,
    });
    return data; // { short_url, order_id, payment_link_id }
}
export async function verifyRazorpayPayment(payload) {
    const { data } = await api.post("/razorpay/verify", payload);
    return data; // { verified: true }
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export async function fetchBookings() {
    try {
        const { data } = await api.get("/bookings");
        return data || { bookings: [] };
    } catch {
        return { bookings: [] };
    }
}

export async function createBooking(payload) {
    const { data } = await api.post("/bookings", payload);
    return data;
}

// ── Seller ────────────────────────────────────────────────────────────────────
export async function fetchSellerMe() {
    const { data } = await api.get("/seller/me");
    return data;
}

export async function fetchSellerProducts() {
    try {
        const { data } = await api.get("/seller/products");
        return data?.products || [];
    } catch {
        return [];
    }
}

export async function fetchSellerOrders() {
    try {
        const { data } = await api.get("/seller/orders");
        return data?.orders || [];
    } catch {
        return [];
    }
}

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminHeaders = (adminKey) => ({ headers: { "X-Admin-Key": adminKey } });

export async function fetchAdminStats(adminKey) {
    try {
        const { data } = await api.get("/admin/stats", adminHeaders(adminKey));
        return data;
    } catch {
        return {};
    }
}

export async function fetchAdminOrders(adminKey, params = {}) {
    const { data } = await api.get("/admin/orders", { params, ...adminHeaders(adminKey) });
    return data;
}

export async function updateAdminOrder(id, payload, adminKey) {
    const { data } = await api.patch(`/admin/orders/${id}`, payload, adminHeaders(adminKey));
    return data;
}

export async function createShop(payload, adminKey) {
    // Backend is the single source of truth — no local fallback.
    const { data } = await api.post("/admin/shops", payload, adminHeaders(adminKey));
    return data;
}

export async function updateShop(id, payload, adminKey) {
    const { data } = await api.patch(`/admin/shops/${id}`, payload, adminHeaders(adminKey));
    return data;
}

export async function archiveShop(id, adminKey) {
    const { data } = await api.delete(`/admin/shops/${id}`, adminHeaders(adminKey));
    return data;
}

export async function createProduct(payload, adminKey) {
    const { data } = await api.post("/admin/products", payload, adminHeaders(adminKey));
    return data;
}

export async function updateProduct(id, payload, adminKey) {
    const { data } = await api.patch(`/admin/products/${id}`, payload, adminHeaders(adminKey));
    return data;
}

export async function archiveProduct(id, adminKey) {
    const { data } = await api.delete(`/admin/products/${id}`, adminHeaders(adminKey));
    return data;
}

// ── Misc ──────────────────────────────────────────────────────────────────────
export async function fetchMarketplaceStats() {
    try {
        const { data } = await api.get("/marketplace/stats");
        return data;
    } catch {
        return { shops: 0, products: 0, featured_products: 0, waitlist_members: 10000 };
    }
}

export async function fetchLaunchInfo() {
    try {
        const { data } = await api.get("/launch-info");
        return data;
    } catch {
        return { launch_date: new Date().toISOString(), days_total: 15 };
    }
}

export async function fetchStats() {
    return fetchMarketplaceStats();
}

export async function joinWaitlist(payload) {
    const { data } = await api.post("/waitlist", payload);
    return data;
}

// ── Coupons ─────────────────────────────────────────────────────────────────
// Admin coupon management
export async function fetchAdminCoupons(adminKey) {
    const { data } = await api.get("/admin/coupons", adminHeaders(adminKey));
    return Array.isArray(data) ? data : [];
}
export async function createAdminCoupon(payload, adminKey) {
    const { data } = await api.post("/admin/coupons", payload, adminHeaders(adminKey));
    return data;
}
export async function updateAdminCoupon(id, payload, adminKey) {
    const { data } = await api.patch(`/admin/coupons/${id}`, payload, adminHeaders(adminKey));
    return data;
}
export async function deleteAdminCoupon(id, adminKey) {
    const { data } = await api.delete(`/admin/coupons/${id}`, adminHeaders(adminKey));
    return data;
}

// Seller coupon management (JWT-scoped to own shop)
export async function fetchSellerCoupons() {
    const { data } = await api.get("/seller/coupons");
    return Array.isArray(data) ? data : [];
}
export async function createSellerCoupon(payload) {
    const { data } = await api.post("/seller/coupons", payload);
    return data;
}
export async function updateSellerCoupon(id, payload) {
    const { data } = await api.patch(`/seller/coupons/${id}`, payload);
    return data;
}
export async function deleteSellerCoupon(id) {
    const { data } = await api.delete(`/seller/coupons/${id}`);
    return data;
}

// Public: validate a coupon at checkout
export async function validateCoupon(code, subtotal) {
    const { data } = await api.post("/coupons/validate", { code, subtotal });
    return data;
}

// ── Admin: manual seller add ────────────────────────────────────────────────
export async function adminAddSeller(payload, adminKey) {
    const { data } = await api.post("/admin/sellers", payload, adminHeaders(adminKey));
    return data;
}

// ── Returns / Refunds ────────────────────────────────────────────────────────
export async function createReturn(payload) {
    const { data } = await api.post("/returns", payload);
    return data;
}
export async function fetchMyReturns() {
    const { data } = await api.get("/returns");
    return data?.returns || [];
}
export async function fetchAdminReturns(adminKey, status) {
    const params = status && status !== "all" ? { status } : {};
    const { data } = await api.get("/admin/returns", { params, ...adminHeaders(adminKey) });
    return Array.isArray(data) ? data : [];
}
export async function updateAdminReturn(id, payload, adminKey) {
    const { data } = await api.patch(`/admin/returns/${id}`, payload, adminHeaders(adminKey));
    return data;
}
export async function fetchSellerReturns() {
    const { data } = await api.get("/seller/returns");
    return data?.returns || [];
}
export async function updateSellerReturn(id, payload) {
    const { data } = await api.patch(`/seller/returns/${id}`, payload);
    return data;
}

// ── Staff / RBAC ──────────────────────────────────────────────────────────────
export async function fetchStaff(adminKey) {
    const { data } = await api.get("/admin/staff", adminHeaders(adminKey));
    return Array.isArray(data) ? data : [];
}
export async function createStaff(payload, adminKey) {
    const { data } = await api.post("/admin/staff", payload, adminHeaders(adminKey));
    return data;
}
export async function updateStaff(id, payload, adminKey) {
    const { data } = await api.patch(`/admin/staff/${id}`, payload, adminHeaders(adminKey));
    return data;
}
export async function deleteStaff(id, adminKey) {
    const { data } = await api.delete(`/admin/staff/${id}`, adminHeaders(adminKey));
    return data;
}
export async function fetchPermissions(adminKey) {
    const { data } = await api.get("/admin/permissions", adminHeaders(adminKey));
    return data?.permissions || [];
}

// ── Shipping (Shiprocket) ──────────────────────────────────────────────────────
export async function shiprocketStatus() {
    const { data } = await api.get("/shiprocket/status");
    return data;
}
export async function adminCreateShipment(orderId, shopId, adminKey) {
    const { data } = await api.post("/admin/shipments", { order_id: orderId, shop_id: shopId }, adminHeaders(adminKey));
    return data;
}
export async function fetchAdminShipments(adminKey) {
    const { data } = await api.get("/admin/shipments", adminHeaders(adminKey));
    return data?.shipments || [];
}
export async function sellerCreateShipment(orderId) {
    const { data } = await api.post("/seller/shipments", { order_id: orderId });
    return data;
}
export async function fetchSellerShipments() {
    const { data } = await api.get("/seller/shipments");
    return data?.shipments || [];
}
export async function trackShipment(awb) {
    const { data } = await api.get(`/shipments/${awb}/track`);
    return data;
}

// ── Admin: email log (delivery/test status) ────────────────────────────────────
export async function fetchEmailLog(adminKey) {
    const { data } = await api.get("/admin/email-log", adminHeaders(adminKey));
    return data || { emails: [], mode: "test" };
}

// ── Image upload ──────────────────────────────────────────────────────────────
export async function uploadImage(dataUrl) {
    // Seller uploads (requires JWT auth)
    const { data } = await api.post("/upload-image", { data_url: dataUrl });
    return data?.url || dataUrl;
}
export async function adminUploadImage(dataUrl, adminKey) {
    // Admin uploads
    const { data } = await api.post("/admin/upload-image", { data_url: dataUrl }, adminHeaders(adminKey));
    return data?.url || dataUrl;
}
export async function uploadImageUrl(url) {
    // Store an already-hosted URL
    const { data } = await api.post("/upload-image", { url });
    return data?.url || url;
}

// ── Admin: store ordering + booking-page visibility ────────────────────────────
export async function adminSetShopOrder(shopId, payload, adminKey) {
    const { data } = await api.patch(`/admin/shops/${shopId}/order`, payload, adminHeaders(adminKey));
    return data;
}
export async function fetchAdminShopsOrdered(adminKey) {
    const { data } = await api.get("/admin/shops/order", adminHeaders(adminKey));
    return Array.isArray(data) ? data : [];
}

// ── Admin: seller suspend / archive / restore ─────────────────────────────────
export async function adminSuspendSeller(shopId, reason, adminKey) {
    const { data } = await api.post(`/admin/sellers/${shopId}/suspend`, { reason }, adminHeaders(adminKey));
    return data;
}
export async function adminUnsuspendSeller(shopId, adminKey) {
    const { data } = await api.post(`/admin/sellers/${shopId}/unsuspend`, {}, adminHeaders(adminKey));
    return data;
}
export async function adminArchiveSeller(shopId, adminKey) {
    const { data } = await api.post(`/admin/sellers/${shopId}/archive`, {}, adminHeaders(adminKey));
    return data;
}
export async function adminRestoreSeller(shopId, adminKey) {
    const { data } = await api.post(`/admin/sellers/${shopId}/restore`, {}, adminHeaders(adminKey));
    return data;
}

export async function adminDeleteSeller(shopId, adminKey) {
    const { data } = await api.delete(`/admin/sellers/${shopId}`, adminHeaders(adminKey));
    return data;
}

export async function adminBulkDeleteSellers(shopIds, adminKey) {
    const { data } = await api.post(`/admin/sellers/bulk-delete`, { shop_ids: shopIds }, adminHeaders(adminKey));
    return data;
}

// ── Categories ────────────────────────────────────────────────────────────────
export async function fetchCategories() {
    try {
        const { data } = await api.get("/categories");
        return Array.isArray(data) ? data : [];
    } catch { return []; }
}
export async function fetchAdminCategories(adminKey) {
    const { data } = await api.get("/admin/categories", adminHeaders(adminKey));
    return Array.isArray(data) ? data : [];
}
export async function createAdminCategory(payload, adminKey) {
    const { data } = await api.post("/admin/categories", payload, adminHeaders(adminKey));
    return data;
}
export async function updateAdminCategory(id, payload, adminKey) {
    const { data } = await api.patch(`/admin/categories/${id}`, payload, adminHeaders(adminKey));
    return data;
}
export async function deleteAdminCategory(id, adminKey) {
    const { data } = await api.delete(`/admin/categories/${id}`, adminHeaders(adminKey));
    return data;
}
