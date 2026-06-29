import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
    ArrowRight, 
    ShoppingBag, 
    Globe, 
    Video, 
    Package, 
    Star, 
    Heart,
    Zap,
    Users,
    Award,
    Truck,
    Headphones,
    MapPin,
    CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { fetchMarketplaceStats, fetchShops } from "@/lib/api";
import { MOCK_SHOPS, MOCK_PRODUCTS } from "@/lib/testData";

export default function HomePage() {
    const [stats, setStats] = useState(null);
    const [shops, setShops] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, shopsData] = await Promise.all([
                fetchMarketplaceStats(),
                fetchShops({ active_only: true, limit: 6 })
            ]);
            setStats(statsData);
            setShops(shopsData?.length > 0 ? shopsData : MOCK_SHOPS.slice(0, 6));
            setFeaturedProducts(MOCK_PRODUCTS.filter(p => p.is_featured).slice(0, 6));
        } catch (error) {
            setShops(MOCK_SHOPS.slice(0, 6));
            setFeaturedProducts(MOCK_PRODUCTS.filter(p => p.is_featured).slice(0, 6));
        }
    };

    return (
        <MarketplaceLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-maroon/10 to-transparent pt-12 pb-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            <div>
                                <p className="text-maroon text-sm uppercase tracking-widest font-semibold mb-3">
                                    Welcome to ShopLiveBharat
                                </p>
                                <h1 className="font-serif text-5xl md:text-6xl text-espresso leading-tight">
                                    Discover Traditional Indian Fashion
                                </h1>
                            </div>

                            <p className="text-lg text-espresso/70 leading-relaxed">
                                Explore handcrafted traditional clothing from the finest artisans and designers across India. 
                                Shop directly from local boutiques with real-time video guidance, worldwide shipping, and professional 
                                packing videos included in every order.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/marketplace"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-maroon text-ivory rounded-lg hover:bg-maroon/90 transition font-semibold"
                                >
                                    Shop Now
                                    <ArrowRight size={20} />
                                </Link>
                                <Link
                                    to="/live-shopping"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-maroon text-maroon rounded-lg hover:bg-maroon/5 transition font-semibold"
                                >
                                    <Video size={20} />
                                    Book Live Session
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-maroon" size={24} />
                                    <div>
                                        <p className="font-semibold text-espresso">100% Authentic</p>
                                        <p className="text-sm text-espresso/60">Verified artisans</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-maroon" size={24} />
                                    <div>
                                        <p className="font-semibold text-espresso">Worldwide Shipping</p>
                                        <p className="text-sm text-espresso/60">Free above ₹5,000</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="hidden lg:block">
                            <div className="rounded-lg overflow-hidden bg-gradient-to-br from-maroon/20 to-maroon/5 h-96 flex items-center justify-center border-4 border-maroon/10">
                                <div className="text-center">
                                    <ShoppingBag size={80} className="text-maroon/30 mx-auto mb-4" />
                                    <p className="text-maroon/40 text-lg">Traditional Fashion Marketplace</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-espresso text-ivory py-16 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <p className="text-4xl font-bold mb-2">{stats?.shops || 50}+</p>
                            <p className="text-ivory/70">Exclusive Shops</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold mb-2">{stats?.products || 250}+</p>
                            <p className="text-ivory/70">Curated Products</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold mb-2">{stats?.waitlist_members?.toLocaleString() || "10,000"}+</p>
                            <p className="text-ivory/70">Happy Customers</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold mb-2">150+</p>
                            <p className="text-ivory/70">Countries</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Features */}
            <div className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-serif text-4xl md:text-5xl text-center text-espresso mb-16">
                        Why Choose ShopLiveBharat
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                            <div className="h-16 w-16 bg-maroon/10 rounded-lg flex items-center justify-center mb-6">
                                <Video className="text-maroon" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-espresso mb-3">Live Shopping Experience</h3>
                            <p className="text-espresso/70 mb-4">
                                Book personalized video sessions with expert teams. Get real-time guidance while shopping and see products live.
                            </p>
                            <Link to="/live-shopping" className="text-maroon font-semibold hover:text-maroon/70 transition flex items-center gap-2">
                                Learn More <ArrowRight size={18} />
                            </Link>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                            <div className="h-16 w-16 bg-maroon/10 rounded-lg flex items-center justify-center mb-6">
                                <Package className="text-maroon" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-espresso mb-3">Professional Packing Videos</h3>
                            <p className="text-espresso/70 mb-4">
                                Every order includes a professional packing video. Watch how your items are carefully packaged with care.
                            </p>
                            <p className="text-maroon font-semibold">Included in every order</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                            <div className="h-16 w-16 bg-maroon/10 rounded-lg flex items-center justify-center mb-6">
                                <Globe className="text-maroon" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-espresso mb-3">Worldwide Shipping</h3>
                            <p className="text-espresso/70 mb-4">
                                Ship to 150+ countries worldwide. We handle all international logistics securely and reliably.
                            </p>
                            <p className="text-maroon font-semibold">Fast & Affordable</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                            <div className="h-16 w-16 bg-maroon/10 rounded-lg flex items-center justify-center mb-6">
                                <Award className="text-maroon" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-espresso mb-3">100% Authentic</h3>
                            <p className="text-espresso/70 mb-4">
                                Every piece is sourced directly from verified artisans and designers. We guarantee authenticity.
                            </p>
                            <p className="text-maroon font-semibold">Direct from makers</p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                            <div className="h-16 w-16 bg-maroon/10 rounded-lg flex items-center justify-center mb-6">
                                <Truck className="text-maroon" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-espresso mb-3">Free Shipping</h3>
                            <p className="text-espresso/70 mb-4">
                                Free shipping on orders above ₹5,000. Reliable delivery across India and worldwide.
                            </p>
                            <p className="text-maroon font-semibold">No hidden charges</p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white rounded-lg border border-line-soft p-8 hover:shadow-lg transition">
                            <div className="h-16 w-16 bg-maroon/10 rounded-lg flex items-center justify-center mb-6">
                                <Headphones className="text-maroon" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-espresso mb-3">24/7 Customer Support</h3>
                            <p className="text-espresso/70 mb-4">
                                Our dedicated support team is always ready to help. Contact us anytime for assistance.
                            </p>
                            <Link to="/contact" className="text-maroon font-semibold hover:text-maroon/70 transition flex items-center gap-2">
                                Contact Us <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Shops */}
            <div className="bg-gray-50 py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <p className="text-maroon text-sm uppercase tracking-widest font-semibold mb-2">Our Partners</p>
                            <h2 className="font-serif text-4xl md:text-5xl text-espresso">Featured Shops</h2>
                        </div>
                        <Link
                            to="/shops"
                            className="hidden md:flex items-center gap-2 text-maroon font-semibold hover:text-maroon/70 transition"
                        >
                            View All <ArrowRight size={20} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {shops.slice(0, 6).map((shop) => (
                            <div
                                key={shop.id}
                                className="bg-white rounded-lg border border-line-soft overflow-hidden hover:shadow-lg transition"
                            >
                                <div className="h-40 bg-gray-100 overflow-hidden">
                                    <img
                                        src={shop.image_url}
                                        alt={shop.name}
                                        className="w-full h-full object-cover hover:scale-105 transition"
                                        onError={(e) => { e.target.src = "/shop-assets/banner-1.jpg"; }}
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-espresso mb-1">{shop.name}</h3>
                                    <p className="text-sm text-maroon font-semibold mb-2">{shop.specialty}</p>
                                    <p className="text-xs text-espresso/60 mb-4">{shop.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-espresso/70 mb-4">
                                        <MapPin size={14} />
                                        {shop.city}, {shop.country}
                                    </div>
                                    <Link
                                        to="/shops"
                                        className="text-maroon text-sm font-semibold hover:text-maroon/70 transition"
                                    >
                                        Explore Shop →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center md:hidden">
                        <Link
                            to="/shops"
                            className="inline-flex items-center gap-2 text-maroon font-semibold hover:text-maroon/70 transition"
                        >
                            View All Shops <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-serif text-4xl md:text-5xl text-center text-espresso mb-16">
                        How It Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Browse Shops",
                                description: "Explore our curated collection of artisan shops from across India"
                            },
                            {
                                step: "02",
                                title: "Book Live Session",
                                description: "Optional: Schedule a video call with experts for personal guidance"
                            },
                            {
                                step: "03",
                                title: "Shop & Checkout",
                                description: "Add products to cart and proceed to secure checkout"
                            },
                            {
                                step: "04",
                                title: "Receive & Enjoy",
                                description: "Get your order with professional packing video and worldwide tracking"
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="text-center">
                                    <div className="h-16 w-16 bg-maroon text-ivory rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                                        {item.step}
                                    </div>
                                    <h3 className="font-bold text-lg text-espresso mb-2">{item.title}</h3>
                                    <p className="text-espresso/70 text-sm">{item.description}</p>
                                </div>
                                {idx < 3 && (
                                    <div className="hidden md:block absolute top-8 -right-6 text-maroon/30">
                                        <ArrowRight size={32} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials */}
            <div className="bg-maroon/5 py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <h2 className="font-serif text-4xl md:text-5xl text-center text-espresso mb-16">
                        What Our Customers Say
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Anjali Desai",
                                location: "USA",
                                text: "Finally found authentic Indian clothing from home. The video shopping session was amazing and the packing video gave me so much confidence.",
                                rating: 5
                            },
                            {
                                name: "Rohit Patel",
                                location: "UK",
                                text: "ShopLiveBharat brings the essence of Indian fashion to my doorstep. Quality and authenticity guaranteed. Highly recommend!",
                                rating: 5
                            },
                            {
                                name: "Priya Sharma",
                                location: "Australia",
                                text: "The live shopping experience is incredible. I got personalized guidance and received beautiful products with professional packing.",
                                rating: 5
                            }
                        ].map((testimonial, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-8 border border-line-soft">
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={18} className="fill-maroon text-maroon" />
                                    ))}
                                </div>
                                <p className="text-espresso/70 mb-6 italic">"{testimonial.text}"</p>
                                <div>
                                    <p className="font-bold text-espresso">{testimonial.name}</p>
                                    <p className="text-sm text-espresso/60">{testimonial.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-maroon to-maroon/80 text-ivory py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-serif text-4xl md:text-5xl mb-6">
                        Ready to Experience Indian Fashion?
                    </h2>
                    <p className="text-lg text-ivory/80 mb-8 max-w-2xl mx-auto">
                        Join thousands of customers worldwide discovering authentic, handcrafted traditional clothing. 
                        Shop now with confidence.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/marketplace"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-ivory text-maroon rounded-lg hover:bg-opacity-90 transition font-semibold"
                        >
                            Start Shopping
                            <ArrowRight size={20} />
                        </Link>
                        <Link
                            to="/live-shopping"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-ivory text-ivory rounded-lg hover:bg-ivory/10 transition font-semibold"
                        >
                            <Video size={20} />
                            Book Live Session - ₹1,500
                        </Link>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-serif text-4xl md:text-5xl text-center text-espresso mb-16">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        {[
                            {
                                q: "Do you ship worldwide?",
                                a: "Yes! We ship to 150+ countries. Shipping costs vary by location and are calculated at checkout."
                            },
                            {
                                q: "Are all products authentic?",
                                a: "Absolutely. We source directly from verified artisans and designers. Every product comes with authenticity guarantee."
                            },
                            {
                                q: "What is the live shopping session?",
                                a: "A personalized video call with our experts (₹1,500). Get real-time guidance while shopping, see products live, and receive professional packing video for your order."
                            },
                            {
                                q: "Is free shipping available?",
                                a: "Yes! Free shipping on orders above ₹5,000. Worldwide shipping with reliable tracking."
                            },
                            {
                                q: "How long does delivery take?",
                                a: "Within India: 5-7 business days. International: 10-15 business days depending on location."
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white rounded-lg border border-line-soft p-6">
                                <h3 className="font-bold text-lg text-espresso mb-3">{item.q}</h3>
                                <p className="text-espresso/70">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
