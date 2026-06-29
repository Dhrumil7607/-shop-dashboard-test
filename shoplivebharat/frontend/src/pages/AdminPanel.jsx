import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, KeyRound, PackagePlus, Plus, RefreshCw, Store } from "lucide-react";
import { toast } from "sonner";
import {
    archiveProduct,
    archiveShop,
    createProduct,
    createShop,
    fetchMarketplaceStats,
    fetchProducts,
    fetchShops,
} from "@/lib/api";

const emptyShop = {
    name: "",
    owner_name: "",
    owner_email: "",
    city: "",
    country: "India",
    specialty: "",
    description: "",
    image_url: "/shop-assets/banner-1.jpg",
    instagram_url: "",
    is_active: true,
};

const emptyProduct = {
    shop_id: "",
    name: "",
    category: "",
    description: "",
    price: "",
    compare_at_price: "",
    currency: "INR",
    image_url: "/shop-assets/products/jacket-3.jpg",
    hover_image_url: "/shop-assets/products/jacket-4.jpg",
    stock: "1",
    badge: "New",
    is_featured: false,
    is_active: true,
};

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-maroon">{label}</span>
            {children}
        </label>
    );
}

const inputClass = "h-11 w-full rounded-lg border border-line-soft bg-ivory px-4 text-sm text-espresso outline-none transition focus:border-maroon";
const textareaClass = "min-h-28 w-full rounded-lg border border-line-soft bg-ivory px-4 py-3 text-sm text-espresso outline-none transition focus:border-maroon";

