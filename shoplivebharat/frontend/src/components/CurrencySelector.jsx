import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";

export default function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const current = CURRENCIES[currency];

    return (
        <div ref={ref} className="relative">
            {/* Trigger button */}
            <motion.button
                onClick={() => setIsOpen(v => !v)}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm font-semibold transition hover:bg-black/5"
                style={{ borderColor: "#E8E4DF", color: "#2C241B" }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <Globe size={14} style={{ color: "#8B8680" }} />
                <span>{current.symbol}</span>
                <span className="text-xs font-medium hidden sm:inline" style={{ color: "#8B8680" }}>{currency}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={12} style={{ color: "#8B8680" }} />
                </motion.div>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        role="listbox"
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-1.5 w-52 rounded-xl shadow-xl z-50 overflow-hidden border"
                        style={{ background: "#FAF9F6", borderColor: "#E8E4DF" }}
                    >
                        <div className="p-1.5">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-2" style={{ color: "#8B8680" }}>
                                Select Currency
                            </p>
                            {Object.entries(CURRENCIES).map(([code, data]) => {
                                const active = currency === code;
                                return (
                                    <motion.button
                                        key={code}
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => { setCurrency(code); setIsOpen(false); }}
                                        whileHover={{ x: 2 }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition"
                                        style={{
                                            background: active ? "#F0EBE3" : "transparent",
                                            color: "#2C241B",
                                        }}
                                    >
                                        {/* Symbol */}
                                        <span className="w-6 text-center font-semibold text-base flex-shrink-0" style={{ color: active ? "#A2466B" : "#6B5E4C" }}>
                                            {data.symbol}
                                        </span>

                                        {/* Code + Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm">{code}</p>
                                            <p className="text-xs truncate" style={{ color: "#8B8680" }}>{data.name}</p>
                                        </div>

                                        {/* Check */}
                                        {active && <Check size={14} style={{ color: "#A2466B" }} />}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
