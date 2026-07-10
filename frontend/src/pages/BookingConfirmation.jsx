import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle, Calendar, Clock, MapPin, User, Phone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { setMetaTags } from "@/lib/seo";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { api } from "@/lib/api";

export default function BookingConfirmation() {
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const [fetchedBooking, setFetchedBooking] = useState(null);

    // Stable confirmation number — generated once per mount, not on every render
    const confirmationRef = useRef(`BOOK-${Date.now().toString().slice(-8)}`);

    // Handle return from Razorpay hosted payment (redirected back with ?paid=BK-XXXX)
    const paidId = params.get("paid");
    useEffect(() => {
        if (paidId) {
            api.get(`/bookings/${paidId}/summary`).then(res => {
                setFetchedBooking(res.data);
            }).catch(() => {});
            window.history.replaceState({}, "", "/booking-confirmation");
        }
    }, [paidId]);

    useEffect(() => {
        // Set SEO meta tags
        setMetaTags({
            title: "Booking Confirmed | ShopLive Bharat",
            description: "Your live shopping consultation has been confirmed. We'll connect with you soon!",
            keywords: "booking confirmation, consultation confirmed",
            url: "https://shoplivebharat.com/booking-confirmation",
            type: "website",
        });

        // If no booking data and no paid param, redirect to live-shopping
        if (!location.state?.booking && !location.state?.bookingData && !paidId && !fetchedBooking) {
            setTimeout(() => navigate("/live-shopping"), 5000);
        }
    }, [navigate, location, paidId, fetchedBooking]);

    // Support both the new `booking` key (from LiveShopping.jsx) and the legacy
    // `bookingData` key so that any existing deep-links continue to work.
    const booking = location.state?.booking || location.state?.bookingData || fetchedBooking || null;

    // Map the canonical Booking shape (from bookingService) to the display fields
    // the confirmation card expects, falling back gracefully for older shapes.
    const bookingData = {
        date: booking?.appointmentDate ||
              (booking?.appointmentIST ? booking.appointmentIST.slice(0, 10) : null),
        time: booking?.appointmentTime ||
              (booking?.appointmentIST ? booking.appointmentIST.slice(11, 16) : null),
        city: booking?.storeName || null,
        customerName: booking?.customerName || null,
        phone: booking?.phone || null,
        ...booking,
    };

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
        <MarketplaceLayout>
        <div className="min-h-[80vh] bg-gradient-to-b from-ivory to-cream flex items-center justify-center px-6 py-20">
            <motion.div
                className="max-w-2xl w-full"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Success Icon */}
                <motion.div
                    variants={itemVariants}
                    className="flex justify-center mb-8"
                >
                    <motion.div
                        animate={{ scale: [0.8, 1.1, 1] }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-400/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-16 h-16 text-green-600" strokeWidth={1.5} />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    variants={itemVariants}
                    className="font-serif text-4xl md:text-5xl text-espresso text-center mb-4"
                >
                    Booking Confirmed!
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    variants={itemVariants}
                    className="text-lg text-espresso/70 text-center mb-12"
                >
                    Your live shopping consultation has been successfully booked. 
                    We'll contact you soon at the provided details.
                </motion.p>

                {/* Booking Details Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl border border-line-soft p-8 md:p-12 mb-12 shadow-lg"
                >
                    <h2 className="font-serif text-2xl text-espresso mb-8">Booking Details</h2>

                    <div className="space-y-6">
                        {/* Confirmation Number */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-maroon/5 to-gold/5 rounded-lg">
                            <div className="w-12 h-12 rounded-full bg-maroon/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-maroon" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-maroon/70">Confirmation Number</p>
                                <p className="font-serif text-lg text-espresso">
                                    {confirmationRef.current}
                                </p>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon/10 to-gold/10 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-maroon" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-espresso/70">Date</p>
                                    <p className="font-serif text-lg text-espresso">{bookingData.date || "Scheduled"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon/10 to-gold/10 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-maroon" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-espresso/70">Time</p>
                                    <p className="font-serif text-lg text-espresso">{bookingData.time || "TBA"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon/10 to-gold/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-maroon" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-espresso/70">Location</p>
                                <p className="font-serif text-lg text-espresso">{bookingData.city || "Ahmedabad / Surat"}</p>
                            </div>
                        </div>

                        {/* Customer Name */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon/10 to-gold/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-maroon" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-espresso/70">Name</p>
                                <p className="font-serif text-lg text-espresso">{bookingData.customerName || "Customer"}</p>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-maroon/10 to-gold/10 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-5 h-5 text-maroon" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-espresso/70">Contact</p>
                                <p className="font-serif text-lg text-espresso">{bookingData.phone || "Contact provided"}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Next Steps */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-r from-maroon/5 to-gold/5 rounded-xl border border-maroon/20 p-8 mb-12"
                >
                    <h3 className="font-serif text-xl text-espresso mb-4">What's Next?</h3>
                    <ol className="space-y-3 text-espresso/80">
                        <li className="flex gap-3">
                            <span className="font-bold text-maroon">1.</span>
                            <span>Our team will call you at the scheduled time via video</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-maroon">2.</span>
                            <span>We'll showcase our premium collections live</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-maroon">3.</span>
                            <span>Get personalized styling advice from our experts</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-maroon">4.</span>
                            <span>Place your order during the session with special offers</span>
                        </li>
                    </ol>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <Link
                        to="/marketplace"
                        className="px-6 py-4 bg-espresso text-ivory rounded-lg hover:bg-maroon transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <span>Continue Shopping</span>
                        <ArrowRight size={18} />
                    </Link>

                    <Link
                        to="/account/bookings"
                        className="px-6 py-4 bg-gradient-to-r from-maroon/10 to-gold/10 text-espresso border border-maroon/30 rounded-lg hover:from-maroon/20 hover:to-gold/20 transition-all font-medium flex items-center justify-center gap-2"
                    >
                        <span>View My Bookings</span>
                        <ArrowRight size={18} />
                    </Link>
                </motion.div>

                {/* Contact Support */}
                <motion.div
                    variants={itemVariants}
                    className="mt-12 text-center text-sm text-espresso/60"
                >
                    <p>Have questions? <Link to="/contact" className="text-maroon font-medium hover:underline">Contact our support team</Link></p>
                </motion.div>
            </motion.div>
        </div>
        </MarketplaceLayout>
    );
}
