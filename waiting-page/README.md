# 🎉 ShopLive Bharat - Separated Websites

This directory contains the **Waiting Page** application - the landing/countdown experience for pre-launch.

## 📁 Project Structure

```
waiting-page/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable components (copied from frontend)
│   ├── lib/              # Utilities and API calls
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── App.js            # Main app (no routing, just landing)
│   ├── index.js          # Entry point
│   ├── App.css           # Styles
│   └── index.css         # Global styles
├── package.json          # Dependencies
├── craco.config.js       # CRA config
└── tailwind.config.js    # Tailwind CSS config
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd waiting-page
yarn install
```

### 2. Set Up Environment Variables
Create a `.env` file in the waiting-page directory:
```
REACT_APP_API_URL=<your-backend-api-url>
```

### 3. Copy Required Files
You need to copy these directories from `frontend/src` to `waiting-page/src`:

```bash
# From the root shoplivebharat directory
cp -r frontend/src/components/* waiting-page/src/components/
cp -r frontend/src/lib/* waiting-page/src/lib/
cp -r frontend/src/hooks/* waiting-page/src/hooks/
cp -r frontend/src/contexts/* waiting-page/src/contexts/
```

### 4. Run Development Server
```bash
yarn start
```

The app will open at `http://localhost:3000`

### 5. Build for Production
```bash
yarn build
```

## 🔧 Key Differences from Main Frontend

- **No React Router**: This is a single-page waiting experience, not a multi-page app
- **Lighter Dependencies**: Removed marketplace, cart, and checkout related packages
- **Simplified App.js**: Directly renders the Landing component
- **No Authentication**: No admin panels or user auth (those are in the main marketplace)

## 📦 Components Included

These components should be copied from the main frontend:

- `Hero` - Hero section with logo and navigation
- `Countdown` - Countdown timer to launch
- `HowItWorks` - Process explanation
- `FeaturedCollections` - Preview of curated collections
- `ShopExperience` - Why shop with us section
- `SocialProof` - Live member count
- `Waitlist` - Waitlist signup modal
- `Footer` - Footer component

## 🎯 Deployment

### Vercel Deployment
```bash
vercel deploy
```

### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
```

## 🔗 Linking to Marketplace

Update the "Shop Now" button in `Landing.jsx` to point to your marketplace:

```jsx
<a href="https://marketplace.shoplive bharat.com" target="_blank" rel="noopener noreferrer">
  Shop Now
</a>
```

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API endpoint |
| `REACT_APP_ANALYTICS_ID` | Google Analytics ID |

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
PORT=3001 yarn start
```

### Dependency Issues
```bash
rm -rf node_modules yarn.lock
yarn install
```

---

**Created**: June 2026  
**Part of**: ShopLive Bharat Multi-Project Separation
