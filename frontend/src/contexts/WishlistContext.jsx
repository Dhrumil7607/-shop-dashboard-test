/**
 * WishlistContext.jsx — Global wishlist, persisted to localStorage.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const WishlistContext = createContext(null);
const STORAGE_KEY = "slb_wishlist";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  // All mutations use functional setState so they never read stale state
  function addToWishlist(product) {
    setItems((prev) => {
      if (prev.some((i) => i.id === product.id)) return prev;
      toast.success("Added to wishlist ♡");
      return [...prev, product];
    });
  }

  function removeFromWishlist(productId) {
    setItems((prev) => {
      if (!prev.some((i) => i.id === productId)) return prev;
      toast("Removed from wishlist");
      return prev.filter((i) => i.id !== productId);
    });
  }

  function toggleWishlist(product) {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === product.id);
      if (exists) {
        toast("Removed from wishlist");
        return prev.filter((i) => i.id !== product.id);
      } else {
        toast.success("Added to wishlist ♡");
        return [...prev, product];
      }
    });
  }

  function isWishlisted(productId) {
    return items.some((i) => i.id === productId);
  }

  function clearWishlist() {
    setItems([]);
  }

  function getCount() {
    return items.length;
  }

  return (
    <WishlistContext.Provider
      value={{ items, isWishlisted, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist, getCount }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    // Safe fallback — never crashes components rendered outside provider
    return {
      items: [],
      isWishlisted: () => false,
      addToWishlist: () => {},
      removeFromWishlist: () => {},
      toggleWishlist: () => {},
      clearWishlist: () => {},
      getCount: () => 0,
    };
  }
  return ctx;
}
