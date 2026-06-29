import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import MarketplaceLayout from "@/layouts/MarketplaceLayout";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { handleRazorpayPayment } from "@/lib/razorpay";
import { setMetaTags } from "@/lib/seo";

export default function Checkout() {
    const navigate = useNavigate();
    const { cartItems, getTotalPrice, clearCart } = useCart();
    const { formatPrice } = useCurrency();
    const [step, setStep] = useState("shipping"); // shipping, payment, confirmation
    const [loading, setLoading] = useState(false);
    const [razorpayReady, setRazorpayReady] = useState(false);

    const [formData, setFormData] = useState({
        // Shipping
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
    });

    const [orderData, setOrderData] = useState(null);

    useEffect(() => {
        // Set SEO meta tags for checkout page
        setMetaTags({
            title: "Checkout | Secure Payment | ShopLive Bharat",
            description: "Complete your purchase securely. Fast checkout process with multiple payment options for your luxury fashion items.",
            keywords: "checkout, payment, secure shopping, delivery",
            url: "https://shoplivebharat.com/checkout",
            type: "website",
        });

        // Check if Razorpay script is available
        const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (script) {
            setRazorpayReady(true);
        }
    }, []);

    const subtotal = getTotalPrice();
    const shipping = subtotal > 5000 ? 0 : 299;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    if (cartItems.length === 0) {
        return (
            <MarketplaceLayout>
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <p className="text-center text-espresso/60">Your cart is empty</p>
                </div>
            </MarketplaceLayout>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleShippingSubmit = (e) => {
        e.preventDefault();
        if (!formData.firstName || !formData.email || !formData.address || !formData.city) {
            toast.error("Please fill all required fields");
            return;
        }
        setStep("payment");
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Process payment with Razorpay
            await handleRazorpayPayment({
                orderId: `ORD-${Date.now()}`,
                amount: total,
                currency: "INR",
                customerName: `${formData.firstName} ${formData.lastName}`,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                onSuccess: (response) => {
                    // Payment successful
                    const order = {
                        orderId: `ORD-${Date.now()}`,
                        paymentId: response.razorpay_payment_id,
                        date: new Date().toLocaleDateString(),
                        customerName: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        items: cartItems,
                        subtotal,
                        shipping,
                        tax,
                        total,
                        shippingAddress: {
                            address: formData.address,
                            city: formData.city,
                            state: formData.state,
                            pincode: formData.pincode,
                            country: formData.country,
                        },
                        paymentMethod: "Razorpay",
                        status: "confirmed",
                    };

                    setOrderData(order);
                    clearCart();
                    setStep("confirmation");
                    toast.success("Payment successful! Order confirmed.");
                    setLoading(false);
                },
                onError: (error) => {
                    toast.error(error.message || "Payment failed. Please try again.");
                    setLoading(false);
                },
            });
        } catch (error) {
            toast.error("Payment processing failed. Please try again.");
            setLoading(false);
        }
    };

    if (step === "confirmation" && orderData) {
        return (
            <MarketplaceLayout>
                <div className="max-w-3xl mx-auto px-6 py-12">
                    <div className="text-center mb-12">
                        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                        <h1 className="font-serif text-4xl mb-4 text-espresso">
                            Order Confirmed!
                        </h1>
                        <p className="text-espresso/60 text-lg">
                            Thank you for your purchase. Your order has been confirmed.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-8 border border-line-soft mb-8">
                        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-line-soft">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-maroon mb-2">
                                    Order Number
                                </p>
                                <p className="font-serif text-2xl text-espresso">
                                    {orderData.orderId}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-maroon mb-2">
                                    Order Date
                                </p>
                                <p className="font-serif text-2xl text-espresso">{orderData.date}</p>
                            </div>
                        </div>

                        <h2 className="font-semibold text-lg text-espresso mb-4">Order Summary</h2>
                        <div className="space-y-3 mb-6 pb-6 border-b border-line-soft">
                            {orderData.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-espresso">{item.name}</p>
                                        <p className="text-sm text-espresso/60">
                                            Qty: {item.quantity}
                                        </p>
                                    </div>
                                    <p className="font-medium text-maroon">
                                        {formatPrice(item.price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-espresso">
                                <span>Subtotal</span>
                                <span>{formatPrice(orderData.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-espresso">
                                <span>Shipping</span>
                                <span>
                                    {orderData.shipping === 0
                                        ? "Free"
                                        : formatPrice(orderData.shipping)}
                                </span>
                            </div>
                            <div className="flex justify-between text-espresso">
                                <span>Tax</span>
                                <span>{formatPrice(orderData.tax)}</span>
                            </div>
                            <div className="flex justify-between font-serif text-xl text-maroon">
                                <span>Total</span>
                                <span>{formatPrice(orderData.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
                        <h3 className="font-semibold text-espresso mb-4">Shipping Address</h3>
                        <p className="text-espresso/80">
                            {orderData.shippingAddress.address}
                            <br />
                            {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{" "}
                            {orderData.shippingAddress.pincode}
                            <br />
                            {orderData.shippingAddress.country}
                        </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6 mb-8 border border-green-200">
                        <h3 className="font-semibold text-espresso mb-2">What's Next?</h3>
                        <ul className="text-sm text-espresso/80 space-y-1">
                            <li>✓ Check your email for order confirmation</li>
                            <li>✓ Track your shipment in your account</li>
                            <li>✓ Estimated delivery: 5-7 business days</li>
                        </ul>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate("/marketplace")}
                            className="flex-1 py-3 bg-espresso text-ivory rounded-lg font-medium hover:bg-opacity-90 transition"
                        >
                            Continue Shopping
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="flex-1 py-3 border border-line-soft rounded-lg font-medium hover:bg-gray-50 transition"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    return (
        <MarketplaceLayout>
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <button
                    onClick={() => (step === "payment" ? setStep("shipping") : navigate("/cart"))}
                    className="flex items-center gap-2 text-maroon hover:text-maroon/70 mb-8 transition"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <h1 className="font-serif text-4xl mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        {/* Progress Steps */}
                        <div className="flex items-center gap-4 mb-12 pb-8 border-b border-line-soft">
                            <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                                    step === "shipping" || step === "payment"
                                        ? "bg-maroon text-ivory"
                                        : "bg-green-500 text-white"
                                }`}
                            >
                                {step === "confirmation" ? "✓" : "1"}
                            </div>
                            <span
                                className={`font-medium ${
                                    step === "shipping" ? "text-espresso" : "text-espresso/60"
                                }`}
                            >
                                Shipping
                            </span>

                            <div
                                className={`flex-1 h-0.5 ${
                                    step === "payment" || step === "confirmation"
                                        ? "bg-maroon"
                                        : "bg-gray-300"
                                }`}
                            />

                            <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                                    step === "payment" || step === "confirmation"
                                        ? step === "confirmation"
                                            ? "bg-green-500 text-white"
                                            : "bg-maroon text-ivory"
                                        : "bg-gray-300 text-gray-600"
                                }`}
                            >
                                {step === "confirmation" ? "✓" : "2"}
                            </div>
                            <span
                                className={`font-medium ${
                                    step === "payment" ? "text-espresso" : "text-espresso/60"
                                }`}
                            >
                                Payment
                            </span>
                        </div>

                        {/* Shipping Form */}
                        {step === "shipping" && (
                            <form onSubmit={handleShippingSubmit}>
                                <h2 className="font-semibold text-xl text-espresso mb-6">
                                    Shipping Details
                                </h2>

                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First Name *"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last Name"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email *"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                        required
                                    />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                    />
                                </div>

                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Address *"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none mb-6"
                                    required
                                />

                                <div className="grid grid-cols-3 gap-6 mb-6">
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City *"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="State"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                    />
                                    <input
                                        type="text"
                                        name="pincode"
                                        placeholder="Pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        className="px-4 py-3 border border-line-soft rounded-lg focus:border-maroon outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-espresso text-ivory rounded-lg font-medium hover:bg-opacity-90 transition"
                                >
                                    Continue to Payment
                                </button>
                            </form>
                        )}

                        {/* Payment Form */}
                        {step === "payment" && (
                            <form onSubmit={handlePaymentSubmit}>
                                <h2 className="font-semibold text-xl text-espresso mb-6">
                                    Payment Information
                                </h2>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                                    <p className="text-blue-900 mb-2 font-semibold">Secure Payment</p>
                                    <p className="text-blue-800 text-sm">
                                        We use Razorpay for secure payment processing. Your payment information is 100% secure and encrypted.
                                    </p>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                                    <h3 className="font-semibold text-espresso mb-3">Order Summary</h3>
                                    <div className="space-y-2 text-sm text-espresso/80">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Shipping</span>
                                            <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tax (18%)</span>
                                            <span>{formatPrice(tax)}</span>
                                        </div>
                                        <div className="border-t border-green-200 pt-2 mt-2 flex justify-between font-bold text-espresso">
                                            <span>Total Amount</span>
                                            <span>{formatPrice(total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-maroon text-white rounded-lg font-semibold hover:bg-maroon/90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                                >
                                    {loading && <Loader size={20} className="animate-spin" />}
                                    {loading ? "Processing..." : `Pay ${formatPrice(total)} with Razorpay`}
                                </button>

                                <p className="text-xs text-espresso/60 text-center mt-4">
                                    Click to proceed to secure Razorpay payment gateway
                                </p>
                            </form>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:sticky lg:top-8 h-fit">
                        <div className="bg-gray-50 rounded-lg p-6 border border-line-soft">
                            <h3 className="font-semibold text-lg text-espresso mb-4">
                                Order Summary
                            </h3>

                            <div className="space-y-3 mb-6 pb-6 border-b border-line-soft">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between text-sm"
                                    >
                                        <span className="text-espresso/70">
                                            {item.name} x {item.quantity}
                                        </span>
                                        <span className="text-espresso font-medium">
                                            {formatPrice(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-espresso">
                                    <span className="text-sm">Subtotal</span>
                                    <span className="font-medium">
                                        {formatPrice(subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-espresso">
                                    <span className="text-sm">Shipping</span>
                                    <span className="font-medium">
                                        {shipping === 0 ? "Free" : formatPrice(shipping)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-espresso">
                                    <span className="text-sm">Tax</span>
                                    <span className="font-medium">
                                        {formatPrice(tax)}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-line-soft pt-4">
                                <div className="flex justify-between font-serif text-xl">
                                    <span className="text-espresso">Total</span>
                                    <span className="text-maroon font-bold">
                                        {formatPrice(total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
