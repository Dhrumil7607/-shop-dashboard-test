import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Check, Sparkles, X } from "lucide-react";
import { joinWaitlist } from "@/lib/api";

const COUNTRY_CODES = [
    { code: "+91", label: "India (+91)" },
    { code: "+1", label: "United States / Canada (+1)" },
    { code: "+44", label: "United Kingdom (+44)" },
    { code: "+61", label: "Australia (+61)" },
    { code: "+971", label: "United Arab Emirates (+971)" },
    { code: "+65", label: "Singapore (+65)" },
    { code: "+64", label: "New Zealand (+64)" },
    { code: "+49", label: "Germany (+49)" },
    { code: "+33", label: "France (+33)" },
    { code: "+39", label: "Italy (+39)" },
    { code: "+81", label: "Japan (+81)" },
    { code: "+27", label: "South Africa (+27)" },
    { code: "+60", label: "Malaysia (+60)" },
    { code: "+966", label: "Saudi Arabia (+966)" },
    { code: "+974", label: "Qatar (+974)" },
    { code: "+353", label: "Ireland (+353)" },
];

function Field({ id, label, type = "text", value, onChange, autoComplete, testid, inputMode }) {
    return (
        <div className="float-field">
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder=" "
                autoComplete={autoComplete}
                inputMode={inputMode}
                data-testid={testid}
            />
            <label htmlFor={id}>{label}</label>
        </div>
    );
}

function WaitlistForm({ scope }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const p = scope ? `${scope}-` : "";

    const submit = async (e) => {
        e?.preventDefault?.();
        if (loading) return;
        if (!fullName.trim() || !email.trim() || !phone.trim()) {
            toast.error("Please complete every field of the form.");
            return;
        }
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) {
            toast.error("Please enter a valid email address.");
            return;
        }
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 6 || digits.length > 15) {
            toast.error("Please enter a valid phone number.");
            return;
        }
        setLoading(true);
        try {
            await joinWaitlist({
                full_name: fullName.trim(),
                email: email.trim(),
                country_code: countryCode,
                phone: digits,
            });
            setSuccess(true);
            toast.success("You're officially on the waitlist ✨");
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "Something went wrong. Please try again.";
            toast.error(typeof msg === "string" ? msg : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center py-6"
                data-testid={`${p}waitlist-success`}
            >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full glass flex items-center justify-center text-maroon">
                    <Check className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-3xl md:text-4xl text-espresso mb-3">
                    You're <span className="serif-italic">officially</span> on the list ✨
                </h3>
                <p className="text-stone max-w-sm mx-auto">
                    Watch your inbox at launch — an invitation, a story and a quiet welcome
                    from India.
                </p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-7" data-testid={`${p}waitlist-form`}>
            <Field
                id={`${p}wl-name`}
                label="Full name"
                value={fullName}
                onChange={setFullName}
                autoComplete="name"
                testid={`${p}waitlist-input-name`}
            />
            <Field
                id={`${p}wl-email`}
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                testid={`${p}waitlist-input-email`}
            />
            <div className="grid grid-cols-[120px_1fr] gap-4">
                <div className="float-field">
                    <select
                        id={`${p}wl-cc`}
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className={countryCode ? "has-value" : ""}
                        data-testid={`${p}waitlist-input-country-code`}
                    >
                        {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                    </select>
                    <label htmlFor={`${p}wl-cc`}>Code</label>
                </div>
                <Field
                    id={`${p}wl-phone`}
                    label="Phone number"
                    value={phone}
                    onChange={setPhone}
                    autoComplete="tel"
                    inputMode="tel"
                    testid={`${p}waitlist-input-phone`}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                data-testid={`${p}waitlist-submit`}
                className="btn-pill btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? "Adding you…" : "Reserve my place"}
            </button>
            <p className="text-[11px] text-stone uppercase tracking-[0.22em] text-center">
                Private list · No spam · Unsubscribe anytime
            </p>
        </form>
    );
}

export default function Waitlist({ open, onOpenChange, embedded = false }) {
    // Embedded section view (always rendered on landing)
    if (embedded) {
        return (
            <section id="waitlist" data-testid="waitlist-section" className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20 bg-cream">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    <div className="md:col-span-5">
                        <p className="text-[11px] uppercase tracking-[0.32em] text-maroon mb-5">
                            Private invitation
                        </p>
                        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-espresso tracking-tightest leading-[1.04]">
                            Be the <span className="serif-italic">first</span> to step inside.
                        </h2>
                        <p className="text-base md:text-lg text-stone mt-6 leading-relaxed max-w-md">
                            Early members receive launch-day priority, a personal stylist
                            introduction and a private code for our first ten orders.
                        </p>
                        <div className="hairline w-32 my-8" />
                        <ul className="space-y-3 text-sm text-stone">
                            <li className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-maroon" strokeWidth={1.4} /> Launch-day priority access</li>
                            <li className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-maroon" strokeWidth={1.4} /> Founders' price for first 10 orders</li>
                            <li className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-maroon" strokeWidth={1.4} /> Free worldwide shipping at launch</li>
                        </ul>
                    </div>
                    <div className="md:col-span-7">
                        <div className="glass rounded-[2.2rem] p-8 md:p-12 shadow-[0_30px_60px_-30px_rgba(44,36,27,0.25)]">
                            <WaitlistForm scope="embedded" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Modal view — only mount when open to prevent duplicate forms in DOM
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/40 backdrop-blur-sm"
                    onClick={() => onOpenChange(false)}
                    data-testid="waitlist-modal"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
                        className="relative bg-ivory rounded-[2rem] max-w-lg w-full p-8 md:p-12 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => onOpenChange(false)}
                            data-testid="waitlist-modal-close"
                            className="absolute top-5 right-5 w-9 h-9 rounded-full hover:bg-cream flex items-center justify-center text-stone"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" strokeWidth={1.5} />
                        </button>

                        <p className="text-[11px] uppercase tracking-[0.32em] text-maroon mb-3">
                            The Waitlist
                        </p>
                        <h3 className="font-serif text-3xl md:text-4xl text-espresso mb-2 leading-tight">
                            A private <span className="serif-italic">welcome</span> awaits.
                        </h3>
                        <p className="text-sm text-stone mb-8">
                            Reserve your seat at launch — we'll write to you when the
                            doors open.
                        </p>
                        <WaitlistForm scope="modal" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
