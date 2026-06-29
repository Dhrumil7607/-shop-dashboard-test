import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("slb_cart") || "[]");
        } catch {
            return [];
        }
    });

    // Persist on every change — single effect, no double-write
    useEffect(() => {
        try {
            localStorage.setItem("slb_cart", JSON.stringify(cartItems));
        } catch { /* quota exceeded */ }
    }, [cartItems]);

    const addToCart = useCallback((product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                toast.success("Quantity updated!");
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            toast.success("Added to cart!");
            return [...prev, { ...product, quantity: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
        toast.success("Removed from cart");
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prev =>
            prev.map(item => item.id === productId ? { ...item, quantity } : item)
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCartItems([]);
        try { localStorage.removeItem("slb_cart"); } catch {}
    }, []);

    // Derived values — stable references via useMemo
    const getTotalPrice = useCallback(() =>
        cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]);

    const getTotalItems = useCallback(() =>
        cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]);

    const value = useMemo(() => ({
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
    }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
