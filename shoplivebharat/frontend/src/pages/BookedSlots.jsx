import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, MapPin, User, Phone, X, ChevronRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { setMetaTags } from "@/lib/seo";

const MOCK_SLOTS = [
    {
        id: "SLOT-001",
        consultantName: "Priya Sharma",
        consultantImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        shopName: "Jaipur Atelier House",
        city: "Ahmedabad",
        state: "Gujarat",
        date: "2026-07-05",
        time: "14:00",
        duration: 30,
        category: "Wedding Wear",
        status: "upcoming",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-001",
        notes: "Discussing bridal lehenga options with traditional Ahmedabad embroidery",
        price: 2999,
    },
    {
        id: "SLOT-002",
        consultantName: "Ananya Desai",
        consultantImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        shopName: "The Banaras Edit",
        city: "Ahmedabad",
        state: "Gujarat",
        date: "2026-07-10",
        time: "10:00",
        duration: 45,
        category: "Festive Collections",
        status: "upcoming",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-002",
        notes: "Diwali wardrobe consultation with Banarasi silk options",
        price: 4499,
    },
    {
        id: "SLOT-003",
        consultantName: "Meera Kapoor",
        consultantImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        shopName: "Ahmedabad Heritage",
        city: "Ahmedabad",
        state: "Gujarat",
        date: "2026-06-20",
        time: "15:30",
        duration: 30,
        category: "Wedding Wear",
        status: "completed",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-003",
        notes: "Complemented mehndi outfit selection with traditional bandhani",
        price: 2999,
    },
    {
        id: "SLOT-004",
        consultantName: "Rajesh Patel",
        consultantImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        shopName: "Modern Threads Ahmedabad",
        city: "Ahmedabad",
        state: "Gujarat",
        date: "2026-07-08",
        time: "11:00",
        duration: 30,
        category: "Fusion Wear",
        status: "upcoming",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-004",
        notes: "Contemporary fusion wear consultation",
        price: 1999,
    },
    {
        id: "SLOT-005",
        consultantName: "Vikram Singh",
        consultantImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        shopName: "Crafted by Ahmedabad",
        city: "Ahmedabad",
        state: "Gujarat",
        date: "2026-07-12",
        time: "16:00",
        duration: 45,
        category: "Eco-Friendly Fashion",
        status: "upcoming",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-005",
        notes: "Sustainable and handwoven textile collection consultation",
        price: 3499,
    },
    {
        id: "SLOT-006",
        consultantName: "Neha Patel",
        consultantImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        shopName: "Elegant Collections Surat",
        city: "Surat",
        state: "Gujarat",
        date: "2026-07-07",
        time: "13:00",
        duration: 30,
        category: "Sarees",
        status: "upcoming",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-006",
        notes: "Premium saree collection from Surat",
        price: 2499,
    },
    {
        id: "SLOT-007",
        consultantName: "Kadir Khan",
        consultantImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        shopName: "Surat Diamond Jewelry",
        city: "Surat",
        state: "Gujarat",
        date: "2026-07-11",
        time: "10:30",
        duration: 60,
        category: "Jewelry",
        status: "upcoming",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-007",
        notes: "Jewelry consultation - Surat diamond collection",
        price: 5999,
    },
    {
        id: "SLOT-008",
        consultantName: "Pooja Shah",
        consultantImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        shopName: "Surat Embroidery House",
        city: "Surat",
        state: "Gujarat",
        date: "2026-07-06",
        time: "09:00",
        duration: 45,
        category: "Embroidered Wear",
        status: "completed",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-008",
        notes: "Surat embroidery techniques and bridal collection review",
        price: 3999,
    },
    {
        id: "SLOT-009",
        consultantName: "Amit Desai",
        consultantImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        shopName: "Surat Fashion Studio",
        city: "Surat",
        state: "Gujarat",
        date: "2026-07-14",
        time: "15:00",
        duration: 30,
        category: "Contemporary Fashion",
        status: "upcoming",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-009",
        notes: "Modern fashion trends and styling consultation",
        price: 1999,
    },
    {
        id: "SLOT-010",
        consultantName: "Karan Verma",
        consultantImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        shopName: "Surat Premium Textiles",
        city: "Surat",
        state: "Gujarat",
        date: "2026-07-13",
        time: "14:30",
        duration: 40,
        category: "Premium Fabrics",
        status: "upcoming",
        roomLink: "https://video.shoplivebharat.com/slot/SLOT-010",
        notes: "Premium textile and fabric selection consultation",
        price: 2899,
    },
];

