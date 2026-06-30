# 🎨 Micro-Animations & Cute Shopping Interactions Guide

> **Premium, smooth, and aesthetic micro-animations that make shopping feel delightful without being childish.**

---

## Overview

This guide explains how to implement charming micro-animations across ShopLiveBharat. Every interaction is:

✨ **Smooth & Minimal** - Fast, purposeful animations (0.3-0.6s)  
🎯 **Premium Aesthetic** - Elegant, not cartoonish  
⚡ **Lightweight** - No performance impact  
📱 **Mobile-Friendly** - Smooth on all devices  
♿ **Accessible** - Respects motion preferences  

---

## Animations by Feature

### 1️⃣ Add to Cart Animation

**What Happens:**
```
User clicks "Add to Cart"
    ↓
Product card lifts slightly (0.3s)
    ↓
Mini thumbnail flies to cart icon (0.6s)
    ↓
Cart icon bounces (0.5s)
    ↓
Toast appears: "Added to your cart ✨"
    ↓
Sparkles pop around toast
    ↓
Button shows "Added ✓" for 1s
```

**Implementation:**

```jsx
import AddToCartButton from "@/components/MicroAnimations/AddToCartAnimation";

function ProductPage() {
    const handleAddCart = (product) => {
        // Add to cart logic
        console.log("Added:", product);
    };

    return (
        <AddToCartButton 
            product={product}
            onAddComplete={handleAddCart}
        />
    );
}
```

**Customization:**

```jsx
// Control animation duration
<motion.div
    animate={isAnimating ? "animate" : "initial"}
    transition={{ duration: 0.5 }}  // Adjust speed
>
    Add to Cart
</motion.div>
```

---

### 2️⃣ Wishlist Animation

**What Happens:**
```
User clicks heart icon
    ↓
Heart fills smoothly (0.4s)
    ↓
Tiny hearts burst out from center (0.5s)
    ↓
Toast appears: "Saved to wishlist ♡"
```

**Implementation:**

```jsx
import { WishlistHeartButton } from "@/components/MicroAnimations/WishlistAnimation";

function ProductCard() {
    const [isWishlisted, setIsWishlisted] = useState(false);

    return (
        <WishlistHeartButton
            isWishlisted={isWishlisted}
            onToggle={() => setIsWishlisted(!isWishlisted)}
            productId={product.id}
        />
    );
}
```

---

### 3️⃣ Product Card Hover Animation

**What Happens:**
```
User hovers on product card
    ↓
Card lifts up (-12px) with scale (1.02x)
    ↓
Shadow becomes soft and premium
    ↓
Secondary product image fades in
    ↓
Buttons fade in from bottom
```

**Implementation:**

```jsx
import { ProductCard } from "@/components/MicroAnimations/ProductCardAnimation";

function ProductGrid({ products }) {
    return (
        <div className="grid grid-cols-3 gap-6">
            {products.map(product => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={handleView}
                    onAddCart={handleAddCart}
                    onWishlist={handleWishlist}
                />
            ))}
        </div>
    );
}
```

---

### 4️⃣ Loading Animation

**What Happens:**
```
Shopping bag icon spins (2s loop)
    ↓
Gold sparkles rotate around it
    ↓
Text pulses: "Bringing India closer…"
```

**Implementation:**

```jsx
import { LoadingAnimation } from "@/components/MicroAnimations/LoadingAnimation";

// Full page loading
<LoadingAnimation text="Searching for outfits…" />

// Inline spinner
import { InlineLoadingSpinner } from "@/components/MicroAnimations/LoadingAnimation";

<InlineLoadingSpinner size={20} showText={true} />

// Loading overlay
import { LoadingOverlay } from "@/components/MicroAnimations/LoadingAnimation";

<LoadingOverlay 
    isOpen={isProcessing}
    text="Processing payment…"
/>
```

---

### 5️⃣ Empty State Animations

**Empty Cart:**
```
Shopping bag floats gently
    ↓
Text appears: "Your cart is waiting for some desi magic ✨"
    ↓
CTA button glows softly
```

