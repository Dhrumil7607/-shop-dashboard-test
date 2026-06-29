import { useEffect, useState } from "react";
import { Plus, Archive, Edit2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchProducts, createProduct, archiveProduct, updateProduct, fetchShops } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_PRODUCTS } from "@/lib/testData";
import { toast } from "sonner";

const emptyProduct = {
    shop_id: "",
    name: "",
    category: "",
    description: "",
    price: 0,
    compare_at_price: null,
    currency: "INR",
    image_url: "",
    hover_image_url: "",
    stock: 0,
    badge: "New",
    is_featured: false,
    is_active: true,
};

export default function AdminProducts() {
    const { adminKey } = useAuth();
    const [products, setProducts] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyProduct);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        loadProducts();
        loadShops();
    }, []);

    const loadShops = async () => {
        try {
            const data = await fetchShops({ active_only: true, limit: 500 });
            if (data && Array.isArray(data)) {
                setShops(data);
            } else {
                console.warn("Shops data is not an array:", data);
                setShops([]);
            }
        } catch (error) {
            console.error("Failed to load shops:", error);
            toast.error("Failed to load shops - using empty list");
            setShops([]);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await fetchProducts({ active_only: false, limit: 500 });
            if (data && Array.isArray(data)) {
                // If we got products from API, use them
                if (data.length > 0) {
                    setProducts(data);
                } else {
                    // If API returns empty, use mock data
                    console.log("No products from API, using mock data");
                    setProducts(MOCK_PRODUCTS);
                }
            } else {
                // Fallback to mock data
                setProducts(MOCK_PRODUCTS);
            }
        } catch (error) {
            console.error("Failed to load products:", error);
            // Fallback to mock data on error
            setProducts(MOCK_PRODUCTS);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (productId, currentStatus) => {
        setTogglingId(productId);
        try {
            const product = products.find(p => p.id === productId);
            const updatedProduct = { ...product, is_active: !currentStatus };
            
            await updateProduct(productId, updatedProduct, adminKey);
            
            // Update local state immediately for real-time feedback
            setProducts(products.map(p => 
                p.id === productId ? { ...p, is_active: !currentStatus } : p
            ));
            
            toast.success(!currentStatus ? "🟢 Product is now LIVE!" : "🔴 Product is now offline");
        } catch (error) {
            toast.error("Failed to toggle product status");
        } finally {
            setTogglingId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.shop_id) {
                toast.error("Please select a shop");
                return;
            }
            if (!formData.price || formData.price <= 0) {
                toast.error("Price must be greater than 0");
                return;
            }
            if (!formData.image_url) {
                toast.error("Please enter an image URL");
                return;
            }
            if (formData.description.length < 10) {
                toast.error("Description must be at least 10 characters");
                return;
            }

            if (isEditing && editingId) {
                await updateProduct(editingId, formData, adminKey);
                // Update local state immediately
                setProducts(products.map(p => p.id === editingId ? formData : p));
                toast.success("✅ Product updated successfully!");
            } else {
                const newProduct = await createProduct(formData, adminKey);
                // Add new product to local state immediately
                if (newProduct && newProduct.id) {
                    setProducts([newProduct, ...products]);
                    toast.success("✅ Product is now LIVE!");
                }
            }
            setShowForm(false);
            setIsEditing(false);
            setEditingId(null);
            setFormData(emptyProduct);
            // Reload to ensure data consistency
            loadProducts();
        } catch (error) {
            toast.error(error?.response?.data?.detail || "Failed to save product");
        }
    };

    const handleEdit = (product) => {
        setFormData(product);
        setIsEditing(true);
        setEditingId(product.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
        setFormData(emptyProduct);
    };

    const handleArchive = async (productId) => {
        if (!confirm("Archive this product?")) return;
        try {
            await archiveProduct(productId, adminKey);
            toast.success("Product archived");
            loadProducts();
        } catch (error) {
            toast.error("Failed to archive product");
        }
    };

    return (
        <AdminLayout>
            <div className="relative">
                {/* Animated background elements */}
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <motion.div
                        className="absolute top-20 right-1/4 w-80 h-80 bg-gradient-to-br from-maroon/5 to-transparent rounded-full blur-3xl"
                        animate={{
                            y: [0, 40, 0],
                            x: [0, 30, 0],
                        }}
                        transition={{
                            duration: 20,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                </div>

                <motion.div className="flex items-center justify-between mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-3xl font-bold">Products</h1>
                    <motion.button
                        onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                            setFormData(emptyProduct);
                            setShowForm(!showForm);
                        }}
                        whileHover={{ scale: 1.05, boxShadow: "0 8px 32px rgba(139, 58, 58, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-maroon to-maroon-deep text-ivory rounded-lg smooth-transition shadow-lg"
                    >
                        <Plus size={20} />
                        Add Product
                    </motion.button>
                </motion.div>

                {/* Form */}
                {showForm && (
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="glass backdrop-blur-xl bg-gradient-to-br from-white/40 to-white/20 rounded-2xl border border-white/30 shadow-glass-lg p-8 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-6 text-espresso">{isEditing ? "Edit Product" : "Create New Product"}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Shop Selection */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <label className="block text-sm font-medium mb-2 text-espresso">Shop *</label>
                                <select
                                    value={formData.shop_id}
                                    onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                                    className="w-full px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                    required
                                >
                                    <option value="">Select a shop</option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                            </motion.div>

                            {/* Product Name */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                type="text"
                                placeholder="Product Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                required
                            />

                            {/* Category */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                type="text"
                                placeholder="Category *"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                required
                            />

                            {/* Price */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                type="number"
                                placeholder="Price *"
                                min="1"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                required
                            />

                            {/* Compare at Price */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                type="number"
                                placeholder="Compare at Price"
                                min="0"
                                value={formData.compare_at_price || ""}
                                onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value ? parseInt(e.target.value) : null })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                            />

                            {/* Stock */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                type="number"
                                placeholder="Stock"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                            />

                            {/* Badge */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                type="text"
                                placeholder="Badge (e.g., New, Sale)"
                                value={formData.badge}
                                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                            />

                            {/* Image URL */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                type="text"
                                placeholder="Image URL *"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                                required
                            />

                            {/* Hover Image URL */}
                            <motion.input
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                type="text"
                                placeholder="Hover Image URL"
                                value={formData.hover_image_url}
                                onChange={(e) => setFormData({ ...formData, hover_image_url: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40"
                            />

                            {/* Is Featured */}
                            <motion.div
                                className="flex items-center gap-3 rounded-lg glass backdrop-blur-md bg-white/30 border border-white/40 px-4 py-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                            >
                                <input
                                    type="checkbox"
                                    id="featured"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="w-4 h-4 cursor-pointer accent-maroon"
                                />
                                <label htmlFor="featured" className="cursor-pointer text-espresso">Featured Product</label>
                            </motion.div>

                            {/* Description */}
                            <motion.textarea
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                placeholder="Description (min 10 characters) *"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="px-4 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg focus:border-maroon focus:outline-none smooth-transition hover:bg-white/40 md:col-span-2"
                                rows="4"
                                required
                            />
                        </div>
                        <div className="flex gap-4 mt-8">
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2 bg-gradient-to-r from-maroon to-maroon-deep text-ivory rounded-lg shadow-lg smooth-transition"
                            >
                                {isEditing ? "Update Product" : "Create Product"}
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleCancel}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2 glass backdrop-blur-md bg-white/30 border border-white/40 rounded-lg smooth-transition"
                            >
                                Cancel
                            </motion.button>
                        </div>
                    </motion.form>
                )}

                {/* Products Grid View */}
                {loading ? (
                    <motion.div
                        className="flex items-center justify-center h-64"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-12 h-12 border-4 border-maroon/20 border-t-maroon rounded-full"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        className="space-y-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Grid Preview */}
                        <div>
                            <h2 className="text-xl font-bold text-espresso mb-6">Products Preview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {products.slice(0, 12).map((product, idx) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -8 }}
                                        className={`group relative glass backdrop-blur-md rounded-2xl overflow-hidden border-2 smooth-transition shadow-glass ${
                                            product.is_active
                                                ? "border-green-300/50 from-white/40 to-white/20"
                                                : "border-gray-300/30 from-white/20 to-white/10 opacity-75"
                                        }`}
                                    >
                                        {/* Product Image */}
                                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                                            <motion.img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                whileHover={{ scale: 1.08 }}
                                                transition={{ duration: 0.4 }}
                                                onError={(e) => {
                                                    e.target.src = "/shop-assets/banner-1.jpg";
                                                }}
                                            />

                                            {/* Badge */}
                                            {product.badge && (
                                                <motion.div
                                                    className="absolute top-3 left-3 bg-gradient-to-r from-maroon to-maroon-deep text-ivory px-3 py-1 rounded-lg text-xs font-bold shadow-lg"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.2 }}
                                                >
                                                    {product.badge}
                                                </motion.div>
                                            )}

                                            {/* Discount Badge */}
                                            {product.compare_at_price && product.compare_at_price > product.price && (
                                                <motion.div
                                                    className="absolute top-3 right-3 bg-gradient-to-r from-green-400 to-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 }}
                                                >
                                                    -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                                                </motion.div>
                                            )}

                                            {/* Status Overlay */}
                                            {!product.is_active && (
                                                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                                    <span className="bg-gray-700/80 text-white px-3 py-1 rounded-lg text-xs font-bold backdrop-blur">
                                                        OFFLINE
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="p-4">
                                            <p className="text-xs text-maroon font-semibold uppercase mb-1">
                                                {product.category}
                                            </p>
                                            <h3 className="text-sm font-serif text-espresso mb-3 line-clamp-2 group-hover:text-maroon smooth-transition">
                                                {product.name}
                                            </h3>

                                            {/* Price */}
                                            <div className="mb-3">
                                                <p className="text-lg font-bold gradient-text">
                                                    {product.currency} {product.price.toLocaleString()}
                                                </p>
                                                {product.compare_at_price && product.compare_at_price > product.price && (
                                                    <p className="text-xs text-espresso/50 line-through">
                                                        {product.currency} {product.compare_at_price.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Stock */}
                                            <p className={`text-xs font-semibold mb-3 smooth-transition ${
                                                product.stock > 0 ? "text-green-600" : "text-red-600"
                                            }`}>
                                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                                            </p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    onClick={() => handleToggleActive(product.id, product.is_active)}
                                                    disabled={togglingId === product.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`flex-1 text-xs px-2 py-2 rounded-lg font-medium smooth-transition flex items-center justify-center gap-1 ${
                                                        product.is_active
                                                            ? "bg-gradient-to-r from-green-200/50 to-green-100/50 text-green-700 hover:from-green-300/60 hover:to-green-200/60 border border-green-300/30"
                                                            : "bg-gradient-to-r from-gray-200/50 to-gray-100/50 text-gray-700 hover:from-gray-300/60 hover:to-gray-200/60 border border-gray-300/30"
                                                    } disabled:opacity-50`}
                                                >
                                                    {togglingId === product.id ? (
                                                        <>⏳</>
                                                    ) : product.is_active ? (
                                                        <>👁️ LIVE</>
                                                    ) : (
                                                        <>👁️‍🗨️ OFF</>
                                                    )}
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleEdit(product)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex-1 text-xs px-2 py-2 bg-gradient-to-r from-blue-200/50 to-blue-100/50 text-blue-700 rounded-lg hover:from-blue-300/60 hover:to-blue-200/60 font-medium smooth-transition border border-blue-300/30"
                                                >
                                                    Edit
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <motion.div
                            className="border-t-2 border-gradient-to-r from-maroon/20 via-gold/20 to-maroon/20 my-8"
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            transition={{ duration: 0.8 }}
                        />

                        {/* Table View */}
                        <div>
                            <h2 className="text-xl font-bold text-espresso mb-6">All Products ({products.length})</h2>
                            <motion.div
                                className="glass backdrop-blur-md bg-white/30 rounded-2xl border border-white/30 overflow-hidden shadow-glass-lg"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-maroon/5 to-gold/5 border-b border-white/20 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-espresso">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-espresso">Shop</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-espresso">Category</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-espresso">Price</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-espresso">Stock</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-espresso">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-espresso">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product, idx) => (
                                    <motion.tr
                                        key={product.id}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="border-b border-white/20 hover:bg-white/20 smooth-transition"
                                    >
                                        <td className="px-6 py-4 text-sm text-espresso font-medium">{product.name}</td>
                                        <td className="px-6 py-4 text-sm text-espresso/60">{product.shop_name || "N/A"}</td>
                                        <td className="px-6 py-4 text-sm text-espresso/60">{product.category}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-maroon">
                                            {product.currency} {product.price}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-espresso">{product.stock}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <motion.button
                                                onClick={() => handleToggleActive(product.id, product.is_active)}
                                                disabled={togglingId === product.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`px-3 py-2 rounded-lg font-medium text-xs smooth-transition flex items-center gap-2 ${
                                                    product.is_active
                                                        ? "bg-gradient-to-r from-green-200/50 to-green-100/50 text-green-700 hover:from-green-300/60 hover:to-green-200/60 border border-green-300/30"
                                                        : "bg-gradient-to-r from-gray-200/50 to-gray-100/50 text-gray-700 hover:from-gray-300/60 hover:to-gray-200/60 border border-gray-300/30"
                                                } disabled:opacity-50`}
                                            >
                                                {togglingId === product.id ? (
                                                    <>⏳ Updating...</>
                                                ) : product.is_active ? (
                                                    <>
                                                        <Eye size={14} />
                                                        LIVE
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff size={14} />
                                                        OFFLINE
                                                    </>
                                                )}
                                            </motion.button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <motion.button
                                                    onClick={() => handleEdit(product)}
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-blue-600 hover:text-blue-700 smooth-transition"
                                                >
                                                    <Edit2 size={18} />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleArchive(product.id)}
                                                    whileHover={{ scale: 1.15 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-maroon hover:text-maroon/70 smooth-transition"
                                                >
                                                    <Archive size={18} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
}
