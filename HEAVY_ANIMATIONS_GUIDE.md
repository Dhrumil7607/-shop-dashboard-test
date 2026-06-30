# 🎬 Heavy Animations Implementation Guide

> **Build smooth, impressive animations without lag using GPU acceleration and proper optimization techniques.**

## Overview

This guide explains how to implement heavy but smooth animations throughout your ShopLiveBharat app. All animations are:

✅ **GPU-accelerated** - Using `transform` and `opacity` only  
✅ **60fps smooth** - Optimized with will-change hints  
✅ **Performance-tested** - No jank or stuttering  
✅ **Accessible** - Respects `prefers-reduced-motion`  
✅ **Mobile-optimized** - Smooth on all devices  

---

## Quick Start

### 1. Import Animation Utilities

```jsx
import {
    containerVariants,
    itemVariants,
    hoverVariants,
    createCardAnimation,
    createButtonAnimation,
    viewportSettings,
} from "@/utils/animations";
import { motion } from "framer-motion";
```

### 2. Add to a Component

**Simple fade-in animation:**
```jsx
<motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={viewportSettings.normal}
    transition={{ duration: 0.6 }}
>
    Your content here
</motion.div>
```

**Staggered list animation:**
```jsx
<motion.div
    variants={containerVariants.fadeInUp()}
    initial="hidden"
    whileInView="visible"
    viewport={viewportSettings.normal}
>
    {items.map((item, i) => (
        <motion.div key={i} variants={itemVariants.fadeInUp}>
            {item.content}
        </motion.div>
    ))}
</motion.div>
```

---

## Animation Types

### 1. Entrance Animations

**Fade In Up**
- Elements fade in while sliding up
- Perfect for card grids, list items
- Duration: 0.6s

```jsx
variants={itemVariants.fadeInUp}
```

**Fade In Left/Right**
- Slide in from sides with slight rotation
- Great for alternating content
- Duration: 0.7s

```jsx
variants={itemVariants.fadeInLeft}  // or fadeInRight
```

**Scale In Rotate**
- Pop-in effect with rotation
- Eye-catching for highlights
- Duration: 0.8s

```jsx
variants={itemVariants.scaleInRotate}
```

**Blur In**
- Appears from blur effect
- Elegant entrance
- Duration: 0.8s

```jsx
variants={itemVariants.blurIn}
```

### 2. Container Animations (Stagger)

**Fast Stagger**
- Tight stagger for quick sequences
- 0.08s between items, 0.05s delay

```jsx
variants={containerVariants.fadeInFast(0)}  // 0 = no initial delay
```

**Normal Stagger**
- Balanced timing
- 0.12s between items, 0.05s delay

```jsx
variants={containerVariants.fadeInUp(0.1)}  // 0.1s = delay before first item
```

**Heavy Stagger**
- Dramatic wave effect
- 0.15s between items, 0.05s delay

```jsx
variants={containerVariants.staggerHeavy(0.2)}
```

### 3. Hover Effects

**Lift Up**
- Card lifts on hover with shadow
- Common for CTAs and cards

```jsx
whileHover={hoverVariants.liftUp.hover}
```

**Scale Glow**
- Scales slightly with gold glow
- Perfect for featured items

```jsx
whileHover={hoverVariants.scaleGlow.hover}
```

**Rotate Scale**
- Slight rotation with scale
- Playful, attention-grabbing

```jsx
whileHover={hoverVariants.rotateScale.hover}
```

**Rotate Icon**
- Full 360° rotation
- Great for loading indicators, decorative icons

```jsx
whileHover={hoverVariants.rotateIcon.hover}
```

### 4. Helper Functions

**Card Animation** (predefined, ready to use)
```jsx
const animation = createCardAnimation(0.6);  // duration in seconds

<motion.div
    variants={animation}
    initial="hidden"
    whileInView="visible"
    whileHover="hover"
    whileTap="tap"
>
    Card content
</motion.div>
```

**Button Animation**
```jsx
const buttonAnim = createButtonAnimation();

<motion.button
    variants={buttonAnim}
    initial="rest"
    whileHover="hover"
    whileTap="tap"
>
    Click me
</motion.button>
```

