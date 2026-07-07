import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Search, ShoppingBag, Sparkles, Truck, Video } from "lucide-react";
import { SHOP_CATEGORIES, SHOP_HERO_IMAGES, SHOP_PRODUCTS, SHOP_STORIES } from "@/lib/shopCatalog";
import { fetchMarketplaceStats, fetchProducts, fetchShops } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

function ProductCard({ product, index }) {
    const { formatPrice } = useCurrency();
    const compareAt = product.compare_at_price ?? product.compareAt;
    const hoverImage = product.hover_image_url || product.hoverImage || product.image_url || product.image;
    const image = product.image_url || product.image;
    const shopName = product.shop_name || product.shopName;

    return (
        <motion.article
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, delay: index * 0.04 }}
            className="group relative"
            data-testid={`shop-product-${product.id}`}
        >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.2rem] bg-cream shadow-sm">
                <img
                    src={image}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                    loading="lazy"
                />
                <img
                    src={hoverImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/55 via-transparent to-transparent opacity-80" />
                <div className="absolute left-3 top-3 rounded-full bg-ivory/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-maroon">
                    {product.badge}
                </div>
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <button className="h-10 w-10 rounded-full bg-ivory text-espresso grid place-items-center hover:bg-maroon hover:text-ivory transition-colors" aria-label="Save product">
                        <Heart className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button className="h-10 w-10 rounded-full bg-maroon text-ivory grid place-items-center hover:bg-maroon-deep transition-colors" aria-label="Request live viewing">
                        <Video className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                </div>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-maroon">{product.category}</p>
                    <h3 className="mt-1 font-sans text-base font-medium text-espresso">{product.name}</h3>
                    {shopName && <p className="mt-1 text-xs text-stone">{shopName}</p>}
                </div>
                <div className="text-right">
                    <p className="font-medium text-espresso">{formatPrice(product.price)}</p>
                    {compareAt ? <p className="text-sm text-stone line-through">{formatPrice(compareAt)}</p> : null}
                </div>
            </div>
        </motion.article>
    );
}

