# 🎨 Micro-Animations Quick Reference

> Fast lookup guide for implementing animations across ShopLiveBharat

---

## 📦 Import All You Need

```jsx
import { motion, AnimatePresence } from "framer-motion";
import * as microAnims from "@/utils/microAnimations";

// All micro-animations are available via microAnims object
```

---

## 🛒 Add to Cart Animation

```jsx
import { AddToCartButton } from "@/components/MicroAnimations/AddToCartAnimation";

<AddToCartButton 
    product={product}
    onAddComplete={() => console.log("Added!")}
/>
```

**What it does:**
- ✨ Product card lifts
- 🎯 Mini thumbnail flies to cart
- 💫 Cart icon bounces
- 🍞 Toast with sparkles
- ✓ Button confirms for 1s

---

## ❤️ Wishlist Animation

```jsx
import { WishlistHeartButton } from "@/components/MicroAnimations/WishlistAnimation";

<WishlistHeartButton 
    isWishlisted={wishlist.includes(productId)}
    onToggle={(id) => toggleWishlist(id)}
    productId={product.id}
/>
```

**What it does:**
- 💖 Heart fills smoothly
- 💕 Tiny hearts burst out
- 🌟 Toast shows "Saved to wishlist"

---

## 🎴 Product Card Hover

```jsx
import { ProductCard } from "@/components/MicroAnimations/ProductCardAnimation";

<ProductCard
    product={product}
    onViewDetails={handleView}
    onAddCart={handleCart}
    onWishlist={handleWish}
/>
```

**What it does:**
- 📈 Card lifts up
- 🖼️ Second image fades in
- 🔘 Buttons appear
- ✨ Premium shadow effect

---

## ⏳ Loading States

```jsx
// Full page
import { LoadingAnimation } from "@/components/MicroAnimations/LoadingAnimation";
<LoadingAnimation text="Searching..." />

// Inline spinner
import { InlineLoadingSpinner } from "@/components/MicroAnimations/LoadingAnimation";
<InlineLoadingSpinner size={24} showText={false} />

// Overlay
import { LoadingOverlay } from "@/components/MicroAnimations/LoadingAnimation";
<LoadingOverlay isOpen={isLoading} text="Processing..." />
```

---

## 📭 Empty States

```jsx
import {
    EmptyCartState,
    EmptyWishlistState,
    NoProductsFoundState,
} from "@/components/MicroAnimations/EmptyStatesAnimation";

// Cart empty
{cart.length === 0 && <EmptyCartState onStartShopping={handleShop} />}

// Wishlist empty
{wishlist.length === 0 && <EmptyWishlistState />}

// No search results
{results.length === 0 && (
    <NoProductsFoundState 
        searchTerm={query}
        onClearSearch={clearQuery}
    />
)}
```

---

## 🛒 Cart Animations

```jsx
import { CartItemWithAnimation } from "@/components/MicroAnimations/CartAnimations";

<CartItemWithAnimation
    item={cartItem}
    onQuantityChange={handleQtyChange}
    onRemove={handleRemove}
    onUndo={handleUndo}
/>
```

**Features:**
- ➕➖ Quantity pops when changing
- 💰 Price counts up smoothly
- 🗑️ Item slides out when removed
- ↩️ 5-second undo option

---

## Quick Animation Recipes

### Simple Fade In

```jsx
<motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
>
    Content
</motion.div>
```

### Slide Up + Fade

```jsx
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
>
    Content
</motion.div>
```

### Scale Pop

```jsx
<motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
    }}
>
    Content
</motion.div>
```

### Bounce on Hover

```jsx
<motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.2 }}
>
    Click me
</motion.button>
```

### Floating Animation

```jsx
<motion.div
    animate={{ y: [0, -15, 0] }}
    transition={{
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
    }}
>
    Floating
</motion.div>
```

### Rotating Spinner

```jsx
<motion.div
    animate={{ rotate: 360 }}
    transition={{
        duration: 2,
        ease: "linear",
        repeat: Infinity,
    }}
>
    ⚙️
</motion.div>
```

### Staggered List

```jsx
<motion.ul
    variants={{
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    }}
    initial="hidden"
    animate="visible"
>
    {items.map((item) => (
        <motion.li
            key={item.id}
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
            }}
        >
            {item.name}
        </motion.li>
    ))}
</motion.ul>
```

