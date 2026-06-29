# ShopLive Bharat - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ with npm/yarn
- Python 3.9+
- Git

---

## Step 1: Install Dependencies

### Backend
```bash
cd shoplivebharat/backend
pip install -r requirements.txt
```

### Frontend
```bash
cd ../frontend
npm install
# or
yarn install
```

---

## Step 2: Start the Backend

```bash
# From shoplivebharat/backend directory
python server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**Backend is ready!** ✅

---

## Step 3: Start the Frontend

```bash
# From shoplivebharat/frontend directory (new terminal)
npm start
# or
yarn start
```

The app will open at: **http://localhost:3000**

**Frontend is ready!** ✅

---

## 🎨 What You'll See

### Home Page
- Beautiful landing page with hero section
- "Four Steps to a Wardrobe that Arrives like Art" section with **iOS 16 animations**
- Glassmorphic card design with smooth hover effects
- Floating animated background elements

### Marketplace
- Product listings with glass-effect cards
- Shop directory with luxury branding
- Smooth scroll animations

### Admin Panel
- Access at: http://localhost:3000/admin/login
- Admin Key: `shoplivebharat-admin`
- Manage products with glassmorphic form inputs
- Beautiful animated product grid

---

## 📋 API Endpoints (All Tested ✅)

### Public Endpoints
```
GET    /api/                 → Health check
GET    /api/shops            → List shops
GET    /api/products         → List products
GET    /api/marketplace/stats → Platform stats
GET    /api/launch-info      → Launch countdown
POST   /api/waitlist         → Join waitlist
```

### Test Endpoints
```bash
# Health check
curl http://localhost:8001/api/

# Get shops
curl http://localhost:8001/api/shops

# Get products
curl http://localhost:8001/api/products

# Get marketplace stats
curl http://localhost:8001/api/marketplace/stats
```

---

## 🎬 Experience the Animations

### Try These:
1. **Scroll to "How It Works"** section → Watch cards animate in with spring effect
2. **Hover on cards** → See lift animation and icon glow
3. **Scroll to Footer** → Social links scale on hover
4. **Admin Product Grid** → Cards stagger on page load
5. **Admin Form** → Glass inputs with backdrop blur effect

---

## 🛠️ File Structure

```
shoplivebharat/
├── backend/              # Python FastAPI
│   ├── server.py        # Main API (port 8001)
│   └── requirements.txt
│
├── frontend/            # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── HowItWorks.jsx  ✨ Enhanced with animations
│   │   │   └── Footer.jsx      ✨ Enhanced with animations
│   │   ├── pages/
│   │   │   └── admin/
│   │   │       └── Products.jsx ✨ Enhanced with glassmorphism
│   │   ├── App.js       ✨ Updated CSS with global animations
│   │   └── App.css
│   ├── tailwind.config.js  ✨ Glass utilities added
│   └── package.json
│
└── DESIGN_ENHANCEMENTS.md     📖 Design system docs
```

---

## 🎯 Key Features

### ✨ iOS 16 Design System
- **Glassmorphic Components** - Frosted glass with backdrop blur
- **Smooth Animations** - Spring easing (cubic-bezier)
- **Glass Effects** - 8 shadow levels for depth
- **Animated Backgrounds** - Floating gradient elements
- **Staggered Entrances** - Timed card animations

### 🔧 Admin Panel
- **Product Management** - Create, edit, archive products
- **Shop Management** - Manage store listings
- **Real-time Stats** - Dashboard with live metrics
- **Glass UI** - Modern admin interface

### 📱 Responsive
- Desktop-first design
- Mobile-optimized
- Touch-friendly
- All animations adaptive

---

## 🔐 Admin Access

**URL**: http://localhost:3000/admin/login  
**Admin Key**: `shoplivebharat-admin`  
**Password**: (Admin key acts as password)

Once logged in:
- Navigate to `/admin/dashboard` for overview
- Go to `/admin/products` to manage products
- Visit `/admin/shops` to manage shops

---

## 📊 Backend Response Examples

### Health Check
```json
{
  "service": "ShopLiveBharat API",
  "status": "ok"
}
```

### Get Shops
```json
[
  {
    "id": "shop-jaipur-atelier",
    "name": "Jaipur Atelier House",
    "specialty": "Festive lehengas and mirrorwork jackets",
    "city": "Jaipur",
    "image_url": "/shop-assets/banner-1.jpg"
  }
]
```

### Get Products
```json
[
  {
    "id": "prod-kantha-wrap-jacket",
    "shop_id": "shop-jaipur-atelier",
    "name": "Kantha Wrap Jacket",
    "price": 6490,
    "compare_at_price": 8290,
    "image_url": "/shop-assets/products/jacket-3.jpg",
    "badge": "Live Pick",
    "is_featured": true
  }
]
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change frontend port
PORT=3001 npm start

