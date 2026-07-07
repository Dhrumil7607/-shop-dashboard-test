/**
 * Skeleton Components for PartnerStores Page
 * Provides accessible loading states with Framer Motion animations
 * Follows 8-point grid system and maintains visual hierarchy
 */

import { motion } from "framer-motion";

const skeletonVariants = {
    animate: {
        backgroundColor: ["rgba(168, 28, 28, 0.05)", "rgba(168, 28, 28, 0.1)", "rgba(168, 28, 28, 0.05)"],
        transition: {
            duration: 1.5,
            repeat: Infinity,
        },
    },
};

export function StoreSkeleton() {
    return (
        <motion.div variants={skeletonVariants} animate="animate" className="space-y-4">
            {/* Title Skeleton */}
            <div className="h-8 bg-maroon/10 rounded-lg w-3/4" />

            {/* Description Skeleton */}
            <div className="space-y-2">
                <div className="h-4 bg-maroon/5 rounded w-full" />
                <div className="h-4 bg-maroon/5 rounded w-5/6" />
            </div>

            {/* Info Grid Skeleton */}
            <div className="grid grid-cols-3 gap-4 mt-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-maroon/5 rounded-xl" />
                ))}
            </div>
        </motion.div>
    );
}

export function StoreCardSkeleton() {
    return (
        <motion.div
            variants={skeletonVariants}
            animate="animate"
            className="rounded-2xl overflow-hidden bg-white/40 backdrop-blur-md border border-white/40"
        >
            {/* Image Skeleton */}
            <div className="h-64 bg-maroon/5" />

            {/* Content Skeleton */}
            <div className="p-5 space-y-4">
                <div className="h-4 bg-maroon/5 rounded w-1/3" />
                <div className="h-6 bg-maroon/5 rounded w-full" />
                <div className="h-4 bg-maroon/5 rounded w-1/2" />
                <div className="flex gap-2">
                    <div className="h-8 bg-maroon/5 rounded flex-1" />
                    <div className="h-8 bg-maroon/5 rounded flex-1" />
                </div>
            </div>
        </motion.div>
    );
}

export function StoreListItemSkeleton() {
    return (
        <motion.div
            variants={skeletonVariants}
            animate="animate"
            className="p-4 rounded-xl bg-white/40 backdrop-blur-sm border border-white/40 space-y-2"
        >
            <div className="h-4 bg-maroon/5 rounded w-4/5" />
            <div className="h-3 bg-maroon/5 rounded w-3/5" />
        </motion.div>
    );
}

export function FilterSkeleton() {
    return (
        <motion.div
            variants={skeletonVariants}
            animate="animate"
            className="space-y-3"
        >
            <div className="h-4 bg-maroon/5 rounded w-1/2 mb-4" />
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-maroon/5 rounded" />
                    <div className="h-3 bg-maroon/5 rounded flex-1" />
                </div>
            ))}
        </motion.div>
    );
}

export function HeroSkeleton() {
    return (
        <motion.div
            variants={skeletonVariants}
            animate="animate"
            className="relative overflow-hidden py-24"
        >
            <div className="max-w-7xl mx-auto px-6 space-y-6">
                <div className="h-12 bg-maroon/5 rounded-lg w-3/4 mx-auto" />
                <div className="h-6 bg-maroon/5 rounded-lg w-1/2 mx-auto" />
                <div className="flex gap-4 justify-center">
                    <div className="h-10 bg-maroon/5 rounded-lg w-32" />
                    <div className="h-10 bg-maroon/5 rounded-lg w-32" />
                </div>
            </div>
        </motion.div>
    );
}
