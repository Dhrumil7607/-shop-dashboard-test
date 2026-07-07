# 🔧 Debug: Failed to Save Shop

**Problem**: Getting "Failed to save shop" error when creating/updating shops  
**Status**: Debugging steps provided  
**Time to resolve**: 10-15 minutes

---

## Step 1: Open Browser Console

1. Open DevTools: **F12**
2. Go to **Console** tab
3. Try to create a shop again
4. Look for logged messages:

### Good Signs (Should See):
```
🔑 Creating shop with admin key: present
📤 Config: { headers: { X-Admin-Key: shoplivebharat-admin } }
📝 Saving shop with data: { name: "...", owner_name: "...", ... }
```

### Bad Signs (If You See):
```
🔑 Creating shop with admin key: missing
❌ Error saving shop: ...
```

---

## Step 2: Check Admin Key

**In Browser Console**, run:
```javascript
localStorage.getItem("slb_admin_key")
```

**Should return**:
```
"shoplivebharat-admin"
```

**If it returns `null` or empty string**:
- Admin login didn't work
- Go back to Admin Login page
- Re-enter: `shoplivebharat-admin`
- Click "Access Admin Panel"

---

## Step 3: Check Network Request

1. Open DevTools: **F12**
2. Go to **Network** tab
3. Try to create a shop
4. Look for request to `POST /api/admin/shops`
5. Click on it

### Check These:

**Request Headers**:
- Should have: `X-Admin-Key: shoplivebharat-admin`

**Response Status**:
- Should be `201 Created` for new shop
- Should be `200 OK` for update

**Response Body**:
- If error: Look at the error message
- If success: Should show shop data with ID

---

## Step 4: Check Backend Logs

In the backend terminal where `python server.py` is running:

1. Try to create a shop
2. Look at terminal output
3. You should see logs like:

### Good Signs:
```
POST /api/admin/shops HTTP/1.1" 201 Created
```

### Bad Signs:
```
POST /api/admin/shops HTTP/1.1" 401 Unauthorized
POST /api/admin/shops HTTP/1.1" 400 Bad Request
POST /api/admin/shops HTTP/1.1" 500 Internal Server Error
```

---

## Step 5: Detailed Error Analysis

### Error: "Invalid admin key"

**Cause**: Admin key validation failed  
**Solution**:
1. Go to Admin Login
2. Clear browser Local Storage
3. Re-login with: `shoplivebharat-admin`
4. Make sure backend `.env` has: `ADMIN_API_KEY=shoplivebharat-admin`

### Error: "A shop with this slug already exists"

**Cause**: Shop name/slug is duplicated  
**Solution**:
1. Use a different shop name
2. Or edit existing shop instead of creating new

### Error: "validation error" or "422"

**Cause**: One of the required fields is missing or invalid  
**Check**: All fields filled:
- [ ] Shop Name (min 2 chars)
- [ ] Owner Name (min 2 chars)
- [ ] Owner Email (valid email)
- [ ] City (min 2 chars)
- [ ] Specialty (min 2 chars)
- [ ] Description (min 10 chars)
- [ ] Image URL (non-empty)

### Error: "Connection refused" or "Cannot reach server"

**Cause**: Backend not running  
**Solution**:
1. Check backend is running: `python shoplivebharat/backend/server.py`
2. Check it's on port 8000
3. Verify frontend `.env` has: `REACT_APP_BACKEND_URL=http://localhost:8000`

---

## Step 6: Test API Directly

Open browser console and test the API:

```javascript
// Test if API is reachable
fetch('http://localhost:8000/api/')
  .then(r => r.json())
  .then(d => console.log('✅ API reachable:', d))
  .catch(e => console.log('❌ API error:', e));

// Test creating a shop with proper headers
fetch('http://localhost:8000/api/admin/shops', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Key': 'shoplivebharat-admin'
  },
  body: JSON.stringify({
    name: 'Test Shop',
    owner_name: 'Test Owner',
    owner_email: 'test@example.com',
    city: 'Test City',
    specialty: 'Test Specialty',
    description: 'This is a test shop description that is long enough',
    image_url: '/shop-assets/banner-1.jpg'
  })
})
  .then(r => r.json())
  .then(d => console.log('✅ Response:', d))
  .catch(e => console.log('❌ Error:', e));
```

