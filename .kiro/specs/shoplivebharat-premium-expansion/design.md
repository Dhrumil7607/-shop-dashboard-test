# Design Document

## ShopLiveBharat Premium Expansion

---

## Overview

This document describes the technical design for six interconnected feature areas added on top of the existing ShopLiveBharat codebase. All new features are purely client-side, using React 18 with the existing `AuthContext`, `CartContext`, and `CurrencyContext`, with data persisted to localStorage under the established `slb_*` key convention.

**No existing logic is removed.** The Checkout page's CartContext integration, all four payment methods, and the shipping/tax calculations are preserved verbatim. New components extend or compose the existing system rather than replace it.

### Feature Areas at a Glance

| # | Feature | New Route(s) | Key New Components |
|---|---------|--------------|-------------------|
| 1–2 | Women's Smart Size Profile + AI Size Finder | `/account/size-profiles` | `SizeProfileManager`, `SizeProfileForm`, `AISizeFinder`, `ConfidenceRing`, `BodySilhouette` |
| 3 | Size Profile at Checkout | existing `/checkout` | `SizeProfileSelector` (inline) |
| 4–5 | Store Discovery + Enhanced `/shops` | existing `/`, `/shops` | `StoreDiscoverySection`, `StoreCard`, `StoreFilterPills` |
| 6 | Live Video Shopping Redesign | existing `/live-shopping`, `/account/bookings`, `/admin/bookings` | `LiveBookingFlow`, `BookingDashboard`, `AdminBookingsPanel` extension |
| 7 | Luxury Checkout Redesign | existing `/checkout` | Visual layer only, `GlassCard`, `CouponField`, `TrustBadgeRow` |
| 8 | Mobile Responsiveness Polish | all pages | Tailwind responsive utilities, min-h touch targets |

---

## Architecture

The architecture is entirely frontend (React SPA). There is no backend — all persistence goes to `localStorage`, and API calls fall back to mock data when the server is unavailable (matching the pattern already established in `api.js`).

```mermaid
graph TD
    A[App.js — React Router v6] --> B[MarketplaceLayout]
    A --> C[AdminLayout]

    B --> D[HomePage]
    B --> E[/account/size-profiles — SizeProfileManager]
    B --> F[/account/bookings — BookingDashboard]
    B --> G[/live-shopping — LiveBookingFlow]
    B --> H[/checkout — LuxuryCheckout]
    B --> I[/shops — ShopsDirectory enhanced]

    C --> J[/admin/bookings — AdminBookingsPanel]

    subgraph Contexts
        K[AuthContext]
        L[CartContext]
        M[CurrencyContext]
    end

    subgraph LocalStorage
        N[slb_user]
        O[slb_cart]
        P[slb_size_profiles_{userId}]
        Q[slb_bookings_{userId}]
        R[slb_followed_stores_{userId}]
    end

    E --> K
    E --> P
    F --> K
    F --> Q
    G --> K
    G --> Q
    H --> L
    H --> M
    H --> P
    I --> R
    J --> Q
```

### Data Flow Principles

1. **User-scoped keys** — new data always uses `_{userId}` suffix (matching existing `slb_cart` pattern). `AuthContext.user.id` provides the userId.
2. **Context-first reads** — components read from React state hydrated from localStorage on mount; they never read localStorage directly mid-render.
3. **Logout cleanup** — `AuthContext.logout()` is extended (via a custom `useEffect` in each feature) to clear `slb_size_profiles_{userId}` and `slb_bookings_{userId}` for the departing user.
4. **Fallback chains** — every `fetchShops` / `fetchProducts` call wraps in try/catch and falls back to `MOCK_SHOPS` / `MOCK_PRODUCTS`, matching the existing pattern.
5. **`useLocalStorage` hook** — all new localStorage reads/writes use the existing `hooks/useLocalStorage.js` hook for consistent error handling.

---

## Components and Interfaces

### 1. Size Profile System

