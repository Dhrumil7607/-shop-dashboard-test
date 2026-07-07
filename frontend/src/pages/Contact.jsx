import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";

export default function Contact() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            toast.success("Message sent! We'll get back to you soon.");
            setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        } catch (error) {
            toast.error("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-espresso/70 max-w-2xl mx-auto">
                        Have questions about our products or need support? We'd love to hear from
                        you. Reach out to our team and we'll respond as soon as possible.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    {/* Contact Cards */}
                    <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                        <div className="h-12 w-12 bg-maroon/10 rounded-lg flex items-center justify-center mb-4">
                            <Mail size={24} className="text-maroon" />
                        </div>
                        <h3 className="font-semibold text-lg text-espresso mb-2">Email Us</h3>
                        <p className="text-espresso/70 mb-4">
                            Send us an email and we'll respond within 24 hours.
                        </p>
                        <a
                            href="mailto:support@shoplivebharat.com"
                            className="text-maroon hover:text-maroon/70 font-medium transition"
                        >
                            support@shoplivebharat.com
                        </a>
                    </div>

                    <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                        <div className="h-12 w-12 bg-maroon/10 rounded-lg flex items-center justify-center mb-4">
                            <Phone size={24} className="text-maroon" />
                        </div>
                        <h3 className="font-semibold text-lg text-espresso mb-2">Call Us</h3>
                        <p className="text-espresso/70 mb-4">
                            Available Monday to Friday, 10 AM - 6 PM IST.
                        </p>
                        <a
                            href="tel:+919876543210"
                            className="text-maroon hover:text-maroon/70 font-medium transition"
                        >
                            +91 98765 43210
                        </a>
                    </div>

                    <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                        <div className="h-12 w-12 bg-maroon/10 rounded-lg flex items-center justify-center mb-4">
                            <MapPin size={24} className="text-maroon" />
                        </div>
                        <h3 className="font-semibold text-lg text-espresso mb-2">Visit Us</h3>
                        <p className="text-espresso/70">
                            Mumbai, India
                            <br />
                            Open by appointment
                        </p>
                    </div>
                </div>

                {/* Contact Form & Map */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Form */}
                    <div>
                        <h2 className="font-serif text-3xl text-espresso mb-8">Send us a Message</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-xs uppercase tracking-widest text-maroon mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Your name"
                                        className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-xs uppercase tracking-widest text-maroon mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none transition"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-maroon mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none transition"
                                />
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-xs uppercase tracking-widest text-maroon mb-2">
                                    Subject *
                                </label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none transition"
                                    required
                                >
                                    <option value="">Select a subject</option>
                                    <option value="general">General Inquiry</option>
                                    <option value="product">Product Question</option>
                                    <option value="order">Order Support</option>
                                    <option value="return">Returns & Exchanges</option>
                                    <option value="partnership">Partnership</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-xs uppercase tracking-widest text-maroon mb-2">
                                    Message *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="Tell us how we can help..."
                                    rows="6"
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none transition resize-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-espresso text-ivory rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
                            >
                                {loading && <Loader size={20} className="animate-spin" />}
                                {loading ? "Sending..." : "Send Message"}
                                {!loading && <Send size={20} />}
                            </button>
                        </form>
                    </div>

                    {/* Info & FAQ */}
                    <div>
                        {/* FAQ */}
                        <h2 className="font-serif text-3xl text-espresso mb-8">
                            Frequently Asked Questions
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg text-espresso mb-2">
                                    What is your return policy?
                                </h3>
                                <p className="text-espresso/70">
                                    We offer free returns within 30 days of purchase. Items must be
                                    unused and in original condition with all tags attached.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-espresso mb-2">
                                    How long does shipping take?
                                </h3>
                                <p className="text-espresso/70">
                                    Standard shipping takes 5-7 business days across India. Express
                                    options available in select cities.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-espresso mb-2">
                                    Are products authentic?
                                </h3>
                                <p className="text-espresso/70">
                                    100% authentic products sourced directly from our partner
                                    designers and artisans. Each item is verified for quality.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-espresso mb-2">
                                    Do you offer international shipping?
                                </h3>
                                <p className="text-espresso/70">
                                    Yes! We ship worldwide. Shipping costs and delivery times vary
                                    by location. Contact us for international inquiries.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-espresso mb-2">
                                    Can I track my order?
                                </h3>
                                <p className="text-espresso/70">
                                    Yes. You'll receive a tracking number via email once your order
                                    ships. Track it in real-time on your account.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-espresso mb-2">
                                    What payment methods do you accept?
                                </h3>
                                <p className="text-espresso/70">
                                    We accept all major credit cards, debit cards, UPI, and digital
                                    wallets (Apple Pay, Google Pay).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Newsletter */}
                <div className="mt-20 py-12 bg-maroon/5 rounded-lg border border-maroon/20 px-8 text-center">
                    <h2 className="font-serif text-3xl text-espresso mb-4">
                        Subscribe to Our Newsletter
                    </h2>
                    <p className="text-espresso/70 mb-6 max-w-2xl mx-auto">
                        Get exclusive updates on new collections, special offers, and fashion tips
                        delivered to your inbox.
                    </p>
                    <div className="flex gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 rounded-lg border border-line-soft focus:border-maroon outline-none"
                        />
                        <button className="px-8 py-3 bg-maroon text-ivory rounded-lg font-medium hover:bg-maroon/90 transition whitespace-nowrap">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