---

## Complete Checklist

### Backend Setup
- [ ] Backend running: `python shoplivebharat/backend/server.py`
- [ ] Backend `.env` has `USE_MEMORY_DB=1`
- [ ] Backend `.env` has `ADMIN_API_KEY=shoplivebharat-admin`
- [ ] Backend on port 8000
- [ ] Console shows "ShopLiveBharat API started"

### Frontend Setup
- [ ] Frontend `.env` has `REACT_APP_BACKEND_URL=http://localhost:8000`
- [ ] Frontend running: `npm start`
- [ ] Frontend on port 3000

### Authentication
- [ ] Logged into admin panel
- [ ] Browser console: `localStorage.getItem("slb_admin_key")` returns key
- [ ] Can navigate to /admin/shops page

### Shop Form
- [ ] All fields filled (name, owner, email, city, specialty, description, image)
- [ ] No fields empty or too short
- [ ] Email is valid format

### Network Request
- [ ] DevTools → Network shows `POST /api/admin/shops`
- [ ] Request has header: `X-Admin-Key: shoplivebharat-admin`
- [ ] Response status is `201 Created`

---

## If Still Failing

### Copy Exact Error Message

1. Open DevTools Console
2. Try to create shop
3. Copy the error message that appears
4. The error will tell you exactly what's wrong

### Common Error Messages:

| Error | Meaning | Fix |
|-------|---------|-----|
| "Invalid admin key" | Key not matching backend | Re-login and check backend .env |
| "validation error" | Missing/invalid field | Fill all required fields properly |
| "slug already exists" | Duplicate shop name | Use different name |
| "Connection refused" | Backend not running | Start backend |
| "401 Unauthorized" | Admin key not sent | Check localStorage has key |
| "422 Unprocessable Entity" | Invalid data format | Check field formats (email, etc) |

---

## Quick Reset

If nothing works:

```bash
# 1. Stop everything (Ctrl+C)

# 2. Clear browser
# DevTools → Application → Local Storage → Delete all

# 3. Reset backend config
cd shoplivebharat/backend
cat > .env << EOF
USE_MEMORY_DB=1
ADMIN_API_KEY=shoplivebharat-admin
LAUNCH_DATE=2026-06-28T00:00:00+05:30
EOF

# 4. Restart backend
python server.py
# Wait for: "ShopLiveBharat API started" or "Using ephemeral..."

# 5. Restart frontend
cd shoplivebharat/frontend
npm start

# 6. Browser hard refresh
# Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# 7. Re-login to admin
# http://localhost:3000/admin/login
# Key: shoplivebharat-admin
```

---

## Testing Shops Page Directly

Try these steps:

1. Go to: `http://localhost:3000/admin/shops`
2. You should see: "Add Shop" button
3. Click it
4. Fill all fields:
   - Shop Name: "My Test Shop"
   - Owner Name: "Test Owner"
   - Owner Email: "test@example.com"
   - City: "Test City"
   - Country: "India"
   - Specialty: "Test Specialty"
   - Description: "This is a test shop with a long description"
   - Image URL: "/shop-assets/banner-1.jpg"
5. Click "Create Shop"
6. Open Console (F12) to see the logs

The console logs will show you exactly where it's failing.

---

## Pro Debugging Tips

1. **Always check the Console first** - Most errors are logged there
2. **Check Network tab** - Shows the actual HTTP request/response
3. **Read error messages carefully** - They usually tell you what's wrong
4. **Clear cache if things seem stuck** - Browser can cache old data
5. **Restart backend** - Sometimes backend needs fresh restart
6. **Try the API directly** - Use the fetch example above

---

**Once you identify the error, share the exact error message for more specific help.**

