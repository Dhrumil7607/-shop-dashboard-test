import { motion } from "framer-motion";
import { festivalVariants } from "@/utils/microAnimations";

/**
 * Festival decorations - controlled from admin panel
 * Use: <FestivalDecorations type="diwali" enabled={true} />
 */

// Diya (Oil Lamp) - Diwali
function DiyaDecoration({ position = "top-10 right-10" }) {
    return (
        <motion.div
            className={`fixed ${position} z-10 pointer-events-none`}
            animate={festivalVariants.floatingElement(0).animate}
        >
            <motion.div
                className="w-8 h-8 rounded-b-lg rounded-t-sm bg-orange-500 relative"
                animate={festivalVariants.diya.glow}
            >
                {/* Flame */}
                <motion.div
                    className="absolute -top-2 left-1/2 w-1 h-3 bg-yellow-300 rounded-full"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
                {/* Light glow */}
                <div className="absolute inset-0 rounded-full bg-orange-400 opacity-50 blur-md" />
            </motion.div>
        </motion.div>
    );
}

// Flower - Wedding Season
function FlowerDecoration({ position = "top-20 left-10", rotation = 0 }) {
    return (
        <motion.div
            className={`fixed ${position} z-10 pointer-events-none`}
            animate={festivalVariants.floatingElement(0.2).animate}
        >
            <motion.div
                className="text-4xl"
                animate={festivalVariants.flower.rotate}
                initial={{ rotate: rotation }}
            >
                🌸
            </motion.div>
        </motion.div>
    );
}

// Dandiya Sticks - Navratri
function DandiyaDecoration({ position = "bottom-20 left-1/4" }) {
    return (
        <motion.div
            className={`fixed ${position} z-10 pointer-events-none`}
            animate={festivalVariants.floatingElement(0.4).animate}
        >
            <motion.div
                className="text-3xl"
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
                🎋
            </motion.div>
        </motion.div>
    );
}

// Rakhi Thread - Raksha Bandhan
function RakhiDecoration({ position = "top-1/3 right-20" }) {
    return (
        <motion.div
            className={`fixed ${position} z-10 pointer-events-none`}
            animate={festivalVariants.floatingElement(0.6).animate}
        >
            <motion.div
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                🎀
            </motion.div>
        </motion.div>
    );
}

// Sparkles - General celebration
function SparkleDecoration({ count = 10 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="fixed z-10 pointer-events-none text-lg"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity,
                    }}
                >
                    ✨
                </motion.div>
            ))}
        </>
    );
}

// Main Festival Decorations Component
export default function FestivalDecorations({ festival = null, enabled = false }) {
    if (!enabled || !festival) return null;

    const decorationMap = {
        diwali: (
            <>
                <DiyaDecoration position="top-10 right-10" />
                <DiyaDecoration position="bottom-10 left-10" />
                <DiyaDecoration position="top-1/2 right-5" />
                <SparkleDecoration count={15} />
            </>
        ),
        navratri: (
            <>
                <DandiyaDecoration position="top-1/3 left-1/4" />
                <DandiyaDecoration position="bottom-1/4 right-1/3" />
                <FlowerDecoration position="top-20 right-20" rotation={45} />
                <SparkleDecoration count={12} />
            </>
        ),
        "raksha-bandhan": (
            <>
                <RakhiDecoration position="top-1/3 right-20" />
                <RakhiDecoration position="bottom-1/3 left-20" />
                <FlowerDecoration position="top-1/2 left-1/4" rotation={90} />
                <SparkleDecoration count={10} />
            </>
        ),
        wedding: (
            <>
                <FlowerDecoration position="top-10 left-10" rotation={0} />
                <FlowerDecoration position="top-1/2 right-10" rotation={45} />
                <FlowerDecoration position="bottom-1/4 left-1/3" rotation={90} />
                <FlowerDecoration position="bottom-10 right-1/4" rotation={180} />
                <SparkleDecoration count={20} />
            </>
        ),
    };

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
            {decorationMap[festival]}
        </div>
    );
}

// Hook for managing festival decorations
export function useFestivalDecorations() {
    const getFestivalConfig = () => {
        const today = new Date();
        const month = today.getMonth();
        const date = today.getDate();

        // Diwali - October/November (usually)
        if (month === 9 || month === 10) return { festival: "diwali", enabled: true };

        // Navratri - September/October
        if ((month === 8 && date >= 15) || (month === 9 && date <= 15))
            return { festival: "navratri", enabled: true };

        // Raksha Bandhan - August
        if (month === 7) return { festival: "raksha-bandhan", enabled: true };

        // Wedding Season - December to March
        if (month >= 11 || month <= 2) return { festival: "wedding", enabled: true };

        return { festival: null, enabled: false };
    };

    return getFestivalConfig();
}
