# Partner Stores - Quick Start Guide 🚀

**For Developers:** Get started with the new Partner Stores page in 5 minutes.

---

## 📁 File Structure

```
src/components/PartnerStores/
├── CategoryShowcase.jsx          ← Category navigation
├── SocialProofSection.jsx        ← Testimonials & stats
├── StickyMobileFilters.jsx       ← Mobile sticky bar
├── HeroSection.jsx               ← Hero + search + stats
├── FilterSidebar.jsx             ← All filters
├── FeaturedStoresSection.jsx     ← Featured/trending
├── StoreCard.jsx                 ← Individual store card
├── StoreGrid.jsx                 ← Grid with animations
├── StoreDetailsPanel.jsx         ← Store details view
├── ProductCard.jsx               ← Product display
├── ProductGrid.jsx               ← Product grid
├── SkeletonComponents.jsx        ← Loading states
├── EmptyState.jsx                ← No results
├── ErrorState.jsx                ← Error display
├── RetryState.jsx                ← Retry UI
├── useStoresData.js              ← Data management hook
└── useIntersectionObserver.js    ← Lazy loading hook

src/pages/
└── PartnerStores.jsx             ← Main page (REFACTORED)
```

---

## 🎯 Component Purpose Quick Reference

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **CategoryShowcase** | Show product categories | Icons, hover effects, filtering |
| **SocialProofSection** | Build trust with testimonials | Stats, reviews, avatars |
| **StickyMobileFilters** | Quick mobile filter access | Sticky bottom bar, badges |
| **HeroSection** | Landing hero with search | Stats, search bar, CTA |
| **FilterSidebar** | All filtering options | 6 filter types, expandable |
| **StoreCard** | Individual store display | Image, badges, stats, CTA |
| **StoreGrid** | Grid of stores with animations | Responsive grid, memoized |
| **StoreDetailsPanel** | Detailed store view | Hero, info, products |

---

## 🔧 Key Hooks & Utilities

### useStoresData Hook
```javascript
import { useStoresData } from "@/components/PartnerStores/useStoresData";

const {
    shops,              // All shops
    filteredShops,      // Filtered shops (by user selections)
    shopProducts,       // Products by shop ID
    loading,            // Loading state
    loadingShops,       // Per-shop loading
    error,              // Error message
    filters,            // Current filters object
    applyFilters,       // Function to update filters
    loadShopProducts,   // Load products for specific shop
    retry,              // Retry failed requests
} = useStoresData();

// Usage:
applyFilters({ search: "Fashion" });      // Search with debounce
applyFilters({ category: "Jewelry" });    // Filter by category
applyFilters({ rating: "4" });            // Min rating
applyFilters({ sort: "trending" });       // Sort option
```

### Filter Options
```javascript
{
    search: "search text",      // Multi-field search
    category: "Fashion",        // Category filter
    rating: "4",               // Min rating (all, 3.5, 4, 4.5)
    location: "Ahmedabad",     // City filter
    verified: true,            // Only verified sellers
    sort: "featured"           // Sort order
}

// Sort options: featured, trending, rating, followers, newest, az
```

---

## 🎨 Styling & Design

### Tailwind Classes
```jsx
// Colors
className="bg-white dark:bg-slate-900"
className="text-espresso dark:text-ivory"
className="border-maroon/10"

// Spacing (8-point grid)
className="p-6 md:p-8 lg:p-12"    // Padding
className="gap-6 md:gap-8"         // Gap between items
className="mb-12 lg:mb-24"         // Bottom margin

// Responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Interactive
className="hover:scale-105 transition-transform duration-300"
className="focus:ring-2 focus:ring-maroon"
```

### Framer Motion
```jsx
import { motion, AnimatePresence } from "framer-motion";

// Simple animation
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
>
    Content
</motion.div>

// Hover effect
<motion.div
    whileHover={{ scale: 1.05, y: -8 }}
    whileTap={{ scale: 0.95 }}
>
    Clickable element
</motion.div>
```

---

## 🔍 Common Tasks

### Add a New Filter
1. Update FilterSidebar.jsx FILTER_OPTIONS
2. Add handler function for new filter
3. Update useStoresData.js filterShops() function
4. Test with real data

```jsx
// In FilterSidebar.jsx
const FILTER_OPTIONS = {
    newFilter: ["Option 1", "Option 2"]  // Add here
};

// In useStoresData.js
if (activeFilters.newFilter !== "all") {
    result = result.filter(shop => shop.newFilter === activeFilters.newFilter);
}
```

