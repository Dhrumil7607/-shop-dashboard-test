/**
 * Secure Configuration Module
 * Handles all environment variables and sensitive data safely
 * 
 * ✅ DO: Keep sensitive values in environment variables
 * ❌ DON'T: Hardcode secrets in code
 * ✅ DO: Validate and sanitize all inputs
 * ❌ DON'T: Expose internal details in error messages
 */

// Environment variables (set in .env, never committed to git)
export const config = {
    // Backend configuration
    backend: {
        url: process.env.REACT_APP_BACKEND_URL || "http://localhost:8000",
        timeout: 30000, // 30 seconds
        retries: 3,
    },

    // Environment
    env: process.env.REACT_APP_ENVIRONMENT || "development",
    isDevelopment: process.env.REACT_APP_ENVIRONMENT === "development",
    isProduction: process.env.REACT_APP_ENVIRONMENT === "production",

    // Security settings
    security: {
        // Use sessionStorage for sensitive operations (not localStorage)
        tokenStorage: "sessionStorage",
        // Token expires after (in minutes)
        tokenExpiry: 60 * 24, // 24 hours
        // Maximum login attempts before lockout
        maxLoginAttempts: 5,
        // Lockout duration (in minutes)
        lockoutDuration: 15,
    },

    // Logging
    logging: {
        // Never log sensitive data
        sanitizeLog: true,
        // Enable detailed logs in development only
        verbose: process.env.REACT_APP_ENVIRONMENT === "development",
    },
};

/**
 * Sanitize sensitive data before logging
 * Removes or masks sensitive fields
 */
export function sanitizeForLogging(data) {
    if (!config.logging.sanitizeLog) return data;

    const sensitive = [
        "password",
        "token",
        "api_key",
        "secret",
        "authorization",
        "card_number",
        "cvv",
        "ssn",
        "phone",
        "email",
        "admin_key",
    ];

    const cloned = structuredClone(data);

    function redact(obj) {
        if (!obj || typeof obj !== "object") return obj;

        for (const key in obj) {
            if (sensitive.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
                obj[key] = "[REDACTED]";
            } else if (typeof obj[key] === "object") {
                redact(obj[key]);
            }
        }
    }

    redact(cloned);
    return cloned;
}

/**
 * Safe logger - logs sanitized data in development, silently fails in production
 */
export const secureLog = {
    info: (message, data = null) => {
        if (!config.logging.verbose) return;
        const sanitized = data ? sanitizeForLogging(data) : null;
        console.log(`[INFO] ${message}`, sanitized || "");
    },

    warn: (message, data = null) => {
        const sanitized = data ? sanitizeForLogging(data) : null;
        console.warn(`[WARN] ${message}`, sanitized || "");
    },

    error: (message, data = null) => {
        const sanitized = data ? sanitizeForLogging(data) : null;
        console.error(`[ERROR] ${message}`, sanitized || "");
    },

    // User-friendly error (never expose internal details)
    userError: (error) => {
        const message =
            error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Something went wrong. Please try again.";

        // Sanitize the message before showing to user
        return typeof message === "string"
            ? message.replace(/[a-zA-Z0-9]{20,}/g, "[REDACTED]")
            : "Something went wrong. Please try again.";
    },
};

/**
 * Validate configuration on app startup
 */
export function validateConfig() {
    const issues = [];

    // Check backend URL
    if (!config.backend.url) {
        issues.push("❌ REACT_APP_BACKEND_URL not set");
    }

    // Warn if in production without proper setup
    if (config.isProduction) {
        if (!config.backend.url.startsWith("https://")) {
            issues.push("⚠️ Backend URL should use HTTPS in production");
        }
    }

    if (issues.length > 0) {
        console.warn("Configuration Issues:", issues);
    }

    return issues.length === 0;
}

/**
 * Get safe API headers (without exposing secrets)
 */
export function getApiHeaders() {
    const token = sessionStorage.getItem("slb_token");
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Hash password client-side before sending (optional, backend should also hash)
 * Note: This is for additional security, backend MUST still hash
 */
export async function hashPassword(password) {
    if (!password || password.length === 0) return null;

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default config;
