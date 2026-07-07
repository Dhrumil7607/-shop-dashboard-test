/**
 * LiveSessionsShowcase.jsx — Homepage "Book a Session" section.
 * Shows available live-shopping stores from the real backend.
 * No hardcoded/demo sessions — only real backend data shows here.
 * Admin can control which stores appear via show_in_booking_page flag.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Radio, ArrowRight, Calendar, Store } from "lucide-react";
import { api } from "@/lib/api";

function ShopCard({ shop, index }) {
  const name = shop.name || "Unnamed Store";
  const image = shop.image_url || shop.banner_image || "";
  const city = shop.city || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative rounded-2xl overflow-hidden flex-shrink-0 w-72 sm:w-80"
      style={{ backgroundColor: "white", border: "1px solid #E8E4DF" }}
    >
      {/* Store image */}
      <div className="relative h-44 overflow-hidden" style={{ backgroundColor: "#F0EBE3" }}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Store size={32} style={{ color: "#C9A84C" }} />
            <p className="text-xs font-semibold" style={{ color: "#9B8B7A" }}>No image</p>
          </div>
        )}
        {/* Available badge */}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: "rgba(45,122,58,0.85)", backdropFilter: "blur(4px)" }}
          >
            <Calendar size={10} /> Available
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#C9A84C" }}>
          {shop.specialty || city || "Indian Fashion"}
        </p>
        <h3 className="font-serif text-lg leading-tight mb-1" style={{ color: "#1a1a1a" }}>
          {name}
        </h3>
        {city && (
          <p className="text-xs mb-3" style={{ color: "#9B8B7A" }}>{city}, India</p>
        )}
        <Link
          to="/live-shopping"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
          style={{ backgroundColor: "#A2466B", color: "white" }}
        >
          Book a Session <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function LiveSessionsShowcase() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load real backend data — sellers who have live shopping enabled and are public
    api.get("/live-shopping/shops", { params: { limit: 6, booking_page_only: true } })
      .then(res => {
        const data = res?.data?.shops || [];
        setShops(data);
      })
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  // Don't render the section if no sellers have live shopping enabled
  if (!loading && shops.length === 0) {
    return (
      <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: "#FAF8F5" }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-semibold mb-4" style={{ color: "#C0392B" }}>
            <Radio size={14} /> Book a Session
          </p>
          <h2 className="font-serif text-3xl md:text-5xl mb-4" style={{ color: "#1a1a1a" }}>
            Book a Live Shopping Session
          </h2>
          <p className="text-sm mb-8" style={{ color: "#6B5E52" }}>
            Live sessions are coming soon. Check back when our verified sellers go live.
          </p>
          <Link
            to="/live-shopping"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: "#1a1a1a", color: "white" }}
          >
            View all stores <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: "#FAF8F5" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: "#C0392B" }}>
              <Radio size={14} /> Book a Session
            </p>
            <h2 className="font-serif text-3xl md:text-5xl" style={{ color: "#1a1a1a" }}>
              Book a Live Shopping Session
            </h2>
            <p className="text-sm mt-3 max-w-xl" style={{ color: "#6B5E52" }}>
              Book a private video session with an Indian artisan. See fabrics up close, ask questions, and buy with expert guidance.
            </p>
          </div>
          <Link
            to="/live-shopping"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold flex-shrink-0 transition hover:opacity-90"
            style={{ backgroundColor: "#1a1a1a", color: "white" }}
          >
            Book a Session <ArrowRight size={15} />
          </Link>
        </motion.div>

        {/* Available stores */}
        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-72 sm:w-80 h-64 rounded-2xl animate-pulse" style={{ backgroundColor: "#F0EBE3" }} />
            ))}
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#9B8B7A" }}>
              Available for Booking
            </h3>
            <div className="flex gap-5 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: "thin" }}>
              {shops.map((s, i) => <ShopCard key={s.id} shop={s} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
