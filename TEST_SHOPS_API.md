# Testing Shops API

## Quick Test Steps

### 1. Verify Backend is Running
```bash
# Check if backend is running on port 8000
curl http://localhost:8000/api/

# Expected response:
# {"service":"ShopLiveBharat API","status":"ok"}
```

### 2. Test Shops Endpoint
```bash
# Get all shops
curl "http://localhost:8000/api/shops?limit=500&active_only=false"

# Expected response (should show at least 2 shops):
# [
#   {
#     "id": "shop-jaipur-atelier",
#     "name": "Jaipur Atelier House",
#     ...
#   },
#   {
#     "id": "shop-banaras-edit",
#     "name": "The Banaras Edit",
#     ...
#   }
# ]
```

### 3. Test Products Endpoint
```bash
# Get all products
curl "http://localhost:8000/api/products?limit=500&active_only=false"

# Expected response (should show 5 products)
```

### 4. Test Admin Shops Creation (Requires Admin Key)
```bash
# Create a new shop
curl -X POST http://localhost:8000/api/admin/shops \
  -H "X-Admin-Key: shoplivebharat-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Shop",
    "owner_name": "Test Owner",
    "owner_email": "test@example.com",
    "city": "Test City",
    "specialty": "Test Specialty",
    "description": "This is a test shop description",
    "image_url": "/shop-assets/banner-1.jpg"
  }'
```

## If Shops Are Not Showing

### Check 1: Backend Environment
```bash
# Verify backend .env file contains:
# USE_MEMORY_DB=1
# ADMIN_API_KEY=shoplivebharat-admin
```

### Check 2: Restart Backend
```bash
# Stop the backend (Ctrl+C)
# Restart it:
python server.py

# You should see in console:
# "ShopLiveBharat API started"
# or
# "Using ephemeral in-memory data store..."
```

### Check 3: Check Frontend API Configuration
Frontend .env should have:
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Check 4: Clear Browser Cache
- Open DevTools (F12)
- Go to Application → Local Storage
- Delete entries for this site
- Hard refresh (Ctrl+Shift+R)

## Debug: Check Console Errors

1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors when loading admin/products
4. Look for network errors in Network tab

## If Still Not Working

### Try Direct API Call
In browser console:
```javascript
fetch('http://localhost:8000/api/shops?limit=500')
  .then(r => r.json())
  .then(d => console.log(d))
```

This will show you exactly what the API is returning.

## Reset Everything

If nothing works, try a complete reset:

### 1. Stop Backend
```bash
# Ctrl+C in backend terminal
```

### 2. Update .env
```bash
cd shoplivebharat/backend
echo "USE_MEMORY_DB=1" > .env
echo "ADMIN_API_KEY=shoplivebharat-admin" >> .env
```

### 3. Restart Backend
```bash
python server.py
```

### 4. Clear Frontend Cache
```bash
# In frontend terminal
rm -rf node_modules/.cache
npm start
```

### 5. Hard Refresh Browser
- Ctrl+Shift+R (Windows/Linux)
- Cmd+Shift+R (Mac)

## Expected Behavior

After these steps:
- Admin Products page should show a dropdown with shops
- Should be able to select shops when creating products
- Shops admin page should show the seeded shops

