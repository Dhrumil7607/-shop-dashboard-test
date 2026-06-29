import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { setMetaTags } from "@/lib/seo";

export default function Cart() {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
    const { formatPrice } = useCurrency();

    useEffect(() => {
        // Set SEO meta tags for cart page
        setMetaTags({
            title: "Shopping Cart | ShopLive Bharat",
            description: "Review your shopping cart with premium Indian fashion and jewelry items. Proceed to secure checkout.",
            keywords: "shopping cart, my items, checkout, luxury fashion",
            url: "https://shoplivebharat.com/cart",
            type: "website",
        });
    }, []);

    if (cartItems.length === 0) {
        return (
            <MarketplaceLayout>
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <h1 className="font-serif text-4xl mb-12">Shopping Cart</h1>

                    <div className="flex flex-col items-center justify-center py-24">
                        <ShoppingBag size={64} className="text-gray-300 mb-6" />
                        <h2 className="font-serif text-2xl text-espresso mb-4">Your cart is empty</h2>
                        <p className="text-espresso/60 mb-8 max-w-sm text-center">
                            Discover our curated collection of Indian luxury fashion and add items to get started.
                        </p>
                        <Link
                            to="/marketplace"
                            className="px-8 py-3 bg-espresso text-ivory rounded-lg hover:bg-opacity-90 transition font-medium"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    const subtotal = getTotalPrice();
    const shipping = subtotal > 5000 ? 0 : 299;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-maroon hover:text-maroon/70 mb-8 transition"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <h1 className="font-serif text-4xl mb-8">Shopping Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="space-y-4">
                            {cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-6 p-6 border border-line-soft rounded-lg hover:shadow-md transition"
                                >
                                    {/* Image */}
                                    <div className="h-32 w-32 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-espresso mb-2">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-espresso/60 mb-3">
                                            {item.category}
                                        </p>
                                        <p className="font-serif text-xl font-bold text-maroon">
                                            {formatPrice(item.price)}
                                        </p>
                                    </div>

                                    {/* Quantity & Action */}
                                    <div className="flex flex-col items-end justify-between">
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-maroon hover:text-maroon/70 transition p-1"
                                        >
                                            <Trash2 size={20} />
                                        </button>

                                        <div className="flex items-center border border-line-soft rounded-lg">
                                            <button
                                                onClick={() =>
                                                    updateQuantity(item.id, item.quantity - 1)
                                                }
                                                className="p-2 hover:bg-gray-100 transition"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="px-3 py-2 border-x border-line-soft text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    updateQuantity(item.id, item.quantity + 1)
                                                }
                                                className="p-2 hover:bg-gray-100 transition"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Continue Shopping */}
                        <Link
                            to="/marketplace"
                            className="inline-flex items-center gap-2 text-maroon hover:text-maroon/70 mt-8 transition"
                        >
                            <ArrowLeft size={18} />
                            Continue Shopping
                        </Link>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:sticky lg:top-8 h-fit">
                        <div className="bg-gray-50 rounded-lg p-8 border border-line-soft">
                            <h2 className="font-semibold text-lg text-espresso mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6 pb-6 border-b border-line-soft">
                                <div className="flex justify-between text-espresso">
                                    <span>Subtotal ({getTotalItems()} items)</span>
                                    <span className="font-medium">
                                        {formatPrice(subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-espresso">
                                    <span>Shipping</span>
                                    <span className="font-medium">
                                        {shipping === 0 ? (
                                            <span className="text-green-600">Free</span>
                                        ) : (
                                            formatPrice(shipping)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-espresso">
                                    <span>Tax (18%)</span>
                                    <span className="font-medium">{formatPrice(tax)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between mb-6">
                                <span className="font-serif text-xl text-espresso">Total</span>
                                <span className="font-serif text-2xl font-bold text-maroon">
                                    {formatPrice(total)}
                                </span>
                            </div>

                            {shipping > 0 && (
                                <p className="text-xs text-espresso/60 mb-4 text-center">
                                    Free shipping on orders above {formatPrice(5000)}
                                </p>
                            )}

                            <button
                                onClick={() => navigate("/checkout")}
                                className="w-full py-3 bg-espresso text-ivory rounded-lg font-medium hover:bg-opacity-90 transition mb-3"
                            >
                                Proceed to Checkout
                            </button>

                            <button
                                onClick={() => navigate("/marketplace")}
                                className="w-full py-3 border border-line-soft rounded-lg font-medium hover:bg-gray-100 transition"
                            >
                                Continue Shopping
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-6 space-y-3 text-sm text-espresso/60 text-center">
                            <p>✓ Free Returns within 30 days</p>
                            <p>✓ Secure Checkout</p>
                            <p>✓ 100% Authentic Products</p>
                        </div>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
