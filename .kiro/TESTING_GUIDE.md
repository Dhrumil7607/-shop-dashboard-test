# ShopLiveBharat Testing & Debugging Guide

## Getting Started

### Prerequisites
- Node.js and npm installed
- Python 3.8+ with FastAPI
- MongoDB running locally or configured
- Both frontend and backend running

### Running the Application

#### Frontend
```bash
cd frontend
npm start
# Opens at http://localhost:3000
```

#### Backend
```bash
cd backend
python server.py
# Runs at http://localhost:8000
# API Docs at http://localhost:8000/docs
```

---

## Phase 1: Authentication Testing

### Test 1.1: User Registration

**Steps:**
1. Open http://localhost:3000/register
2. Fill in:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "TestPassword123!"
   - Confirm: "TestPassword123!"
3. Click "Create Account"

**Expected Results:**
- ✅ Password strength meter updates as you type
- ✅ Confirm password shows checkmark when matches
- ✅ Form validates all fields
- ✅ Success toast appears
- ✅ User redirects to homepage
- ✅ User menu shows logged-in state

**Mobile Check:**
- ✅ All inputs are tappable (48px+)
- ✅ Form fits on mobile screen
- ✅ No horizontal scroll
- ✅ Eye icon toggle works

---

### Test 1.2: User Login

**Steps:**
1. Open http://localhost:3000/login
2. Fill in:
   - Email: "test@example.com"
   - Password: "TestPassword123!"
3. Click "Sign In"

**Expected Results:**
- ✅ Form validates inputs
- ✅ Success toast appears
- ✅ Redirects to homepage
- ✅ User menu shows "Test User"
- ✅ Logout button appears

**Validation Tests:**
- Try invalid email → Shows error
- Try wrong password → Shows error
- Try empty fields → Shows error

---

### Test 1.3: Logout Flow

**Steps:**
1. Login first (see Test 1.2)
2. Click user icon in navbar
3. Click "Logout"

**Expected Results:**
- ✅ User menu closes
- ✅ Redirects to homepage
- ✅ User menu now shows "Login" link
- ✅ Token removed from localStorage

**Verify:**
```javascript
// In browser console
localStorage.getItem("slb_token") // Should be null
```

---

### Test 1.4: Session Persistence

**Steps:**
1. Login (see Test 1.2)
2. Close browser tab
3. Reopen http://localhost:3000

**Expected Results:**
- ✅ Still logged in
- ✅ User menu shows username
- ✅ Token still in localStorage
- ✅ /account and /orders accessible

**Test Invalid Token:**
1. In browser console:
   ```javascript
   localStorage.setItem("slb_token", "invalid_token_here")
   ```
2. Refresh page
3. Should logout automatically

---

### Test 1.5: Protected Routes

**Steps:**
1. Logout completely
2. Try to access http://localhost:3000/orders
3. Try to access http://localhost:3000/account

**Expected Results:**
- ✅ Redirects to /login
- ✅ Not accessible without login

---

## Phase 2: Navigation Testing

### Test 2.1: Desktop Navigation

**Desktop (1024px+):**
1. Open http://localhost:3000
2. Check navbar:

**Expected:**
- ✅ Logo visible and clickable
- ✅ Search bar visible and functional
- ✅ Support link visible
- ✅ Cart icon visible with count
- ✅ Account/User icon visible
- ✅ Top info bar shows (phone, email, location)

**Navigation Check:**
- ✅ Logo → Home
- ✅ Support → /contact
- ✅ Cart → /cart
- ✅ Account dropdown works
- ✅ Account → /account
- ✅ Orders → /orders

---

### Test 2.2: Mobile Navigation

**Mobile (375px):**
1. Open http://localhost:3000 on mobile or use DevTools
2. Check navbar:

**Expected:**
- ✅ Logo visible
- ✅ Hamburger menu visible
- ✅ No top info bar
- ✅ No search bar in header
- ✅ No desktop nav items

