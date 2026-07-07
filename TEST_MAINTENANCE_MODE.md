# ✅ Test: Maintenance Mode (5-Minute Test)

Follow this guide to test the new maintenance mode functionality.

---

## Prerequisites

1. ✅ Backend running: `python shoplivebharat/backend/server.py`
2. ✅ Frontend running: `npm start`
3. ✅ Fresh restart (to load the new MaintenanceMode component)

---

## Test 1: Enable Maintenance Mode

**Time**: 2 minutes

### Step 1: Open Admin Settings
1. Go to: `http://localhost:3000/admin/settings`
2. Login if prompted: `shoplivebharat-admin`

### Step 2: Enable Maintenance
1. Scroll to: **System Settings** section
2. Check: **"Maintenance Mode"** checkbox
3. Click: **"Save All Settings"** button
4. Verify: Toast shows "✅ Settings saved successfully!"

### Step 3: Open Storefront in New Tab
1. Open new tab
2. Go to: `http://localhost:3000/`
3. **Expected**: See "We'll Be Right Back" maintenance page
4. **Status**: ✅ **PASS** if you see maintenance page

---

## Test 2: Verify Storefront is Down

**Time**: 1 minute

### Step 1: Try Different Routes
While maintenance is ON, try to access:
- [ ] Homepage: `http://localhost:3000/` → Should show maintenance page
- [ ] Marketplace: `http://localhost:3000/shop` → Should show maintenance page
- [ ] Products: `http://localhost:3000/marketplace` → Should show maintenance page
- [ ] Cart: `http://localhost:3000/cart` → Should show maintenance page

**Status**: ✅ **PASS** if ALL routes show maintenance page

---

## Test 3: Admin Access Still Works

**Time**: 1 minute

### Step 1: Try Admin Routes During Maintenance
- [ ] Admin Login: `http://localhost:3000/admin/login` → Should load (NOT blocked)
- [ ] Can login with: `shoplivebharat-admin`
- [ ] Can access: `/admin/dashboard`, `/admin/settings`, etc.

**Status**: ✅ **PASS** if admin routes still work

---

## Test 4: Disable Maintenance Mode

**Time**: 1 minute

### Method 1: Using Quick Disable Button (Easiest)
1. Go to: `http://localhost:3000/admin/settings`
2. Look for: Red **"Disable Maintenance Mode Now"** button
3. Click it
4. Click: **"Save All Settings"**
5. Verify: Toast shows success message

### Method 2: Manually Uncheck
1. Go to: `http://localhost:3000/admin/settings`
2. Uncheck: **"Maintenance Mode"** checkbox
3. Click: **"Save All Settings"**

### Step 2: Verify Storefront is Back
1. Go to: `http://localhost:3000/`
2. Hard refresh: Ctrl+Shift+R
3. **Expected**: See normal homepage
4. **Status**: ✅ **PASS** if you see homepage

---

## Test 5: Real-Time Updates

**Time**: 2 minutes (best with two browser windows)

### Setup:
1. **Window 1**: Open storefront: `http://localhost:3000/`
2. **Window 2**: Open admin settings: `http://localhost:3000/admin/settings`

### Test:
1. In Window 2: **Enable** Maintenance Mode and **Save**
2. Switch to Window 1
3. Wait 5 seconds (or press F5 to refresh)
4. **Expected**: Maintenance page appears
5. Status: ✅ **PASS**

Then:
1. In Window 2: **Disable** Maintenance Mode and **Save**
2. Switch to Window 1
3. Wait 5 seconds (or press F5 to refresh)
4. **Expected**: Storefront reappears
5. Status: ✅ **PASS**

---

## Test 6: Console Logs

**Time**: 1 minute

### Check Maintenance Mode Logs:
1. Open DevTools: **F12**
2. Go to: **Console** tab
3. Go to Settings and toggle Maintenance Mode
4. **Should See**:
   ```
   🔧 Maintenance Mode: OFF
   🔧 Maintenance Mode: ON
   ```

**Status**: ✅ **PASS** if you see these logs

---

## Complete Test Checklist

- [ ] Maintenance mode is found in Admin Settings
- [ ] Can enable maintenance mode
- [ ] Save settings works
- [ ] Storefront shows maintenance page when ON
- [ ] Homepage blocked in maintenance mode
- [ ] Marketplace blocked in maintenance mode
- [ ] Cart blocked in maintenance mode
- [ ] Other routes blocked in maintenance mode
- [ ] Admin login accessible during maintenance
- [ ] Admin dashboard accessible during maintenance
- [ ] Admin settings accessible during maintenance
- [ ] Can disable maintenance mode
- [ ] Storefront comes back online when disabled
- [ ] Real-time updates work (within 5 seconds)
- [ ] Console logs show maintenance mode status
- [ ] All buttons and forms work correctly
- [ ] Maintenance message is professional
- [ ] "Try Again" button refreshes page
- [ ] "Contact Support" button works

---

## Expected Results

### When Maintenance Mode is ON:
```
Visitors see:     "We'll Be Right Back" page
Admin accesses:   Full admin panel
All public routes: Blocked (show maintenance page)
Admin routes:     Working normally
```

### When Maintenance Mode is OFF:
```
Visitors see:     Normal storefront
Admin accesses:   Full admin panel
All routes:       Working normally
```

---

## Troubleshooting

### Maintenance page not showing:

1. Check if it's enabled in settings
   ```javascript
   // F12 Console:
   JSON.parse(localStorage.getItem("slb_admin_settings")).maintenanceMode
   // Should return: true
   ```

2. Hard refresh the page: Ctrl+Shift+R

3. Check browser console (F12) for errors

### Real-time updates not working:

1. Make sure Frontend is running fresh
2. If needed, restart: `npm start`
3. Verify component loaded: Look for "🔧 Maintenance Mode:" logs

### Admin can't login during maintenance:

1. Go directly to: `http://localhost:3000/admin/login`
2. This route should NOT be blocked
3. If blocked, there's an issue with the maintenance component

---

## Success Indicator

✅ **Test is SUCCESSFUL when:**
- Maintenance mode enables/disables from admin settings
- Storefront is completely blocked when ON
- Admin panel still works when ON
- Storefront comes back online when OFF
- Changes take effect in less than 5 seconds
- All pages are properly blocked (not just homepage)

---

## Time Estimate

**Total Test Time**: 5-10 minutes

- Test 1 (Enable): 2 min
- Test 2 (Verify Down): 1 min
- Test 3 (Admin Works): 1 min
- Test 4 (Disable): 1 min
- Test 5 (Real-time): 2 min
- Test 6 (Logs): 1 min
- **Buffer**: 1-2 min

---

**After passing all tests, maintenance mode is fully functional!** 🎉

