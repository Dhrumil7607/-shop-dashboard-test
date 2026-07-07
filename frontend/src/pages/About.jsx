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
