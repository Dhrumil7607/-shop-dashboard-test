import { useState } from "react";
import StepWrapper from "./StepWrapper";
import FieldError from "./FieldError";

const GST_RE  = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE  = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const PIN_RE  = /^\d{6}$/;
const PHONE_RE = /^\d{10}$/;

const STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
    "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
    "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
    "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
    "Uttarakhand","West Bengal","Andaman & Nicobar Islands","Chandigarh",
    "Dadra & Nagar Haveli and Daman & Diu","Delhi","Jammu & Kashmir","Ladakh",
    "Lakshadweep","Puducherry",
];

const BUSINESS_TYPES = [
    "Sole Proprietorship","Partnership","Private Limited","LLP","Other",
];

const inp = "w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-[#0a0a0a] placeholder-gray-400 text-sm outline-none focus:border-[#0a0a0a] focus:ring-2 focus:ring-gray-100 transition";
const lbl = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

export default function StepBusinessDetails({ formData, patch, onNext }) {
    const d = formData.business_details || {};
    const [errors, setErrors] = useState({});
    const set = (k, v) => patch("business_details", { [k]: v });

    const validate = () => {
        const e = {};
        if (!d.legal_name || d.legal_name.length < 2) e.legal_name = "Required (min 2 chars)";
        if (!d.business_type) e.business_type = "Required";
        if (!GST_RE.test(d.gst || "")) e.gst = "Invalid GST format (e.g. 27ABCDE1234F1Z5)";
        if (!PAN_RE.test(d.pan || "")) e.pan = "Invalid PAN format (e.g. ABCDE1234F)";
        if (!d.address || d.address.length < 10) e.address = "Required (min 10 chars)";
        if (!d.city)   e.city  = "Required";
        if (!d.state)  e.state = "Required";
        if (!PIN_RE.test(d.pin || ""))     e.pin   = "Must be 6 digits";
        if (!PHONE_RE.test(d.phone || "")) e.phone = "Must be 10-digit Indian number";
        return e;
    };

    const handleNext = () => {
        const e = validate();
        setErrors(e);
        if (!Object.keys(e).length) onNext();
    };

    return (
        <StepWrapper
            title="Business Details"
            subtitle="Enter your registered business information. This is used for verification only."
            onNext={handleNext}
            isFirst
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className={lbl}>Legal Business Name <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.legal_name || ""} onChange={e => set("legal_name", e.target.value)} placeholder="Exactly as on your GST certificate" />
                    <FieldError error={errors.legal_name} />
                </div>
                <div>
                    <label className={lbl}>Business Type <span className="text-maroon">*</span></label>
                    <select className={inp} value={d.business_type || ""} onChange={e => set("business_type", e.target.value)}>
                        <option value="">Select type</option>
                        {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <FieldError error={errors.business_type} />
                </div>
                <div>
                    <label className={lbl}>Contact Phone <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                    <FieldError error={errors.phone} />
                </div>
                <div>
                    <label className={lbl}>GST Number <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.gst || ""} onChange={e => set("gst", e.target.value.toUpperCase())} placeholder="27ABCDE1234F1Z5" maxLength={15} />
                    <FieldError error={errors.gst} />
                </div>
                <div>
                    <label className={lbl}>PAN Number <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.pan || ""} onChange={e => set("pan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                    <FieldError error={errors.pan} />
                </div>
                <div className="md:col-span-2">
                    <label className={lbl}>Registered Business Address <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.address || ""} onChange={e => set("address", e.target.value)} placeholder="Full address as on registration documents" />
                    <FieldError error={errors.address} />
                </div>
                <div>
                    <label className={lbl}>City <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.city || ""} onChange={e => set("city", e.target.value)} placeholder="City" />
                    <FieldError error={errors.city} />
                </div>
                <div>
                    <label className={lbl}>State <span className="text-maroon">*</span></label>
                    <select className={inp} value={d.state || ""} onChange={e => set("state", e.target.value)}>
                        <option value="">Select state</option>
                        {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <FieldError error={errors.state} />
                </div>
                <div>
                    <label className={lbl}>PIN Code <span className="text-maroon">*</span></label>
                    <input className={inp} value={d.pin || ""} onChange={e => set("pin", e.target.value)} placeholder="400001" maxLength={6} />
                    <FieldError error={errors.pin} />
                </div>
            </div>
        </StepWrapper>
    );
}
