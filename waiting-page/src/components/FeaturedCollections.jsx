import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { COLLECTIONS } from "@/lib/collections";

// Asymmetric "tetris" grid spans (mobile = full width)
const SPANS = [
    "md:col-span-7 md:row-span-2 aspect-[4/5] md:aspect-auto",      // 0 navratri (big tall)
    "md:col-span-5 aspect-[4/5]",                                   // 1 mehendi
    "md:col-span-5 aspect-[4/5]",                                   // 2 wedding-guest
    "md:col-span-5 aspect-[4/5]",                                   // 3 couple
    "md:col-span-7 aspect-[5/4]",                                   // 4 brides-sister (big wide)
    "md:col-span-12 aspect-[16/9] md:aspect-[21/8]",                // 5 festive panoramic
];

function Card({ c, span, i }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 0.61, 0.36, 1] }}
            className={`group relative overflow-hidden rounded-[1.6rem] md:rounded-[2.5rem] bg-cream min-h-[430px] sm:min-h-[500px] md:min-h-0 ${span}`}
            data-testid={`collection-card-${c.slug}`}
        >
            <Link
                to={`/collection/${c.slug}`}
                className="absolute inset-0 z-30"
                aria-label={c.name}
                data-testid={`collection-link-${c.slug}`}
            />
            <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Heavy dark overlay for text contrast */}
            <div className="absolute inset-0 bg-black/60 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            <div className="pointer-events-none relative z-20 h-full w-full flex flex-col justify-end p-6 sm:p-7 md:p-10">
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-[0.22em] sm:tracking-[0.3em] font-medium text-white">
                    <span className="inline-block w-6 h-px bg-white" />
                    Collection / {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-serif text-[2.4rem] sm:text-4xl md:text-5xl leading-[0.98] sm:leading-tight font-bold break-words max-w-[12ch] sm:max-w-none text-white">
                    {c.name}
                </h3>
                <p className="serif-italic text-lg md:text-lg text-white mt-2 leading-snug font-semibold max-w-[24ch]">
                    {c.tagline}
                </p>

                <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.28em] text-ivory/90 group-hover:text-ivory transition-colors font-medium">
                        Explore collection
                    </span>
                    <span className="shrink-0 w-10 h-10 rounded-full border border-ivory/70 flex items-center justify-center group-hover:bg-ivory group-hover:text-espresso transition-all duration-500">
                        <ArrowUpRight className="w-4 h-4" strokeWidth={1.4} />
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default function FeaturedCollections() {
    return (
        <section id="collections" data-testid="featured-collections" className="relative py-24 md:py-36 px-5 sm:px-6 md:px-12 lg:px-20 bg-ivory">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-12 gap-6 mb-14 md:mb-20">
                    <div className="col-span-12 md:col-span-7">
                        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] sm:tracking-[0.32em] text-maroon mb-5 font-medium">
                            The Launch Edit
                        </p>
                        <h2 className="font-serif text-[2.6rem] sm:text-5xl md:text-6xl text-espresso tracking-tightest leading-[1.04] font-medium">
                            Six chapters of <span className="serif-italic">cloth, colour</span>
                            <br className="hidden md:block" /> and ceremony.
                        </h2>
                    </div>
                    <div className="col-span-12 md:col-span-4 md:col-start-9 flex items-end">
                        <p className="text-base md:text-lg text-stone leading-relaxed font-normal">
                            Each capsule is a love letter to a moment — woven with India's
                            finest ateliers, ready to be unlocked at launch.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
                    {COLLECTIONS.map((c, i) => (
                        <Card key={c.slug} c={c} span={SPANS[i]} i={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
