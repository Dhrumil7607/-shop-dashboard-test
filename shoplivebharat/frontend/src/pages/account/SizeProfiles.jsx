/**
 * SizeProfiles.jsx
 *
 * Page component for /account/size-profiles — the Size Profile Manager.
 *
 * Requirements: 1.1, 1.2, 1.6, 1.7, 1.8, 1.11, 15.4
 *
 * Auth guard: redirects unauthenticated users to /login?returnTo=/account/size-profiles.
 * Wrapping: the route in App.js already wraps this in MarketplaceLayout; this file
 *           exports the raw page content rendered inside MarketplaceLayout.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Ruler, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import sizeProfileService from "@/services/sizeProfileService";
import SizeProfileCard from "@/components/SizeProfile/SizeProfileCard";
import SizeProfileForm from "@/components/SizeProfile/SizeProfileForm";

// ─── constants ───────────────────────────────────────────────────────────────
const MAX_PROFILES = 10;

// ─── skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-line-soft rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
        </div>
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-2.5 w-10 bg-gray-100 rounded mb-1" />
            <div className="h-4 w-14 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1 border-t border-line-soft">
        <div className="h-10 w-10 bg-gray-100 rounded-lg" />
        <div className="h-10 w-10 bg-gray-100 rounded-lg" />
        <div className="h-10 w-10 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(162,70,107,0.08)" }}
      >
        <Ruler size={36} style={{ color: "#A2466B" }} aria-hidden="true" />
      </div>
      <h2 className="font-serif text-2xl text-espresso mb-2">
        No size profiles yet
      </h2>
      <p className="text-espresso/60 mb-8 max-w-sm">
        Create your first size profile to get personalised size recommendations
        at checkout and with the AI Size Finder.
      </p>
      <motion.button
        type="button"
        onClick={onAdd}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm min-h-[48px]"
        style={{ background: "#A2466B", color: "#FFF8F0" }}
      >
        <Plus size={16} aria-hidden="true" />
        Create your first profile
      </motion.button>
    </motion.div>
  );
}

// ─── limit error banner ───────────────────────────────────────────────────────
function LimitBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      role="alert"
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
      style={{
        background: "rgba(239,68,68,0.07)",
        border: "1.5px solid rgba(239,68,68,0.25)",
        color: "#dc2626",
      }}
    >
      <AlertCircle size={16} aria-hidden="true" className="shrink-0" />
      You've reached the 10-profile limit. Delete an existing profile to add a
      new one.
    </motion.div>
  );
}

// ─── modal overlay ────────────────────────────────────────────────────────────
function FormModal({ children }) {
  return (
    <motion.div
      key="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: "rgba(44,36,27,0.45)" }}
      aria-modal="true"
      role="dialog"
      aria-label="Size profile form"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── main page component ─────────────────────────────────────────────────────
export default function SizeProfiles() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  // ── local state ──────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null); // SizeProfile | null
  const [showLimitError, setShowLimitError] = useState(false);

  // ── auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login?returnTo=/account/size-profiles", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // ── load profiles on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    try {
      const loaded = sizeProfileService.list(user.id);
      setProfiles(loaded);
    } catch (err) {
      toast.error("Failed to load size profiles.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  // ── derived helpers ───────────────────────────────────────────────────────
  const existingNames = profiles.map((p) => p.profile_name);
  const atLimit = profiles.length >= MAX_PROFILES;

  // ── open / close form ────────────────────────────────────────────────────
  const handleOpenAdd = useCallback(() => {
    if (atLimit) {
      setShowLimitError(true);
      return;
    }
    setShowLimitError(false);
    setEditingProfile(null);
    setShowForm(true);
  }, [atLimit]);

  const handleOpenEdit = useCallback((profile) => {
    setShowLimitError(false);
    setEditingProfile(profile);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingProfile(null);
  }, []);

  // ── CREATE ────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(
    (formData) => {
      try {
        const created = sizeProfileService.create(user.id, formData);
        setProfiles((prev) => [...prev, created]);
        handleCloseForm();
        toast.success(`Profile "${created.profile_name}" created.`);
      } catch (err) {
        toast.error(err.message || "Failed to create profile.");
      }
    },
    [user, handleCloseForm]
  );

  // ── UPDATE (edit / rename) ────────────────────────────────────────────────
  const handleUpdate = useCallback(
    (formData) => {
      if (!editingProfile) return;
      try {
        const updated = sizeProfileService.update(
          user.id,
          editingProfile.id,
          formData
        );
        setProfiles((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        handleCloseForm();
        toast.success(`Profile "${updated.profile_name}" updated.`);
      } catch (err) {
        toast.error(err.message || "Failed to update profile.");
      }
    },
    [user, editingProfile, handleCloseForm]
  );

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (profileId) => {
      const target = profiles.find((p) => p.id === profileId);
      try {
        const remaining = sizeProfileService.delete(user.id, profileId);
        setProfiles(remaining);
        // Clear limit error if now under cap
        if (remaining.length < MAX_PROFILES) setShowLimitError(false);
        toast.success(
          `Profile "${target?.profile_name ?? ""}" deleted.`
        );
      } catch (err) {
        toast.error(err.message || "Failed to delete profile.");
      }
    },
    [user, profiles]
  );

  // ── SET DEFAULT ───────────────────────────────────────────────────────────
  const handleSetDefault = useCallback(
    (profileId) => {
      try {
        const updated = sizeProfileService.setDefault(user.id, profileId);
        setProfiles(updated);
        const defaultProfile = updated.find((p) => p.id === profileId);
        toast.success(
          `"${defaultProfile?.profile_name ?? ""}" is now your default profile.`
        );
      } catch (err) {
        toast.error(err.message || "Failed to set default profile.");
      }
    },
    [user]
  );

  // ── form submit dispatcher ────────────────────────────────────────────────
  const handleFormSubmit = useCallback(
    (formData) => {
      if (editingProfile) {
        handleUpdate(formData);
      } else {
        handleCreate(formData);
      }
    },
    [editingProfile, handleCreate, handleUpdate]
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* ── Page Header ── */}
      <div className="mb-8 md:mb-10">
        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl mb-3 text-espresso">
          Size{" "}
          <span style={{ fontStyle: "italic", color: "#A2466B" }}>Profiles</span>
        </h1>
        <p className="text-lg text-espresso/70">
          Manage your body measurements for faster, more accurate sizing at
          checkout.
        </p>
      </div>

      {/* ── Toolbar: profile count + Add button ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <p className="text-sm text-espresso/60">
          {loading
            ? "Loading…"
            : `${profiles.length} / ${MAX_PROFILES} profiles`}
        </p>

        <motion.button
          type="button"
          onClick={handleOpenAdd}
          whileHover={atLimit ? {} : { scale: 1.03 }}
          whileTap={atLimit ? {} : { scale: 0.97 }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-sm min-h-[48px] transition-opacity"
          style={{
            background: atLimit ? "#C4B8B0" : "#A2466B",
            color: "#FFF8F0",
            cursor: atLimit ? "not-allowed" : "pointer",
          }}
          aria-disabled={atLimit}
        >
          <Plus size={16} aria-hidden="true" />
          Add New Profile
        </motion.button>
      </div>

      {/* ── Limit error banner ── */}
      <AnimatePresence>
        {showLimitError && <LimitBanner key="limit-banner" />}
      </AnimatePresence>

      {/* ── Content area ── */}
      {loading ? (
        /* Loading skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        /* Empty state */
        <EmptyState onAdd={handleOpenAdd} />
      ) : (
        /* Profile grid */
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6"
        >
          <AnimatePresence mode="popLayout">
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2 }}
              >
                <SizeProfileCard
                  profile={profile}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <FormModal key="form-modal">
            <SizeProfileForm
              existingNames={existingNames}
              initialValues={editingProfile ?? {}}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseForm}
            />
          </FormModal>
        )}
      </AnimatePresence>
    </div>
  );
}
