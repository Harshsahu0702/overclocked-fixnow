# 🚀 FixNow Frontend - Pro Dashboard & Marketplace

Welcome to the frontend of **FixNow**, an AI-powered marketplace connecting users with local service professionals ("Bhaiyas"). This frontend is designed for high-speed interactions, real-time tracking, and a premium "Tactical HUD" experience for partners.

## 🛠️ Tech Stack
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS + Framer Motion (for smooth micro-animations)
- **Icons**: Lucide React
- **Real-time**: Socket.io-client
- **API Handling**: Axios (with centralized interceptors)
- **State Management**: React Hooks (useState, useEffect)

---

## 📂 Project Structure
```text
src/
├── components/          # Reusable UI components (AuthModal, ProfileSection)
├── context/             # Global state (if applicable)
├── pages/               # Main route components
│   ├── customer/        # LandingPage, BookingPage (Search & Results)
│   ├── partner/         # PartnerSignup, PartnerDashboard (The "MissionControl")
│   └── admin/           # AdminDashboard (Verification & Job Monitoring)
├── services/            # API & Socket initialization
│   ├── api.js           # Axios instance with JWT interceptors
│   └── socket.js        # Socket.io connection logic
├── utils/               # Helper functions
└── App.jsx              # Main router and app entry
```

---

## 🌊 Core Workflows

### 1. Customer Search & Booking
- **Entry**: `Landingpage.jsx` captures the user's need (e.g., "Mera AC repair kar do").
- **AI Interpretation**: Query is sent to `/api/ai/interpret`.
- **Finding Workers**: `BookingPage.jsx` receives the service category and searches for nearby partners via `/api/users/search-partners`.
- **Booking**: User clicks "Book Now", triggering a socket event `request_bhaiya` to notify all matching partners.

### 2. Partner "Mission Control"
- **Onboarding**: `PartnerSignup.jsx` handles document uploads (Selfie, Aadhaar).
- **HUD Interface**: `PartnerDashboard.jsx` provides a real-time feed of jobs.
- **Location Tracking**: Uses browser Geolocation API to emit `update_location` via sockets, allowing customers to track them live.

### 3. Real-time Status Stepper
- Jobs move through: `Pending` ➔ `Accepted` ➔ `In Progress` ➔ `Completed`.
- Every transition is synced across the customer, partner, and admin via socket events.

---

## 📡 API Calling & Socket Integration

### API Service (`src/services/api.js`)
All requests use a centralized Axios instance. It automatically attaches the `Bearer <token>` from localStorage to every request.
```javascript
import api from './services/api';
const response = await api.get('/users/profile');
```

### Socket Service (`src/services/socket.js`)
We use a singleton socket instance to maintain a single connection throughout the app.
- **Room Joining**: On login, users join a room named `{role}_{id}` (e.g., `partner_65f...`).
- **Global Broadcasts**: Partners join an `all_partners` room for new job notifications.

---

## 📑 Page Indexing (Routing)
- `/` : **Landing Page** (Service search)
- `/booking` : **Search Results & Tracking**
- `/partner/signup` : **Partner Registration**
- `/partner` : **Partner Dashboard**
- `/admin` : **Admin Command Center**

---

## 🚀 Getting Started
1. `npm install`
2. Configure `.env` with backend URL.
3. `npm run dev`
