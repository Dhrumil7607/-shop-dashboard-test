# ShopLiveBharat — Luxury Marketplace + Waiting Page

A premium, cinematic, Indian-wedding-inspired marketplace with separate waiting page. Built with **React + FastAPI + MongoDB** and **Resend** for transactional + founder-brief emails.

> **✨ NEW**: This project is now separated into two independent applications:
> - **Waiting Page** - Pre-launch countdown & waitlist
> - **Marketplace** - Main e-commerce platform

---

## 📂 Project Structure

```
shoplivebharat/
├── waiting-page/        # Pre-launch landing & waitlist
├── frontend/            # Main marketplace
├── backend/             # Shared API server
├── SEPARATION_GUIDE.md  # Complete separation documentation
└── setup-separation.*   # Setup scripts (bash/bat)
```

**See [SEPARATION_GUIDE.md](SEPARATION_GUIDE.md) for complete documentation.**

---

## 🚀 Quick Start

### Both Applications (Recommended)
```bash
# First time setup - copies shared components and installs dependencies
bash setup-separation.sh        # macOS/Linux
setup-separation.bat            # Windows

# Terminal 1: Waiting Page
cd waiting-page && yarn start

# Terminal 2: Marketplace  
cd frontend && yarn start
```

### Single Application

**Waiting Page Only:**
```bash
cd waiting-page
yarn install
yarn start
```

**Marketplace Only:**
```bash
cd frontend
yarn install
yarn start
```

---

## 📚 Full Documentation

- **[SEPARATION_GUIDE.md](SEPARATION_GUIDE.md)** - Setup, deployment, and architecture
- **[waiting-page/README.md](waiting-page/README.md)** - Waiting page specific docs
- **[frontend/README.md](frontend/README.md)** - Marketplace specific docs (coming soon)

---

## Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS 3, framer-motion 12,
  shadcn/ui (Radix primitives), sonner toasts, lucide-react icons.
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic v2, Resend (email),
  reportlab (PDF founder briefs).
- **Database**: MongoDB.
- **Typography**: Cormorant Garamond (serif) + Outfit (sans).
- **Palette**: ivory `#FAF8F5`, cream `#F1ECE3`, champagne `#C6A87C`,
  muted maroon `#8B3A3A`, espresso `#2C241B`.

---

## Local setup

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in MONGO_URL, RESEND_API_KEY, etc.
uvicorn server:app --reload --port 8001
```

### 2. Frontend

```bash
cd frontend
yarn install
cp .env.example .env   # set REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

Open http://localhost:3000.

Marketplace: http://localhost:3000/shop

Admin panel: http://localhost:3000/admin

Default local admin key: `shoplivebharat-admin`. Set `ADMIN_API_KEY` in
production and use the same value in the admin panel. If `MONGO_URL` is not set,
the API uses an in-memory demo store so shops and products work during the
current server session. Set `MONGO_URL` for persistent marketplace data.

---

## Vercel deployment

This repo is configured to deploy as one Vercel project:

- React frontend: `frontend/` builds to `frontend/build`
- FastAPI backend: `api/index.py` exposes `backend/server.py` under `/api`

### Vercel project settings

Use the repo root as the Vercel root directory. The included `vercel.json`
already sets:

```
Install Command: cd frontend && npm install
Build Command:   cd frontend && npm run build
Output Directory: frontend/build
```

### Required Vercel environment variables

Set these in **Vercel > Project > Settings > Environment Variables**:

```
MONGO_URL=mongodb+srv://...
DB_NAME=shoplivebharat
CORS_ORIGINS=https://your-vercel-domain.vercel.app

RESEND_API_KEY=
SENDER_EMAIL=onboarding@resend.dev
SENDER_NAME=ShopLiveBharat
REPLY_TO_EMAIL=
ADMIN_NOTIFICATION_EMAIL=
ADMIN_BATCH_SIZE=5
ADMIN_API_KEY=replace-with-a-strong-secret
```

`REACT_APP_BACKEND_URL` is optional on Vercel. If it is not set, the frontend
uses same-origin `/api`, which is what the bundled Vercel config expects.

---

## Environment variables

### `backend/.env`

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=shoplivebharat
CORS_ORIGINS=*

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
SENDER_EMAIL=onboarding@resend.dev           # or hello@yourverifieddomain.com
SENDER_NAME=ShopLiveBharat
REPLY_TO_EMAIL=                              # optional
ADMIN_NOTIFICATION_EMAIL=shoplivebharat@gmail.com
ADMIN_BATCH_SIZE=5
```

> **Resend testing-mode note**: until you verify a domain at
> https://resend.com/domains, emails will only deliver to the email you signed
> up to Resend with. Verify a domain to unlock delivery to anyone.

### `frontend/.env`

```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## API surface

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/launch-info` | Returns the persisted launch date (30 days from first call). |
| POST | `/api/waitlist` | Register a waitlist user (dedupe by email, phone validation). Triggers welcome email + every-Nth founder PDF brief. |
| GET  | `/api/waitlist/stats` | Public counters: total members, stores joining, premium collections. |
| GET  | `/api/admin/waitlist` | Admin list of waitlist entries. |
| POST | `/api/admin/trigger-launch-email` | Launch-day blast to all unsent members. |
| POST | `/api/admin/send-batch-now?size=5&to=...` | Force-send a PDF founder brief immediately (for testing). |

---

## Notable files

```
backend/
├── server.py            # FastAPI app + routes
├── email_service.py     # Resend integration + email templates (welcome / launch / admin batch)
├── pdf_reports.py       # ReportLab founder PDF brief
├── .env
└── requirements.txt

frontend/src/
├── App.js
├── index.css            # design tokens + utility classes (glass, float-field, marquee, etc.)
├── lib/
│   ├── api.js
│   └── collections.js   # the 6 launch collections + hero images
├── hooks/useCountdown.js
├── components/
│   ├── Hero.jsx             # cinematic parallax hero
│   ├── Countdown.jsx        # glassmorphism 30-day countdown
│   ├── HowItWorks.jsx       # 4-step editorial
│   ├── FeaturedCollections.jsx  # asymmetric bento grid (6 collections)
│   ├── SocialProof.jsx      # animated counters + marquee
│   ├── Waitlist.jsx         # embedded section + modal (floating labels)
│   └── Footer.jsx
└── pages/
    ├── Landing.jsx
    └── CollectionPreview.jsx   # /collection/:slug — coming soon per capsule
```

---

## License

Private — © ShopLiveBharat. All rights reserved.
