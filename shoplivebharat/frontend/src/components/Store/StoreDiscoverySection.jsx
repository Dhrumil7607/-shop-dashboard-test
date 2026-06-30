/**
 * StoreDiscoverySection
 *
 * Homepage store discovery section. Inserted between the "How It Works" section
 * and the "New Arrivals" section in HomePage.jsx.
 *
 * Requirements: 6.1, 6.2, 6.8, 6.9
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Store } from "lucide-react";
import { fetchShops } from "@/lib/api";
import { MOCK_SHOPS } from "@/lib/testData";
import StoreCard from "@/components/Store/StoreCard";
import StoreFilterPills from "@/components/Store/StoreFilterPills";

// ── Filter matching ────────────────────────────────────────────────────────────

/**
 * Returns true when the given shop matches the selected filter.
 *
 * Checks (case-insensitive partial match):
 *   1. shop.tags      — array of strings
 *   2. shop.specialty — string
 *   3. shop.categories — array of strings
 *   4. shop.trending  — mapped to "Trending"
 *   5. shop.featured  — mapped to "Featured"
 *
 * Requirements 6.8 — "All" returns every store; any other filter value
 * returns only stores where at least one relevant field includes the filter.
 */
function shopMatchesFilter(shop, filter) {
  if (filter === "All") return true;

  const filterLower = filter.toLowerCase();

  // Shortcut: boolean flags for common filters
  if (filter === "Trending" && shop.trending === true) return true;
  if (filter === "Featured" && shop.featured === true) return true;

  // Check tags array
  if (Array.isArray(shop.tags)) {
    if (shop.tags.some((t) => t.toLowerCase().includes(filterLower))) return true;
  }

  // Check specialty string
  if (typeof shop.specialty === "string") {
    if (shop.specialty.toLowerCase().includes(filterLower)) return true;
  }

  // Check categories array
  if (Array.isArray(shop.categories)) {
    if (shop.categories.some((c) => c.toLowerCase().includes(filterLower))) return true;
  }

  // Check description for filter keyword (broad fallback for "Wedding Specialists", "Regional" etc.)
  if (typeof shop.description === "string") {
    if (shop.description.toLowerCase().includes(filterLower)) return true;
  }

  // "New" filter — check a `isNew` flag or `new` property if present
  if (filter === "New" && (shop.isNew === true || shop.new === true)) return true;

  // "Wedding Specialists" — also match on specialty / description keywords
  if (filter === "Wedding Specialists") {
    const wedding = ["wedding", "bridal", "bride", "groom"];
    const textToCheck = [shop.specialty, shop.description, shop.name].filter(Boolean);
    if (textToCheck.some((t) => wedding.some((w) => t.toLowerCase().includes(w)))) return true;
  }

  // "Regional" — match stores with a notable regional identifier in city/description
  if (filter === "Regional") {
    const regional = [
      "jaipur","varanasi","surat","delhi","mumbai","kolkata",
      "chennai","bengaluru","hyderabad","regional",
    ];
    const textToCheck = [shop.city, shop.specialty, shop.description].filter(Boolean);
    if (textToCheck.some((t) => regional.some((r) => t.toLowerCase().includes(r)))) return true;
  }

  // "Luxury" — match premium/luxury keywords
  if (filter === "Luxury") {
    const luxury = ["luxury","premium","couture","royal","maharani","heritage","silk"];
    const textToCheck = [shop.name, shop.specialty, shop.description].filter(Boolean);
    if (textToCheck.some((t) => luxury.some((l) => t.toLowerCase().includes(l)))) return true;
  }

  return false;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden bg-white border border-[#E8E4DF] shadow-soft animate-pulse"
      aria-hidden="true"
    >
      {/* Banner */}
      <div className="h-[200px] bg-[#F0ECE8]" />
      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3 -mt-8">
          <div className="w-14 h-14 rounded-full bg-[#E8E4DF] flex-shrink-0 border-2 border-white" />
          <div className="flex flex-col gap-2 pt-6 w-full">
            <div className="h-3.5 bg-[#E8E4DF] rounded w-3/5" />
            <div className="h-2.5 bg-[#E8E4DF] rounded w-2/5" />
          </div>
        </div>
        <div className="h-2.5 bg-[#E8E4DF] rounded w-1/3" />
        <div className="flex gap-3">
          <div className="h-2.5 bg-[#E8E4DF] rounded w-1/4" />
          <div className="h-2.5 bg-[#E8E4DF] rounded w-1/4" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 bg-[#E8E4DF] rounded-full w-14" />
          <div className="h-5 bg-[#E8E4DF] rounded-full w-16" />
        </div>
        <div className="h-2.5 bg-[#E8E4DF] rounded w-full" />
        <div className="h-2.5 bg-[#E8E4DF] rounded w-4/5" />
      </div>
    </div>
  );
}

// ── Empty / no-match state ─────────────────────────────────────────────────────

function EmptyFilterState({ filter, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="col-span-full flex flex-col items-center justify-center py-16 text-center"
    >
      <Store size={40} className="text-espresso/20 mb-4" />
      <p className="text-espresso/60 text-sm mb-3">
        No stores match <span className="font-semibold text-espresso">"{filter}"</span> right now.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="min-h-[44px] px-5 rounded-full text-sm font-medium bg-espresso text-ivory hover:bg-espresso/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
      >
        Show All Stores
      </button>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * StoreDiscoverySection
 *
 * Fetches stores from the API on mount. Falls back to MOCK_SHOPS if the API
 * returns an empty array or throws (Req 6.9). Slices to first 8 stores (Req 6.2).
 * Renders StoreFilterPills and an AnimatePresence-wrapped StoreCard grid (Req 6.7, 6.8).
 */
export default function StoreDiscoverySection() {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  // ── Fetch shops on mount ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadShops() {
      setIsLoading(true);
      try {
        const result = await fetchShops();
        if (cancelled) return;

        // Req 6.9: fall back to MOCK_SHOPS on empty array or error
        if (!Array.isArray(result) || result.length === 0) {
          setShops(MOCK_SHOPS.slice(0, 8));
        } else {
          // Req 6.2: display up to 8 stores
          setShops(result.slice(0, 8));
        }
      } catch {
        if (!cancelled) {
          // Req 6.9: fall back to MOCK_SHOPS on error
          setShops(MOCK_SHOPS.slice(0, 8));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadShops();
    return () => { cancelled = true; };
  }, []);

  // ── Filtered stores ───────────────────────────────────────────────────────

  // Req 6.8: filter the displayed cards based on activeFilter
  const filteredShops = shops.filter((shop) => shopMatchesFilter(shop, activeFilter));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      className="py-20 px-6 md:px-12 bg-[#FAF8F5]"
      aria-labelledby="store-discovery-heading"
    >
      <div className="max-w-7xl mx-auto">

        {/* ── Section header ── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-maroon font-semibold mb-3">
            PREMIUM STORES
          </p>
          <h2
            id="store-discovery-heading"
            className="font-serif text-4xl md:text-5xl text-espresso"
          >
            Discover Our Stores
          </h2>
          <p className="text-espresso/60 mt-3 text-sm max-w-xl mx-auto">
            Handpicked boutiques and heritage houses from across India — browse, follow, and shop directly.
          </p>
        </motion.div>

        {/* ── Filter pills — Req 6.7 ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <StoreFilterPills
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </motion.div>

        {/* ── Store card grid ── */}
        {isLoading ? (
          /* Skeleton loader while fetching */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          /*
           * AnimatePresence wraps the grid so cards animate in/out smoothly
           * when the filter changes (Req 6.8).
           * `layout` on the wrapper lets Framer Motion animate the grid
           * layout transition.
           */
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredShops.length > 0 ? (
                filteredShops.map((shop, index) => (
                  <motion.div
                    key={shop.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -8 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                      delay: index * 0.04,
                    }}
                  >
                    <StoreCard shop={shop} />
                  </motion.div>
                ))
              ) : (
                <EmptyFilterState
                  key="empty-state"
                  filter={activeFilter}
                  onReset={() => setActiveFilter("All")}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── "View all stores" CTA ── */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            to="/shops"
            className="inline-flex items-center gap-2 min-h-[44px] px-7 py-3 rounded-full border border-espresso text-espresso text-sm font-semibold hover:bg-espresso hover:text-ivory transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
          >
            Browse All Stores
            <ArrowRight size={15} />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
