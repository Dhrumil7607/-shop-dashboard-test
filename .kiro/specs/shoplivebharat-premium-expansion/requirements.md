# Requirements Document

## Introduction

ShopLiveBharat is an Indian ethnic fashion marketplace with a React 18 / Tailwind CSS / Framer Motion frontend, an existing auth system (AuthContext), CartContext, CurrencyContext (8 currencies), MarketplaceLayout wrapper, and a mock localStorage-based backend. This Phase 1 premium expansion adds six interconnected feature areas on top of the current codebase without replacing any existing checkout logic, payment flows, or admin infrastructure:

1. **Women's Smart Size Profile** — detailed body-measurement profiles stored per user, surfaced at checkout.
2. **AI Size Finder** — a client-side recommendation engine that maps inputs (measurements, garment, body shape, fit preference) to a size recommendation with confidence and fit commentary.
3. **Shop by Stores Experience** — a premium store-discovery section on the HomePage and an enhanced `/shops` page.
4. **Live Video Shopping Page** — a redesigned `/live-shopping` booking flow with per-store session selection, timezone awareness, payment (₹699), Google Meet link delivery, a customer dashboard, and an admin booking manager.
5. **Luxury Checkout Redesign** — a purely visual upgrade of the existing `/checkout` page; all existing logic, CartContext integration, and payment methods remain unchanged.
6. **Mobile Responsiveness Polish** — systematic 320 px–768 px compliance across every page and component.

---

## Glossary

- **Size_Profile_Manager**: The frontend component and associated localStorage service responsible for creating, reading, updating, deleting, and selecting named body-measurement profiles.
- **Size_Profile**: A named, user-owned JSON object containing a validated set of body measurements and a unit preference (cm or inches).
- **AI_Size_Finder**: The client-side size-recommendation component that uses a deterministic rules-based algorithm to map user inputs to garment size recommendations.
- **Confidence_Ring**: An animated circular SVG progress indicator that visualises the recommendation confidence percentage.
- **Body_Silhouette**: A 3D-style animated SVG body outline used within the AI Size Finder to highlight fit areas.
- **Store_Card**: A rich UI card component that displays a store's banner, logo, metadata, and interactive controls (follow, hover-preview).
- **Store_Discovery_Section**: The premium section inserted into the existing HomePage between the "How It Works" and "New Arrivals" sections.
- **Live_Booking_Flow**: The multi-step form at `/live-shopping` that guides a customer through store selection, product preferences, appointment scheduling, timezone selection, and payment.
- **Booking_Dashboard**: The `/account/bookings` page where a logged-in customer can view, manage, and cancel their live session bookings.
- **Admin_Bookings_Panel**: The existing `/admin/bookings` page extended with Google Meet link management, postponement controls, and reminder-email triggers.
- **Luxury_Checkout**: The visually redesigned rendering of the existing Checkout component; it uses the identical CartContext, CurrencyContext, and form submission handlers.
- **Glass_Card**: A semi-transparent, backdrop-blurred card component used in the Luxury Checkout order-summary sidebar.
- **Coupon_Field**: The discount-code input field within the Luxury Checkout, enhanced with an animated success/error reveal.
- **Tap_Target**: Any interactive element (button, link, input, toggle) rendered on a mobile viewport; it must have a minimum touch area of 44 × 44 px per WCAG 2.5.8.
- **SizeUnit**: An enum value of either `"cm"` or `"inches"` representing the user's preferred measurement unit.
- **FitPreference**: An enum value of one of `"Loose"`, `"Regular"`, `"Tailored"`, `"Slim"`, or `"Comfort"`.
- **BodyShape**: An enum value of one of `"Hourglass"`, `"Pear"`, `"Apple"`, `"Rectangle"`, or `"Inverted Triangle"`.
- **BookingStatus**: An enum value of one of `"pending"`, `"confirmed"`, `"completed"`, `"cancelled"`, or `"postponed"`.
- **StoreFilter**: An enum value of one of `"Trending"`, `"New"`, `"Luxury"`, `"Wedding Specialists"`, `"Regional"`, or `"Featured"`.

