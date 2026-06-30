# ShopLive Bharat - Client Testing Guide

## 🌐 Live URL
**https://frontend-5id62kdqe-dhrumil7607s-projects.vercel.app**

---

## 👥 Test Accounts

### Customer Account
Use this to test shopping features:
- **Email**: customer1@shoplivebharat.com
- **Password**: Demo@123456

### Admin Account  
Use this to test admin features:
- **Admin ID**: admin
- **Password**: admin123
- **URL**: /admin/login

---

## ✅ Testing Checklist

### 1. Homepage & Navigation
- [ ] Visit homepage
- [ ] Click through navigation menu (Buy, Live Premium Stores, Partner Stores)
- [ ] Check footer links
- [ ] Test responsive menu on mobile

### 2. Currency Conversion Testing ⭐ (KEY FEATURE)
**This is critical - test on all pages**

**Step 1: Select USD Currency**
- [ ] Click currency selector (top right, should show "INR")
- [ ] Select "USD"
- [ ] Verify all prices change to $ (dollar signs)

**Step 2: Test on Marketplace Page**
- [ ] Go to Marketplace (/marketplace)
- [ ] Verify products show prices in USD (e.g., $20.00)
- [ ] If price was ₹2000, should show ~$24 (approx)
- [ ] Change back to INR, verify prices show ₹

**Step 3: Test on Partner Stores Page**
- [ ] Go to Partner Stores (/partner-stores)
- [ ] USD should still be selected
- [ ] Verify store product prices show in USD
- [ ] Click on a store, check featured collection prices
- [ ] Change currency to EUR, verify € symbol

**Step 4: Test on Live Shopping Page**
- [ ] Go to Live Shopping (/live-shopping)
- [ ] Session fee should show in USD ($1500 ~$18)
- [ ] Change currency to GBP, should show £ 
- [ ] Change to INR, back to ₹

**Step 5: Test Cart & Checkout**
- [ ] Add products to cart (prices should be in selected currency)
- [ ] Go to checkout
- [ ] Prices should convert correctly

### 3. Shopping Experience
- [ ] Browse marketplace products
- [ ] Click on a product to view details
- [ ] Add product to cart
- [ ] View cart (/cart)
- [ ] Adjust quantity
- [ ] Remove item
- [ ] Proceed to checkout

### 4. Live Shopping Booking
- [ ] Go to Live Shopping page (/live-shopping)
- [ ] Scroll down to booking form
- [ ] Fill in booking details:
  - [ ] Select date (future date)
  - [ ] Select time slot
  - [ ] Select city (Ahmedabad or Surat)
  - [ ] Enter name
  - [ ] Enter email
  - [ ] Enter phone
  - [ ] Enter product interests
- [ ] Click "Complete Booking"
- [ ] Verify booking confirmation page appears
- [ ] Check all details are displayed correctly

### 5. Partner Stores
- [ ] Go to Partner Stores page
- [ ] View list of stores on left sidebar
- [ ] Click different stores to view products
- [ ] Verify products load for selected store
- [ ] Test search functionality
- [ ] Try different currencies, verify prices convert

### 6. Admin Panel Testing
**Login with**: admin / admin123

- [ ] Go to /admin/login
- [ ] Enter credentials (admin / admin123)
- [ ] Click "Access Admin Panel"
- [ ] Should see admin dashboard

**Dashboard**
- [ ] View statistics (Total Bookings, Confirmed, Revenue, Pending Payments)
- [ ] View recent shops
- [ ] View recent products

**Products**
- [ ] Click "Add Product" button
- [ ] Form should appear
- [ ] Try to add a product (fill in all fields)
- [ ] View products table
- [ ] Test toggle product LIVE/OFFLINE button
- [ ] Edit button should work

**Bookings**
- [ ] Click "Bookings" in sidebar
- [ ] View bookings table
- [ ] Test search functionality
- [ ] Test status filter dropdown
- [ ] Click on a booking to edit
- [ ] Update status and payment status

