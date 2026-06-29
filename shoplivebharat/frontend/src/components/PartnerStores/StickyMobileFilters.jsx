/**
 * Sticky Mobile Filters Component
 * Provides quick access to filters while scrolling on mobile devices
 * Sticky bottom bar that appears after scrolling
 * Features: Filter badge, quick toggle, smooth animations
 * Accessibility: ARIA labels, keyboard accessible
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Sliders, X } from "lucide-react";

const StickyMobileFilters = memo(function StickyMobileFilters({
    filters,
    activeFilterCount = 0,
    onFiltersOpen,
    onClearFilters,
}) {
    const hasActiveFilters = activeFilterCount > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 md:hidden z-40"
        >
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-white/40 dark:border-slate-700/40 safe-area-inset-bottom">
                <div className="max-w-full px-4 py-4 flex items-center justify-between gap-3">
                    {/* Left: Filter Summary */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onFiltersOpen}
                        className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-maroon/10 dark:bg-rose-900/20 hover:bg-maroon/20 dark:hover:bg-rose-900/30 transition-colors"
                        aria-label={`Open filters${hasActiveFilters ? ` (${activeFilterCount} active)` : ""}`}
                    >
                        <Sliders size={20} className="text-maroon dark:text-rose-400 flex-shrink-0" />
                        <div className="text-left">
                            <p className="text-xs uppercase tracking-wider font-semibold text-maroon dark:text-rose-400">
                                Filters
                            </p>
                            <p className="text-sm text-espresso/70 dark:text-ivory/70">
                                {hasActiveFilters ? `${activeFilterCount} Active` : "All"}
                            </p>
                        </div>
                    </motion.button>

                    {/* Right: Clear Button (if filters active) */}
                    {hasActiveFilters && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClearFilters}
                            className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                            aria-label="Clear all filters"
                        >
                            <X size={18} className="text-red-600 dark:text-red-400" />
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                Clear
                            </span>
                        </motion.button>
                    )}

                    {/* Right: Sort Indicator (if no filters) */}
                    {!hasActiveFilters && (
                        <div className="px-4 py-3 rounded-xl bg-espresso/5 dark:bg-slate-700/20">
                            <p className="text-xs uppercase tracking-wider font-semibold text-espresso/60 dark:text-ivory/60">
                                Sort: {filters.sort || "Featured"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Active Filters Pills */}
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-3 flex flex-wrap gap-2 border-t border-white/20 dark:border-slate-700/20 pt-3"
                    >
                        {filters.category && filters.category !== "all" && (
                            <span className="px-3 py-1 text-xs font-medium bg-maroon/20 text-maroon dark:bg-rose-900/30 dark:text-rose-400 rounded-full">
                                📦 {filters.category}
                            </span>
                        )}
                        {filters.rating && filters.rating !== "all" && (
                            <span className="px-3 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
                                ⭐ {filters.rating}+
                            </span>
                        )}
                        {filters.location && filters.location !== "all" && (
                            <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                                📍 {filters.location}
                            </span>
                        )}
                        {filters.verified && (
                            <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                                ✓ Verified Only
                            </span>
                        )}
                        {filters.search && (
                            <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full truncate">
                                🔍 "{filters.search}"
                            </span>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    // Prevent re-renders if props haven't significantly changed
    return (
        prevProps.activeFilterCount === nextProps.activeFilterCount &&
        prevProps.filters.sort === nextProps.filters.sort &&
        JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters)
    );
});

StickyMobileFilters.displayName = "StickyMobileFilters";

export default StickyMobileFilters;
