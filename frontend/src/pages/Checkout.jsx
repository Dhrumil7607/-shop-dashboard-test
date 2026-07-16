import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    CheckCircle, MapPin, CreditCard, ShoppingBag, Lock, ShieldCheck, Globe,
    RotateCcw, Truck, Check, Tag, Sparkles, PackageCheck, Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import SizeProfileSelector from "@/components/SizeProfile/SizeProfileSelector";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import PhoneInput from "@/components/PhoneInput";
import { quoteShipping, getPublicSettings } from "@/lib/api";

/* ─── Design tokens ─────────────────────────────────────────── */
const GOLD = "#C8A146";
const CREAM = "#FCFAF7";
const BORDER = "#ECE8E1";

/* ─── Client-side promo codes (percentage off) ───────────────── */
const COUPONS = { SHOPLIVE10: 10, FIRSTORDER: 15, WELCOME20: 20, DIWALI10: 10 };
const COUPON_SUGGESTIONS = [
    { code: "SHOPLIVE10", label: "10% off your order" },
    { code: "FIRSTORDER", label: "15% off first order" },
];

/* ─── Animated count-up number (≤300ms, GPU-cheap) ───────────── */
const CountUp = memo(function CountUp({ value, format, duration = 300 }) {
    const [display, setDisplay] = useState(value);
    const fromRef = useRef(value);
    useEffect(() => {
        const from = fromRef.current, to = value, start = performance.now();
        let raf;
        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(from + (to - from) * eased));
            if (t < 1) raf = requestAnimationFrame(tick); else fromRef.current = to;
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);
    return <>{format ? format(display) : display}</>;
});

/* ─── Floating-label input ──────────────────────────────────── */
const FloatingInput = memo(function FloatingInput({ label, value, onChange, type = "text", required, autoComplete, inputMode }) {
    const [focused, setFocused] = useState(false);
    const filled = value != null && String(value).length > 0;
    const up = focused || filled;
    return (
        <div className="relative">
            <input
                type={type} value={value} onChange={onChange} required={required}
                autoComplete={autoComplete} inputMode={inputMode} placeholder=" "
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                className="w-full rounded-xl border bg-white px-3.5 pt-5 pb-2 text-sm outline-none transition-all duration-150"
                style={{
                    borderColor: focused ? GOLD : BORDER,
                    boxShadow: focused ? `0 0 0 3px ${GOLD}1f` : "none",
                    color: "#2C241B",
                }}
            />
            <label className="pointer-events-none absolute left-3.5 transition-all duration-150"
                style={{ top: up ? 6 : 14, fontSize: up ? 10 : 13, letterSpacing: up ? "0.04em" : 0, color: up ? GOLD : "#9B8B7A", fontWeight: up ? 600 : 400, textTransform: up ? "uppercase" : "none" }}>
                {label}{required && " *"}
            </label>
            {filled && <Check size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "#2D7A3A" }} />}
        </div>
    );
});

/* ─── Labeled wrapper for custom controls (phone, select, address) ── */
function LabeledField({ label, required, done, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#9B8B7A" }}>
                {label}{required && <span style={{ color: "#8B3A3A" }}> *</span>}
                {done && <Check size={11} className="ml-1 inline" style={{ color: "#2D7A3A" }} />}
            </label>
            {children}
        </div>
    );
}
const selectCls = "w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none transition-all duration-150 cursor-pointer focus:border-[#C8A146]";
const customInp = "w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#C8A146]";

/* ─── Trust badge (monochrome) ──────────────────────────────── */
function TrustBadge({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-2">
            <Icon size={15} style={{ color: "#7A6E5F" }} />
            <span className="text-[12px] font-medium" style={{ color: "#6B5E52" }}>{label}</span>
        </div>
    );
}