# Change backend port (edit server.py)
# Change: uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Dependencies Not Installed
```bash
# Backend
pip install --upgrade pip
pip install -r requirements.txt

# Frontend
rm -rf node_modules
npm install
```

### Images Not Loading
- Check backend is running on port 8001
- Verify frontend `.env` has: `REACT_APP_BACKEND_URL=http://localhost:8001`
- Images are served from `/shop-assets/` folder

### API Connection Error
```
Backend not available...
```
Solution:
1. Verify backend is running: `python server.py`
2. Check it's on port 8001
3. Verify CORS is enabled (it is by default)

---

## 📈 Performance Tips

### Frontend Optimization
```bash
# Production build
npm run build

# Check bundle size
npm run analyze
```

### Backend Optimization
- Uses in-memory database for development
- Async/await for I/O operations
- CORS enabled for cross-origin requests

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DESIGN_ENHANCEMENTS.md` | Complete design system documentation |
| `TEST_VERIFICATION_REPORT.md` | Full testing and verification results |
| `ARCHITECTURE.md` | System architecture overview |
| `BUG_FIXES_SUMMARY.md` | Previous bug fixes and solutions |
| `QUICK_START.md` | This file - getting started guide |

---

## 🎓 Next Steps

### For Development
1. ✅ Run backend and frontend
2. 📖 Review `DESIGN_ENHANCEMENTS.md` for animation details
3. 🛠️ Modify components in `src/components/`
4. 🎨 Update styles in `src/App.css` or Tailwind config
5. 🧪 Test in browser DevTools

### For Deployment
1. 📦 Create production build: `npm run build`
2. 🌐 Configure environment variables
3. ☁️ Deploy frontend to Vercel/Netlify
4. 🚀 Deploy backend to your server
5. 🔐 Set up SSL/HTTPS certificates

### For Learning
1. Study Framer Motion animations in components
2. Explore Tailwind glass utilities in config
3. Review animation timings and easing functions
4. Test on different devices and browsers
5. Check performance in DevTools

---

## 🆘 Need Help?

### Check These First:
1. **Console Errors**: Open DevTools (F12) → Console tab
2. **Network Errors**: DevTools → Network tab
3. **Performance Issues**: DevTools → Performance tab
4. **Component Issues**: React DevTools extension

### Common Fixes:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Kill ports and restart
# Port 3000: lsof -ti:3000 | xargs kill -9
# Port 8001: lsof -ti:8001 | xargs kill -9

# Check backend health
curl http://localhost:8001/api/
```

---

## 🎉 Success Checklist

- [ ] Backend running on port 8001 ✅
- [ ] Frontend running on port 3000 ✅
- [ ] Home page loads with animations ✅
- [ ] Marketplace shows products ✅
- [ ] Admin login works with `shoplivebharat-admin` ✅
- [ ] Product grid animates smoothly ✅
- [ ] Glass effects visible on cards ✅
- [ ] Hover animations work ✅
- [ ] No console errors ✅
- [ ] 60fps animations in DevTools ✅

**All green? You're ready to go! 🚀**

---

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review error messages in console
3. Test with sample data provided
4. Verify all dependencies are installed

---

**Version**: 1.0  
**Last Updated**: June 25, 2026  
**Status**: Ready for Production ✅

Happy coding! 🎨✨