function SlotCard({ slot, index, onCancel }) {
    const { formatPrice } = useCurrency();
    const isUpcoming = slot.status === "upcoming";
    const slotDate = new Date(`${slot.date}T${slot.time}`);
    const isToday = slotDate.toDateString() === new Date().toDateString();
    const isPassed = slotDate < new Date();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`group relative overflow-hidden rounded-[2rem] backdrop-blur-xl border transition-all duration-300 p-6 md:p-8 ${
                isUpcoming
                    ? "bg-gradient-to-br from-maroon/5 to-gold/5 border-white/40 hover:border-white/60 hover:shadow-lg"
                    : "bg-gradient-to-br from-white/20 to-white/10 border-white/20"
            }`}
        >
            {/* Badge */}
            {isToday && isUpcoming && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-4 right-4 px-3 py-1 bg-maroon/20 text-maroon text-xs font-semibold rounded-full"
                >
                    🔴 Today
                </motion.div>
            )}

            <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Consultant Info */}
                <div className="flex-1 min-w-0">
                    {/* Consultant Profile */}
                    <div className="flex items-start gap-4 mb-6">
                        <motion.img
                            src={slot.consultantImage}
                            alt={slot.consultantName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/40"
                            whileHover={{ scale: 1.1 }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase tracking-[0.2em] text-maroon/70 mb-1">Consultant</p>
                            <h3 className="font-serif text-xl text-espresso truncate">{slot.consultantName}</h3>
                            <p className="text-sm text-stone/70 truncate">{slot.shopName}</p>
                            <p className="text-xs text-stone/50 mt-1">
                                <MapPin className="inline w-3 h-3 mr-1" />
                                {slot.city}, {slot.state}
                            </p>
                            <p className="text-xs text-stone/50 line-clamp-2">{slot.category}</p>
                        </div>
                    </div>

                    {/* Slot Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-stone/60 mb-1">Date</p>
                            <p className="text-sm font-medium text-espresso">{new Date(slot.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-stone/60 mb-1">Time</p>
                            <p className="text-sm font-medium text-espresso">{slot.time}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-stone/60 mb-1">Duration</p>
                            <p className="text-sm font-medium text-espresso">{slot.duration} min</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-stone/60 mb-1">Price</p>
                            <p className="text-sm font-medium text-maroon font-bold">{formatPrice(slot.price)}</p>
                        </div>
                    </div>

                    {/* Notes */}
                    {slot.notes && (
                        <p className="text-sm text-stone/70 italic border-l-2 border-maroon/30 pl-3 mb-4">
                            {slot.notes}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <motion.div
                    className="flex flex-col gap-3 md:mt-0"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {isUpcoming && !isPassed && (
                        <>
                            <motion.a
                                href={slot.roomLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-maroon hover:bg-maroon/90 text-ivory rounded-lg font-medium text-sm transition-all duration-300 group/btn"
                            >
                                <Video className="w-4 h-4" strokeWidth={1.5} />
                                Join Video
                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </motion.a>
                            <motion.button
                                onClick={() => onCancel(slot.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg font-medium text-sm transition-all duration-300"
                            >
                                <X className="w-4 h-4" strokeWidth={1.5} />
                                Cancel Slot
                            </motion.button>
                        </>
                    )}
                    {isUpcoming && isPassed && (
                        <p className="text-sm text-stone/50 text-center py-3">Slot time has passed</p>
                    )}
                    {!isUpcoming && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-maroon/10 hover:bg-maroon/20 text-maroon rounded-lg font-medium text-sm transition-all duration-300"
                        >
                            <Calendar className="w-4 h-4" strokeWidth={1.5} />
                            Book Again
                        </motion.button>
                    )}
                </motion.div>
            </div>

            {/* Hover Glow */}
            {isUpcoming && (
                <motion.div
                    className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 rounded-[2rem] blur-2xl transition-opacity duration-300"
                    style={{
                        background: "linear-gradient(135deg, rgba(139, 58, 58, 0.1), rgba(212, 175, 55, 0.05))",
                    }}
                />
            )}
        </motion.div>
    );
}

export default function BookedSlots() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("upcoming");
    const [cancelModal, setCancelModal] = useState(null);

    useEffect(() => {
        // Set SEO meta tags for booked slots page
        setMetaTags({
            title: "My Booked Consultations | ShopLive Bharat",
            description: "Manage your personalized video consultation bookings with expert fashion consultants from India's finest boutiques.",
            keywords: "my bookings, consultation, video shopping, expert fashion consultant",
            url: "https://shoplivebharat.com/booked-slots",
            type: "website",
        });

        setLoading(true);
        setTimeout(() => {
            setSlots(MOCK_SLOTS);
            setLoading(false);
        }, 600);
    }, []);

    const filteredSlots = slots.filter((s) => s.status === filter);

    const handleCancelSlot = (slotId) => {
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
        setCancelModal(null);
        toast.success("Slot cancelled successfully");
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-ivory to-cream pt-20 pb-20">
            <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <Link
                        to="/account"
                        className="inline-flex items-center gap-2 text-maroon hover:text-maroon/70 text-sm font-medium mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        Back to Account
                    </Link>
                    <h1 className="font-serif text-5xl md:text-6xl text-espresso tracking-tightest mb-3">
                        Booked <span className="serif-italic text-maroon">Consultations</span>
                    </h1>
                    <p className="text-lg text-stone max-w-2xl">
                        Your upcoming video sessions with our expert consultants from India's finest ateliers.
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-3 mb-12"
                >
                    {["upcoming", "completed"].map((status) => (
                        <motion.button
                            key={status}
                            onClick={() => setFilter(status)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                filter === status
                                    ? "bg-maroon text-ivory shadow-lg"
                                    : "bg-white/40 text-espresso hover:bg-white/60 backdrop-blur-sm border border-white/25"
                            }`}
                        >
                            {status === "upcoming" ? "Upcoming" : "Completed"}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Slots List */}
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-20"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-4 border-maroon/20 border-t-maroon rounded-full"
                        />
                    </motion.div>
                ) : filteredSlots.length > 0 ? (
                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } },
                        }}
                    >
                        {filteredSlots.map((slot, i) => (
                            <SlotCard
                                key={slot.id}
                                slot={slot}
                                index={i}
                                onCancel={() => setCancelModal(slot.id)}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Calendar className="w-16 h-16 text-stone/30 mx-auto mb-4" strokeWidth={1} />
                        <p className="text-lg text-stone">No {filter} consultations</p>
                        <p className="text-sm text-stone/60 mt-2">Book a consultation to see it appear here</p>
                    </motion.div>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            <AnimatePresence>
                {cancelModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm"
                        onClick={() => setCancelModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-ivory rounded-[2rem] max-w-md w-full p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="font-serif text-2xl text-espresso mb-2">Cancel Consultation?</h2>
                            <p className="text-stone/70 mb-8">
                                Are you sure you want to cancel this consultation slot? This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCancelModal(null)}
                                    className="flex-1 px-6 py-3 bg-stone/10 hover:bg-stone/20 text-espresso rounded-lg font-medium transition-all"
                                >
                                    Keep It
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCancelSlot(cancelModal)}
                                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
                                >
                                    Cancel Slot
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
