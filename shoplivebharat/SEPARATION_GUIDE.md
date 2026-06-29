# 📦 ShopLive Bharat - Website Separation Guide

## Overview

The ShopLive Bharat project has been separated into **two independent applications**:

### 1. **Waiting Page** (`waiting-page/`)
- **Purpose**: Pre-launch landing/countdown experience
- **Features**: Hero section, countdown timer, waitlist signup, social proof
- **Deployment**: Can run on a separate domain (e.g., `waiting.shoplive bharat.com` or main domain during pre-launch)
- **Users**: Anyone on the web before marketplace launch
- **No Routes**: Single-page experience

### 2. **Marketplace** (`frontend/`)
- **Purpose**: Main e-commerce platform
- **Features**: Product browsing, shopping cart, checkout, admin dashboard
- **Deployment**: Main marketplace domain (e.g., `marketplace.shoplive bharat.com` or `shop.shoplive bharat.com`)
- **Users**: Customers shopping, admins managing inventory
- **Multiple Routes**: Full SPA with routing

---

## 📂 Directory Structure

```
shoplivebharat/
├── backend/                          # Shared backend (API, database, services)
│   ├── server.py
│   ├── email_service.py
│   └── requirements.txt
├── api/                              # Vercel serverless functions
│   └── index.py
├── frontend/                         # MARKETPLACE APP (was "frontend")
│   ├── src/
│   │   ├── components/              # UI components (shared)
│   │   ├── pages/                   # Page components
│   │   │   ├── Marketplace.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   └── admin/              # Admin pages
│   │   ├── contexts/               # Auth, Cart contexts
│   │   ├── lib/                    # Utilities, API calls
│   │   └── App.js                  # App with marketplace routes
│   ├── package.json
│   └── vercel.json
├── waiting-page/                    # WAITING PAGE APP (NEW)
│   ├── src/
│   │   ├── components/              # Components (copy from frontend)
│   │   ├── pages/
│   │   │   └── Landing.jsx         # Landing page
│   │   ├── lib/                    # API utilities (copy from frontend)
│   │   └── App.js                  # App with landing page only
│   ├── package.json
│   ├── README.md                   # Waiting page documentation
│   └── vercel.json                 # Separate Vercel config
└── SEPARATION_GUIDE.md             # This file
```

---

## 🔄 Setup Instructions

### Phase 1: Copy Shared Components

Copy the following directories from `frontend/` to `waiting-page/`:

```bash
# Navigate to shoplivebharat directory
cd shoplivebharat

# Copy components
cp -r frontend/src/components/* waiting-page/src/components/

# Copy libraries
cp -r frontend/src/lib/* waiting-page/src/lib/

# Copy hooks
cp -r frontend/src/hooks/* waiting-page/src/hooks/

# Copy contexts (if needed)
cp -r frontend/src/contexts/* waiting-page/src/contexts/
```

### Phase 2: Install Dependencies

```bash
# Install marketplace dependencies
cd frontend
yarn install

# Install waiting page dependencies
cd ../waiting-page
yarn install
```

### Phase 3: Environment Configuration

Create `.env` files in both projects:

**`frontend/.env`** (Marketplace)
```
REACT_APP_API_URL=https://api.shoplive bharat.com
REACT_APP_ENV=production
```

**`waiting-page/.env`** (Waiting Page)
```
REACT_APP_API_URL=https://api.shoplive bharat.com
REACT_APP_ENV=production
```

---

## 🚀 Development & Deployment

### Local Development

```bash
# Terminal 1: Marketplace
cd frontend
yarn start

# Terminal 2: Waiting Page
cd waiting-page
yarn start
```

### Production Build

```bash
# Build Marketplace
cd frontend
yarn build
# Output: build/

# Build Waiting Page
cd waiting-page
yarn build
# Output: build/
```

### Vercel Deployment

Both apps have separate `vercel.json` configs for independent deployment.

