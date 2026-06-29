import { useState, useEffect } from "react";
import StepWrapper from "./StepWrapper";
import FieldError from "./FieldError";

function toSlug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const inp = "w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-[#0a0a0a] placeholder-gray-400 text-sm outline-none focus:border-[#0a0a0a] focus:ring-2 focus:ring-gray-100 transition";
const lbl = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

export default function StepStoreInfo({ formData, patch, onNext, onBack }) {
    const d = formData.store_information || {};
    const [errors, setErrors] = useState({});
    const [slug, setSlug] = useState(toSlug(d.store_name || ""));

    useEffect(() => setSlug(toSlug(d.store_name || "")), [d.store_name]);

    const set = (k, v) => patch("store_information", { [k]: v });

    const validate = () => {
        const e = {};
        if (!d.store_name || d.store_name.length < 2) e.store_name = "Required (min 2 chars)";
        if (!d.description || d.description.length < 10) e.description = "Required (min 10 chars)";
        if (!d.specialty || d.specialty.length < 2)  e.specialty  = "Required";
        if (!d.city) e.city = "Required";
        if (d.instagram_url && !d.instagram_url.startsWith("https://instagram.com/")) {
            e.instagram_url = "Must start with https://instagram.com/";
        }
        return e;
    };

    const handleNext = () => {
        const e = validate(); setErrors(e);
        if (!Object.keys(e).length) onNext();
    };

    return (
        <StepWrapper
            title="Store Information"
            subtitle="Tell customers and our review team about your store."
            onNext={handleNext} onBack={onBack}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className={lbl}>Store Name <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.store_name || ""} onChange={e => set("store_name", e.target.value)} placeholder="e.g. Banarasi Silks Co." maxLength={120} />
                    {slug && (
                        <p className="text-[11px] text-gray-400 mt-1">
                            Store URL: <span className="text-[#0a0a0a] font-mono">shoplivebharat.com/store/{slug}</span>
                        </p>
                    )}
                    <FieldError error={errors.store_name} />
                </div>
                <div>
                    <label className={lbl}>Tagline <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                    <input className={inp} value={d.tagline || ""} onChange={e => set("tagline", e.target.value)} placeholder="One line about your store" maxLength={160} />
                </div>
                <div>
                    <label className={lbl}>Primary Specialty <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.specialty || ""} onChange={e => set("specialty", e.target.value)} placeholder="e.g. Bridal Lehengas" maxLength={120} />
                    <FieldError error={errors.specialty} />
                </div>
                <div className="md:col-span-2">
                    <label className={lbl}>Store Description <span className="text-maroon">*</span></label>
                    <textarea className={inp + " resize-none"} rows={4}
                        value={d.description || ""} onChange={e => set("description", e.target.value)}
                        placeholder="Tell customers what makes your store special — your products, craftsmanship, heritage…"
                        maxLength={800}
                    />
                    <div className="flex justify-between items-center">
                        <FieldError error={errors.description} />
                        <span className="text-[11px] text-gray-400">{(d.description || "").length}/800</span>
                    </div>
                </div>
                <div>
                    <label className={lbl}>Store City <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.city || ""} onChange={e => set("city", e.target.value)} placeholder="City where you operate from" />
                    <FieldError error={errors.city} />
                </div>
                <div>
                    <label className={lbl}>Instagram <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                    <input className={inp} value={d.instagram_url || ""} onChange={e => set("instagram_url", e.target.value)} placeholder="https://instagram.com/yourstore" />
                    <FieldError error={errors.instagram_url} />
                </div>
                <div className="md:col-span-2">
                    <label className={lbl}>Store Logo / Banner URL <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                    <input className={inp} value={d.image_url || ""} onChange={e => set("image_url", e.target.value)} placeholder="https://…" />
                </div>
            </div>
        </StepWrapper>
    );
}
