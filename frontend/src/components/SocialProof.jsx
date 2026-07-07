import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, Store, Layers } from "lucide-react";

const STATS = [
    { icon: Store, value: 250, suffix: "+", label: "Premium Indian stores joining" },
    { icon: Sparkles, value: 10000, suffix: "+", label: "Early members worldwide" },
    { icon: Layers, value: 50, suffix: "+", label: "Curated launch collections" },
];

function Counter({ to, suffix = "" }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    const [val, setVal] = useState(0);

    useEffect(() => {
        if (!inView) return;
        const duration = 1800;
        const start = performance.now();
        let animationFrameId;
        const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.floor(eased * to));
            if (p < 1) {
                animationFrameId = requestAnimationFrame(tick);
            }
        };
        animationFrameId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [inView, to]);

    return (
        <span ref={ref} className="font-serif text-5xl md:text-7xl text-espresso tracking-tightest tabular-nums">
            {val.toLocaleString()}{suffix}
        </span>
    );
}

export default function SocialProof({ liveCount }) {
    const items = STATS.map((s) =>
        s.label.includes("members") && liveCount ? { ...s, value: Math.max(s.value, liveCount) } : s
    );

    return (
        <section data-testid="social-proof" className="relative py-24 md:py-32 px-6 md:px-12 lg:px-20">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 md:mb-20">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-maroon mb-4">
                        Trusted worldwide
                    </p>
                    <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso">
                        A quiet movement, <span className="serif-italic">already in motion.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
                    {items.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            data-testid={`stat-${i}`}
                            className="text-center px-6"
                        >
                            <div className="w-12 h-12 mx-auto mb-6 rounded-full glass flex items-center justify-center text-maroon">
                                <s.icon className="w-5 h-5" strokeWidth={1.4} />
                            </div>
                            <Counter to={s.value} suffix={s.suffix} />
                            <div className="hairline w-24 mx-auto my-5" />
                            <p className="text-sm md:text-base text-stone max-w-[18ch] mx-auto">
                                {s.label}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Marquee strip */}
                <div className="mt-20 overflow-hidden border-t border-b border-line-soft py-5">
                    <div className="marquee gap-16 text-[11px] uppercase tracking-[0.4em] text-stone">
                        {Array.from({ length: 2 }).map((_, k) => (
                            <div key={k} className="flex items-center gap-16 px-8">
                                <span>Launching worldwide</span>
                                <span className="text-maroon">✦</span>
                                <span>Premium Indian ateliers</span>
                                <span className="text-maroon">✦</span>
                                <span>Live video shopping</span>
                                <span className="text-maroon">✦</span>
                                <span>Trusted global delivery</span>
                                <span className="text-maroon">✦</span>
                                <span>For the Indian wardrobe abroad</span>
                                <span className="text-maroon">✦</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
