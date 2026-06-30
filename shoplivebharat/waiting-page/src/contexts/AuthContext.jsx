import { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    // Admin auth
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminKey, setAdminKey] = useState(() => localStorage.getItem("slb_admin_key") || "");

    // User auth
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("slb_token") || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check admin status
        if (adminKey) {
            setIsAdmin(true);
        }

        // Check user auth on mount
        if (token) {
            try {
                const userData = JSON.parse(localStorage.getItem("slb_user") || "null");
                if (userData) {
                    setUser(userData);
                    setIsLoggedIn(true);
                }
            } catch (err) {
                localStorage.removeItem("slb_token");
                localStorage.removeItem("slb_user");
                setToken("");
                setIsLoggedIn(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loginUser = async (email, password) => {
        try {
            // For now, use local mock - replace with actual API when backend ready
            // const { data } = await api.post("/auth/login", { email, password });
            
            // Mock login for testing
            const mockUser = {
                id: "user_" + Date.now(),
                name: email.split("@")[0],
                email: email,
                phone: "",
                city: ""
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
    };

    const registerUser = async (name, email, password) => {
        try {
            // For now, use local mock - replace with actual API when backend ready
            // const { data } = await api.post("/auth/register", { name, email, password });
            
            // Mock registration for testing
            const mockUser = {
                id: "user_" + Date.now(),
                name: name,
                email: email,
                phone: "",
                city: ""
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
    };

    const updateUserProfile = async (profileData) => {
        try {
            // For now, update locally - replace with actual API when backend ready
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem("slb_user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            throw new Error("Failed to update profile");
        }
    };

    const logoutUser = () => {
        localStorage.removeItem("slb_token");
        localStorage.removeItem("slb_user");
        setToken("");
        setUser(null);
        setIsLoggedIn(false);
    };

    // Admin methods
    const loginAdmin = async (key) => {
        try {
            console.log("🔑 Validating admin key:", key);
            
            // Store the key immediately (don't require API validation)
            // In production, this would validate with backend
            localStorage.setItem("slb_admin_key", key);
            setAdminKey(key);
            setIsAdmin(true);
            
            console.log("✅ Admin key stored:", key);
            return true;
        } catch (error) {
            console.error("❌ Admin login error:", error);
            throw new Error("Invalid admin key");
        }
    };

    const logoutAdmin = () => {
        localStorage.removeItem("slb_admin_key");
        setAdminKey("");
        setIsAdmin(false);
    };

    const logout = () => {
        logoutUser();
        logoutAdmin();
    };

    return (
        <AuthContext.Provider
            value={{
                // Admin
                isAdmin,
                adminKey,
                loginAdmin,
                logoutAdmin,

                // User
                isLoggedIn,
                user,
                token,
                loading,
                loginUser,
                registerUser,
                updateUserProfile,
                logoutUser,

                // General
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