---

## Requirements

### Requirement 1: Size Profile Creation and Management

**User Story:** As a registered customer, I want to create and save multiple named body-measurement profiles (e.g., "Wedding", "Casual"), so that I can quickly select the right measurements when shopping for different occasions.

#### Acceptance Criteria

1. WHEN a logged-in user navigates to `/account/size-profiles`, THE Size_Profile_Manager SHALL render a page listing all saved Size_Profiles for that user.
2. WHEN a logged-in user submits a valid new-profile form, THE Size_Profile_Manager SHALL persist the Size_Profile to localStorage under the key `slb_size_profiles_{userId}` and display the new profile in the list without a full page reload.
3. THE Size_Profile_Manager SHALL accept all of the following fields for each profile: `profile_name`, `height`, `weight`, `bust`, `waist`, `hip`, `shoulder_width`, `sleeve_length`, `arm_circumference`, `neck`, `thigh`, `calf`, `inseam`, `kurti_length`, `blouse_length`, `lehenga_waist`, `lehenga_length`, `saree_fall_preference` (text), `dupatta_length_preference` (text), and `unit` (SizeUnit).
4. WHEN a user sets `unit` to `"inches"`, THE Size_Profile_Manager SHALL accept numeric inputs in inches and SHALL store the value in the selected unit without silent conversion.
5. WHEN a user sets `unit` to `"cm"`, THE Size_Profile_Manager SHALL accept numeric inputs in centimetres and SHALL store the value in the selected unit without silent conversion.
6. WHEN a user marks a Size_Profile as default, THE Size_Profile_Manager SHALL update `is_default: true` on that profile and `is_default: false` on all other profiles belonging to the same user.
7. THE Size_Profile_Manager SHALL allow a user to maintain up to 10 named Size_Profiles simultaneously.
8. IF a user attempts to create an 11th profile while already having 10 profiles, THEN THE Size_Profile_Manager SHALL display an inline error message stating the 10-profile limit has been reached.
9. WHEN a user renames a Size_Profile, THE Size_Profile_Manager SHALL validate that the new name is between 1 and 40 characters and is unique among the user's existing profiles.
10. IF a renamed profile's name is not unique or is empty, THEN THE Size_Profile_Manager SHALL display an inline validation error and SHALL NOT save the change.
11. WHEN a user deletes a Size_Profile that is currently marked as default, THE Size_Profile_Manager SHALL automatically designate the most-recently-created remaining profile as the new default, or set no default if no profiles remain.

---

### Requirement 2: Measurement Unit Conversion Display

**User Story:** As a customer who uses inches, I want to view my measurements in my preferred unit, so that I can enter and read values without mentally converting.

#### Acceptance Criteria

1. WHEN a user toggles the unit switch on a Size_Profile from `"cm"` to `"inches"`, THE Size_Profile_Manager SHALL recalculate and display all stored centimetre values as their inch equivalents (1 cm = 0.3937 inches, rounded to 1 decimal place).
2. WHEN a user toggles the unit switch from `"inches"` to `"cm"`, THE Size_Profile_Manager SHALL recalculate and display all stored inch values as their centimetre equivalents (1 inch = 2.54 cm, rounded to 1 decimal place).
3. THE Size_Profile_Manager SHALL persist the displayed unit preference per profile so that the next session opens with the same unit the user last selected.
4. IF a user enters a non-numeric value in any measurement field, THEN THE Size_Profile_Manager SHALL display an inline validation error on that specific field and SHALL NOT submit the form.
5. IF a user enters a measurement value outside the range 1–500 cm (or its inch equivalent), THEN THE Size_Profile_Manager SHALL display an inline validation error stating acceptable bounds.

---

### Requirement 3: Size Profile Surfacing at Checkout

**User Story:** As a customer who has saved size profiles, I want to see my default profile at checkout and optionally select a different one, so that the store receives accurate sizing information with my order.