#### `SizeProfileManager` (page component)
- **Route:** `/account/size-profiles` (lazy-loaded, wrapped in `MarketplaceLayout`)
- **State:** `profiles[]` loaded from `useLocalStorage('slb_size_profiles_{userId}', [])`
- **Sub-components:** `SizeProfileCard`, `SizeProfileForm` (modal/drawer), `DefaultBadge`
- **Key behaviours:**
  - Create: calls `sizeProfileService.create(userId, formData)` → updates state
  - Delete: calls `sizeProfileService.delete(userId, profileId)`, auto-reassigns default
  - Set default: calls `sizeProfileService.setDefault(userId, profileId)` — sets `is_default: true` on target, `false` on all others
  - Edit / rename: inline validation before calling `sizeProfileService.update()`

#### `SizeProfileForm`
- Renders all 20 measurement fields in a two-column grid (single column on `< 640px`)
- `unit` toggle (cm / inches) is a styled radio pill; changing it re-renders display labels only — stored values stay in the user's chosen unit
- Each numeric field validates: non-empty, numeric, and within `[1, 500]` cm or `[0.4, 197]` inches
- Text fields (`saree_fall_preference`, `dupatta_length_preference`) are free-text `<textarea>`

#### `SizeProfileService` (pure utility module, not a component)
Location: `src/services/sizeProfileService.js`

```js
// All functions operate on localStorage key slb_size_profiles_{userId}
create(userId, profileData) → SizeProfile
update(userId, profileId, patch) → SizeProfile
delete(userId, profileId) → SizeProfile[] // updated list after delete
setDefault(userId, profileId) → SizeProfile[]
list(userId) → SizeProfile[]
```

#### `AISizeFinder` (modal or inline panel)
- Can be triggered from `ProductDetail` page
- **Tabs:** "Enter Measurements" | "Height & Weight Only" | "From Existing Garment" | "Body Shape & Fit"
- **Engine:** `sizingEngine.js` — pure function: `recommend(inputs, garmentType) → { size, confidence, explanation, alternatives[], fitZones }`
- **Confidence Ring:** animated SVG arc; respects `prefers-reduced-motion`
- **Body Silhouette:** SVG with named zone paths; colour mapped from `fitZones`

#### `ConfidenceRing` (presentational)
```jsx
<ConfidenceRing value={72} duration={800} />
// SVG arc, stroke-dasharray animated via Framer Motion animate prop
// Renders at final value immediately if prefers-reduced-motion: reduce
```

#### `BodySilhouette` (presentational)
```jsx
<BodySilhouette zones={{ bust: 'tight', waist: 'good', hip: 'loose' }} />
// SVG with viewBox="0 0 200 400", each zone is a named <path id="zone-bust">
// Colours: tight=#F59E0B (amber), loose=#3B82F6 (blue), good=#22C55E (green)
```

---

### 2. Size Profile at Checkout

#### `SizeProfileSelector` (inline section)
- Inserted above the Payment Method section in `Checkout.jsx`
- Reads `sizeProfileService.list(userId)` on mount
- Renders a `<select>` defaulting to the profile with `is_default: true`
- On selection change: updates local state `selectedSizeProfileId`
- `handlePlaceOrder` is patched to include `selectedSizeProfileId` in the `order` object before writing to localStorage
- If no profiles: renders a `<Link to="/account/size-profiles">` prompt; does not block checkout

---

### 3. Store Discovery Section

#### `StoreDiscoverySection` (homepage section component)
- **Inserted** between the "How It Works" `<section>` and the "New Arrivals" `<section>` in `HomePage.jsx`
- Calls `fetchShops()` on mount; falls back to `MOCK_SHOPS` if empty or error
- Slices result to first 8 stores for display
- Contains `StoreFilterPills` + `AnimatePresence`-wrapped `StoreCard` grid

#### `StoreCard`
- Props: `shop`, `isFollowed`, `onFollowToggle`, `featuredProducts[]`
- **Default view:** banner image (200px, `object-fit: cover`), avatar, name, verified badge, city, rating, follower count, product count, up to 3 category tags, up to 2 specialty tags, story excerpt
- **Hover/focus preview:** Framer Motion `whileHover`/keyboard Enter expands an overlay panel with 3 product thumbnails and "Visit Store" button
- **Follow button:** disabled if not authenticated; shows sonner `toast` if unauthenticated
- **Mobile touch:** `pointer-events: auto`, `touch-action: manipulation` on the card; hover preview only on non-touch (CSS `@media (hover: hover)`)

