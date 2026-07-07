import MarketplaceLayout from "@/layouts/MarketplaceLayout";

export default function RefundPolicy() {
    return (
        <MarketplaceLayout>
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                        Refund & Return Policy
                    </h1>
                    <p className="text-lg text-espresso/70">
                        Last updated: June 2026
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">Overview</h2>
                        <p className="text-espresso/70 leading-relaxed">
                            At ShopLiveBharat, we want you to be completely satisfied with your purchase. If you
                            need to return, exchange, or request a refund, we've made the process simple and
                            hassle-free.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">1. Return Eligibility</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            Items may be returned within 30 days of purchase if:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>The item is unused and in original condition</li>
                            <li>Original tags and packaging are intact</li>
                            <li>The item is not damaged or altered</li>
                            <li>You have the order receipt or order number</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">2. Non-Returnable Items</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            The following items cannot be returned:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Customized or personalized products</li>
                            <li>Undergarments and intimate apparel</li>
                            <li>Items marked as final sale</li>
                            <li>Items purchased during clearance sales</li>
                            <li>Damaged items (unless due to our error)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">3. Return Process</h2>
                        <div className="space-y-4 bg-ivory border border-line-soft rounded-lg p-6">
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Step 1: Initiate Return</h3>
                                <p className="text-espresso/70 text-sm">
                                    Contact us at returns@shoplivebharat.com with your order number and reason for return
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Step 2: Get Return Label</h3>
                                <p className="text-espresso/70 text-sm">
                                    We'll email you a prepaid return shipping label
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Step 3: Ship Item</h3>
                                <p className="text-espresso/70 text-sm">
                                    Pack the item securely and ship it using the provided label
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-2">Step 4: Receive Refund</h3>
                                <p className="text-espresso/70 text-sm">
                                    Once we receive and inspect the item, we'll process your refund within 5-7 business days
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">4. Exchanges</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            For exchanges:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Contact us with your order number and desired size/color</li>
                            <li>If the new item is more expensive, you pay the difference</li>
                            <li>If the new item is less expensive, we'll refund the difference</li>
                            <li>Free return shipping is provided</li>
                            <li>Processing time: 10-14 business days</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">5. Refund Timeline</h2>
                        <div className="bg-gray-50 border border-line-soft rounded-lg p-6">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="font-semibold text-maroon min-w-fit">2-3 days:</span>
                                    <span className="text-espresso/70">Item ships from your location</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="font-semibold text-maroon min-w-fit">2-5 days:</span>
                                    <span className="text-espresso/70">Item arrives at our warehouse</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="font-semibold text-maroon min-w-fit">1-2 days:</span>
                                    <span className="text-espresso/70">We inspect and verify the item</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="font-semibold text-maroon min-w-fit">5-7 days:</span>
                                    <span className="text-espresso/70">Refund processed to original payment method</span>
                                </li>
                            </ul>
                            <p className="text-sm text-espresso/60 mt-4">
                                Total: 10-17 business days from return initiation
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">6. Defective Items</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            If you receive a defective or damaged item:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Contact us immediately with photos of the defect</li>
                            <li>We'll arrange a replacement or full refund</li>
                            <li>Return shipping is free for our error</li>
                            <li>Replacement ships immediately upon return receipt</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">7. Partial Refunds</h2>
                        <p className="text-espresso/70 leading-relaxed">
                            Partial refunds may be issued for:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Items with minor defects that are acceptable to you</li>
                            <li>Slightly used items returned within the return window</li>
                            <li>Items with loose stitching or minor wear</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">8. International Returns</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            For returns from outside India:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Contact us for return authorization</li>
                            <li>We'll provide you with a return address</li>
                            <li>International return shipping fees apply (customer's responsibility)</li>
                            <li>Please obtain tracking for your shipment</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">9. Special Circumstances</h2>
                        <p className="text-espresso/70 leading-relaxed mb-4">
                            For purchases with special conditions:
                        </p>
                        <ul className="list-disc list-inside text-espresso/70 space-y-2">
                            <li>Sale items (30% or more off): Not returnable</li>
                            <li>Flash sale items: Not returnable</li>
                            <li>Gift cards: Not returnable</li>
                            <li>Made-to-order items: Contact us for options</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-espresso mb-4">10. Contact Us</h2>
                        <div className="bg-gray-50 border border-line-soft rounded-lg p-6 space-y-3">
                            <div>
                                <h3 className="font-semibold text-espresso mb-1">Email</h3>
                                <p className="text-espresso/70">returns@shoplivebharat.com</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-1">Phone</h3>
                                <p className="text-espresso/70">+91 (555) 123-4567</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-espresso mb-1">Hours</h3>
                                <p className="text-espresso/70">Monday - Friday: 9 AM - 6 PM IST</p>
                            </div>
                        </div>
                    </section>

                    <div className="bg-maroon/10 border border-maroon/30 rounded-lg p-6 mt-12">
                        <h3 className="font-semibold text-espresso mb-2">Need Help?</h3>
                        <p className="text-espresso/70 text-sm">
                            If you have questions about our return policy, please don't hesitate to contact us.
                            We're here to make sure you're completely satisfied with your purchase.
                        </p>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
