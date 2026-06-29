import { useEffect, useState } from "react";
import { Plus, Archive, MapPin, Mail, Edit2, Eye, EyeOff } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { fetchShops, createShop, archiveShop, updateShop } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const emptyShop = {
    name: "",
    owner_name: "",
    owner_email: "",
    city: "",
    country: "India",
    specialty: "",
    description: "",
    image_url: "",
    instagram_url: "",
    is_active: true,
};

export default function AdminShops() {
    const { adminKey } = useAuth();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyShop);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = async () => {
        try {
            console.log("Loading shops...");
            const data = await fetchShops({ active_only: false, limit: 500 });
            console.log("Shops loaded:", data);
            if (data && Array.isArray(data) && data.length > 0) {
                console.log(`✅ Loaded ${data.length} shops`);
                setShops(data);
            } else if (data && Array.isArray(data)) {
                console.warn("⚠️ No shops available");
                setShops([]);
            } else {
                console.warn("⚠️ Shops data is not an array:", data);
                setShops([]);
            }
        } catch (error) {
            console.error("❌ Failed to load shops:", error);
            toast.error("Failed to load shops");
            setShops([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (shopId, currentStatus) => {
        setTogglingId(shopId);
        try {
            const shop = shops.find(s => s.id === shopId);
            const updatedShop = { ...shop, is_active: !currentStatus };
            
            await updateShop(shopId, updatedShop, adminKey);
            
            // Update local state immediately for real-time feedback
            setShops(shops.map(s => 
                s.id === shopId ? { ...s, is_active: !currentStatus } : s
            ));
            
            toast.success(!currentStatus ? "🟢 Shop is now LIVE!" : "🔴 Shop is now offline");
        } catch (error) {
            toast.error("Failed to toggle shop status");
        } finally {
            setTogglingId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log("📝 Saving shop with data:", formData);
            console.log("🔑 Admin key present:", !!adminKey);
            
            if (!formData.name || formData.name.length < 2) {
                toast.error("Shop name must be at least 2 characters");
                return;
            }
            if (!formData.owner_name || formData.owner_name.length < 2) {
                toast.error("Owner name must be at least 2 characters");
                return;
            }
            if (!formData.owner_email) {
                toast.error("Owner email is required");
                return;
            }
            if (!formData.city || formData.city.length < 2) {
                toast.error("City must be at least 2 characters");
                return;
            }
            if (!formData.specialty || formData.specialty.length < 2) {
                toast.error("Specialty must be at least 2 characters");
                return;
            }
            if (!formData.description || formData.description.length < 10) {
                toast.error("Description must be at least 10 characters");
                return;
            }
            if (!formData.image_url) {
                toast.error("Please enter a shop image URL");
                return;
            }

            if (isEditing && editingId) {
                console.log("✏️ Updating shop:", editingId);
                const result = await updateShop(editingId, formData, adminKey);
                console.log("✅ Shop updated:", result);
                // Update local state immediately
                setShops(shops.map(s => s.id === editingId ? result : s));
                toast.success("✅ Shop updated successfully!");
            } else {
                console.log("➕ Creating new shop");
                const newShop = await createShop(formData, adminKey);
                console.log("✅ New shop created:", newShop);
                // Add new shop to local state immediately
                if (newShop && newShop.id) {
                    setShops([newShop, ...shops]);
                    toast.success("✅ Shop is now LIVE!");
                }
            }
            setShowForm(false);
            setIsEditing(false);
            setEditingId(null);
            setFormData(emptyShop);
            // Reload to ensure data consistency
            loadShops();
        } catch (error) {
            console.error("❌ Error saving shop:", error);
            console.error("Response data:", error?.response?.data);
            console.error("Error message:", error?.message);
            const errorMessage = error?.response?.data?.detail || error?.message || "Failed to save shop";
            console.error("Final error message:", errorMessage);
            toast.error(`❌ ${errorMessage}`);
        }
    };

    const handleEdit = (shop) => {
        setFormData(shop);
        setIsEditing(true);
        setEditingId(shop.id);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
        setFormData(emptyShop);
    };

    const handleArchive = async (shopId) => {
        if (!confirm("Archive this shop?")) return;
        try {
            await archiveShop(shopId, adminKey);
            toast.success("Shop archived");
            loadShops();
        } catch (error) {
            toast.error("Failed to archive shop");
        }
    };

    return (
        <AdminLayout>
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Shops</h1>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                            setFormData(emptyShop);
                            setShowForm(!showForm);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition"
                    >
                        <Plus size={20} />
                        Add Shop
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-line-soft p-6 mb-8">
                        <h2 className="text-xl font-bold mb-6">{isEditing ? "Edit Shop" : "Create New Shop"}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Shop Name */}
                            <input
                                type="text"
                                placeholder="Shop Name (min 2 characters) *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                required
                                minLength="2"
                            />
                            {/* Owner Name */}
                            <input
                                type="text"
                                placeholder="Owner Name (min 2 characters) *"
                                value={formData.owner_name}
                                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                required
                                minLength="2"
                            />
                            <input
                                type="email"
                                placeholder="Owner Email *"
                                value={formData.owner_email}
                                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                required
                            />
                            <input
                                type="text"
                                placeholder="City (min 2 characters) *"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                required
                                minLength="2"
                            />
                            <input
                                type="text"
                                placeholder="Country"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Specialty (min 2 characters) *"
                                value={formData.specialty}
                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Shop Image URL *"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Instagram URL"
                                value={formData.instagram_url}
                                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none"
                            />
                            <textarea
                                placeholder="Description (min 10 characters) *"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="px-4 py-2 border border-line-soft rounded-lg focus:border-maroon outline-none md:col-span-2"
                                rows="4"
                                required
                            />
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition"
                            >
                                {isEditing ? "Update Shop" : "Create Shop"}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2 border border-line-soft rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Shops Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin w-12 h-12 border-4 border-maroon/20 border-t-maroon rounded-full mb-4"></div>
                            <p className="text-espresso/60">Loading shops...</p>
                        </div>
                    </div>
                ) : shops.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-espresso/60 text-lg mb-4">No shops yet</p>
                            <p className="text-espresso/50 mb-6">Create your first shop to get started</p>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditingId(null);
                                    setFormData(emptyShop);
                                    setShowForm(true);
                                }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition"
                            >
                                <Plus size={20} />
                                Create First Shop
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shops.map((shop) => (
                            <div
                                key={shop.id}
                                className="bg-white rounded-lg border border-line-soft overflow-hidden hover:shadow-lg transition"
                            >
                                {/* Shop Image */}
                                <div className="h-40 bg-gray-100 overflow-hidden">
                                    <img
                                        src={shop.image_url}
                                        alt={shop.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = "/shop-assets/banner-1.jpg";
                                        }}
                                    />
                                </div>

                                {/* Shop Details */}
                                <div className="p-6">
                                    <h3 className="font-bold text-lg mb-2">{shop.name}</h3>
                                    <p className="text-sm text-espresso/60 mb-4">{shop.description}</p>

                                    <div className="space-y-2 text-sm mb-6">
                                        <div className="flex items-center gap-2 text-espresso/70">
                                            <MapPin size={16} />
                                            {shop.city}, {shop.country}
                                        </div>
                                        <div className="flex items-center gap-2 text-espresso/70">
                                            <Mail size={16} />
                                            {shop.owner_email}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-line-soft gap-3">
                                        <button
                                            onClick={() => handleToggleActive(shop.id, shop.is_active)}
                                            disabled={togglingId === shop.id}
                                            className={`text-xs px-3 py-2 rounded-lg font-medium transition flex items-center gap-1.5 flex-1 justify-center ${
                                                shop.is_active
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            } disabled:opacity-50`}
                                        >
                                            {togglingId === shop.id ? (
                                                <>⏳ Updating...</>
                                            ) : shop.is_active ? (
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
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(shop)}
                                                className="text-blue-600 hover:text-blue-700 transition p-2"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleArchive(shop.id)}
                                                className="text-maroon hover:text-maroon/70 transition p-2"
                                            >
                                                <Archive size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