### Add New Store Property
1. Update mock data in testData.js
2. Add property to StoreCard display
3. Update StoreDetailsPanel if needed
4. Update useStoresData.js if filtering needed

### Optimize Component Performance
```jsx
// Use React.memo
export const MyComponent = memo(function MyComponent(props) {
    // Component code
}, (prevProps, nextProps) => {
    // Return true if props are equal (skip render)
    return prevProps.id === nextProps.id && 
           prevProps.loading === nextProps.loading;
});
```

---

## 🚀 Development Workflow

### Running Locally
```bash
cd shoplivebharat/frontend
npm install
npm start      # Development server
npm run build  # Production build
```

### Making Changes
1. Edit component in `src/components/PartnerStores/`
2. Hot reload happens automatically
3. Check browser DevTools for errors
4. Test responsive design (F12 → Mobile view)
5. Test dark mode (toggle in UI)
6. Test keyboard navigation (Tab, Arrow keys)

### Testing Filters
1. Open Partner Stores page
2. Try each filter option
3. Combine multiple filters
4. Search for stores
5. Verify results update
6. Check loading skeleton
7. Check error handling

### Testing Mobile
1. DevTools → Mobile view (375px)
2. Test sticky bottom filters
3. Test filter modal
4. Test store details modal
5. Test touch interactions
6. Test notch safe area (if applicable)

---

## 🐛 Debugging Tips

### Check Filter Logic
```javascript
// In browser console:
// Add to PartnerStores.jsx temporarily
console.log("Filters:", filters);
console.log("Filtered shops:", filteredShops);
```

### Debug Performance
```javascript
// React DevTools → Profiler tab
// Record interaction
// Check which components re-rendered
// Look for unnecessary re-renders
```

### Check API Calls
```javascript
// Network tab in DevTools
// Look for API calls to /api/shops
// Check response size
// Verify caching (304 Not Modified)
```

### Test Accessibility
```javascript
// DevTools → Accessibility tab
// Check for warnings/errors
// Use keyboard only to navigate
// Check color contrast (Accessibility Insights extension)
```

---

## 📚 Component API Reference

### HeroSection
```jsx
<HeroSection
    onSearchChange={(value) => {}}    // Search input handler
    onFiltersOpen={() => {}}           // Filter button handler
    totalStores={500}                  // Number of stores
    totalProducts={50000}              // Number of products
/>
```

### FilterSidebar
```jsx
<FilterSidebar
    filters={{}}                      // Current filters
    onFilterChange={(f) => {}}        // Filter change handler
    isOpen={true}                     // Modal open state
    onClose={() => {}}                // Close handler
    isLoading={false}                 // Loading state
/>
```

### StoreGrid
```jsx
<StoreGrid
    stores={[]}                       // Stores to display
    loading={false}                   // Loading state
    error={null}                      // Error message
    onStoreSelect={(s) => {}}         // Click handler
    onRetry={() => {}}                // Retry handler
    skeletonCount={6}                 // Number of skeletons
    favorites={[]}                    // Favorite store IDs
    onFavoriteToggle={(id) => {}}     // Favorite toggle
    showDeliveryInfo={true}           // Show delivery info
/>
```

### StoreDetailsPanel
```jsx
<StoreDetailsPanel
    store={null}                      // Store object
    products={[]}                     // Store products
    onClose={() => {}}                // Close handler
    onProductClick={(p) => {}}        // Product click
    onAddToCart={(p) => {}}           // Add to cart
    loading={false}                   // Loading state
    isMobile={false}                  // Mobile layout
/>
```

---

## ✅ Common Issues & Solutions

### Issue: Search not debouncing
**Solution:** Check DEBOUNCE_DELAY in useStoresData.js is set to 300ms

### Issue: Filters not applying
**Solution:** Verify applyFilters() is being called with correct structure

### Issue: Images not loading
**Solution:** Check image URLs in mock data, verify loading="lazy" attribute

### Issue: Mobile layout broken
**Solution:** Check responsive breakpoints (md:, lg:), verify isMobile flag

### Issue: Animations stuttering
**Solution:** Check DevTools Performance, reduce Framer Motion complexity

### Issue: Dark mode colors wrong
**Solution:** Verify dark: classes match light mode colors, check contrast

### Issue: Keyboard navigation not working
**Solution:** Ensure tabIndex={0}, role="button", onKeyPress handlers

---

## 🔐 Security Considerations

### Input Validation
- Search input sanitized by React
- Filter values from predefined lists
- No user-generated content in filters