**Sidebar**
- [ ] Verify sidebar stays fixed (doesn't scroll with page)
- [ ] Logo stays at top
- [ ] Logout button stays at bottom
- [ ] Menu items scrollable if needed
- [ ] Active menu item highlighted

### 7. Responsiveness Testing

**Mobile (375px width)**
- [ ] Navbar collapses properly
- [ ] Hamburger menu works
- [ ] Products stack vertically
- [ ] Tables horizontal scroll works
- [ ] Touch interactions work
- [ ] Buttons are clickable

**Tablet (768px width)**
- [ ] Layout adapts well
- [ ] Navigation works
- [ ] Products show in 2 columns
- [ ] Admin sidebar visible

**Desktop (1920px width)**
- [ ] Full layout works
- [ ] Sidebar visible
- [ ] Products in grid layout
- [ ] All features accessible

### 8. Page Navigation
- [ ] Home (/)
- [ ] Marketplace (/marketplace)
- [ ] Partner Stores (/partner-stores)
- [ ] Live Shopping (/live-shopping)
- [ ] Product Detail (/product/:id)
- [ ] Cart (/cart)
- [ ] Checkout (/checkout)
- [ ] About (/about)
- [ ] Contact (/contact)
- [ ] Test invalid URL to see 404 page
- [ ] Try /admin/products without login (should redirect to /admin/login)

### 9. Performance
- [ ] Page loads quickly (< 2 seconds)
- [ ] Animations are smooth (not jerky)
- [ ] Images load properly
- [ ] No console errors (F12 to check)
- [ ] Currency conversion is instant (no loading delay)

### 10. Visual/Design
- [ ] Colors match brand (maroon, gold, cream)
- [ ] Typography looks professional
- [ ] Spacing is consistent
- [ ] Buttons are styled consistently
- [ ] Forms look clean
- [ ] No broken images

---

## 🔍 Known Features (What Should Work)

✅ **Multi-Currency**: 8 currencies with instant conversion  
✅ **Shopping**: Browse, view products, add to cart  
✅ **Live Shopping**: Book consultation sessions  
✅ **Admin Panel**: Manage products, bookings, shops  
✅ **Stores**: 10 partner stores (Ahmedabad & Surat)  
✅ **Responsive**: Mobile, tablet, desktop  
✅ **Animations**: Smooth transitions and interactions  
✅ **SEO**: Meta tags and structured data  

---

## ⚠️ Potential Issues & Solutions

### Issue: Admin page not loading
**Solution**: 
1. Use correct credentials: `admin` / `admin123` (NOT email format)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+Shift+R)

### Issue: Prices not converting
**Solution**:
1. Make sure you've selected a currency
2. Hard refresh the page
3. Try different currency
4. Check if JSON is enabled in browser

### Issue: Sidebar scrolls with page
**Solution**: This is fixed in latest build - hard refresh browser

### Issue: Products don't load
**Solution**:
1. Check network (F12 > Network tab)
2. Hard refresh
3. Try marketplace instead of partner stores

### Issue: Can't add to cart
**Solution**:
1. Make sure you're on a product page
2. Click the actual "Add to Cart" button
3. Check cart page after adding

---

## 📸 Screenshots to Take

Please send screenshots of:
1. Homepage with currency selector
2. Marketplace with prices in USD
3. Partner Stores with different currency
4. Admin dashboard
5. Admin products page
6. Live shopping booking confirmation
7. Mobile view of any page

---

## 💬 Feedback to Provide

After testing, please provide:
1. ✅ What works well?
2. ❌ What doesn't work?
3. 🎨 Any design issues?
4. ⚡ Performance feedback?
5. 🐛 Any bugs encountered?
6. 💡 Suggested improvements?

---

## 📞 Support

If something isn't working:
1. Clear browser cache and hard refresh
2. Try in incognito/private mode
3. Try a different browser
4. Share:
   - Screenshot of issue
   - Current URL
   - Browser console errors (F12)
   - What you were trying to do

---

## 🎯 Critical Test: Currency Conversion

**Most important feature to verify:**

1. Page loads
2. Select USD currency
3. Go to Marketplace
4. Verify prices show in USD ($ symbol)
5. Compare: If product says ₹2000, should convert to ~$24
6. Change currency back to INR
7. Verify prices show ₹ again

**This should work instantly with smooth animation - NO page refresh needed!**

---

**Build Version**: June 29, 2026  
**Status**: ✅ PRODUCTION READY  
**Support Available**: 24/7