**Mobile Menu:**
1. Click hamburger icon
2. Menu should slide down with:
   - ✅ Search bar
   - ✅ Home
   - ✅ Shop
   - ✅ Collections
   - ✅ All Shops
   - ✅ Contact
   - ✅ Cart
   - ✅ Login/Account section

3. Click a link → Menu closes

---

### Test 2.3: Responsive Breakpoints

**Test at these widths:**
- 320px (Mobile XS)
- 375px (iPhone SE)
- 768px (Tablet)
- 1024px (Desktop)
- 1440px (Large Desktop)

**Checklist at each size:**
- ✅ No horizontal scroll
- ✅ Text readable (min 16px)
- ✅ Touch targets 48px+ (mobile)
- ✅ Images responsive
- ✅ Layout doesn't break
- ✅ Forms accessible

---

## Phase 3: Marketplace Testing

### Test 3.1: Product Listing

**Steps:**
1. Open http://localhost:3000
2. Wait for products to load

**Expected:**
- ✅ Products display in grid
- ✅ Product cards show:
  - ✅ Image
  - ✅ Name
  - ✅ Price
  - ✅ Category
  - ✅ "Add to Cart" button
- ✅ 3 columns on desktop, 2 on tablet, 1 on mobile

**Search Test:**
1. Enter text in search bar
2. Click search or press Enter

**Expected:**
- ✅ URL updates with search param
- ✅ Products filter correctly
- ✅ Results show count

**Filter Test:**
1. Click "Filters" button on mobile or use sidebar
2. Try each filter:
   - Sort By
   - Category
   - Price Range

**Expected:**
- ✅ Products update instantly
- ✅ Multiple filters can be combined
- ✅ "Reset Filters" button works

---

### Test 3.2: Product Detail

**Steps:**
1. Click on any product card
2. View product detail page

**Expected:**
- ✅ URL shows `/product/{id}`
- ✅ Product image displays
- ✅ Product name, price visible
- ✅ Description displays
- ✅ "Add to Cart" button works
- ✅ Quantity selector works
- ✅ Back button works

**Mobile:**
- ✅ Image takes full width
- ✅ Text readable
- ✅ "Add to Cart" button tappable

---

### Test 3.3: Shopping Cart

**Steps:**
1. Add multiple products to cart
2. Click cart icon or navigate to /cart

**Expected:**
- ✅ All items display
- ✅ Each item shows:
  - ✅ Product image
  - ✅ Product name
  - ✅ Price
  - ✅ Quantity selector (+/-)
  - ✅ Remove button
- ✅ Subtotal calculates correctly
- ✅ Shipping info visible
- ✅ Cart count updates in navbar

**Update Quantity:**
1. Click + or - buttons
2. Watch quantity and totals update

**Expected:**
- ✅ Updates without page reload
- ✅ Subtotal recalculates
- ✅ Cart badge updates

**Remove Item:**
1. Click remove button
2. Item disappears

**Expected:**
- ✅ Item removed instantly
- ✅ Subtotal updates
- ✅ Cart badge updates

---

### Test 3.4: Cart Persistence

**Steps:**
1. Add items to cart
2. Close browser tab
3. Reopen http://localhost:3000/cart

**Expected:**
- ✅ Cart items still there
- ✅ Quantities intact
- ✅ Totals correct

**Verify:**
```javascript
// In browser console
localStorage.getItem("cart") // Should have items
```

---

## Phase 4: Account & Orders Testing

### Test 4.1: Account Profile

**Prerequisites:** Must be logged in

**Steps:**
1. Click user icon → "My Account"
2. Or navigate to http://localhost:3000/account

**Expected:**
- ✅ Profile form displays
- ✅ Shows user name, email, phone, city
- ✅ All fields disabled by default
- ✅ "Edit" button visible

**Edit Profile:**
1. Click "Edit" button
2. Change name and phone
3. Click "Save Changes"

**Expected:**
- ✅ Fields become editable
- ✅ Edit button changes to "Cancel"
- ✅ Save button appears
- ✅ Success toast appears
- ✅ Form reverts to disabled state
- ✅ Updated data saves to backend

