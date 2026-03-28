# 🚀 FixNow Frontend - Pro Dashboard & Marketplace

The UI/UX layer of FixNow, designed for speed and clarity. We've built two distinct experiences: a streamlined customer booking flow and a high-performance **"MissionControl"** dashboard for partners.

---

## 🛠️ Tech Stack & Styling

- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS + Framer Motion (for premium animations)
- **Icons**: Lucide React (Tactical look and feel)
- **State**: React Hooks (Global/Context state for Auth & Sockets)
- **API Handling**: Axios (with centralized interceptors & error mapping)

---

## 📂 Project Structure

```text
src/
├── components/          # Reusable UI components (Auth, Profile, UI Kit)
├── context/             # AppContext for User, Auth & Global State
├── pages/               # High-level route components
│   ├── customer/        # LandingPage & BookingPage (The search loop)
│   ├── partner/         # PartnerSignup & PartnerDashboard (MissionControl)
│   └── admin/           # AdminDashboard (Verification system)
├── services/            # Bridge to the outer world
│   ├── api.js           # Axios instance (Centralized API keys/tokens)
│   └── socket.js        # Singleton socket.io-client instance
└── utils/               # Map calculations & distance helpers
```

---

## 🏗️ The "MissionControl" HUD (Partner UI)

Partners don't just "see" jobs; they manage missions. The latest HUD features:
- **Interactive Job Feed**: Accept or decline missions with real-time feedback.
- **Dynamic Skill Filtering**: Partners only see jobs matching their specialized skills.
- **Live Dispatch Stepper**: Visual tracking of a job's progress (Accept ➔ Start Work ➔ Complete).
- **Tactical Dark Theme**: Optimized for outdoor visibility and reduced battery usage.

---

## 🌊 Latest Frontend Features

1.  **🔍 Searchable Skills Modal**: In the partner signup flow, choose from 20+ specialized service categories with a live search filter.
2.  **🛰️ Real-time Geolocation Integration**: Partners emit their live GPS coordinates to the server, which can be tracked by customers.
3.  **💬 Context-Aware Auth**: Automatic redirection based on user role (`Customer`, `Partner`, or `Admin`).
4.  **⚡ Instant Updates**: Using Socket.io listeners to update job states without page refreshes.

---

## 📡 API & Socket Usage

### ⚙️ API Centralization (`src/services/api.js`)
We use a global Axios instance that simplifies complex backend calls:
```javascript
import api from './services/api';
const response = await api.get('/users/profile'); // JWT added automatically
```

### ⚡ Socket Synchronization (`src/services/socket.js`)
A single socket connection is used throughout the app lifecycle, joining specialized rooms for role-based notifications.

---

## 🚀 Setup Instructions

1.  `cd frontend`
2.  `npm install`
3.  `npm run dev` (Runs on `http://localhost:5173`)
