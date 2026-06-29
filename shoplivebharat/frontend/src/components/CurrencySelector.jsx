import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe } from "lucide-react";
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";

export default function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);

    const currentCurrency = CURRENCIES[currency];

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/60 hover:bg-white/80 border border-white/40 backdrop-blur-sm text-espresso font-medium text-sm transition-all duration-300 group"
            >
                <Globe className="w-4 h-4 group-hover:rotate-12 transition-transform" strokeWidth={1.5} />
                <span className="font-serif text-base">{currentCurrency.symbol}</span>
                <span className="text-xs tracking-widest hidden md:inline">{currency}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-stone/60 font-medium mb-3 px-2">
                                Select Currency
                            </p>
                            <div className="space-y-1">
                                {Object.entries(CURRENCIES).map(([code, data]) => (
                                    <motion.button
                                        key={code}
                                        onClick={() => {
                                            setCurrency(code);
                                            setIsOpen(false);
                                        }}
                                        whileHover={{ x: 4 }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-left ${
                                            currency === code
                                                ? "bg-maroon text-ivory"
                                                : "hover:bg-espresso/5 text-espresso"
                                        }`}
                                    >
                                        <span className="font-serif text-lg">{data.symbol}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{code}</p>
                                            <p className="text-xs text-stone/60">{data.name}</p>
                                        </div>
                                        {currency === code && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-2 h-2 rounded-full bg-current"
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