#### Acceptance Criteria

1. WHEN a logged-in user with at least one Size_Profile arrives at the Checkout page, THE Luxury_Checkout SHALL display a "Your Size Profile" section above the payment method selection.
2. WHEN the "Your Size Profile" section is displayed, THE Luxury_Checkout SHALL default to showing the user's default Size_Profile (where `is_default: true`).
3. WHEN a user selects a different Size_Profile from a dropdown within the Checkout page, THE Luxury_Checkout SHALL update the displayed measurements immediately without disrupting cart state or form fields.
4. WHEN the user places an order, THE Luxury_Checkout SHALL include the `selectedSizeProfileId` field in the order object written to localStorage alongside the existing order structure.
5. WHERE no Size_Profile exists for the logged-in user, THE Luxury_Checkout SHALL display a prompt linking to `/account/size-profiles` to encourage profile creation, without blocking checkout completion.

---

### Requirement 4: AI Size Finder — Input Collection

**User Story:** As a customer unsure of which garment size to select, I want to input my body details through the AI Size Finder, so that I receive a personalised size recommendation with explanation.

#### Acceptance Criteria

1. WHEN a user opens the AI Size Finder, THE AI_Size_Finder SHALL present a tabbed interface with the following input modes: "Enter Measurements", "Height & Weight Only", "From Existing Garment", and "Body Shape & Fit".
2. WHEN a user selects the "Enter Measurements" tab, THE AI_Size_Finder SHALL render input fields for the same measurement fields defined in Requirement 1, Criterion 3.
3. WHEN a user selects the "Height & Weight Only" tab, THE AI_Size_Finder SHALL render input fields for height and weight only and SHALL indicate that this mode produces a lower-confidence estimate.
4. WHEN a user selects the "From Existing Garment" tab, THE AI_Size_Finder SHALL render input fields for garment type, brand size label, and fit description of the existing garment.
5. WHEN a user selects the "Body Shape & Fit" tab, THE AI_Size_Finder SHALL render a BodyShape selector (5 silhouette options) and a FitPreference selector (Loose, Regular, Tailored, Slim, Comfort).
6. WHERE a logged-in user has at least one saved Size_Profile, THE AI_Size_Finder SHALL display a "Use my saved profile" option that pre-fills the "Enter Measurements" tab with the default profile's values. WHERE no saved profile exists, THE AI_Size_Finder SHALL NOT display this option.
7. WHEN a user submits the AI Size Finder form, THE AI_Size_Finder SHALL validate that all required fields for the selected input mode are present and numeric where applicable before running the recommendation. WHERE overall validation passes but some optional fields are absent, THE AI_Size_Finder SHALL proceed to generate a recommendation with correspondingly lower confidence.
8. IF required fields are missing or invalid, THEN THE AI_Size_Finder SHALL highlight each invalid field with an inline error and SHALL NOT display a recommendation.

---

### Requirement 5: AI Size Finder — Recommendation Output

**User Story:** As a customer who has submitted measurements, I want to see a clear size recommendation with confidence level and fit explanation, so that I can confidently add the right size to my cart.

#### Acceptance Criteria

