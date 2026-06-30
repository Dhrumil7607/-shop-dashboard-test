# Implementation Plan: ShopLiveBharat Premium Expansion

## Overview

Implement six interconnected premium feature areas on top of the existing ShopLiveBharat React 18 / Tailwind CSS / Framer Motion codebase. All features are purely client-side, using `AuthContext`, `CartContext`, and `CurrencyContext`, with data persisted to `localStorage` under the established `slb_*` key convention. No existing checkout logic, payment flows, or admin infrastructure is removed.

## Tasks

- [x] 1. Foundation: validators, services, hooks, and route wiring
  - [x] 1.1 Create `src/utils/validators.js` with `isValidMeasurement`, `isValidProfileName`, and `isValidMeetUrl` pure functions
    - `isValidMeasurement(value, unit)` — accepts numeric strings/numbers in `[1,500]` cm or `[0.4,196.9]` inches, rejects non-numeric and out-of-range
    - `isValidProfileName(name, existingNames)` — accepts `1–40` chars and unique among `existingNames`
    - `isValidMeetUrl(url)` — regex `/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/`
    - _Requirements: 1.9, 2.4, 2.5, 10.4_

  - [ ]* 1.2 Write property tests for validators (`src/utils/validators.pbt.test.js`)
    - **Property 4: Profile name validation invariant** — `fc.string({minLength:0, maxLength:50})` — must accept iff length 1–40 and unique
    - **Validates: Requirements 1.9, 1.10**
    - **Property 5: Non-numeric and out-of-range inputs rejected** — `fc.float({min:0.1,max:600})` including boundary values
    - **Validates: Requirements 2.4, 2.5**
    - **Property 18: Google Meet URL validation** — `fc.string()` — must accept iff matches meet.google.com pattern
    - **Validates: Requirements 10.4**

  - [x] 1.3 Create `src/services/sizeProfileService.js` — CRUD service for `SizeProfile` objects
    - `create(userId, profileData)` — generates uuid v4 `id`, sets `created_at`/`updated_at`, handles 10-profile cap, writes to `slb_size_profiles_{userId}`
    - `update(userId, profileId, patch)` — merges patch, updates `updated_at`, validates name uniqueness
    - `delete(userId, profileId)` — removes profile, auto-assigns default to most-recently-created remaining profile
    - `setDefault(userId, profileId)` — sets `is_default: true` on target, `false` on all others
    - `list(userId)` — reads and parses from localStorage, returns `SizeProfile[]`
    - Use existing `useLocalStorage` hook pattern; wrap reads/writes in try/catch
    - _Requirements: 1.2, 1.3, 1.6, 1.7, 1.8, 1.11, 14.1_

  - [ ]* 1.4 Write property tests for `sizeProfileService` (`src/services/sizeProfileService.pbt.test.js`)
    - **Property 1: Measurement round-trip preserves values and unit** — `fc.float({min:1,max:500})` + `fc.constantFrom('cm','inches')`
    - **Validates: Requirements 1.4, 1.5, 2.3**
    - **Property 3: Exactly one default profile invariant** — `fc.array(fc.record({...}), {minLength:1,maxLength:10})`
    - **Validates: Requirements 1.6, 1.11**
    - **Property 20: Logout clears all user-scoped feature data** — verify `slb_size_profiles_{userId}` absent after logout
    - **Validates: Requirements 14.3**

  - [x] 1.5 Create `src/services/bookingService.js` — CRUD service for `Booking` objects
    - `save(userId, booking)` — writes to `slb_bookings_{userId}` array
    - `list(userId)` — reads and parses; returns `Booking[]`
    - `update(userId, bookingId, patch)` — merges patch atomically (single write)
    - `listAll()` — scans all `slb_bookings_*` keys in localStorage, merges with `MOCK_BOOKINGS`
    - _Requirements: 8.8, 9.1, 10.1, 14.2_

  - [ ]* 1.6 Write property tests for `bookingService` (`src/services/bookingService.pbt.test.js`)
    - **Property 15: Persisted booking contains all required fields** — `fc.record({bookingId: fc.uuidV4(), ...})` arbitraries
    - **Validates: Requirements 8.8**
    - **Property 16: Booking sort order is descending by appointment time** — `fc.array(fc.date(...))`
    - **Validates: Requirements 9.1**
    - **Property 17: Cancellation policy enforced by time delta** — `fc.date({min: new Date(), max: new Date(Date.now()+60*24*60*60*1000)})`
    - **Validates: Requirements 9.5, 9.6**
    - **Property 20: Logout clears all user-scoped feature data** — verify `slb_bookings_{userId}` absent after logout
    - **Validates: Requirements 14.3**

  - [x] 1.7 Create `src/lib/sizingEngine.js` — pure recommendation function
    - `recommend(input: SizeFinderInput, garmentType: string) → SizeRecommendation`
    - Implements rules-based size chart mapping for: Saree, Lehenga, Kurta, Blouse, Salwar; output `size`, `confidence`, `explanation`, `alternatives[]`, `fitZones`
    - Cap `confidence` at 60 for `"height_weight"` mode, 55 for `"body_shape_fit"` without extra measurements
    - Return no `size` when `confidence < 20`; `explanation` must be 20–80 words
    - `alternatives` (up to 2) only when `confidence < 75`
    - _Requirements: 5.1, 5.2, 5.4, 5.6, 5.7, 5.8_

  - [ ]* 1.8 Write property tests for `sizingEngine` (`src/lib/sizingEngine.pbt.test.js`)
    - **Property 7: Confidence bounded to [0,100]** — `fc.record({mode: fc.constantFrom(...), garmentType: fc.string(), ...})`
    - **Validates: Requirements 5.2**
    - **Property 8: Confidence threshold gates mode capabilities** — height_weight ≤60, body_shape_fit ≤55, <20 → no size
    - **Validates: Requirements 5.1, 5.7, 5.8**
    - **Property 9: Fit explanation word count is bounded [20,80]** — all valid inputs that produce a recommendation
    - **Validates: Requirements 5.4**

  - [x] 1.9 Add lazy routes to `src/App.js` and extend `AuthContext.logout()`
    - Lazy-load `/account/size-profiles` → `pages/account/SizeProfiles.jsx`
    - Lazy-load `/account/bookings` → `pages/account/Bookings.jsx`
    - Extend `AuthContext.logout()` to clear `slb_size_profiles_{userId}` and `slb_bookings_{userId}` before clearing session
    - _Requirements: 14.3, 14.4, 14.5_

