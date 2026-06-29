import { useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Mail, Phone } from "lucide-react";
import { setMetaTags } from "@/lib/seo";

export default function UnderMaintenance() {
    useEffect(() => {
        setMetaTags({
            title: "Under Maintenance | ShopLive Bharat",
            description: "ShopLive Bharat is under maintenance. We'll be back soon with exciting updates!",
            keywords: "maintenance, under maintenance",
            url: "https://shoplivebharat.com/maintenance",
            type: "website",
        });
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 },
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-maroon/10 via-ivory to-cream flex items-center justify-center px-6 py-20">
            <motion.div
                className="max-w-2xl w-full text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Animated Icon */}
                <motion.div
                    variants={itemVariants}
                    className="flex justify-center mb-8"
                >
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 bg-gradient-to-br from-maroon/20 to-gold/20 rounded-full flex items-center justify-center"
                    >
                        <Clock className="w-12 h-12 text-maroon" />
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    variants={itemVariants}
                    className="font-serif text-5xl md:text-6xl text-espresso mb-4"
                >
                    We'll Be Back Soon
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    variants={itemVariants}
                    className="text-2xl text-maroon font-serif mb-6"
                >
                    Maintenance in Progress
                </motion.p>

                {/* Description */}
                <motion.p
                    variants={itemVariants}
                    className="text-lg text-espresso/70 max-w-md mx-auto mb-12"
                >
                    We're currently upgrading our platform to bring you an even better 
                    shopping experience. Thank you for your patience!
                </motion.p>

                {/* Status Bar */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-xl p-8 mb-12 border border-line-soft shadow-lg"
                >
                    <div className="space-y-6">
                        {/* Progress */}
                        <div>
                            <div className="flex justify-between mb-3">
                                <span className="text-sm font-medium text-espresso">Upgrade Progress</span>
                                <span className="text-sm font-medium text-maroon">75%</span>
                            </div>
                            <motion.div
                                className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                            >
                                <motion.div
                                    className="h-full bg-gradient-to-r from-maroon to-gold"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "75%" }}
                                    transition={{ duration: 2 }}
                                />
                            </motion.div>
                        </div>

                        {/* Improvements */}
                        <div className="text-left space-y-3">
                            <h3 className="font-semibold text-espresso mb-4">Upcoming Improvements:</h3>
                            <div className="space-y-2">
                                <div className="flex gap-3">
                                    <span className="text-maroon font-bold">✓</span>
                                    <span className="text-espresso/80">Enhanced Performance</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-maroon font-bold">✓</span>
                                    <span className="text-espresso/80">Improved User Interface</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-maroon font-bold">✓</span>
                                    <span className="text-espresso/80">Better Payment Options</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-maroon font-bold">✓</span>
                                    <span className="text-espresso/80">New Features & Collections</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Estimated Time */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-r from-maroon/5 to-gold/5 rounded-lg border border-maroon/20 p-6 mb-12"
                >
                    <p className="text-sm text-espresso/70">
                        <span className="font-semibold text-espresso">Estimated Time: </span>
                        We expect to be back online by the end of the day. 
                        Check back soon!
                    </p>
                </motion.div>

                {/* Contact Information */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12"
                >
                    {/* Email */}
                    <a
                        href="mailto:support@shoplivebharat.com"
                        className="flex items-center justify-center gap-3 p-4 bg-white border border-line-soft rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <Mail className="w-5 h-5 text-maroon" />
                        <div className="text-left">
                            <p className="text-xs text-espresso/60 uppercase">Email Us</p>
                            <p className="font-medium text-espresso">support@shoplivebharat.com</p>
                        </div>
                    </a>

                    {/* Phone */}
                    <a
                        href="tel:+919876543210"
                        className="flex items-center justify-center gap-3 p-4 bg-white border border-line-soft rounded-lg hover:shadow-lg transition-shadow"
                    >
                        <Phone className="w-5 h-5 text-maroon" />
                        <div className="text-left">
                            <p className="text-xs text-espresso/60 uppercase">Call Us</p>
                            <p className="font-medium text-espresso">+91 9876 543 210</p>
                        </div>
                    </a>
                </motion.div>

                {/* Decorative Elements */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-5xl"
                >
                    🛍️
                </motion.div>

                <motion.p
                    variants={itemVariants}
                    className="mt-8 text-sm text-espresso/50"
                >
                    Thank you for being a valued customer of ShopLive Bharat
                </motion.p>
            </motion.div>
        </div>
    );
}
