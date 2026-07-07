import { motion } from "framer-motion";
import { checkoutProgressVariants, transitionPresets } from "@/utils/microAnimations";
import { Check } from "lucide-react";

export default function CheckoutProgress({ currentStep = 1, steps = 4 }) {
    const stepsData = [
        { id: 1, label: "Cart" },
        { id: 2, label: "Address" },
        { id: 3, label: "Payment" },
        { id: 4, label: "Confirmation" },
    ];

    const progressPercentage = (currentStep / steps) * 100;

    return (
        <motion.div
            className="w-full py-6 md:py-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitionPresets.standard}
        >
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="relative h-1 bg-stone/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-gold to-maroon"
                        variants={checkoutProgressVariants.progressBar}
                        initial="initial"
                        animate="animate"
                        custom={progressPercentage}
                    />
                </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between relative">
                {/* Connecting Lines */}
                {stepsData.map((step, i) => (
                    i < stepsData.length - 1 && (
                        <motion.div
                            key={`line-${i}`}
                            className="absolute top-5 h-0.5 bg-stone/10"
                            style={{
                                left: `${(i + 0.5) * (100 / stepsData.length)}%`,
                                right: `${(stepsData.length - i - 1.5) * (100 / stepsData.length)}%`,
                            }}
                            initial={{ scaleX: 0 }}
                            animate={currentStep > step.id ? { scaleX: 1 } : {}}
                            transition={transitionPresets.smooth}
                            style={{ transformOrigin: "left" }}
                        />
                    )
                ))}

                {/* Step Badges */}
                {stepsData.map((step) => (
                    <motion.div
                        key={step.id}
                        className="flex flex-col items-center relative z-10"
                        variants={checkoutProgressVariants.stepBadge}
                        initial="initial"
                        animate={currentStep >= step.id ? "active" : "initial"}
                    >
                        {/* Badge Circle */}
                        <motion.div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 font-medium text-sm transition ${
                                currentStep > step.id
                                    ? "bg-green-100 text-green-700"
                                    : currentStep === step.id
                                    ? "bg-gold text-white"
                                    : "bg-stone/10 text-stone"
                            }`}
                            whileHover={currentStep >= step.id ? { scale: 1.1 } : {}}
                            transition={transitionPresets.quick}
                        >
                            {currentStep > step.id ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                >
                                    <Check size={20} />
                                </motion.div>
                            ) : (
                                step.id
                            )}
                        </motion.div>

                        {/* Label */}
                        <motion.p
                            className={`text-xs font-medium ${
                                currentStep >= step.id ? "text-gold" : "text-stone"
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {step.label}
                        </motion.p>
                    </motion.div>
                ))}
            </div>

            {/* Current Step Description */}
            <motion.p
                className="text-center text-sm text-stone mt-6"
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transitionPresets.quick}
            >
                Step {currentStep} of {steps}
            </motion.p>
        </motion.div>
    );
}

// Simplified inline progress bar
export function InlineCheckoutProgress({ currentStep = 1, steps = 4 }) {
    const progressPercentage = (currentStep / steps) * 100;

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transitionPresets.quick}
        >
            <div className="relative h-1 bg-stone/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-gold to-maroon"
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>
        </motion.div>
    );
}
