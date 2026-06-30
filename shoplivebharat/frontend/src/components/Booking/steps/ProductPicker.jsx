/**
 * ProductPicker.jsx — Step 2 of LiveBookingFlow
 *
 * Fetches products for bookingState.storeId using fetchProducts(storeId).
 * Falls back to MOCK_PRODUCTS filtered by storeId if API returns empty/error.
 * Renders a searchable product list with checkboxes; max 10 selections.
 *
 * Auth check: if not logged in, calls onAuthRequired() instead of rendering.
 *
 * Props:
 *   bookingState      {object}    shared booking state (needs .storeId)
 *   onUpdate          {function}  patch callback: onUpdate({ selectedProducts: [...] })
 *   onAuthRequired    {function}  called when user is not authenticated
 *
 * Requirements: 8.3, 8.9, 12.7
 */

import { useEffect, useState, useMemo } from "react";
import { Search, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProducts } from "@/lib/api";
import { MOCK_PRODUCTS } from "@/lib/testData";

const MAX_SELECTIONS = 10;

export default function ProductPicker({ bookingState, onUpdate, onAuthRequired }) {
  const { isLoggedIn } = useAuth();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn && onAuthRequired) {
      onAuthRequired();
    }
  }, [isLoggedIn, onAuthRequired]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await fetchProducts({ shop_id: bookingState.storeId });
        if (!cancelled) {
          if (data && data.length > 0) {
            setAllProducts(data);
          } else {
            // Fallback: filter MOCK_PRODUCTS by storeId
            const fallback = MOCK_PRODUCTS.filter(
              (p) => p.shop_id === bookingState.storeId
            );
            setAllProducts(fallback.length > 0 ? fallback : MOCK_PRODUCTS);
          }
        }
      } catch {
        if (!cancelled) {
          const fallback = MOCK_PRODUCTS.filter(
            (p) => p.shop_id === bookingState.storeId
          );
          setAllProducts(fallback.length > 0 ? fallback : MOCK_PRODUCTS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return () => { cancelled = true; };
  }, [bookingState.storeId, isLoggedIn]);

  const selectedProducts = bookingState.selectedProducts || [];

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.toLowerCase();
    return allProducts.filter((p) =>
      (p.name || "").toLowerCase().includes(q)
    );
  }, [allProducts, search]);

  const isMaxReached = selectedProducts.length >= MAX_SELECTIONS;

  function handleToggle(product) {
    const alreadySelected = selectedProducts.some((p) => p.id === product.id);
    let updated;
    if (alreadySelected) {
      updated = selectedProducts.filter((p) => p.id !== product.id);
    } else {
      if (isMaxReached) return; // don't add if max reached
      updated = [
        ...selectedProducts,
        {
          id: product.id,
          name: product.name,
          image_url: product.image_url,
          price: product.price,
        },
      ];
    }
    onUpdate({ selectedProducts: updated });
  }

  // Don't render content if not logged in (auth guard redirects)
  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="w-8 h-8 border-4 border-maroon border-t-transparent rounded-full animate-spin"
          aria-label="Loading products"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-stone text-sm">
          Select up to {MAX_SELECTIONS} products you'd like to discuss in your session.
        </p>
        {isMaxReached && (
          <span className="text-xs font-semibold text-maroon bg-maroon/10 px-2 py-1 rounded-full">
            (Max 10 reached)
          </span>
        )}
      </div>

      {/* Search input */}
      <div className="relative">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/40 pointer-events-none"
        />
        <input
          id="product-search"
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-stone/20 rounded-lg text-sm text-espresso placeholder-stone/40 focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon/50 transition min-h-[44px]"
        />
      </div>

      {/* Product list */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-stone/50">
          <Package size={32} strokeWidth={1.5} />
          <p className="text-sm">No products found.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const isChecked = selectedProducts.some((p) => p.id === product.id);
            const isDisabled = isMaxReached && !isChecked;

            return (
              <label
                key={product.id}
                htmlFor={`product-${product.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer min-h-[44px] ${
                  isChecked
                    ? "border-maroon/40 bg-maroon/5"
                    : isDisabled
                    ? "border-stone/10 bg-stone/5 opacity-50 cursor-not-allowed"
                    : "border-stone/15 hover:border-stone/30 hover:bg-stone/5"
                }`}
              >
                <input
                  id={`product-${product.id}`}
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => handleToggle(product)}
                  className="w-4 h-4 accent-maroon flex-shrink-0 cursor-pointer"
                />

                {/* Product thumbnail */}
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-stone/10">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone/30">
                      <Package size={16} />
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-espresso line-clamp-1">
                    {product.name}
                  </p>
                  {product.price != null && (
                    <p className="text-xs text-stone/60 mt-0.5">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* Selection count */}
      <p className="text-xs text-stone/50 text-right">
        {selectedProducts.length} / {MAX_SELECTIONS} selected
      </p>
    </div>
  );
}
