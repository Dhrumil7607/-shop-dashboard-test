import { useState, useRef } from "react";
import { Upload, FileCheck, X } from "lucide-react";
import StepWrapper from "./StepWrapper";
import FieldError from "./FieldError";

const DOC_TYPES = [
    { key: "gst_certificate", label: "GST Certificate",                required: true },
    { key: "pan_copy",         label: "PAN Card Copy",                  required: true },
    { key: "business_proof",   label: "Business Registration Proof",    required: true },
    { key: "bank_statement",   label: "Bank Statement / Cancelled Cheque", required: true },
];

const ALLOWED   = ["application/pdf","image/jpeg","image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

function FileInput({ label, required, fileInfo, onSelect, onRemove, error }) {
    const ref = useRef();
    return (
        <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                {label}{required && <span className="text-maroon"> *</span>}
            </label>
            {fileInfo ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <FileCheck size={16} className="text-green-600 flex-shrink-0" />
                    <span className="flex-1 truncate text-green-800 font-medium">{fileInfo.name}</span>
                    <span className="text-green-600 text-xs flex-shrink-0">{(fileInfo.size/1024).toFixed(0)} KB</span>
                    <button type="button" onClick={onRemove} className="text-green-600 hover:text-red-500 transition ml-1">
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => ref.current.click()}
                    className="w-full flex items-center gap-3 px-4 py-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#0a0a0a] hover:bg-gray-50 transition text-sm text-gray-400 hover:text-[#0a0a0a] group">
                    <Upload size={16} className="flex-shrink-0" />
                    <span>Click to upload PDF, JPG or PNG <span className="text-gray-400 text-xs">(max 10 MB)</span></span>
                </button>
            )}
            <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => { if (e.target.files[0]) onSelect(e.target.files[0]); e.target.value = ""; }}
            />
            <FieldError error={error} />
        </div>
    );
}

export default function StepDocuments({ formData, patch, onNext, onBack }) {
    const d = formData.documents || {};
    const [errors, setErrors] = useState({});

    const handleSelect = (key, file) => {
        if (!ALLOWED.includes(file.type)) { setErrors(p => ({ ...p, [key]: "Only PDF, JPG, or PNG allowed" })); return; }
        if (file.size > MAX_BYTES)         { setErrors(p => ({ ...p, [key]: "File must be under 10 MB" }));     return; }
        setErrors(p => { const n = {...p}; delete n[key]; return n; });
        patch("documents", { [key]: { name: file.name, size: file.size, type: file.type } });
    };

    const validate = () => {
        const e = {};
        DOC_TYPES.filter(dt => dt.required).forEach(dt => {
            if (!d[dt.key]) e[dt.key] = "This document is required";
        });
        return e;
    };

    const handleNext = () => {
        const e = { ...errors, ...validate() }; setErrors(e);
        if (!Object.keys(e).length) onNext();
    };

    return (
        <StepWrapper
            title="Verification Documents"
            subtitle="Upload clear, readable copies. All files are encrypted and only used for verification."
            onNext={handleNext} onBack={onBack}
        >
            <div className="space-y-5">
                {DOC_TYPES.map(dt => (
                    <FileInput key={dt.key} label={dt.label} required={dt.required}
                        fileInfo={d[dt.key]}
                        onSelect={f => handleSelect(dt.key, f)}
                        onRemove={() => patch("documents", { [dt.key]: null })}
                        error={errors[dt.key]}
                    />
                ))}
            </div>
            <div className="mt-5 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span>🔒</span>
                <span>Documents are stored securely and only accessed by our verification team. They are never shared with third parties.</span>
            </div>
        </StepWrapper>
    );
}
