import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Countdown from "@/components/Countdown";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";
import { COLLECTION_BY_SLUG, COLLECTIONS } from "@/lib/collections";
import { fetchLaunchInfo } from "@/lib/api";
import { getStoredLaunchDate, storeLaunchDate } from "@/lib/launchDate";

export default function CollectionPreview() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const c = COLLECTION_BY_SLUG[slug];
    const [launchDate, setLaunchDate] = useState(getStoredLaunchDate);
    const [waitlistOpen, setWaitlistOpen] = useState(false);

    useEffect(() => {
        if (!c) {
            navigate("/", { replace: true });
            return;
        }
        fetchLaunchInfo().then((d) => {
            storeLaunchDate(d.launch_date);
            setLaunchDate(d.launch_date);
        }).catch(() => {});
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [slug, c, navigate]);

    if (!c) return null;

    return (
        <main data-testid="collection-preview-page" className="relative bg-ivory text-espresso min-h-screen overflow-x-hidden">
            {/* Blurred ethnic backdrop */}
            <div className="absolute inset-0 z-0">
                <img
                    src={c.image}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    style={{ filter: "blur(12px) saturate(110%)", transform: "scale(1.05)" }}
                />
                <div className="absolute inset-0 bg-ivory/60" />
                <div className="absolute inset-0 bg-gradient-to-b from-ivory/30 via-ivory/45 to-ivory" />
            </div>

            <div className="relative z-10">
                {/* Top bar */}
                <div className="px-5 sm:px-6 md:px-12 lg:px-20 pt-6 md:pt-7 flex items-center justify-between gap-4">
                    <Link to="/" data-testid="preview-nav-logo" className="font-serif text-xl md:text-2xl tracking-tight text-espresso">
                        ShopLive<span className="italic text-maroon">Bharat</span>
                    </Link>
                    <button
                        onClick={() => navigate("/")}
                        data-testid="preview-back-home"
                        className="shrink-0 flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.28em] text-espresso/75 hover:text-maroon transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.6} /> <span className="hidden sm:inline">Return home</span><span className="sm:hidden">Home</span>
                    </button>
                </div>

                <section className="px-5 sm:px-6 md:px-12 lg:px-20 pt-16 sm:pt-20 md:pt-28 pb-10 md:pb-20 max-w-6xl mx-auto text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.32em] text-maroon font-medium mb-5"
                        data-testid="preview-eyebrow"
                    >
                        Collection · {c.name}
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.05 }}
                        data-testid="preview-heading"
                        className="font-serif text-[2.85rem] sm:text-6xl md:text-[6.5rem] leading-[1.02] text-espresso tracking-tightest max-w-[10ch] sm:max-w-none mx-auto font-medium"
                    >
                        This collection will be{" "}
                        <span className="serif-italic">available at launch.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        data-testid="preview-tagline"
                        className="serif-italic text-xl md:text-2xl text-stone mt-6 leading-snug font-medium"
                    >
                        {c.tagline}
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="text-sm md:text-base text-stone max-w-xl mx-auto mt-5 leading-relaxed font-normal"
                    >
                        {c.description} Be awaited — exclusive styles are arriving soon.
                    </motion.p>
                </section>

                <Countdown launchDate={launchDate} compact eyebrow="Early access will open soon" />

                {/* Floating teaser images */}
                <div className="px-5 sm:px-6 md:px-12 lg:px-20 mt-10 md:mt-12 mb-8 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        {COLLECTIONS
                            .filter((x) => x.slug !== c.slug)
                            .slice(0, 3)
                            .map((x, i) => (
                                <motion.div
                                    key={x.slug}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: i * 0.03 }}
                                    className="relative overflow-hidden rounded-2xl md:rounded-[1.6rem] aspect-[4/5] sm:aspect-[3/4] min-h-[260px] sm:min-h-0"
                                >
                                    <img src={x.image} alt={x.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/40 to-transparent" />
                                    <Link
                                        to={`/collection/${x.slug}`}
                                        data-testid={`preview-related-${x.slug}`}
                                        className="absolute inset-0 z-10"
                                        aria-label={x.name}
                                    />
                                    <div className="absolute bottom-4 left-4 right-4 md:bottom-5 md:left-5 md:right-5 text-white">
                                        <p className="text-[9px] md:text-[10px] uppercase tracking-[0.22em] md:tracking-[0.28em] opacity-100 font-medium">Awaiting</p>
                                        <p className="font-serif text-2xl sm:text-lg md:text-2xl leading-tight font-semibold break-words">{x.name}</p>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </div>

                <section className="px-5 sm:px-6 md:px-12 lg:px-20 pt-8 pb-24 text-center">
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => setWaitlistOpen(true)}
                            data-testid="preview-cta-waitlist"
                            className="btn-pill btn-primary"
                        >
                            Join the waitlist
                        </button>
                        <Link to="/" data-testid="preview-cta-home" className="btn-pill btn-ghost">
                            Return home
                        </Link>
                    </div>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-maroon mt-10 font-medium">
                        Launching soon worldwide ✦ Be awaited
                    </p>
                </section>
            </div>

            <Footer />

            <Waitlist open={waitlistOpen} onOpenChange={setWaitlistOpen} />
        </main>
    );
}
