import { useState } from "react";
import StepWrapper from "./StepWrapper";
import FieldError from "./FieldError";

const inp = "w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-[#0a0a0a] placeholder-gray-400 text-sm outline-none focus:border-[#0a0a0a] focus:ring-2 focus:ring-gray-100 transition";
const lbl = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

export default function StepShipping({ formData, patch, onNext, onBack }) {
    const d = formData.shipping_preferences || {};
    const [errors, setErrors] = useState({});
    const set = (k, v) => patch("shipping_preferences", { [k]: v });

    const validate = () => {
        const e = {};
        if (!d.domestic && !d.international) e.method = "Select at least one shipping method";
        if (d.domestic     && (!d.domestic_days     || parseInt(d.domestic_days) < 1))     e.domestic_days     = "Enter dispatch time (1–30 days)";
        if (d.international && (!d.international_days || parseInt(d.international_days) < 1)) e.international_days = "Enter dispatch time (1–60 days)";
        return e;
    };

    const handleNext = () => {
        const e = validate(); setErrors(e);
        if (!Object.keys(e).length) onNext();
    };

    return (
        <StepWrapper
            title="Shipping Preferences"
            subtitle="Tell buyers how and where you ship orders."
            onNext={handleNext} onBack={onBack}
        >
            <div className="space-y-4">
                <div>
                    <p className={lbl}>Shipping Methods <span className="text-maroon">*</span></p>
                    <div className="space-y-3">
                        {[
                            { key: "domestic",      title: "Domestic Shipping",      desc: "Ship to customers across India" },
                            { key: "international", title: "International Shipping",  desc: "Reach Indian diaspora and global buyers in 50+ countries" },
                        ].map(opt => (
                            <label key={opt.key}
                                className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                                    d[opt.key] ? "border-[#0a0a0a] bg-gray-50" : "border-gray-200 hover:border-gray-300"
                                }`}>
                                <input type="checkbox" checked={!!d[opt.key]} onChange={e => set(opt.key, e.target.checked)}
                                    className="mt-0.5 accent-[#0a0a0a] w-4 h-4 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-[#0a0a0a]">{opt.title}</p>
                                    <p className="text-xs text-gray-500">{opt.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <FieldError error={errors.method} />
                </div>

                {d.domestic && (
                    <div>
                        <label className={lbl}>Domestic Dispatch Time (business days) <span className="text-maroon">*</span></label>
                        <input type="number" className={inp} min="1" max="30"
                            value={d.domestic_days || ""} onChange={e => set("domestic_days", e.target.value)} placeholder="e.g. 2" />
                        <FieldError error={errors.domestic_days} />
                    </div>
                )}
                {d.international && (
                    <div>
                        <label className={lbl}>International Dispatch Time (business days) <span className="text-maroon">*</span></label>
                        <input type="number" className={inp} min="1" max="60"
                            value={d.international_days || ""} onChange={e => set("international_days", e.target.value)} placeholder="e.g. 5" />
                        <FieldError error={errors.international_days} />
                    </div>
                )}
                <div>
                    <label className={lbl}>Preferred Shipping Partners <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                    <input className={inp} value={d.partners || ""} onChange={e => set("partners", e.target.value)}
                        placeholder="e.g. BlueDart, Delhivery, DHL" maxLength={200} />
                </div>
            </div>
        </StepWrapper>
    );
}