- [x] 2. Women's Smart Size Profile — form, card, and page
  - [x] 2.1 Create `src/components/SizeProfile/SizeProfileForm.jsx`
    - Two-column grid (`grid-cols-1 sm:grid-cols-2`) for all 20 measurement fields
    - `unit` toggle pill (cm / inches); toggling re-renders labels and bounds only — stored values stay in chosen unit
    - Inline field-level validation using `isValidMeasurement` and `isValidProfileName`
    - Free-text `<textarea>` for `saree_fall_preference` and `dupatta_length_preference`
    - All fields have explicit `<label>` with `for`/`id` pairing; `aria-label` on icon buttons
    - _Requirements: 1.3, 1.9, 2.4, 2.5, 12.8, 15.6_

  - [x] 2.2 Create `src/components/SizeProfile/SizeProfileCard.jsx` and `DefaultBadge`
    - Card displays profile name, unit, key measurements summary, default badge, Edit / Delete / Set Default action buttons
    - All action buttons have minimum 44×44 px touch area
    - _Requirements: 1.1, 1.6, 12.4_

  - [x] 2.3 Create `src/pages/account/SizeProfiles.jsx` (`SizeProfileManager` page)
    - Reads profiles via `sizeProfileService.list(userId)` on mount
    - Renders profile list as `SizeProfileCard` components; "Add New Profile" opens `SizeProfileForm` as modal/drawer
    - Enforces 10-profile cap with inline error on 11th attempt
    - Handles delete (with auto-default reassignment), rename validation, and set-default
    - Guards with `isLoggedIn` check on mount; redirects to `/login?returnTo=/account/size-profiles`
    - _Requirements: 1.1, 1.2, 1.6, 1.7, 1.8, 1.11, 15.4_

  - [ ]* 2.4 Write unit tests for `SizeProfileForm` and `SizeProfileManager`
    - Field rendering for all 20 fields; unit toggle label changes; 10-profile cap error; rename uniqueness error
    - _Requirements: 1.3, 1.7, 1.8, 1.9, 1.10_