export default function ShopExperience() {
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [stats, setStats] = useState(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        Promise.all([
            fetchProducts({ limit: 100 }).catch(() => []),
            fetchShops({ limit: 100 }).catch(() => []),
            fetchMarketplaceStats().catch(() => null),
        ]).then(([productData, shopData, statsData]) => {
            setProducts(productData);
            setShops(shopData);
            setStats(statsData);
        });
    }, []);

    const visibleProducts = useMemo(() => {
        const source = products.length ? products : SHOP_PRODUCTS;
        if (!query.trim()) return source;
        const q = query.toLowerCase();
        return source.filter((product) => (
            product.name?.toLowerCase().includes(q)
            || product.category?.toLowerCase().includes(q)
            || product.shop_name?.toLowerCase().includes(q)
        ));
    }, [products, query]);

    const heroShops = shops.length ? shops.slice(0, 2) : [];

    return (
        <section id="shop" data-testid="shop-experience" className="relative overflow-hidden bg-cream px-5 py-24 sm:px-6 md:px-12 lg:px-20 md:py-32">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
                    <div className="lg:col-span-7">
                        <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-maroon">
                            Merged Marketplace
                        </p>
                        <h2 className="font-serif text-[2.7rem] leading-[1.04] tracking-tightest text-espresso sm:text-5xl md:text-6xl">
                            A complete shop preview, styled for{" "}
                            <span className="serif-italic">live discovery.</span>
                        </h2>
                    </div>
                    <div className="lg:col-span-4 lg:col-start-9">
                        <p className="text-base leading-relaxed text-stone md:text-lg">
                            Product browsing from the ecommerce site now lives inside the
                            ShopLiveBharat experience, with Indian pricing, concierge cues,
                            and the same editorial visual language.
                        </p>
                        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-xl border border-line-soft bg-ivory px-3 py-4">
                                <p className="font-serif text-3xl text-maroon">{stats?.shops ?? shops.length}</p>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-stone">Shops</p>
                            </div>
                            <div className="rounded-xl border border-line-soft bg-ivory px-3 py-4">
                                <p className="font-serif text-3xl text-maroon">{stats?.products ?? visibleProducts.length}</p>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-stone">Products</p>
                            </div>
                            <div className="rounded-xl border border-line-soft bg-ivory px-3 py-4">
                                <p className="font-serif text-3xl text-maroon">{stats?.featured_products ?? visibleProducts.filter((p) => p.is_featured).length}</p>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-stone">Featured</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-12">
                    <div className="relative min-h-[430px] overflow-hidden rounded-[1.4rem] bg-espresso lg:col-span-7">
                        <img src={SHOP_HERO_IMAGES.primary} alt="Featured festive collection" className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/50 to-transparent" />
                        <div className="relative z-10 flex h-full max-w-md flex-col justify-end p-7 sm:p-10">
                            <p className="text-[10px] uppercase tracking-[0.28em] text-champagne">Now previewing</p>
                            <h3 className="mt-3 font-serif text-4xl leading-tight text-ivory sm:text-5xl">
                                Wedding wardrobes selected on live video.
                            </h3>
                            <button className="btn-pill btn-primary mt-8 w-fit">
                                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                                Shop edit
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
                        <div className="relative min-h-[205px] overflow-hidden rounded-[1.4rem] bg-ivory">
                            <img src={SHOP_HERO_IMAGES.mens} alt="Menswear collection" className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 to-transparent" />
                            <div className="absolute bottom-5 left-5 right-5">
                                <p className="text-[10px] uppercase tracking-[0.26em] text-champagne">{heroShops[0]?.city || "Menswear"}</p>
                                <p className="font-serif text-3xl text-ivory">{heroShops[0]?.name || "Sherwani pairings and kurta sets."}</p>
                            </div>
                        </div>
                        <div className="relative min-h-[205px] overflow-hidden rounded-[1.4rem] bg-ivory">
                            <img src={SHOP_HERO_IMAGES.womens} alt="Womenswear collection" className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 to-transparent" />
                            <div className="absolute bottom-5 left-5 right-5">
                                <p className="text-[10px] uppercase tracking-[0.26em] text-champagne">{heroShops[1]?.city || "Womenswear"}</p>
                                <p className="font-serif text-3xl text-ivory">{heroShops[1]?.name || "Lehengas, saris and ceremony jewels."}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                    {SHOP_CATEGORIES.map((category) => (
                        <div key={category.name} className="flex items-center gap-3 rounded-xl border border-line-soft bg-ivory p-4">
                            <img src={category.image} alt="" className="h-9 w-9 object-contain" loading="lazy" />
                            <div>
                                <p className="text-sm font-medium text-espresso">{category.name}</p>
                                <p className="text-xs text-stone">{category.count} styles</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-maroon">Curated Products</p>
                        <h3 className="mt-2 font-serif text-4xl text-espresso">Ready for the first live drop.</h3>
                    </div>
                    <label className="flex h-12 w-full items-center gap-3 rounded-full border border-line-soft bg-ivory px-5 text-stone md:w-[360px]">
                        <Search className="h-4 w-4" strokeWidth={1.5} />
                        <input
                            className="w-full bg-transparent text-sm outline-none placeholder:text-stone/70"
                            placeholder="Search sarees, jackets, jewellery"
                            aria-label="Search products"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </label>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleProducts.map((product, index) => (
                        <ProductCard product={product} index={index} key={product.id} />
                    ))}
                </div>

                <div className="mt-20 grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {[
                        { icon: Video, title: "Live boutique calls", copy: "Inspect fabric, fit and finish before reserving." },
                        { icon: Sparkles, title: "Stylist-led edits", copy: "Occasion-ready outfits composed around your event." },
                        { icon: Truck, title: "Global delivery", copy: "India-sourced pieces prepared for overseas wardrobes." },
                    ].map((item) => (
                        <div key={item.title} className="rounded-xl border border-line-soft bg-ivory p-6">
                            <item.icon className="h-6 w-6 text-maroon" strokeWidth={1.5} />
                            <h4 className="mt-5 font-sans text-lg font-medium text-espresso">{item.title}</h4>
                            <p className="mt-2 text-sm leading-relaxed text-stone">{item.copy}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-20">
                    <div className="mb-7 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-maroon">Stories</p>
                            <h3 className="mt-2 font-serif text-4xl text-espresso">From the atelier journal.</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {SHOP_STORIES.map((story) => (
                            <article key={story.title} className="group">
                                <div className="aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-ivory">
                                    <img src={story.image} alt={story.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                </div>
                                <p className="mt-4 text-[10px] uppercase tracking-[0.26em] text-maroon">{story.category}</p>
                                <h4 className="mt-2 font-sans text-lg font-medium leading-snug text-espresso">{story.title}</h4>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
