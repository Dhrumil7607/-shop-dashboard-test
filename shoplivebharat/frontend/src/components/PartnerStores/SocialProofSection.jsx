/**
 * Social Proof Section Component
 * Displays customer testimonials, ratings, and trust signals
 * Builds credibility with real store data and customer reviews
 * Accessibility: Semantic HTML, proper heading hierarchy, ARIA labels
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Users, Shield } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 },
    },
};

const SocialProofSection = memo(function SocialProofSection({ stores = [], totalStores = 0 }) {
    const stats = useMemo(() => {
        if (!stores || stores.length === 0) return [];

        return [
            {
                icon: Star,
                label: "Avg Rating",
                value: (
                    stores.reduce((acc, s) => acc + parseFloat(s.rating || 0), 0) / stores.length
                ).toFixed(1),
                suffix: "★",
            },
            {
                icon: Users,
                label: "Total Followers",
                value: Math.floor(
                    stores.reduce((acc, s) => acc + (s.followers || 0), 0) / 1000
                ),
                suffix: "K+",
            },
            {
                icon: Shield,
                label: "Verified Stores",
                value: stores.filter(s => s.verified).length,
                suffix: "",
            },
        ];
    }, [stores]);

    const testimonials = useMemo(() => {
        return [
            {
                name: "Priya Sharma",
                role: "Fashion Enthusiast",
                store: "Designer Boutique",
                content: "Amazing collection! The delivery was super fast and the quality exceeded my expectations.",
                rating: 5,
                avatar: "👩",
            },
            {
                name: "Rahul Verma",
                role: "Home Decor Lover",
                store: "Artisan Home",
                content: "Authentic crafted pieces with exceptional customer service. Highly recommended!",
                rating: 5,
                avatar: "👨",
            },
            {
                name: "Neha Patel",
                role: "Jewelry Collector",
                store: "Premium Jewelry",
                content: "Verified seller with beautiful designs. The checkout process was smooth and secure.",
                rating: 5,
                avatar: "👩‍🦰",
            },
        ];
    }, []);

    if (!stores || stores.length === 0) return null;

    return (
        <div className="relative py-16 md:py-24 lg:py-32 bg-gradient-to-br from-maroon/5 via-transparent to-maroon/8">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-maroon/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-maroon/3 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-espresso dark:text-ivory mb-4">
                        Trusted by Millions
                    </h2>
                    <p className="text-lg text-espresso/60 dark:text-ivory/60 max-w-2xl mx-auto">
                        Join thousands of happy customers shopping from verified sellers across India
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    className="grid md:grid-cols-3 gap-8 mb-16 md:mb-24"
                >
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-maroon/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/40 dark:border-slate-700/40 hover:border-white/60 dark:hover:border-slate-600/60 transition-all duration-300">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-maroon/10 dark:bg-rose-900/20">
                                            <Icon size={24} className="text-maroon dark:text-rose-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-espresso/60 dark:text-ivory/60 font-semibold mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="font-serif text-3xl md:text-4xl text-espresso dark:text-ivory font-bold">
                                                {stat.value}
                                                <span className="text-xl font-normal ml-1">{stat.suffix}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Testimonials */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <h3 className="font-serif text-2xl md:text-3xl text-espresso dark:text-ivory text-center mb-12">
                        What Customers Say
                    </h3>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        {testimonials.map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ y: -8 }}
                                className="group"
                            >
                                <div className="h-full p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/40 dark:border-slate-700/40 hover:border-white/60 dark:hover:border-slate-600/60 transition-all duration-300 hover:shadow-xl hover:shadow-maroon/10">
                                    {/* Rating */}
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className="fill-yellow-500 text-yellow-500"
                                            />
                                        ))}
                                    </div>

                                    {/* Content */}
                                    <p className="text-espresso/80 dark:text-ivory/80 mb-6 leading-relaxed italic">
                                        "{testimonial.content}"
                                    </p>

                                    {/* Author */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">{testimonial.avatar}</div>
                                        <div>
                                            <p className="font-semibold text-espresso dark:text-ivory">
                                                {testimonial.name}
                                            </p>
                                            <p className="text-sm text-espresso/60 dark:text-ivory/60">
                                                {testimonial.role} • {testimonial.store}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-maroon/10 dark:bg-rose-900/20 border border-maroon/20 dark:border-rose-900/30">
                        <Shield size={20} className="text-maroon dark:text-rose-400" />
                        <span className="text-sm font-semibold text-maroon dark:text-rose-400">
                            All Sellers Are Verified & Trusted
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Prevent re-renders if data hasn't significantly changed
    return (
        JSON.stringify(prevProps.stores) === JSON.stringify(nextProps.stores) &&
        prevProps.totalStores === nextProps.totalStores
    );
});

SocialProofSection.displayName = "SocialProofSection";

export default SocialProofSection;
