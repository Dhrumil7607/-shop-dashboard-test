/**
 * ShopsDirectory — Enhanced /shops page
 *
 * Tasks 8.1 + 8.2
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 *
 * Changes from the original:
 *  - Uses <StoreCard> instead of inline card markup (Req 7.1)
 *  - Removes the 8-store cap — shows ALL stores from fetchShops (Req 7.2)
 *  - Adds <StoreFilterPills> with the same 7 options as StoreDiscoverySection (Req 7.3)
 *  - Adds a debounced (300 ms) search input that filters by name or city (Req 7.4)
 *  - Search only activates at ≥2 characters (Req 7.5)
 *  - Empty search-result state message when ≥2 chars match nothing (Req 7.6)
 *  - Filter + search are applied simultaneously (a store must pass BOTH)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "lucide-react";
import { useLocation } from "react-router-dom";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { fetchPublicShops, fetchProducts } from "@/lib/api";
import StoreCard from "@/components/Store/StoreCard";
import StoreFilterPills from "@/components/Store/StoreFilterPills";

// ── Filter helper — identical to StoreDiscoverySection ────────────────────────

function shopMatchesFilter(shop, filter) {
  if (filter === "All") return true;

  const filterLower = filter.toLowerCase();

  if (filter === "Trending" && shop.trending === true) return true;
  if (filter === "Featured" && shop.featured === true) return true;

  if (Array.isArray(shop.tags)) {
    if (shop.tags.some((t) => t.toLowerCase().includes(filterLower))) return true;
  }

  if (typeof shop.specialty === "string") {
    if (shop.specialty.toLowerCase().includes(filterLower)) return true;
  }

  if (Array.isArray(shop.categories)) {
    if (shop.categories.some((c) => c.toLowerCase().includes(filterLower))) return true;
  }

  if (typeof shop.description === "string") {
    if (shop.description.toLowerCase().includes(filterLower)) return true;
  }

  if (filter === "New" && (shop.isNew === true || shop.new === true)) return true;

  if (filter === "Wedding Specialists") {
    const wedding = ["wedding", "bridal", "bride", "groom"];
    const textToCheck = [shop.specialty, shop.description, shop.name].filter(Boolean);
    if (textToCheck.some((t) => wedding.some((w) => t.toLowerCase().includes(w)))) return true;
  }

  if (filter === "Regional") {
    const regional = [
      "jaipur", "varanasi", "surat", "delhi", "mumbai", "kolkata",
      "chennai", "bengaluru", "hyderabad", "regional",
    ];
    const textToCheck = [shop.city, shop.specialty, shop.description].filter(Boolean);
    if (textToCheck.some((t) => regional.some((r) => t.toLowerCase().includes(r)))) return true;
  }

  if (filter === "Luxury") {
    const luxury = ["luxury", "premium", "couture", "royal", "maharani", "heritage", "silk"];
    const textToCheck = [shop.name, shop.specialty, shop.description].filter(Boolean);
    if (textToCheck.some((t) => luxury.some((l) => t.toLowerCase().includes(l)))) return true;
  }

  return false;
}

// ── Search helper ─────────────────────────────────────────────────────────────

function shopMatchesSearch(shop, query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return true; // Req 7.5 — fewer than 2 chars → show all
  return (
    (shop.name  && shop.name.toLowerCase().includes(q)) ||
    (shop.city  && shop.city.toLowerCase().includes(q))
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShopsDirectory() {
  const [shops,        setShops]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const location = useLocation();
  const [refetchKey, setRefetchKey] = useState(0);

  // Re-fetch on window focus
  useEffect(() => {
    const onFocus = () => setRefetchKey(k => k + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Raw value bound to the <input>; debounced value drives filtering
  const [inputValue,    setInputValue]    = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce: 300 ms via useRef + setTimeout (no external library)
  const debounceRef = useRef(null);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
  }, []);

  // Clean up the timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Fetch approved + online stores directly from the backend (source of truth)
  // Re-fetch on every navigation to this page
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const [shops, prods] = await Promise.all([
          fetchPublicShops(1000),
          fetchProducts({ active_only: true, limit: 500 }).catch(() => []),
        ]);
        const counts = {};
        (prods || []).forEach(p => {
          if (p.shop_id) counts[p.shop_id] = (counts[p.shop_id] || 0) + 1;
        });
        const list = (shops || []).map(s => ({
          ...s,
          productCount: counts[s.id] ?? s.productCount ?? s.product_count ?? 0,
        }));
        setShops(list);
      } catch {
        setShops([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [location.key, refetchKey]);

  // Apply filter pill + search simultaneously (Req 7.3, 7.4, 7.5)
  // Deduplicate by id as a safety net before rendering
  const uniqueShops = shops.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
  const visibleShops = uniqueShops.filter(
    (shop) =>
      shopMatchesFilter(shop, activeFilter) &&
      shopMatchesSearch(shop, debouncedQuery)
  );

  // Req 7.6 — empty state only when search is active (≥2 chars) and nothing matches
  const searchIsActive = debouncedQuery.trim().length >= 2;
  const showEmptyState = searchIsActive && visibleShops.length === 0;

  return (
    <MarketplaceLayout>
      <div style={{ backgroundColor: "#FAF9F6" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">

          {/* ── Page header ────────────────────────────────────────────── */}
          <h1
            className="font-serif text-4xl md:text-5xl mb-2"
            style={{ color: "#1a1a1a", fontWeight: 400 }}
          >
            Trusted Indian Stores
          </h1>
          <p className="text-sm mb-8" style={{ color: "#9B8B7A" }}>
            Family-run, generations-old, lovingly curated.
          </p>

          {/* ── Search input (Req 7.4 / 7.5) ──────────────────────────── */}
          <div className="mb-6">
            <label
              htmlFor="shops-search"
              className="block text-sm font-medium mb-2"
              style={{ color: "#3C3027" }}
            >
              Search stores
            </label>
            <input
              id="shops-search"
              type="search"
              value={inputValue}
              onChange={handleSearchChange}
              placeholder="Search by name or city…"
              className="w-full max-w-md rounded-full border px-4 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 transition-colors"
              style={{
                borderColor: "#E8E4DF",
                backgroundColor: "#FFFFFF",
                color: "#1a1a1a",
                /* Req 12.4 — minimum 44 px touch / click target height */
                minHeight: "44px",
              }}
              autoComplete="off"
              aria-label="Search stores by name or city"
            />
          </div>

          {/* ── Filter pills (Req 7.3) ──────────────────────────────────── */}
          <div className="mb-8">
            <StoreFilterPills
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>

          {/* ── Loading state ───────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader size={28} className="animate-spin" style={{ color: "#C9A84C" }} />
            </div>

          /* ── Empty search state (Req 7.6) ──────────────────────────── */
          ) : showEmptyState ? (
            <p className="text-sm py-16 text-center" style={{ color: "#9B8B7A" }}>
              No stores match your search — try a different term.
            </p>

          /* ── Store grid ────────────────────────────────────────────── */
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleShops.map((shop) => (
                <StoreCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}

        </div>
      </div>
    </MarketplaceLayout>
  );
}
