/**
 * Category Showcase Component
 * Displays product categories as attractive cards with smooth interactions
 * Helps users navigate by category preference
 * Features: Gradient backgrounds, hover effects, click handlers
 * Accessibility: Semantic HTML, ARIA labels, keyboard navigation
 */

import { memo } from "react";
import { motion } from "framer-motion";

const categoryIcons = {
    "Fashion": "👗",
    "Jewelry": "💎",
    "Home": "🏠",
    "Beauty": "💄",
    "Accessories": "👜",
    "Electronics": "📱",
    "Books": "📚",
    "Sports": "⚽",
};

const categoryColors = {
    "Fashion": "from-pink-500/20 to-rose-500/20",
    "Jewelry": "from-yellow-500/20 to-amber-500/20",
    "Home": "from-blue-500/20 to-cyan-500/20",
    "Beauty": "from-purple-500/20 to-indigo-500/20",
    "Accessories": "from-orange-500/20 to-red-500/20",
    "Electronics": "from-gray-500/20 to-slate-500/20",
    "Books": "from-green-500/20 to-emerald-500/20",
    "Sports": "from-lime-500/20 to-green-500/20",
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
    },
};

const CategoryShowcase = memo(function CategoryShowcase({ categories = [], onCategorySelect }) {
    if (!categories || categories.length === 0) return null;

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-maroon/3 to-maroon/8 border-b border-maroon/10 py-12 md:py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="font-serif text-3xl md:text-4xl text-espresso dark:text-ivory mb-3">
                        Shop by Category
                    </h2>
                    <p className="text-espresso/60 dark:text-ivory/60 text-lg">
                        Explore our curated collections across different categories
                    </p>
                </motion.div>

                {/* Categories Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
                >
                    {categories.map((category, idx) => (
                        <motion.button
                            key={`${category}-${idx}`}
                            variants={itemVariants}
                            whileHover={{ scale: 1.05, y: -8 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onCategorySelect?.(category)}
                            className={`group relative p-6 rounded-2xl overflow-hidden transition-all duration-300`}
                            aria-label={`Shop ${category}`}
                            role="button"
                        >
                            {/* Background Gradient */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${categoryColors[category] || "from-maroon/10 to-maroon/5"} group-hover:from-maroon/30 group-hover:to-maroon/20 transition-all duration-300`}
                            />

                            {/* Border */}
                            <div className="absolute inset-0 border border-white/30 group-hover:border-white/60 rounded-2xl transition-colors duration-300" />

                            {/* Blur effect on hover */}
                            <div className="absolute inset-0 backdrop-blur-md rounded-2xl" />

                            {/* Content */}
                            <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                                {/* Icon */}
                                <motion.div
                                    className="text-4xl md:text-5xl"
                                    whileHover={{ rotate: 12, scale: 1.1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {categoryIcons[category] || "🛍️"}
                                </motion.div>

                                {/* Category Name */}
                                <span className="font-semibold text-espresso dark:text-ivory text-sm md:text-base group-hover:text-maroon dark:group-hover:text-rose-400 transition-colors duration-300">
                                    {category}
                                </span>

                                {/* Underline animation */}
                                <motion.div
                                    className="h-0.5 bg-gradient-to-r from-maroon to-maroon/50 w-0 group-hover:w-8 transition-all duration-300"
                                    layoutId={`underline-${category}`}
                                />
                            </div>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Bottom Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="mt-12 text-center"
                >
                    <p className="text-espresso/50 dark:text-ivory/50 text-sm">
                        Click any category to filter stores and explore curated collections
                    </p>
                </motion.div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Prevent re-renders if categories haven't changed
    return (
        JSON.stringify(prevProps.categories) === JSON.stringify(nextProps.categories) &&
        prevProps.onCategorySelect === nextProps.onCategorySelect
    );
});

CategoryShowcase.displayName = "CategoryShowcase";

export default CategoryShowcase;
