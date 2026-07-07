/**
 * StoreSelector.jsx — Step 1 of LiveBookingFlow
 *
 * Fetches all shops using fetchShops() from @/lib/api.
 * Falls back to MOCK_SHOPS if the API returns empty or throws.
 * Renders shops as selectable cards in a grid.
 *
 * Props:
 *   bookingState  {object}   shared booking state
 *   onUpdate      {function} patch callback: onUpdate({ storeId, storeName, storeBanner, storeRating, storeSpecialties })
 *
 * Requirements: 8.2, 12.7
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, CheckCircle2 } from "lucide-react";

export default function StoreSelector({ bookingState, onUpdate }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadShops() {
      setLoading(true);
      try {
        // Backend live-shopping list: approved + online + live-enabled + has a future available slot
        const { getLiveShoppingShopsApi } = await import("@/lib/api");
        const data = await getLiveShoppingShopsApi();
        if (!cancelled) setShops(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setShops([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadShops();
    return () => { cancelled = true; };
  }, []);

  function handleSelect(shop) {
    onUpdate({
      storeId: shop.id,
      storeName: shop.name,
      storeBanner: shop.image_url,
      storeRating: shop.rating,
      storeSpecialties: shop.specialty || "",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-maroon border-t-transparent rounded-full animate-spin" aria-label="Loading stores" />
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-espresso font-serif text-xl mb-2">No live sessions available right now</p>
        <p className="text-stone text-sm">Check back soon — our stores are scheduling new live shopping sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-stone text-sm">Select a store to book your live shopping session with.</p>

      {/* Grid: 1 col on mobile, 2 on sm+, 3 on lg+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shops.map((shop) => {
          const isSelected = bookingState.storeId === shop.id;
          return (
            <motion.button
              key={shop.id}
              type="button"
              onClick={() => handleSelect(shop)}
              whileTap={{ scale: 0.97 }}
              aria-pressed={isSelected}
              aria-label={`Select ${shop.name}`}
              className={`relative text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon focus-visible:ring-offset-2 min-h-[44px] ${
                isSelected
                  ? "border-maroon shadow-lg shadow-maroon/20"
                  : "border-stone/20 hover:border-stone/40 hover:shadow-md"
              }`}
            >
              {/* Banner image */}
              <div className="relative h-36 w-full overflow-hidden bg-stone/10">
                {shop.image_url ? (
                  <img
                    src={shop.image_url}
                    alt={`${shop.name} banner`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone/10 text-stone/30 text-xs">
                    No image
                  </div>
                )}
                {/* Selected overlay */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-maroon/10 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CheckCircle2 size={36} className="text-maroon drop-shadow-md" />
                  </motion.div>
                )}
              </div>

              {/* Card body */}
              <div className="p-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-espresso text-sm leading-tight line-clamp-1">
                    {shop.name}
                  </h3>
                  {/* Star rating */}
                  {shop.rating && (
                    <span className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold whitespace-nowrap flex-shrink-0">
                      <Star size={12} fill="currentColor" />
                      {Number(shop.rating).toFixed(1)}
                    </span>
                  )}
                </div>

                {/* City */}
                {shop.city && (
                  <p className="flex items-center gap-1 text-stone/60 text-xs mt-0.5">
                    <MapPin size={11} />
                    {shop.city}
                  </p>
                )}

                {/* Specialty tags */}
                {shop.specialty && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {shop.specialty
                      .split(",")
                      .slice(0, 3)
                      .map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-ivory border border-stone/15 text-stone/70 px-1.5 py-0.5 rounded-full"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Selected highlight border accent */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
