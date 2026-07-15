import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader, CheckCircle, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import SizeProfileSelector from "@/components/SizeProfile/SizeProfileSelector";
import GlassCard from "@/components/Checkout/GlassCard";
import CouponField from "@/components/Checkout/CouponField";
import TrustBadgeRow from "@/components/Checkout/TrustBadgeRow";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import PhoneInput from "@/components/PhoneInput";
import { quoteShipping } from "@/lib/api";

/* ─── Styled input ─────────────────────────────────────────── */
const inp = "w-full px-3 py-2.5 border-b border-gray-200 bg-transparent text-sm outline-none focus:border-[#C9A84C] transition placeholder-gray-400";
const lbl = "block text-xs font-medium mb-1" ;

/* ─── Brand accent colours for payment tiles ────────────────── */
const PAY_ACCENT = {
    card:     "#1B2A6B",
    razorpay: "#2563EB",
    paypal:   "#F59E0B",
    applepay: "#0A0A0A",
};

/* ─── Payment method option ─────────────────────────────────── */
function PayMethod({ id, title, sub, selected, onClick }) {
    const accent = PAY_ACCENT[id] || "#C9A84C";
    return (
        <button type="button" onClick={onClick}
            className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition"
            style={{
                borderColor: selected ? accent : "#E8E4DF",
                backgroundColor: selected ? `${accent}0D` : "white",
                borderLeftColor: selected ? accent : "#E8E4DF",
                borderLeftWidth: selected ? 3 : 2,
            }}>
            <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{title}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: "#9B8B7A" }}>{sub}</p>}
        </button>
    );
}

