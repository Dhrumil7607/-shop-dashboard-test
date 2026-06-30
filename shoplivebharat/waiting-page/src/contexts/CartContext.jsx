import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem("slb_cart");
        return saved ? JSON.parse(saved) : [];
    });

    // Persist cart to localStorage
    useEffect(() => {
        localStorage.setItem("slb_cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prev) => {
            const existingItem = prev.find((item) => item.id === product.id);
            if (existingItem) {
                toast.success("Quantity updated!");
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            toast.success("Added to cart!");
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prev) => prev.filter((item) => item.id !== productId));
        toast.success("Removed from cart");
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem("slb_cart");
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotalPrice,
                getTotalItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
