import { motion } from "framer-motion";
import { Search, Sparkles, Video, Plane } from "lucide-react";

const STEPS = [
    {
        n: "01",
        icon: Search,
        title: "Browse the atelier",
        body: "Discover hand-picked Indian ethnic collections — bridal, festive and everyday — sourced from India's most loved boutiques.",
    },
    {
        n: "02",
        icon: Sparkles,
        title: "Curate & request",
        body: "Save the silhouettes that speak to you and book a private live consultation at a time that suits your timezone.",
    },
    {
        n: "03",
        icon: Video,
        title: "Shop live with India",
        body: "Walk through the store on video. See the fall of the fabric, the shimmer of the zari, ask anything — in real time.",
    },
    {
        n: "04",
        icon: Plane,
        title: "Delivered worldwide",
        body: "We pack, document and ship your piece in luxury, trusted packaging — door to door, anywhere on earth.",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1],
        },
    },
    hover: {
        y: -12,
        transition: {
            duration: 0.4,
            ease: "easeOut",
        },
    },
};

export default function HowItWorks() {
    return (
        <section id="how" data-testid="how-it-works" className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20 overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 -z-10 opacity-30">
                <motion.div
                    className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-maroon/20 to-transparent rounded-full blur-3xl"
                    animate={{
                        y: [0, 50, 0],
                        x: [0, 30, 0],
                    }}
                    transition={{
                        duration: 15,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                />
                <motion.div
                    className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-tr from-gold/10 to-transparent rounded-full blur-3xl"
                    animate={{
                        y: [0, -40, 0],
                        x: [0, -20, 0],
                    }}
                    transition={{
                        duration: 18,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <motion.div
                    className="grid grid-cols-12 gap-8 md:gap-12 mb-16 md:mb-24"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
                >
                    <div className="col-span-12 md:col-span-5">
                        <motion.p
                            className="text-[11px] uppercase tracking-[0.32em] text-maroon mb-5"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                        >
                            The experience
                        </motion.p>
                        <motion.h2
                            className="font-serif text-4xl sm:text-5xl md:text-6xl text-espresso tracking-tightest leading-[1.05]"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                        >
                            Four steps to a wardrobe that{" "}
                            <span className="serif-italic text-maroon">arrives like art.</span>
                        </motion.h2>
                    </div>
                    <div className="col-span-12 md:col-span-6 md:col-start-7 flex items-end">
                        <motion.p
                            className="text-base md:text-lg text-stone leading-relaxed"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                        >
                            We've reimagined the journey from <em className="serif-italic">scroll</em> to{" "}
                            <em className="serif-italic">silhouette</em>. Every piece is touched by a
                            human — never by an algorithm alone.
                        </motion.p>
                    </div>
                </motion.div>

                {/* Cards Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={s.n}
                            variants={cardVariants}
                            whileHover="hover"
                            data-testid={`step-card-${i + 1}`}
                            className="group relative h-full smooth-transition"
                        >
                            {/* Glass morphism background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl rounded-[2rem] border border-white/25 shadow-glass-lg group-hover:shadow-glass-xl group-hover:from-white/50 group-hover:to-white/30 smooth-transition" />
                            
                            {/* Content */}
                            <div className="relative p-8 md:p-10 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-10">
                                    <motion.span
                                        className="font-serif text-5xl text-maroon/25 leading-none"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
                                    >
                                        {s.n}
                                    </motion.span>
                                    
                                    <motion.div
                                        className="w-12 h-12 rounded-full glass backdrop-blur-md flex items-center justify-center text-maroon group-hover:bg-maroon group-hover:text-ivory group-hover:shadow-maroon-glow smooth-transition"
                                        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
                                        whileHover={{ scale: 1.1, rotate: 10 }}
                                    >
                                        <s.icon className="w-5 h-5" strokeWidth={1.4} />
                                    </motion.div>
                                </div>

                                <motion.h3
                                    className="font-serif text-2xl md:text-[1.7rem] text-espresso mb-3 leading-snug"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.25 + i * 0.08, duration: 0.6 }}
                                >
                                    {s.title}
                                </motion.h3>

                                <motion.p
                                    className="text-sm md:text-[0.95rem] text-stone leading-relaxed flex-grow"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                                >
                                    {s.body}
                                </motion.p>

                                <motion.div
                                    className="hairline mt-8 bg-gradient-to-r from-transparent via-maroon/20 to-transparent"
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    transition={{ delay: 0.35 + i * 0.08, duration: 0.6 }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
