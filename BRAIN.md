# ShopLive Bharat - Brain Document

**Version:** 2.0  
**Last Updated:** June 29, 2026  
**Status:** Phase 2 - Implementation

---

## 🧠 Project Architecture & Vision

### Core Mission
ShopLive Bharat is India's first luxury live-shopping marketplace for the Indian diaspora. We bridge boutique owners in India with customers worldwide through intimate, video-led shopping experiences.

---

## 📊 System Architecture

### Frontend Stack
```
waiting-page (Landing & Waitlist)
├── Hero + Countdown
├── Collections Preview
├── Shop Experience
├── Social Proof
└── Waitlist Form

marketplace (Main App)
├── Authentication
│   ├── User Login/Register
│   ├── Admin Dashboard
│   └── Session Management
├── Marketplace
│   ├── Product Browsing
│   ├── Shopping Cart
│   └── Checkout
├── User Dashboard
│   ├── Order Tracking
│   ├── Booked Slots
│   ├── Wishlist
│   └── Profile
└── Live Shopping
    ├── Video Consultations
    ├── Slot Booking
    └── Real-time Chat
```

### Backend Stack
```
FastAPI (Python)
├── Authentication (JWT + Admin Key)
├── Products API
├── Shops API
├── Orders API
├── Waitlist API
├── Live Shopping API
└── Admin API
```

### Database (Future)
```
MongoDB
├── Users Collection
├── Shops Collection
├── Products Collection
├── Orders Collection
├── Bookings Collection
└── Waitlist Collection
```

---

## 🎨 Design System

