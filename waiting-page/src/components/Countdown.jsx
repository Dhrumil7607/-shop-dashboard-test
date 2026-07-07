import { motion } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";

function Cell({ label, value, testid }) {
    return (
        <div className="relative flex flex-col items-center" data-testid={testid}>
            <div className="font-serif text-4xl sm:text-6xl md:text-[5rem] leading-none text-espresso tracking-tightest tabular-nums font-medium">
                {String(value).padStart(2, "0")}
            </div>
            <div className="mt-2 sm:mt-3 text-[9px] md:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.32em] text-stone font-medium">
                {label}
            </div>
        </div>
    );
}

export default function Countdown({ launchDate, compact = false, eyebrow = "The wait is almost over" }) {
    const { days, hours, minutes, seconds, done } = useCountdown(launchDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
            data-testid="countdown"
            className={`relative ${compact ? "py-10" : "py-16 md:py-28"} px-5 sm:px-6`}
        >
            <div className="max-w-5xl mx-auto text-center">
                <p className="text-[11px] uppercase tracking-[0.32em] text-maroon mb-4">
                    {eyebrow}
                </p>
                {!compact && (
                    <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-espresso mb-3">
                        Launching <span className="serif-italic">soon</span> worldwide
                    </h2>
                )}
                {!compact && (
                    <p className="text-sm md:text-base text-stone max-w-md mx-auto mb-10">
                        An exclusive global launch — for the Indian wardrobe abroad.
                    </p>
                )}

                <div className="glass mx-auto grid grid-cols-2 sm:inline-flex items-center gap-x-6 gap-y-6 sm:gap-6 md:gap-12 px-5 sm:px-6 md:px-12 py-7 md:py-10 rounded-[1.6rem] sm:rounded-[2rem] max-w-full">
                    <Cell label="Days" value={days} testid="countdown-days" />
                    <span className="hidden sm:block h-12 w-px bg-espresso/15" />
                    <Cell label="Hours" value={hours} testid="countdown-hours" />
                    <span className="h-12 w-px bg-espresso/15 hidden sm:block" />
                    <Cell label="Minutes" value={minutes} testid="countdown-minutes" />
                    <span className="h-12 w-px bg-espresso/15 hidden sm:block" />
                    <Cell label="Seconds" value={seconds} testid="countdown-seconds" />
                </div>

                {done && (
                    <p className="mt-6 text-sm text-maroon uppercase tracking-[0.28em]">
                        We are live ✨
                    </p>
                )}
            </div>
        </motion.div>
    );
}
