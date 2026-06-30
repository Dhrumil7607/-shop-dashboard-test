# 🔧 Fix: Shops Not Showing in Admin Panel

**Problem**: Shops dropdown is empty in the admin Products page

**Root Cause**: Backend not properly seeding shops or API not returning data correctly

---

## ✅ Step-by-Step Fix

### Step 1: Update Backend Configuration
Edit `shoplivebharat/backend/.env`:

```env
USE_MEMORY_DB=1
ADMIN_API_KEY=shoplivebharat-admin
LAUNCH_DATE=2026-06-28T00:00:00+05:30
```

**Why**: Forces the backend to use in-memory database with pre-seeded shops

### Step 2: Verify Frontend Configuration
Check `shoplivebharat/frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

**Why**: Frontend must point to correct backend port

### Step 3: Restart Backend

```bash
# Stop current backend (Ctrl+C if running)
cd shoplivebharat/backend
python server.py
```

You should see in terminal:
```
ShopLiveBharat API started
```

Or if using memory database:
```
Using ephemeral in-memory data store; configure MongoDB Atlas for persistence
```

### Step 4: Clear Frontend Cache

```bash
# In frontend terminal
rm -rf node_modules/.cache
npm start
```

Or use hard refresh in browser:
- **Windows/Linux**: Ctrl+Shift+R
- **Mac**: Cmd+Shift+R

### Step 5: Clear Browser Local Storage

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Local Storage**
4. Delete all entries for localhost
5. Close DevTools

### Step 6: Go to Admin Panel

1. Navigate to http://localhost:3000/admin/login
2. Enter admin key: `shoplivebharat-admin`
3. Click "Access Admin Panel"
4. Go to **Products** tab
5. Click **"Add Product"** button
6. Check the **"Shop"** dropdown

**Expected**: Should now show 2 pre-seeded shops:
- Jaipur Atelier House
- The Banaras Edit

---

## 🔍 If Still Not Working

### Test 1: Check Backend Directly

Open a terminal and test the API:

```bash
# Test if backend is running
curl http://localhost:8000/api/

# Expected response:
# {"service":"ShopLiveBharat API","status":"ok"}
```

If this fails, backend isn't running on port 8000.

### Test 2: Check Shops Endpoint

```bash
# Get all shops
curl "http://localhost:8000/api/shops?limit=500&active_only=false"
```

**Expected response** (should show 2 shops):
```json
[
  {
    "id": "shop-jaipur-atelier",
    "name": "Jaipur Atelier House",
    "owner_name": "Aarav Mehta",
    "owner_email": "aarav@example.com",
    ...
  },
  {
    "id": "shop-banaras-edit",
    "name": "The Banaras Edit",
    ...
  }
]
```

If empty array `[]`, shops aren't being seeded.

### Test 3: Check Browser Console

1. Go to http://localhost:3000/admin/login
2. Login with admin key `shoplivebharat-admin`
3. Go to Products page
4. Open DevTools (F12)
5. Go to **Console** tab
6. Look for these logs:

**Good signs** (should see):
```
✅ Loading shops...
✅ Loaded 2 shops
```

**Bad signs** (if you see):
```
❌ Failed to load shops
⚠️ No shops available
```

### Test 4: Check Network Tab

1. DevTools → **Network** tab
2. Go to Products page
3. Look for request to `/api/shops`
4. Check the response

**Expected Status**: 200  
**Expected Response**: Array with 2 shops

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to load shops"
**Cause**: Backend not running or port incorrect  
**Solution**:
1. Check backend is running: `python shoplivebharat/backend/server.py`
2. Verify port 8000 is available
3. Check `REACT_APP_BACKEND_URL` in frontend `.env`

### Issue 2: Empty shops array from API
**Cause**: `USE_MEMORY_DB=1` not set or backend not restarted  
**Solution**:
1. Update `backend/.env` with `USE_MEMORY_DB=1`
2. Completely stop and restart backend (don't just refresh)
3. Wait 2 seconds for backend to initialize
4. Clear browser cache

### Issue 3: Shops show in Shops admin page, but not in Products dropdown
**Cause**: Different API calls or timing issue  
**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check both use `fetchShops` function from `api.js`
3. Verify parameter: `active_only: false`

### Issue 4: Changes not showing after creating a shop
**Cause**: Browser cache or local state not updating  
**Solution**:
1. Hard refresh (Ctrl+Shift+R)
2. Clear Local Storage in DevTools
3. Go to Products page (should trigger new fetch)

---

## 📋 Complete Diagnostic Checklist

- [ ] Backend `.env` has `USE_MEMORY_DB=1`
- [ ] Backend `.env` has `ADMIN_API_KEY=shoplivebharat-admin`
- [ ] Frontend `.env` has `REACT_APP_BACKEND_URL=http://localhost:8000`
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 3000
- [ ] Browser console shows `✅ Loaded 2 shops`
- [ ] Network tab shows `/api/shops` returning 200 with 2 items
- [ ] Can see "Jaipur Atelier House" in products dropdown
- [ ] Can see "The Banaras Edit" in products dropdown
- [ ] Can create a product by selecting a shop
- [ ] Shop admin page shows 2 pre-seeded shops

---

## 🚀 Quick Reset Script

If nothing works, try this complete reset:

```bash
# 1. Stop all services (Ctrl+C)

# 2. Update backend config
cd shoplivebharat/backend
echo "USE_MEMORY_DB=1" > .env
echo "ADMIN_API_KEY=shoplivebharat-admin" >> .env
echo "LAUNCH_DATE=2026-06-28T00:00:00+05:30" >> .env

# 3. Start fresh backend
python server.py
# Wait for: "ShopLiveBharat API started" or "Using ephemeral in-memory data store"

# 4. In new terminal, clear frontend cache
cd shoplivebharat/frontend
rm -rf node_modules/.cache
npm start
# Wait for: "Compiled successfully!"

# 5. In browser:
# - Hard refresh: Ctrl+Shift+R
# - Go to: http://localhost:3000/admin/login
# - Login with: shoplivebharat-admin
# - Go to: Products tab
# - Click: Add Product
# - Check: Shop dropdown should now show 2 shops
```

---

## ✨ Expected Final Result

**Shops Admin Page** (`http://localhost:3000/admin/shops`):
- Shows 2 pre-seeded shops
- Can create new shops
- Can edit existing shops
- Can toggle shop status (LIVE/OFFLINE)

**Products Admin Page** (`http://localhost:3000/admin/products`):
- Shop dropdown shows "Jaipur Atelier House" and "The Banaras Edit"
- Can select a shop when creating products
- Can see product list with shop names

---

## 📞 Still Not Working?

### Check these files were updated:
1. `shoplivebharat/backend/.env` - Has USE_MEMORY_DB=1
2. `shoplivebharat/frontend/.env` - Has correct REACT_APP_BACKEND_URL
3. `shoplivebharat/frontend/src/pages/admin/Products.jsx` - Has improved error logging
4. `shoplivebharat/frontend/src/pages/admin/Shops.jsx` - Has improved error logging

### Check the backend console output for errors
- Look for "Traceback" or exception messages
- Check if seeding is happening
- Verify port 8000 isn't in use

### Check the browser console (F12)
- Look for "❌ Failed to load shops" messages
- Check Network tab for failed requests
- Look for CORS errors

---

**If you've done all these steps and it still doesn't work, check the console for the exact error message and share it for more specific help.**

