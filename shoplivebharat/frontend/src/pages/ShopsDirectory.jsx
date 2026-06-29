import { useEffect, useState } from "react";
import { ArrowRight, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { fetchShops, fetchProducts } from "@/lib/api";
import { MOCK_SHOPS, MOCK_PRODUCTS } from "@/lib/testData";

export default function ShopsDirectory() {
    const navigate = useNavigate();
    const [shops,    setShops]    = useState([]);
    const [products, setProducts] = useState([]);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [sh, pr] = await Promise.all([
                    fetchShops({ active_only: true, limit: 100 }).catch(() => MOCK_SHOPS),
                    fetchProducts({ active_only: true, limit: 200 }).catch(() => MOCK_PRODUCTS),
                ]);
                setShops(sh?.length ? sh : MOCK_SHOPS);
                setProducts(pr?.length ? pr : MOCK_PRODUCTS);
            } catch {
                setShops(MOCK_SHOPS);
                setProducts(MOCK_PRODUCTS);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const countFor = (shopId) => products.filter(p => p.shop_id === shopId).length;

    return (
        <MarketplaceLayout>
            <div style={{ backgroundColor: "#FAF9F6" }}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">

                    {/* Header */}
                    <h1 className="font-serif text-4xl md:text-5xl mb-2" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                        Trusted Indian Stores
                    </h1>
                    <p className="text-sm mb-10" style={{ color: "#9B8B7A" }}>
                        Family-run, generations-old, lovingly curated.
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader size={28} className="animate-spin" style={{ color: "#C9A84C" }} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shops.map(shop => (
                                <div key={shop.id}
                                    className="rounded-xl overflow-hidden border"
                                    style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>

                                    {/* Shop image */}
                                    <div className="relative overflow-hidden" style={{ height: "200px", backgroundColor: "#F0EBE3" }}>
                                        <img
                                            src={shop.image_url}
                                            alt={shop.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=600&q=60"; }}
                                        />
                                    </div>

                                    {/* Shop info */}
                                    <div className="p-5">
                                        <div className="flex items-start gap-3 mb-3">
                                            {/* Avatar */}
                                            <img
                                                src={shop.image_url}
                                                alt={shop.name}
                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border"
                                                style={{ borderColor: "#E8E4DF" }}
                                                onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=80&q=60"; }}
                                            />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate" style={{ color: "#1a1a1a" }}>{shop.name}</p>
                                                <p className="text-xs" style={{ color: "#9B8B7A" }}>
                                                    {shop.city}, {shop.country || "India"}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-xs leading-relaxed mb-4" style={{ color: "#6B5E52" }}>
                                            {shop.description}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs" style={{ color: "#9B8B7A" }}>
                                                {countFor(shop.id)} products
                                            </span>
                                            <button
                                                onClick={() => navigate(`/marketplace?shop=${shop.id}`)}
                                                className="flex items-center gap-1.5 text-xs font-semibold transition hover:opacity-70"
                                                style={{ color: "#1a1a1a" }}>
                                                Visit <ArrowRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
}