#### `StoreFilterPills`
```jsx
const FILTERS = ['All','Trending','New','Luxury','Wedding Specialists','Regional','Featured'];
// Active pill: bg-espresso text-ivory; inactive: border bg-white
// On select: AnimatePresence layout transition on the StoreCard grid
```

Follow-state persistence:
```js
// slb_followed_stores_{userId} = { [storeId]: true }
// Re-hydrated from localStorage on StoreCard mount
// Follower count is optimistic: displayed = shop.followers ± localDelta
```

---

### 4. Enhanced `/shops` Page

`ShopsDirectory.jsx` is refactored to:
1. Use `StoreCard` component (same as homepage)
2. Show all stores (no 8-store cap)
3. Include `StoreFilterPills`
4. Add a debounced search input (`useDebounce` hook at 300 ms, triggers at ≥ 2 chars)
5. Empty state: `<p>No stores match your search — try a different term.</p>`

---

### 5. Live Video Shopping — Redesigned Booking Flow

`LiveShopping.jsx` is replaced with a new 5-step flow. The existing `BookingConfirmation` page and navigation-state handoff pattern are preserved.

#### Step Machine

```
Step 1: Choose Store   → Step 2: Select Products → Step 3: Appointment Details
Step 4: Timezone & Schedule → Step 5: Review & Pay
```

Authentication check at every step transition beyond Step 1:
```js
if (!isLoggedIn) navigate('/login?returnTo=/live-shopping');
```

#### Step Components

| Step | Component | Key logic |
|------|-----------|-----------|
| 1 | `StoreSelector` | Renders all shops as cards; selecting one sets `bookingState.storeId` |
| 2 | `ProductPicker` | Fetches products for selected storeId; checkbox list, max 10 |
| 3 | `AppointmentForm` | Date picker (min = today), time-slot `<select>`, notes `<textarea>` |
| 4 | `TimezoneSelector` | `<select>` with IST, UTC, EST, PST, GMT, GST, AEST, SGT; shows IST equivalent |
| 5 | `ReviewAndPay` | Full summary; "Pay ₹699" button calls payment simulation |

**Progress indicator:** `<BookingProgressBar currentStep={step} totalSteps={5} />` — collapses to numbered badge row on `< 480px`.

**Payment simulation:**
```js
await new Promise(r => setTimeout(r, 1400)); // matches Checkout.jsx delay
const booking = { bookingId, storeId, storeName, selectedProducts,
  appointmentIST, appointmentUserTz, timezone, googleMeetLink: null,
  status: 'pending', createdAt: new Date().toISOString(), sessionFee: 699 };
bookingService.save(userId, booking);
navigate('/booking-confirmation', { state: { booking } });
```

#### `bookingService.js` (pure utility)
```js
save(userId, booking) → void      // writes to slb_bookings_{userId}
list(userId) → Booking[]          // reads and parses
update(userId, bookingId, patch) → Booking
listAll() → Booking[]             // admin: scans all slb_bookings_* keys
```

---

### 6. Booking Dashboard (Customer)

**Route:** `/account/bookings` (lazy-loaded, `MarketplaceLayout`)

- Reads `bookingService.list(userId)`, sorted by `appointmentIST` descending
- Each `BookingCard` shows: store name, IST + user timezone times, status badge, Meet link (when confirmed + not null), up to 3 product thumbnails + overflow count
- **Countdown timer:** only when `status === 'confirmed'` AND appointment within 24 hrs; uses `useCountdown` hook (already exists at `hooks/useCountdown.js`); wrapped in `aria-live="polite"` region
- **Cancel button:** shown for non-cancelled, non-completed bookings; `cancellationAllowed = (appointmentIST - Date.now()) > 48 * 60 * 60 * 1000`
- **Postponed display:** original time with `<del>`, new time highlighted

---

### 7. Admin Bookings Panel Extension

`/admin/bookings` (`AdminBookings.jsx`) is extended. Existing MOCK_BOOKINGS logic and table structure are preserved; new capabilities are layered on:

- **Data source extended:** `bookingService.listAll()` scans all `slb_bookings_*` localStorage keys, merges with existing MOCK_BOOKINGS array
- **New columns:** Google Meet Link (input + "Confirm" button), Postpone (date picker + button), Reminder (button, visible only when `status === 'confirmed'` AND within 24 hrs)
- **Meet URL validation:** regex `/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/`
- **Confirm action:** validates URL → writes `status: 'confirmed'` + `googleMeetLink` atomically in a single `bookingService.update()` call → shows success toast
- **Postpone action:** writes `status: 'postponed'`, saves `originalAppointmentIST = current appointmentIST`, updates `appointmentIST` to new value
- **Reminder simulation:** `toast.success('Reminder notification queued for ' + customerEmail)`
- **Status filter dropdown:** existing `filterStatus` state already handles this; adding `'postponed'` option

---

### 8. Luxury Checkout Redesign

`Checkout.jsx` is visually upgraded. All logic (`handlePlaceOrder`, `clearCart`, `getTotalPrice`, tax, shipping, pay methods) is unchanged.

#### Visual Changes

| Area | Current | New |
|------|---------|-----|
| Order summary sidebar | `bg-white border` | `GlassCard`: `backdrop-filter: blur(20px)`, `background: rgba(250,249,246,0.85)`, `border: 1px solid rgba(232,228,223,0.6)` |
| Total value | static render | `<motion.span key={total}>` re-mount transition (300ms) |
| Cart thumbnails | 48×56px static | `whileHover` scale to 80×96px |
| Payment method tiles | plain border buttons | Styled radio tiles with accent: Card=navy `#1B2A6B`, Razorpay=blue `#2563EB`, PayPal=gold `#F59E0B`, Apple Pay=black `#0A0A0A` |
| Below Place Order | simple trust text | `TrustBadgeRow` with 4 badges |
| Coupon field | absent | `CouponField` with success badge / shake animation |
| Sidebar extras | absent | Estimated delivery date range + free shipping badge |

#### `GlassCard`
```jsx
// Reusable utility component used in order summary sidebar
<GlassCard className="lg:sticky lg:top-24">
  ...order summary content...
</GlassCard>
```

#### `CouponField`
- Input + "Apply" button
- On valid code: `AnimatePresence` slide-in reveals green badge with savings amount
- On invalid code: Framer Motion keyframe `x: [0, -8, 8, -6, 6, 0]` shake (200ms)
- Valid coupon codes are defined in a small constant map (e.g., `DIWALI10` = 10% off, `WELCOME20` = 20% off)

#### Size Profile section (Req 3)
Inserted above payment methods. See §2 above.

---

### 9. Mobile Responsiveness Polish

No new components are added for this feature area. Work is applied as Tailwind utility additions and CSS fixes across all pages.

#### Key patterns

| Issue | Fix |
|-------|-----|
| Nav overflow at 320px | `MarketplaceLayout` header: `flex-wrap` on inner items, `min-w-0` on logo, `overflow-x-hidden` on header |
| Hamburger menu tap targets | Mobile menu links: `min-h-[44px] flex items-center` |
| Product grid | `grid-cols-2` on `< 640px` (already present in most pages; verified and added where missing) |
| LiveBookingFlow at < 480px | `BookingProgressBar` renders compact badge row via Tailwind `hidden sm:flex` / `flex sm:hidden` |
| Size profile form at < 640px | `grid-cols-1 sm:grid-cols-2` on the measurement grid |
| Checkout at < 640px | `flex-col-reverse` so Glass_Card appears below form |
| Footer accordion at < 640px | Footer link groups: each header is a `<button>` toggle with `aria-expanded`; content collapses with `AnimatePresence` |
| `StoreCard` carousels | `touch-action: pan-y` to avoid intercepting vertical scroll |
| `BodySilhouette` | SVG uses `viewBox="0 0 200 400" width="100%"` (no fixed px dimensions) |
| AI Size Finder tabs at < 640px | Tab row: `overflow-x-auto whitespace-nowrap` horizontal scroll |
| Booking dashboard cards at < 640px | `flex-col` layout; countdown timer at top of card |

---

## Data Models

### SizeProfile