export default function AdminPanel() {
    const [adminKey, setAdminKey] = useState(() => localStorage.getItem("slb_admin_key") || "");
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [shopForm, setShopForm] = useState(emptyShop);
    const [productForm, setProductForm] = useState(emptyProduct);
    const [loading, setLoading] = useState(false);

    const activeShops = useMemo(() => shops.filter((shop) => shop.is_active !== false), [shops]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [shopData, productData, statsData] = await Promise.all([
                fetchShops({ active_only: false, limit: 200 }),
                fetchProducts({ active_only: false, limit: 200 }),
                fetchMarketplaceStats(),
            ]);
            setShops(shopData);
            setProducts(productData);
            setStats(statsData);
            setProductForm((current) => ({
                ...current,
                shop_id: current.shop_id || shopData.find((shop) => shop.is_active !== false)?.id || "",
            }));
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Could not load marketplace data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const saveKey = () => {
        localStorage.setItem("slb_admin_key", adminKey);
        toast.success("Admin key saved for this browser");
    };

    const submitShop = async (event) => {
        event.preventDefault();
        try {
            const shop = await createShop(shopForm, adminKey);
            toast.success("Shop added");
            setShopForm(emptyShop);
            setShops((current) => [shop, ...current]);
            setProductForm((current) => ({ ...current, shop_id: current.shop_id || shop.id }));
            loadData();
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Could not add shop");
        }
    };

    const submitProduct = async (event) => {
        event.preventDefault();
        try {
            const payload = {
                ...productForm,
                price: Number(productForm.price),
                compare_at_price: productForm.compare_at_price ? Number(productForm.compare_at_price) : null,
                stock: Number(productForm.stock),
            };
            const product = await createProduct(payload, adminKey);
            toast.success("Product added");
            setProductForm({ ...emptyProduct, shop_id: product.shop_id });
            setProducts((current) => [product, ...current]);
            loadData();
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Could not add product");
        }
    };

    const archiveExistingShop = async (shopId) => {
        try {
            await archiveShop(shopId, adminKey);
            toast.success("Shop archived");
            loadData();
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Could not archive shop");
        }
    };

    const archiveExistingProduct = async (productId) => {
        try {
            await archiveProduct(productId, adminKey);
            toast.success("Product archived");
            loadData();
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Could not archive product");
        }
    };

    return (
        <main className="min-h-screen bg-ivory text-espresso">
            <header className="border-b border-line-soft bg-ivory/90 px-5 py-5 backdrop-blur md:px-12 lg:px-20">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Link to="/" className="font-serif text-3xl tracking-tight">
                            ShopLive<span className="italic text-maroon">Bharat</span>
                        </Link>
                        <p className="mt-1 text-sm text-stone">Admin marketplace control panel</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link to="/shop" className="btn-pill btn-ghost !py-2.5">View shop</Link>
                        <button type="button" onClick={loadData} className="btn-pill btn-primary !py-2.5">
                            <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-5 py-8 md:px-12 lg:px-20">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                    <div className="rounded-xl border border-line-soft bg-cream p-5">
                        <Store className="h-6 w-6 text-maroon" strokeWidth={1.5} />
                        <p className="mt-4 font-serif text-4xl">{stats?.shops ?? activeShops.length}</p>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-stone">Active shops</p>
                    </div>
                    <div className="rounded-xl border border-line-soft bg-cream p-5">
                        <PackagePlus className="h-6 w-6 text-maroon" strokeWidth={1.5} />
                        <p className="mt-4 font-serif text-4xl">{stats?.products ?? products.length}</p>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-stone">Active products</p>
                    </div>
                    <div className="rounded-xl border border-line-soft bg-cream p-5 lg:col-span-2">
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-6 w-6 text-maroon" strokeWidth={1.5} />
                            <div>
                                <p className="font-medium">Admin key</p>
                                <p className="text-xs text-stone">Default local key is shoplivebharat-admin. Set ADMIN_API_KEY in production.</p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <input
                                className={inputClass}
                                value={adminKey}
                                onChange={(event) => setAdminKey(event.target.value)}
                                placeholder="Enter admin key"
                                type="password"
                            />
                            <button type="button" onClick={saveKey} className="btn-pill btn-primary !py-2.5">Save</button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
                    <form onSubmit={submitShop} className="rounded-xl border border-line-soft bg-cream p-5 md:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <Plus className="h-5 w-5 text-maroon" strokeWidth={1.5} />
                            <h2 className="font-serif text-3xl">Add shop</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Shop name">
                                <input className={inputClass} required value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} />
                            </Field>
                            <Field label="Owner name">
                                <input className={inputClass} required value={shopForm.owner_name} onChange={(e) => setShopForm({ ...shopForm, owner_name: e.target.value })} />
                            </Field>
                            <Field label="Owner email">
                                <input className={inputClass} required type="email" value={shopForm.owner_email} onChange={(e) => setShopForm({ ...shopForm, owner_email: e.target.value })} />
                            </Field>
                            <Field label="City">
                                <input className={inputClass} required value={shopForm.city} onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })} />
                            </Field>
                            <Field label="Country">
                                <input className={inputClass} required value={shopForm.country} onChange={(e) => setShopForm({ ...shopForm, country: e.target.value })} />
                            </Field>
                            <Field label="Specialty">
                                <input className={inputClass} required value={shopForm.specialty} onChange={(e) => setShopForm({ ...shopForm, specialty: e.target.value })} />
                            </Field>
                            <Field label="Image URL">
                                <input className={inputClass} value={shopForm.image_url} onChange={(e) => setShopForm({ ...shopForm, image_url: e.target.value })} />
                            </Field>
                            <Field label="Instagram URL">
                                <input className={inputClass} value={shopForm.instagram_url} onChange={(e) => setShopForm({ ...shopForm, instagram_url: e.target.value })} />
                            </Field>
                            <div className="md:col-span-2">
                                <Field label="Description">
                                    <textarea className={textareaClass} required value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} />
                                </Field>
                            </div>
                        </div>
                        <button className="btn-pill btn-primary mt-6" type="submit">Add shop</button>
                    </form>

                    <form onSubmit={submitProduct} className="rounded-xl border border-line-soft bg-cream p-5 md:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <PackagePlus className="h-5 w-5 text-maroon" strokeWidth={1.5} />
                            <h2 className="font-serif text-3xl">Add product</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Shop">
                                <select className={inputClass} required value={productForm.shop_id} onChange={(e) => setProductForm({ ...productForm, shop_id: e.target.value })}>
                                    <option value="">Select shop</option>
                                    {activeShops.map((shop) => <option value={shop.id} key={shop.id}>{shop.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Product name">
                                <input className={inputClass} required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                            </Field>
                            <Field label="Category">
                                <input className={inputClass} required value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                            </Field>
                            <Field label="Badge">
                                <input className={inputClass} value={productForm.badge} onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })} />
                            </Field>
                            <Field label="Price INR">
                                <input className={inputClass} required min="0" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                            </Field>
                            <Field label="Compare at INR">
                                <input className={inputClass} min="0" type="number" value={productForm.compare_at_price} onChange={(e) => setProductForm({ ...productForm, compare_at_price: e.target.value })} />
                            </Field>
                            <Field label="Stock">
                                <input className={inputClass} required min="0" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
                            </Field>
                            <Field label="Featured">
                                <select className={inputClass} value={String(productForm.is_featured)} onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.value === "true" })}>
                                    <option value="false">No</option>
                                    <option value="true">Yes</option>
                                </select>
                            </Field>
                            <Field label="Image URL">
                                <input className={inputClass} required value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} />
                            </Field>
                            <Field label="Hover image URL">
                                <input className={inputClass} value={productForm.hover_image_url} onChange={(e) => setProductForm({ ...productForm, hover_image_url: e.target.value })} />
                            </Field>
                            <div className="md:col-span-2">
                                <Field label="Description">
                                    <textarea className={textareaClass} required value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                                </Field>
                            </div>
                        </div>
                        <button className="btn-pill btn-primary mt-6" type="submit">Add product</button>
                    </form>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
                    <section className="rounded-xl border border-line-soft bg-cream p-5 md:p-7">
                        <h2 className="font-serif text-3xl">Shops</h2>
                        <div className="mt-5 space-y-3">
                            {shops.map((shop) => (
                                <div key={shop.id} className="flex items-center justify-between gap-4 rounded-lg border border-line-soft bg-ivory p-4">
                                    <div>
                                        <p className="font-medium">{shop.name}</p>
                                        <p className="text-sm text-stone">{shop.city} · {shop.specialty}</p>
                                        {shop.is_active === false && <p className="mt-1 text-xs uppercase tracking-[0.2em] text-maroon">Archived</p>}
                                    </div>
                                    {shop.is_active !== false && (
                                        <button type="button" onClick={() => archiveExistingShop(shop.id)} className="h-10 w-10 rounded-full border border-line-soft text-maroon grid place-items-center hover:bg-maroon hover:text-ivory transition-colors" aria-label="Archive shop">
                                            <Archive className="h-4 w-4" strokeWidth={1.5} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-xl border border-line-soft bg-cream p-5 md:p-7">
                        <h2 className="font-serif text-3xl">Products</h2>
                        <div className="mt-5 space-y-3">
                            {products.map((product) => (
                                <div key={product.id} className="flex items-center justify-between gap-4 rounded-lg border border-line-soft bg-ivory p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={product.image_url} alt="" className="h-14 w-14 rounded-md object-cover" />
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-sm text-stone">{product.shop_name} · ₹{Number(product.price).toLocaleString("en-IN")}</p>
                                            {product.is_active === false && <p className="mt-1 text-xs uppercase tracking-[0.2em] text-maroon">Archived</p>}
                                        </div>
                                    </div>
                                    {product.is_active !== false && (
                                        <button type="button" onClick={() => archiveExistingProduct(product.id)} className="h-10 w-10 rounded-full border border-line-soft text-maroon grid place-items-center hover:bg-maroon hover:text-ivory transition-colors" aria-label="Archive product">
                                            <Archive className="h-4 w-4" strokeWidth={1.5} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {loading && <p className="mt-6 text-sm text-stone">Refreshing marketplace data...</p>}
            </section>
        </main>
    );
}
