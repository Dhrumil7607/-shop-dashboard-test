# 📚 Developer Quick Reference

**Last Updated:** June 29, 2026

---

## 🚀 Quick Start

### Run All Services
```bash
# Terminal 1: Backend
cd shoplivebharat/backend
python server.py

# Terminal 2: Frontend (Marketplace)
cd shoplivebharat/frontend
npm start # Runs on http://localhost:3000

# Terminal 3: Waiting Page
cd shoplivebharat/waiting-page
yarn start # Runs on http://localhost:3001
```

---

## 📁 Project Structure

```
shoplivebharat/
├── backend/
│   ├── server.py           # Main FastAPI server
│   ├── email_service.py    # Email handling
│   ├── pdf_reports.py      # PDF generation
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # Main marketplace app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components (new: OrderTracking, BookedSlots, LoginEnhanced)
│   │   ├── contexts/       # Auth, Cart contexts
│   │   ├── hooks/          # useCountdown, useToast
│   │   ├── lib/            # Utilities (api, collections, secureConfig)
│   │   ├── App.js          # Main app
│   │   └── index.js        # Entry point
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies
│   └── .env                # Environment variables (NEVER commit)
│
├── waiting-page/           # Landing page (Phase 2A components copied)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
├── BRAIN.md                # 📖 Architecture & vision
├── SECURITY.md             # 🔐 Security guidelines
├── PROJECT_PROGRESS.md     # 📊 Progress tracking
└── DEV_QUICK_REFERENCE.md  # 📚 This file
```

---

## 🔧 Common Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npm test
```

### Backend Development
```bash
# Install dependencies
pip install -r requirements.txt

# Start server
python server.py

# Run with auto-reload
uvicorn server:app --reload

# Test endpoints
curl http://localhost:8000/api/shops
```

---

## 🔐 Security Essentials

### Environment Variables
```bash
# Copy template
cp .env.example .env

# Edit with actual values
# NEVER commit .env
```

### Sensitive Data
```javascript
// ✅ DO: Use environment variables
const backendUrl = process.env.REACT_APP_BACKEND_URL;

// ❌ DON'T: Hardcode secrets
const apiKey = "sk_live_123456"; // NEVER!

// ✅ DO: Use secure logging
import { secureLog } from "@/lib/secureConfig";
secureLog.info("User login", user); // Hides sensitive fields

// ❌ DON'T: Log sensitive data
console.log("Token:", token); // Exposed!
```

---

## 🎨 Component Patterns

### Animated Component Pattern
```javascript
import { motion } from "framer-motion";

export default function MyComponent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-[2rem] backdrop-blur-xl"
        >
            {/* Content */}
        </motion.div>
    );
}
```

### Form with Validation
```javascript
const [formData, setFormData] = useState({});
const [errors, setErrors] = useState({});

const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
        await submitForm(formData);
        toast.success("Success!");
    } catch (error) {
        toast.error(secureLog.userError(error));
    }
};
```

---

## 📊 New Pages Reference

### Order Tracking Page
```javascript
import OrderTracking from "@/pages/OrderTracking";

// Features:
// - Status filtering
// - Timeline view
// - Invoice download
// - Real-time tracking
```

**Location:** `/frontend/src/pages/OrderTracking.jsx`  
**Route:** `/orders`  
**Props:** None  
**Auth:** Required

### Booked Slots Page
```javascript
import BookedSlots from "@/pages/BookedSlots";

// Features:
// - Consultant profiles
// - Video room links
// - Cancel with confirmation
// - Upcoming/completed tabs
```

**Location:** `/frontend/src/pages/BookedSlots.jsx`  
**Route:** `/bookings`  
**Props:** None  
**Auth:** Required

### Enhanced Login Page
```javascript
import LoginEnhanced from "@/pages/LoginEnhanced";

// Features:
// - Field validation
// - Password strength
// - Rate limiting
// - Error messaging
```

**Location:** `/frontend/src/pages/LoginEnhanced.jsx`  
**Route:** `/login`  
**Props:** None  
**Auth:** Not required

---

## 🔌 API Integration

### Fetch Orders
```javascript
import { fetchOrders } from "@/lib/api";

const orders = await fetchOrders({ limit: 10 });
```

### Fetch Bookings
```javascript
// Add to api.js
export async function fetchBookings(params = {}) {
    const { data } = await api.get("/bookings", { params });
    return data;
}
```

### Login User
```javascript
import { useAuth } from "@/contexts/AuthContext";

const { loginUser } = useAuth();
await loginUser(email, password);
```

---

## 🎬 Animation Reference

### Entrance Animation
```javascript
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Hover Scale
```javascript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

### Loading Spinner
```javascript
<motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    className="w-12 h-12 border-4 border-maroon/20 border-t-maroon rounded-full"
/>
```

### Staggered Children
```javascript
variants={{
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}}
```

---

## 🎯 Routing Setup

### Update App.js
```javascript
import OrderTracking from "@/pages/OrderTracking";
import BookedSlots from "@/pages/BookedSlots";
import LoginEnhanced from "@/pages/LoginEnhanced";

