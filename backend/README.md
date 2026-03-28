# ⚙️ FixNow Backend - Core Engine

The backbone of FixNow, orchestrating AI-driven service matching, real-time socket communication, and the entire job lifecycle.

---

## 🛠️ Tech Stack & Service Integrations

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io (Low-latency bidirectional communication)
- **AI Link**: REST Interface to (Python FastAPI Hybrid Service)
- **Mail**: Nodemailer (Gmail SMTP for Automated Credentials)

---

## 📂 Project Structure (Latest Refactor)

```text
backend/
├── controllers/        # Request handlers & core business logic
│   ├── userController.js    # Customer Auth & Partner Search
│   ├── partnerController.js # Profile updates & Offline/Online status
│   └── jobController.js     # OTP verification & Payment lifecycle
├── routes/             # Clean, versioned endpoint definitions
│   ├── aiRoutes.js          # Direct bridge to Python AI Service
│   ├── partnerRoutes.js      # Onboarding & Auth
│   └── jobRoutes.js         # Core Service dispatching logic
├── models/             # Mongoose Schemas (User, PartnerProfile, Job)
├── validators/         # Input validation (Joi/Zod style)
├── sockets/            # Extracted Socket rooms & event logic
│   └── socketManager.js     # Room management for real-time tracking
├── utils/              # Helper functions (Mailer, Service Maps)
└── server.js           # Single entry point & Express/Socket init
```

---

## 🧠 Brain Logic: `ai/interpret`

The `/api/ai/interpret` route is the most critical endpoint. It performs three key steps:
1.  **AI Query**: Forwards raw text to `localhost:8000/detect-service`.
2.  **Nearness Filter**: Uses `$near` GeoJSON queries to find approved partners within a **7km radius**.
3.  **Skill Match**: Filters results by the specific skill returned from the Python service.
4.  **Estimated Price**: Extracts the dynamic pricing returned by the AI model.

---

## 📡 Live Socket Orchestration

FixNow keeps everyone in the loop with zero-refresh updates:
- **`request_bhaiya`**: Broadcasts a mission to all nearby matching partners.
- **`accept_job`**: Instantly updates the customer's UI with the Bhaiya's profile.
- **`update_location`**: Partners emit their GPS coords every 5 seconds; customers track them on a live map.
- **`job_status_update`**: Drives the frontend **Job Stepper** (Pending ➔ Accepted ➔ OTP ➔ In Progress ➔ Done).

---

## 🚀 Environment Configuration

Required `.env` fields for full operation:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@...
PORT=5000
EMAIL_PASS=your_google_app_password
JWT_SECRET=your_secret_key
PYTHON_AI_URL=http://localhost:8000/detect-service
```

---

## 🛠️ Setup Instructions

1.  Clone the repository.
2.  `cd backend`
3.  `npm install`
4.  `npm start` (Runs on `http://localhost:5000`)
