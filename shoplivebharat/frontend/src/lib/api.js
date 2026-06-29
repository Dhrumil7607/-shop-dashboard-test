import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

// Add JWT token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("slb_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Error handling interceptor
api.interceptors.response.use(
    response => response,
    error => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Auth Endpoints
export async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
}

export async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    return data;
}

export async function getCurrentUser() {
    const { data } = await api.get("/auth/me");
    return data;
}

// Waitlist
export async function fetchLaunchInfo() {
    const { data } = await api.get("/launch-info");
    return data;
}

export async function fetchStats() {
    const { data } = await api.get("/waitlist/stats");
    return data;
}

export async function joinWaitlist(payload) {
    const { data } = await api.post("/waitlist", payload);
    return data;
}

export async function fetchMarketplaceStats() {
    const { data } = await api.get("/marketplace/stats");
    return data;
}

export async function fetchShops(params = {}) {
    try {
        const { data } = await api.get("/shops", { params });
        return data || [];
    } catch (error) {
        console.error("Failed to fetch shops:", error);
        // Return empty array on error instead of throwing
        return [];
    }
}

export async function fetchProducts(params = {}) {
    try {
        const { data } = await api.get("/products", { params });
        return data || [];
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

// Orders
export async function fetchOrders(params = {}) {
    const { data } = await api.get("/orders", { params });
    return data;
}

export async function fetchOrderDetails(orderId) {
    const { data } = await api.get(`/orders/${orderId}`);
    return data;
}

export async function createOrder(payload) {
    const { data } = await api.post("/orders", payload);
    return data;
}

// User Profile
export async function updateUserProfile(payload) {
    const { data } = await api.patch("/auth/profile", payload);
    return data;
}

const adminHeaders = (adminKey) => ({
    headers: { "X-Admin-Key": adminKey },
});

export async function createShop(payload, adminKey) {
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

export async function fetchAdminOrders(adminKey, params = {}) {
    const { data } = await api.get("/admin/orders", { params, ...adminHeaders(adminKey) });
    return data;
}

export async function updateAdminOrder(id, payload, adminKey) {
    const { data } = await api.patch(`/admin/orders/${id}`, payload, adminHeaders(adminKey));
    return data;
}