```typescript
interface SizeProfile {
  id: string;                          // uuid v4, generated on creation
  userId: string;                      // matches AuthContext.user.id
  profile_name: string;                // 1–40 chars, unique per user
  unit: 'cm' | 'inches';
  is_default: boolean;
  created_at: string;                  // ISO 8601
  updated_at: string;                  // ISO 8601

  // Measurements (numeric, stored in the user's chosen unit)
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  shoulder_width?: number;
  sleeve_length?: number;
  arm_circumference?: number;
  neck?: number;
  thigh?: number;
  calf?: number;
  inseam?: number;
  kurti_length?: number;
  blouse_length?: number;
  lehenga_waist?: number;
  lehenga_length?: number;

  // Text preferences
  saree_fall_preference?: string;
  dupatta_length_preference?: string;
}
```

localStorage key: `slb_size_profiles_{userId}` → `SizeProfile[]`

### Booking

```typescript
interface Booking {
  bookingId: string;                   // e.g. "BK-" + nanoid(8)
  userId: string;
  storeId: string;
  storeName: string;
  selectedProducts: {                  // up to 10
    id: string;
    name: string;
    image_url: string;
    price: number;
  }[];
  appointmentIST: string;              // ISO 8601 in IST
  appointmentUserTz: string;           // ISO 8601 in user's selected timezone
  timezone: string;                    // e.g. "IST", "EST"
  googleMeetLink: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'postponed';
  originalAppointmentIST?: string;     // set when postponed
  createdAt: string;                   // ISO 8601
  sessionFee: number;                  // 699
}
```

localStorage key: `slb_bookings_{userId}` → `Booking[]`

### AISizeFinder Input/Output

```typescript
interface SizeFinderInput {
  mode: 'measurements' | 'height_weight' | 'existing_garment' | 'body_shape_fit';
  garmentType: string;                 // e.g. 'Saree', 'Lehenga', 'Kurta'
  measurements?: Partial<SizeProfile>; // for 'measurements' mode
  height?: number;
  weight?: number;
  existingGarment?: {
    type: string;
    brand: string;
    sizeLabel: string;
    fitDescription: string;
  };
  bodyShape?: 'Hourglass' | 'Pear' | 'Apple' | 'Rectangle' | 'Inverted Triangle';
  fitPreference?: 'Loose' | 'Regular' | 'Tailored' | 'Slim' | 'Comfort';
}

interface SizeRecommendation {
  size: string;                        // e.g. 'M', 'L', '38', '2XL'
  confidence: number;                  // 0–100
  explanation: string;                 // 20–80 words
  alternatives: { size: string; note: string }[]; // up to 2 when confidence < 75
  fitZones: {
    [zone: string]: 'tight' | 'good' | 'loose';
    // zones: bust, waist, hip, shoulder, sleeve, neck, thigh
  };
}
```

### FollowedStores