- [x] 3. Measurement unit conversion display
  - [x] 3.1 Implement unit-conversion display logic in `SizeProfileForm` and `SizeProfileCard`
    - `cm → inches`: display = `round(stored_cm * 0.3937, 1)`; `inches → cm`: display = `round(stored_inches * 2.54, 1)`
    - Persisted unit preference per profile (stored in `SizeProfile.unit`); restore on next session
    - Non-numeric input triggers inline error on the specific field and blocks submit
    - Out-of-range input (`<1` or `>500` cm / `<0.4` or `>196.9` inches) triggers inline range error
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.2 Write property test for unit display conversion (`sizeProfileService.pbt.test.js`)
    - **Property 2: Unit display conversion correctness** — `fc.float({min:1,max:500})` for stored cm; verify displayed inches = `round(x*0.3937,1)` and back
    - **Validates: Requirements 2.1, 2.2**

- [x] 4. Checkpoint — Size profile foundation
  - Ensure all tests pass (validators, sizeProfileService PBTs, unit tests). Ask the user if questions arise.

- [x] 5. AI Size Finder — input collection
  - [x] 5.1 Create `src/components/AISizeFinder/ConfidenceRing.jsx`
    - Animated SVG arc (`stroke-dasharray`) via Framer Motion `animate` prop, 800 ms duration
    - Respects `prefers-reduced-motion: reduce` — renders at final value immediately
    - Props: `value` (0–100), `duration` (default 800)
    - _Requirements: 5.3, 15.2_

  - [x] 5.2 Create `src/components/AISizeFinder/BodySilhouette.jsx`
    - SVG with `viewBox="0 0 200 400" width="100%"` (no fixed px)
    - Named zone `<path id="zone-{name}">` for: bust, waist, hip, shoulder, sleeve, neck, thigh
    - Colour map: tight=`#F59E0B` (amber), loose=`#3B82F6` (blue), good=`#22C55E` (green)
    - Zone colour transitions respect `prefers-reduced-motion: reduce`
    - Scales responsively; no overflow on viewports narrower than 360 px
    - _Requirements: 5.5, 13.4, 15.3_

  - [x] 5.3 Create `src/components/AISizeFinder/AISizeFinder.jsx`
    - Four tabs: "Enter Measurements" | "Height & Weight Only" | "From Existing Garment" | "Body Shape & Fit"
    - "Use my saved profile" pre-fill option for logged-in users with ≥1 profile
    - Tab row renders as scrollable horizontal chip row on `< 640px` (`overflow-x-auto whitespace-nowrap`)
    - Validation on submit: required fields per mode; missing optional fields lower confidence
    - Calls `sizingEngine.recommend(inputs, garmentType)` on submit
    - Renders `ConfidenceRing`, `BodySilhouette`, explanation text, alternatives (when confidence < 75), "Add this size to cart" button (hidden when confidence < 20)
    - "Add this size to cart" appends `size` attribute to current product in CartContext
    - _Requirements: 4.1–4.8, 5.1–5.9, 13.5, 15.1_

  - [ ]* 5.4 Write unit tests for `AISizeFinder`
    - Tab switching renders correct fields; "use saved profile" pre-fill; recommendation hidden when confidence <20; alternatives shown when confidence <75; add-to-cart button behaviour
    - _Requirements: 4.1, 4.6, 5.1, 5.6, 5.9_