1. WHEN the AI_Size_Finder receives valid inputs and the calculated confidence is at least 20%, THE AI_Size_Finder SHALL output a recommended size label (e.g., S, M, L, XL, 2XL, or a numeric size for garment types that use numeric sizing). IF the calculated confidence is below 20%, THEN THE AI_Size_Finder SHALL display an insufficient-data message and SHALL NOT output a size recommendation.
2. THE AI_Size_Finder SHALL output a confidence percentage between 0 and 100 for each recommendation, calculated from the completeness of the measurement input and the variance of the garment's size chart against the submitted measurements.
3. THE AI_Size_Finder SHALL render a Confidence_Ring — an animated SVG arc — that fills from 0% to the calculated confidence percentage over 800 ms using a Framer Motion `animate` transition.
4. THE AI_Size_Finder SHALL display a plain-language fit explanation (minimum 20 words, maximum 80 words) describing why that size was selected.
5. THE AI_Size_Finder SHALL highlight tight or loose areas using the Body_Silhouette by colouring the relevant body zone segments with distinct indicator colours (at minimum: tight = amber, loose = blue, good fit = green).
6. THE AI_Size_Finder SHALL present up to two alternative sizes with brief explanations when the confidence percentage is below 75%.
7. WHEN the "Height & Weight Only" input mode is used, THE AI_Size_Finder SHALL cap the output confidence at 60%.
8. WHEN the "Body Shape & Fit" input mode is used without additional measurements, THE AI_Size_Finder SHALL cap the output confidence at 55%.
9. WHEN the recommendation is complete, THE AI_Size_Finder SHALL display an "Add this size to cart" button that appends the recommended size as the `size` attribute to the product currently being viewed. Sizes may also be added through other mechanisms (e.g., standard size selectors) independently of the AI recommendation process.

---

### Requirement 6: Store Discovery — Premium Store Cards

**User Story:** As a shopper browsing the homepage, I want to see richly detailed store cards that highlight each store's personality and specialties, so that I can quickly identify stores that match my taste.

#### Acceptance Criteria

1. THE Store_Discovery_Section SHALL be rendered on the HomePage between the "How It Works" section and the "New Arrivals" section.
2. WHEN the Store_Discovery_Section is rendered, THE Store_Discovery_Section SHALL fetch store data using the existing `fetchShops` API function and display up to 8 stores.
3. THE Store_Card SHALL display the following fields for each store: banner image, logo/avatar, store name, verified badge (WHERE `shop.verified === true`), city/location, star rating, follower count, product count, up to 3 category tags, up to 2 specialty tags, and a 1–2 sentence store story excerpt from `shop.description`.
4. WHEN a user hovers over a Store_Card on a non-touch device, THE Store_Card SHALL expand to reveal a hover-preview panel showing 3 featured product thumbnails and a "Visit Store" button, animated via Framer Motion with `whileHover`.
5. WHEN an authenticated user clicks the Follow button on a Store_Card, THE Store_Card SHALL toggle the follow state and persist `slb_followed_stores_{userId}` to localStorage, updating the displayed follower count by ±1 optimistically.
6. IF a user is not authenticated and clicks the Follow button, THEN THE Store_Card SHALL display a toast notification prompting login and SHALL NOT change the follow state.
7. THE Store_Discovery_Section SHALL render a horizontal filter pill row with the following options: All, Trending, New, Luxury, Wedding Specialists, Regional, Featured.
8. WHEN a user selects a StoreFilter pill, THE Store_Discovery_Section SHALL filter the displayed Store_Cards to only those matching the selected filter tag, with a smooth layout transition via Framer Motion `AnimatePresence`.
9. IF the `fetchShops` API returns an empty array, throws an error, or both conditions occur simultaneously, THEN THE Store_Discovery_Section SHALL fall back to rendering Store_Cards from the existing `MOCK_SHOPS` dataset. The fallback SHALL occur regardless of whether the empty result or error condition was encountered first.

---

### Requirement 7: Shop by Stores — Enhanced `/shops` Page

**User Story:** As a shopper browsing all stores, I want the `/shops` page to use the same premium card design, follow functionality, and filtering as the homepage Store Discovery section, so that the experience is consistent throughout the marketplace.

#### Acceptance Criteria

1. WHEN a user navigates to `/shops`, THE ShopsDirectory SHALL render store cards using the same Store_Card component defined in Requirement 6.
2. THE ShopsDirectory SHALL display all active stores returned by `fetchShops` (no 8-store cap).
3. THE ShopsDirectory SHALL include the same StoreFilter pill row defined in Requirement 6, Criterion 7.
4. THE ShopsDirectory SHALL display a search input that filters stores by name or location in real time (debounced at 300 ms).
5. WHEN a user types fewer than 2 characters in the search input, THE ShopsDirectory SHALL display all stores unfiltered and SHALL NOT apply real-time filtering until at least 2 characters have been entered.
6. WHEN the search term (2 or more characters) matches no stores, THE ShopsDirectory SHALL display an empty-state message: "No stores match your search — try a different term." All store cards SHALL be hidden.

