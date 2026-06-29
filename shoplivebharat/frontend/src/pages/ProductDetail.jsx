import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ShoppingCart, Share2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useCart } from "@/contexts/CartContext";
import { fetchProducts, fetchShops } from "@/lib/api";

export default function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [shop, setShop] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const products = await fetchProducts({ limit: 500 });
                const found = products.find((p) => p.id === productId);
                if (!found) {
                    toast.error("Product not found");
                    navigate("/marketplace");
                    return;
                }
                setProduct(found);

                // Load shop info
                const shops = await fetchShops({ limit: 100 });
                const shopInfo = shops.find((s) => s.id === found.shop_id);
                setShop(shopInfo || null);
            } catch (error) {
                toast.error("Failed to load product");
                navigate("/marketplace");
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [productId, navigate]);

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        setQuantity(1);
    };

    if (loading) {
        return (
            <MarketplaceLayout>
                <div className="flex items-center justify-center h-96">
                    <p className="text-espresso/60">Loading product...</p>
                </div>
            </MarketplaceLayout>
        );
    }

    if (!product) {
        return (
            <MarketplaceLayout>
                <div className="flex items-center justify-center h-96">
                    <p className="text-espresso/60">Product not found</p>
                </div>
            </MarketplaceLayout>
        );
    }

    const images = [product.image_url, product.hover_image_url].filter(Boolean);
    const discount = product.compare_at_price
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
        : 0;

    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <button
                    onClick={() => navigate("/marketplace")}
                    className="flex items-center gap-2 text-maroon hover:text-maroon/70 mb-8 transition"
                >
                    <ChevronLeft size={18} />
                    Back to Products
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Images */}
                    <div>
                        <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden h-96 md:h-full">
                            <img
                                src={images[selectedImage] || product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-4">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`h-20 w-20 rounded-lg overflow-hidden border-2 transition ${
                                            selectedImage === idx
                                                ? "border-maroon"
                                                : "border-line-soft hover:border-maroon/50"
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            alt="thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div>
                        {/* Badge */}
                        {product.badge && (
                            <span className="inline-block px-3 py-1 bg-maroon/10 text-maroon text-xs uppercase tracking-widest font-medium mb-4">
                                {product.badge}
                            </span>
                        )}

                        {/* Title */}
                        <h1 className="font-serif text-4xl md:text-5xl mb-4 text-espresso">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={18}
                                        className={i < 4 ? "fill-maroon text-maroon" : "text-gray-300"}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-espresso/60">(124 reviews)</p>
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <div className="flex items-baseline gap-3">
                                <span className="font-serif text-3xl font-bold text-espresso">
                                    {product.currency} {product.price.toLocaleString()}
                                </span>
                                {product.compare_at_price && (
                                    <>
                                        <span className="text-lg text-espresso/50 line-through">
                                            {product.currency} {product.compare_at_price.toLocaleString()}
                                        </span>
                                        <span className="text-sm font-medium text-maroon">
                                            Save {discount}%
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Category */}
                        <p className="text-sm text-espresso/60 mb-6 uppercase tracking-widest">
                            {product.category}
                        </p>

                        {/* Description */}
                        <p className="text-base text-espresso/70 mb-8 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Stock Status */}
                        <div className="mb-8">
                            <p className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                                {product.stock > 0
                                    ? `${product.stock} in stock`
                                    : "Out of stock"}
                            </p>
                        </div>

                        {/* Quantity Selector */}
                        {product.stock > 0 && (
                            <div className="flex items-center gap-4 mb-8">
                                <span className="text-sm uppercase tracking-widest text-maroon">
                                    Quantity
                                </span>
                                <div className="flex items-center border border-line-soft rounded-lg">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-4 py-2 hover:bg-gray-100 transition"
                                    >
                                        −
                                    </button>
                                    <span className="px-4 py-2 border-x border-line-soft">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setQuantity(Math.min(product.stock, quantity + 1))
                                        }
                                        className="px-4 py-2 hover:bg-gray-100 transition"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Add to Cart Button */}
                        <div className="flex gap-4 mb-8">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-espresso text-ivory rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart size={20} />
                                Add to Cart
                            </button>
                            <button className="px-6 py-4 border border-line-soft rounded-lg hover:bg-gray-50 transition">
                                <Share2 size={20} className="text-espresso" />
                            </button>
                        </div>

                        {/* Shop Info */}
                        {shop && (
                            <div className="border-t border-line-soft pt-8">
                                <p className="text-xs uppercase tracking-widest text-maroon mb-3">
                                    Sold by
                                </p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-espresso">
                                            {shop.name}
                                        </h3>
                                        <p className="text-sm text-espresso/60">{shop.city}</p>
                                    </div>
                                    <button className="px-4 py-2 border border-maroon text-maroon rounded-lg hover:bg-maroon/5 transition text-sm font-medium">
                                        Visit Shop
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products Section */}
                <div className="mt-24 border-t border-line-soft pt-12">
                    <h2 className="font-serif text-3xl mb-8">You May Also Like</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {/* Placeholder for related products */}
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="group cursor-pointer rounded-lg overflow-hidden border border-line-soft hover:shadow-lg transition"
                            >
                                <div className="h-48 bg-gray-100"></div>
                                <div className="p-4">
                                    <p className="font-medium text-espresso group-hover:text-maroon transition">
                                        Similar Product
                                    </p>
                                    <p className="text-sm text-maroon font-bold mt-2">
                                        {product.currency} {(Math.random() * 10000).toFixed(0)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