**Empty Wishlist:**
```
Heart icon floats
    ↓
Text: "Save your favourite outfits here"
    ↓
Subtle glow on button
```

**No Products Found:**
```
Search icon rotates slowly
    ↓
Helpful message appears
    ↓
Action buttons ready
```

**Implementation:**

```jsx
import {
    EmptyCartState,
    EmptyWishlistState,
    NoProductsFoundState,
} from "@/components/MicroAnimations/EmptyStatesAnimation";

// Empty cart
if (cartItems.length === 0) {
    return <EmptyCartState onStartShopping={() => navigate("/shop")} />;
}

// Empty wishlist
if (wishlistItems.length === 0) {
    return <EmptyWishlistState />;
}

// No search results
if (searchResults.length === 0) {
    return (
        <NoProductsFoundState
            searchTerm={searchQuery}
            onClearSearch={clearSearch}
        />
    );
}
```

---

## Common Patterns

### Pattern 1: Button Animation on Hover

```jsx
<motion.button
    whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 20px rgba(201, 168, 76, 0.2)",
    }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.2 }}
>
    Click me
</motion.button>
```

### Pattern 2: Toast Notification

```jsx
import { motion, AnimatePresence } from "framer-motion";
import { toastAnimation } from "@/utils/microAnimations";

{showToast && (
    <AnimatePresence>
        <motion.div
            {...toastAnimation}
            className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4"
        >
            Successfully added! ✨
        </motion.div>
    </AnimatePresence>
)}
```

### Pattern 3: Floating Animation

```jsx
<motion.div
    animate={{ y: [0, -20, 0] }}
    transition={{
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
    }}
>
    Floating content
</motion.div>
```

### Pattern 4: Staggered List Animation

```jsx
<motion.ul
    variants={{
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
>
    {items.map((item, i) => (
        <motion.li
            key={i}
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
            }}
        >
            {item}
        </motion.li>
    ))}
</motion.ul>
```

---

## Cart Page Animations

### Quantity Change Animation

```jsx
import { motion } from "framer-motion";
import { quantityPop } from "@/utils/microAnimations";

<motion.span
    key={quantity}  // Forces re-animation on change
    variants={quantityPop}
    initial="initial"
    animate="animate"
    className="text-lg font-bold"
>
    {quantity}
</motion.span>
```

### Price Count-Up Animation

```jsx
import { useNumberAnimation } from "@/utils/microAnimations";

function PriceDisplay({ oldPrice, newPrice }) {
    const [displayPrice, setDisplayPrice] = useState(oldPrice);

    useEffect(() => {
        const step = (newPrice - oldPrice) / 60;
        let current = oldPrice;
        
        const interval = setInterval(() => {
            current += step;
            if (current >= newPrice) {
                setDisplayPrice(newPrice);
                clearInterval(interval);
            } else {
                setDisplayPrice(Math.floor(current));
            }
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [oldPrice, newPrice]);

    return <span>${displayPrice}</span>;
}
```

### Remove Item with Undo

```jsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
    {cartItem && (
        <motion.div
            exit={{
                x: 400,
                opacity: 0,
                transition: { duration: 0.3 },
            }}
            key={cartItem.id}
            className="flex items-center gap-4 p-4 bg-white rounded-lg"
        >
            {/* Item content */}
            <button onClick={() => removeItem(cartItem.id)}>
                Remove
            </button>
        </motion.div>
    )}
</AnimatePresence>

{removedItem && (
    <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg"
    >
        <p>Removed from cart. <button>Undo?</button></p>
    </motion.div>
)}
```

---

## Checkout Progress Animation