### Toast Notification

```jsx
<AnimatePresence>
    {showToast && (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 right-4 ..."
        >
            Success! ✨
        </motion.div>
    )}
</AnimatePresence>
```

### Scroll-Triggered Animation

```jsx
<motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
>
    Appears when scrolled into view
</motion.div>
```

---

## 🎨 Commonly Used Timings

| Effect | Duration | Best For |
|--------|----------|----------|
| Toast Pop | 0.2-0.3s | Add to cart, wishlist |
| Hover | 0.2-0.3s | Buttons, cards |
| Page Transition | 0.4-0.6s | Screen changes |
| Heavy Animation | 0.6-0.8s | Page sections |
| Scroll Entrance | 0.6-0.8s | Hero sections |
| Loading | 1-2s loop | Spinners |
| Festival | 2-4s loop | Diyas, floating items |

---

## 🎯 Easing Presets

```jsx
// Smooth exit
ease: [0.23, 1, 0.32, 1]

// Bouncy pop
type: "spring", stiffness: 200, damping: 20

// Linear (for rotations)
ease: "linear"

// Ease out (recommended for most)
ease: "easeOut"
```

---

## 📱 Mobile Optimization

```jsx
// Reduce motion on mobile
const isMobile = window.innerWidth < 768;

<motion.div
    animate={isMobile ? { scale: 1 } : { scale: 1.05 }}
    transition={{ duration: isMobile ? 0 : 0.3 }}
>
    Content
</motion.div>
```

---

## ⚡ Performance Checklist

- [ ] Using transform/opacity only
- [ ] Duration under 1 second
- [ ] Max 5-10 simultaneous animations
- [ ] Viewport `once: true` for scroll
- [ ] No memory leaks (cleanup)
- [ ] Respects `prefers-reduced-motion`
- [ ] 60fps on mobile devices

---

## 🔧 Common Gotchas

### Issue: Animation doesn't trigger

**Solution:**
```jsx
// Use key to force re-animation
<motion.div key={uniqueKey} animate={{ ... }} />

// Or use whileInView
<motion.div whileInView={{ ... }} viewport={{ once: true }} />
```

### Issue: Lag on mobile

**Solution:**
```jsx
// Reduce complexity
animate={{ scale: 1.05 }}  // ✅ Good
animate={{ rotate: 360, scale: 1.05 }}  // Too much
```

### Issue: Stagger timing feels off

**Solution:**
```jsx
// Adjust stagger delay
transition: { staggerChildren: 0.08 }  // Tighter
transition: { staggerChildren: 0.15 }  // More dramatic
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `microAnimations.js` | All animation definitions |
| `AddToCartAnimation.jsx` | Add to cart flows |
| `WishlistAnimation.jsx` | Heart/wishlist interactions |
| `ProductCardAnimation.jsx` | Product card hover |
| `LoadingAnimation.jsx` | Loading states |
| `EmptyStatesAnimation.jsx` | Empty state screens |
| `CartAnimations.jsx` | Cart page interactions |

---

## 🚀 Quick Start Template

```jsx
import { motion } from "framer-motion";

export function MyComponent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            Your content
        </motion.div>
    );
}
```

---

## 🎉 Festival Mode

```jsx
import { floatingDecoration, diyaFlicker } from "@/utils/microAnimations";

// Diwali
{isDiwali && (
    <motion.div animate={diyaFlicker.animate}>
        🪔
    </motion.div>
)}

// Rakhi
{isRakhiSeason && (
    <motion.div animate={rakhiSwing.animate}>
        🎀
    </motion.div>
)}
```

---

## 💡 Pro Tips

1. **Use `duration: 0.3-0.6s`** - Feels snappy but not rushed
2. **Spring physics** - Use for playful pops: `type: "spring"`
3. **Stagger** - Spreads animations for better UX
4. **viewport: { once: true }** - Prevent re-triggering on scroll
5. **key prop** - Forces re-animation when needed
6. **AnimatePresence** - For exit animations on unmount
7. **Transition delay** - Add `delay: 0.2` for sequenced effects

---

**Last Updated:** June 2026  
**Quick Reference Version:** 1.0
