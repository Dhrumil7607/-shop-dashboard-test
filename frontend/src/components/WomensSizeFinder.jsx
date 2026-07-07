/**
 * WomensSizeFinder.jsx
 *
 * Premium "Find My Perfect Size" card for women's products.
 * Shows above the size selector with:
 *  - Use Saved Size Profile (if logged in)
 *  - Create New Size Profile
 *  - AI Size Recommendation with confidence score, fit explanation,
 *    recommended + alternative sizes
 *
 * Props:
 *  - product: product object (used for name, category)
 *  - onSizeSelect: (sizeString) => void — called when a size is chosen
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, X, Plus, Check, User } from "lucide-react";
import { toast } from "sonner";
import AISizeFinder from "@/components/AISizeFinder/AISizeFinder";
import sizeProfileService from "@/services/sizeProfileService";
import { useAuth } from "@/contexts/AuthContext";

// ── Measurement fields for women's profile creation ───────────────────────────
const PROFILE_FIELDS = [
  { key: "profile_name", label: "Profile Name", type: "text", placeholder: "e.g. Wedding, Daily Wear, Mother" },
  { key: "height",       label: "Height (cm)",  type: "number", placeholder: "e.g. 162" },
  { key: "weight",       label: "Weight (kg)",  type: "number", placeholder: "e.g. 58" },
  { key: "bust",         label: "Bust (in)",    type: "number", placeholder: "e.g. 36" },
  { key: "waist",        label: "Waist (in)",   type: "number", placeholder: "e.g. 30" },
  { key: "hip",          label: "Hips (in)",    type: "number", placeholder: "e.g. 38" },
  { key: "shoulder_width", label: "Shoulder (in)", type: "number", placeholder: "e.g. 14.5" },
  { key: "sleeve_length",  label: "Sleeve Length (in)", type: "number", placeholder: "e.g. 23" },
  { key: "kurti_length",   label: "Kurti Length (in)",  type: "number", placeholder: "e.g. 42" },
  { key: "lehenga_waist",  label: "Lehenga Waist (in)", type: "number", placeholder: "e.g. 28" },
  { key: "lehenga_length", label: "Lehenga Length (in)", type: "number", placeholder: "e.g. 42" },
  { key: "inseam",         label: "Inseam (in)",  type: "number", placeholder: "e.g. 28" },
];

const FIT_PREFS = ["Loose", "Regular", "Tailored", "Slim", "Comfort"];

const EXAMPLE_PROFILE_NAMES = ["Wedding", "Party", "Daily Wear", "Mother", "Sister"];

// ── Mini Profile Card ─────────────────────────────────────────────────────────

function ProfilePill({ profile, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(profile)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      style={{
        borderColor: isSelected ? "#A2466B" : "#E8E4DF",
        backgroundColor: isSelected ? "rgba(162,70,107,0.06)" : "white",
        color: isSelected ? "#A2466B" : "#3C3027",
      }}
    >
      <User size={13} />
      <span className="font-medium">{profile.profile_name}</span>
      {profile.is_default && (
        <span
          className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
          style={{ backgroundColor: "#C9A84C", color: "white" }}
        >
          Default
        </span>
      )}
      {isSelected && <Check size={13} className="ml-auto" />}
    </button>
  );
}

// ── New Profile Form ──────────────────────────────────────────────────────────

function NewProfileForm({ onSave, onCancel, userId }) {
  const [values, setValues] = useState({ profile_name: "", unit: "inches" });
  const [fitPref, setFitPref] = useState("Regular");
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback((key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!values.profile_name?.trim()) {
      toast.error("Please enter a profile name");
      return;
    }
    setSaving(true);
    try {
      const profile = sizeProfileService.create(userId, { ...values, fit_preference: fitPref });
      toast.success(`Profile "${profile.profile_name}" saved!`);
      onSave(profile);
    } catch (err) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [values, fitPref, userId, onSave]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div
        className="rounded-2xl border p-5 mt-3"
        style={{ borderColor: "#E8E4DF", background: "#FFFDFB" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-serif text-lg" style={{ color: "#1a1a1a", fontWeight: 400 }}>
            Create Size Profile
          </h4>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition"
          >
            <X size={15} style={{ color: "#9B8B7A" }} />
          </button>
        </div>

        {/* Example names */}
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: "#9B8B7A" }}>Quick names:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROFILE_NAMES.map((n) => (
              <button
                key={n}
                onClick={() => handleChange("profile_name", n)}
                className="px-3 py-1 rounded-full text-xs border transition"
                style={{
                  borderColor: values.profile_name === n ? "#A2466B" : "#E8E4DF",
                  backgroundColor: values.profile_name === n ? "rgba(162,70,107,0.08)" : "white",
                  color: values.profile_name === n ? "#A2466B" : "#6B5E52",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "#6B5E52" }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={values[f.key] ?? ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-h-[44px]"
                style={{ borderColor: "#E8E4DF" }}
              />
            </div>
          ))}
        </div>

        {/* Fit Preference */}
        <div className="mt-4">
          <p className="text-xs font-medium mb-2" style={{ color: "#6B5E52" }}>Fit Preference</p>
          <div className="flex flex-wrap gap-2">
            {FIT_PREFS.map((fp) => (
              <button
                key={fp}
                onClick={() => setFitPref(fp)}
                className="px-3 py-1.5 rounded-full text-xs border transition min-h-[36px]"
                style={{
                  backgroundColor: fitPref === fp ? "#1a1a1a" : "white",
                  color: fitPref === fp ? "white" : "#3C3027",
                  borderColor: fitPref === fp ? "#1a1a1a" : "#E8E4DF",
                }}
              >
                {fp}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition min-h-[44px]"
            style={{ backgroundColor: "#1a1a1a", color: "white", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm border transition min-h-[44px]"
            style={{ borderColor: "#E8E4DF", color: "#6B5E52" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WomensSizeFinder({ product, onSizeSelect }) {
  const { user, isLoggedIn } = useAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showAIFinder, setShowAIFinder] = useState(false);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Load saved profiles
  const loadProfiles = useCallback(() => {
    if (isLoggedIn && user?.id) {
      const profiles = sizeProfileService.list(user.id);
      setSavedProfiles(profiles);
      // Auto-select default
      const def = profiles.find((p) => p.is_default) || profiles[0] || null;
      if (def && !selectedProfile) setSelectedProfile(def);
    } else {
      setSavedProfiles([]);
    }
  }, [isLoggedIn, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const hasProfiles = savedProfiles.length > 0;

  const handleProfileSaved = useCallback((profile) => {
    loadProfiles();
    setSelectedProfile(profile);
    setShowNewProfile(false);
    setShowAIFinder(true);
  }, [loadProfiles]);

  const handleAIRecommendation = useCallback((size) => {
    onSizeSelect(size);
    setShowAIFinder(false);
    toast.success(`Size ${size} selected from AI recommendation`);
  }, [onSizeSelect]);

  return (
    <div className="mb-6">
      {/* ── Trigger Card ─────────────────────────────────────────── */}
      <motion.div
        className="rounded-2xl overflow-hidden border"
        style={{
          borderColor: isExpanded ? "#A2466B" : "#E8E4DF",
          background: isExpanded
            ? "linear-gradient(135deg, rgba(201,168,76,0.05), rgba(162,70,107,0.05))"
            : "linear-gradient(135deg, rgba(201,168,76,0.04), rgba(162,70,107,0.03))",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        {/* Header row */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <div className="flex items-center gap-3">
            {/* Gradient icon */}
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #C9A84C, #A2466B)" }}
            >
              <Sparkles size={17} className="text-white" />
            </span>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>
                Find My Perfect Size
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#9B8B7A" }}>
                AI-powered personalized size recommendation based on your saved measurements
              </p>
            </div>
          </div>
          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} style={{ color: "#A2466B" }} />
          </motion.span>
        </button>

        {/* ── Expanded panel ──────────────────────────────────────── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t" style={{ borderColor: "#E8E4DF" }}>
                <div className="pt-4 space-y-4">

                  {/* Feature checklist — always visible */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      "AI Size Recommendation",
                      "Confidence Score",
                      "Fit Explanation",
                      "Recommended Size",
                      "Alternative Size",
                      "View Measurement Details",
                    ].map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs" style={{ color: "#6B5E52" }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #C9A84C, #A2466B)" }}>
                          <Check size={9} className="text-white" />
                        </span>
                        {feat}
                      </div>
                    ))}
                  </div>

                  {/* ── Not logged in ── */}
                  {!isLoggedIn && (
                    <div
                      className="rounded-xl p-4 text-sm text-center"
                      style={{ backgroundColor: "#FAF9F6", color: "#6B5E52" }}
                    >
                      <p className="mb-3">
                        <span className="font-semibold" style={{ color: "#1a1a1a" }}>
                          Sign in
                        </span>{" "}
                        to save your measurements and get instant AI recommendations.
                      </p>
                      <a
                        href="/login"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
                        style={{ backgroundColor: "#1a1a1a", color: "white" }}
                      >
                        Sign in to continue
                      </a>
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: "#E8E4DF" }}>
                        <button
                          onClick={() => setShowAIFinder((v) => !v)}
                          className="text-xs font-medium underline"
                          style={{ color: "#A2466B" }}
                        >
                          Continue without signing in
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Logged in: show profiles ── */}
                  {isLoggedIn && (
                    <>
                      {/* Saved profiles */}
                      {hasProfiles && (
                        <div>
                          <p className="text-xs font-semibold mb-2" style={{ color: "#9B8B7A" }}>
                            USE SAVED SIZE PROFILE
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {savedProfiles.map((p) => (
                              <ProfilePill
                                key={p.id}
                                profile={p}
                                isSelected={selectedProfile?.id === p.id}
                                onSelect={(prof) => {
                                  setSelectedProfile(prof);
                                  setShowAIFinder(true);
                                  setShowNewProfile(false);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No profiles CTA */}
                      {!hasProfiles && !showNewProfile && (
                        <div
                          className="rounded-xl p-4 text-center"
                          style={{ backgroundColor: "#FAF9F6" }}
                        >
                          <p className="text-sm mb-3" style={{ color: "#6B5E52" }}>
                            Create your size profile to get instant AI recommendations.
                          </p>
                          <button
                            onClick={() => setShowNewProfile(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition min-h-[44px]"
                            style={{ backgroundColor: "#1a1a1a", color: "white" }}
                          >
                            <Plus size={14} />
                            Create Your Size Profile
                          </button>
                        </div>
                      )}

                      {/* Action buttons row */}
                      {hasProfiles && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => {
                              setShowAIFinder((v) => !v);
                              if (showNewProfile) setShowNewProfile(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition min-h-[44px]"
                            style={{
                              background: showAIFinder
                                ? "#1a1a1a"
                                : "linear-gradient(135deg, #C9A84C, #A2466B)",
                              color: "white",
                            }}
                          >
                            <Sparkles size={14} />
                            {showAIFinder ? "Hide AI Finder" : "Get AI Recommendation"}
                          </button>
                          <button
                            onClick={() => {
                              setShowNewProfile((v) => !v);
                              if (showAIFinder) setShowAIFinder(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition min-h-[44px]"
                            style={{ borderColor: "#E8E4DF", color: "#3C3027" }}
                          >
                            <Plus size={14} />
                            New Profile
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* New Profile Form */}
                  <AnimatePresence>
                    {showNewProfile && isLoggedIn && (
                      <NewProfileForm
                        userId={user.id}
                        onSave={handleProfileSaved}
                        onCancel={() => setShowNewProfile(false)}
                      />
                    )}
                  </AnimatePresence>

                  {/* AI Size Finder panel */}
                  <AnimatePresence>
                    {showAIFinder && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div
                          className="rounded-xl border p-4"
                          style={{ borderColor: "#E8E4DF", background: "#FFFDFB" }}
                        >
                          <AISizeFinder
                            productName={product?.name}
                            onAddToCart={handleAIRecommendation}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
