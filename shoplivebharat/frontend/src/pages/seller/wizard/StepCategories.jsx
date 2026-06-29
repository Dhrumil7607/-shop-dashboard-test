import { useState } from "react";
import { Check } from "lucide-react";
import StepWrapper from "./StepWrapper";
import FieldError from "./FieldError";

export const ALL_CATEGORIES = [
    "Sarees","Lehengas","Salwar Kameez","Anarkali","Kurti","Sharara","Gown",
    "Jewellery","Accessories","Outerwear","Shawls & Dupattas","Bags",
    "Home Décor","Textiles","Footwear","Men's Ethnic Wear","Wedding Wear",
    "Festive Wear","Casual Wear","Customised / Bespoke",
];

const inp = "w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-[#0a0a0a] placeholder-gray-400 text-sm outline-none focus:border-[#0a0a0a] focus:ring-2 focus:ring-gray-100 transition";
const lbl = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

export default function StepCategories({ formData, patch, onNext, onBack }) {
    const d = formData.product_categories || { categories: [], primary_category: "", monthly_listings: "" };
    const [errors, setErrors] = useState({});
    const selected = d.categories || [];

    const toggle = (cat) => {
        const next = selected.includes(cat)
            ? selected.filter(c => c !== cat)
            : selected.length < 10 ? [...selected, cat] : selected;
        const primary = next.includes(d.primary_category) ? d.primary_category : "";
        patch("product_categories", { categories: next, primary_category: primary });
    };

    const set = (k, v) => patch("product_categories", { [k]: v });

    const validate = () => {
        const e = {};
        if (!selected.length)   e.categories       = "Select at least one category";
        if (!d.primary_category) e.primary_category = "Select a primary category";
        if (!d.monthly_listings || parseInt(d.monthly_listings) < 1) e.monthly_listings = "Enter estimated monthly listings";
        return e;
    };

    const handleNext = () => {
        const e = validate(); setErrors(e);
        if (!Object.keys(e).length) onNext();
    };

    return (
        <StepWrapper
            title="Product Categories"
            subtitle="Choose the categories you will sell in. Select up to 10."
            onNext={handleNext} onBack={onBack}
        >
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className={lbl}>Categories <span className="text-maroon">*</span></label>
                    <span className="text-xs text-gray-400">{selected.length}/10 selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {ALL_CATEGORIES.map(cat => {
                        const active   = selected.includes(cat);
                        const disabled = !active && selected.length >= 10;
                        return (
                            <button key={cat} type="button" disabled={disabled} onClick={() => toggle(cat)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                                    active   ? "bg-[#0a0a0a] text-white border-[#0a0a0a]" :
                                    disabled ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" :
                                    "bg-white text-[#0a0a0a] border-gray-200 hover:border-[#0a0a0a]"
                                }`}>
                                {active && <Check size={11} strokeWidth={3} />}
                                {cat}
                            </button>
                        );
                    })}
                </div>
                <FieldError error={errors.categories} />
            </div>

            {selected.length > 0 && (
                <div>
                    <label className={lbl}>Primary Category <span className="text-maroon">*</span></label>
                    <select className={inp} value={d.primary_category || ""} onChange={e => set("primary_category", e.target.value)}>
                        <option value="">Choose primary from selected</option>
                        {selected.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <FieldError error={errors.primary_category} />
                </div>
            )}

            <div>
                <label className={lbl}>Estimated Monthly Listings <span className="text-maroon">*</span></label>
                <input type="number" min="1" max="10000" className={inp}
                    value={d.monthly_listings || ""} onChange={e => set("monthly_listings", e.target.value)}
                    placeholder="How many products do you plan to list per month?" />
                <FieldError error={errors.monthly_listings} />
            </div>
        </StepWrapper>
    );
}
