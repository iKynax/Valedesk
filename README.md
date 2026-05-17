<div align="center">
  <img src="public/images/logo-light.png" alt="Valedesk" height="60" />
  <h3>Premium Coworking Space Booking Platform</h3>
  <p>Browse spaces, book instantly, and manage your workspace — all in one polished interface.</p>

  ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=flat&logo=tailwindcss&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
  ![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat&logo=stripe&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat&logo=vite&logoColor=white)
</div>

---

## ✨ Overview

**Valedesk** is a full-stack coworking space booking platform built for the [Shortcut Asia Internship Challenge 2026](https://shortcut.my) (Topic 5: Simple Booking System). It goes beyond the basic requirements by delivering a production-grade experience with:

- **Real-time availability calendar** with selectable time slots per room
- **Full booking management** — create, view, and cancel bookings
- **Secure Stripe checkout** for seamless payment processing
- **AI-powered assistant** (Gemini) with smart keyword fallback
- **Role-based admin dashboard** with analytics, room/user management, and promotions
- **Dark/Light mode** with automatic theme persistence

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                    │
│   Landing · Auth · Dashboard · Booking · Admin Panel    │
├─────────────────────────────────────────────────────────┤
│  Supabase (Auth + DB)  │  Stripe (Payments)  │  Gemini │
└─────────────────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4 | UI, routing, state management |
| **Auth & Database** | Supabase | User auth, profiles, bookings, rooms |
| **Payments** | Stripe | Checkout sessions, payment processing |
| **AI Assistant** | Google Gemini API | Chatbot with keyword fallback |
| **State** | Zustand, TanStack Query | Client state & server cache |
| **Animations** | Motion (Framer Motion) | Page transitions, micro-interactions |
| **Hosting** | Netlify | Static SPA deployment |

---

## 🚀 Key Features

### 1. Availability Calendar with Selectable Time Slots
- Visual weekly calendar grid per room
- Real-time slot availability from Supabase
- Date/time validation before booking

### 2. Booking Management (Create, Edit, Cancel)
- Multi-step booking flow with progress indicator
- QR code generation for each booking confirmation
- Booking history with status tracking
- Cancel functionality with instant availability update

### 3. Additional Features
- **Stripe Integration** — Secure payment checkout with demo/live modes
- **AI Chatbot** — Gemini-powered assistant with rate-limit fallback
- **Admin Dashboard** — Analytics, booking oversight, room CRUD, user management, promotions
- **Dark/Light Mode** — System-aware with manual toggle
- **Responsive Design** — Mobile-first, works on all screen sizes
- **Protected Routes** — Role-based access control (admin vs. member)

---

## 📂 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── landing/          # Landing page sections (Navbar, Hero, etc.)
│   ├── ui/               # Base UI primitives (Button, Input, Tabs)
│   ├── AIWidget.tsx       # AI chatbot with Gemini + fallback
│   ├── ValedeskLogo.tsx   # Dynamic logo component (dark/light)
│   └── ...
├── hooks/                # Custom React hooks (useAuth, useDarkMode)
├── layouts/              # Page layout shells
│   ├── DashboardLayout.tsx
│   └── AdminLayout.tsx
├── lib/                  # Utilities (Supabase client, env config)
├── pages/                # Route-level page components
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   ├── admin/            # Admin portal pages
│   └── ...
├── store/                # Zustand stores
├── types/                # TypeScript type definitions
├── App.tsx               # Router configuration
└── main.tsx              # Application entry point
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js ≥ 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/iKynax/Valedesk.git
cd Valedesk

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase, Stripe, and Gemini API keys

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key (falls back to demo mode) |
| `VITE_GEMINI_API_KEY` | No | Google Gemini API key for AI assistant |
| `VITE_ADMIN_ACCESS_CODE` | No | Admin portal access code (default: `VDADM1`) |

---

## 🌐 Deployment (Netlify)

```bash
# Build for production
npm run build

# Deploy to Netlify
# Option 1: Connect GitHub repo to Netlify (recommended)
# Option 2: Manual deploy via Netlify CLI
npx netlify deploy --prod --dir=dist
```

**Netlify Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- SPA routing is handled by `public/_redirects`

---

## 🧪 Test Accounts

| Role | Email | Password | Access Code |
|------|-------|----------|-------------|
| Admin | admin1@gmail.com | abc123 | VDADM1 |
| Member | joeking@gmail.com | abc123 | — |

---

## 🎨 Design Decisions

- **Tailwind CSS 4** chosen for utility-first styling with v4's lightning-fast Vite plugin
- **Supabase** for zero-config auth + PostgreSQL — ideal for rapid prototyping with production-grade security
- **Zustand** over Redux for simpler, boilerplate-free state management
- **Motion library** for declarative animations that enhance UX without complexity
- **Smart AI fallback** — when Gemini API hits rate limits, the chatbot switches to a keyword matcher covering common queries (refunds, pricing, amenities)

---

## 📝 Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| API rate limiting on Gemini free tier | Built keyword-based fallback system that intelligently routes queries |
| Dark mode consistency across 10+ pages | Created `ValedeskLogo` component with auto/dark/light variants |
| Admin routing race condition | Wait for profile to load before redirect; check sessionStorage as backup |
| Stripe integration without backend | Express API proxy with graceful demo-mode fallback |

---

## 🔮 Future Improvements

- **Email notifications** via Resend/SendGrid for booking confirmations
- **Real-time updates** using Supabase Realtime subscriptions
- **Calendar sync** (Google Calendar / Outlook integration)
- **Mobile app** using React Native with shared business logic
- **Multi-tenant support** for managing multiple coworking locations

---

## 📄 License

MIT © [iKynax](https://github.com/iKynax)