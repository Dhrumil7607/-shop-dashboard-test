/**
 * Filter Sidebar Component
 * Mobile-friendly sticky filters with smooth animations
 * Maintains filter state and provides visual feedback
 */

import { motion } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { FilterSkeleton } from "./SkeletonComponents";

const FILTER_OPTIONS = {
    categories: ["All", "Fashion", "Jewelry", "Home", "Beauty", "Accessories"],
    ratings: [
        { value: "all", label: "All Ratings" },
        { value: "4.5", label: "4.5★ & above" },
        { value: "4", label: "4.0★ & above" },
        { value: "3.5", label: "3.5★ & above" },
    ],
    locations: ["All", "Ahmedabad", "Surat", "Delhi", "Mumbai", "Bangalore"],
    sortOptions: [
        { value: "featured", label: "Featured" },
        { value: "trending", label: "Trending" },
        { value: "rating", label: "Highest Rated" },
        { value: "followers", label: "Most Followed" },
        { value: "newest", label: "Newest" },
        { value: "az", label: "A to Z" },
    ],
};

export default function FilterSidebar({
    filters,
    onFilterChange,
    isOpen,
    onClose,
    isLoading,
}) {
    const [expandedFilters, setExpandedFilters] = useState({
        category: true,
        sort: true,
        rating: false,
        location: false,
    });

    const toggleFilter = (filterName) => {
        setExpandedFilters(prev => ({
            ...prev,
            [filterName]: !prev[filterName],
        }));
    };

    const handleCategoryChange = (category) => {
        onFilterChange({ category: category === "All" ? "all" : category });
    };

    const handleRatingChange = (rating) => {
        onFilterChange({ rating });
    };

    const handleLocationChange = (location) => {
        onFilterChange({ location: location === "All" ? "all" : location });
    };

    const handleSortChange = (sort) => {
        onFilterChange({ sort });
    };

    const handleVerifiedChange = (checked) => {
        onFilterChange({ verified: checked });
    };

    const activeFilterCount = Object.values(filters).filter(v => v && v !== "all" && v !== false).length;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <FilterSkeleton />
                <FilterSkeleton />
                <FilterSkeleton />
            </div>
        );
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm lg:hidden z-40"
                />
            )}

            {/* Sidebar */}
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: isOpen ? 0 : "-100%" }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.3, type: "spring", damping: 25 }}
                className="fixed inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-xl border-r border-white/40 overflow-y-auto z-50 lg:static lg:inset-auto lg:w-auto lg:bg-transparent lg:backdrop-blur-none lg:border-none lg:overflow-visible lg:translate-x-0"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-white/40 p-6 flex items-center justify-between lg:hidden lg:border-b-0 lg:p-0 lg:mb-6">
                    <h2 className="text-xl font-bold text-espresso">Filters</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-maroon/10 rounded-lg transition-colors"
                        aria-label="Close filters"
                    >
                        <X size={24} className="text-espresso" />
                    </button>
                </div>

                <div className="p-6 lg:p-0 space-y-6">
                    {/* Sort Filter */}
                    <FilterGroup
                        title="Sort By"
                        isExpanded={expandedFilters.sort}
                        onToggle={() => toggleFilter("sort")}
                    >
                        <div className="space-y-2">
                            {FILTER_OPTIONS.sortOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center gap-3 cursor-pointer group"
                                >
                                    <input
                                        type="radio"
                                        name="sort"
                                        value={option.value}
                                        checked={filters.sort === option.value}
                                        onChange={() => handleSortChange(option.value)}
                                        className="w-4 h-4 accent-maroon"
                                    />
                                    <span className="text-espresso/80 group-hover:text-espresso transition-colors">
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterGroup>

                    {/* Category Filter */}
                    <FilterGroup
                        title="Category"
                        isExpanded={expandedFilters.category}
                        onToggle={() => toggleFilter("category")}
                    >
                        <div className="space-y-2">
                            {FILTER_OPTIONS.categories.map((category) => (
                                <label
                                    key={category}
                                    className="flex items-center gap-3 cursor-pointer group"
                                >
                                    <input
                                        type="radio"
                                        name="category"
                                        value={category}
                                        checked={
                                            filters.category === (category === "All" ? "all" : category)
                                        }
                                        onChange={() => handleCategoryChange(category)}
                                        className="w-4 h-4 accent-maroon"
                                    />
                                    <span className="text-espresso/80 group-hover:text-espresso transition-colors">
                                        {category}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterGroup>

                    {/* Rating Filter */}
                    <FilterGroup
                        title="Rating"
                        isExpanded={expandedFilters.rating}
                        onToggle={() => toggleFilter("rating")}
                    >
                        <div className="space-y-2">
                            {FILTER_OPTIONS.ratings.map((rating) => (
                                <label
                                    key={rating.value}
                                    className="flex items-center gap-3 cursor-pointer group"
                                >
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={rating.value}
                                        checked={filters.rating === rating.value}
                                        onChange={() => handleRatingChange(rating.value)}
                                        className="w-4 h-4 accent-maroon"
                                    />
                                    <span className="text-espresso/80 group-hover:text-espresso transition-colors">
                                        {rating.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterGroup>

                    {/* Location Filter */}
                    <FilterGroup
                        title="Location"
                        isExpanded={expandedFilters.location}
                        onToggle={() => toggleFilter("location")}
                    >
                        <div className="space-y-2">
                            {FILTER_OPTIONS.locations.map((location) => (
                                <label
                                    key={location}
                                    className="flex items-center gap-3 cursor-pointer group"
                                >
                                    <input
                                        type="radio"
                                        name="location"
                                        value={location}
                                        checked={
                                            filters.location === (location === "All" ? "all" : location)
                                        }
                                        onChange={() => handleLocationChange(location)}
                                        className="w-4 h-4 accent-maroon"
                                    />
                                    <span className="text-espresso/80 group-hover:text-espresso transition-colors">
                                        {location}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterGroup>

                    {/* Verified Filter */}
                    <div className="pt-4 border-t border-maroon/10">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.verified}
                                onChange={(e) => handleVerifiedChange(e.target.checked)}
                                className="w-4 h-4 accent-maroon rounded"
                            />
                            <span className="text-espresso/80 group-hover:text-espresso transition-colors font-medium">
                                ✓ Verified Sellers Only
                            </span>
                        </label>
                    </div>

                    {/* Active Filters Badge */}
                    {activeFilterCount > 0 && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                onFilterChange({
                                    search: "",
                                    category: "all",
                                    rating: "all",
                                    location: "all",
                                    verified: false,
                                    sort: "featured",
                                });
                            }}
                            className="w-full py-3 bg-maroon/10 border border-maroon/20 text-maroon font-semibold rounded-lg hover:bg-maroon/20 transition-colors"
                        >
                            Clear All ({activeFilterCount})
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </>
    );
}

/**
 * FilterGroup Component - Reusable filter section
 */
function FilterGroup({ title, isExpanded, onToggle, children }) {
    return (
        <div className="border border-maroon/10 rounded-xl overflow-hidden hover:border-maroon/20 transition-colors">
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between bg-maroon/5 hover:bg-maroon/10 transition-colors"
                aria-expanded={isExpanded}
            >
                <span className="font-semibold text-espresso">{title}</span>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={20} className="text-espresso/60" />
                </motion.div>
            </button>

            <motion.div
                initial={false}
                animate={{ height: isExpanded ? "auto" : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <div className="px-4 py-4 border-t border-maroon/10">{children}</div>
            </motion.div>
        </div>
    );
}