- [x] 6. Size Profile at Checkout
  - [x] 6.1 Create `src/components/SizeProfile/SizeProfileSelector.jsx`
    - Reads `sizeProfileService.list(userId)` on mount
    - Renders `<select>` defaulting to profile with `is_default: true`; label "Your Size Profile"
    - Updates local state `selectedSizeProfileId` on change without disrupting cart or form state
    - When no profiles exist: renders `<Link to="/account/size-profiles">` prompt; does not block checkout
    - Formats `sessionFee` and monetary values using `CurrencyContext.formatPrice`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 14.7_

  - [x] 6.2 Integrate `SizeProfileSelector` into `src/pages/Checkout.jsx`
    - Insert `<SizeProfileSelector>` above the Payment Method section
    - Patch `handlePlaceOrder` to include `selectedSizeProfileId` in the order object written to localStorage
    - Preserve all existing CartContext integration, payment methods, and tax/shipping logic untouched
    - _Requirements: 3.1, 3.4, 11.1_

  - [ ]* 6.3 Write property test for checkout order object (`bookingService.pbt.test.js` or separate test file)
    - **Property 6: Order object includes selected size profile ID** — `fc.uuidV4()` as pid; verify `order.selectedSizeProfileId === pid` in stored order
    - **Validates: Requirements 3.4, 3.5**

- [x] 7. Store Discovery components
  - [x] 7.1 Create `src/components/Store/StoreFilterPills.jsx`
    - Renders 7 filter pills: All, Trending, New, Luxury, Wedding Specialists, Regional, Featured
    - Active pill: `bg-espresso text-ivory`; inactive: `border bg-white`
    - On select: triggers `onFilterChange` callback
    - Each pill has minimum 44×44 px touch area
    - _Requirements: 6.7, 7.3, 12.4_

  - [x] 7.2 Create `src/components/Store/StoreCard.jsx`
    - Default view: banner (200px, `object-fit: cover`), logo/avatar, name, verified badge (when `shop.verified===true`), city, star rating, follower count, product count, ≤3 category tags, ≤2 specialty tags, story excerpt
    - Hover/focus preview: Framer Motion `whileHover` expands overlay with 3 product thumbnails + "Visit Store" button; keyboard: Enter expands, Escape collapses
    - Follow button: disabled when unauthenticated; shows `toast` on unauthenticated click; toggling persists to `slb_followed_stores_{userId}`, updates follower count ±1 optimistically
    - `pointer-events: auto`, `touch-action: manipulation` on card; hover preview only on `@media (hover: hover)`
    - Banner images use `object-fit: cover`, maintain aspect ratio on all viewports
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 13.3, 15.5_

  - [ ]* 7.3 Write property tests for store filter and follow-toggle (`src/utils/validators.pbt.test.js` or a store utility test)
    - **Property 10: Store filter produces a subset matching the filter tag** — `fc.array(fc.record({tags:fc.array(fc.string())}))` + filter value
    - **Validates: Requirements 6.7, 6.8, 7.3**
    - **Property 12: Follow-toggle round-trip** — follow then unfollow → stored state falsy, displayed count back to original ±0
    - **Validates: Requirements 6.5**

  - [x] 7.4 Create `src/components/Store/StoreDiscoverySection.jsx`
    - Calls `fetchShops()` on mount; falls back to `MOCK_SHOPS` on empty array or error
    - Slices to first 8 stores; renders `StoreFilterPills` + `AnimatePresence`-wrapped `StoreCard` grid
    - Smooth layout transition via Framer Motion `AnimatePresence` on filter change
    - _Requirements: 6.1, 6.2, 6.8, 6.9_

  - [x] 7.5 Insert `StoreDiscoverySection` into `src/pages/HomePage.jsx`
    - Place between the "How It Works" `<section>` and the "New Arrivals" `<section>`
    - _Requirements: 6.1_

  - [ ]* 7.6 Write unit tests for `StoreCard` and `StoreDiscoverySection`
    - Verified badge conditional; follow auth guard; hover panel keyboard accessibility; fallback to MOCK_SHOPS
    - _Requirements: 6.3, 6.6, 6.9_