---

### Requirement 8: Live Video Shopping — Booking Flow Redesign

**User Story:** As a customer interested in a personalised shopping consultation, I want a clear, premium multi-step booking flow that guides me through selecting a store, products, appointment details, and payment, so that I can confidently book a live session.

#### Acceptance Criteria

1. WHEN a user navigates to `/live-shopping`, THE Live_Booking_Flow SHALL render a 5-step progress indicator: (1) Choose Store, (2) Select Products, (3) Appointment Details, (4) Timezone & Schedule, (5) Review & Pay.
2. WHEN a user selects a store in Step 1, THE Live_Booking_Flow SHALL display that store's name, banner image, rating, and specialties.
3. WHEN a user proceeds to Step 2, THE Live_Booking_Flow SHALL render a searchable list of products belonging to the selected store, allowing the user to mark up to 10 products of interest.
4. WHEN a user proceeds to Step 3, THE Live_Booking_Flow SHALL render date, time-slot, and notes fields. THE Live_Booking_Flow SHALL disable past dates from the date picker.
5. WHEN a user proceeds to Step 4, THE Live_Booking_Flow SHALL render a timezone selector populated with at least the following timezones: IST, UTC, EST, PST, GMT, GST, AEST, SGT.
6. WHEN a user proceeds to Step 5, THE Live_Booking_Flow SHALL display a full booking summary including store name, selected products (up to 10), appointment date/time in both IST and the user's selected timezone, and the session fee of ₹699.
7. WHEN a user is on Step 5 and clicks "Pay ₹699", THE Live_Booking_Flow SHALL simulate payment processing (matching the existing checkout delay pattern) and then redirect to `/booking-confirmation` with the complete booking record in navigation state. THE Live_Booking_Flow SHALL NOT allow payment to be triggered from any step other than Step 5.
8. WHEN the booking is confirmed, THE Live_Booking_Flow SHALL persist the booking object to `slb_bookings_{userId}` in localStorage with fields: `bookingId`, `storeId`, `storeName`, `selectedProducts`, `appointmentIST`, `appointmentUserTz`, `timezone`, `googleMeetLink` (initially `null`), `status` (`"pending"`), `createdAt`, `sessionFee` (699).
9. WHEN a user attempts to proceed to any step beyond Step 1 and is not logged in, THE Live_Booking_Flow SHALL redirect to `/login` with a `returnTo=/live-shopping` query parameter. THE Live_Booking_Flow SHALL check authentication at every step transition beyond Step 1.

---

### Requirement 9: Live Shopping — Booking Dashboard (Customer)

**User Story:** As a customer with one or more booked live sessions, I want a dedicated bookings dashboard in my account, so that I can view session details, access Google Meet links, and manage my upcoming bookings.

#### Acceptance Criteria

1. WHEN a logged-in user navigates to `/account/bookings`, THE Booking_Dashboard SHALL render a list of all bookings stored under `slb_bookings_{userId}`, sorted by `appointmentIST` descending.
2. THE Booking_Dashboard SHALL display for each booking: store name, appointment date/time in both IST and the user's saved timezone, BookingStatus badge, Google Meet link (when status is `"confirmed"` and link is not null), and selected product thumbnails (up to 3 visible, remainder count shown).
3. WHEN a booking's `status` is `"confirmed"` and the appointment time is within 24 hours, THE Booking_Dashboard SHALL render a countdown timer showing hours, minutes, and seconds until the session. WHEN a booking's `status` is `"pending"` and the appointment time is within 24 hours, THE Booking_Dashboard SHALL NOT display a countdown timer.
4. WHEN a booking's `status` is `"pending"`, THE Booking_Dashboard SHALL display a "Pending Confirmation" state with an explanatory message.
5. WHEN a user clicks "Cancel" on a booking whose `appointmentIST` is more than 48 hours in the future, THE Booking_Dashboard SHALL update the booking's `status` to `"cancelled"` in localStorage and display a cancellation confirmation message.
6. IF a user attempts to cancel a booking whose `appointmentIST` is within 48 hours, THEN THE Booking_Dashboard SHALL display an inline message stating that cancellations within 48 hours are not permitted and SHALL NOT modify the booking status.
7. WHEN a booking's `status` is `"postponed"`, THE Booking_Dashboard SHALL display the original appointment time struck through and the new appointment time highlighted.

