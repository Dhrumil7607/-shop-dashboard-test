import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/api";

export default function Account() {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        city: user?.city || "",
    });

    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login", { replace: true });
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user?.name || "",
                email: user?.email || "",
                phone: user?.phone || "",
                city: user?.city || "",
            });
        }
    }, [user]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await updateUserProfile(profileData);
            toast.success("Profile updated successfully");
            setEditing(false);
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <MarketplaceLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader size={32} className="animate-spin text-maroon" />
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout>
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
                {/* Header */}
                <div className="mb-8 md:mb-12">
                    <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl mb-3 text-espresso">
                        My Account
                    </h1>
                    <p className="text-lg text-espresso/70">
                        Manage your profile and preferences
                    </p>
                </div>

                {/* Profile Section */}
                <div className="border border-line-soft rounded-lg p-8 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-semibold text-espresso">Profile Information</h2>
                        <button
                            onClick={() => (editing ? setEditing(false) : setEditing(true))}
                            className="flex items-center gap-2 px-4 py-2 text-maroon font-medium hover:bg-maroon/5 transition rounded-lg"
                        >
                            {editing ? (
                                <>
                                    <X size={18} />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Edit2 size={18} />
                                    Edit
                                </>
                            )}
                        </button>
                    </div>

                    {/* Profile Form */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-espresso mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) =>
                                        setProfileData({
                                            ...profileData,
                                            name: e.target.value,
                                        })
                                    }
                                    disabled={!editing}
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none transition disabled:bg-gray-50 disabled:text-espresso/60"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-espresso mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg bg-gray-50 text-espresso/60"
                                />
                                <p className="text-xs text-espresso/60 mt-2">Email cannot be changed</p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-espresso mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) =>
                                        setProfileData({
                                            ...profileData,
                                            phone: e.target.value,
                                        })
                                    }
                                    disabled={!editing}
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none transition disabled:bg-gray-50 disabled:text-espresso/60"
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-espresso mb-2">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={profileData.city}
                                    onChange={(e) =>
                                        setProfileData({
                                            ...profileData,
                                            city: e.target.value,
                                        })
                                    }
                                    disabled={!editing}
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none transition disabled:bg-gray-50 disabled:text-espresso/60"
                                />
                            </div>
                        </div>

                        {/* Save Button */}
                        {editing && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-maroon text-ivory rounded-lg font-semibold hover:bg-maroon/90 transition disabled:opacity-50"
                                >
                                    {loading && <Loader size={18} className="animate-spin" />}
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        to="/orders"
                        className="border border-line-soft rounded-lg p-6 hover:shadow-md transition group"
                    >
                        <h3 className="text-lg font-semibold text-espresso mb-2 group-hover:text-maroon transition">
                            My Orders
                        </h3>
                        <p className="text-espresso/60 text-sm">
                            View and track your orders
                        </p>
                    </Link>

                    <Link
                        to="/account/size-profiles"
                        className="border border-line-soft rounded-lg p-6 hover:shadow-md transition group"
                    >
                        <h3 className="text-lg font-semibold text-espresso mb-2 group-hover:text-maroon transition">
                            My Size Profiles
                        </h3>
                        <p className="text-espresso/60 text-sm">
                            Save measurements for faster, accurate sizing
                        </p>
                    </Link>

                    <Link
                        to="/account/bookings"
                        className="border border-line-soft rounded-lg p-6 hover:shadow-md transition group"
                    >
                        <h3 className="text-lg font-semibold text-espresso mb-2 group-hover:text-maroon transition">
                            My Bookings
                        </h3>
                        <p className="text-espresso/60 text-sm">
                            Manage your live shopping sessions
                        </p>
                    </Link>

                    <Link
                        to="/marketplace"
                        className="border border-line-soft rounded-lg p-6 hover:shadow-md transition group"
                    >
                        <h3 className="text-lg font-semibold text-espresso mb-2 group-hover:text-maroon transition">
                            Browse Collections
                        </h3>
                        <p className="text-espresso/60 text-sm">
                            Discover authentic Indian fashion
                        </p>
                    </Link>

                    <Link
                        to="/live-shopping"
                        className="border border-line-soft rounded-lg p-6 hover:shadow-md transition group"
                    >
                        <h3 className="text-lg font-semibold text-espresso mb-2 group-hover:text-maroon transition">
                            Live Video Shopping
                        </h3>
                        <p className="text-espresso/60 text-sm">
                            Book a personal styling session
                        </p>
                    </Link>

                    <Link
                        to="/settings"
                        className="border border-line-soft rounded-lg p-6 hover:shadow-md transition group"
                    >
                        <h3 className="text-lg font-semibold text-espresso mb-2 group-hover:text-maroon transition">
                            Settings
                        </h3>
                        <p className="text-espresso/60 text-sm">
                            Account preferences and security
                        </p>
                    </Link>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
