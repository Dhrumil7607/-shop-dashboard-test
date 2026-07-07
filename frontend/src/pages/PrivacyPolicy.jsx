import MarketplaceLayout from "@/layouts/MarketplaceLayout";

export default function PrivacyPolicy() {
    return (
        <MarketplaceLayout>
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-espresso/70">
                        Last updated: June 2026
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">1. Introduction</h2>
                        <p className="text-espresso/70 leading-relaxed">
                            ShopLiveBharat ("Company," "we," "us," or "our") operates the marketplace website
                            and platform. This Privacy Policy explains how we collect, use, disclose, and
                            safeguard your information when you visit our website and use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">2. Information We Collect</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Personal Data</h3>
                                <ul className="list-disc list-inside text-espresso/70 space-y-1">
                                    <li>Name and email address</li>
                                    <li>Phone number</li>
                                    <li>Shipping and billing address</li>
                                    <li>Payment information</li>
                                    <li>Account login credentials</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Browsing Data</h3>
                                <ul className="list-disc list-inside text-espresso/70 space-y-1">
                                    <li>IP address</li>
                                    <li>Browser type and version</li>
                                    <li>Pages visited and time spent</li>
                                    <li>Referring website</li>
                                    <li>Cookies and similar technologies</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">3. How We Use Your Information</h2>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Process and fulfill your orders</li>
                            <li>Send order confirmations and updates</li>
                            <li>Respond to your inquiries</li>
                            <li>Send marketing communications (with consent)</li>
                            <li>Improve our website and services</li>
                            <li>Detect and prevent fraud</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">4. Data Security</h2>
                        <p className="text-espresso/70 leading-relaxed">
                            We implement appropriate technical and organizational measures to protect your
                            personal data against unauthorized access, alteration, disclosure, or destruction.
                            However, no method of transmission over the Internet is 100% secure. We cannot
                            guarantee absolute security of your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">5. Cookies and Tracking</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            We use cookies and similar technologies to enhance your browsing experience. Cookies
                            help us remember your preferences and track website usage. You can control cookie
                            settings through your browser.
                        </p>
                        <div className="bg-gray-50 border border-line-soft rounded-lg p-4">
                            <p className="text-sm text-espresso/70">
                                Types of cookies we use:
                            </p>
                            <ul className="list-disc list-inside text-sm text-espresso/70 mt-2">
                                <li>Essential cookies (for site functionality)</li>
                                <li>Performance cookies (analytics)</li>
                                <li>Functional cookies (user preferences)</li>
                                <li>Marketing cookies (with consent)</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">6. Third-Party Sharing</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            We may share your information with:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Payment processors to process transactions</li>
                            <li>Shipping partners to deliver orders</li>
                            <li>Service providers who assist us</li>
                            <li>Law enforcement (if required by law)</li>
                        </ul>
                        <p className="text-espresso/70 leading-relaxed mt-4">
                            We do not sell your personal data to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">7. Your Rights</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Access your personal data</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Port your data to another service</li>
                            <li>Lodge a complaint with regulators</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">8. International Transfers</h2>
                        <p className="text-espresso/70 leading-relaxed">
                            Your information may be transferred to, stored in, and processed in countries other
                            than your country of residence. These countries may have data protection laws that
                            differ from your home country.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">9. Children's Privacy</h2>
                        <p className="text-espresso/70 leading-relaxed">
                            Our platform is not intended for children under 13. We do not knowingly collect
                            personal data from children. If we become aware that we have collected data from a
                            child under 13, we will delete it immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">10. Policy Updates</h2>
                        <p className="text-espresso/70 leading-relaxed">
                            We may update this Privacy Policy periodically. We will notify you of significant
                            changes by posting the updated policy on our website with an updated "Last updated"
                            date. Your continued use of our platform constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">11. Contact Us</h2>
                        <p className="text-espresso/70 leading-relaxed">
                            If you have questions about this Privacy Policy or our privacy practices, please
                            contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-gray-50 border border-line-soft rounded-lg">
                            <p className="text-espresso font-medium">ShopLiveBharat</p>
                            <p className="text-espresso/70">Email: privacy@shoplivebharat.com</p>
                            <p className="text-espresso/70">Phone: +91 (555) 123-4567</p>
                            <p className="text-espresso/70">Address: Mumbai, India</p>
                        </div>
                    </section>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
