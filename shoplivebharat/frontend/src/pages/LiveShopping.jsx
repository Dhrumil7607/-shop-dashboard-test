import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Video, Package, Globe, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useCurrency } from "@/contexts/CurrencyContext";
import { fetchShops } from "@/lib/api";
import { MOCK_SHOPS } from "@/lib/testData";
import { setMetaTags } from "@/lib/seo";

export default function LiveShopping() {
    const navigate = useNavigate();
    const { formatPrice } = useCurrency();
    const [shops, setShops] = useState([]);
    const [bookingData, setBookingData] = useState({
        date: "",
        time: "",
        city: "",
        customerName: "",
        email: "",
        phone: "",
        preferredProducts: ""
    });
    const [bookingStep, setBookingStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Set SEO meta tags for live shopping page
        setMetaTags({
            title: "Book Live Shopping Session | Premium Guidance | ShopLive Bharat",
            description: "Personalized video shopping session with expert consultants from India's finest boutiques. Book your private consultation and discover luxury collections.",
            keywords: "live shopping session, video shopping, personal consultant, Indian fashion experts, luxury consultation",
            url: "https://shoplivebharat.com/live-shopping",
            type: "website",
        });
        loadShops();
    }, []);

    const loadShops = async () => {
        try {
            const data = await fetchShops({ active_only: true });
            if (data && data.length > 0) {
                setShops(data.slice(0, 6));
            } else {
                setShops(MOCK_SHOPS.slice(0, 6));
            }
        } catch (error) {
            console.error("Error loading shops:", error);
            setShops(MOCK_SHOPS.slice(0, 6));
        }
    };

    const indianCities = [
        "Ahmedabad",
        "Surat"
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBookingData({ ...bookingData, [name]: value });
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        if (bookingStep < 3) {
            setBookingStep(bookingStep + 1);
            return;
        }

        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Navigate to booking confirmation page with booking data
            navigate("/booking-confirmation", { 
                state: { bookingData }
            });
        } catch (error) {
            toast.error("Failed to book session. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MarketplaceLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Hero Section */}
                <div className="mb-16">
                    <div className="bg-gradient-to-r from-maroon/10 to-maroon/5 rounded-lg border border-maroon/20 p-12 text-center">
                        <h1 className="font-serif text-5xl md:text-6xl mb-4 text-espresso">
                            Live Premium Shopping
                        </h1>
                        <p className="text-lg text-espresso/70 mb-6 max-w-2xl mx-auto">
                            Book a personalized video shopping session with our expert teams across India. Get real-time guidance, 
                            see products live, and receive professional packing videos. Available worldwide.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            <div className="flex items-center gap-2 text-espresso">
                                <Video size={20} className="text-maroon" />
                                <span>Real-Time Video Guidance</span>
                            </div>
                            <div className="flex items-center gap-2 text-espresso">
                                <Package size={20} className="text-maroon" />
                                <span>Professional Packing Videos</span>
                            </div>
                            <div className="flex items-center gap-2 text-espresso">
                                <Globe size={20} className="text-maroon" />
                                <span>Worldwide Shipping</span>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-maroon">
                            <motion.span
                                key={`price-1500`}
                                initial={{ opacity: 0.5, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0.5, scale: 0.8 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                            >
                                {formatPrice(1500)} per Video Call Session
                            </motion.span>
                        </div>
                        <p className="text-sm text-espresso/60 mt-2">
                            Valid whether you purchase or not
                        </p>
                    </div>
                </div>

                {/* Featured Partner Stores Section */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl md:text-4xl font-serif text-espresso">
                            Featured Partner Stores
                        </h2>
                        <button
                            onClick={() => navigate("/partner-stores")}
                            className="flex items-center gap-2 text-maroon hover:text-maroon/70 transition font-semibold"
                        >
                            View All
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shops.map((shop, index) => (
                            <motion.div
                                key={shop.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 0.61, 0.36, 1] }}
                                onClick={() => navigate("/partner-stores")}
                                className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-line-soft hover:shadow-xl transition-all duration-500"
                            >
                                {/* Shop Image */}
                                <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-maroon/5 to-maroon/10">
                                    {shop.image_url ? (
                                        <img
                                            src={shop.image_url}
                                            alt={shop.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-maroon/20">
                                            <Package size={60} />
                                        </div>
                                    )}
                                    {shop.rating && (
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                                            <span className="text-yellow-500">★</span>
                                            <span className="font-semibold text-espresso text-sm">{shop.rating}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Shop Info */}
                                <div className="p-6">
                                    <h3 className="font-serif text-xl text-espresso mb-1 line-clamp-1">
                                        {shop.name}
                                    </h3>
                                    <p className="text-sm text-espresso/60 mb-4 line-clamp-1">
                                        by {shop.owner_name}
                                    </p>

                                    <p className="text-sm text-espresso/70 mb-4 line-clamp-2 min-h-10">
                                        {shop.description || "Curated collection of premium items"}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-espresso/60 mb-4">
                                        <MapPin size={16} className="text-maroon" />
                                        <span>{shop.location || "Ahmedabad"}</span>
                                    </div>

                                    <button className="w-full py-2 bg-maroon/10 text-maroon rounded-lg hover:bg-maroon hover:text-ivory transition font-medium text-sm">
                                        Explore Store
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="text-center mb-12">
                    <h3 className="text-2xl font-serif text-espresso mb-2">Ready to Book?</h3>
                    <p className="text-espresso/60">Select a city and time slot below to start your premium shopping experience</p>
                </div>

                {/* Booking Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    {/* Left Column - Features */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-line-soft p-8 sticky top-20">
                            <h2 className="text-2xl font-bold text-espresso mb-6">
                                What You Get
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <Check className="text-maroon flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <h3 className="font-semibold text-espresso mb-1">Expert Guidance</h3>
                                        <p className="text-sm text-espresso/60">Personal expert assistance to help you find perfect pieces</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Check className="text-maroon flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <h3 className="font-semibold text-espresso mb-1">Live Product Showcase</h3>
                                        <p className="text-sm text-espresso/60">See items up close and ask questions in real-time</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Check className="text-maroon flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <h3 className="font-semibold text-espresso mb-1">Packing Video</h3>
                                        <p className="text-sm text-espresso/60">Receive professional packaging video for your order</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Check className="text-maroon flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <h3 className="font-semibold text-espresso mb-1">Worldwide Shipping</h3>
                                        <p className="text-sm text-espresso/60">Fast & secure delivery to any country</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Check className="text-maroon flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <h3 className="font-semibold text-espresso mb-1">No Purchase Obligation</h3>
                                        <p className="text-sm text-espresso/60">Session fee applies regardless of purchases</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Booking Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg border border-line-soft p-8">
                            <h2 className="text-2xl font-bold text-espresso mb-2">
                                Book Your Session
                            </h2>
                            <p className="text-espresso/60 mb-8">
                                Step {bookingStep} of 3
                            </p>

                            {/* Progress Bar */}
                            <div className="flex gap-2 mb-8">
                                {[1, 2, 3].map((step) => (
                                    <div
                                        key={step}
                                        className={`h-2 flex-1 rounded transition ${
                                            step <= bookingStep
                                                ? "bg-maroon"
                                                : "bg-gray-200"
                                        }`}
                                    />
                                ))}
                            </div>

                            <form onSubmit={handleBooking}>
                                {/* Step 1 - Date & Time */}
                                {bookingStep === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-espresso mb-2">
                                                Preferred Date *
                                            </label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={bookingData.date}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-espresso mb-2">
                                                Preferred Time *
                                            </label>
                                            <select
                                                name="time"
                                                value={bookingData.time}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                                required
                                            >
                                                <option value="">Select a time slot</option>
                                                <option value="09:00-10:00">09:00 AM - 10:00 AM</option>
                                                <option value="10:00-11:00">10:00 AM - 11:00 AM</option>
                                                <option value="11:00-12:00">11:00 AM - 12:00 PM</option>
                                                <option value="14:00-15:00">2:00 PM - 3:00 PM</option>
                                                <option value="15:00-16:00">3:00 PM - 4:00 PM</option>
                                                <option value="16:00-17:00">4:00 PM - 5:00 PM</option>
                                                <option value="18:00-19:00">6:00 PM - 7:00 PM</option>
                                                <option value="19:00-20:00">7:00 PM - 8:00 PM</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-espresso mb-2">
                                                Select City *
                                            </label>
                                            <select
                                                name="city"
                                                value={bookingData.city}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                                required
                                            >
                                                <option value="">Select a city</option>
                                                {indianCities.map((city) => (
                                                    <option key={city} value={city}>
                                                        {city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 - Personal Info */}
                                {bookingStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-espresso mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="customerName"
                                                value={bookingData.customerName}
                                                onChange={handleInputChange}
                                                placeholder="Your full name"
                                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-espresso mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={bookingData.email}
                                                onChange={handleInputChange}
                                                placeholder="your.email@example.com"
                                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-espresso mb-2">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={bookingData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+91 98765 43210"
                                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 - Preferences */}
                                {bookingStep === 3 && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-espresso mb-2">
                                                Preferred Products/Interests
                                            </label>
                                            <textarea
                                                name="preferredProducts"
                                                value={bookingData.preferredProducts}
                                                onChange={handleInputChange}
                                                placeholder="E.g., Traditional sarees, lehengas, jewelry, or any specific styles you're interested in..."
                                                className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none min-h-32"
                                                rows="4"
                                            />
                                        </div>

                                        <div className="bg-maroon/5 border border-maroon/20 rounded-lg p-4">
                                            <h3 className="font-semibold text-espresso mb-2">Booking Summary</h3>
                                            <div className="text-sm text-espresso/70 space-y-1">
                                                <p><span className="font-semibold">Date:</span> {bookingData.date}</p>
                                                <p><span className="font-semibold">Time:</span> {bookingData.time}</p>
                                                <p><span className="font-semibold">City:</span> {bookingData.city}</p>
                                                <p className="pt-2 border-t border-maroon/20 text-espresso font-semibold mt-2">
                                                    Session Fee: <motion.span
                                                        key={`session-fee`}
                                                        initial={{ opacity: 0.5 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0.5 }}
                                                        transition={{ duration: 0.4 }}
                                                    >
                                                        {formatPrice(1500)}
                                                    </motion.span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex gap-4 mt-8">
                                    {bookingStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setBookingStep(bookingStep - 1)}
                                            className="px-6 py-3 border border-maroon text-maroon rounded-lg hover:bg-maroon/5 transition font-medium"
                                        >
                                            Back
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition font-medium disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Processing..." : bookingStep < 3 ? "Continue" : "Complete Booking"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Available Cities */}
                <div className="bg-gray-50 rounded-lg border border-line-soft p-12">
                    <h2 className="text-3xl font-bold text-espresso mb-8 text-center">
                        Available Across India
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {indianCities.map((city) => (
                            <div
                                key={city}
                                className="flex items-center gap-2 p-4 bg-white rounded-lg border border-line-soft"
                            >
                                <MapPin size={18} className="text-maroon flex-shrink-0" />
                                <span className="font-medium text-espresso">{city}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-16 mb-12">
                    <h2 className="text-3xl font-bold text-espresso mb-8 text-center">
                        Frequently Asked Questions
                    </h2>
                    <div className="grid gap-6 max-w-3xl mx-auto">
                        <div className="bg-white rounded-lg border border-line-soft p-6">
                            <h3 className="font-bold text-espresso mb-2">How does the live shopping session work?</h3>
                            <p className="text-espresso/70">
                                After booking, our expert team will call you at the scheduled time via video. We'll showcase our collection, 
                                answer your questions, and help you find perfect pieces. You can purchase during or after the session.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg border border-line-soft p-6">
                            <h3 className="font-bold text-espresso mb-2">Is the session charge refundable?</h3>
                            <p className="text-espresso/70">
                                The {formatPrice(1500)} session fee is non-refundable. However, if you make a purchase during or within 7 days of your session, 
                                {formatPrice(500)} will be credited to your account.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg border border-line-soft p-6">
                            <h3 className="font-bold text-espresso mb-2">Do you ship worldwide?</h3>
                            <p className="text-espresso/70">
                                Yes! We ship to all countries. Shipping costs vary based on location and weight. 
                                Our team will provide exact quotes during your session.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg border border-line-soft p-6">
                            <h3 className="font-bold text-espresso mb-2">Will I receive packing videos?</h3>
                            <p className="text-espresso/70">
                                Yes! Professional packing videos are provided for all orders. This shows the care and attention 
                                we put into packaging your items.
                            </p>
                        </div>

                        <div className="bg-white rounded-lg border border-line-soft p-6">
                            <h3 className="font-bold text-espresso mb-2">What if I want to see products from other cities?</h3>
                            <p className="text-espresso/70">
                                No problem! Our network spans across India's major cities. You can book sessions with different locations 
                                to explore diverse collections from different artisans and designers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
