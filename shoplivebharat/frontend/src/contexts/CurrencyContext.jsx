import { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

// Exchange rates (base: INR = 1)
// 1 INR = conversion rate to target currency
export const CURRENCIES = {
    INR: { symbol: "₹", name: "Indian Rupee", rate: 1, code: "INR" },
    USD: { symbol: "$", name: "US Dollar", rate: 0.012, code: "USD" }, // 1 INR = 0.012 USD (1 USD ≈ 83 INR)
    EUR: { symbol: "€", name: "Euro", rate: 0.011, code: "EUR" }, // 1 INR = 0.011 EUR (1 EUR ≈ 91 INR)
    GBP: { symbol: "£", name: "British Pound", rate: 0.0095, code: "GBP" }, // 1 INR = 0.0095 GBP (1 GBP ≈ 105 INR)
    AED: { symbol: "د.إ", name: "UAE Dirham", rate: 0.044, code: "AED" }, // 1 INR = 0.044 AED (1 AED ≈ 22.7 INR)
    CAD: { symbol: "C$", name: "Canadian Dollar", rate: 0.0089, code: "CAD" }, // 1 INR = 0.0089 CAD (1 CAD ≈ 112 INR)
    AUD: { symbol: "A$", name: "Australian Dollar", rate: 0.018, code: "AUD" }, // 1 INR = 0.018 AUD (1 AUD ≈ 55 INR)
    SGD: { symbol: "S$", name: "Singapore Dollar", rate: 0.016, code: "SGD" }, // 1 INR = 0.016 SGD (1 SGD ≈ 62 INR)
};

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState(() => {
        // Get from localStorage or default to INR
        return localStorage.getItem("slb_currency") || "INR";
    });

    // Persist currency selection
    useEffect(() => {
        localStorage.setItem("slb_currency", currency);
    }, [currency]);

    const convertPrice = (priceInINR) => {
        if (!priceInINR) return 0;
        const rate = CURRENCIES[currency]?.rate || 1;
        return priceInINR * rate;
    };

    const formatPrice = (priceInINR) => {
        if (priceInINR === null || priceInINR === undefined) return `${CURRENCIES[currency]?.symbol || '₹'}0`;
        const converted = convertPrice(priceInINR);
        try {
            const formatter = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
            return formatter.format(converted);
        } catch {
            return `${CURRENCIES[currency]?.symbol || '₹'}${converted.toLocaleString('en-IN')}`;
        }
    };

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                setCurrency,
                convertPrice,
                formatPrice,
                currencies: CURRENCIES,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error("useCurrency must be used within CurrencyProvider");
    }
    return context;
}