**Mobile:**
- ✅ Form fits on screen
- ✅ Inputs are tappable
- ✅ No horizontal scroll

---

### Test 4.2: Orders Page

**Prerequisites:** Account with orders created (backend)

**Steps:**
1. Click user icon → "My Orders"
2. Or navigate to http://localhost:3000/orders

**Expected:**
- ✅ Page title shows "My Orders"
- ✅ List displays each order with:
  - ✅ Order ID
  - ✅ Order date
  - ✅ Total amount
  - ✅ Status badge (color-coded)
  - ✅ "View Details" link

**Status Colors:**
- Pending: Yellow
- Processing: Blue
- Shipped: Purple
- Delivered: Green
- Cancelled: Red

**No Orders Test:**
1. Create new account
2. Go to /orders without placing order

**Expected:**
- ✅ "No orders yet" message
- ✅ "Start shopping" link works

---

## Phase 5: Admin Testing

### Test 5.1: Admin Login

**Steps:**
1. Open http://localhost:3000/admin/login
2. Enter admin key (from backend configuration)
3. Click "Login"

**Expected:**
- ✅ Validates key
- ✅ Success toast appears
- ✅ Redirects to /admin/dashboard
- ✅ Key stored in localStorage

**Invalid Key Test:**
1. Try random key → Should show error
2. Try empty key → Should show error

---

### Test 5.2: Admin Dashboard

**Prerequisites:** Must be logged in as admin

**Steps:**
1. Navigate to http://localhost:3000/admin/dashboard
2. Check all sections load

**Expected:**
- ✅ Key metrics display
- ✅ Charts render
- ✅ Recent items lists populated
- ✅ All navigation links visible

**Mobile Admin:**
- ✅ Sidebar collapses to hamburger
- ✅ Main content full width
- ✅ All widgets stack on mobile

---

### Test 5.3: Admin Products

**Steps:**
1. Click "Products" in admin sidebar
2. Navigate to /admin/products

**Expected:**
- ✅ Table displays all products
- ✅ Each row shows:
  - ✅ Product image
  - ✅ Name
  - ✅ Category
  - ✅ Price
  - ✅ Stock
  - ✅ Status (Active/Inactive)
  - ✅ Edit button
  - ✅ Delete button

**Add Product:**
1. Click "Create Product" button
2. Fill in form (name, price, category, etc.)
3. Upload image
4. Click "Create"

**Expected:**
- ✅ Form validates all fields
- ✅ Image uploads successfully
- ✅ Success toast appears
- ✅ New product appears in table
- ✅ Product visible on marketplace immediately

**Edit Product:**
1. Click edit button on any product
2. Change name and price
3. Click "Save"

**Expected:**
- ✅ Fields become editable
- ✅ Changes save to backend
- ✅ Updates visible on marketplace immediately
- ✅ Success toast shows

**Delete Product:**
1. Click delete button
2. Confirm deletion

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Product removed from table
- ✅ No longer visible on marketplace
- ✅ Success toast shows

---

### Test 5.4: Admin Shops

**Steps:**
1. Click "Shops" in admin sidebar
2. Navigate to /admin/shops

**Expected:**
- ✅ Table displays all shops
- ✅ Each row shows:
  - ✅ Shop name
  - ✅ Owner name
  - ✅ City
  - ✅ Status
  - ✅ Edit/Delete buttons

**Similar tests as Products:**
- Add shop → Appears in list
- Edit shop → Changes save
- Delete shop → Removed from list

---

## Phase 6: Mobile Responsiveness Audit

### Checklist for All Pages

**Typography:**
- [ ] Headings readable (min 24px on mobile)
- [ ] Body text readable (min 16px)
- [ ] Line height sufficient

**Layout:**
- [ ] No horizontal scroll
- [ ] No overlapping elements
- [ ] Proper spacing maintained
- [ ] Images fit properly

**Buttons & Forms:**
- [ ] Buttons 48px+ tall
- [ ] Form inputs 44px+ tall
- [ ] Proper padding between elements
- [ ] Easy to tap on mobile