### Data Protection
- No sensitive data in localStorage
- Caching only for public data
- API tokens in Authorization header

### XSS Prevention
- React escapes content by default
- No dangerouslySetInnerHTML
- URL parameters validated

---

## 📊 Performance Checklist

- [ ] Components using React.memo
- [ ] useMemo for expensive calculations
- [ ] useCallback for event handlers
- [ ] Images lazy loading
- [ ] API responses cached
- [ ] Search debounced
- [ ] No console errors/warnings
- [ ] Lighthouse score >95
- [ ] Mobile responsive tested
- [ ] Dark mode tested

---

## 🎯 Next Steps for New Developers

1. **Understand Structure** (5 min)
   - Read this file
   - Review component list

2. **Explore Components** (15 min)
   - Open each component file
   - Read JSDoc comments
   - Understand prop structure

3. **Run Locally** (5 min)
   - Clone repo
   - npm install
   - npm start

4. **Test Features** (10 min)
   - Test all filters
   - Test search
   - Test sorting
   - Test responsive design

5. **Make Small Change** (20 min)
   - Add a console.log somewhere
   - Verify hot reload works
   - Test in production build

6. **Deep Dive** (Read in-depth)
   - Read PARTNER_STORES_REDESIGN.md
   - Study useStoresData.js
   - Review Framer Motion patterns

---

## 🆘 Getting Help

### For Questions About:
- **Architecture** → PARTNER_STORES_REDESIGN.md
- **Components** → JSDoc comments in files
- **Performance** → Check useStoresData.js
- **Styling** → Look for similar components
- **Accessibility** → Check ARIA labels in code

### Debug Strategy
1. Open DevTools (F12)
2. Check Console for errors
3. Check Network for API calls
4. Check React DevTools for state
5. Check Performance tab for slow renders

---

## 📝 Useful References

### React
- [React Hooks Documentation](https://react.dev/reference/react)
- [React.memo Documentation](https://react.dev/reference/react/memo)
- [useCallback Hook](https://react.dev/reference/react/useCallback)
- [useMemo Hook](https://react.dev/reference/react/useMemo)

### Framer Motion
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Animation Patterns](https://www.framer.com/motion/animation/)
- [Shared Layout Animation](https://www.framer.com/motion/layout-animations/)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/)
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Dark Mode](https://tailwindcss.com/docs/dark-mode)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Web AIM Color Contrast](https://webaim.org/articles/contrast/)

---

## 🎓 Learn by Example

### Example 1: Add a New Sort Option
```javascript
// In useStoresData.js
const sortMap = {
    featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
    trending: (a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0),
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    // ADD THIS:
    newest_products: (a, b) => (b.productCount || 0) - (a.productCount || 0),
};

// In FilterSidebar.jsx
sortOptions: [
    { value: "featured", label: "Featured" },
    { value: "trending", label: "Trending" },
    { value: "newest", label: "Newest Stores" },
    // ADD THIS:
    { value: "newest_products", label: "Most Products" },
],
```

### Example 2: Add Verification to Store Card
```jsx
// In StoreCard.jsx, already has:
{verified && (
    <div className="flex items-center gap-2 mb-4 text-green-700 ...">
        <CheckCircle size={16} />
        <span className="text-xs font-semibold">Verified Seller</span>
    </div>
)}

// Just make sure it displays - it's already there!
```

### Example 3: Customize Category Colors
```javascript
// In CategoryShowcase.jsx
const categoryColors = {
    "Fashion": "from-pink-500/20 to-rose-500/20",
    "Jewelry": "from-yellow-500/20 to-amber-500/20",
    "Home": "from-blue-500/20 to-cyan-500/20",
    // ADD CUSTOM COLOR:
    "Electronics": "from-purple-500/20 to-indigo-500/20",
};
```

---

## 🏁 Ready to Build?

You now have everything you need to work with the Partner Stores page!

**Next steps:**
1. Run npm start
2. Open http://localhost:3000/partner-stores
3. Play with filters
4. Test on mobile view
5. Read PARTNER_STORES_REDESIGN.md for deep dive

**Happy coding!** 🚀

---

**Quick Reference**
- **Main Page:** src/pages/PartnerStores.jsx
- **Data Hook:** src/components/PartnerStores/useStoresData.js
- **Components:** src/components/PartnerStores/*.jsx
- **Documentation:** PARTNER_STORES_REDESIGN.md
- **API:** src/lib/api.js
- **Mock Data:** src/lib/testData.js
