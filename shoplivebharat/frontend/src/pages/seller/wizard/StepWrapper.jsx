import { Loader, ArrowLeft, ArrowRight } from "lucide-react";

/** Shared chrome used by every wizard step — heading, description, nav buttons. */
export default function StepWrapper({
    title,
    subtitle,
    children,
    onBack,
    onNext,
    nextLabel = "Continue",
    backLabel = "Back",
    nextDisabled = false,
    loading = false,
    isFirst = false,
}) {
    return (
        <div className="p-7 md:p-10">
            {/* Step heading */}
            <div className="mb-8 pb-6 border-b border-gray-100">
                <h2 className="text-xl md:text-2xl font-bold text-[#0a0a0a] tracking-tight mb-1">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>}
            </div>

            {/* Fields */}
            <div className="space-y-5">{children}</div>

            {/* Navigation */}
            <div className={`mt-10 pt-6 border-t border-gray-100 flex ${isFirst ? "justify-end" : "justify-between"} items-center gap-4`}>
                {!isFirst && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium"
                    >
                        <ArrowLeft size={15} />
                        {backLabel}
                    </button>
                )}
                <button
                    type="button"
                    onClick={onNext}
                    disabled={nextDisabled || loading}
                    className="inline-flex items-center gap-2 px-7 py-2.5 bg-[#0a0a0a] text-white rounded-lg hover:bg-maroon transition text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                >
                    {loading && <Loader size={14} className="animate-spin" />}
                    {nextLabel}
                    {!loading && <ArrowRight size={15} />}
                </button>
            </div>
        </div>
    );
}
