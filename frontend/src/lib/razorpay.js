/**
 * Razorpay Payment Integration
 * Handles all Razorpay payment operations
 */

// Initialize Razorpay script
export const initRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

// Create Razorpay order
export const createRazorpayOrder = async (amount, currency = "INR", orderId = null) => {
    try {
        const response = await fetch("/api/razorpay/order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100), // Convert to paise
                currency,
                orderId,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to create order");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        throw error;
    }
};

// Handle Razorpay payment
export const handleRazorpayPayment = async (options) => {
    const {
        orderId,
        amount,
        currency = "INR",
        customerName,
        customerEmail,
        customerPhone,
        onSuccess,
        onError,
    } = options;

    try {
        await initRazorpay();

        const orderData = await createRazorpayOrder(amount, currency, orderId);

        const razorpayOptions = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_1DP5MMOk9HrPPG",
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.id,
            name: "ShopLiveBharat",
            description: `Order ${orderId || ""}`,
            image: "/shoplivebharat-logo.png",
            prefill: {
                name: customerName || "",
                email: customerEmail || "",
                contact: customerPhone || "",
            },
            theme: {
                color: "#8B4513", // Maroon color
            },
            handler: async (response) => {
                try {
                    // Verify payment
                    const verifyResponse = await fetch("/api/razorpay/verify", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                        }),
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyData.success) {
                        onSuccess && onSuccess(response);
                    } else {
                        onError && onError(new Error("Payment verification failed"));
                    }
                } catch (error) {
                    onError && onError(error);
                }
            },
            modal: {
                ondismiss: () => {
                    onError && onError(new Error("Payment cancelled"));
                },
            },
        };

        const rzp = new window.Razorpay(razorpayOptions);
        rzp.open();
    } catch (error) {
        console.error("Error initializing Razorpay:", error);
        onError && onError(error);
    }
};

// Process payment for cart
export const processCheckoutPayment = async (cartItems, totalAmount, customerInfo, onSuccess, onError) => {
    try {
        const orderId = `ORDER_${Date.now()}`;

        await handleRazorpayPayment({
            orderId,
            amount: totalAmount,
            currency: "INR",
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            onSuccess: (response) => {
                onSuccess({
                    orderId,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    amount: totalAmount,
                    items: cartItems,
                    customer: customerInfo,
                });
            },
            onError,
        });
    } catch (error) {
        onError(error);
    }
};

// Get Razorpay configuration
export const getRazorpayConfig = () => {
    return {
        keyId: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_1DP5MMOk9HrPPG",
        merchantName: "ShopLiveBharat",
        merchantLogo: "/shoplivebharat-logo.png",
        theme: {
            color: "#8B4513",
        },
    };
};
