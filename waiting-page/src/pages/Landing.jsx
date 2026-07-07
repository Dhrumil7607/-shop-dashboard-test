import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Headphones, Truck } from "lucide-react";
import Hero from "@/components/Hero";
import Countdown from "@/components/Countdown";
import HowItWorks from "@/components/HowItWorks";
import FeaturedCollections from "@/components/FeaturedCollections";
import ShopExperience from "@/components/ShopExperience";
import SocialProof from "@/components/SocialProof";
import Waitlist from "@/components/Waitlist";
import Footer from "@/components/Footer";
import { fetchLaunchInfo, fetchStats } from "@/lib/api";
import { getStoredLaunchDate, storeLaunchDate } from "@/lib/launchDate";

export default function Landing() {
    const [launchDate, setLaunchDate] = useState(getStoredLaunchDate);
    const [stats, setStats] = useState(null);
    const [waitlistOpen, setWaitlistOpen] = useState(false);

    useEffect(() => {
        fetchLaunchInfo().then((d) => {
            storeLaunchDate(d.launch_date);
            setLaunchDate(d.launch_date);
        }).catch(() => {});
        fetchStats().then(setStats).catch(() => {});
    }, []);

    return (
        <main data-testid="landing-page" className="bg-ivory text-espresso overflow-x-hidden">
            <Hero onJoinWaitlist={() => setWaitlistOpen(true)} />

            {/* Countdown floats over the hero/transition */}
            <div className="relative -mt-10 md:-mt-16 z-30">
                <Countdown launchDate={launchDate} />
            </div>

            <div className="px-6 md:px-12 lg:px-20">
                <p className="ornament text-base md:text-lg max-w-3xl mx-auto py-2">
                    <span>An exclusive launch arriving soon</span>
                </p>
            </div>

            <HowItWorks />

            <FeaturedCollections />

            <ShopExperience />

            {/* CTA Section - Shop Now (removed routing, just informational) */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="relative py-24 md:py-32 px-6 md:px-12 lg:px-20 bg-maroon text-ivory"
            >
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-serif text-4xl md:text-5xl mb-6 leading-tight">
                        Ready to Discover?
                    </h2>
                    <p className="text-lg md:text-xl text-ivory/80 mb-8">
                        Explore our curated marketplace and shop from exclusive Indian artisans and designers. Launching very soon!
                    </p>
                    <button
                        onClick={() => setWaitlistOpen(true)}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-ivory text-maroon rounded-lg font-semibold hover:bg-opacity-90 transition"
                    >
                        Join Waitlist
                        <ArrowRight size={20} />
                    </button>
                </div>
            </motion.section>

            {/* Features Section */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="relative py-24 md:py-32 px-6 md:px-12 lg:px-20"
            >
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-serif text-4xl md:text-5xl text-center mb-16 text-espresso">
                        Why Shop With Us
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="text-center">
                            <div className="h-20 w-20 bg-maroon/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag size={32} className="text-maroon" />
                            </div>
                            <h3 className="font-semibold text-xl text-espresso mb-3">
                                100% Authentic
                            </h3>
                            <p className="text-espresso/70 leading-relaxed">
                                Every piece is sourced directly from verified artisans and designers. We guarantee authenticity on all products.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="text-center">
                            <div className="h-20 w-20 bg-maroon/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Truck size={32} className="text-maroon" />
                            </div>
                            <h3 className="font-semibold text-xl text-espresso mb-3">
                                Free Shipping
                            </h3>
                            <p className="text-espresso/70 leading-relaxed">
                                Free shipping on orders above ₹5,000. Fast and reliable delivery across India and worldwide.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="text-center">
                            <div className="h-20 w-20 bg-maroon/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Headphones size={32} className="text-maroon" />
                            </div>
                            <h3 className="font-semibold text-xl text-espresso mb-3">
                                24/7 Support
                            </h3>
                            <p className="text-espresso/70 leading-relaxed">
                                Have questions? Our dedicated support team is here to help. Contact us anytime.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.section>

            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="relative py-24 md:py-32 px-6 md:px-12 lg:px-20"
                data-testid="quote-section"
            >
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-maroon mb-6">
                        A note from the founders
                    </p>
                    <p className="font-serif text-3xl md:text-5xl text-espresso leading-[1.18] tracking-tightest">
                        <span className="serif-italic">"For every Indian abroad,</span> we are
                        building the kind of wardrobe that arrives like a letter from home —
                        unhurried, intimate, and unmistakably ours."
                    </p>
                    <p className="mt-6 text-[11px] uppercase tracking-[0.32em] text-maroon">
                        Smit Patel
                    </p>
                </div>
            </motion.section>

            <SocialProof liveCount={stats?.total_members} />

            <Waitlist embedded />

            <Footer />

            <Waitlist open={waitlistOpen} onOpenChange={setWaitlistOpen} />
        </main>
    );
}