---

### Requirement 10: Live Shopping — Admin Booking Management

**User Story:** As an admin, I want to manage all live session bookings from the existing admin panel, so that I can confirm sessions, add Google Meet links, postpone appointments, and trigger reminder emails.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/bookings`, THE Admin_Bookings_Panel SHALL display all bookings across all users, sourced from all `slb_bookings_*` localStorage keys, in a sortable table.
2. THE Admin_Bookings_Panel SHALL display the following columns: Booking ID, Customer Name, Store, Appointment (IST), Status, Google Meet Link, and Actions.
3. WHEN an admin enters a Google Meet URL in the link field for a `"pending"` booking and clicks "Confirm", THE Admin_Bookings_Panel SHALL update the booking's `status` to `"confirmed"` and persist the `googleMeetLink` atomically, then display a success toast. THE Admin_Bookings_Panel SHALL display the success toast only if both the status update and the link save succeed.
4. IF the entered Google Meet URL does not match the pattern `https://meet.google.com/[a-z]{3}-[a-z]{4}-[a-z]{3}`, THEN THE Admin_Bookings_Panel SHALL display an inline validation error and SHALL NOT save the link.
5. WHEN an admin sets a new appointment date/time for a booking and clicks "Postpone", THE Admin_Bookings_Panel SHALL update the booking's `status` to `"postponed"`, preserve the original appointment time in `originalAppointmentIST`, and persist the new date/time as `appointmentIST`.
6. THE Admin_Bookings_Panel SHALL render a "Send Reminder" button for each `"confirmed"` booking whose appointment is within 24 hours. The button SHALL always be visible. WHEN the button is clicked and the reminder queuing succeeds, THE Admin_Bookings_Panel SHALL display a toast: "Reminder notification queued for [customer email]" (simulated). IF the reminder fails to queue, THEN THE Admin_Bookings_Panel SHALL display an error toast without hiding the button.
7. THE Admin_Bookings_Panel SHALL allow filtering bookings by BookingStatus using a dropdown selector.

---

### Requirement 11: Luxury Checkout Redesign — Visual Upgrade

**User Story:** As a customer at checkout, I want the checkout page to feel premium and trust-inspiring, so that I feel confident completing my purchase.

#### Acceptance Criteria

