/**
 * TrustSection.jsx — Conversion trust band for the homepage.
 * Worldwide shipping, customs/duties, returns, secure payments,
 * seller verification, product authenticity.
 */

import { motion } from "framer-motion";
import { Globe, FileCheck, RotateCcw, ShieldCheck, BadgeCheck, Sparkles } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Globe,
    title: "Worldwide Shipping",
    desc: "Delivered to 50+ countries — USA, UK, Canada, Australia, UAE and more, with full tracking.",
  },
  {
    icon: FileCheck,
    title: "Customs & Duties Handled",
    desc: "Transparent duty estimates at checkout. No surprise fees when your parcel arrives.",
  },
  {
    icon: RotateCcw,
    title: "Easy 7-Day Returns",
    desc: "Changed your mind? Return unworn items within 7 days for a hassle-free refund.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Razorpay, PayPal and international cards. PCI-DSS encrypted — your details are never stored.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
    desc: "Every store is identity-verified and quality-checked before joining ShopLive Bharat.",
  },
  {
    icon: Sparkles,
    title: "100% Authentic",
    desc: "Handcrafted by genuine Indian artisans. Authenticity guaranteed on every single piece.",
  },
];

export default function TrustSection() {
  return (
    <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-3" style={{ color: "#C9A84C" }}>
            Why Shop With Confidence
          </p>
          <h2 className="font-serif text-3xl md:text-5xl text-white">
            Built on Trust, Delivered with Care
          </h2>
          <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            From the artisan's loom to your doorstep, every step is protected.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRUST_ITEMS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.06, 0.3) }}
              className="rounded-2xl p-6 transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(162,70,107,0.2))" }}>
                <Icon size={20} style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="font-semibold text-white mb-1.5 text-base">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
