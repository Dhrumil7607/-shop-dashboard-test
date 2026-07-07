import { Edit2, CheckCircle } from "lucide-react";

function maskAccount(n) {
    if (!n) return "—";
    return "•".repeat(Math.max(0, n.length - 4)) + n.slice(-4);
}

function ReviewSection({ title, stepIdx, items, onEdit }) {
    const hasData = items.some(([, v]) => v);
    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h3>
                <button type="button" onClick={() => onEdit(stepIdx)}
                    className="flex items-center gap-1 text-xs text-maroon hover:text-maroon/70 font-semibold transition">
                    <Edit2 size={11} /> Edit
                </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {items.filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                        <p className="text-sm text-[#0a0a0a] font-medium truncate">{value}</p>
                    </div>
                ))}
                {!hasData && (
                    <p className="text-sm text-gray-400 italic md:col-span-2">No information provided</p>
                )}
            </div>
        </div>
    );
}

export default function StepReview({ formData, onBack, onGoToStep, onSubmit, submitting }) {
    const { business_details: b = {}, store_information: s = {}, bank_details: bk = {}, shipping_preferences: sh = {}, product_categories: pc = {} } = formData;

    const sections = [
        { title: "Business Details", step: 0, items: [
            ["Legal Name", b.legal_name], ["Business Type", b.business_type],
            ["GST", b.gst], ["PAN", b.pan],
            ["City", b.city], ["State", b.state], ["Phone", b.phone],
        ]},
        { title: "Store Information", step: 1, items: [
            ["Store Name", s.store_name], ["Specialty", s.specialty],
            ["City", s.city], ["Instagram", s.instagram_url],
        ]},
        { title: "Bank Details", step: 3, items: [
            ["Account Holder", bk.account_holder], ["Bank", bk.bank_name],
            ["Account No.", maskAccount(bk.account_number)], ["IFSC", bk.ifsc], ["Type", bk.account_type],
        ]},
        { title: "Shipping", step: 4, items: [
            ["Domestic", sh.domestic ? `Yes — ${sh.domestic_days} day(s)` : "No"],
            ["International", sh.international ? `Yes — ${sh.international_days} day(s)` : "No"],
            ["Partners", sh.partners],
        ]},
        { title: "Categories", step: 5, items: [
            ["Primary", pc.primary_category],
            ["All Selected", (pc.categories || []).join(", ")],
            ["Monthly Listings", pc.monthly_listings],
        ]},
    ];

    return (
        <div className="p-7 md:p-10">
            <div className="mb-8 pb-6 border-b border-gray-100">
                <h2 className="text-xl md:text-2xl font-bold text-[#0a0a0a] tracking-tight mb-1">Review & Submit</h2>
                <p className="text-sm text-gray-500">Check all your details before submitting. You can edit any section.</p>
            </div>

            <div className="space-y-4 mb-8">
                {sections.map(s => (
                    <ReviewSection key={s.title} title={s.title} stepIdx={s.step} items={s.items} onEdit={onGoToStep} />
                ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-8 flex items-start gap-3 border border-gray-100">
                <CheckCircle size={16} className="text-maroon flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                    By submitting this application you confirm that all information is accurate and you agree to
                    ShopLiveBharat's <a href="/terms" className="underline text-[#0a0a0a]">Seller Terms of Service</a> and{" "}
                    <a href="/privacy" className="underline text-[#0a0a0a]">Privacy Policy</a>.
                </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <button type="button" onClick={onBack}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm font-medium">
                    ← Back
                </button>
                <button type="button" onClick={onSubmit} disabled={submitting}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-maroon text-white rounded-lg hover:bg-maroon/90 transition text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? (
                        <><span className="animate-spin">⏳</span> Submitting…</>
                    ) : (
                        <>Submit Application →</>
                    )}
                </button>
            </div>
        </div>
    );
}