1. THE Luxury_Checkout SHALL preserve all existing Checkout logic: CartContext integration (`cartItems`, `getTotalPrice`, `clearCart`), all four payment method options (Card, Razorpay, PayPal, Apple Pay / Google Pay), the shipping-free-over-₹15,000 rule, the 5% tax calculation, the order-confirmation screen, and CurrencyContext formatting.
2. WHEN the order-summary sidebar is rendered in the Luxury_Checkout, THE Luxury_Checkout SHALL style the sidebar as a Glass_Card using `backdrop-filter: blur(20px)`, a semi-transparent background (`rgba(250,249,246,0.85)`), and a subtle border (`1px solid rgba(232,228,223,0.6)`). WHERE the sidebar is not rendered, these styling requirements SHALL NOT apply.
3. WHEN the cart total changes (item added or removed), THE Luxury_Checkout SHALL animate the total value update using a Framer Motion `key`-based re-mount transition with a duration of 300 ms.
4. WHEN a user hovers over a cart-item thumbnail in the order summary, THE Luxury_Checkout SHALL expand the thumbnail from 48 × 56 px to 80 × 96 px using a Framer Motion `whileHover` scale transition.
5. THE Luxury_Checkout SHALL render a Coupon_Field below the item list. WHEN a valid coupon code is entered and submitted, THE Luxury_Checkout SHALL display an animated discount badge revealing the savings amount. WHEN an invalid code is entered, THE Luxury_Checkout SHALL shake the input field using a Framer Motion keyframe animation.
6. THE Luxury_Checkout SHALL display payment method cards as visually styled radio-button tiles with brand-appropriate accent colours: Card (navy), Razorpay (blue), PayPal (gold), Apple Pay (black).
7. THE Luxury_Checkout SHALL render a trust-badge row beneath the "Place Order" button containing: "256-bit SSL Encrypted", "Authentic Indian Stores", "Worldwide Shipping", and "Easy Returns".
8. THE Luxury_Checkout SHALL display an estimated delivery date range (current date + 7 days to current date + 14 days) in the order summary sidebar.
9. WHEN the cart subtotal qualifies for free shipping (≥ ₹15,000), THE Luxury_Checkout SHALL animate a savings highlight badge revealing "You saved ₹499 on shipping" using a Framer Motion slide-in transition.

---

### Requirement 12: Mobile Responsiveness — Minimum Tap Target and Overflow

**User Story:** As a mobile shopper using a device as narrow as 320 px, I want all interactive elements to be easily tappable and all content to fit within the screen, so that I can browse and shop without frustration.

#### Acceptance Criteria

1. THE MarketplaceLayout navbar SHALL render correctly and without horizontal overflow across ALL viewport sizes, with particular attention to the 320 px–768 px mobile range.
2. WHEN rendered on a viewport narrower than 1024 px, THE MarketplaceLayout SHALL display the hamburger menu button and collapse the desktop navigation links.
3. THE MarketplaceLayout mobile menu SHALL render the CurrencySelector, all navigation links, and the "Become a Seller" link as stacked, full-width tap targets each with a minimum height of 44 px.
4. EVERY interactive element (button, link, form input, select, toggle, icon button) across ALL pages SHALL have a minimum touch area of 44 × 44 px on mobile viewports, verified by the presence of appropriate padding or an `aria-label`-backed invisible touch region.
5. NO page or section SHALL produce horizontal scroll at any viewport width, including at the minimum of 320 px. This applies to all new components introduced in Requirements 1–11 as well as the existing HomePage, Marketplace, ProductDetail, Cart, Checkout, ShopsDirectory, and LiveShopping pages.
6. WHEN rendered on a viewport narrower than 640 px, product-grid layouts SHALL switch to a 2-column grid.
7. WHEN rendered on a viewport narrower than 480 px, the Live_Booking_Flow multi-step form SHALL stack all input fields to single-column and SHALL render the progress indicator as a compact numbered badge row rather than a full-width progress bar.
8. WHEN rendered on a viewport narrower than 640 px, the Size_Profile_Manager form SHALL stack all measurement input pairs to single-column.
9. WHEN rendered on a viewport narrower than 640 px, the Luxury_Checkout SHALL stack the form and the Glass_Card order-summary into a single column, with the Glass_Card appearing below the form.
10. ALL touch interactions (swipe, tap, pinch) on cards and carousels introduced in Requirements 6 and 7 SHALL use pointer-events and touch-action CSS correctly to avoid interfering with native browser scroll.

---

### Requirement 13: Mobile Responsiveness — Footer, Typography, and Imagery

**User Story:** As a mobile shopper, I want the footer, text sizes, and images to adapt gracefully to small screens, so that the page remains readable and visually balanced on my phone.

#### Acceptance Criteria

