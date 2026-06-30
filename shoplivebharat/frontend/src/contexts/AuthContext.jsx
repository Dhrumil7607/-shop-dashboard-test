import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAdmin,    setIsAdmin]    = useState(false);
    const [adminKey,   setAdminKey]   = useState(() => localStorage.getItem("slb_admin_key") || "");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user,       setUser]       = useState(null);
    const [token,      setToken]      = useState(() => localStorage.getItem("slb_token") || "");
    const [loading,    setLoading]    = useState(false);

    // Restore session on mount — runs once, no deps loop
    useEffect(() => {
        if (adminKey) setIsAdmin(true);

        if (token) {
            try {
                const userData = JSON.parse(localStorage.getItem("slb_user") || "null");
                if (userData) {
                    setUser(userData);
                    setIsLoggedIn(true);
                }
            } catch {
                localStorage.removeItem("slb_token");
                localStorage.removeItem("slb_user");
                setToken("");
                setIsLoggedIn(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── User methods ────────────────────────────────────────────────────────
    const loginUser = useCallback(async (email, password) => {
        try {
            const mockUser = {
                id:    "user_" + Date.now(),
                name:  email.split("@")[0],
                email,
                phone: "",
                city:  "",
            };
            const mockToken = "token_" + Date.now() + "_" + Math.random().toString(36).slice(2);
            localStorage.setItem("slb_token", mockToken);
            localStorage.setItem("slb_user", JSON.stringify(mockUser));
            setToken(mockToken);
            setUser(mockUser);
            setIsLoggedIn(true);
            return { user: mockUser, token: mockToken };
        } catch (error) {
            throw new Error(error.response?.data?.detail || "Login failed");
        }
    }, []);

    const registerUser = useCallback(async (name, email, password) => {
        try {
            const mockUser = {
                id: "user_" + Date.now(),
                name,
                email,
                phone: "",
                city:  "",
            };
            const mockToken = "token_" + Date.now() + "_" + Math.random().toString(36).slice(2);
            localStorage.setItem("slb_token", mockToken);
            localStorage.setItem("slb_user", JSON.stringify(mockUser));
            setToken(mockToken);
            setUser(mockUser);
            setIsLoggedIn(true);
            return { user: mockUser, token: mockToken };
        } catch (error) {
            throw new Error(error.response?.data?.detail || "Registration failed");
        }
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
        isLoggedIn, user, token, loading,
        loginUser, registerUser, updateUserProfile, logoutUser,
        logout,
    }), [
        isAdmin, adminKey, loginAdmin, logoutAdmin,
        isLoggedIn, user, token, loading,
        loginUser, registerUser, updateUserProfile, logoutUser,
        logout,
    ]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
