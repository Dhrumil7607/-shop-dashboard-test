import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAdmin,    setIsAdmin]    = useState(false);
    const [isSeller,   setIsSeller]   = useState(false);
    const [adminKey,   setAdminKey]   = useState(() => localStorage.getItem("slb_admin_key") || "");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user,       setUser]       = useState(null);
    const [token,      setToken]      = useState(() => localStorage.getItem("slb_token") || "");
    // loading starts TRUE — stays true until session restore completes on mount
    const [loading,    setLoading]    = useState(true);

    // Restore session on mount — runs once, no deps loop
    useEffect(() => {
        try {
            // Admin session — adminKey in localStorage is the source of truth
            const storedAdminKey = localStorage.getItem("slb_admin_key");
            if (storedAdminKey) {
                setAdminKey(storedAdminKey);
                setIsAdmin(true);
            }

            // User session
            const storedToken = localStorage.getItem("slb_token");
            if (storedToken) {
                const userData = JSON.parse(localStorage.getItem("slb_user") || "null");
                if (userData) {
                    setUser(userData);
                    setIsLoggedIn(true);
                    if (userData.role === "admin") setIsAdmin(true);
                    if (userData.role === "seller") setIsSeller(true);
                }
            }
        } catch {
            localStorage.removeItem("slb_token");
            localStorage.removeItem("slb_user");
            setToken("");
            setIsLoggedIn(false);
        } finally {
            // Session restore done — let protected routes evaluate
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── User methods ────────────────────────────────────────────────────────
    const loginUser = useCallback(async (email, password) => {
        // Backend is the single source of truth for authentication.
        try {
            const { login: apiLogin } = await import("@/lib/api");
            const result = await apiLogin(email, password);
            if (result?.token && result?.user) {
                localStorage.setItem("slb_token", result.token);
                localStorage.setItem("slb_user", JSON.stringify(result.user));
                setToken(result.token);
                setUser(result.user);
                setIsLoggedIn(true);
                if (result.user.role === "admin") { setIsAdmin(true); localStorage.setItem("slb_admin_key", "shoplivebharat-admin"); setAdminKey("shoplivebharat-admin"); }
                if (result.user.role === "seller") setIsSeller(true);
                return result;
            }
        } catch (apiErr) {
            // Re-throw so the login form can show the proper error
            throw apiErr;
        }
        throw new Error("Login failed");
    }, []);

    const registerUser = useCallback(async (name, email, password) => {
        try {
            const { register: apiRegister } = await import("@/lib/api");
            const result = await apiRegister(name, email, password, "customer");
            if (result?.token && result?.user) {
                localStorage.setItem("slb_token", result.token);
                localStorage.setItem("slb_user", JSON.stringify(result.user));
                setToken(result.token);
                setUser(result.user);
                setIsLoggedIn(true);
                return result;
            }
            throw new Error("Registration failed — no token returned");
        } catch (error) {
            throw new Error(error.response?.data?.detail || error.message || "Registration failed");
        }
    }, []);

    const loginWithGoogle = useCallback(async (credential) => {
        const { googleLogin } = await import("@/lib/api");
        const result = await googleLogin(credential);
        if (result?.token && result?.user) {
            localStorage.setItem("slb_token", result.token);
            localStorage.setItem("slb_user", JSON.stringify(result.user));
            setToken(result.token);
            setUser(result.user);
            setIsLoggedIn(true);
            if (result.user.role === "seller") setIsSeller(true);
            if (result.user.role === "admin") { setIsAdmin(true); localStorage.setItem("slb_admin_key", "shoplivebharat-admin"); setAdminKey("shoplivebharat-admin"); }
            return result;
        }
        throw new Error("Google sign-in failed");
    }, []);

    const updateUserProfile = useCallback(async (profileData) => {
        try {
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem("slb_user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            return updatedUser;
        } catch {
            throw new Error("Failed to update profile");
        }
    }, [user]);

    const logoutUser = useCallback(() => {
        if (user?.id) {
            localStorage.removeItem(`slb_size_profiles_${user?.id}`);
            localStorage.removeItem(`slb_bookings_${user?.id}`);
        }
        localStorage.removeItem("slb_token");
        localStorage.removeItem("slb_user");
        setToken("");
        setUser(null);
        setIsLoggedIn(false);
        setIsSeller(false);
    }, [user?.id]);

    // ── Admin methods ────────────────────────────────────────────────────────
    const loginAdmin = useCallback(async (key) => {
        localStorage.setItem("slb_admin_key", key);
        setAdminKey(key);
        setIsAdmin(true);
        return true;
    }, []);

    const logoutAdmin = useCallback(() => {
        localStorage.removeItem("slb_admin_key");
        setAdminKey("");
        setIsAdmin(false);
    }, []);

    const logout = useCallback(() => {
        logoutUser();
        logoutAdmin();
    }, [logoutUser, logoutAdmin]);

    // ── Memoised context value — prevents all consumers re-rendering on
    //    unrelated state changes ────────────────────────────────────────────
    const value = useMemo(() => ({
        isAdmin, adminKey, loginAdmin, logoutAdmin,
        isLoggedIn, isSeller, user, token, loading,
        loginUser, registerUser, updateUserProfile, logoutUser,
        loginWithGoogle,
        logout,
    }), [
        isAdmin, adminKey, loginAdmin, logoutAdmin,
        isLoggedIn, isSeller, user, token, loading,
        loginUser, registerUser, updateUserProfile, logoutUser,
        loginWithGoogle,
        logout,
    ]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
