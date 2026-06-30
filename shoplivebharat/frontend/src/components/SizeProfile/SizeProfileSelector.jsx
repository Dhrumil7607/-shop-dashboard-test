import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import sizeProfileService from "@/services/sizeProfileService";

/* ─── Reuse the same input/label tokens used throughout Checkout.jsx ─── */
const inp = "w-full px-3 py-2.5 border-b border-gray-200 bg-transparent text-sm outline-none focus:border-[#C9A84C] transition placeholder-gray-400 cursor-pointer";
const lbl = "block text-xs font-medium mb-1";

/**
 * SizeProfileSelector
 *
 * Inline section inserted into the Checkout page above the Payment Method card.
 *
 * Behaviour:
 * - Returns null if the user is not logged in.
 * - On mount, loads the user's profiles via sizeProfileService.list(userId).
 * - If ≥1 profile exists, renders a labeled <select> defaulting to is_default: true.
 * - On change, calls onSelectionChange(profileId) so the parent can track the selection.
 * - If no profiles exist, shows a prompt linking to /account/size-profiles without
 *   blocking checkout completion.
 * - Does NOT touch cart state — pure display + callback.
 *
 * Props:
 *   onSelectionChange(profileId: string | null) — called whenever the selection changes
 *
 * Requirements: 3.1, 3.2, 3.3, 3.5, 14.7
 */
export default function SizeProfileSelector({ onSelectionChange }) {
  const { isLoggedIn, user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  /* Load profiles on mount (or when the logged-in user changes) */
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    const loaded = sizeProfileService.list(user.id);
    setProfiles(loaded);

    const defaultProfile = loaded.find((p) => p.is_default) ?? loaded[0] ?? null;
    const initialId = defaultProfile?.id ?? null;
    setSelectedId(initialId);

    // Notify parent of the initial default selection
    if (onSelectionChange) {
      onSelectionChange(initialId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id]);

  /* Not logged in → render nothing */
  if (!isLoggedIn) return null;

  const handleChange = (e) => {
    const newId = e.target.value || null;
    setSelectedId(newId);
    if (onSelectionChange) {
      onSelectionChange(newId);
    }
  };

  return (
    <section
      aria-label="Size profile selection"
      className="bg-white rounded-2xl border p-7"
      style={{ borderColor: "#E8E4DF", boxShadow: "0 2px 12px rgba(44,36,27,0.05)" }}
    >
      {/* Section header */}
      <h2
        className="flex items-center gap-2 text-base font-bold mb-6"
        style={{ color: "#1a1a1a" }}
      >
        <User size={15} style={{ color: "#C9A84C" }} />
        Your Size Profile
      </h2>

      {profiles.length > 0 ? (
        /* ── Has profiles: show dropdown ── */
        <div>
          <label
            htmlFor="size-profile-select"
            className={lbl}
            style={{ color: "#9B8B7A" }}
          >
            Your Size Profile
          </label>

          <select
            id="size-profile-select"
            className={inp + " bg-white"}
            value={selectedId ?? ""}
            onChange={handleChange}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.profile_name}
                {profile.is_default ? " (Default)" : ""}
              </option>
            ))}
          </select>

          <p className="text-xs mt-3" style={{ color: "#9B8B7A" }}>
            The selected profile's measurements will be included with your order.{" "}
            <Link
              to="/account/size-profiles"
              className="underline hover:opacity-80 transition"
              style={{ color: "#C9A84C" }}
            >
              Manage profiles
            </Link>
          </p>
        </div>
      ) : (
        /* ── No profiles: show prompt (does NOT block checkout) ── */
        <p className="text-sm" style={{ color: "#9B8B7A" }}>
          No size profiles saved yet.{" "}
          <Link
            to="/account/size-profiles"
            className="underline hover:opacity-80 transition font-medium"
            style={{ color: "#C9A84C" }}
          >
            Create a size profile
          </Link>{" "}
          to include your measurements with orders.
        </p>
      )}
    </section>
  );
}