const router = [
    { path: "/orders", element: <OrderTracking /> },
    { path: "/bookings", element: <BookedSlots /> },
    { path: "/login", element: <LoginEnhanced /> },
];
```

### Update Navigation
```javascript
<Link to="/orders" className="nav-link">Orders</Link>
<Link to="/bookings" className="nav-link">Consultations</Link>
<Link to="/login" className="nav-link">Sign In</Link>
```

---

## 🧪 Testing Pages

### Test Order Tracking
```javascript
// Mock data is built-in
// Go to http://localhost:3000/orders
// Test:
// - Filter by status
// - View timeline
// - Download invoice button
// - Responsive layout
```

### Test Booked Slots
```javascript
// Mock data is built-in
// Go to http://localhost:3000/bookings
// Test:
// - View upcoming/completed
// - Cancel slot with confirmation
// - Video link
// - Responsive layout
```

### Test Login
```javascript
// Email: any@example.com
// Password: any password (8+ chars)
// Test:
// - Field validation
// - Rate limiting (5 attempts)
// - Show/hide password
// - Error messages
```

---

## 🐛 Debugging Tips

### Check Logs
```javascript
// View sanitized logs
import { secureLog } from "@/lib/secureConfig";
secureLog.info("Debug message", data);
```

### Network Tab
```
Check API calls in DevTools > Network
Ensure HTTPS in production
Check response status (200, 401, 500, etc.)
```

### React DevTools
```
Install React DevTools extension
Inspect component props
Check context values
```

### Performance
```
DevTools > Performance tab
Record and analyze
Look for janky animations
Check bundle size (npm run build)
```

---

## 📦 Dependencies Used

### Frontend
- **react** - UI library
- **react-router-dom** - Routing
- **framer-motion** - Animations
- **lucide-react** - Icons
- **sonner** - Toast notifications
- **axios** - HTTP client
- **tailwindcss** - Styling

### Backend
- **fastapi** - Web framework
- **uvicorn** - ASGI server
- **pydantic** - Data validation
- **python-multipart** - File uploads
- **aiofiles** - Async file handling

---

## 🚀 Deployment Checklist

### Before Deploying
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables set
- [ ] API endpoints verified
- [ ] Security audit passed
- [ ] Performance optimized
- [ ] Mobile tested
- [ ] Accessibility checked

### Deploy Commands
```bash
# Frontend
npm run build
vercel deploy --prod

# Backend
git push heroku main  # If using Heroku

# Monitor
Check error tracking (Sentry, etc.)
Monitor uptime
Check performance metrics
```

---

## 📞 Quick Contacts

### Documentation
- Full Architecture: `/BRAIN.md`
- Security Guide: `/SECURITY.md`
- Progress Tracking: `/PROJECT_PROGRESS.md`
- Phase 3 Summary: `/PHASE3_BUILD_SUMMARY.md`

### Key Files
- Secure Config: `/frontend/src/lib/secureConfig.js`
- API Client: `/frontend/src/lib/api.js`
- Auth Context: `/frontend/src/contexts/AuthContext.jsx`
- Cart Context: `/frontend/src/contexts/CartContext.jsx`

---

## ⚡ Performance Tips

### Code Splitting
```javascript
import { lazy, Suspense } from "react";
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));

<Suspense fallback={<Loading />}>
    <OrderTracking />
</Suspense>
```

### Memoization
```javascript
import { memo } from "react";
export default memo(MyComponent);
```

### Image Optimization
```javascript
// Use next-gen formats
<img src="image.webp" alt="..." />

// Lazy load
loading="lazy"
```

### Bundle Analysis
```bash
npm install --save-dev webpack-bundle-analyzer
npm run build:analyze
```

---

## 📝 Code Style Guide

### Component Structure
```javascript
// 1. Imports
import { useState } from "react";
import { motion } from "framer-motion";

// 2. Component
export default function MyComponent() {
    // 3. State
    const [data, setData] = useState(null);
    
    // 4. Effects
    useEffect(() => {}, []);
    
    // 5. Handlers
    const handleClick = () => {};
    
    // 6. Render
    return (...);
}
```

### Naming Conventions
```javascript
// Components - PascalCase
MyComponent.jsx

// Files - kebab-case
my-component.jsx

// Variables - camelCase
const userData = {};

// Constants - UPPER_CASE
const API_TIMEOUT = 30000;
```

---

## 🎓 Learning Resources

### Animation
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Principles](https://www.framer.com/motion/guide-basics/)

### Security
- [OWASP Top 10](https://owasp.org/Top10/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### React
- [React Docs](https://react.dev/)
- [React Hooks](https://react.dev/reference/react/hooks)

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/)
- [Tailwind UI](https://tailwindui.com/)

---

## ✅ Checklist for Next Development Session

- [ ] Read BRAIN.md (5 min)
- [ ] Review SECURITY.md (10 min)
- [ ] Start all three services
- [ ] Test new pages in browser
- [ ] Check for console errors
- [ ] Review git status
- [ ] Plan integration tasks
- [ ] Set up environment variables
- [ ] Run security audit

---

**Status:** ✅ Ready for Development  
**Last Updated:** June 29, 2026  
**Next Step:** Phase 2B - Testing & Deployment Tomorrow

Happy coding! 🚀
