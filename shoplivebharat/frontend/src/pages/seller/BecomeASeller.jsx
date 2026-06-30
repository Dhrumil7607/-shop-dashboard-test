import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Globe, Users, ShieldCheck, TrendingUp, Package, CheckCircle, ArrowRight, Loader } from "lucide-react";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useAuth } from "@/contexts/AuthContext";
import { submitSellerApplication } from "@/lib/sellerApplicationsApi";

const LS_KEY = "slb_seller_draft";
const saveDraft = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} };
const clearDraft = () => { try { localStorage.removeItem(LS_KEY); } catch {} };
const loadDraft = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; } };

const BENEFITS = [
    { icon: Globe,       title: "Sell Worldwide",  desc: "Reach Indian diaspora customers in 50+ countries" },
    { icon: Users,       title: "50K+ Shoppers",   desc: "Tap into our growing base of verified buyers" },
    { icon: ShieldCheck, title: "Secure Payouts",  desc: "Weekly settlements directly to your bank" },
    { icon: TrendingUp,  title: "Grow Revenue",    desc: "Dedicated seller tools and analytics dashboard" },
    { icon: Package,     title: "Easy Logistics",  desc: "We help coordinate shipping and packaging" },
    { icon: CheckCircle, title: "Verified Badge",  desc: "Build customer trust with seller verification" },
];

const CATEGORIES = [
    "Sarees", "Lehengas", "Kurtas", "Sherwanis", "Chaniya Choli",
    "Salwar Kameez", "Anarkali", "Wedding Wear", "Festival Wear",
    "Jewellery", "Accessories", "Kids Traditional", "Men's Ethnic",
    "Home Décor", "Other",
];

const inp  = "w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-[#0a0a0a] placeholder-gray-400 text-sm outline-none focus:border-[#0a0a0a] focus:ring-2 focus:ring-gray-100 transition";
const lbl  = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";
const req  = <span className="text-maroon"> *</span>;

function FieldErr({ e }) {
    return e ? <p role="alert" className="mt-1 text-xs text-red-600 font-medium">⚠ {e}</p> : null;
}