**Specific Pages:**

#### Homepage
- [ ] Hero section responsive
- [ ] Featured collections stack on mobile
- [ ] CTA buttons visible and tappable
- [ ] Newsletter form works on mobile

#### Marketplace
- [ ] Search bar visible on mobile (in menu)
- [ ] Filters drawer works
- [ ] Product grid responsive (1-2-3 cols)
- [ ] No images broken
- [ ] "Add to Cart" buttons work

#### Product Detail
- [ ] Image takes full width
- [ ] Info below image on mobile
- [ ] Quantity/Cart buttons tappable
- [ ] No text cut off

#### Cart
- [ ] All items visible
- [ ] Quantity adjusters work
- [ ] Totals visible
- [ ] Checkout button prominent

#### Account
- [ ] Form fields tappable
- [ ] Edit/Save buttons work
- [ ] Menu links accessible

#### Admin
- [ ] Sidebar collapses on mobile
- [ ] Tables scroll horizontally if needed
- [ ] Forms accessible on mobile

---

## Phase 7: Debugging Guide

### Common Issues & Solutions

#### Issue: "Network Error" on API Calls

**Debug:**
1. Check backend running: `http://localhost:8000/docs`
2. Check CORS configuration
3. Check `REACT_APP_BACKEND_URL` in `.env`:
   ```
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```
4. Check browser console for full error
5. Check backend logs

**Fix:**
```python
# In backend server.py - ensure CORS enabled
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

#### Issue: User Not Staying Logged In

**Debug:**
```javascript
// Browser console
localStorage.getItem("slb_token") // Check if token exists
localStorage.getItem("slb_user") // Check if user data exists
```

**Common Causes:**
1. Token expired → Check backend JWT settings
2. Token not sent with requests → Check interceptor in `api.js`
3. Token cleared on refresh → Check AuthContext initialization

**Fix:**
- Ensure token persists in localStorage
- Check Authorization header in API calls
- Validate token on app load

---

#### Issue: Cart Not Persisting

**Debug:**
```javascript
// Browser console
localStorage.getItem("cart") // Should return JSON array
JSON.parse(localStorage.getItem("cart")) // View actual items
```

**Fix:**
- Check CartContext saves to localStorage
- Check useEffect dependency array
- Clear localStorage and try again

---

#### Issue: Images Not Loading

**Debug:**
1. Open DevTools → Network tab
2. Look for failed image requests
3. Check image URLs in database
4. Check backend serving images correctly

**Fix:**
- Ensure images uploaded to correct location
- Check file paths in database
- Verify CORS allows image serving

---

#### Issue: Form Validation Not Working

**Debug:**
1. Check browser console for errors
2. Test validation function directly
3. Check required fields marked in HTML

**Common Issues:**
- Email regex too strict
- Password requirements unclear
- Phone validation failing for certain formats

---

#### Issue: Mobile Menu Not Closing

**Debug:**
```javascript
// Check if menu state toggle works
// Click menu button → Check state updates
```

**Fix:**
- Ensure onClick handlers properly set state
- Check z-index of menu backdrop
- Ensure menu items are clickable and close menu

---

### Browser DevTools Testing

#### Console Tests
```javascript
// Check authentication
console.log(localStorage.getItem("slb_token"));
console.log(localStorage.getItem("slb_admin_key"));

// Check cart
console.log(JSON.parse(localStorage.getItem("cart")));

// Check user session
console.log(document.querySelector("[data-testid='user-menu']"));

// Watch for errors
// Open console tab and watch for errors while using app
```

#### Network Tab Tests
1. Open DevTools → Network tab
2. Perform action (login, add to cart, etc.)
3. Check:
   - ✅ All requests return 200-201
   - ✅ No failed requests (red)
   - ✅ Response times acceptable
   - ✅ Correct headers (Authorization, Content-Type)
   - ✅ Response data correct

#### Performance Tests
```javascript
// Measure page load time
console.time("pageLoad");
// ... perform action
console.timeEnd("pageLoad");