/* ─── Order confirmation screen ─────────────────────────────── */
function Confirmation({ order, formatPrice, navigate }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto px-6 py-16 text-center">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}>
                <CheckCircle size={56} className="mx-auto mb-6" style={{ color: "#2D7A3A" }} />
            </motion.div>
            <h1 className="font-serif text-4xl mb-3" style={{ color: "#1a1a1a", fontWeight: 400 }}>
                Order Confirmed!
            </h1>
            <p className="text-sm mb-2" style={{ color: "#9B8B7A" }}>
                Order <strong style={{ color: "#1a1a1a" }}>{order.orderId}</strong>
            </p>
            <p className="text-sm mb-10" style={{ color: "#9B8B7A" }}>
                A confirmation has been sent to <strong style={{ color: "#1a1a1a" }}>{order.email}</strong>
            </p>

            {/* Items */}
            <div className="border rounded-2xl overflow-hidden mb-6 text-left"
                style={{ borderColor: "#E8E4DF" }}>
                <div className="divide-y" style={{ divideColor: "#E8E4DF" }}>
                    {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                            <img src={item.image_url} alt={item.name}
                                className="w-12 h-14 object-cover rounded-lg flex-shrink-0"
                                style={{ backgroundColor: "#F0EBE3" }}
                                onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=80&q=60"; }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: "#1a1a1a" }}>{item.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: "#9B8B7A" }}>Qty {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold flex-shrink-0" style={{ color: "#1a1a1a" }}>
                                {formatPrice(item.price * item.quantity)}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="px-5 py-4 border-t" style={{ borderColor: "#E8E4DF", backgroundColor: "#FAF9F6" }}>
                    <div className="flex justify-between text-sm font-bold" style={{ color: "#1a1a1a" }}>
                        <span>Total paid</span>
                        <span>{formatPrice(order.total)}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={() => navigate("/marketplace")}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition"
                    style={{ backgroundColor: "#1a1a1a", color: "white" }}>
                    Continue Shopping
                </button>
                <button onClick={() => navigate("/")}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border transition hover:bg-black/5"
                    style={{ borderColor: "#E8E4DF", color: "#1a1a1a" }}>
                    Back to Home
                </button>
            </div>
        </motion.div>
    );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function Checkout() {
    const navigate = useNavigate();
    const { cartItems, getTotalPrice, clearCart } = useCart();
    const { formatPrice } = useCurrency();
    const { user } = useAuth();

    const [loading,  setLoading]  = useState(false);
    const [payMethod, setPayMethod] = useState("razorpay");
    const [orderData, setOrderData] = useState(null);
    const [currency, setCurrency] = useState("INR");
    const [selectedSizeProfileId, setSelectedSizeProfileId] = useState(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [phoneValid, setPhoneValid] = useState(true);

    const [form, setForm] = useState({
        full_name: user?.name  || "",
        email:     user?.email || "",
        phone:     "",
        country:   "India",
        address:   "",
        city:      "",
        state:     "",
        zip:       "",
    });

    const set = useCallback((k, v) => setForm(prev => ({ ...prev, [k]: v })), []);

    const subtotal = getTotalPrice();

    // ── Backend-authoritative weight-based shipping ──────────────────────────
    // The frontend only DISPLAYS the amount the backend returns. It re-quotes
    // whenever the cart or destination country changes.
    const [shippingQuote, setShippingQuote] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(false);
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

    // Fallback keeps the page usable if the quote call fails.
    const shipping = shippingQuote
        ? shippingQuote.amount
        : (subtotal > 15000 ? 0 : 499);
    const discount = Math.round(subtotal * couponDiscount / 100);
    // Grand Total = Products + Shipping − Discounts  (no tax)
    const total    = subtotal + shipping - discount;

    const minDelivery = new Date(); minDelivery.setDate(minDelivery.getDate() + 7);
    const maxDelivery = new Date(); maxDelivery.setDate(maxDelivery.getDate() + 14);
    const deliveryRange = `${minDelivery.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${maxDelivery.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

    const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","UAE","Singapore","Germany","France","Other"];
    const CURRENCIES = ["INR","USD","GBP","CAD","AUD","EUR","SGD"];

    const PAY_METHODS = [
        { id: "razorpay", title: "Razorpay", sub: "Cards · UPI · Netbanking · Wallets" },
    ];

    // Saves the order to backend. Optionally includes razorpay payment IDs.
    const saveOrder = useCallback(async (rzp = null) => {
        const { createOrder } = await import("@/lib/api");
        const payload = {
            items: cartItems.map(item => ({
                product_id: item.product_id || item.id,
                quantity:   item.quantity,
                size:       item.size  || "",
                color:      item.color || "",
                ...(item.custom_measurements ? { custom_measurements: item.custom_measurements } : {}),
            })),
            shipping_address: {
                full_name: form.full_name,
                email:     form.email,
                phone:     form.phone,
                address:   form.address,
                city:      form.city,
                state:     form.state,
                zip:       form.zip,
                country:   form.country,
            },
            payment_method: payMethod,
            currency,
            coupon_discount: couponDiscount,
            ...(rzp ? {
                razorpay_payment_id: rzp.razorpay_payment_id,
                razorpay_order_id:   rzp.razorpay_order_id,
                razorpay_signature:  rzp.razorpay_signature,
            } : {}),
            ...(selectedSizeProfileId ? { size_profile_id: selectedSizeProfileId } : {}),
        };
        const saved = await createOrder(payload);
        clearCart();
        setOrderData({
            orderId: saved.id || saved.order_id || `SLB-${Date.now().toString(36).toUpperCase()}`,
            email:   form.email,
            items:   saved.items || cartItems,
            subtotal, shipping,
            total:   saved.total ?? total,
            payMethod,
        });
    }, [form, cartItems, subtotal, shipping, total, payMethod, currency, couponDiscount, clearCart, selectedSizeProfileId]);

    const handlePlaceOrder = useCallback(async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.email || !form.address) {
            toast.error("Please fill in all required fields.");
            return;
        }

        // ── Full-page redirect to Razorpay's hosted checkout ──────────────────
        // We create a pending order + a Razorpay Payment Link on the backend, then
        // send the whole browser to Razorpay. This avoids the in-page checkout
        // iframe entirely (no spinner/hang from analytics, extensions, etc.).
        setLoading(true);
        try {
            const { createRazorpayCheckoutLink } = await import("@/lib/api");
            const items = cartItems.map(item => ({
                product_id: item.product_id || item.id,
                quantity:   item.quantity || 1,
                size:       item.size  || "",
                color:      item.color || "",
                ...(item.custom_measurements ? { custom_measurements: item.custom_measurements } : {}),
            }));
            const shipping_address = {
                name:      form.full_name,
                full_name: form.full_name,
                email:     form.email,
                phone:     form.phone,
                address:   form.address,
                city:      form.city,
                state:     form.state,
                zip:       form.zip,
                pincode:   form.zip,
                country:   form.country,
            };
            const { short_url } = await createRazorpayCheckoutLink({
                items,
                shipping_address,
                amount_paise: Math.round(Number(total) * 100),
                currency,
                description: `ShopLiveBharat — ${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}`,
            });
            if (!short_url) throw new Error("Could not start payment.");
            toast.loading("Redirecting to secure payment…", { id: "pay-status" });
            window.location.href = short_url;   // leave the SPA → Razorpay hosted page
        } catch (err) {
            setLoading(false);
            toast.error(err?.response?.data?.detail || err?.message || "Could not start payment. Please try again.");
        }
    }, [form, cartItems, total, currency]);

    // ── Handle the return from Razorpay's hosted checkout ─────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paidId = params.get("paid");
        const failed = params.get("payment_failed");
        if (failed) {
            toast.error("Payment was not completed. Please try again.");
            window.history.replaceState({}, "", "/checkout");
            return;
        }
        if (!paidId) return;
        // Show success immediately (avoids the empty-cart flash), then enrich.
        clearCart();
        setOrderData({
            orderId: paidId, email: "", items: [],
            subtotal: 0, shipping: 0, total: 0, payMethod: "razorpay",
        });
        (async () => {
            try {
                const { api } = await import("@/lib/api");
                // Public summary endpoint — works for guest checkouts too.
                const { data: ord } = await api.get(`/orders/${paidId}/summary`);
                if (ord) {
                    setOrderData({
                        orderId: paidId,
                        email:   ord.email || "",
                        items:   ord.items || [],
                        subtotal: ord.total || 0, shipping: 0,
                        total:   ord.total || 0,
                        payMethod: "razorpay",
                    });
                }
            } catch { /* keep minimal success screen */ }
            window.history.replaceState({}, "", "/checkout");
        })();
    }, [clearCart]);

    if (cartItems.length === 0 && !orderData) {
        return (
            <MarketplaceLayout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <ShoppingBag size={48} style={{ color: "#E8E4DF" }} />
                    <p className="text-sm" style={{ color: "#9B8B7A" }}>Your cart is empty.</p>
                    <Link to="/marketplace"
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                        style={{ backgroundColor: "#1a1a1a" }}>
                        Shop Now
                    </Link>
                </div>
            </MarketplaceLayout>
        );
    }

    if (orderData) {
        return (
            <MarketplaceLayout>
                <Confirmation order={orderData} formatPrice={formatPrice} navigate={navigate} />
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout>
            <div style={{ backgroundColor: "#FAF9F6", minHeight: "100vh" }}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">

                    {/* Page title */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }} className="mb-8">
                        <h1 className="font-serif text-4xl md:text-5xl mb-1"
                            style={{ color: "#1a1a1a", fontWeight: 400 }}>Checkout</h1>
                        <p className="text-sm" style={{ color: "#9B8B7A" }}>
                            Almost there — secure, encrypted, and worldwide.
                        </p>
                    </motion.div>

                    <form onSubmit={handlePlaceOrder}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-col-reverse lg:flex-row">

                            {/* ── LEFT: Form ── */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Shipping card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.05 }}
                                    className="bg-white rounded-2xl border p-7"
                                    style={{ borderColor: "#E8E4DF", boxShadow: "0 2px 12px rgba(44,36,27,0.05)" }}>

                                    <h2 className="flex items-center gap-2 text-base font-bold mb-6" style={{ color: "#1a1a1a" }}>
                                        <MapPin size={15} style={{ color: "#C9A84C" }} />
                                        Shipping Information
                                    </h2>

                                    {/* Row 1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-5">
                                        <div>
                                            <label className={lbl} style={{ color: "#9B8B7A" }}>Full Name <span style={{ color: "#8B3A3A" }}>*</span></label>
                                            <input className={inp} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Admin" required />
                                        </div>
                                        <div>
                                            <label className={lbl} style={{ color: "#9B8B7A" }}>Email <span style={{ color: "#8B3A3A" }}>*</span></label>
                                            <input className={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="admin@shoplivebharat.com" required />
                                        </div>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-5">
                                        <div>
                                            <label className={lbl} style={{ color: "#9B8B7A" }}>Phone</label>
                                            <PhoneInput
                                                className={inp}
                                                value={form.phone}
                                                onChange={(full, meta) => { set("phone", full); setPhoneValid(meta.valid || full === ""); }}
                                            />
                                            {form.phone && !phoneValid && (
                                                <p className="text-[11px] mt-1" style={{ color: "#C0392B" }}>Enter a valid phone number.</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={lbl} style={{ color: "#9B8B7A" }}>Country</label>
                                            <select className={inp + " bg-white cursor-pointer"} value={form.country} onChange={e => set("country", e.target.value)}>
                                                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="mb-5">
                                        <label className={lbl} style={{ color: "#9B8B7A" }}>Address <span style={{ color: "#8B3A3A" }}>*</span></label>
                                        <AddressAutocomplete
                                            className={inp}
                                            value={form.address}
                                            onChange={v => set("address", v)}
                                            onSelect={a => {
                                                if (a.address) set("address", a.address);
                                                if (a.city) set("city", a.city);
                                                if (a.state) set("state", a.state);
                                                if (a.pincode) set("zip", a.pincode);
                                            }}
                                            placeholder="Start typing your address…"
                                            inputProps={{ required: true }}
                                        />
                                    </div>

                                    {/* Row 3 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-5">
                                        <div>
                                            <label className={lbl} style={{ color: "#9B8B7A" }}>City</label>
                                            <input className={inp} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Mumbai" />
                                        </div>
                                        <div>
                                            <label className={lbl} style={{ color: "#9B8B7A" }}>State / Region</label>
                                            <input className={inp} value={form.state} onChange={e => set("state", e.target.value)} placeholder="Maharashtra" />
                                        </div>
                                    </div>

                                    {/* Row 4 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                        <div>
                                            <label className={lbl} style={{ color: "#9B8B7A" }}>ZIP / Postal Code</label>
                                            <input className={inp} value={form.zip} onChange={e => set("zip", e.target.value)} placeholder="400001" />
                                        </div>
                                        <div>
                                            <label className={lbl} style={{ color: "#9B8B7A" }}>Currency</label>
                                            <select className={inp + " bg-white cursor-pointer"} value={currency} onChange={e => setCurrency(e.target.value)}>
                                                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Size Profile card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.08 }}>
                                    <SizeProfileSelector onSelectionChange={setSelectedSizeProfileId} />
                                </motion.div>

                                {/* Payment card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="bg-white rounded-2xl border p-7"
                                    style={{ borderColor: "#E8E4DF", boxShadow: "0 2px 12px rgba(44,36,27,0.05)" }}>

                                    <h2 className="flex items-center gap-2 text-base font-bold mb-6" style={{ color: "#1a1a1a" }}>
                                        <CreditCard size={15} style={{ color: "#C9A84C" }} />
                                        Payment Method
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {PAY_METHODS.map(pm => (
                                            <PayMethod
                                                key={pm.id}
                                                id={pm.id}
                                                title={pm.title}
                                                sub={pm.sub}
                                                selected={payMethod === pm.id}
                                                onClick={() => setPayMethod(pm.id)}
                                            />
                                        ))}
                                    </div>

                                    {/* Secure note */}
                                    <p className="flex items-center gap-1.5 text-xs mt-5" style={{ color: "#9B8B7A" }}>
                                        <span>🔒</span>
                                        All transactions are 256-bit SSL encrypted. We never store card details.
                                    </p>
                                </motion.div>
                            </div>

                            {/* ── RIGHT: Order summary ── */}
                            <motion.div
                                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.45, delay: 0.15 }}>
                                <GlassCard className="lg:sticky lg:top-24 p-6">

                                <h2 className="font-bold text-base mb-5" style={{ color: "#1a1a1a" }}>Order Summary</h2>

                                {/* Cart items */}
                                <div className="space-y-4 mb-5 pb-5 border-b" style={{ borderColor: "#F0EBE3" }}>
                                    {cartItems.map(item => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <div className="relative flex-shrink-0">
                                                <motion.div
                                                    whileHover={{ width: 80, height: 96 }}
                                                    style={{ width: 48, height: 56 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex-shrink-0">
                                                    <img src={item.image_url} alt={item.name}
                                                        className="w-full h-full rounded-lg object-cover"
                                                        style={{ backgroundColor: "#F0EBE3" }}
                                                        onError={e => { e.target.src = "https://images.unsplash.com/photo-1619516388835-2b60acc4049e?w=80&q=60"; }} />
                                                </motion.div>
                                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                                                    style={{ backgroundColor: "#9B8B7A" }}>
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium line-clamp-2 leading-tight" style={{ color: "#1a1a1a" }}>
                                                    {item.name}
                                                </p>
                                                {item.size && (
                                                    <p className="text-[10px] mt-0.5" style={{ color: "#9B8B7A" }}>Size: {item.size}</p>
                                                )}
                                            </div>
                                            <p className="text-xs font-semibold flex-shrink-0" style={{ color: "#1a1a1a" }}>
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Coupon field */}
                                <div className="mb-5">
                                    <CouponField onCouponApply={setCouponDiscount} cartSubtotal={subtotal} />
                                </div>

                                {/* Totals */}
                                <div className="space-y-2.5 mb-5 pb-5 border-b text-sm" style={{ borderColor: "#F0EBE3" }}>
                                    <div className="flex justify-between" style={{ color: "#4A3F35" }}>
                                        <span>Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between" style={{ color: "#4A3F35" }}>
                                        <span>Shipping{shippingQuote?.country && shippingQuote.country !== "India" ? ` to ${shippingQuote.country}` : ""}</span>
                                        <span style={{ color: shipping === 0 ? "#2D7A3A" : "#4A3F35" }}>
                                            {shippingLoading ? "Calculating…" : shipping === 0 ? "FREE" : formatPrice(shipping)}
                                        </span>
                                    </div>
                                    <AnimatePresence>
                                        {!shippingLoading && shippingQuote?.weight_grams > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -16 }}
                                                className="text-[11px] font-medium" style={{ color: "#9B8B7A" }}>
                                                Based on {(shippingQuote.weight_grams / 1000).toFixed(2)} kg total weight
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {discount > 0 && (
                                        <div className="flex justify-between" style={{ color: "#2D7A3A" }}>
                                            <span>Discount</span>
                                            <span>−{formatPrice(discount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between font-bold text-base mb-3" style={{ color: "#1a1a1a" }}>
                                    <span>Total</span>
                                    <motion.span
                                        key={total}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        {formatPrice(total)}
                                    </motion.span>
                                </div>

                                {/* Estimated delivery */}
                                <p className="text-xs mb-5" style={{ color: "#9B8B7A" }}>
                                    Estimated delivery: <span style={{ color: "#4A3F35", fontWeight: 500 }}>{deliveryRange}</span>
                                </p>

                                {/* CTA */}
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: loading ? 1 : 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
                                    style={{ backgroundColor: "#C9A84C", color: "white" }}>
                                    {loading
                                        ? <><Loader size={15} className="animate-spin" /> Processing…</>
                                        : <><span>📦</span> Place Order Securely</>
                                    }
                                </motion.button>

                                {/* Trust */}
                                <p className="text-center text-xs mt-3" style={{ color: "#9B8B7A" }}>
                                    🔒 Secure &nbsp;·&nbsp; ✈️ Worldwide &nbsp;·&nbsp; ✓ Authenticated
                                </p>

                                {/* Trust badge row */}
                                <TrustBadgeRow />

                                </GlassCard>
                            </motion.div>
                        </div>
                    </form>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
