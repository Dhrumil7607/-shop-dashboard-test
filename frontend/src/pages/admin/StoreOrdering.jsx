/**
 * StoreOrdering.jsx — /admin/store-ordering
 * Admin controls which stores appear in public listing and the Book a Session page.
 * Admin can also edit store images and set display_order (position).
 * Backend is source of truth — all changes persist immediately.
 */
import { useState, useEffect, useCallback } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Video, VideoOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import ImageUpload from "@/components/ImageUpload";
import { fetchAdminShopsOrdered, adminSetShopOrder, api } from "@/lib/api";

export default function StoreOrdering() {
  const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editImage, setEditImage] = useState(null); // { shopId, field }

  const load = useCallback(async () => {
    setLoading(true);
    try { setShops(await fetchAdminShopsOrdered(adminKey)); }
    catch { toast.error("Could not load stores"); }
    finally { setLoading(false); }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const move = async (idx, dir) => {
    const next = [...shops];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    // Swap and recalculate display_order
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    // Assign sequential display_order (1-based)
    const updates = next.map((s, i) => ({ id: s.id, display_order: i + 1 }));
    setShops(next.map((s, i) => ({ ...s, display_order: i + 1 })));
    try {
      await Promise.all(updates.map(({ id, display_order }) =>
        adminSetShopOrder(id, { display_order }, adminKey)));
    } catch { toast.error("Could not save order"); load(); }
  };

  const toggle = async (shopId, field, currentValue) => {
    try {
      await adminSetShopOrder(shopId, { [field]: !currentValue }, adminKey);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, [field]: !currentValue } : s));
      toast.success("Updated");
    } catch { toast.error("Could not update"); }
  };

  const updateImage = async (shopId, field, url) => {
    try {
      await api.patch(`/admin/shops/${shopId}`, { [field]: url }, { headers: { "X-Admin-Key": adminKey } });
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, [field]: url } : s));
      setEditImage(null);
      toast.success("Image updated");
    } catch { toast.error("Could not update image"); }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Store Ordering & Visibility</h1>
          <p className="text-sm mt-1" style={{ color: "#9B8B7A" }}>
            Control which stores show publicly and the order they appear in. Edit images from here.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs" style={{ color: "#9B8B7A" }}>
        <span className="flex items-center gap-1"><Eye size={13} style={{ color: "#2D7A3A" }} /> Visible in Shop by Stores</span>
        <span className="flex items-center gap-1"><Video size={13} style={{ color: "#C0392B" }} /> Shown in Book a Session</span>
        <span className="flex items-center gap-1"><ArrowUp size={13} /> Reorder position</span>
      </div>

      {loading ? (
        <p className="text-center py-16" style={{ color: "#9B8B7A" }}>Loading...</p>
      ) : (
        <div className="space-y-2">
          {shops.map((shop, idx) => {
            const isPublic = shop.is_active && shop.online !== false && shop.status !== "suspended";
            return (
              <div key={shop.id} className="bg-white rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: "#E8E4DF" }}>
                {/* Order indicator */}
                <div className="text-xs font-bold w-6 text-center flex-shrink-0" style={{ color: "#9B8B7A" }}>
                  {idx + 1}
                </div>

                {/* Image + edit */}
                <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden cursor-pointer"
                  style={{ backgroundColor: "#F0EBE3" }}
                  onClick={() => setEditImage({ shopId: shop.id, field: "image_url", current: shop.image_url })}>
                  {shop.image_url
                    ? <img src={shop.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[10px] font-medium" style={{ color: "#9B8B7A" }}>No img</div>
                  }
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition text-white text-[9px] font-bold">Edit</div>
                </div>

                {/* Name + details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#1a1a1a" }}>{shop.name || "—"}</p>
                  <p className="text-xs truncate" style={{ color: "#9B8B7A" }}>{shop.city || ""}{shop.specialty ? ` · ${shop.specialty}` : ""}</p>
                </div>

                {/* Visibility toggles */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggle(shop.id, "online", shop.online)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition"
                    style={{
                      backgroundColor: isPublic ? "rgba(45,122,58,0.08)" : "white",
                      color: isPublic ? "#2D7A3A" : "#9B8B7A",
                      borderColor: isPublic ? "#2D7A3A" : "#E8E4DF",
                    }}
                    title="Toggle store online/offline"
                  >
                    {isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
                    {isPublic ? "Online" : "Offline"}
                  </button>

                  <button
                    onClick={() => toggle(shop.id, "show_in_booking_page", shop.show_in_booking_page)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition"
                    style={{
                      backgroundColor: shop.show_in_booking_page ? "rgba(192,57,43,0.08)" : "white",
                      color: shop.show_in_booking_page ? "#C0392B" : "#9B8B7A",
                      borderColor: shop.show_in_booking_page ? "#C0392B" : "#E8E4DF",
                    }}
                    title="Show in Book a Session section"
                  >
                    {shop.show_in_booking_page ? <Video size={12} /> : <VideoOff size={12} />}
                    Book a Session
                  </button>
                </div>

                {/* Reorder arrows */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0}
                    className="p-1 rounded hover:bg-stone-100 disabled:opacity-30">
                    <ArrowUp size={14} style={{ color: "#6B5E52" }} />
                  </button>
                  <button onClick={() => move(idx, 1)} disabled={idx === shops.length - 1}
                    className="p-1 rounded hover:bg-stone-100 disabled:opacity-30">
                    <ArrowDown size={14} style={{ color: "#6B5E52" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image edit modal */}
      {editImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Edit Store Image</h3>
            <ImageUpload
              label="Store Logo / Image"
              value={editImage.current}
              onUpload={url => setEditImage(prev => ({ ...prev, current: url }))}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditImage(null)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "#E8E4DF" }}>Cancel</button>
              <button onClick={() => updateImage(editImage.shopId, editImage.field, editImage.current)}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#1a1a1a" }}>
                Save Image
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
