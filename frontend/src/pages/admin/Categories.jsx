/**
 * Admin > Categories
 * Manage the "Shop by Category" section on the homepage.
 * Admin can add, edit, reorder, show/hide, and delete categories.
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, X, Eye, EyeOff, RefreshCw,
  GripVertical, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import ImageUpload from "@/components/ImageUpload";
import {
  fetchAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory,
} from "@/lib/api";

const DEFAULT_FORM = {
  label: "", caption: "", image_url: "", display_order: 10, visible: true,
};

function CategoryModal({ initial, onSave, onClose, loading }) {
  const [form, setForm] = useState(initial || DEFAULT_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>
            {initial ? "Edit Category" : "Add Category"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#6B5E52" }}>
              Category Name *
            </label>
            <input
              value={form.label}
              onChange={e => set("label", e.target.value)}
              placeholder="e.g. Sarees"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2"
              style={{ borderColor: "#E8E4DF", focusRingColor: "#C9A84C" }}
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#6B5E52" }}>
              Caption / Subtitle
            </label>
            <input
              value={form.caption}
              onChange={e => set("caption", e.target.value)}
              placeholder="e.g. Draped in tradition"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              style={{ borderColor: "#E8E4DF" }}
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#6B5E52" }}>
              Category Image
            </label>
            <ImageUpload
              label="Category Image"
              value={form.image_url}
              onUpload={url => set("image_url", url)}
            />
            {/* Also allow direct URL */}
            <input
              value={form.image_url}
              onChange={e => set("image_url", e.target.value)}
              placeholder="Or paste an image URL…"
              className="mt-2 w-full px-3 py-2 border rounded-lg text-xs outline-none"
              style={{ borderColor: "#E8E4DF" }}
            />
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#6B5E52" }}>
              Display Order (lower = first)
            </label>
            <input
              type="number"
              min={1}
              value={form.display_order}
              onChange={e => set("display_order", parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              style={{ borderColor: "#E8E4DF" }}
            />
          </div>

          {/* Visible toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "#F9F7F4" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Visible on Homepage</p>
              <p className="text-xs" style={{ color: "#9B8B7A" }}>Hide to remove from Shop by Category section</p>
            </div>
            <button
              type="button"
              onClick={() => set("visible", !form.visible)}
              className="relative flex-shrink-0 rounded-full transition-colors"
              style={{
                width: 48, height: 26, border: "none", cursor: "pointer",
                backgroundColor: form.visible ? "#2D7A3A" : "#D1CFC9",
              }}
              aria-pressed={form.visible}
            >
              <span
                className="rounded-full"
                style={{
                  position: "absolute", top: 3, left: 3, width: 20, height: 20,
                  backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  transform: form.visible ? "translateX(22px)" : "translateX(0)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition hover:bg-gray-50"
            style={{ borderColor: "#E8E4DF" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.label.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition"
            style={{
              backgroundColor: "#1a1a1a",
              opacity: (loading || !form.label.trim()) ? 0.6 : 1,
            }}
          >
            {loading ? "Saving…" : "Save Category"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");
  const [editModal, setEditModal] = useState(null); // null | { category } | "new"
  const [deleteConfirm, setDeleteConfirm] = useState(null); // category object
  const [loading, setLoading] = useState(false);

  const adminKey = localStorage.getItem("slb_admin_key") || "shoplivebharat-admin";

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await fetchAdminCategories(adminKey);
      setCategories(data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not load categories");
      setCategories([]);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setLoading(true);
    try {
      if (editModal === "new") {
        await createAdminCategory(form, adminKey);
        toast.success("Category created");
      } else {
        await updateAdminCategory(editModal.id, form, adminKey);
        toast.success("Category updated");
      }
      setEditModal(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not save category");
    } finally { setLoading(false); }
  };

  const handleDelete = async (cat) => {
    setLoading(true);
    try {
      await deleteAdminCategory(cat.id, adminKey);
      toast.success("Category deleted");
      setDeleteConfirm(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not delete");
    } finally { setLoading(false); }
  };

  const toggleVisible = async (cat) => {
    try {
      await updateAdminCategory(cat.id, { visible: !cat.visible }, adminKey);
      toast.success(cat.visible ? "Category hidden" : "Category visible");
      load();
    } catch { toast.error("Could not update"); }
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>Shop by Category</h1>
            <p className="text-sm mt-1" style={{ color: "#9B8B7A" }}>
              Edit the categories shown on the homepage. Changes update immediately on the site.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition hover:bg-gray-50"
              style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setEditModal("new")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <Plus size={14} /> Add Category
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>
        )}

        {/* Preview note */}
        <div className="mb-5 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FCD34D" }}>
          <CheckCircle2 size={16} style={{ color: "#92400E" }} />
          <p className="text-sm" style={{ color: "#92400E" }}>
            Categories shown below appear in the "Shop by Category" section on the homepage. Toggle visibility to show/hide without deleting. Order by display_order field.
          </p>
        </div>

        {categories === null ? (
          <div className="text-center py-16"><p style={{ color: "#9B8B7A" }}>Loading categories…</p></div>
        ) : (
          <>
            {/* Grid preview */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9B8B7A" }}>
                Homepage Preview ({categories.filter(c => c.visible).length} visible)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.filter(c => c.visible).map(cat => (
                  <div key={cat.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                    style={{ opacity: cat.visible ? 1 : 0.4 }}>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.label}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=300"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs"
                        style={{ color: "#9B8B7A" }}>No image</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-xs">{cat.label}</p>
                      {cat.caption && <p className="text-white/70 text-[10px]">{cat.caption}</p>}
                    </div>
                  </div>
                ))}
                {categories.filter(c => c.visible).length === 0 && (
                  <div className="col-span-4 text-center py-8 rounded-xl border" style={{ borderColor: "#E8E4DF", color: "#9B8B7A" }}>
                    No visible categories — enable at least one below.
                  </div>
                )}
              </div>
            </div>

            {/* Category list */}
            <AnimatePresence>
              <div className="space-y-2">
                {categories.map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="flex items-center gap-4 rounded-xl border p-4"
                    style={{
                      backgroundColor: cat.visible ? "white" : "#F9F9F9",
                      borderColor: cat.visible ? "#E8E4DF" : "#EBEBEB",
                      opacity: cat.visible ? 1 : 0.65,
                    }}
                  >
                    {/* Drag handle (visual only) */}
                    <GripVertical size={16} style={{ color: "#C9C0B8", flexShrink: 0 }} />

                    {/* Image preview */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: "#F0EBE3" }}>
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.label} className="w-full h-full object-cover"
                          onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=100"; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ color: "#9B8B7A" }}>No img</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>{cat.label}</p>
                        {!cat.visible && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>Hidden</span>
                        )}
                      </div>
                      {cat.caption && <p className="text-xs" style={{ color: "#9B8B7A" }}>{cat.caption}</p>}
                      <p className="text-[10px] mt-0.5" style={{ color: "#C9C0B8" }}>Order: {cat.display_order}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleVisible(cat)}
                        className="p-2 rounded-lg transition hover:bg-gray-100"
                        title={cat.visible ? "Hide category" : "Show category"}
                        style={{ color: cat.visible ? "#2D7A3A" : "#9B8B7A" }}
                      >
                        {cat.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button
                        onClick={() => setEditModal(cat)}
                        className="p-2 rounded-lg transition hover:bg-gray-100"
                        title="Edit category"
                        style={{ color: "#6B5E52" }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(cat)}
                        className="p-2 rounded-lg transition hover:bg-red-50"
                        title="Delete category"
                        style={{ color: "#C0392B" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-16 rounded-xl border" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                    <p className="font-semibold mb-1" style={{ color: "#1a1a1a" }}>No categories yet</p>
                    <p className="text-sm" style={{ color: "#9B8B7A" }}>Click "Add Category" to create your first one.</p>
                  </div>
                )}
              </div>
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Edit / New Modal */}
      <AnimatePresence>
        {editModal && (
          <CategoryModal
            initial={editModal === "new" ? null : editModal}
            onSave={handleSave}
            onClose={() => setEditModal(null)}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold mb-2" style={{ color: "#1a1a1a" }}>Delete Category?</h2>
              <p className="text-sm mb-5" style={{ color: "#6B5E52" }}>
                Permanently delete "<strong>{deleteConfirm.label}</strong>"? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} disabled={loading}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "#E8E4DF" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={loading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: "#C0392B", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
