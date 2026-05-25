# FinanceTracker — AI-Powered Personal Finance Platform

A production-ready, full-stack MERN application with **12 integrated modules**, **15+ AI engines**, **128+ currencies**, **25 languages**, and **30+ themes**. Track expenses, manage salaries, plan budgets, set goals, split bills, and get AI-powered financial insights — all in one platform.

## Features

### 12 Core Modules
- **Dashboard** — Real-time overview with charts, AI chat, health score, spending heatmap
- **Salary & Income** — Track multiple income sources with type-based filtering
- **Budget Planner** — Category-wise monthly budgets with progress bars and alerts
- **Expense Tracker** — Add, edit, delete, categorize, filter, and search expenses
- **Money Lent** — Track money you've lent to others with status tracking
- **Money Borrowed** — Track money you've borrowed with repayment tracking
- **Split Bills** — Split expenses among friends equally or by custom amounts
- **Financial Goals** — Set savings targets with progress tracking and deadlines
- **Recurring Expenses** — Auto-track subscriptions and recurring payments
- **Analytics** — Deep visual analytics with charts and spending breakdowns
- **Smart Rules** — Automated rules engine for expense categorization
- **Smart Notifications** — Event-driven alerts for budget limits, anomalies, goals

### AI-Powered Intelligence (15+ Engines)
- Financial health scoring
- Spending predictions and forecasting
- Budget alerts and anomaly detection
- Auto-categorization of expenses
- AI finance chat assistant
- Safe spending calculator
- Spending velocity tracking
- Habit scoring
- Subscription intelligence

### Multi-Currency (128+)
- Live exchange rates
- Automatic currency conversion
- Country-based currency selection

### Multi-Language (25)
- English, Hindi, Kannada, Telugu, Tamil, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Urdu, Spanish, French, German, Portuguese, Japanese, Korean, Chinese, Arabic, Russian, Italian, Dutch, Swedish, Thai, Vietnamese

### Themes (30+)
- Light, Dark, and Custom themes
- 30+ preset themes (Ocean Blue, Dracula, Nord, Catppuccin, Tokyo Night, etc.)
- Full color customization with 7 color pickers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, Chart.js, React Router, Axios, React Icons, React Toastify |
| **Backend** | Node.js, Express.js, Mongoose, JWT, bcryptjs, Helmet, express-rate-limit |
| **Database** | MongoDB |
| **Auth** | JWT + bcrypt, protected routes, forgot password with OTP email |

## Project Structure

```
salary/
├── backend/
│   ├── middleware/       # JWT auth middleware
│   ├── models/           # 12 Mongoose schemas
│   ├── routes/           # 14 API route files
│   ├── utils/            # Notification engine, email service
│   ├── uploads/          # User file uploads
│   ├── server.js         # Express entry point
│   └── package.json
│
├── frontend/
│   ├── public/           # HTML, favicon, redirects
│   ├── src/
│   │   ├── components/   # Navbar, MobileBottomNav, NotificationBell
│   │   ├── context/      # Auth, Theme, Currency, Language contexts
│   │   ├── pages/        # 17 page components
│   │   ├── index.css     # Tailwind + custom theme CSS
│   │   └── App.js        # Routes and providers
│   ├── tailwind.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- npm

### Installation

```bash
# Clone and enter project
git clone <your-repo-url>
cd salary

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### Environment Variables

Create `backend/.env` (see `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/salary-expense-manager
JWT_SECRET=your_strong_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Run Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm start
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Send OTP |
| POST | `/api/auth/reset-password` | Reset password |

### Core CRUD (all protected)
| Resource | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/api/expenses` | List | Create | Update `:id` | Delete `:id` |
| `/api/salary` | List | Create | Update `:id` | Delete `:id` |
| `/api/budget` | List | Create | Update `:id` | Delete `:id` |
| `/api/goals` | List | Create | Update `:id` | Delete `:id` |
| `/api/money-lent` | List | Create | Update `:id` | Delete `:id` |
| `/api/money-borrowed` | List | Create | Update `:id` | Delete `:id` |
| `/api/split-bills` | List | Create | Update `:id` | Delete `:id` |
| `/api/recurring-expenses` | List | Create | Update `:id` | Delete `:id` |
| `/api/rules` | List | Create | Update `:id` | Delete `:id` |
| `/api/notifications` | List | Generate | Mark read | Delete `:id` |

### AI & Analytics
| Endpoint | Description |
|----------|-------------|
| `/api/smart/financial-health` | Health score |
| `/api/smart/predictions` | Spending predictions |
| `/api/smart/insights` | Financial insights |
| `/api/smart/budget-alerts` | Budget alerts |
| `/api/smart/ai-chat` | AI chat assistant |
| `/api/smart/safe-spending` | Safe spending limit |
| `/api/smart/spending-heatmap` | Spending heatmap |
| `/api/smart/deep-analytics` | Deep analytics |
| `/api/smart/anomalies` | Anomaly detection |
| `/api/smart/habit-score` | Habit scoring |
| `/api/dashboard/summary` | Dashboard summary |
| `/api/dashboard/monthly-trend` | Monthly trends |

### Utility
| Endpoint | Description |
|----------|-------------|
| `/api/exchange-rates/:base` | Live exchange rates |
| `/api/health` | Server health check |

## Responsive Design

- **Desktop** — Full sidebar navigation + top navbar
- **Tablet** — Sidebar + responsive grids
- **Mobile** — Hamburger menu + fixed bottom navigation bar (Salary, Budget, Expenses, Goals)

## Security

- JWT authentication with protected routes
- Password hashing (bcrypt)
- Helmet security headers
- Rate limiting (auth: 20/15min, general: 300/15min)
- CORS configuration (restricted in production)
- Environment variable isolation
- Graceful server shutdown

## Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
NODE_ENV=production npm start
```

The backend serves the frontend build in production mode.

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<strong-random-secret>
EMAIL_USER=<your-email>
EMAIL_PASS=<app-password>
CLIENT_URL=<your-domain>
```

### Supported Platforms
- **Render** — Set build command and env vars
- **Railway** — Auto-detects Node.js
- **Heroku** — Uses `heroku-postbuild` script
- **Netlify** (frontend only) — `_redirects` file included

## License

MIT License. Open source and free to use.

---

Built with React, Node.js, MongoDB, Tailwind CSS, and Chart.js.
