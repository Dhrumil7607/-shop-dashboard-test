/**
 * StoreCard
 *
 * Premium store discovery card component. Displays a store's banner, logo,
 * metadata, and interactive controls (follow, hover-preview).
 *
 * Requirements: 6.3, 6.4, 6.5, 6.6, 13.3, 15.5
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Heart,
  MapPin,
  Star,
  Users,
  Package,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Truncate a string to maxLen characters, appending "…" if trimmed.
 */
function truncate(str, maxLen) {
  if (!str) return "";
  return str.length <= maxLen ? str : str.slice(0, maxLen).trimEnd() + "…";
}

/**
 * Generate 1–2 uppercase initials from a store name for the avatar fallback.
 */
function getInitials(name = "") {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Render a row of star icons given a numeric rating (0–5).
 * Shows full, half (via opacity trick), and empty stars.
 */
function StarRow({ rating = 0 }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating >= i + 1;
        const partial = !filled && rating > i;
        return (
          <Star
            key={i}
            size={11}
            className={
              filled
                ? "text-gold fill-gold"
                : partial
                ? "text-gold fill-gold opacity-50"
                : "text-stone/30 fill-transparent"
            }
          />
        );
      })}
      <span className="ml-1 text-xs text-stone font-medium">{Number(rating).toFixed(1)}</span>
    </span>
  );
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function getFollowedStores(userId) {
  if (!userId) return {};
  try {
    return JSON.parse(localStorage.getItem(`slb_followed_stores_${userId}`) || "{}");
  } catch {
    return {};
  }
}

function setFollowedStores(userId, data) {
  if (!userId) return;
  try {
    localStorage.setItem(`slb_followed_stores_${userId}`, JSON.stringify(data));
  } catch {
    // storage quota or private mode — silent fail, optimistic state already shown
  }
}

// ── Placeholder product thumbnail ────────────────────────────────────────────

const PRODUCT_PLACEHOLDER =
  "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=200&q=60";

// ── Main component ───────────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {object}   props.shop            - Shop object (id, name, verified, city,
 *                                           description, rating, followers,
 *                                           product_count, tags, banner_image, logo)
 * @param {object[]} [props.featuredProducts] - Up to 3 products {id, name, image_url, price}
 */