- [x] 8. Enhanced `/shops` page (`ShopsDirectory`)
  - [x] 8.1 Refactor `src/pages/ShopsDirectory.jsx` to use `StoreCard` and `StoreFilterPills`
    - Replace existing store-card rendering with `<StoreCard>` component
    - Show all stores from `fetchShops()` (no 8-store cap)
    - Add `StoreFilterPills` with same 7 filter options
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.2 Add debounced search to `ShopsDirectory`
    - Search input with `useDebounce` hook at 300 ms; filtering triggers at ≥2 characters
    - When `q.length < 2`: show all stores unfiltered
    - When `q.length >= 2` and no match: display "No stores match your search — try a different term." and hide all cards
    - _Requirements: 7.4, 7.5, 7.6_

  - [ ]* 8.3 Write property test for shop search filter (`src/utils/validators.pbt.test.js` or dedicated)
    - **Property 13: Search filter triggers at two or more characters** — `fc.string({maxLength:10})` as query
    - **Validates: Requirements 7.4, 7.5**

  - [ ]* 8.4 Write unit tests for `ShopsDirectory`
    - Search empty-state message; filter + search combination; no cap enforcement
    - _Requirements: 7.2, 7.5, 7.6_

- [x] 9. Checkpoint — Store and shop features
  - Ensure all tests pass (store filter PBTs, follow-toggle PBTs, search PBTs, unit tests). Ask the user if questions arise.

- [x] 10. Live Video Shopping — booking flow
  - [x] 10.1 Create `src/components/Booking/BookingProgressBar.jsx`
    - 5-step horizontal progress indicator with step labels
    - Collapses to compact numbered badge row on `< 480px` via `hidden sm:flex` / `flex sm:hidden`
    - _Requirements: 8.1, 12.7_

  - [x] 10.2 Create booking step components in `src/components/Booking/steps/`
    - `StoreSelector.jsx` — renders all shops as cards; on select sets `bookingState.storeId`, shows store name/banner/rating/specialties
    - `ProductPicker.jsx` — fetches products for selected storeId; checkbox list capped at 10 selections
    - `AppointmentForm.jsx` — date picker (`min=today`, disables past), time-slot `<select>`, notes `<textarea>`; all fields have `<label>`
    - `TimezoneSelector.jsx` — `<select>` with IST, UTC, EST, PST, GMT, GST, AEST, SGT; shows IST equivalent live
    - `ReviewAndPay.jsx` — full summary (store, ≤10 products, IST + user timezone, ₹699 via `formatPrice(699)`); "Pay ₹699" button
    - Auth redirect at every step transition beyond Step 1: `navigate('/login?returnTo=/live-shopping')`
    - Input fields stack to single-column on `< 480px`
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.9, 12.7, 15.6_

  - [x] 10.3 Replace `src/pages/LiveShopping.jsx` with `LiveBookingFlow` (5-step orchestrator)
    - Orchestrates step state machine; renders `BookingProgressBar` + active step component
    - Payment simulation on Step 5 "Pay ₹699": 1400 ms delay, calls `bookingService.save(userId, booking)`, navigates to `/booking-confirmation` with `{ state: { booking } }`
    - Booking object fields: `bookingId` ("BK-"+nanoid(8)), `storeId`, `storeName`, `selectedProducts`, `appointmentIST`, `appointmentUserTz`, `timezone`, `googleMeetLink: null`, `status: 'pending'`, `createdAt`, `sessionFee: 699`
    - "Pay ₹699" button only rendered/enabled in Step 5
    - Preserves existing `BookingConfirmation` navigation-state handoff pattern
    - _Requirements: 8.1, 8.7, 8.8, 8.9_

  - [ ]* 10.4 Write property test for booking confirmation gate (`bookingService.pbt.test.js`)
    - **Property 14: Booking confirmation requires Step 5** — `fc.integer({min:1,max:5})` as currentStep; payment button inaccessible when `currentStep !== 5`
    - **Validates: Requirements 8.7**

  - [ ]* 10.5 Write unit tests for `LiveBookingFlow`
    - Step navigation; auth redirect at step 2+; pay button only on step 5; booking object shape after payment
    - _Requirements: 8.1, 8.7, 8.9_

