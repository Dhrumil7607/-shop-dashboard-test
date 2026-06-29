import { useState } from "react";
import StepWrapper from "./StepWrapper";
import FieldError from "./FieldError";

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const inp = "w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-[#0a0a0a] placeholder-gray-400 text-sm outline-none focus:border-[#0a0a0a] focus:ring-2 focus:ring-gray-100 transition";
const lbl = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

export default function StepBankDetails({ formData, patch, onNext, onBack }) {
    const d = formData.bank_details || {};
    const [errors, setErrors] = useState({});
    const set = (k, v) => patch("bank_details", { [k]: v });

    const validate = () => {
        const e = {};
        if (!d.account_holder || d.account_holder.length < 2) e.account_holder = "Required";
        if (!d.bank_name      || d.bank_name.length < 2)       e.bank_name       = "Required";
        if (!/^\d{9,18}$/.test(d.account_number || ""))        e.account_number  = "Must be 9–18 digits";
        if (!IFSC_RE.test(d.ifsc || ""))                        e.ifsc            = "Invalid IFSC (e.g. SBIN0001234)";
        if (!d.account_type)                                    e.account_type    = "Required";
        return e;
    };

    const handleNext = () => {
        const e = validate(); setErrors(e);
        if (!Object.keys(e).length) onNext();
    };

    return (
        <StepWrapper
            title="Bank Account Details"
            subtitle="Your payout account — used to settle weekly earnings directly."
            onNext={handleNext} onBack={onBack}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className={lbl}>Account Holder Name <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.account_holder || ""} onChange={e => set("account_holder", e.target.value)} placeholder="Exactly as on bank records" maxLength={100} />
                    <FieldError error={errors.account_holder} />
                </div>
                <div>
                    <label className={lbl}>Bank Name <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.bank_name || ""} onChange={e => set("bank_name", e.target.value)} placeholder="e.g. State Bank of India" maxLength={100} />
                    <FieldError error={errors.bank_name} />
                </div>
                <div>
                    <label className={lbl}>Account Type <span className="text-maroon">*</span></label>
                    <select className={inp} value={d.account_type || ""} onChange={e => set("account_type", e.target.value)}>
                        <option value="">Select type</option>
                        <option>Savings</option>
                        <option>Current</option>
                    </select>
                    <FieldError error={errors.account_type} />
                </div>
                <div>
                    <label className={lbl}>Account Number <span className="text-maroon">*</span></label>
                    <input className={inp} type="password" value={d.account_number || ""} onChange={e => set("account_number", e.target.value)} placeholder="9–18 digit account number" maxLength={18} />
                    <FieldError error={errors.account_number} />
                </div>
                <div>
                    <label className={lbl}>IFSC Code <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.ifsc || ""} onChange={e => set("ifsc", e.target.value.toUpperCase())} placeholder="SBIN0001234" maxLength={11} />
                    <FieldError error={errors.ifsc} />
                </div>
            </div>
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span>🔒</span>
                <span>Bank details are end-to-end encrypted. We never charge your account — only use it for payouts.</span>
            </div>
        </StepWrapper>
    );
}
