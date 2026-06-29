import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { ShoppingCart, Heart } from "lucide-react";

/**
 * Product card — pixel-matched to the reference site.
 *
 * Layout (top → bottom):
 *   • Image with:  % OFF badge (top-left, white bg)
 *                  READY TO SHIP badge (top-right, green)
 *   • Store name   (tiny caps, maroon)
 *   • Product name (serif)
 *   • Price row    (sale price + strikethrough original)
 *   • Color swatch label
 *   • Add to Cart  (full-width dark button)
 */
export default function ProductCard({ product }) {
    const navigate  = useNavigate();
    const { addToCart } = useCart();
    const [fav, setFav] = useState(false);

    const discount = product.compare_at_price
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    // Strip "READY TO SHIP · " prefix for the store name display
    const storeName = (product.badge || product.shop_name || "")
        .replace(/^READY TO SHIP[·•\-\s]+/i, "")
        .trim();

    const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

    return (
        <div
            className="group bg-white border border-[#e8e4df] rounded-xl overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => navigate(`/product/${product.id}`)}
        >
            {/* ── IMAGE ── */}
            <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: "3/4" }}>
                <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=400&q=60"; }}
                />

                {/* Discount badge — top left, white pill */}
                {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-white text-[#0a0a0a] text-[10px] font-black px-2.5 py-1 rounded shadow-sm tracking-wide">
                        {discount}% OFF
                    </span>
                )}

                {/* Ready to ship — top right, green pill */}
                {(product.ready_to_ship || (product.badge || "").toLowerCase().includes("ready")) && (
                    <span className="absolute top-3 right-3 bg-[#1a7a3c] text-white text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                        READY TO SHIP
                    </span>
                )}

                {/* Wishlist — appears on hover */}
                <button
                    aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
                    onClick={e => { e.stopPropagation(); setFav(v => !v); }}
                    className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                    <Heart
                        size={15}
                        className={fav ? "text-red-500 fill-red-500" : "text-gray-400"}
                    />
                </button>

                {/* Out of stock overlay */}
                {!product.is_active && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Out of Stock</span>
                    </div>
                )}
            </div>

            {/* ── INFO ── */}
            <div className="p-4 flex flex-col flex-1 gap-1.5">
                {/* Store name */}
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-maroon leading-none truncate">
                    {storeName}
                </p>

                {/* Product name */}
                <h3 className="font-serif text-[15px] text-[#0a0a0a] line-clamp-2 leading-snug">
                    {product.name}
                </h3>

                {/* Price row */}
                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-bold text-[#0a0a0a] text-sm">{fmt(product.price)}</span>
                    {product.compare_at_price && (
                        <span className="text-xs text-gray-400 line-through">{fmt(product.compare_at_price)}</span>
                    )}
                </div>

                {/* Color swatches */}
                {product.color && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                            className="inline-block w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: COLOR_MAP[product.color] || "#ccc" }}
                        />
                        <span className="text-[10px] text-gray-500">{product.color}</span>
                    </div>
                )}

                {/* Add to cart */}
                <button
                    type="button"
                    disabled={!product.is_active}
                    onClick={e => { e.stopPropagation(); addToCart(product); }}
                    className="mt-auto w-full py-2.5 bg-[#0a0a0a] text-white text-xs font-semibold rounded-lg hover:bg-maroon transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                    <ShoppingCart size={13} />
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

// Map colour name → approximate CSS colour for the swatch dot
const COLOR_MAP = {
    "Ivory":       "#FAF8F5",
    "Gold":        "#D4AF37",
    "Maroon":      "#8B3A3A",
    "Crimson":     "#DC143C",
    "Navy":        "#1B2A6B",
    "Rani Pink":   "#E8417A",
    "Pastel Pink": "#FFB7C5",
    "Cream":       "#F5F0E8",
    "Yellow":      "#FFD700",
    "Green":       "#2D6A4F",
    "White":       "#FFFFFF",
    "Black":       "#0a0a0a",
};