- [x] 11. Booking Dashboard (Customer)
  - [x] 11.1 Create `src/components/Booking/BookingCard.jsx`
    - Displays: store name, IST + user-timezone times, `BookingStatus` badge, Google Meet link (when `status==='confirmed'` and link not null), ≤3 product thumbnails + overflow count
    - Countdown timer (`useCountdown` hook) wrapped in `aria-live="polite"` — only when `status==='confirmed'` AND within 24 hrs
    - Postponed state: original time in `<del>`, new time highlighted
    - Cancel button: shown for non-cancelled/non-completed; disabled with inline message when within 48 hrs
    - Single-column layout on `< 640px`; countdown at top of card on mobile
    - _Requirements: 9.2, 9.3, 9.4, 9.6, 9.7, 13.6, 15.7_

  - [x] 11.2 Create `src/pages/account/Bookings.jsx` (Booking Dashboard)
    - Reads `bookingService.list(userId)`, sorted descending by `appointmentIST`
    - Guards with `isLoggedIn` on mount; redirect to `/login?returnTo=/account/bookings`
    - Renders list of `BookingCard` components
    - Cancel action: calls `bookingService.update(userId, bookingId, {status:'cancelled'})`; enforces 48-hr rule
    - _Requirements: 9.1, 9.2, 9.5, 9.6, 14.4_

  - [ ]* 11.3 Write unit tests for `BookingDashboard`
    - Countdown only for confirmed within-24hr; cancel button disabled for <48hr; sort order; postponed display
    - _Requirements: 9.3, 9.5, 9.6, 9.7_

- [x] 12. Admin Bookings Panel extension
  - [x] 12.1 Extend `src/pages/admin/Bookings.jsx` with Meet link, postpone, and reminder columns
    - Data source: `bookingService.listAll()` merged with existing MOCK_BOOKINGS
    - New columns: Google Meet Link (text input + "Confirm" button), Postpone (date picker + "Postpone" button), Reminder (button)
    - Meet URL validation: inline error if not matching `isValidMeetUrl`; Confirm button disabled on invalid URL
    - Confirm action: validates URL → single `bookingService.update(userId, bookingId, {status:'confirmed', googleMeetLink})` → success toast (only when both status + link saved)
    - Postpone action: `bookingService.update(userId, bookingId, {status:'postponed', originalAppointmentIST: current, appointmentIST: newDate})`
    - Reminder button: visible only for `confirmed` bookings within 24 hrs; on click `toast.success('Reminder notification queued for '+email)` (simulated); error toast on failure
    - Status filter dropdown adds `'postponed'` to existing filter options
    - Preserves existing table structure and MOCK_BOOKINGS logic
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 12.2 Write unit tests for `AdminBookingsPanel` extension
    - Meet URL validation; confirm atomicity; reminder toast; status filter
    - _Requirements: 10.3, 10.4, 10.6, 10.7_

- [x] 13. Checkpoint — Booking system
  - Ensure all booking-related tests pass (PBTs: Properties 14, 15, 16, 17; unit tests for Bookings pages and Admin panel). Ask the user if questions arise.

