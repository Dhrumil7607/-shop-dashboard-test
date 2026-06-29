import MarketplaceLayout from "@/layouts/MarketplaceLayout";

export default function About() {
    return (
        <MarketplaceLayout>
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                        About ShopLiveBharat
                    </h1>
                    <p className="text-lg text-espresso/70">
                        India's first luxury live-shopping marketplace
                    </p>
                </div>

                {/* Story */}
                <div className="prose prose-lg max-w-none mb-12">
                    <div className="bg-ivory border border-line-soft rounded-lg p-8 mb-8">
                        <h2 className="font-serif text-3xl text-espresso mb-4">Our Story</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            ShopLiveBharat was born from a simple idea: to create a bridge between India's
                            finest artisans and the Indian diaspora worldwide. We believe that luxury fashion
                            is not just about products — it's about stories, heritage, and connections.
                        </p>
                        <p className="text-espresso/70 leading-relaxed">
                            Founded in 2024, we've brought together the best of Indian craftsmanship with
                            modern technology to create an unparalleled shopping experience.
                        </p>
                    </div>

                    <div className="bg-ivory border border-line-soft rounded-lg p-8 mb-8">
                        <h2 className="font-serif text-3xl text-espresso mb-4">Our Mission</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            To celebrate and elevate Indian luxury fashion by creating a global marketplace
                            that connects discerning customers with authentic, artisan-crafted pieces.
                        </p>
                        <p className="text-espresso/70 leading-relaxed">
                            We are committed to supporting local artisans, promoting sustainable fashion,
                            and delivering an exceptional shopping experience with every interaction.
                        </p>
                    </div>

                    <div className="bg-ivory border border-line-soft rounded-lg p-8 mb-8">
                        <h2 className="font-serif text-3xl text-espresso mb-4">Our Values</h2>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <span className="text-maroon font-bold">✦</span>
                                <div>
                                    <h3 className="font-semibold text-espresso">Authenticity</h3>
                                    <p className="text-espresso/70 text-sm">Every piece is genuine and verified</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-maroon font-bold">✦</span>
                                <div>
                                    <h3 className="font-semibold text-espresso">Quality</h3>
                                    <p className="text-espresso/70 text-sm">We maintain the highest standards</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-maroon font-bold">✦</span>
                                <div>
                                    <h3 className="font-semibold text-espresso">Heritage</h3>
                                    <p className="text-espresso/70 text-sm">Celebrating Indian craftsmanship</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-maroon font-bold">✦</span>
                                <div>
                                    <h3 className="font-semibold text-espresso">Community</h3>
                                    <p className="text-espresso/70 text-sm">Building a global Indian community</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-ivory border border-line-soft rounded-lg p-8">
                        <h2 className="font-serif text-3xl text-espresso mb-4">Why ShopLiveBharat?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Curated Selection</h3>
                                <p className="text-espresso/70 text-sm">
                                    Every product is handpicked for quality and authenticity
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Direct from Artisans</h3>
                                <p className="text-espresso/70 text-sm">
                                    Fair pricing that supports creators
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Global Shipping</h3>
                                <p className="text-espresso/70 text-sm">
                                    Delivered to 100+ countries
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Premium Experience</h3>
                                <p className="text-espresso/70 text-sm">
                                    Luxury shopping, reimagined
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center py-12 border-t border-line-soft">
                    <h3 className="font-serif text-3xl text-espresso mb-4">Ready to Discover?</h3>
                    <a
                        href="/shop"
                        className="inline-block px-8 py-3 bg-maroon text-ivory rounded-lg font-semibold hover:bg-maroon/90 transition"
                    >
                        Shop Now
                    </a>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
