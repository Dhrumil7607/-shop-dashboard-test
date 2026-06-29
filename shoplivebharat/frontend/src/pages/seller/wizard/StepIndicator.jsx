import { Check } from "lucide-react";

export default function StepIndicator({ steps, currentStep, onStepClick }) {
    return (
        <div className="flex items-center w-full" role="navigation" aria-label="Registration progress">
            {steps.map((label, idx) => {
                const done   = idx < currentStep;
                const active = idx === currentStep;
                return (
                    <div key={label} className="flex items-center flex-1 min-w-0">
                        {/* Circle */}
                        <button
                            type="button"
                            onClick={() => done && onStepClick(idx)}
                            disabled={!done}
                            aria-current={active ? "step" : undefined}
                            aria-label={`Step ${idx + 1}: ${label}${done ? " (completed)" : ""}`}
                            className="flex flex-col items-center gap-1.5 group disabled:cursor-default flex-shrink-0"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                                done
                                    ? "bg-maroon border-maroon text-white"
                                    : active
                                    ? "bg-white border-[#0a0a0a] text-[#0a0a0a] shadow-[0_0_0_3px_#8B3A3A20]"
                                    : "bg-white border-gray-200 text-gray-400"
                            }`}>
                                {done ? <Check size={13} strokeWidth={3} /> : idx + 1}
                            </div>
                            <span className={`hidden md:block text-[9px] uppercase tracking-widest font-semibold whitespace-nowrap ${
                                active ? "text-[#0a0a0a]" : done ? "text-maroon" : "text-gray-400"
                            }`}>
                                {label}
                            </span>
                        </button>

                        {/* Connector line (not after last step) */}
                        {idx < steps.length - 1 && (
                            <div className="flex-1 mx-2 mt-[-14px] md:mt-[-22px] h-0.5 relative">
                                <div className="absolute inset-0 bg-gray-200 rounded-full" />
                                <div
                                    className="absolute inset-0 bg-maroon rounded-full transition-all duration-500"
                                    style={{ width: done ? "100%" : "0%" }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