/* ─── Premium payment card ──────────────────────────────────── */
function PayCard({ title, sub, selected, disabled, soon, onClick }) {
    return (
        <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
            className="relative w-full text-left rounded-2xl border-2 px-4 py-3.5 transition-all duration-150"
            style={{
                borderColor: selected ? GOLD : BORDER,
                background: selected ? `${GOLD}0D` : "white",
                opacity: disabled ? 0.55 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
            }}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{title}</p>
                {soon ? (
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: "#F0EBE3", color: "#9B8B7A" }}>Soon</span>
                ) : selected ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.16 }}>
                        <CheckCircle size={18} style={{ color: GOLD }} />
                    </motion.span>
                ) : null}
            </div>
            {sub && <p className="mt-0.5 text-[11px]" style={{ color: "#9B8B7A" }}>{sub}</p>}
        </button>
    );
}

/* ─── Progress stepper ──────────────────────────────────────── */
function Stepper({ current = 2 }) {
    const steps = ["Cart", "Shipping", "Payment", "Complete"];
    return (
        <div className="mb-8 flex items-center">
            {steps.map((s, i) => {
                const n = i + 1;
                const active = n === current, done = n < current;
                return (
                    <div key={s} className="flex flex-1 items-center last:flex-none">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200"
                                style={{
                                    background: active ? GOLD : done ? "#2D7A3A" : "white",
                                    color: active || done ? "white" : "#9B8B7A",
                                    border: active || done ? "none" : `1px solid ${BORDER}`,
                                }}>
                                {done ? <Check size={13} /> : n}
                            </div>
                            <span className="hidden text-[12px] font-semibold sm:inline" style={{ color: active ? "#1a1a1a" : "#9B8B7A" }}>{s}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="mx-2 h-[2px] flex-1 rounded-full" style={{ background: done ? "#2D7A3A" : BORDER }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Order confirmation screen (logic preserved) ───────────── */
function Confirmation({ order, formatPrice, navigate }) {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="mx-auto max-w-2xl px-6 py-16 text-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
                <CheckCircle size={56} className="mx-auto mb-6" style={{ color: "#2D7A3A" }} />
            </motion.div>
            <h1 className="mb-3 font-serif text-4xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>Order Confirmed</h1>
            <p className="mb-2 text-sm" style={{ color: "#9B8B7A" }}>Order <strong style={{ color: "#1a1a1a" }}>{order.orderId}</strong></p>
            {order.email && <p className="mb-10 text-sm" style={{ color: "#9B8B7A" }}>A confirmation has been sent to <strong style={{ color: "#1a1a1a" }}>{order.email}</strong></p>}
            <div className="mb-6 overflow-hidden rounded-2xl border text-left" style={{ borderColor: BORDER }}>
                {order.items.map(item => (
                    <div key={item.id || item.product_id} className="flex items-center gap-4 border-b px-5 py-4 last:border-0" style={{ borderColor: BORDER }}>
                        <img src={item.image_url} alt={item.name || item.product_name} className="h-14 w-12 flex-shrink-0 rounded-lg object-cover" style={{ backgroundColor: "#F0EBE3" }}
                            onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=80&q=60"; }} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium" style={{ color: "#1a1a1a" }}>{item.name || item.product_name}</p>
                            <p className="mt-0.5 text-xs" style={{ color: "#9B8B7A" }}>Qty {item.quantity}</p>
                        </div>
                        <p className="flex-shrink-0 text-sm font-semibold" style={{ color: "#1a1a1a" }}>{formatPrice(item.price * item.quantity)}</p>
                    </div>
                ))}
                <div className="border-t px-5 py-4" style={{ borderColor: BORDER, backgroundColor: CREAM }}>
                    <div className="flex justify-between text-sm font-bold" style={{ color: "#1a1a1a" }}>
                        <span>Total paid</span><span>{formatPrice(order.total)}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={() => navigate("/marketplace")} className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition" style={{ backgroundColor: "#1a1a1a" }}>Continue Shopping</button>
                <button onClick={() => navigate("/orders")} className="flex-1 rounded-xl border py-3 text-sm font-semibold transition hover:bg-black/5" style={{ borderColor: BORDER, color: "#1a1a1a" }}>View Orders</button>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — all logic below is preserved exactly; only UI redesigned.
   ═══════════════════════════════════════════════════════════════ */
export default function Checkout() {
    const navigate = useNavigate();
    const { cartItems, getTotalPrice, clearCart } = useCart();
    const { formatPrice } = useCurrency();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [payMethod, setPayMethod] = useState("razorpay");
    const [orderData, setOrderData] = useState(null);
    const [currency, setCurrency] = useState("INR");
    const [selectedSizeProfileId, setSelectedSizeProfileId] = useState(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponInput, setCouponInput] = useState("");
    const [phoneValid, setPhoneValid] = useState(true);

    const [form, setForm] = useState({
        full_name: user?.name || "",
        email: user?.email || "",
        phone: "",
        country: "India",
        address: "",
        city: "",
        state: "",
        zip: "",
    });

    const set = useCallback((k, v) => setForm(prev => ({ ...prev, [k]: v })), []);

    const subtotal = getTotalPrice();

    // ── Backend-authoritative weight-based shipping ──────────────────────────
    const [shippingQuote, setShippingQuote] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [siteSettings, setSiteSettings] = useState(null);
    useEffect(() => { getPublicSettings().then(setSiteSettings).catch(() => {}); }, []);
    useEffect(() => {
        if (!cartItems.length) { setShippingQuote(null); return; }
        let cancelled = false;
        setShippingLoading(true);
        const items = cartItems.map(i => ({ product_id: i.product_id || i.id, quantity: i.quantity || 1 }));
        quoteShipping({ items, country: form.country, subtotal })
            .then(q => { if (!cancelled) setShippingQuote(q); })
            .catch(() => { if (!cancelled) setShippingQuote(null); })
            .finally(() => { if (!cancelled) setShippingLoading(false); });
        return () => { cancelled = true; };
    }, [cartItems, form.country, subtotal]);

    const _freeThreshold = siteSettings?.free_shipping_threshold ?? 15000;
    const _flat = siteSettings?.domestic_flat ?? 499;
    const shipping = shippingQuote ? shippingQuote.amount : (subtotal >= _freeThreshold ? 0 : _flat);
    const discount = Math.round(subtotal * couponDiscount / 100);
    const total = subtotal + shipping - discount;

    const minDelivery = new Date(); minDelivery.setDate(minDelivery.getDate() + 7);
    const maxDelivery = new Date(); maxDelivery.setDate(maxDelivery.getDate() + 14);
    const deliveryRange = `${minDelivery.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${maxDelivery.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    const dispatchDate = new Date(); dispatchDate.setDate(dispatchDate.getDate() + 3);
    const dispatchStr = dispatchDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "UAE", "Singapore", "Germany", "France", "Other"];
    const CURRENCIES = ["INR", "USD", "GBP", "CAD", "AUD", "EUR", "SGD"];

    // ── Coupon apply (client-side promos, preserves couponDiscount mechanism) ──
    const applyCoupon = useCallback((raw) => {
        const code = (raw || "").trim().toUpperCase();
        const pct = COUPONS[code];
        if (pct !== undefined) {
            setCouponDiscount(pct);
            setAppliedCoupon({ code, percent: pct });
            setCouponInput("");
            toast.success("Coupon Applied", { description: `${code} — ${pct}% off your order.` });
        } else {
            toast.error("Invalid Coupon", { description: "That code isn't valid or has expired." });
        }
    }, []);
    const removeCoupon = useCallback(() => { setCouponDiscount(0); setAppliedCoupon(null); }, []);

    // Saves the order to backend. Optionally includes razorpay payment IDs.
    const saveOrder = useCallback(async (rzp = null) => {
        const { createOrder } = await import("@/lib/api");
        const payload = {
            items: cartItems.map(item => ({
                product_id: item.product_id || item.id,
                quantity: item.quantity,
                size: item.size || "",
                color: item.color || "",
                ...(item.custom_measurements ? { custom_measurements: item.custom_measurements } : {}),
            })),
            shipping_address: {
                full_name: form.full_name,
                email: form.email,
                phone: form.phone,
                address: form.address,
                city: form.city,
                state: form.state,
                zip: form.zip,
                country: form.country,
            },
            payment_method: payMethod,
            currency,
            coupon_discount: couponDiscount,
            ...(rzp ? {
                razorpay_payment_id: rzp.razorpay_payment_id,
                razorpay_order_id: rzp.razorpay_order_id,
                razorpay_signature: rzp.razorpay_signature,
            } : {}),
            ...(selectedSizeProfileId ? { size_profile_id: selectedSizeProfileId } : {}),
        };
        const saved = await createOrder(payload);
        clearCart();
        setOrderData({
            orderId: saved.id || saved.order_id || `SLB-${Date.now().toString(36).toUpperCase()}`,
            email: form.email,
            items: saved.items || cartItems,
            subtotal, shipping,
            total: saved.total ?? total,
            payMethod,
        });
    }, [form, cartItems, subtotal, shipping, total, payMethod, currency, couponDiscount, clearCart, selectedSizeProfileId]);

    const handlePlaceOrder = useCallback(async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.email || !form.address) {
            toast.warning("A Few Details Needed", { description: "Please complete your name, email and address to continue." });
            return;
        }
        setLoading(true);
        try {
            const { createRazorpayCheckoutLink } = await import("@/lib/api");
            const items = cartItems.map(item => ({
                product_id: item.product_id || item.id,
                quantity: item.quantity || 1,
                size: item.size || "",
                color: item.color || "",
                ...(item.custom_measurements ? { custom_measurements: item.custom_measurements } : {}),
            }));
            const shipping_address = {
                name: form.full_name,
                full_name: form.full_name,
                email: form.email,
                phone: form.phone,
                address: form.address,
                city: form.city,
                state: form.state,
                zip: form.zip,
                pincode: form.zip,
                country: form.country,
            };
            const { short_url } = await createRazorpayCheckoutLink({
                items,
                shipping_address,
                amount_paise: Math.round(Number(total) * 100),
                currency,
                description: `ShopLiveBharat — ${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}`,
            });
            if (!short_url) throw new Error("Could not start payment.");
            toast.loading("Preparing Secure Checkout", { id: "pay-status", description: "Connecting you securely to Razorpay…" });
            window.location.href = short_url;
        } catch (err) {
            setLoading(false);
            toast.error("Payment Could Not Start", { description: err?.response?.data?.detail || err?.message || "Please try again in a moment." });
        }
    }, [form, cartItems, total, currency]);

    // ── Handle the return from Razorpay's hosted checkout ─────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paidId = params.get("paid");
        const failed = params.get("payment_failed");
        if (failed) {
            toast.error("Payment Not Completed", { description: "Your payment didn't go through. Please try again." });
            window.history.replaceState({}, "", "/checkout");
            return;
        }
        if (!paidId) return;
        clearCart();
        toast.dismiss("pay-status");
        toast.success("Payment Confirmed", { description: "Your order has been placed successfully." });
        setOrderData({ orderId: paidId, email: "", items: [], subtotal: 0, shipping: 0, total: 0, payMethod: "razorpay" });
        (async () => {
            try {
                const { api } = await import("@/lib/api");
                const { data: ord } = await api.get(`/orders/${paidId}/summary`);
                if (ord) {
                    setOrderData({
                        orderId: paidId, email: ord.email || "", items: ord.items || [],
                        subtotal: ord.total || 0, shipping: 0, total: ord.total || 0, payMethod: "razorpay",
                    });
                }
            } catch { /* keep minimal success screen */ }
            window.history.replaceState({}, "", "/checkout");
        })();
    }, [clearCart]);

    if (cartItems.length === 0 && !orderData) {
        return (
            <MarketplaceLayout>
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                    <ShoppingBag size={48} style={{ color: "#E8E4DF" }} />
                    <p className="text-sm" style={{ color: "#9B8B7A" }}>Your bag is empty.</p>
                    <Link to="/marketplace" className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: "#1a1a1a" }}>Shop Now</Link>
                </div>
            </MarketplaceLayout>
        );
    }
    if (orderData) {
        return <MarketplaceLayout><Confirmation order={orderData} formatPrice={formatPrice} navigate={navigate} /></MarketplaceLayout>;
    }

    const fieldTransition = { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] };

    return (
        <MarketplaceLayout>
            <div style={{ backgroundColor: CREAM, minHeight: "100vh" }}>
                <div className="mx-auto max-w-[1180px] px-4 pb-28 pt-8 sm:px-6 lg:pb-12 lg:pt-10">

                    {/* Hero header */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={fieldTransition} className="mb-6 text-center">
                        <h1 className="font-serif text-3xl md:text-4xl" style={{ color: "#1a1a1a", fontWeight: 400 }}>Secure Checkout</h1>
                        <p className="mt-1 text-sm" style={{ color: "#9B8B7A" }}>Complete your purchase securely.</p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                            <TrustBadge icon={Lock} label="256-bit Encryption" />
                            <TrustBadge icon={ShieldCheck} label="Authentic Indian Stores" />
                            <TrustBadge icon={Globe} label="Worldwide Shipping" />
                            <TrustBadge icon={RotateCcw} label="Money-Back Protection" />
                        </div>
                    </motion.div>

                    <Stepper current={2} />

                    <form onSubmit={handlePlaceOrder}>
                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">

                            {/* ── LEFT: 7 cols ── */}
                            <div className="space-y-6 lg:col-span-7">

                                {/* Express checkout */}
                                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={fieldTransition}
                                    className="rounded-3xl border bg-white p-5" style={{ borderColor: BORDER, boxShadow: "0 2px 14px rgba(44,36,27,0.04)" }}>
                                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9B8B7A" }}>Express Checkout</p>
                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                        <PayCard title="Razorpay" selected={payMethod === "razorpay"} onClick={() => setPayMethod("razorpay")} />
                                        <PayCard title="PayPal" soon disabled />
                                        <PayCard title="Apple Pay" soon disabled />
                                        <PayCard title="Google Pay" soon disabled />
                                    </div>
                                </motion.div>

                                {/* Shipping */}
                                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fieldTransition, delay: 0.04 }}
                                    className="rounded-3xl border bg-white p-6 sm:p-7" style={{ borderColor: BORDER, boxShadow: "0 2px 14px rgba(44,36,27,0.04)" }}>
                                    <h2 className="mb-5 flex items-center gap-2 text-base font-bold" style={{ color: "#1a1a1a" }}>
                                        <MapPin size={16} style={{ color: GOLD }} /> Shipping Information
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <FloatingInput label="Full Name" value={form.full_name} onChange={e => set("full_name", e.target.value)} required autoComplete="name" />
                                        <FloatingInput label="Email" type="email" value={form.email} onChange={e => set("email", e.target.value)} required autoComplete="email" />
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <LabeledField label="Phone" done={!!form.phone && phoneValid}>
                                            <PhoneInput className={customInp} value={form.phone}
                                                onChange={(full, meta) => { set("phone", full); setPhoneValid(meta.valid || full === ""); }} />
                                            {form.phone && !phoneValid && <p className="mt-1 text-[11px]" style={{ color: "#C0392B" }}>Enter a valid phone number.</p>}
                                        </LabeledField>
                                        <LabeledField label="Country" done={!!form.country}>
                                            <select className={selectCls} value={form.country} onChange={e => set("country", e.target.value)} style={{ borderColor: BORDER }}>
                                                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </LabeledField>
                                    </div>
                                    <div className="mt-4">
                                        <LabeledField label="Address" required done={!!form.address}>
                                            <AddressAutocomplete className={customInp} value={form.address}
                                                onChange={v => set("address", v)}
                                                onSelect={a => { if (a.address) set("address", a.address); if (a.city) set("city", a.city); if (a.state) set("state", a.state); if (a.pincode) set("zip", a.pincode); }}
                                                placeholder="Start typing your address…" inputProps={{ required: true }} />
                                        </LabeledField>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <FloatingInput label="City" value={form.city} onChange={e => set("city", e.target.value)} autoComplete="address-level2" />
                                        <FloatingInput label="State / Region" value={form.state} onChange={e => set("state", e.target.value)} autoComplete="address-level1" />
                                        <FloatingInput label="ZIP / Postal Code" value={form.zip} onChange={e => set("zip", e.target.value)} inputMode="numeric" autoComplete="postal-code" />
                                    </div>
                                    <div className="mt-4">
                                        <LabeledField label="Display Currency">
                                            <select className={selectCls} value={currency} onChange={e => setCurrency(e.target.value)} style={{ borderColor: BORDER }}>
                                                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </LabeledField>
                                    </div>
                                </motion.div>

                                {/* Size profile */}
                                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fieldTransition, delay: 0.06 }}>
                                    <SizeProfileSelector onSelectionChange={setSelectedSizeProfileId} />
                                </motion.div>

                                {/* Payment methods */}
                                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fieldTransition, delay: 0.08 }}
                                    className="rounded-3xl border bg-white p-6 sm:p-7" style={{ borderColor: BORDER, boxShadow: "0 2px 14px rgba(44,36,27,0.04)" }}>
                                    <h2 className="mb-5 flex items-center gap-2 text-base font-bold" style={{ color: "#1a1a1a" }}>
                                        <CreditCard size={16} style={{ color: GOLD }} /> Payment Method
                                    </h2>
                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                        <PayCard title="Razorpay" sub="Cards · UPI · Netbanking · Wallets" selected={payMethod === "razorpay"} onClick={() => setPayMethod("razorpay")} />
                                        <PayCard title="PayPal" sub="International cards" soon disabled />
                                        <PayCard title="Apple Pay" sub="Fast & secure" soon disabled />
                                        <PayCard title="Google Pay" sub="Fast & secure" soon disabled />
                                        <PayCard title="Stripe" sub="Global payments" soon disabled />
                                    </div>
                                    <p className="mt-5 flex items-center gap-1.5 text-xs" style={{ color: "#9B8B7A" }}>
                                        <Lock size={12} /> All transactions are 256-bit SSL encrypted. We never store card details.
                                    </p>
                                </motion.div>
                            </div>

                            {/* ── RIGHT: 5 cols, sticky summary ── */}
                            <div className="lg:col-span-5">
                                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fieldTransition, delay: 0.05 }}
                                    className="rounded-3xl border bg-white p-6 lg:sticky lg:top-24" style={{ borderColor: BORDER, boxShadow: "0 8px 30px rgba(44,36,27,0.06)" }}>
                                    <h2 className="mb-5 text-base font-bold" style={{ color: "#1a1a1a" }}>Order Summary</h2>

                                    {/* Items */}
                                    <div className="mb-5 space-y-4 border-b pb-5" style={{ borderColor: BORDER }}>
                                        {cartItems.map(item => (
                                            <div key={item.id} className="flex items-start gap-3">
                                                <div className="relative flex-shrink-0">
                                                    <img src={item.image_url} alt={item.name} loading="lazy" className="h-16 w-14 rounded-xl object-cover" style={{ backgroundColor: "#F0EBE3" }}
                                                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=80&q=60"; }} />
                                                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: GOLD }}>{item.quantity}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="line-clamp-2 text-[13px] font-medium leading-snug" style={{ color: "#1a1a1a" }}>{item.name}</p>
                                                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px]" style={{ color: "#9B8B7A" }}>
                                                        {item.size && <span>Size: {String(item.size).length > 22 ? "Custom" : item.size}</span>}
                                                        {item.color && <span>· {item.color}</span>}
                                                        {(item.shop_name || item.store_name) && <span>· {item.shop_name || item.store_name}</span>}
                                                    </div>
                                                    <p className="mt-0.5 text-[10px]" style={{ color: "#9B8B7A" }}>Dispatch by {dispatchStr}</p>
                                                </div>
                                                <p className="flex-shrink-0 text-[13px] font-semibold" style={{ color: "#1a1a1a" }}>{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Coupon */}
                                    <div className="mb-5 border-b pb-5" style={{ borderColor: BORDER }}>
                                        {appliedCoupon ? (
                                            <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "rgba(45,122,58,0.08)", border: "1px solid rgba(45,122,58,0.25)" }}>
                                                <span className="text-[13px] font-medium" style={{ color: "#2D7A3A" }}>
                                                    <span className="font-mono">{appliedCoupon.code}</span> · {appliedCoupon.percent}% off
                                                </span>
                                                <button type="button" onClick={removeCoupon} className="text-[12px] font-semibold" style={{ color: "#8B3A3A" }}>Remove</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9B8B7A" }} />
                                                        <input value={couponInput} onChange={e => setCouponInput(e.target.value)}
                                                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(couponInput); } }}
                                                            placeholder="Coupon code" autoComplete="off"
                                                            className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#C8A146]" style={{ borderColor: BORDER }} />
                                                    </div>
                                                    <button type="button" onClick={() => applyCoupon(couponInput)} disabled={!couponInput.trim()}
                                                        className="rounded-xl px-4 text-sm font-semibold text-white transition disabled:opacity-40" style={{ backgroundColor: "#1a1a1a" }}>Apply</button>
                                                </div>
                                                <div className="mt-2.5 flex flex-wrap gap-2">
                                                    {COUPON_SUGGESTIONS.map(c => (
                                                        <button key={c.code} type="button" onClick={() => applyCoupon(c.code)}
                                                            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition hover:bg-black/[0.03]"
                                                            style={{ borderColor: BORDER, color: "#6B5E52" }}>
                                                            <Sparkles size={11} style={{ color: GOLD }} /> {c.code}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Totals */}
                                    <div className="mb-5 space-y-2.5 border-b pb-5 text-sm" style={{ borderColor: BORDER }}>
                                        <div className="flex justify-between" style={{ color: "#4A3F35" }}>
                                            <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between" style={{ color: "#4A3F35" }}>
                                            <span>Shipping{shippingQuote?.country && shippingQuote.country !== "India" ? ` · ${shippingQuote.country}` : ""}</span>
                                            <span style={{ color: shipping === 0 ? "#2D7A3A" : "#4A3F35" }}>{shippingLoading ? "Calculating…" : shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                                        </div>
                                        {!shippingLoading && shippingQuote?.weight_grams > 0 && (
                                            <p className="text-[11px]" style={{ color: "#9B8B7A" }}>Based on {(shippingQuote.weight_grams / 1000).toFixed(2)} kg total weight</p>
                                        )}
                                        {discount > 0 && (
                                            <div className="flex justify-between font-medium" style={{ color: "#2D7A3A" }}>
                                                <span>Discount</span><span>−{formatPrice(discount)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4 flex items-baseline justify-between">
                                        <span className="text-base font-bold" style={{ color: "#1a1a1a" }}>Total</span>
                                        <span className="font-serif text-2xl font-bold" style={{ color: "#1a1a1a" }}>
                                            <CountUp value={total} format={formatPrice} />
                                        </span>
                                    </div>

                                    <p className="mb-4 text-xs" style={{ color: "#9B8B7A" }}>Estimated delivery: <span style={{ color: "#4A3F35", fontWeight: 500 }}>{deliveryRange}</span></p>

                                    {/* Packing video trust badge */}
                                    <div className="mb-5 flex gap-3 rounded-2xl p-3.5" style={{ background: `${GOLD}0D`, border: `1px solid ${GOLD}40` }}>
                                        <Video size={18} className="mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                                        <p className="text-[12px] leading-snug" style={{ color: "#6B5E52" }}>
                                            Your order will be packed directly by the verified Indian store. A <strong style={{ color: "#4A3F35" }}>packing video</strong> is sent before dispatch for complete transparency.
                                        </p>
                                    </div>

                                    {/* Place Order */}
                                    <motion.button type="submit" disabled={loading}
                                        whileHover={loading ? {} : { y: -3, scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                        transition={{ duration: 0.15 }}
                                        className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-bold text-white disabled:opacity-70"
                                        style={{ height: 56, background: "linear-gradient(135deg,#D4B45E,#C8A146)", boxShadow: "0 10px 24px rgba(200,161,70,0.35)" }}>
                                        <span className="shine-sweep pointer-events-none absolute inset-0" aria-hidden />
                                        {loading
                                            ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Preparing Secure Checkout…</>
                                            : <><Lock size={15} /> Place Order · <CountUp value={total} format={formatPrice} /></>}
                                    </motion.button>

                                    {/* Trust section */}
                                    <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2.5">
                                        <TrustBadge icon={ShieldCheck} label="Secure Payments" />
                                        <TrustBadge icon={Globe} label="Ships Worldwide" />
                                        <TrustBadge icon={PackageCheck} label="Verified Sellers" />
                                        <TrustBadge icon={RotateCcw} label="Easy Returns" />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