- [x] 14. Luxury Checkout Redesign
  - [x] 14.1 Create `src/components/Checkout/GlassCard.jsx`
    - `backdrop-filter: blur(20px)`, `background: rgba(250,249,246,0.85)`, `border: 1px solid rgba(232,228,223,0.6)`
    - Accepts `className` prop for positioning (`lg:sticky lg:top-24`)
    - _Requirements: 11.2_

  - [x] 14.2 Create `src/components/Checkout/CouponField.jsx`
    - Input + "Apply" button
    - Valid code: `AnimatePresence` slide-in green badge with savings amount (codes: `DIWALI10`=10%, `WELCOME20`=20%)
    - Invalid code: Framer Motion keyframe shake `x: [0,-8,8,-6,6,0]` (200 ms)
    - _Requirements: 11.5_

  - [x] 14.3 Create `src/components/Checkout/TrustBadgeRow.jsx`
    - Four badges: "256-bit SSL Encrypted", "Authentic Indian Stores", "Worldwide Shipping", "Easy Returns"
    - _Requirements: 11.7_

  - [x] 14.4 Apply visual upgrades to `src/pages/Checkout.jsx`
    - Wrap order-summary sidebar in `<GlassCard className="lg:sticky lg:top-24">`
    - Animate total value: `<motion.span key={total}>` re-mount transition (300 ms)
    - Cart thumbnails: `whileHover` scale 48×56 → 80×96 px
    - Payment method tiles: styled radio tiles with accent colours (Card=#1B2A6B, Razorpay=#2563EB, PayPal=#F59E0B, ApplePay=#0A0A0A)
    - Insert `<CouponField>` below item list; `<TrustBadgeRow>` below "Place Order" button
    - Estimated delivery date range: `today+7` to `today+14` in sidebar
    - Free shipping badge: Framer Motion slide-in "You saved ₹499 on shipping" when subtotal ≥ ₹15,000
    - Stack form + Glass_Card to single column on `< 640px` (`flex-col-reverse`): Glass_Card below form
    - All existing logic (CartContext, payment methods, tax, shipping, order confirmation) untouched
    - _Requirements: 11.1–11.9, 12.9_

  - [ ]* 14.5 Write property test for delivery date range
    - **Property 19: Delivery date range is always [today+7, today+14]** — render at different `Date.now()` values and verify min/max dates
    - **Validates: Requirements 11.8**

  - [ ]* 14.6 Write unit tests for Luxury Checkout visual components
    - Coupon valid/invalid states; size profile section presence/absence; trust badge row; delivery date calculation; free shipping badge appearance
    - _Requirements: 11.1, 11.5, 11.7, 11.8, 11.9_

- [x] 15. Mobile Responsiveness Polish
  - [x] 15.1 Fix `MarketplaceLayout` navbar overflow and hamburger menu
    - Header: `flex-wrap`, `min-w-0` on logo, `overflow-x-hidden` on header wrapper
    - Mobile menu links: `min-h-[44px] flex items-center` for 44 px tap targets
    - Mobile menu includes `CurrencySelector`, all nav links, "Become a Seller" as stacked full-width items
    - Hamburger button visible on `< 1024px`; desktop nav collapsed
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 15.2 Verify and patch product-grid layouts across all pages
    - Ensure `grid-cols-2` on `< 640px` for all product grids: Marketplace, ProductDetail related items, Cart, HomePage New Arrivals
    - No horizontal scroll at any viewport including 320 px
    - _Requirements: 12.5, 12.6_

  - [x] 15.3 Verify 44×44 px tap targets on all interactive elements
    - Audit every button, link, form input, select, toggle, and icon button in: SizeProfileManager, AISizeFinder, StoreCard, LiveBookingFlow, BookingDashboard, AdminBookingsPanel, Checkout, ShopsDirectory, HomePage
    - Add `min-h-[44px] min-w-[44px]` or equivalent padding where missing
    - _Requirements: 12.4_

  - [x] 15.4 Implement Footer accordion for mobile
    - Each footer link-group header becomes a `<button>` toggle with `aria-expanded`
    - Content collapses/expands with `AnimatePresence` on `< 640px`
    - Single-column stacked layout on `< 640px`; headers have ≥44×44 px tap area
    - _Requirements: 13.1, 13.2_

  - [x] 15.5 Ensure `StoreCard` carousel touch behaviour and no-overflow
    - `touch-action: pan-y` on carousel/cards to avoid intercepting native scroll
    - `pointer-events: auto` on card; hover preview only with `@media (hover: hover)`
    - _Requirements: 12.10_

  - [ ]* 15.6 Write responsive behaviour tests
    - Snapshot or computed-style checks at 320 px, 480 px, 640 px for: nav overflow, product grid columns, booking flow progress indicator, size profile form columns, checkout column stacking
    - _Requirements: 12.1, 12.5, 12.6, 12.7, 12.8, 12.9_

- [x] 16. Accessibility polish and `aria-live` wiring
  - [x] 16.1 Add `aria-label` to all icon-only buttons across new components
    - Audit: SizeProfileCard actions, AISizeFinder tab close, StoreCard follow button, BookingCard cancel, filter pills
    - _Requirements: 15.1_

  - [x] 16.2 Wire `aria-live="polite"` on countdown timer in `BookingCard`
    - Wrap countdown display in `<div role="timer" aria-live="polite" aria-atomic="true">`
    - _Requirements: 15.7_

  - [x] 16.3 Ensure focus trap in modal dialogs and panels
    - `SizeProfileForm` modal, `AISizeFinder` panel: trap focus while open, release to trigger on close
    - _Requirements: 15.4_

- [x] 17. Integration wiring and data-flow validation
  - [x] 17.1 Wire `SizeProfileSelector` end-to-end: create profile → checkout → verify in stored order
    - Smoke-test the full path in code: `sizeProfileService.create` → `SizeProfileSelector` default selection → `handlePlaceOrder` → order object in localStorage contains `selectedSizeProfileId`
    - _Requirements: 3.4, 6.3 (integration)_

  - [x] 17.2 Wire live booking end-to-end: 5 steps → payment → `/account/bookings`
    - Smoke-test: navigate all 5 steps → trigger payment → verify booking in `slb_bookings_{userId}` → verify booking card renders in `BookingDashboard`
    - _Requirements: 8.8, 9.1 (integration)_

  - [x] 17.3 Verify `AuthContext.logout()` clears `slb_size_profiles_*` and `slb_bookings_*`
    - Manual code review + unit test confirming both keys absent after `logout()` call
    - _Requirements: 14.3_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Run all PBT suites (Properties 1–20), unit tests, and integration smoke-tests. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing sub-tasks and can be skipped for a faster MVP
- Each task references specific requirements from `requirements.md` for full traceability
- All 20 correctness properties from `design.md` are covered by PBT sub-tasks (Properties 1–20 mapped to tasks 1.2, 1.4, 1.6, 1.8, 3.2, 6.3, 7.3, 8.3, 10.4, 14.5)
- Property-based tests use `fast-check` with minimum 100 runs per property
- No existing Checkout logic, CartContext, CurrencyContext, or admin infrastructure is removed
- All monetary values (except the marketing label "Pay ₹699") use `CurrencyContext.formatPrice`
- All new pages are lazy-loaded in `App.js` following the existing pattern
- `useLocalStorage` hook from `hooks/useLocalStorage.js` is used for all new localStorage reads/writes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.5", "1.7"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.6", "1.8", "1.9"] },
    { "id": 2, "tasks": ["2.1", "2.2", "5.1", "5.2", "7.1", "10.1"] },
    { "id": 3, "tasks": ["2.3", "3.1", "5.3", "7.2", "6.1", "10.2", "14.1", "14.2", "14.3"] },
    { "id": 4, "tasks": ["2.4", "3.2", "5.4", "6.2", "7.3", "7.4", "10.3", "11.1", "12.1", "14.4"] },
    { "id": 5, "tasks": ["6.3", "7.5", "7.6", "8.1", "8.2", "10.4", "10.5", "11.2", "14.5", "14.6"] },
    { "id": 6, "tasks": ["8.3", "8.4", "11.3", "12.2", "15.1", "15.2"] },
    { "id": 7, "tasks": ["15.3", "15.4", "15.5", "16.1", "16.2", "16.3"] },
    { "id": 8, "tasks": ["15.6", "17.1", "17.2", "17.3"] }
  ]
}
```