1. THE Footer SHALL render in a single-column stacked layout on viewports narrower than 640 px, with all link groups collapsed by default and expandable via tap.
2. WHEN the Footer renders on a viewport narrower than 640 px, each footer link group header SHALL function as an accordion toggle with a minimum 44 × 44 px tap area.
3. THE Store_Card banner images SHALL use `object-fit: cover` and SHALL maintain their aspect ratio on all viewport sizes without distortion.
4. THE Body_Silhouette SVG SHALL scale responsively within its container using `viewBox` and SHALL not overflow on viewports narrower than 360 px.
5. WHEN the AI_Size_Finder renders on a viewport narrower than 640 px, the tab selector SHALL render as a scrollable horizontal chip row rather than a fixed-width row that may overflow.
6. THE Booking_Dashboard booking cards SHALL render in a single-column layout on viewports narrower than 640 px, with the countdown timer displayed prominently at the top of each card.

---

### Requirement 14: Data Persistence and Context Integration

**User Story:** As a developer integrating the new features, I want all new data to follow the existing localStorage and context patterns established in AuthContext and CartContext, so that the codebase remains architecturally consistent.

#### Acceptance Criteria

1. THE Size_Profile_Manager SHALL read and write exclusively to `localStorage` under the key pattern `slb_size_profiles_{user.id}`, consistent with the `slb_user` and `slb_cart` patterns used by existing contexts.
2. THE Live_Booking_Flow SHALL read and write booking records exclusively to `localStorage` under the key pattern `slb_bookings_{user.id}`.
3. WHEN a user logs out via `AuthContext.logout()`, THE Size_Profile_Manager and Booking_Dashboard SHALL clear their respective user-scoped localStorage keys for that session, so that another user logging in on the same device does not see the previous user's data.
4. ALL new pages (Size Profile Manager, Booking Dashboard) SHALL be wrapped in `MarketplaceLayout` and SHALL be added as lazy-loaded routes in `App.js`, following the existing pattern established by `Account`, `Orders`, and `LiveShopping`.
5. ALL new admin pages or extensions SHALL be wrapped in `ProtectedAdminRoute` and follow the existing admin route pattern in `App.js`.
6. THE Store_Card follow-state SHALL be persisted to `localStorage` under the key `slb_followed_stores_{user.id}` and SHALL be re-hydrated on component mount from localStorage, consistent with the pattern used by CartContext.
7. WHEN the CurrencyContext `formatPrice` function is available, ALL monetary values displayed in new feature components SHALL be formatted using `formatPrice` rather than raw `₹` string literals, with the exception of the live session fee hard-coded label "Pay ₹699" which serves as a marketing-facing price and SHALL use `formatPrice(699)`.

---

### Requirement 15: Accessibility and Animation Quality

**User Story:** As a user with assistive technology or motion sensitivity, I want all new animated and interactive components to be accessible and respectful of system preferences, so that I can use the platform comfortably.

#### Acceptance Criteria

1. ALL interactive elements introduced in Requirements 1–13 SHALL have descriptive `aria-label` attributes where the visible label is absent (e.g., icon-only buttons).
2. THE Confidence_Ring animation SHALL respect the `prefers-reduced-motion` CSS media query: WHEN `prefers-reduced-motion: reduce` is set, THE Confidence_Ring SHALL render at the final value without animating.
3. THE Body_Silhouette zone colouring transitions SHALL respect `prefers-reduced-motion: reduce` and render in final colour state without transition when the preference is set.
4. ALL modal dialogs and overlay panels introduced in Requirements 1–11 SHALL trap focus while open and SHALL release focus to the triggering element upon close, per ARIA authoring practices.
5. THE Store_Card hover-preview panel SHALL be keyboard-accessible: WHEN a keyboard user focuses a Store_Card and presses Enter, THE Store_Card SHALL expand the hover-preview panel; WHEN the user presses Escape, THE Store_Card SHALL collapse the panel.
6. ALL form fields in the Size_Profile_Manager and Live_Booking_Flow SHALL have associated `<label>` elements (explicit `for`/`id` pairing or wrapped label pattern).
7. THE countdown timer in the Booking_Dashboard SHALL use an `aria-live="polite"` region so that screen readers announce the remaining time at a reasonable interval without overwhelming the user.