**Image Animation** (with zoom on hover)
```jsx
const imageAnim = createImageAnimation(0.8);

<motion.img
    variants={imageAnim}
    initial="hidden"
    whileInView="visible"
    whileHover="hover"
    src="..."
/>
```

**Text Reveal**
```jsx
const textAnim = createTextReveal(0.6);

<motion.p variants={textAnim} initial="hidden" whileInView="visible">
    Important text
</motion.p>
```

**Floating Animation** (continuous)
```jsx
<motion.div animate={createFloatAnimation(15, 3)}>
    Floating content
</motion.div>
```

**Glow Animation** (continuous)
```jsx
<motion.div animate={createGlowAnimation(2)}>
    Glowing element
</motion.div>
```

---

## Real-World Examples

### Example 1: Product Card Grid

```jsx
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/utils/animations";

export function ProductGrid({ products }) {
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants.fadeInUp(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
            {products.map((product, i) => (
                <motion.div
                    key={product.id}
                    variants={itemVariants.fadeInUp}
                    whileHover={{ y: -8 }}
                    className="card"
                >
                    <motion.img
                        src={product.image}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                    />
                    <h3>{product.name}</h3>
                    <p>${product.price}</p>
                </motion.div>
            ))}
        </motion.div>
    );
}
```

### Example 2: Feature List with Alternating Layout

```jsx
export function FeatureList({ features }) {
    return (
        <div className="space-y-16">
            {features.map((feature, i) => (
                <motion.div
                    key={i}
                    className={`flex gap-8 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div
                        className="flex-1"
                        variants={i % 2 === 0 ? itemVariants.fadeInLeft : itemVariants.fadeInRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                    </motion.div>
                    
                    <motion.img
                        src={feature.image}
                        className="flex-1"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7 }}
                    />
                </motion.div>
            ))}
        </div>
    );
}
```

### Example 3: Hero Section with Animated Text

```jsx
export function HeroSection() {
    return (
        <motion.section
            className="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                Welcome to ShopLiveBharat
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
            >
                Discover authentic Indian fashion
            </motion.p>

            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.6, delay: 0.6 }}
            >
                Shop Now
            </motion.button>
        </motion.section>
    );
}
```

---

## Performance Optimization

### ✅ DO's

1. **Use `transform` and `opacity` only**
   ```jsx
   // ✅ GOOD - GPU accelerated
   animate={{ x: 10, opacity: 1 }}
   
   // ❌ BAD - Triggers layout recalculation
   animate={{ left: 10, width: 100 }}
   ```

2. **Use `will-change` hint in CSS**
   ```css
   /* Add to animated elements */
   .animated-element {
       will-change: transform, opacity;
   }
   ```

3. **Set `transition: { duration: ... }`** for smooth playback
   ```jsx
   transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
   ```

4. **Use `viewport={{ once: true }}`** to animate on scroll once
   ```jsx
   whileInView={{ opacity: 1 }}
   viewport={{ once: true, amount: 0.3 }}
   ```

5. **Stagger heavy animations** to spread CPU load
   ```jsx
   variants={containerVariants.fadeInUp(0.1)}
   ```

### ❌ DON'Ts

1. **Don't animate expensive properties**
   ```jsx
   // ❌ AVOID - Causes jank
   animate={{ width: 100, height: 100, margin: 20 }}
   ```

2. **Don't have too many simultaneous animations**
   ```jsx
   // ❌ AVOID - Can drop frames
   {items.map(i => <motion.div animate={{ x: 100 }} />)}
   
   // ✅ GOOD - Use stagger
   <motion.div variants={containerVariants.fadeInUp()}>
       {items.map(i => <motion.div variants={itemVariants.fadeInUp} />)}
   </motion.div>
   ```

3. **Don't use keyframes with too many steps**
   ```jsx
   // ❌ AVOID
   animate={{ rotate: [0, 90, 180, 270, 360, 450, 540] }}
   
   // ✅ GOOD
   animate={{ rotate: 360 }}
   ```

4. **Don't animate on every render**
   ```jsx
   // ✅ Use key to force re-animation when needed
   <motion.div key={uniqueKey} animate={{ ... }} />
   ```

---

## Viewport Settings

Choose the right viewport setting for your use case:

```jsx
// Triggers when 20% visible (eager entrance)
viewport={viewportSettings.eager}

