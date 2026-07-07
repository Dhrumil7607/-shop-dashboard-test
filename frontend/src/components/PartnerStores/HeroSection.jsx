/**
 * Hero Section Component - PartnerStores
 * Features statistics, CTA buttons, and smooth animations
 * Responsive design with 8-point grid
 */

import { motion } from "framer-motion";
import { Search, Zap } from "lucide-react";

const statsVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};

const statItemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

export default function HeroSection({ onSearchChange, onFiltersOpen }) {
    return (
        <div className="relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-maroon/8 via-transparent to-maroon/5" />

            <motion.div
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
                className="relative max-w-7xl mx-auto px-6 py-16 md:py-24 lg:py-32"
            >
                {/* Main Heading */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="inline-block mb-4 px-4 py-2 bg-maroon/10 rounded-full border border-maroon/20"
                    >
                        <span className="text-maroon text-sm font-semibold tracking-wide">
                            ✨ Discover Premium Stores
                        </span>
                    </motion.div>

                    <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-espresso mb-6 leading-tight">
                        Partner Stores
                    </h1>

                    <p className="text-lg md:text-xl text-espresso/70 max-w-2xl mx-auto leading-relaxed">
                        Explore curated collections from India's finest boutiques, artisans, and designers
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-16"
                >
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso/40 pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Search stores, designers, locations..."
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl bg-white/70 backdrop-blur-sm border border-white/50 placeholder:text-espresso/40 text-espresso focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-all duration-300 hover:bg-white/80"
                            aria-label="Search partner stores"
                        />
                    </div>

                    {/* Filter Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onFiltersOpen}
                        className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-maroon to-maroon/90 text-ivory rounded-xl font-semibold hover:shadow-lg hover:shadow-maroon/30 transition-all duration-300"
                        aria-label="Open filters"
                    >
                        <Zap size={20} />
                        <span className="hidden sm:inline">Filters</span>
                    </motion.button>
                </motion.div>

                {/* Statistics Grid */}
                <motion.div
                    variants={statsVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
                >
                    {[
                        { number: "500+", label: "Premium Stores", icon: "🏪" },
                        { number: "50K+", label: "Curated Products", icon: "🎁" },
                        { number: "100+", label: "Cities Across India", icon: "🗺️" },
                        { number: "4.8★", label: "Average Rating", icon: "⭐" },
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            variants={statItemVariants}
                            className="relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-maroon/10 to-maroon/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative p-6 md:p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40 hover:border-white/60 transition-all duration-300">
                                <div className="text-4xl md:text-5xl mb-3">{stat.icon}</div>
                                <div className="text-3xl md:text-4xl font-bold text-espresso mb-2">
                                    {stat.number}
                                </div>
                                <p className="text-espresso/70 font-medium">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
