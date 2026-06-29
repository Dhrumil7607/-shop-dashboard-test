import { useNavigate } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

export default function ProductCard({ product }) {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [isFavorite, setIsFavorite] = useState(false);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
    };

    const discount = product.compare_at_price
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    return (
        <div
            onClick={() => navigate(`/product/${product.id}`)}
            className="group cursor-pointer rounded-lg overflow-hidden border border-line-soft hover:shadow-lg transition"
        >
            {/* Image Container */}
            <div className="relative h-64 bg-gray-100 overflow-hidden">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Badge */}
                {product.badge && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-maroon text-ivory text-xs font-bold uppercase tracking-widest rounded">
                        {product.badge}
                    </div>
                )}

                {/* Discount Badge */}
                {discount > 0 && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">
                        -{discount}%
                    </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-end justify-between p-4 opacity-0 group-hover:opacity-100">
                    <button
                        onClick={handleAddToCart}
                        disabled={!product.is_active}
                        className="flex items-center gap-2 px-4 py-2 bg-ivory text-espresso rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
                    >
                        <ShoppingCart size={16} />
                        Add to Cart
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsFavorite(!isFavorite);
                        }}
                        className={`p-2 rounded-lg transition ${
                            isFavorite
                                ? "bg-maroon text-ivory"
                                : "bg-ivory text-maroon hover:bg-maroon/10"
                        }`}
                    >
                        <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                </div>

                {/* Out of Stock Overlay */}
                {!product.is_active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-ivory font-bold text-sm">Out of Stock</span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                {/* Category */}
                <p className="text-xs uppercase tracking-widest text-maroon mb-2 font-medium">
                    {product.category}
                </p>

                {/* Name */}
                <h3 className="font-serif text-lg text-espresso mb-3 group-hover:text-maroon transition line-clamp-2">
                    {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="font-serif text-xl font-bold text-maroon">
                        {product.currency} {product.price.toLocaleString()}
                    </span>
                    {product.compare_at_price && (
                        <span className="text-sm text-espresso/50 line-through">
                            {product.currency} {product.compare_at_price.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Stock Status */}
                <p
                    className={`text-xs mt-2 font-medium ${
                        product.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}
                >
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>
            </div>
        </div>
    );
}