```jsx
import { motion } from "framer-motion";
import { progressStepGlow, progressBarFill } from "@/utils/microAnimations";

const steps = ["Cart", "Address", "Payment", "Confirmation"];
const currentStep = 2;

<div>
    {/* Progress Bar */}
    <div className="h-1 bg-stone/10 rounded-full overflow-hidden mb-8">
        <motion.div
            className="h-full bg-maroon"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (currentStep + 1) / steps.length }}
            transition={{ duration: 0.6 }}
            style={{ originX: 0 }}
        />
    </div>

    {/* Steps */}
    <div className="flex justify-between">
        {steps.map((step, i) => (
            <motion.div
                key={step}
                className="flex flex-col items-center"
                animate={
                    i < currentStep ? "completed" : i === currentStep ? "active" : "rest"
                }
                variants={{
                    rest: { scale: 1, boxShadow: "0 0 0px rgba(201, 168, 76, 0)" },
                    active: { scale: 1.1, boxShadow: "0 0 15px rgba(201, 168, 76, 0.5)" },
                    completed: { scale: 1, boxShadow: "0 0 0px rgba(201, 168, 76, 0)" },
                }}
                transition={{ duration: 0.3 }}
            >
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${i <= currentStep ? "bg-maroon text-white" : "bg-stone/10 text-stone"}
                `}>
                    {i < currentStep ? "✓" : i + 1}
                </div>
                <p className="text-xs text-stone">{step}</p>
            </motion.div>
        ))}
    </div>
</div>
```

---

## Order Success Animation

```jsx
import { motion, AnimatePresence } from "framer-motion";
import { confettiBurst, checkmarkDraw, orderNumberPop } from "@/utils/microAnimations";

function OrderSuccessScreen({ orderNumber }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-screen gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Confetti */}
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={`confetti-${i}`}
                    className="fixed w-2 h-2 bg-gold rounded-full"
                    style={{
                        left: "50%",
                        top: "50%",
                        marginLeft: -4,
                        marginTop: -4,
                    }}
                    variants={confettiBurst}
                    initial="initial"
                    animate="animate"
                    transition={{
                        delay: i * 0.02,
                    }}
                />
            ))}

            {/* Checkmark */}
            <motion.svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                className="text-maroon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
            >
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                <motion.path
                    d="M30 50 L45 65 L70 35"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={checkmarkDraw}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.5 }}
                />
            </motion.svg>

            {/* Message */}
            <motion.h2
                className="text-2xl font-serif text-espresso"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                Order placed successfully ✨
            </motion.h2>

            {/* Order Number */}
            <motion.div
                className="text-center"
                variants={orderNumberPop}
                initial="initial"
                animate="animate"
            >
                <p className="text-sm text-stone mb-2">Order Number:</p>
                <p className="font-mono font-bold text-lg text-maroon">{orderNumber}</p>
            </motion.div>

            {/* Buttons */}
            <div className="flex gap-4">
                <motion.a
                    href="/orders"
                    className="px-6 py-2 bg-maroon text-white rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Track Order
                </motion.a>
                <motion.a
                    href="/shop"
                    className="px-6 py-2 border border-maroon text-maroon rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Continue Shopping
                </motion.a>
            </div>
        </motion.div>
    );
}
```

---

## Festival Animations

### Diwali Diyas

```jsx
import { motion } from "framer-motion";
import { diyaFlicker, floatingDecoration } from "@/utils/microAnimations";

function DiwaliDiya({ delay }) {
    return (
        <motion.div
            className="fixed pointer-events-none"
            style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
            }}
            animate={diyaFlicker.animate}
            transition={diyaFlicker.transition}
        >
            🪔
        </motion.div>
    );
}

// Use multiple diyas
{festiveMode && (
    <>
        {Array.from({ length: 10 }).map((_, i) => (
            <DiwaliDiya key={i} delay={i * 0.2} />
        ))}
    </>
)}
```

### Rakhi Animation

```jsx
<motion.div
    animate={rakhiSwing.animate}
    transition={rakhiSwing.transition}
    className="text-4xl"
    style={{ transformOrigin: "top center" }}
>
    🎀