export default function BecomeASeller() {
    const navigate = useNavigate();
    const { user }  = useAuth();

    // Scroll to top on mount
    useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

    const [submitting, setSubmitting] = useState(false);
    const [errors,     setErrors]     = useState({});

    const [form, setForm] = useState(() => {
        const draft = loadDraft();
        return draft || {
            // Personal / contact
            full_name:     user?.name  || "",
            email:         user?.email || "",
            phone:         "",
            // Store basics
            store_name:    "",
            store_city:    "",
            store_state:   "",
            store_description: "",
            // Categories (multi-select)
            categories:    [],
            primary_category: "",
            // How they heard
            how_heard:     "",
        };
    });

    const set = useCallback((k, v) => {
        setForm(prev => {
            const next = { ...prev, [k]: v };
            saveDraft(next);
            return next;
        });
    }, []);

    const validate = () => {
        const e = {};
        if (!form.full_name.trim()    || form.full_name.length < 2)    e.full_name    = "Required (min 2 chars)";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))            e.email        = "Enter a valid email address";
        if (!/^\+?[\d\s\-()]{7,20}$/.test(form.phone.replace(/\s/g, "")))
            e.phone = "Enter a valid phone number";
        if (!form.store_name.trim()   || form.store_name.length < 2)    e.store_name   = "Required (min 2 chars)";
        if (!form.store_city.trim())                                     e.store_city   = "Required";
        if (!form.store_state.trim())                                    e.store_state  = "Required";
        if (!form.store_description.trim() || form.store_description.length < 20)
            e.store_description = "Tell us about your store (min 20 chars)";
        if (!form.categories.length)                                     e.categories   = "Select at least one category";
        if (!form.primary_category)                                      e.primary_category = "Choose your primary category";
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length) {
            toast.error("Please fix the highlighted fields.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                applicant_email:    form.email,
                applicant_name:     form.full_name,
                business_details:   { phone: form.phone, city: form.store_city, state: form.store_state },
                store_information:  {
                    store_name:   form.store_name,
                    city:         form.store_city,
                    description:  form.store_description,
                    specialty:    form.primary_category,
                },
                product_categories: {
                    categories:         form.categories,
                    primary_category:   form.primary_category,
                },
                how_heard: form.how_heard,
            };
            const app = await submitSellerApplication(payload);
            clearDraft();
            toast.success("Application submitted! We'll be in touch soon.");
            navigate(`/become-a-seller/status/${app.id}`);
        } catch (err) {
            toast.error(err?.response?.data?.detail || err?.message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleCategory = (cat) => {
        const next = form.categories.includes(cat)
            ? form.categories.filter(c => c !== cat)
            : [...form.categories, cat];
        const primary = next.includes(form.primary_category) ? form.primary_category : "";
        setForm(prev => { const n = { ...prev, categories: next, primary_category: primary }; saveDraft(n); return n; });
    };

    return (
        <MarketplaceLayout>
            {/* Dark hero */}
            <section className="bg-[#0a0a0a] text-white py-14 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-maroon mb-3">FOR INDIAN RETAILERS</p>
                    <h1 className="font-serif text-4xl md:text-5xl text-white mb-3 leading-tight">
                        Register Your Store on <span className="text-champagne">ShopLiveBharat</span>
                    </h1>
                    <p className="text-white/55 text-sm max-w-xl leading-relaxed">
                        Sell Indian traditional clothes to customers across the world.
                        Fill in the form below — takes less than 2 minutes.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="bg-gray-50 py-10 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

                        {/* Benefits sidebar */}
                        <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h3 className="font-bold text-[#0a0a0a] text-sm uppercase tracking-wider mb-5">Why sell with us?</h3>
                                <ul className="space-y-4">
                                    {BENEFITS.map(b => (
                                        <li key={b.title} className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-maroon/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <b.icon size={14} className="text-maroon" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#0a0a0a]">{b.title}</p>
                                                <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-[#0a0a0a] rounded-2xl p-6 text-white">
                                <p className="text-[10px] uppercase tracking-widest text-champagne font-bold mb-2">Already registered?</p>
                                <p className="text-xs text-white/60 mb-4 leading-relaxed">Log in to manage your store and orders.</p>
                                <Link to="/login"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-white/20 rounded-lg text-sm font-semibold hover:bg-white/10 transition">
                                    Seller Login <ArrowRight size={14} />
                                </Link>
                            </div>
                        </aside>

                        {/* Form */}
                        <div className="lg:col-span-2">
                            <motion.form
                                onSubmit={handleSubmit}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                noValidate
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                            >
                                {/* ── Section 1: Your Details ── */}
                                <div className="px-7 pt-8 pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-[#0a0a0a] mb-1">Your Details</h2>
                                    <p className="text-xs text-gray-500 mb-6">We'll use this to contact you about your application.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className={lbl}>Full Name{req}</label>
                                            <input className={inp} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Your full name" />
                                            <FieldErr e={errors.full_name} />
                                        </div>
                                        <div>
                                            <label className={lbl}>Email Address{req}</label>
                                            <input className={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" />
                                            <FieldErr e={errors.email} />
                                        </div>
                                        <div>
                                            <label className={lbl}>Mobile Number{req}</label>
                                            <input className={inp} type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Phone number (e.g. +91 98765 43210)" maxLength={20} />
                                            <FieldErr e={errors.phone} />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section 2: Store Details ── */}
                                <div className="px-7 pt-6 pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-[#0a0a0a] mb-1">Store Details</h2>
                                    <p className="text-xs text-gray-500 mb-6">Tell customers and our team about your store.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className={lbl}>Store Name{req}</label>
                                            <input className={inp} value={form.store_name} onChange={e => set("store_name", e.target.value)} placeholder="e.g. Banarasi Silks Co." maxLength={120} />
                                            <FieldErr e={errors.store_name} />
                                        </div>
                                        <div>
                                            <label className={lbl}>City{req}</label>
                                            <input className={inp} value={form.store_city} onChange={e => set("store_city", e.target.value)} placeholder="City you ship from" />
                                            <FieldErr e={errors.store_city} />
                                        </div>
                                        <div>
                                            <label className={lbl}>State{req}</label>
                                            <input className={inp} value={form.store_state} onChange={e => set("store_state", e.target.value)} placeholder="e.g. Gujarat" />
                                            <FieldErr e={errors.store_state} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={lbl}>About Your Store{req}</label>
                                            <textarea className={inp + " resize-none"} rows={4}
                                                value={form.store_description}
                                                onChange={e => set("store_description", e.target.value)}
                                                placeholder="What do you sell? What makes your store special? What crafts or regions do you specialise in?"
                                                maxLength={800}
                                            />
                                            <div className="flex justify-between">
                                                <FieldErr e={errors.store_description} />
                                                <span className="text-[11px] text-gray-400">{form.store_description.length}/800</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section 3: Categories ── */}
                                <div className="px-7 pt-6 pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-[#0a0a0a] mb-1">What do you sell?</h2>
                                    <p className="text-xs text-gray-500 mb-5">Select all categories that apply to your store.</p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {CATEGORIES.map(cat => {
                                            const active = form.categories.includes(cat);
                                            return (
                                                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                                                        active
                                                            ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                                                            : "bg-white text-[#0a0a0a] border-gray-200 hover:border-[#0a0a0a]"
                                                    }`}>
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <FieldErr e={errors.categories} />

                                    {form.categories.length > 0 && (
                                        <div className="mt-4">
                                            <label className={lbl}>Primary Category{req}</label>
                                            <select className={inp} value={form.primary_category} onChange={e => set("primary_category", e.target.value)}>
                                                <option value="">Choose your main category</option>
                                                {form.categories.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                            <FieldErr e={errors.primary_category} />
                                        </div>
                                    )}
                                </div>

                                {/* ── Section 4: Optional ── */}
                                <div className="px-7 pt-6 pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-[#0a0a0a] mb-1">One last thing</h2>
                                    <p className="text-xs text-gray-500 mb-5">Optional — helps us improve.</p>
                                    <div>
                                        <label className={lbl}>How did you hear about us?</label>
                                        <select className={inp} value={form.how_heard} onChange={e => set("how_heard", e.target.value)}>
                                            <option value="">Select an option</option>
                                            <option>Instagram</option>
                                            <option>Facebook</option>
                                            <option>WhatsApp</option>
                                            <option>Friend / Word of mouth</option>
                                            <option>Google search</option>
                                            <option>Trade fair / Exhibition</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* ── Submit ── */}
                                <div className="px-7 py-6 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                                        By registering you agree to our{" "}
                                        <Link to="/terms" className="underline hover:text-[#0a0a0a]">Seller Terms</Link>{" "}
                                        and{" "}
                                        <Link to="/privacy" className="underline hover:text-[#0a0a0a]">Privacy Policy</Link>.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-3.5 bg-maroon text-white rounded-xl font-bold text-sm hover:bg-maroon/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting
                                            ? <><Loader size={15} className="animate-spin" /> Submitting…</>
                                            : <>Register Your Store <ArrowRight size={15} /></>
                                        }
                                    </button>
                                </div>
                            </motion.form>

                            <p className="text-center text-xs text-gray-400 mt-4">
                                Progress saved automatically.{" "}
                                <button onClick={clearDraft} className="underline hover:text-maroon transition">Clear</button>
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </MarketplaceLayout>
    );
}
