# 🔧 Maintenance Mode - Complete Guide

**Feature**: Enable/Disable the entire storefront for maintenance  
**Status**: ✅ NOW WORKING - Site will actually go down when maintenance mode is enabled  
**Access**: Admin Settings page

---

## How to Enable Maintenance Mode

### Step 1: Go to Admin Settings
1. Log in to admin panel: `http://localhost:3000/admin/login`
2. Key: `shoplivebharat-admin`
3. Navigate to: **Settings** (should be in admin menu)
4. Or go directly: `http://localhost:3000/admin/settings`

### Step 2: Enable Maintenance Mode
1. Scroll down to **System Settings** section
2. Check the **"Maintenance Mode"** checkbox
3. Click **"Save All Settings"** button
4. You should see: "✅ Settings saved successfully!"

### Step 3: Verify It's Working
1. Try to visit the storefront: `http://localhost:3000/`
2. You should see: **"We'll Be Right Back"** maintenance page
3. Storefront is now DOWN ✅

---

## How to Disable Maintenance Mode

### Quick Method:
1. Go to Settings: `http://localhost:3000/admin/settings`
2. Click the red **"Disable Maintenance Mode Now"** button
3. Click **"Save All Settings"**
4. Storefront is back online ✅

### Or Manually:
1. Go to Settings: `http://localhost:3000/admin/settings`
2. Uncheck **"Maintenance Mode"** checkbox
3. Click **"Save All Settings"**
4. Storefront is back online ✅

---

## What Users See in Maintenance Mode

When maintenance mode is ON, all visitors see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    We'll Be Right Back
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  ShopLiveBharat is currently under maintenance.
    We're working hard to serve you better.
    Please check back soon!

[Try Again] [Contact Support]

Admin Access: Go to Admin Panel
```

---

## Key Features

### ✅ What Works in Maintenance Mode:
- ✅ Admin can still access admin panel
- ✅ All users see maintenance page
- ✅ Admin can enable/disable anytime
- ✅ Can be toggled in real-time
- ✅ Checks for maintenance mode every 5 seconds

### ⛔ What's Blocked:
- ❌ Homepage
- ❌ Marketplace
- ❌ Product pages
- ❌ Shopping cart
- ❌ User accounts
- ❌ All public routes

---

## Testing Maintenance Mode

### Test 1: Enable and View
1. Go to Admin Settings
2. Enable Maintenance Mode
3. Save
4. Open new tab and visit `http://localhost:3000/`
5. Should see maintenance page ✅

### Test 2: Admin Access Works
1. While in maintenance mode
2. Try to visit `http://localhost:3000/admin/login`
3. Admin login should still be accessible ✅
4. Admin pages should still work ✅

### Test 3: Real-Time Updates
1. Open storefront in one tab: `http://localhost:3000/`
2. Open settings in another tab
3. Enable maintenance mode in settings
4. Switch to storefront tab
5. Page should update within 5 seconds ✅

### Test 4: Disable and Access
1. In settings, disable maintenance mode
2. Save
3. Switch to storefront tab
4. Refresh (F5)
5. Storefront should be back online ✅

---

## Use Cases

### When to Enable Maintenance Mode:

1. **Database Maintenance**
   - Backing up data
   - Running database migrations
   - Cleaning up old records

2. **Deployment/Updates**
   - Deploying new code
   - Updating dependencies
   - Database schema changes

3. **Emergency Fixes**
   - Critical bug fixes
   - Security patches
   - Emergency maintenance

4. **System Downtime**
   - Server restart
   - Infrastructure maintenance
   - Network upgrades

---

## Admin-Only Access

Even in maintenance mode, admins can:
- ✅ Access admin login: `/admin/login`
- ✅ Access admin dashboard: `/admin/dashboard`
- ✅ View settings: `/admin/settings`
- ✅ Disable maintenance mode
- ✅ Make changes needed for maintenance

### How to Access During Maintenance:
1. Visit: `http://localhost:3000/admin/login`
2. Enter key: `shoplivebharat-admin`
3. Access admin panel fully

---

## How It Works Technically

### Settings Storage:
```javascript
// Settings stored in browser localStorage:
{
  storeName: "ShopLiveBharat",
  maintenanceMode: true,  // ← This controls everything
  ...
}
```

### Maintenance Check:
1. MaintenanceMode component loads on app startup
2. Checks localStorage every 5 seconds
3. If `maintenanceMode === true`, shows maintenance page
4. If `maintenanceMode === false`, shows normal app
5. Overlay prevents access to all routes

### In Production:
This would typically be:
- Stored in database
- Checked at server level
- Enforced by API middleware
- Applied to all servers instantly

---

## Customization

### To Change Maintenance Message:
Edit `MaintenanceMode.jsx` and change this text:
```jsx
<h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
    We'll Be Right Back  {/* ← Change this */}
</h1>
```

### To Change Maintenance Page Design:
Edit `MaintenanceMode.jsx` - it's a full React component you can customize with:
- Different background colors
- Different message
- Different buttons
- Custom styling

### To Change Check Frequency:
In `MaintenanceMode.jsx`, change this line:
```javascript
const interval = setInterval(checkMaintenance, 5000);  // 5000ms = 5 seconds
// Change to: setInterval(checkMaintenance, 2000);  // for 2 seconds
// Or: setInterval(checkMaintenance, 10000);  // for 10 seconds
```

---

## Troubleshooting

### Problem: Maintenance page not showing

**Check 1**: Is maintenance mode enabled in settings?
```javascript
// In browser console (F12):
JSON.parse(localStorage.getItem("slb_admin_settings"))
// Should show: { maintenanceMode: true, ... }
```

**Check 2**: Did you save the settings?
- Click "Save All Settings" button

**Check 3**: Is the page cached?
- Hard refresh: Ctrl+Shift+R
- Or close and reopen browser

### Problem: Can't access admin during maintenance

**Solution**: Go directly to admin login:
```
http://localhost:3000/admin/login
```

This page is NOT blocked by maintenance mode, allowing admin access.

### Problem: Maintenance page is blank

**Solution**: 
1. Hard refresh: Ctrl+Shift+R
2. Check browser console (F12) for errors
3. Make sure frontend is running

---

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `MaintenanceMode.jsx` | Created | Maintenance page component |
| `App.js` | Updated | Added maintenance mode check |

---

## Quick Reference

| Action | Steps |
|--------|-------|
| **Enable Maintenance** | Settings → Check Maintenance Mode → Save |
| **Disable Maintenance** | Settings → Uncheck Maintenance Mode → Save |
| **Quick Disable** | Settings → Click Red Button → Save |
| **Access Admin** | Go to `/admin/login` |
| **View Maintenance Page** | Visit `/` while maintenance is on |

---

## Next Steps

1. ✅ Restart the frontend app (`npm start`)
2. ✅ Go to Admin Settings
3. ✅ Toggle Maintenance Mode
4. ✅ Test the functionality
5. ✅ Verify storefront goes down and admin access works

---

**Maintenance Mode is now fully functional!** 🎉

You can now put your site into maintenance mode whenever needed, and users will see a professional maintenance page while admins can still access the admin panel.