### Color Palette
- **espresso** (#2C241B) - Primary dark
- **maroon** (#8B3A3A) - Accent red
- **ivory** (#FAF8F5) - Light background
- **cream** (#F5F1ED) - Light accent
- **stone** (#9B9B9B) - Text secondary
- **gold** (#D4AF37) - Premium accent
- **champagne** (#F7E7CE) - Warm highlight

### Typography
- **Serif** - Headlines, luxury feel (custom font)
- **Sans** - Body text, clarity (system font)
- **Italic** - Emphasis, elegance

### Animation Philosophy
- **Smooth & Intentional** - 0.6-1.2s durations
- **Easing** - `[0.22, 0.61, 0.36, 1]` for natural motion
- **Glass Morphism** - Frosted glass effects for premium feel
- **Staggered Children** - Sequential element animations
- **Micro-interactions** - Hover states, loading states

---

## 🔐 Security Architecture

### Sensitive Data Protection

#### 1. API Keys & Secrets
```javascript
// ❌ NEVER hardcode in frontend
const apiKey = "secret_key_123"

// ✅ USE environment variables
const apiKey = process.env.REACT_APP_BACKEND_URL
```

#### 2. Admin Authentication
```javascript
// ✅ Store in sessionStorage (not localStorage for sensitive ops)
sessionStorage.setItem("slb_admin_session", encryptedToken)

// ❌ NEVER log credentials
console.log("Admin key:", adminKey) // REMOVE

// ✅ Sanitize logs
console.log("🔑 Admin authenticated:", adminKey ? "✓" : "✗")
```

#### 3. User Data Protection
```javascript
// ✅ Redact sensitive fields in responses
const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    // ❌ Never expose:
    // phone (unless user viewing own profile),
    // password,
    // payment details,
    // admin_notes
}
```

#### 4. Error Handling
```javascript
// ❌ Don't expose internal details
catch (error) {
    console.error("DB Error:", error.message) // Shows table names, SQL
}

// ✅ Generic user-friendly errors
catch (error) {
    toast.error("Something went wrong. Please try again.")
}
```

### Environment Variables
```bash
# .env.example (safe to commit)
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development

# .env (NEVER commit)
REACT_APP_ADMIN_SECRET=actual_secret_key
REACT_APP_API_KEY=actual_api_key
```

### Data Encryption
```javascript
// ✅ Use TLS/HTTPS for all API calls
// ✅ Hash passwords on backend (bcrypt)
// ✅ Sign JWTs with strong secret
// ✅ Validate all inputs server-side
// ✅ Rate limit authentication endpoints
```

---

## 🎯 Feature Roadmap

### Phase 2 (Current) - Waiting Page & Deployment
- [x] Component library setup
- [x] Animations & micro-interactions
- [ ] Local testing (tomorrow)
- [ ] QA & bug fixes
- [ ] Vercel deployment
- [ ] Production launch

### Phase 3 (Next) - Core Features
- [ ] User Authentication (complete)
- [ ] Order Tracking (new)
- [ ] Booked Slot Management (new)
- [ ] Live Video Consultations
- [ ] Payment Gateway Integration
- [ ] Email Notifications
- [ ] Analytics Dashboard

### Phase 4 (Future) - Advanced
- [ ] Wishlist & Collections
- [ ] Review & Rating System
- [ ] Influencer Program
- [ ] Referral System
- [ ] Mobile App (native)

---

## 📋 New Pages to Build (Phase 3)

### 1. User Login/Register
- Email/phone login
- Social auth (Google, Apple)
- Password strength meter
- OTP verification
- Onboarding flow

### 2. User Dashboard
- Profile management
- Address book
- Payment methods
- Preferences & wishlist
- Notification settings

### 3. Order Tracking
- Order list with filters
- Order details (timeline)
- Live tracking map
- Cancel/return options
- Download invoice

### 4. Booked Slots
- Upcoming consultations
- Video room link
- Calendar view
- Slot history
- Reschedule option

### 5. Live Shopping Room
- Video stream
- Product carousel
- Real-time chat
- Cart sidebar
- "Add to Cart" button

### 6. Checkout
- Address selection
- Shipping options
- Payment methods
- Order summary
- Confirmation screen

---

## 🎬 Animation Guidelines

### Principle: Liquid Glass

**Concept:** Smooth, flowing animations with glassmorphism effects

```javascript
// Hero entrance
fade = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.1, delay, ease: [0.22, 0.61, 0.36, 1] },
})

// Hover effects
whileHover: {
    scale: 1.05,
    backgroundColor: "rgba(250,248,245,0.2)",
    transition: { duration: 0.4 }
}

// Loading states
animate: {
    opacity: [0.6, 1, 0.6],
    transition: { duration: 2, repeat: Infinity }
}

// Glass morphism
className="backdrop-blur-xl rounded-[2rem] border border-white/25 shadow-glass-lg"
```

### Staggered Container Pattern
```javascript
containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.1,
        },
    },
}
```

---

## 🔄 Data Flow Architecture

### Authentication Flow
```
User Input
    ↓
Validate Locally
    ↓
API Call (TLS encrypted)
    ↓
Backend Validation
    ↓
JWT Generation
    ↓
Store in SessionStorage
    ↓
Update UI State
    ↓
Redirect to Dashboard
```

### Order Flow
```
Browse Products
    ↓
Add to Cart
    ↓
Book Consultation Slot
    ↓
Video Consultation
    ↓
Finalize Order
    ↓
Payment Processing
    ↓
Order Confirmation
    ↓
Tracking Page
```

### Live Shopping Flow
```
Browse Products
    ↓
Join Video Room
    ↓
Interact with Consultant
    ↓
Add to Cart
    ↓
Checkout
    ↓
Payment
    ↓
Order Complete
```

---

## 💾 State Management

### Global State (Contexts)
```javascript
// AuthContext
- isLoggedIn: boolean
- user: { id, name, email, phone, city }
- token: JWT string
- loginUser(email, password)
- logoutUser()

// CartContext
- cartItems: array
- addToCart(product)
- removeFromCart(productId)
- getTotalPrice()
- getTotalItems()

// BookingContext (NEW)
- bookedSlots: array
- upcomingSlots: array
- bookSlot(consultantId, dateTime)
- cancelSlot(slotId)
```

### Component State
```javascript
// Local state for UI
- isLoading: boolean
- formData: object
- selectedFilters: array
- showModal: boolean
```

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/profile
POST   /api/auth/refresh-token
```

### Products & Shops
```
GET    /api/products
GET    /api/products/:id
GET    /api/shops
GET    /api/shops/:id
GET    /api/collections
```

### Orders & Bookings
```
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
GET    /api/bookings
POST   /api/bookings
PATCH  /api/bookings/:id
DELETE /api/bookings/:id
```

### Admin
```
POST   /api/admin/shops
PATCH  /api/admin/shops/:id
DELETE /api/admin/shops/:id
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id
```

---

## 📱 Responsive Design

### Breakpoints
```css
mobile: 375px
tablet: 768px
desktop: 1024px
large: 1440px
```

### Mobile-First Approach
- Design for mobile first
- Scale up for tablet
- Enhance on desktop
- Touch-friendly tap targets (44px+)

---

## 🧪 Testing Strategy

### Unit Tests
- Component rendering
- Event handlers
- Utility functions
- Hooks behavior

### Integration Tests
- API calls
- Form submissions
- Navigation flows
- Authentication

### E2E Tests
- Complete user journeys
- Payment flow
- Booking flow
- Order tracking

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] Environment variables set
- [ ] API endpoints verified
- [ ] SSL certificates ready
- [ ] CDN configured

### Post-Deployment
- [ ] Smoke tests pass
- [ ] Monitoring alerts set
- [ ] Analytics configured
- [ ] Error tracking enabled
- [ ] Support documentation ready
- [ ] Team trained

---

## 📞 Key Contacts & Resources

### Team
- Lead Dev: [Name]
- Designer: [Name]
- Product: [Name]

### Documentation
- Design System: `/docs/DESIGN.md`
- API Docs: `/docs/API.md`
- Deployment: `/docs/DEPLOYMENT.md`

### External Services
- Vercel: https://vercel.com
- MongoDB: https://mongodb.com
- Stripe/Razorpay: [Provider URLs]

---

## 🎓 Development Guidelines

### Code Style
- Use ES6+ features
- Functional components (React Hooks)
- Prop validation with TypeScript (future)
- Comment complex logic
- Follow naming conventions

### Git Workflow
```bash
# Feature branch
git checkout -b feature/feature-name

# Commit messages
git commit -m "feat: add order tracking page"

# Push to remote
git push -u origin feature/feature-name
```

### Performance Tips
- Code splitting with React.lazy()
- Image optimization (next-gen formats)
- Lazy load heavy components
- Memoize expensive computations
- Minimize bundle size

---

## 📈 Success Metrics

### User Metrics
- Sign-ups
- Active users
- Conversion rate (waitlist → customer)
- Average order value

### Technical Metrics
- Page load time < 2s
- Core Web Vitals (LCP, CLS, FID)
- API response time < 200ms
- 99.9% uptime

### Business Metrics
- Revenue per user
- Customer lifetime value
- Repeat purchase rate
- Net promoter score (NPS)

---

## 🔮 Future Enhancements

- [ ] Real-time notifications (WebSockets)
- [ ] AI product recommendations
- [ ] Advanced search with filters
- [ ] Virtual try-on (AR)
- [ ] Live streaming features
- [ ] Inventory management system
- [ ] Multi-currency support
- [ ] Subscription box service

---

**Last Review:** June 29, 2026  
**Next Review:** After Phase 2 deployment  
**Status:** Ready for Phase 3 implementation
