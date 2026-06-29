# ShopLiveBharat - Full Stack Architecture

## Overview
A complete e-commerce platform for Indian luxury fashion with separated admin and marketplace sections.

## Project Structure

```
shoplivebharat/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx     # Public landing page
│   │   │   ├── Waiting.jsx     # Waiting list page
│   │   │   ├── AdminLogin.jsx  # Admin login
│   │   │   ├── Marketplace.jsx # Marketplace page
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx   # Admin dashboard
│   │   │       ├── Products.jsx    # Product management
│   │   │       └── Shops.jsx       # Shop management
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx     # Admin sidebar layout
│   │   │   └── MarketplaceLayout.jsx # Customer layout
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Authentication state
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/
│   │   │   └── api.js              # API client
│   │   └── App.js                  # Router setup
│   └── package.json
│
├── backend/                     # FastAPI + MongoDB
│   ├── server.py               # Main API server
│   ├── email_service.py        # Email notifications
│   ├── pdf_reports.py          # Report generation
│   ├── requirements.txt
│   └── .env                    # Environment variables
│
└── README.md
```

## Frontend Features

### Public Section
- **Landing Page** - Hero, countdown, how it works, featured collections
- **Marketplace** - Browse and shop products
- **Collections** - Featured product collections
- **Waiting List** - Register for launch notifications

### Admin Section
- **Authentication** - Admin key-based login
- **Dashboard** - Overview of stats, recent shops & products
- **Products Management** - Create, edit, archive products
- **Shops Management** - Manage shop listings
- **Protected Routes** - Admin-only access with auth guard

## Backend API

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### Public Endpoints
```
GET  /launch-info              # Get launch date & countdown
POST /waitlist                 # Register for waitlist
GET  /waitlist/stats           # Public statistics
GET  /shops                    # List shops (paginated)
GET  /shops/{shop_id}          # Get shop details
GET  /products                 # List products (paginated)
GET  /products/{product_id}    # Get product details
GET  /collections              # List featured collections
```

#### Admin Endpoints (Require X-Admin-Key header)
```
POST   /admin/shops            # Create shop
GET    /admin/shops            # List all shops
PUT    /admin/shops/{id}       # Update shop
DELETE /admin/shops/{id}       # Archive shop

POST   /admin/products         # Create product
GET    /admin/products         # List all products
PUT    /admin/products/{id}    # Update product
DELETE /admin/products/{id}    # Archive product

GET    /admin/stats            # Dashboard statistics
GET    /admin/waitlist         # Get all waitlist entries
```

## Authentication

### Admin Authentication
1. User enters admin key on `/admin/login`
2. Key is validated by backend
3. Key stored in localStorage and AuthContext
4. Protected admin routes check auth status
5. All admin API calls include `X-Admin-Key` header

### Admin Key
Set in backend `.env`:
```env
ADMIN_API_KEY=your-secure-admin-key
```

## Database Schema

### Collections

#### waitlist
```json
{
  "_id": "ObjectId",
  "id": "uuid",
  "full_name": "string",
  "email": "email",
  "country_code": "+91",
  "phone": "1234567890",
  "source": "landing",
  "created_at": "ISO8601",
  "launch_email_sent": false
}
```

#### shops
```json
{
  "_id": "ObjectId",
  "id": "uuid",
  "slug": "shop-name",
  "name": "Shop Name",
  "owner_name": "Owner",
  "owner_email": "owner@example.com",
  "city": "City",
  "country": "India",
  "specialty": "Specialty",
  "description": "Description",
  "image_url": "https://...",
  "instagram_url": "https://instagram.com/...",
  "is_active": true,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

#### products
```json
{
  "_id": "ObjectId",
  "id": "uuid",
  "slug": "product-name",
  "shop_id": "shop-uuid",
  "shop_name": "Shop Name",
  "name": "Product Name",
  "category": "Category",
  "description": "Description",
  "price": 5999,
  "compare_at_price": 7999,
  "currency": "INR",
  "image_url": "https://...",
  "hover_image_url": "https://...",
  "stock": 10,
  "badge": "New",
  "is_featured": false,
  "is_active": true,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

## Setup & Running

### Frontend
```bash
cd frontend
npm install
npm start           # Runs on http://localhost:3001
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python server.py    # Runs on http://localhost:8000
```

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=shoplivebharat
ADMIN_API_KEY=your-secure-admin-key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
LAUNCH_DATE=2026-06-28T00:00:00+05:30
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:8000/api
```

## Key Features

✅ Separate admin and marketplace interfaces
✅ MongoDB persistence
✅ Email notifications
✅ Product inventory management
✅ Shop listings with details
✅ Waiting list registration
✅ Admin dashboard with statistics
✅ Responsive design
✅ CORS-enabled API
✅ Error handling & validation

## Development Workflow

1. **Landing Page** - Public-facing marketing site
2. **Admin Panel** - Shop & product management
3. **Marketplace** - Customer-facing store
4. **Waiting List** - Pre-launch engagement
5. **Post-Launch** - Full e-commerce operations

## Security Considerations

- Admin API key stored in backend environment
- Protected routes require authentication
- Email validation on all user inputs
- Phone number validation
- Rate limiting on API endpoints (recommended)
- HTTPS in production (recommended)
- CORS configured for frontend domain

## Next Steps

1. ✅ Separate admin and marketplace UI
2. ✅ Implement authentication context
3. ⏳ Add shopping cart functionality
4. ⏳ Implement payment gateway (Razorpay/Stripe)
5. ⏳ Add order management
6. ⏳ Implement user accounts
7. ⏳ Add inventory tracking
8. ⏳ Analytics & reporting

