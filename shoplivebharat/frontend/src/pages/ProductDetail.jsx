import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Heart, ShoppingCart, ArrowRight, Loader, Ruler, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import ProductCard from "@/components/ProductCard";
import SizeGuideModal, { getSizesForCategory, needsSizeSelection } from "@/components/SizeGuideModal";
import AISizeFinder from "@/components/AISizeFinder/AISizeFinder";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { fetchProducts, fetchShops } from "@/lib/api";
import { MOCK_PRODUCTS, MOCK_SHOPS } from "@/lib/testData";

const COLOR_MAP = {
    "Ivory":"#FAF8F5","Gold":"#D4AF37","Maroon":"#8B3A3A","Crimson":"#DC143C",
    "Navy":"#1B2A6B","Rani Pink":"#E8417A","Pastel Pink":"#FFB7C5",
    "Cream":"#F5F0E8","Yellow":"#FFD700","Pink":"#E8417A",
};

export default function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();

    const [product,  setProduct]  = useState(null);
    const [shop,     setShop]     = useState(null);
    const [related,  setRelated]  = useState([]);
    const [allProds, setAllProds] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [selImg,   setSelImg]   = useState(0);
    const [qty,      setQty]      = useState(1);
    const [selColor, setSelColor] = useState("");
    const [selSize,  setSelSize]  = useState("");
    const [fav,      setFav]      = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [showAIFinder, setShowAIFinder] = useState(false);

    useEffect(() => {
        setLoading(true);
        (async () => {
            try {
                const [prods, shops] = await Promise.all([
                    fetchProducts({ limit: 500 }).catch(() => MOCK_PRODUCTS),
                    fetchShops({ limit: 100 }).catch(() => MOCK_SHOPS),
                ]);
                const allP = prods?.length ? prods : MOCK_PRODUCTS;
                const found = allP.find(p => p.id === productId);
                if (!found) { toast.error("Product not found"); navigate("/marketplace"); return; }

                setProduct(found);
                setAllProds(allP);
                setSelColor(found.color || "");
                // Pre-select the first available size
                const sizes = getSizesForCategory(found.category);
                setSelSize(sizes[0] || "");

                const shopInfo = (shops?.length ? shops : MOCK_SHOPS).find(s => s.id === found.shop_id);
                setShop(shopInfo || null);

                // Related: same category, different product
                setRelated(allP.filter(p => p.id !== found.id && p.category === found.category).slice(0, 4));
            } catch {
                toast.error("Failed to load product");
                navigate("/marketplace");
            } finally {
                setLoading(false);
            }
        })();
    }, [productId, navigate]);

    const handleAddToCart = useCallback(() => {
        if (!product) return;
        const productWithSize = selSize ? { ...product, size: selSize } : product;
        for (let i = 0; i < qty; i++) addToCart(productWithSize);
        toast.success("Added to cart!");
    }, [product, qty, addToCart, selSize]);

    const handleBuyNow = useCallback(() => {
        if (!product) return;
        const productWithSize = selSize ? { ...product, size: selSize } : product;
        addToCart(productWithSize);
        navigate("/checkout");
    }, [product, addToCart, navigate, selSize]);

    if (loading) return (
        <MarketplaceLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: "#C9A84C" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                >
                    <span className="font-serif font-bold text-sm" style={{ color: "#C9A84C" }}>S</span>
                </motion.div>
            </div>
        </MarketplaceLayout>
    );

    if (!product) return null;

    const images = [product.image_url, product.hover_image_url].filter(Boolean);
    const discount = product.compare_at_price
        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;
    const colors = product.color ? product.color.split(",").map(c => c.trim()).filter(Boolean) : [];

    return (
        <MarketplaceLayout>
            <motion.div
                style={{ backgroundColor: "#FAF9F6" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">

                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-xs mb-8" style={{ color: "#9B8B7A" }}>
                        <Link to="/" className="hover:underline">Home</Link>
                        <span>›</span>
                        <Link to="/marketplace" className="hover:underline">Collections</Link>
                        <span>›</span>
                        <span style={{ color: "#1a1a1a" }} className="font-medium truncate max-w-xs">{product.name}</span>
                    </nav>

                    {/* Main grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-20">

                        {/* ── LEFT: Images ── */}
                        <div>
                            {/* Main image */}
                            <div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: "#F0EBE3" }}>
                                <img
                                    src={images[selImg] || product.image_url}
                                    alt={product.name}
                                    className="w-full object-cover"
                                    style={{ maxHeight: "600px", objectPosition: "top center" }}
                                    onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=600&q=80"; }}
                                />
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-3">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelImg(idx)}
                                            aria-label={`View image ${idx + 1}`}
                                            aria-pressed={selImg === idx}
                                            className="rounded-lg overflow-hidden border-2 transition w-20 h-24 flex-shrink-0"
                                            style={{
                                                borderColor: selImg === idx ? "#1a1a1a" : "#E8E4DF",
                                                backgroundColor: "#F0EBE3",
                                            }}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT: Details ── */}
                        <div className="flex flex-col">

                            {/* Store name */}
                            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#C9A84C" }}>
                                {product.shop_name || product.badge || ""}
                            </p>

                            {/* Product name */}
                            <h1 className="font-serif text-3xl md:text-4xl mb-4 leading-tight" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                                {product.name}
                            </h1>

                            {/* Price */}
                            <div className="flex items-center gap-3 mb-5">
                                <span className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>{formatPrice(product.price)}</span>
                                {product.compare_at_price && (
                                    <span className="text-base line-through" style={{ color: "#9B8B7A" }}>{formatPrice(product.compare_at_price)}</span>
                                )}
                                {discount > 0 && (
                                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded"
                                        style={{ backgroundColor: "#1a1a1a" }}>{discount}% OFF</span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B5E52" }}>
                                {product.description}
                            </p>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-2 mb-5">
                                {[
                                    ["Fabric", product.category || "Premium Fabric"],
                                    ["Dispatch", `${shop?.deliveryDays || 5}-6 days`],
                                    ["Delivery", `${shop?.shippingEstimate || "5-8 days"} worldwide`],
                                    ["Stock", product.stock > 0 ? `${product.stock} available` : "Out of stock"],
                                ].map(([k, v]) => (
                                    <div key={k} className="rounded-lg px-4 py-3" style={{ backgroundColor: "#F0EBE3" }}>
                                        <span className="text-xs" style={{ color: "#9B8B7A" }}>{k}: </span>
                                        <span className="text-xs font-semibold" style={{ color: "#1a1a1a" }}>{v}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Ready to ship */}
                            {product.ready_to_ship && (
                                <div className="rounded-lg px-4 py-3 mb-5 text-xs" style={{ backgroundColor: "#F0EBE3", color: "#2D7A3A" }}>
                                    Ready to Ship: <strong>Yes</strong> — dispatches in 5-6 days
                                </div>
                            )}

                            {/* AI Size Finder + Size — only for garments that need sizing */}
                            {needsSizeSelection(product.category) && (
                            <div className="mb-5">
                                {/* AI Size Finder trigger */}
                                <button
                                    onClick={() => setShowAIFinder(v => !v)}
                                    aria-expanded={showAIFinder}
                                    className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border-2 mb-4 transition group"
                                    style={{
                                        borderColor: showAIFinder ? "#A2466B" : "#E8E4DF",
                                        background: showAIFinder ? "rgba(162,70,107,0.04)" : "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(162,70,107,0.06))",
                                    }}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: "linear-gradient(135deg, #C9A84C, #A2466B)" }}>
                                            <Sparkles size={15} className="text-white" />
                                        </span>
                                        <span className="text-left">
                                            <span className="block text-sm font-bold" style={{ color: "#1a1a1a" }}>
                                                Find My Perfect Size
                                            </span>
                                            <span className="block text-[11px]" style={{ color: "#9B8B7A" }}>
                                                AI Recommended Size · My Saved Size Profiles
                                            </span>
                                        </span>
                                    </span>
                                    <motion.span animate={{ rotate: showAIFinder ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                        <ArrowRight size={16} style={{ color: "#A2466B" }} />
                                    </motion.span>
                                </button>

                                {/* AI Size Finder inline panel */}
                                <AnimatePresence>
                                    {showAIFinder && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className="overflow-hidden mb-5"
                                        >
                                            <div className="rounded-xl border p-4" style={{ borderColor: "#E8E4DF", background: "#FFFDFB" }}>
                                                <AISizeFinder
                                                    productName={product.name}
                                                    onAddToCart={(recommendedSize) => {
                                                        setSelSize(recommendedSize);
                                                        setShowAIFinder(false);
                                                        toast.success(`Size ${recommendedSize} selected from AI recommendation`);
                                                    }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9B8B7A" }}>SIZE</p>
                                    <button
                                        onClick={() => setShowSizeGuide(true)}
                                        className="flex items-center gap-1.5 text-xs transition hover:opacity-70"
                                        style={{ color: "#9B8B7A" }}
                                    >
                                        <Ruler size={13} />
                                        Size Guide
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {getSizesForCategory(product.category).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelSize(size)}
                                            className="px-4 py-2 rounded border-2 text-sm font-semibold transition"
                                            style={{
                                                borderColor: selSize === size ? "#1a1a1a" : "#E8E4DF",
                                                backgroundColor: selSize === size ? "#1a1a1a" : "white",
                                                color: selSize === size ? "white" : "#1a1a1a",
                                            }}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            )}

                            {/* Color */}
                            {colors.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9B8B7A" }}>COLOR</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {colors.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setSelColor(c)}
                                                className="px-4 py-2 rounded border-2 text-xs font-semibold transition"
                                                style={{
                                                    borderColor: selColor === c ? "#1a1a1a" : "#E8E4DF",
                                                    backgroundColor: selColor === c ? "#1a1a1a" : "white",
                                                    color: selColor === c ? "white" : "#1a1a1a",
                                                }}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="mb-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9B8B7A" }}>QUANTITY</p>
                                <div className="flex items-center gap-0">
                                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                        className="w-9 h-9 flex items-center justify-center rounded-l-lg border transition hover:bg-gray-50"
                                        style={{ borderColor: "#E8E4DF", color: "#1a1a1a" }}>
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-10 h-9 flex items-center justify-center border-t border-b text-sm font-semibold"
                                        style={{ borderColor: "#E8E4DF", color: "#1a1a1a" }}>
                                        {qty}
                                    </span>
                                    <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                                        className="w-9 h-9 flex items-center justify-center rounded-r-lg border transition hover:bg-gray-50"
                                        style={{ borderColor: "#E8E4DF", color: "#1a1a1a" }}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock <= 0}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                                    style={{ backgroundColor: "#1a1a1a", color: "white" }}>
                                    <ShoppingCart size={16} />
                                    Add to Cart
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    disabled={product.stock <= 0}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                                    style={{ backgroundColor: "#C9A84C", color: "white" }}>
                                    Buy Now
                                    <ArrowRight size={15} />
                                </button>
                                <button onClick={() => setFav(v => !v)}
                                    className="w-12 h-12 rounded-xl border flex items-center justify-center transition hover:bg-gray-50"
                                    style={{ borderColor: "#E8E4DF" }}>
                                    <Heart size={18} className={fav ? "fill-red-500 text-red-500" : ""} style={{ color: fav ? undefined : "#9B8B7A" }} />
                                </button>
                            </div>

                            {/* Trust badges */}
                            <div className="flex items-center gap-5 flex-wrap">
                                {["🌍 Ships worldwide", "✓ Authenticity guaranteed", "🛡 Insured delivery"].map(t => (
                                    <span key={t} className="text-xs" style={{ color: "#9B8B7A" }}>{t}</span>
                                ))}
                            </div>

                            {/* Shop info */}
                            {shop && (
                                <div className="mt-6 pt-6 border-t" style={{ borderColor: "#E8E4DF" }}>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={shop.image_url}
                                            alt={shop.name}
                                            className="w-11 h-11 rounded-full object-cover border"
                                            style={{ borderColor: "#E8E4DF" }}
                                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=100&q=60"; }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>{shop.name}</p>
                                            <p className="text-xs" style={{ color: "#9B8B7A" }}>{shop.city}, {shop.country || "India"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RELATED PRODUCTS ── */}
                    {related.length > 0 && (
                        <div className="border-t pt-14" style={{ borderColor: "#E8E4DF" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>
                                YOU MAY ALSO LOVE
                            </p>
                            <h2 className="font-serif text-3xl mb-8" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                                Related Pieces
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
                                {related.map(p => <ProductCard key={p.id} product={p} />)}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Size Guide Modal — only for sized garments */}
            {showSizeGuide && needsSizeSelection(product.category) && (
                <SizeGuideModal
                    category={product.category}
                    shopName={product.shop_name || shop?.name}
                    onClose={() => setShowSizeGuide(false)}
                />
            )}
        </MarketplaceLayout>
    );
}
