import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { HERO_IMAGES } from "@/lib/collections";
import { ArrowDownRight } from "lucide-react";

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.1, delay, ease: [0.22, 0.61, 0.36, 1] },
});

export default function Hero({ onJoinWaitlist }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const yPrimary = useTransform(scrollYProgress, [0, 1], [0, 180]);
    const yFloatA = useTransform(scrollYProgress, [0, 1], [0, -120]);
    const yFloatB = useTransform(scrollYProgress, [0, 1], [0, 90]);
    const fadeBg = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

    return (
        <section
            ref={ref}
            data-testid="hero-section"
            className="relative min-h-screen w-full overflow-hidden bg-ivory grain"
        >
            {/* Top navigation strip */}
            <div className="absolute top-0 left-0 right-0 z-30 px-6 md:px-12 lg:px-20 pt-7 flex items-center justify-between">
                 <Link to="/" data-testid="nav-logo" className="flex items-center gap-3">
                     <span className="font-serif text-3xl md:text-5xl tracking-tight text-espresso">
                         ShopLive<span className="italic text-maroon">Bharat</span>
                     </span>
                 </Link>
                <div className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.28em] text-espresso/70">
                    <a href="#collections" className="under-link" data-testid="nav-collections">Collections</a>
                    <a href="#shop" className="under-link" data-testid="nav-shop">Shop</a>
                    <a href="#how" className="under-link" data-testid="nav-how">Experience</a>
                    <a href="#waitlist" className="under-link" data-testid="nav-waitlist">Waitlist</a>
                </div>
                <button
                    type="button"
                    onClick={onJoinWaitlist}
                    data-testid="nav-cta-join"
                    className="btn-pill btn-primary !py-2.5 !px-5 text-[10px]"
                >
                    Join
                </button>
            </div>

            {/* Floating accent images with parallax */}
            <motion.div
                style={{ y: yFloatA, opacity: fadeBg }}
                className="hidden md:block absolute top-[12%] left-[3%] w-[18vw] max-w-[260px] aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl z-10"
            >
                <img
                    src={HERO_IMAGES.floatingA}
                    alt="Ethnic editorial"
                    className="w-full h-full object-cover"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-maroon/20 via-transparent to-transparent" />
            </motion.div>

            <motion.div
                style={{ y: yFloatB, opacity: fadeBg }}
                className="hidden md:block absolute top-[22%] right-[4%] w-[20vw] max-w-[300px] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl z-10"
            >
                <img
                    src={HERO_IMAGES.floatingB}
                    alt="Bridal editorial"
                    className="w-full h-full object-cover"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-bl from-gold/15 via-transparent to-transparent" />
            </motion.div>

            {/* Centerpiece primary image with parallax */}
            <motion.div
                style={{ y: yPrimary }}
                className="absolute left-1/2 -translate-x-1/2 top-[50%] md:top-[40%] w-[68vw] md:w-[34vw] max-w-[440px] aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl z-0"
            >
                <img
                    src={HERO_IMAGES.primary}
                    alt="Luxury Indian fashion"
                    className="w-full h-full object-cover"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ivory" />
            </motion.div>

            {/* Foreground content */}
            <div className="relative z-20 px-6 md:px-12 lg:px-20 pt-52 md:pt-36 pb-24 max-w-[1400px] mx-auto">
                <motion.p
                    {...fade(0)}
                    data-testid="hero-eyebrow"
                    className="text-[11px] md:text-xs uppercase tracking-[0.32em] text-maroon mb-6 flex items-center gap-3"
                >
                    <span className="inline-block w-8 h-px bg-maroon/60" />
                    For Indians, anywhere in the world
                </motion.p>

                <motion.h1
                    {...fade(0.05)}
                    data-testid="hero-heading"
                    className="font-serif text-[2.6rem] leading-[1.02] sm:text-6xl md:text-[5rem] lg:text-[6.5rem] text-espresso tracking-tightest max-w-5xl"
                >
                    India's <span className="serif-italic text-maroon">luxury</span> live
                    <br className="hidden sm:block" /> shopping experience{" "}
                    <span className="serif-italic">is arriving soon.</span>
                </motion.h1>

                <motion.p
                    {...fade(0.18)}
                    data-testid="hero-subheading"
                    className="mt-7 md:mt-9 max-w-xl text-base md:text-lg leading-relaxed text-stone"
                >
                    Shop authentic ethnic wear from India's finest stores through live
                    video consultations — couture conversations, delivered worldwide.
                </motion.p>

                <motion.div
                    {...fade(0.32)}
                    className="mt-10 md:mt-14 flex flex-wrap items-center gap-4"
                >
                    <button
                        type="button"
                        onClick={onJoinWaitlist}
                        data-testid="hero-cta-waitlist"
                        className="btn-pill btn-primary group"
                    >
                        Join the waitlist
                        <ArrowDownRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" strokeWidth={1.5} />
                    </button>
                    <a
                        href="#shop"
                        data-testid="hero-cta-collections"
                        className="btn-pill btn-ghost"
                    >
                        Preview shop
                    </a>
                </motion.div>

                {/* Editorial credit line */}
                <motion.div
                    {...fade(0.5)}
                    className="absolute bottom-10 left-6 md:left-12 lg:left-20 right-6 md:right-12 lg:right-20 flex items-end justify-between text-[10px] uppercase tracking-[0.3em] text-stone/80"
                >
                    <div className="flex items-center gap-3">
                        <span className="inline-block w-8 h-px bg-stone/40" />
                        <span>Vol. 01 — The Launch Edit</span>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <span>Scroll</span>
                        <span className="inline-block w-8 h-px bg-stone/40" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