```typescript
// localStorage key: slb_followed_stores_{userId}
type FollowedStores = { [storeId: string]: boolean };
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Measurement round-trip preserves values and unit

*For any* numeric measurement value `x` and unit `u` (`"cm"` or `"inches"`), creating a Size_Profile with that value and unit, then reading it back from localStorage, should return a value equal to `x` and unit equal to `u` — with no silent conversion performed.

**Validates: Requirements 1.4, 1.5, 2.3**

---

### Property 2: Unit display conversion correctness

*For any* measurement value `x` stored in `"cm"`, the value displayed after toggling to `"inches"` should equal `round(x * 0.3937, 1)`. Conversely, *for any* value `x` stored in `"inches"`, the value displayed after toggling to `"cm"` should equal `round(x * 2.54, 1)`.

**Validates: Requirements 2.1, 2.2**

---

### Property 3: Exactly one default profile invariant

*For any* user's list of Size_Profiles (with one or more profiles), after calling `setDefault(userId, profileId)`, exactly one profile in the resulting list should have `is_default: true` — and it should be the profile with the given `profileId`. If the list is empty after a delete, no profile should have `is_default: true`.

**Validates: Requirements 1.6, 1.11**

---

### Property 4: Profile name validation invariant

*For any* candidate profile name string `s`, the validation function should accept it if and only if `s.length >= 1 && s.length <= 40 && !existingNames.includes(s)`. Any other string must be rejected with an inline validation error.

**Validates: Requirements 1.9, 1.10**

---

### Property 5: Non-numeric and out-of-range inputs rejected

*For any* string `s` entered in a measurement field, the form should reject it if `s` is not parseable as a finite number, or if the parsed value falls outside `[1, 500]` cm (or the equivalent inch bounds `[0.4, 196.9]`). The form must not submit while any field contains a rejected value.

**Validates: Requirements 2.4, 2.5**

---

### Property 6: Order object includes selected size profile ID

*For any* checkout submission where a user has selected a Size_Profile with id `pid`, the order object written to localStorage should contain `selectedSizeProfileId === pid`. If no profile is selected (no profiles exist), the order object may omit this field without blocking submission.

**Validates: Requirements 3.4, 3.5**

---

### Property 7: AI recommendation confidence is bounded to [0, 100]

*For any* valid `SizeFinderInput`, the `sizingEngine.recommend()` function should return a `confidence` value in the closed interval `[0, 100]`.

**Validates: Requirements 5.2**

---

### Property 8: Confidence threshold gates mode capabilities

*For any* `SizeFinderInput` using `"height_weight"` mode, `confidence` should be `<= 60`. *For any* input using `"body_shape_fit"` mode without additional measurements, `confidence` should be `<= 55`. *For any* input producing `confidence < 20`, no `size` recommendation should be returned in the output.

**Validates: Requirements 5.1, 5.7, 5.8**

---

### Property 9: Fit explanation word count is bounded

*For any* valid input that produces a recommendation, the `explanation` string should have a word count in `[20, 80]`.

**Validates: Requirements 5.4**

---

### Property 10: Store filter produces a subset matching the filter tag

*For any* store list and any non-"All" `StoreFilter` value `f`, the filtered result should contain only stores where `shop.tags` (or the derived field used for categorisation) includes `f`. The "All" filter should return the complete unfiltered list.

**Validates: Requirements 6.7, 6.8, 7.3**

---

### Property 11: Store card renders all required display fields

*For any* shop object with the fields defined in the data model, the rendered `StoreCard` string/DOM should include the store name, city, rating, follower count, product count, at least one category tag, and the store description excerpt.

**Validates: Requirements 6.3**

---

### Property 12: Follow-toggle round-trip

*For any* authenticated user and any store, the sequence (follow → unfollow) should result in `slb_followed_stores_{userId}[storeId]` being falsy, and the displayed follower count returning to the original value. A single follow toggle should change the stored follow state and update the displayed count by exactly ±1.

**Validates: Requirements 6.5**

---

### Property 13: Search filter triggers at two or more characters

*For any* search string `q` with `q.length < 2`, `filterShops(q, allShops)` should return `allShops` unchanged. *For any* `q` with `q.length >= 2`, the result should contain only stores whose `name` or `city` (case-insensitive) includes `q`.

**Validates: Requirements 7.4, 7.5**

---

### Property 14: Booking confirmation requires Step 5

*For any* booking state where `currentStep !== 5`, the "Pay ₹699" payment trigger should be inaccessible (button not rendered or disabled). Payment can only be initiated from Step 5.

**Validates: Requirements 8.7**

---

### Property 15: Persisted booking contains all required fields

*For any* completed booking flow, the object written to `slb_bookings_{userId}` should contain non-null values for all required fields: `bookingId`, `storeId`, `storeName`, `appointmentIST`, `timezone`, `status === 'pending'`, `sessionFee === 699`, `googleMeetLink === null`, `createdAt`.

**Validates: Requirements 8.8**

---

### Property 16: Booking sort order is descending by appointment time

*For any* list of bookings with different `appointmentIST` values, `sortBookings(bookings)` should return a list where `bookings[i].appointmentIST >= bookings[i+1].appointmentIST` for all valid `i`.

**Validates: Requirements 9.1**

---

### Property 17: Cancellation policy enforced by time delta

*For any* booking, `cancellationAllowed(booking)` should return `true` if and only if `(new Date(booking.appointmentIST) - Date.now()) > 48 * 60 * 60 * 1000`. Attempting to cancel a booking where this condition is `false` should leave the booking status unchanged.

**Validates: Requirements 9.5, 9.6**

---

### Property 18: Google Meet URL validation

*For any* string `url`, `isValidMeetUrl(url)` should return `true` if and only if `url` matches the regex `/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/`. No other URL format should be accepted.

**Validates: Requirements 10.4**

---

### Property 19: Delivery date range is always [today+7, today+14]

*For any* rendering of the Luxury Checkout order summary, the estimated delivery date minimum should be `today + 7 calendar days` and the maximum should be `today + 14 calendar days`, where "today" is `new Date()` at render time.

**Validates: Requirements 11.8**

---

### Property 20: Logout clears all user-scoped feature data

*For any* userId with data stored under `slb_size_profiles_{userId}` and `slb_bookings_{userId}`, calling `AuthContext.logout()` should result in both keys being absent from localStorage.

**Validates: Requirements 14.3**

---

## Error Handling

### localStorage Failures

All localStorage reads and writes are wrapped in try/catch (via `useLocalStorage` hook). On quota exceeded or private-mode restrictions, the feature degrades gracefully:
- Size profiles: show a toast "Unable to save — storage may be full" and keep the UI state in React state for the session
- Bookings: show a toast; prevent navigation to confirmation screen
- Followed stores: optimistic update reverts if write fails

### API / Network Failures

`fetchShops()` and `fetchProducts()` already return `[]` on error (see `api.js`). New components treat `[]` as the signal to use mock data, maintaining existing fallback chains.

### Form Validation Errors

All form errors are displayed inline (adjacent to the affected field) using `AnimatePresence`-wrapped error messages. No full-page error states are used for validation; those are reserved for unrecoverable failures (e.g., route not found).

### Authentication Edge Cases

- If a user's token expires mid-session, `AuthContext.isLoggedIn` becomes `false`. Protected feature pages (SizeProfileManager, BookingDashboard) check `isLoggedIn` on mount and redirect to `/login?returnTo=<currentPath>`.
- The `LiveBookingFlow` checks `isLoggedIn` at every step transition beyond step 1.

### AI Size Finder Insufficient Data

When `confidence < 20`, the `AISizeFinder` renders:
> "We don't have enough information to make a confident recommendation. Please add more measurements or try a different input mode."

No size label is emitted. The "Add this size to cart" button is hidden.

### Admin Booking URL Validation

If the Meet URL doesn't match the required pattern, the Confirm button is disabled and an inline error appears below the field. The booking status is NOT changed until a valid URL is provided and Confirm is clicked.

---

## Testing Strategy

### Approach

This feature set uses a dual testing approach:
- **Unit tests** (Jest + React Testing Library) for component behaviour, form validation logic, and service functions
- **Property-based tests** (fast-check) for the pure utility functions (`sizingEngine`, `sizeProfileService`, `bookingService`, validation helpers)

The property-based testing library is **fast-check** (already compatible with Jest; no new test framework needed).

### Property-Based Tests

Each correctness property from the section above maps to one `fc.assert(fc.property(...))` test. Tests run with a minimum of **100 iterations** each (fast-check default is 100).

Tag format in test files:
```js
// Feature: shoplivebharat-premium-expansion, Property N: <property_text>
test('Property N: <title>', () => {
  fc.assert(fc.property(/* arbitraries */, /* predicate */), { numRuns: 100 });
});
```

**Test file locations:**

| Source file | Test file |
|-------------|-----------|
| `src/services/sizeProfileService.js` | `src/services/sizeProfileService.pbt.test.js` |
| `src/services/bookingService.js` | `src/services/bookingService.pbt.test.js` |
| `src/lib/sizingEngine.js` | `src/lib/sizingEngine.pbt.test.js` |
| `src/utils/validators.js` | `src/utils/validators.pbt.test.js` |

**Arbitraries used:**
- Measurement values: `fc.float({ min: 0.1, max: 600 })` — intentionally includes out-of-range values to test rejection
- Profile names: `fc.string({ minLength: 0, maxLength: 50 })` — includes empty and over-40 to test rejection
- Booking objects: `fc.record({ bookingId: fc.uuidV4(), storeId: fc.string(), ... })`
- Step numbers: `fc.integer({ min: 1, max: 5 })`
- Timestamps: `fc.date({ min: new Date(), max: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) })`

### Unit Tests

Unit tests cover:
- `SizeProfileForm`: field rendering, inline error display, submit disabled while errors present
- `AISizeFinder`: tab switching, "use saved profile" pre-fill, recommendation display conditional on confidence
- `StoreCard`: verified badge conditional, follow button auth guard, hover panel keyboard accessibility
- `LiveBookingFlow`: step navigation, auth redirect at step 2+, pay button only on step 5
- `BookingDashboard`: countdown only for confirmed within-24hr bookings, cancel button disabled for <48hr bookings
- `AdminBookingsPanel`: Meet URL validation, confirm atomicity, reminder toast
- `LuxuryCheckout`: coupon valid/invalid states, size profile section presence, trust badge row, delivery date calculation

### Integration Tests

Integration tests verify the full data flow for the two most critical paths:

1. **Size profile create → checkout integration:** Create a profile → navigate to checkout → verify profile appears in selector → place order → verify `selectedSizeProfileId` in stored order
2. **Live booking end-to-end:** Navigate through all 5 steps → trigger payment → verify booking in localStorage → navigate to `/account/bookings` → verify booking appears

### Accessibility Verification

Manual testing checklist per WCAG 2.1 AA:
- All icon-only buttons have `aria-label`
- Modal dialogs trap focus (verified with axe-core)
- Countdown timer uses `aria-live="polite"`
- All form fields have associated `<label>` elements
- `prefers-reduced-motion` disables animations (verified by mocking media query in tests)

---

## New Files Summary

```
src/
├── services/
│   ├── sizeProfileService.js         # CRUD + setDefault + list for Size_Profiles
│   ├── bookingService.js             # save + list + update + listAll (admin)
│   └── sizingEngine.js               # recommend() pure function
├── utils/
│   └── validators.js                 # isValidMeetUrl, isValidMeasurement, isValidProfileName
├── components/
│   ├── SizeProfile/
│   │   ├── SizeProfileForm.jsx
│   │   ├── SizeProfileCard.jsx
│   │   └── SizeProfileSelector.jsx   # inline checkout selector
│   ├── AISizeFinder/
│   │   ├── AISizeFinder.jsx
│   │   ├── ConfidenceRing.jsx
│   │   └── BodySilhouette.jsx
│   ├── Store/
│   │   ├── StoreCard.jsx
│   │   ├── StoreDiscoverySection.jsx
│   │   └── StoreFilterPills.jsx
│   ├── Booking/
│   │   ├── BookingProgressBar.jsx
│   │   ├── BookingCard.jsx
│   │   └── steps/
│   │       ├── StoreSelector.jsx
│   │       ├── ProductPicker.jsx
│   │       ├── AppointmentForm.jsx
│   │       ├── TimezoneSelector.jsx
│   │       └── ReviewAndPay.jsx
│   └── Checkout/
│       ├── GlassCard.jsx
│       ├── CouponField.jsx
│       └── TrustBadgeRow.jsx
└── pages/
    ├── account/
    │   ├── SizeProfiles.jsx          # new page, lazy-loaded
    │   └── Bookings.jsx              # new page, lazy-loaded
    └── LiveShopping.jsx              # replaces existing (new flow)
```

### Modified Files

| File | Change |
|------|--------|
| `src/App.js` | Add lazy routes: `/account/size-profiles`, `/account/bookings` |
| `src/pages/HomePage.jsx` | Insert `<StoreDiscoverySection />` between How It Works and New Arrivals |
| `src/pages/ShopsDirectory.jsx` | Refactor to use `StoreCard` + `StoreFilterPills` + search |
| `src/pages/Checkout.jsx` | Add visual layer (GlassCard, CouponField, TrustBadgeRow, SizeProfileSelector, payment tile styles) |
| `src/pages/admin/Bookings.jsx` | Extend with Meet link, postpone, reminder columns |
| `src/contexts/AuthContext.jsx` | Extend `logout()` to clear `slb_size_profiles_*` + `slb_bookings_*` |
| `src/components/Footer.jsx` | Add accordion behaviour for mobile `< 640px` |