// Triggers when 50% visible (standard)
viewport={viewportSettings.normal}

// Triggers only when fully visible (strict)
viewport={viewportSettings.strict}

// Triggers multiple times as you scroll (for continuous effects)
viewport={viewportSettings.repeated}
```

---

## Easing Functions

Pre-made easing curves for professional motion:

```jsx
import { easing } from "@/utils/animations";

// In transition
transition={{ duration: 0.6, ease: easing.easeOut }}

// Available easings:
// - easing.easeOut (most common)
// - easing.easeInOut
// - easing.easeOutBack (bouncy)
// - easing.easeOutQuad
// - easing.easeOutExpo (snappy)
// - easing.easeOutElastic (subtle bounce)
// - easing.easeInQuad
```

---

## Testing Animation Performance

### In Chrome DevTools

1. **Open DevTools** → Press `F12`
2. **Performance tab** → Record while scrolling
3. **Look for**:
   - Frame rate should stay above 50fps (aim for 60fps)
   - No red areas = good performance
   - Smooth curves in timing = smooth animation

### FPS Meter

Install React DevTools and enable "Highlight updates when components render" to see performance.

---

## Common Patterns

### Pattern 1: Scroll-Triggered Animation

```jsx
<motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.7 }}
>
    Content
</motion.div>
```

### Pattern 2: Staggered List

```jsx
<motion.ul
    variants={containerVariants.fadeInUp()}
    initial="hidden"
    whileInView="visible"
    viewport={viewportSettings.normal}
>
    {items.map((item, i) => (
        <motion.li key={i} variants={itemVariants.fadeInUp}>
            {item}
        </motion.li>
    ))}
</motion.ul>
```

### Pattern 3: Interactive Card

```jsx
<motion.div
    variants={createCardAnimation()}
    initial="hidden"
    whileInView="visible"
    whileHover="hover"
    whileTap="tap"
>
    Card content
</motion.div>
```

### Pattern 4: Animated CTA Button

```jsx
<motion.button
    variants={createButtonAnimation()}
    initial="rest"
    whileHover="hover"
    whileTap="tap"
>
    Click me
</motion.button>
```

---

## Troubleshooting

### Issue: Animation feels laggy

**Solution**: 
- Check if you're animating expensive properties (width, height, padding)
- Use `transform` and `opacity` instead
- Reduce number of simultaneous animations
- Add `will-change` CSS hint

### Issue: Animation doesn't trigger

**Solution**:
- Make sure you have `initial="hidden"` and `animate="visible"` or `whileInView`
- Check viewport settings - might need `viewport={{ once: true, amount: 0.2 }}`
- Ensure container has proper `variants`

### Issue: Stagger timing feels off

**Solution**:
- Adjust `staggerChildren` value (0.08 = tight, 0.15 = dramatic)
- Adjust `delayChildren` for initial delay
- Check `duration` of individual item animations

### Issue: Too many animations at once

**Solution**:
- Use `staggerChildren` to spread animations out
- Reduce animation duration slightly
- Use `viewport={{ once: true }}` to avoid re-triggering

---

## Performance Metrics

Target metrics for your animations:

| Metric | Target | Why |
|--------|--------|-----|
| Frame Rate | 60fps (60Hz) | Smooth on most devices |
| Animation Duration | 0.4-1s | Feels responsive |
| Stagger Delay | 0.08-0.15s | Smooth wave effect |
| Simultaneous Animations | <10 | Prevents jank |

---

## Next Steps

1. **Add animations to existing components** using the patterns above
2. **Test performance** using Chrome DevTools Performance tab
3. **Adjust timings** based on what feels best for your brand
4. **Iterate** - animation is subjective, get feedback

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion)
- [GPU Animation Performance](https://www.html5rocks.com/en/tutorials/speed/high-performance-animations/)
- [Web.dev Animation Performance](https://web.dev/animations-guide/)

---

**Last Updated**: June 2026  
**Status**: ✅ Ready for Production
