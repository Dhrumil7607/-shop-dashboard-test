# ✅ Test: Create Shop (Step-by-Step)

Follow this guide to test creating a shop and identify any issues.

---

## Prerequisites

1. ✅ Backend running: `python shoplivebharat/backend/server.py`
   - Should see: "ShopLiveBharat API started"
   - Or: "Using ephemeral in-memory data store..."

2. ✅ Frontend running: `npm start` (on port 3000)
   - Should see: "Compiled successfully!"

3. ✅ Browser DevTools open: Press **F12**

---

## Step 1: Navigate to Admin Login

1. Go to: `http://localhost:3000/admin/login`
2. You should see a form with:
   - Title: "Admin Access"
   - Input field for admin key
   - "Access Admin Panel" button

---

## Step 2: Login to Admin Panel

1. In the admin key field, type: `shoplivebharat-admin`
2. Click "Access Admin Panel"
3. You should be redirected to: `http://localhost:3000/admin/dashboard`

**Check Console (F12)**:
- Look for log messages confirming login

---

## Step 3: Navigate to Shops Admin

1. You should see a sidebar with navigation options
2. Click on **"Shops"** (or go directly to `/admin/shops`)
3. You should see:
   - "Shops" heading
   - "Add Shop" button
   - Either empty state or list of existing shops

**Check Console (F12)**:
- Should see logs like: "✅ Loading shops..." and "✅ Loaded X shops"

---

## Step 4: Open Create Shop Form

1. Click the **"Add Shop"** button
2. A form should appear with these fields:
   - Shop Name
   - Owner Name
   - Owner Email
   - City
   - Country (default: India)
   - Specialty
   - Shop Image URL
   - Instagram URL
   - Description
3. Click "Create Shop" button at the bottom

---

## Step 5: Fill Form with Test Data

Use this exact data (copy-paste):

| Field | Value |
|-------|-------|
| Shop Name | `My First Test Shop` |
| Owner Name | `John Doe` |
| Owner Email | `john@example.com` |
| City | `Mumbai` |
| Country | `India` |
| Specialty | `Ethnic Wear` |
| Shop Image URL | `/shop-assets/banner-1.jpg` |
| Instagram URL | (leave empty or use `/`) |
| Description | `This is my beautiful test shop with amazing collections` |

**Form should look like:**
```
Shop Name: My First Test Shop
Owner Name: John Doe
Owner Email: john@example.com
City: Mumbai
Country: India
Specialty: Ethnic Wear
Shop Image URL: /shop-assets/banner-1.jpg
Instagram URL: 
Description: This is my beautiful test shop with amazing collections

[Create Shop] [Cancel]
```

---

## Step 6: Submit the Form

1. Click **"Create Shop"** button
2. Watch what happens:

### Success Case (Should See):
- Toast notification: "✅ Shop is now LIVE!"
- Form closes
- New shop appears in the list
- Console shows: "✅ New shop created: { id: ..., name: 'My First Test Shop', ... }"

### Error Case (If You See):
- Toast notification: "❌ [Error message]"
- Form stays open with your data
- Console shows: "❌ Error saving shop: [details]"

---

## Step 7: Check Browser Console

Press **F12** and go to **Console** tab. You should see:

### Good Logs (Success):
```
📝 Saving shop with data: {name: "My First Test Shop", owner_name: "John Doe", ...}
🔑 Admin key present: true
➕ Creating new shop
🔑 Creating shop with admin key: present
📤 Config: {headers: {"X-Admin-Key": "shoplivebharat-admin"}}
✅ New shop created: {id: "...", name: "My First Test Shop", ...}
```

### Bad Logs (Error):
```
❌ Error saving shop: Error: [details]
Response data: {detail: "..."}
Error message: "..."
```

---

## Step 8: Check Network Tab

1. DevTools → **Network** tab
2. Try to create shop again (with form still open)
3. Look for request: `POST /api/admin/shops`
4. Click on it to see details:

**Request Tab**:
- Should see headers:
  ```
  X-Admin-Key: shoplivebharat-admin
  Content-Type: application/json
  ```
- Should see body with your shop data

**Response Tab**:
- Status should be: `201 Created`
- Body should show: Shop data with ID

---

## Step 9: Verify Shop Was Created

After successful creation:

1. Form should close automatically
2. You should see your shop in the list
3. The shop card should show:
   - Shop image
   - Shop name: "My First Test Shop"
   - Description
   - City: "Mumbai"
   - "LIVE" status (green badge)
   - Edit and Archive buttons

---

## Troubleshooting

### Problem: Form won't submit
- **Check**: All fields are filled
- **Check**: Description is at least 10 characters
- **Check**: Email is valid format

### Problem: "Failed to save shop" error
- **Check**: Backend is running
- **Check**: Admin is logged in (localStorage has key)
- **Check**: Browser console for specific error message
- **See**: DEBUG_SHOP_SAVE_ERROR.md for detailed debugging

### Problem: Shop appears then disappears
- **Check**: Page refresh (F5) - shop should still be there
- **Check**: Browser console for errors

### Problem: Can't see "Add Shop" button
- **Check**: You're logged into admin
- **Check**: You're on `/admin/shops` page
- **Check**: Browser console for login errors

---

## Expected Outcome

After these steps:

1. ✅ Admin login works
2. ✅ Can navigate to Shops page
3. ✅ Can open Create Shop form
4. ✅ Can submit form with test data
5. ✅ See "Shop is now LIVE!" confirmation
6. ✅ Shop appears in the list
7. ✅ Can see shop details (name, description, location)
8. ✅ Can edit or archive the shop

If all these work, the shop creation feature is functioning correctly!

---

## Next Steps After Test

### If Successful:
- ✅ Try creating another shop
- ✅ Test editing a shop
- ✅ Test toggling LIVE/OFFLINE status
- ✅ Go to Products page and verify shops appear in dropdown

### If Failed:
- Check the specific error message in console
- Follow the debugging steps in DEBUG_SHOP_SAVE_ERROR.md
- Share the exact error message for more help

---

**Good luck! Let me know if you hit any issues.** 🚀

