/**
 * Wishlist.jsx — Full wishlist page at /wishlist
 */

import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";

// ── Single wishlist item row ───────────────────────────────────────────────────
function WishlistItem({ item, onRemove, onAddToCart }) {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const discount = item.compare_at_price
    ? Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 p-4 rounded-2xl border bg-white hover:shadow-md transition-shadow"
      style={{ borderColor: "#E8E4DF" }}
    >
      {/* Image */}
      <button
        onClick={() => navigate(`/product/${item.id}`)}
        className="flex-shrink-0 w-24 h-28 rounded-xl overflow-hidden"
        style={{ backgroundColor: "#F0EBE3" }}
      >
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=200&q=60"; }}
        />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest truncate mb-1" style={{ color: "#C9A84C" }}>
          {item.shop_name || item.badge || ""}
        </p>
        <button
          onClick={() => navigate(`/product/${item.id}`)}
          className="text-left"
        >
          <h3
            className="font-serif text-base leading-snug line-clamp-2 hover:opacity-70 transition-opacity"
            style={{ color: "#1a1a1a", fontWeight: 400 }}
          >
            {item.name}
          </h3>
        </button>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-sm font-bold" style={{ color: "#1a1a1a" }}>{formatPrice(item.price)}</span>
          {item.compare_at_price && (
            <span className="text-xs line-through" style={{ color: "#9B8B7A" }}>{formatPrice(item.compare_at_price)}</span>
          )}
          {discount > 0 && (
            <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: "#1a1a1a" }}>
              {discount}% OFF
            </span>
          )}
        </div>
        {item.category && (
          <p className="text-xs mt-1" style={{ color: "#9B8B7A" }}>{item.category}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <button
          onClick={() => onAddToCart(item)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition min-h-[36px] whitespace-nowrap"
          style={{ backgroundColor: "#1a1a1a", color: "white" }}
        >
          <ShoppingCart size={13} />
          <span className="hidden sm:inline">Add to Cart</span>
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition min-h-[36px]"
          style={{ borderColor: "#E8E4DF", color: "#9B8B7A" }}
        >
          <Trash2 size={13} />
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyWishlist() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center py-24"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{ backgroundColor: "#F0EBE3" }}
      >
        <Heart size={32} style={{ color: "#C9A84C" }} />
      </motion.div>
      <h2 className="font-serif text-3xl mb-3" style={{ color: "#1a1a1a", fontWeight: 400 }}>
        Your wishlist is empty
      </h2>
      <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: "#9B8B7A" }}>
        Save pieces you love and come back to them anytime. Your wishlist is stored on this device.
      </p>
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition hover:opacity-90"
        style={{ backgroundColor: "#1a1a1a", color: "white" }}
      >
        Browse Collections
        <ArrowRight size={15} />
      </Link>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Wishlist() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = useCallback((item) => {
    addToCart(item);
    toast.success("Added to cart!");
  }, [addToCart]);

  const handleAddAllToCart = useCallback(() => {
    items.forEach((item) => addToCart(item));
    toast.success(`${items.length} items added to cart!`);
  }, [items, addToCart]);

  return (
    <MarketplaceLayout>
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "70vh" }}>
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-10">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1.5 text-xs mb-3 transition hover:opacity-70"
                style={{ color: "#9B8B7A" }}
              >
                <ArrowLeft size={13} /> Back to Collections
              </Link>
              <h1 className="font-serif text-3xl md:text-4xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                My Wishlist
              </h1>
              {items.length > 0 && (
                <p className="text-sm mt-1" style={{ color: "#9B8B7A" }}>
                  {items.length} {items.length === 1 ? "item" : "items"} saved
                </p>
              )}
            </div>

            {items.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddAllToCart}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition min-h-[44px]"
                  style={{ backgroundColor: "#C9A84C", color: "white" }}
                >
                  <ShoppingCart size={15} />
                  Add All to Cart
                </button>
                <button
                  onClick={clearWishlist}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition min-h-[44px]"
                  style={{ borderColor: "#E8E4DF", color: "#9B8B7A" }}
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {items.length === 0 ? (
            <EmptyWishlist />
          ) : (
            <motion.div layout className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <WishlistItem
                    key={item.id}
                    item={item}
                    onRemove={removeFromWishlist}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </div>
    </MarketplaceLayout>
  );
}
