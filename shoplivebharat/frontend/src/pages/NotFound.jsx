import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";
import { motion } from "framer-motion";
import { setMetaTags } from "@/lib/seo";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";

export default function NotFound() {
    const navigate = useNavigate();

    useEffect(() => {
        // Set SEO meta tags for 404 page
        setMetaTags({
            title: "Page Not Found | ShopLive Bharat",
            description: "The page you're looking for doesn't exist. Browse our collections or return to home.",
            keywords: "404, not found, error page",
            url: "https://shoplivebharat.com/404",
            type: "website",
        });
    }, []);

    return (
        <MarketplaceLayout>
        <div className="min-h-screen bg-gradient-to-b from-ivory to-cream flex items-center justify-center px-6 py-20">
            <div className="max-w-2xl w-full text-center">
                {/* 404 Animation */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="inline-block"
                    >
                        <div className="font-serif text-9xl md:text-[120px] font-bold bg-gradient-to-r from-maroon to-gold bg-clip-text text-transparent">
                            404
                        </div>
                    </motion.div>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-6"
                >
                    <h1 className="font-serif text-4xl md:text-5xl text-espresso">
                        Oops! Page Not Found
                    </h1>

                    <p className="text-lg text-espresso/70 max-w-md mx-auto">
                        The page you're looking for has wandered off to another collection. 
                        Let's help you find what you're seeking.
                    </p>

                    {/* Suggested Links */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12"
                    >
                        {/* Browse Marketplace */}
                        <Link
                            to="/marketplace"
                            className="group relative overflow-hidden rounded-xl bg-white border border-line-soft hover:border-maroon hover:shadow-lg transition-all duration-300 p-6"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-maroon/5 to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-maroon/10 to-gold/10 flex items-center justify-center group-hover:bg-maroon/20 transition-colors">
                                    <Search className="w-6 h-6 text-maroon" />
                                </div>
                                <h3 className="font-serif text-lg text-espresso">Browse Marketplace</h3>
                                <p className="text-sm text-espresso/60">Discover our premium collections</p>
                            </div>
                        </Link>

                        {/* Back to Home */}
                        <Link
                            to="/"
                            className="group relative overflow-hidden rounded-xl bg-white border border-line-soft hover:border-maroon hover:shadow-lg transition-all duration-300 p-6"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-maroon/5 to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-maroon/10 to-gold/10 flex items-center justify-center group-hover:bg-maroon/20 transition-colors">
                                    <Home className="w-6 h-6 text-maroon" />
                                </div>
                                <h3 className="font-serif text-lg text-espresso">Back to Home</h3>
                                <p className="text-sm text-espresso/60">Return to our homepage</p>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Additional Links */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
                    >
                        <Link
                            to="/live-shopping"
                            className="p-3 rounded-lg bg-gradient-to-br from-maroon/5 to-gold/5 hover:from-maroon/10 hover:to-gold/10 transition-all text-sm text-espresso font-medium"
                        >
                            Live Shopping
                        </Link>
                        <Link
                            to="/shops"
                            className="p-3 rounded-lg bg-gradient-to-br from-maroon/5 to-gold/5 hover:from-maroon/10 hover:to-gold/10 transition-all text-sm text-espresso font-medium"
                        >
                            Our Shops
                        </Link>
                        <Link
                            to="/about"
                            className="p-3 rounded-lg bg-gradient-to-br from-maroon/5 to-gold/5 hover:from-maroon/10 hover:to-gold/10 transition-all text-sm text-espresso font-medium"
                        >
                            About Us
                        </Link>
                        <Link
                            to="/contact"
                            className="p-3 rounded-lg bg-gradient-to-br from-maroon/5 to-gold/5 hover:from-maroon/10 hover:to-gold/10 transition-all text-sm text-espresso font-medium"
                        >
                            Contact
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    onClick={() => navigate(-1)}
                    className="mt-12 inline-flex items-center gap-2 px-6 py-3 bg-espresso text-ivory rounded-lg hover:bg-maroon transition-colors font-medium"
                >
                    <ArrowLeft size={18} />
                    Go Back
                </motion.button>

                {/* Decorative Elements */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="mt-20 text-6xl"
                >
                    🛍️
                </motion.div>

                <p className="mt-8 text-sm text-espresso/50">
                    Lost? Try using the search or navigation menu above.
                </p>
            </div>
        </div>
        </MarketplaceLayout>
    );
}