export default function StoreCard({ shop, featuredProducts = [] }) {
  const { isLoggedIn, user } = useAuth();
  const userId = user?.id ?? null;

  // ── Follow state ──────────────────────────────────────────────────────────

  const [isFollowed, setIsFollowed] = useState(() => {
    if (!userId || !shop?.id) return false;
    const stored = getFollowedStores(userId);
    return stored[shop.id] === true;
  });

  const [localFollowerDelta, setLocalFollowerDelta] = useState(0);

  // Re-hydrate if user logs in/out mid-session
  useEffect(() => {
    if (!userId || !shop?.id) {
      setIsFollowed(false);
      setLocalFollowerDelta(0);
      return;
    }
    const stored = getFollowedStores(userId);
    setIsFollowed(stored[shop.id] === true);
  }, [userId, shop?.id]);

  const handleFollowToggle = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!isLoggedIn) {
        toast("Please log in to follow stores");
        return;
      }

      const stored = getFollowedStores(userId);

      if (isFollowed) {
        // Unfollow
        const updated = { ...stored };
        delete updated[shop.id];
        setFollowedStores(userId, updated);
        setIsFollowed(false);
        setLocalFollowerDelta((d) => d - 1);
      } else {
        // Follow
        const updated = { ...stored, [shop.id]: true };
        setFollowedStores(userId, updated);
        setIsFollowed(true);
        setLocalFollowerDelta((d) => d + 1);
      }
    },
    [isLoggedIn, isFollowed, userId, shop?.id]
  );

  // ── Hover / keyboard expand state ─────────────────────────────────────────

  const [previewOpen, setPreviewOpen] = useState(false);
  const cardRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      setPreviewOpen(true);
    } else if (e.key === "Escape") {
      setPreviewOpen(false);
    }
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────

  // Support both { tags: string[] } and the MOCK_SHOPS pattern where tags may
  // be absent. Fall back to deriving a single tag from shop.specialty (string).
  const categoryTags = (() => {
    if (Array.isArray(shop?.tags) && shop.tags.length > 0) {
      return shop.tags.slice(0, 3);
    }
    return [];
  })();

  // Support both { specialties: string[] } and single `specialty` string
  const specialtyTags = (() => {
    if (Array.isArray(shop?.specialties) && shop.specialties.length > 0) {
      return shop.specialties.slice(0, 2);
    }
    if (typeof shop?.specialty === "string" && shop.specialty.trim()) {
      // Show as a single specialty pill
      return [shop.specialty.trim()];
    }
    return [];
  })();

  // Support both `product_count` and `productCount` field names
  const productCount = shop?.product_count ?? shop?.productCount ?? 0;

  // Support both `banner_image` and `image_url` for the banner
  const bannerSrc = shop?.banner_image || shop?.image_url || null;

  const displayedFollowers = (shop?.followers ?? 0) + localFollowerDelta;
  const storyExcerpt = truncate(shop?.description, 120);

  const productSlots = Array.from({ length: 3 }, (_, i) => featuredProducts[i] ?? null);

  const visitUrl = shop?.id
    ? `/shops/${shop.id}`
    : shop?.slug
    ? `/shop?store=${shop.slug}`
    : "/shops";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.article
      ref={cardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onHoverStart={() => setPreviewOpen(true)}
      onHoverEnd={() => setPreviewOpen(false)}
      onFocus={() => setPreviewOpen(true)}
      onBlur={(e) => {
        // Only collapse if focus leaves the card entirely
        if (!cardRef.current?.contains(e.relatedTarget)) {
          setPreviewOpen(false);
        }
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col rounded-2xl overflow-hidden bg-white border border-[#E8E4DF] shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
      style={{
        /* Req 15.5 — touch devices must respond naturally */
        pointerEvents: "auto",
        touchAction: "manipulation",
        willChange: "transform",
      }}
      aria-label={`${shop?.name ?? "Store"} — ${shop?.city ?? ""}`}
    >
      {/* ── BANNER ── */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ height: 200 }}
      >
        <img
          src={bannerSrc || PRODUCT_PLACEHOLDER}
          alt={`${shop?.name ?? "Store"} banner`}
          loading="lazy"
          decoding="async"
          className="w-full h-full"
          /* Req 13.3 — object-fit:cover, maintains aspect ratio on all viewports */
          style={{ objectFit: "cover", objectPosition: "center" }}
          onError={(e) => {
            e.currentTarget.src = PRODUCT_PLACEHOLDER;
          }}
        />

        {/* Dark gradient scrim at bottom of banner */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(26,10,10,0.45) 0%, transparent 100%)",
          }}
        />

        {/* Follow button — top-right corner */}
        <motion.button
          onClick={handleFollowToggle}
          whileTap={{ scale: 0.88 }}
          className={[
            "absolute top-3 right-3 flex items-center justify-center rounded-full",
            "bg-white/90 backdrop-blur-sm shadow-soft transition-colors duration-200",
            /* Req 12.4 — minimum 44×44 px touch area */
            "min-w-[44px] min-h-[44px]",
            isFollowed
              ? "text-rose-500"
              : "text-stone/60 hover:text-rose-400",
          ].join(" ")}
          aria-label={isFollowed ? "Unfollow store" : "Follow store"}
          aria-pressed={isFollowed}
        >
          <Heart
            size={18}
            className={isFollowed ? "fill-rose-500" : "fill-transparent"}
            strokeWidth={isFollowed ? 0 : 1.75}
          />
        </motion.button>
      </div>

      {/* ── CARD BODY ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Avatar + name row */}
        <div className="flex items-start gap-3 -mt-8 relative z-10">
          {/* Logo / Avatar circle */}
          <div
            className="w-14 h-14 rounded-full border-2 border-white shadow-soft flex-shrink-0 overflow-hidden bg-cream flex items-center justify-center text-espresso text-sm font-semibold"
            style={{ minWidth: 56 }}
          >
            {shop?.logo ? (
              <img
                src={shop.logo}
                alt={`${shop?.name ?? "Store"} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <span
              className="w-full h-full flex items-center justify-center text-sm font-semibold"
              style={{ display: shop?.logo ? "none" : "flex", color: "#2C241B" }}
              aria-hidden="true"
            >
              {getInitials(shop?.name)}
            </span>
          </div>

          {/* Name + verified */}
          <div className="flex flex-col pt-5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3
                className="text-base font-semibold leading-tight truncate"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}
              >
                {shop?.name ?? "Store Name"}
              </h3>
              {/* Verified badge — ONLY when shop.verified === true (Req 6.3) */}
              {shop?.verified === true && (
                <CheckCircle2
                  size={15}
                  className="text-emerald-500 fill-emerald-50 flex-shrink-0"
                  aria-label="Verified store"
                />
              )}
            </div>

            {/* City / location */}
            {shop?.city && (
              <span className="flex items-center gap-1 text-xs text-stone mt-0.5">
                <MapPin size={11} className="flex-shrink-0" />
                {shop.city}
              </span>
            )}
          </div>
        </div>

        {/* Star rating */}
        <StarRow rating={shop?.rating ?? 0} />

        {/* Follower + product count */}
        <div className="flex items-center gap-4 text-xs text-stone">
          <span className="flex items-center gap-1">
            <Users size={12} />
            <span>
              <span className="font-medium text-espresso">
                {displayedFollowers >= 1000
                  ? `${(displayedFollowers / 1000).toFixed(1)}k`
                  : displayedFollowers}
              </span>{" "}
              followers
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Package size={12} />
            <span>
              <span className="font-medium text-espresso">
                {productCount}
              </span>{" "}
              products
            </span>
          </span>
        </div>

        {/* Category tags (up to 3) */}
        {categoryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Category tags">
            {categoryTags.map((tag) => (
              <span
                key={tag}
                role="listitem"
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cream text-espresso border border-[#E8E4DF]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Specialty tags (up to 2) — different style */}
        {specialtyTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Specialty tags">
            {specialtyTags.map((tag) => (
              <span
                key={tag}
                role="listitem"
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-champagne/20 text-champagne border border-champagne/40"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Story excerpt (truncated at 120 chars) */}
        {storyExcerpt && (
          <p
            className="text-xs leading-relaxed text-stone line-clamp-3"
            style={{ marginTop: "auto" }}
          >
            {storyExcerpt}
          </p>
        )}
      </div>

      {/* ── HOVER / FOCUS PREVIEW OVERLAY ── */}
      {/*
        Only shown with @media (hover: hover) — on touch devices this is hidden
        via CSS. We render it in the DOM when previewOpen is true but wrap it
        in the .hover-only class that CSS hides on touch-primary devices.
        Req 6.4, 12.10
      */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            key="preview-overlay"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            className="store-card-hover-preview absolute inset-x-0 bottom-0 z-20 rounded-b-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(to top, rgba(26,10,10,0.96) 0%, rgba(26,10,10,0.88) 60%, rgba(26,10,10,0.0) 100%)",
              paddingTop: "3rem",
            }}
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              {/* Featured product thumbnails */}
              <div className="flex gap-2 justify-center">
                {productSlots.map((product, idx) => (
                  <div
                    key={product?.id ?? idx}
                    className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 border border-white/20"
                  >
                    {product ? (
                      <img
                        src={product.image_url || PRODUCT_PLACEHOLDER}
                        alt={product.name ?? "Product"}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = PRODUCT_PLACEHOLDER;
                        }}
                      />
                    ) : (
                      /* Fallback placeholder for missing products */
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={18} className="text-white/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Visit Store button */}
              <Link
                to={visitUrl}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-ivory text-espresso text-sm font-semibold transition-colors duration-150 hover:bg-champagne focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label={`Visit ${shop?.name ?? "store"}`}
              >
                <ExternalLink size={14} />
                Visit Store
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        CSS: hide hover preview on touch-primary devices.
        @media (hover: none) hides .store-card-hover-preview.
        This is injected via a <style> tag once per app; here we use an
        inline approach so the component is self-contained.
      */}
      <style>{`
        @media (hover: none) {
          .store-card-hover-preview {
            display: none !important;
          }
        }
      `}</style>
    </motion.article>
  );
}