// Check for memory leaks
// Open DevTools → Memory tab
// Take heap snapshot before action
// Perform action multiple times
// Take another heap snapshot
// Detached nodes should not grow significantly
```

---

## Phase 8: Comprehensive Test Checklist

### User Flow Tests

#### Test Flow 1: Guest to Customer
- [ ] Visit homepage
- [ ] Browse marketplace
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] Prompted to login
- [ ] Click "Create Account"
- [ ] Register successfully
- [ ] Auto-logged in after registration
- [ ] Complete checkout
- [ ] Order appears in "My Orders"

#### Test Flow 2: Returning Customer
- [ ] Visit homepage
- [ ] Click "Login"
- [ ] Enter credentials
- [ ] Login successful
- [ ] Click "My Orders"
- [ ] See previous orders
- [ ] Click "My Account"
- [ ] Edit profile
- [ ] Save changes successfully

#### Test Flow 3: Admin Setup
- [ ] Go to /admin/login
- [ ] Enter admin key
- [ ] View dashboard with stats
- [ ] Go to Products
- [ ] Create new product
- [ ] Product appears on marketplace
- [ ] Edit product price
- [ ] Change reflected on marketplace
- [ ] Delete product
- [ ] Product removed from marketplace

---

### Error State Tests

#### Test Error 1: Invalid Login
- [ ] Enter wrong email
- [ ] Error message displays
- [ ] Enter wrong password
- [ ] Error message displays
- [ ] Login button disabled during attempt
- [ ] Loading state shows

#### Test Error 2: Network Error
- [ ] Stop backend
- [ ] Try to login
- [ ] Error message appears
- [ ] Suggests refreshing or checking connection
- [ ] No infinite loops

#### Test Error 3: Validation Errors
- [ ] Try to register with weak password
- [ ] Error message clear
- [ ] Try to register with duplicate email
- [ ] Error message specific
- [ ] Try to submit empty form
- [ ] All required fields marked

---

### Performance Benchmarks

**Target Metrics:**
- Homepage load: < 2 seconds
- Marketplace load: < 2 seconds
- Product detail load: < 1 second
- API response: < 500ms
- Lighthouse score: > 80

**Test:**
```bash
# Audit with Lighthouse
1. Open DevTools → Lighthouse
2. Select "Desktop" or "Mobile"
3. Click "Analyze page load"
4. Review metrics
5. Should see:
   - Performance > 80
   - Accessibility > 80
   - Best Practices > 80
   - SEO > 80
```

---

### Security Tests

#### Test 1: Authentication
- [ ] JWT tokens invalid after logout
- [ ] Can't access protected routes without auth
- [ ] Admin routes require admin key
- [ ] Token refreshes if near expiry

#### Test 2: Data Protection
- [ ] Passwords not logged anywhere
- [ ] Sensitive data not in URL
- [ ] No XSS vulnerabilities (HTML tags not executed)
- [ ] CSRF protection (if applicable)

#### Test 3: Admin Access
- [ ] Non-admin can't access /admin
- [ ] Invalid admin key rejected
- [ ] Admin permissions enforced server-side

---

## Test Report Template

Use this to document test results:

```
=== Test Report ===
Date: [DATE]
Tester: [NAME]
Build Version: [VERSION]
Browser: [CHROME/FIREFOX/SAFARI/MOBILE]

Test: [TEST NAME]
Status: PASS / FAIL
Issues: [DESCRIBE IF FAILED]
Screenshots/Logs: [ATTACH IF RELEVANT]

---

Summary:
- Total Tests: X
- Passed: X
- Failed: X
- Issues Found: X

Blocking Issues: [LIST]
Nice-to-Have Issues: [LIST]
```

---

## When to Re-Test

- After code changes
- Before releasing to production
- After updating dependencies
- After database migrations
- After configuration changes
- When bugs are reported
- On new browsers/devices

## Continuous Testing

Consider automating these tests:
- Unit tests for components
- Integration tests for flows
- E2E tests with Cypress/Playwright
- Performance monitoring
- Error tracking (Sentry)
- Analytics monitoring