</motion.div>
```

### Floating Decorations

```jsx
{festiveDecorations.map((deco, i) => (
    <motion.div
        key={i}
        className="fixed pointer-events-none text-3xl"
        style={{
            left: `${deco.x}%`,
            top: `${deco.y}%`,
        }}
        animate={floatingDecoration(i * 0.2).animate}
        transition={floatingDecoration(i * 0.2).transition}
    >
        {deco.emoji}
    </motion.div>
))}
```

---

## Seller Dashboard Animations

### New Order Pulse

```jsx
import { motion } from "framer-motion";
import { orderCardPulse } from "@/utils/microAnimations";

<motion.div
    className="bg-white p-4 rounded-lg"
    animate={orderCardPulse.animate}
    transition={orderCardPulse.transition}
>
    New Order Details
</motion.div>
```

### Upload Progress

```jsx
<motion.div
    className="h-1 bg-stone/10 rounded-full overflow-hidden"
>
    <motion.div
        className="h-full bg-maroon"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress }}
        transition={{ duration: 0.3 }}
        style={{ originX: 0 }}
    />
</motion.div>
```

### Approval Badges

```jsx
// Pending
<motion.div
    className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-semibold"
    animate={{ backgroundColor: ["rgba(255, 193, 7, 0.1)", "rgba(255, 193, 7, 0.2)"] }}
    transition={{ duration: 2, repeat: Infinity }}
>
    ⏳ Pending
</motion.div>

// Approved
<motion.div
    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold"
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 200 }}
>
    ✓ Approved
</motion.div>

// Rejected
<motion.div
    exit={{ opacity: 0, x: -100 }}
    transition={{ duration: 0.3 }}
    className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold"
>
    ✗ Rejected
</motion.div>
```

---

## Performance Tips

### ✅ DO

1. **Use `will-change` in CSS** for animated elements
   ```css
   .animated-element {
       will-change: transform, opacity;
   }
   ```

2. **Animate only transforms and opacity**
   ```jsx
   // ✅ GOOD
   animate={{ x: 10, opacity: 1 }}
   
   // ❌ AVOID
   animate={{ left: 10, width: 100 }}
   ```

3. **Use `duration: 0.3-0.6s`** for micro-interactions
4. **Keep animations under 1 second** for best feel
5. **Use `once: true` on scroll animations** to prevent re-triggering

### ❌ DON'T

1. **Don't animate layout-affecting properties** (width, height, padding)
2. **Don't have too many simultaneous animations** (max 5-10)
3. **Don't use complex easing** for simple micro-interactions
4. **Don't forget accessibility** - respect `prefers-reduced-motion`

---

## Accessibility

### Respect Motion Preferences

```jsx
import { useReducedMotion } from "framer-motion";

function AnimatedButton() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.button
            animate={{ scale: shouldReduceMotion ? 1 : 1.05 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        >
            Click me
        </motion.button>
    );
}
```

---

## File Structure

```
src/
├── components/
│   └── MicroAnimations/
│       ├── AddToCartAnimation.jsx
│       ├── WishlistAnimation.jsx
│       ├── ProductCardAnimation.jsx
│       ├── LoadingAnimation.jsx
│       └── EmptyStatesAnimation.jsx
├── utils/
│   ├── microAnimations.js       (All animation definitions)
│   └── animations.js            (Heavy animations)
└── pages/
    ├── ProductDetail.jsx         (Uses ProductCard)
    ├── Checkout.jsx             (Uses progress animations)
    ├── Cart.jsx                 (Uses cart animations)
    └── OrderSuccess.jsx         (Uses success animation)
```

---

## Testing Checklist

- [ ] Animations run at 60fps (no jank)
- [ ] Animations feel responsive (<0.6s)
- [ ] Mobile animations are smooth
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No memory leaks (animations cleanup properly)
- [ ] Performance doesn't degrade with multiple animations
- [ ] Animations enhance UX without distraction

---

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 13+)
- Mobile: ✅ Optimized

---

## Related Files

- `microAnimations.js` - All animation definitions
- `animations.js` - Heavy page animations
- Components in `MicroAnimations/` folder
- `HEAVY_ANIMATIONS_GUIDE.md` - Heavy animations guide

---

**Last Updated:** June 2026  
**Status:** ✅ Production Ready
