import MarketplaceLayout from "@/layouts/MarketplaceLayout";

const HOW_IT_WORKS = [
    { n: "01", title: "Browse Indian Traditional Clothes", desc: "Curated stores, authentic crafts, premium fabrics." },
    { n: "02", title: "Add to Cart",                      desc: "Pick your size, color and quantity." },
    { n: "03", title: "Pay Securely Online",              desc: "Razorpay, PayPal, Stripe, Apple Pay & more." },
    { n: "04", title: "We Verify Your Order",             desc: "ShopLiveBharat collects and quality-checks every piece." },
    { n: "05", title: "Packed Safely",                    desc: "Premium packaging that protects on long journeys." },
    { n: "06", title: "Worldwide Delivery",               desc: "Tracked, insured, delivered to your doorstep." },
];

export default function About() {
    return (
        <MarketplaceLayout>
            <div style={{ backgroundColor: "#FAF9F6" }}>

                {/* ── OUR STORY ── */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 py-14">
                    <h1 className="font-serif text-4xl md:text-5xl mb-2" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                        Our Story
                    </h1>
                    <p className="text-sm mb-10" style={{ color: "#9B8B7A" }}>
                        Bringing the soul of India to the world.
                    </p>

                    <div className="max-w-2xl space-y-5 text-sm leading-relaxed" style={{ color: "#4A3F35" }}>
                        <p>
                            ShopLiveBharat was born from a simple longing — the longing for home that lives in every
                            Indian who has crossed an ocean. We believe traditional clothes carry stories, blessings, and
                            memories woven into every thread.
                        </p>
                        <p>
                            Our mission is to connect the Indian diaspora with the small, family-run stores that have
                            dressed our families for generations. From the Banarasi weavers of Varanasi to the Chikankari
                            masters of Lucknow, the bridal couturiers of Mumbai to the Garba specialists of Surat — they
                            all live on our marketplace.
                        </p>
                        <p>
                            Every order goes through our verification, packing and worldwide logistics, so you receive an
                            authentic piece — beautifully packed, on time, anywhere in the world.
                        </p>
                    </div>
                </section>

                {/* Divider */}
                <div className="border-t" style={{ borderColor: "#E8E4DF" }} />

                {/* ── MEET THE FOUNDER ── */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 py-14" id="founder">
                    <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: "#C9A84C" }}>
                        MEET THE FOUNDER
                    </p>
                    <h2 className="font-serif text-4xl md:text-5xl mb-10" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                        Smit Patel
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                        {/* Founder card */}
                        <div className="lg:col-span-1">
                            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                                <div className="aspect-[4/5] w-full flex items-center justify-center"
                                    style={{ background: "linear-gradient(135deg, #F0EBE3 0%, #E8DCC5 100%)" }}>
                                    <span className="font-serif text-6xl" style={{ color: "#C9A84C" }}>SP</span>
                                </div>
                                <div className="p-6">
                                    <p className="font-semibold text-lg" style={{ color: "#1a1a1a" }}>Smit Patel</p>
                                    <p className="text-sm" style={{ color: "#9B8B7A" }}>Founder, ShopLiveBharat</p>
                                    <p className="mt-4 font-serif text-base italic" style={{ color: "#8B3A3A" }}>
                                        “From India's Streets To Your Home.”
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Founder message */}
                        <div className="lg:col-span-2 space-y-5 text-sm leading-relaxed" style={{ color: "#4A3F35" }}>
                            <p>
                                Hi, I'm <strong style={{ color: "#1a1a1a" }}>Smit Patel</strong>, the Founder of ShopLiveBharat.
                            </p>
                            <p>
                                Growing up in India, I realized that countless local clothing stores offer beautiful
                                traditional wear, yet many of them have little or no online presence. At the same time,
                                Indians living abroad often struggle to find authentic Indian fashion at reasonable prices.
                                That gap inspired me to build ShopLiveBharat.
                            </p>
                            <p>
                                My vision is simple: <strong style={{ color: "#1a1a1a" }}>connect India's local fashion
                                stores with customers across the world.</strong>
                            </p>
                            <p>
                                Through ShopLiveBharat, we're creating a platform where customers can discover authentic
                                Indian clothing directly from trusted local retailers, enjoy live shopping experiences, and
                                have their purchases delivered worldwide. Our goal is not just to sell clothes, but to bring
                                the warmth, craftsmanship, and diversity of India's local markets to every doorstep.
                            </p>
                            <p>
                                I strongly believe that technology should empower small businesses. Every local shop
                                deserves the opportunity to reach a global audience without needing to build a complicated
                                online store or spend heavily on digital marketing.
                            </p>
                            <p>
                                As a young entrepreneur, I'm passionate about building products that solve real-world
                                problems while supporting local communities. Every feature we develop at ShopLiveBharat is
                                designed with one mission in mind: <strong style={{ color: "#1a1a1a" }}>From India's Streets
                                To Your Home.</strong>
                            </p>
                            <p>
                                This is only the beginning. My long-term vision is to make ShopLiveBharat the world's most
                                trusted destination for authentic Indian fashion, helping thousands of local retailers
                                expand globally while giving customers a seamless and personal shopping experience.
                            </p>
                            <p style={{ color: "#9B8B7A" }}>Thank you for being part of this journey.</p>
                        </div>
                    </div>
                </section>

                {/* Divider */}
                <div className="border-t" style={{ borderColor: "#E8E4DF" }} />

                {/* ── HOW IT WORKS ── */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 py-14" id="how">
                    <h2 className="font-serif text-4xl md:text-5xl mb-2" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                        How It Works
                    </h2>
                    <p className="text-sm mb-10" style={{ color: "#9B8B7A" }}>
                        Six simple steps from a store in India to your home.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {HOW_IT_WORKS.map(step => (
                            <div key={step.n} className="rounded-xl p-7 border"
                                style={{ backgroundColor: "white", borderColor: "#E8E4DF" }}>
                                <p className="font-serif text-4xl mb-4" style={{ color: "#C9A84C", fontWeight: 400 }}>
                                    {step.n}
                                </p>
                                <h3 className="font-semibold text-base mb-2" style={{ color: "#1a1a1a" }}>
                                    {step.title}
                                </h3>
                                <p className="text-sm" style={{ color: "#9B8B7A" }}>
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </MarketplaceLayout>
    );
}