**Marketplace Deployment:**
```bash
cd frontend
vercel deploy --prod
```

**Waiting Page Deployment:**
```bash
cd waiting-page
vercel deploy --prod
```

---

## 🔗 Domain Strategy

### Option 1: Separate Domains (Recommended)
- **Waiting Page**: `waiting.shoplive bharat.com` (or main domain during pre-launch)
- **Marketplace**: `marketplace.shoplive bharat.com` or `shop.shoplive bharat.com`
- **Transition**: When launching, redirect waiting page domain to marketplace

### Option 2: Same Domain Different Paths
- **Waiting Page**: `shoplive bharat.com/`
- **Marketplace**: `shoplive bharat.com/shop`
- Requires reverse proxy/routing at server level

### Option 3: Subdomains
- **Waiting Page**: `shoplive bharat.com` (main domain)
- **Marketplace**: `shop.shoplive bharat.com`

---

## 📋 Key Changes Made

### Frontend (Marketplace)
✅ Removed `/` (Landing) route  
✅ Removed `/waiting` route  
✅ Updated home route to `/marketplace`  
✅ Removed Landing.jsx page import  
✅ Removed Waiting.jsx page import  
✅ Updated package.json name to "marketplace"  

### Waiting Page (New)
✅ Created new project structure  
✅ Simplified App.js (no routing, single component)  
✅ Lighter package.json (removed cart, checkout, admin packages)  
✅ Configuration files (craco, tailwind, etc.)  
✅ Documentation and setup guides  

---

## 🔌 API Sharing

Both applications share the same backend API. Make sure the `REACT_APP_API_URL` environment variable points to the correct API endpoint.

### Backend Endpoints
- `POST /api/waitlist/join` - For waiting page signup
- `GET /api/launch/info` - Launch date info
- `GET /api/stats` - Waitlist stats
- `GET /api/products` - Products (marketplace)
- `POST /api/orders` - Order creation (marketplace)
- etc.

---

## 📊 Migration Checklist

- [ ] Copy all components to `waiting-page/src/components/`
- [ ] Copy all lib utilities to `waiting-page/src/lib/`
- [ ] Install dependencies in both projects
- [ ] Configure environment variables
- [ ] Test waiting page locally: `cd waiting-page && yarn start`
- [ ] Test marketplace locally: `cd frontend && yarn start`
- [ ] Update deployment configs (Vercel, Docker, etc.)
- [ ] Set up domain routing/DNS
- [ ] Configure CI/CD for both projects
- [ ] Test production builds
- [ ] Deploy both applications

---

## 🆘 Troubleshooting

### Components Missing in Waiting Page
If you see "Component not found" errors:
1. Check the component file path in `frontend/src/components/`
2. Copy the missing component to `waiting-page/src/components/`
3. Restart the dev server

### API Errors
- Ensure `REACT_APP_API_URL` is correctly set in both `.env` files
- Check that backend API is running and accessible
- Verify CORS settings in backend

### Port Conflicts
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Use different ports
cd frontend && PORT=3000 yarn start
cd waiting-page && PORT=3001 yarn start
```

---

## 📝 Notes

1. **Shared Backend**: Both applications use the same backend. Ensure API endpoints are compatible.
2. **Asset Management**: Images and logos are in both `public/` directories. Consider symlinking or shared CDN.
3. **Version Control**: Each app can be in separate git repositories for independent versioning.
4. **Deployment**: Each app deploys independently - no dependencies between them.
5. **Analytics**: Set up separate analytics IDs if needed for tracking different user flows.

---

## 🔐 Security Notes

- Keep API keys and secrets in `.env` files (gitignored)
- Use separate API tokens/auth for waiting page and marketplace if needed
- Implement CORS policies to allow cross-origin requests
- Keep both applications up-to-date with security patches

---

**Last Updated**: June 2026  
**Version**: 1.0  
**Maintainers**: ShopLive Bharat Team
