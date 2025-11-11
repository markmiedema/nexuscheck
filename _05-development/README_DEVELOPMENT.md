# Nexus Check - Development Repository

**Status:** Phase 4, Sprint 1 - COMPLETE ✅ | Sprint 2 - Ready to Start
**Tech Stack:** Next.js 14 + FastAPI + Supabase PostgreSQL

---

## 🚀 Quick Start

**New to this project?** Read these files in order:
1. [`QUICK_START_FOR_NEW_SESSIONS.md`](QUICK_START_FOR_NEW_SESSIONS.md) - 5-minute orientation
2. [`SPRINT_1_SETUP_GUIDE.md`](SPRINT_1_SETUP_GUIDE.md) - Get backend and frontend running
3. [`INTEGRATION_AND_DEPENDENCIES.md`](INTEGRATION_AND_DEPENDENCIES.md) - Critical integration patterns

**Ready to develop Sprint 1 features?** See [Sprint 1 Setup Guide](SPRINT_1_SETUP_GUIDE.md)

---

## 📦 What's in This Repository

### Planning & Documentation (Phases 1-3 Complete)
- ✅ **Phase 1:** Database schema designed (12 tables)
- ✅ **Phase 2A:** Database deployed to Supabase (239 rows of state rules)
- ✅ **Phase 2B:** Complete UX design for 7 screens
- ✅ **Phase 3:** Technical architecture with 30+ API endpoints

### Code (Phase 4 - Sprint 1 Complete)
- ✅ **Backend:** FastAPI with auth, Supabase client, 7 API endpoints, NexusCalculator service
- ✅ **Frontend:** Next.js 14 with auth, API client, Screens 1-4 functional
- ✅ **Sprint 1:** Screens 1-4 + Nexus Calculation Engine working end-to-end
- ⏳ **Sprint 2:** State Table, State Detail, US Map, PDF Reports

---

## 🏗️ Project Structure

```
SALT-Tax-Tool-Clean/
│
├── 📁 backend/                     # FastAPI backend (Python 3.11+)
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Settings from environment
│   │   ├── core/
│   │   │   ├── auth.py             # JWT authentication
│   │   │   └── supabase.py         # Database client
│   │   ├── api/v1/
│   │   │   └── analyses.py         # API endpoints
│   │   └── schemas/
│   │       └── analysis.py         # Pydantic validation
│   ├── requirements.txt            # Python dependencies
│   └── .env.example               # Environment template
│
├── 📁 frontend/                    # Next.js 14 frontend (React 18)
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   └── globals.css            # Tailwind styles
│   ├── lib/
│   │   ├── supabase/client.ts     # Auth client
│   │   ├── api/client.ts          # API client with interceptors
│   │   └── stores/authStore.ts    # Auth state (Zustand)
│   ├── package.json               # Node dependencies
│   └── .env.example              # Environment template
│
├── 📁 migrations/                  # Database migrations (deployed)
│   ├── 001_initial_schema.sql
│   ├── 002_row_level_security.sql
│   ├── 005_populate_state_data.sql
│   └── ... (8 migrations total)
│
├── 📄 SPRINT_1_SETUP_GUIDE.md     # ⭐ Start here for development
├── 📄 QUICK_START_FOR_NEW_SESSIONS.md
├── 📄 INTEGRATION_AND_DEPENDENCIES.md
├── 📄 PHASE_2B_SCREEN_SPECIFICATIONS.md
└── 📄 PHASE_3_TECHNICAL_ARCHITECTURE.md
```

---

## ✅ Sprint 1 Complete - Data Upload & Calculation Engine

**Duration:** 3 weeks (completed 2025-11-04)
**Goal:** Build authentication + Screens 1-4 + nexus calculation engine

### Completed Features
1. **Authentication** ✅
   - Login/signup pages with Supabase Auth
   - Protected routes
   - JWT token management with auto-refresh

2. **Screen 1: Client Setup** ✅
   - Company name, analysis period
   - Business type selection
   - Known state registrations
   - Data retention preferences

3. **Screen 2: CSV Upload** ✅
   - Drag-and-drop file upload
   - File validation (CSV/XLS/XLSX, 50MB max)
   - Column detection
   - Data preview (first 10 rows)

4. **Screen 3: Data Mapping** ✅
   - Map CSV columns to required fields
   - Auto-detection of column mappings
   - Validate data quality
   - Error reporting with row numbers
   - **"Calculate Nexus" button** → triggers validation + calculation

5. **Screen 4: Results Dashboard** ✅
   - Summary cards (states with nexus, estimated liability, confidence)
   - Top states by tax liability ranking
   - Nexus breakdown (physical, economic, no nexus)
   - Approaching threshold indicators
   - Recalculate button

6. **Nexus Calculation Engine** ✅
   - Backend service: `NexusCalculator` class
   - Aggregates transactions by state
   - Compares vs state-specific thresholds ($100k/$250k/$500k)
   - Calculates estimated tax liability
   - Saves results to `state_results` table
   - API endpoints: POST /calculate, GET /results/summary

### What Works End-to-End
✅ Login → Create Analysis → Upload CSV → Map Columns → **Calculate Nexus** → View Results

---

## 🎯 Sprint 2 - State Details & Reporting (In Progress)

**Started:** 2025-01-04
**Estimated Duration:** 2-3 weeks

### Completed Features
- ✅ **Screen 5: State Table** (completed 2025-01-04)
  - All 50+ states displayed with comprehensive data
  - Client-side sorting, filtering, and search
  - URL state management for shareable views
  - Skeleton loading and polished error handling
  - Clickable rows navigate to state detail
  - Backend endpoint: GET /results/states
  - Commits: 15 commits implementing Tasks 1-16

### In Progress
- ⏳ **Screen 6: State Detail View** (next up)

### Upcoming Features
- **US Map Visualization** - Interactive map on results dashboard
- **PDF Report Generation** - Client-ready reports with WeasyPrint

---

## 🔧 Tech Stack Details

### Backend
- **FastAPI 0.110.0** - Modern Python web framework
- **Supabase 2.3.4** - Database client with RLS
- **Pandas 2.2.0** - CSV processing
- **PyJWT 2.8.0** - JWT validation
- **WeasyPrint 61.2** - PDF generation (Sprint 5)

### Frontend
- **Next.js 14.2.0** - React framework with App Router
- **React 18.3.0** - UI library
- **TypeScript 5.3.3** - Type safety
- **Tailwind CSS 3.4.1** - Styling
- **Zustand 4.5.0** - State management
- **Axios 1.6.7** - HTTP client

### Database
- **Supabase PostgreSQL** - Hosted database
- **12 tables** with Row Level Security
- **239 rows** of state rules data (pre-loaded)

---

## 🚦 Getting Started (10 Minutes)

### 1. Install Dependencies
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend (in new terminal)
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Backend - copy and edit .env
cd backend
copy .env.example .env
# Add your Supabase credentials

# Frontend - copy and edit .env.local
cd frontend
copy .env.example .env.local
# Add your Supabase credentials
```

### 3. Start Development Servers
```bash
# Backend (Terminal 1)
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### 4. Verify
- Backend: http://localhost:8000/health → `{"status":"healthy"}`
- Frontend: http://localhost:3000 → Nexus Check home page
- API Docs: http://localhost:8000/docs → FastAPI Swagger UI

---

## 📚 Key Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `SPRINT_1_SETUP_GUIDE.md` | Get running locally | First time setup |
| `QUICK_START_FOR_NEW_SESSIONS.md` | Orient new LLM sessions | Every new session |
| `INTEGRATION_AND_DEPENDENCIES.md` | How components integrate | Before coding |
| `PHASE_2B_SCREEN_SPECIFICATIONS.md` | UI/UX designs | Building screens |
| `PHASE_3_TECHNICAL_ARCHITECTURE.md` | API specs | Building endpoints |
| `data-model-specification.md` | Database schema (user tables) | Working with data |
| `state-rules-schema.md` | State rules tables | Nexus calculations |

---

## 🔐 Supabase Credentials

Your Supabase project is already set up at:
- **URL:** https://aljqqzdpndvuojkwfkfz.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/aljqqzdpndvuojkwfkfz

Credentials are in your original prompt. Add them to:
- `backend/.env` (use service role key)
- `frontend/.env.local` (use anon key)

---

## ✅ Development Checklist

### Setup (Done!)
- [x] Backend project structure
- [x] Frontend project structure
- [x] Database migrations deployed
- [x] State rules data loaded (239 rows)
- [x] Authentication infrastructure
- [x] API client with JWT interceptors

### Sprint 1 (In Progress)
- [x] Install dependencies (npm install, pip install)
- [x] Configure environment variables
- [x] Start development servers
- [x] Build login/signup pages
- [x] Build Screen 1: Client Setup
- [x] Build Screen 2: CSV Upload
- [x] Build Screen 3: Data Mapping
- [x] Build Screen 4: Results Dashboard (UI)
- [x] Test end-to-end flow (Screens 1-4)
- [ ] Build nexus calculation engine
- [ ] Integration tests

**Completed Features:**
- ✅ Authentication system (login, signup, protected routes)
- ✅ Screen 1: Client Setup form with validation
- ✅ Screen 2: CSV Upload with drag-and-drop and preview
- ✅ Screen 3: Data Mapping with auto-detection and validation
- ✅ Screen 4: Results Dashboard with summary cards and placeholder visualizations
- ✅ Backend API endpoints:
  - POST `/api/v1/analyses` (create analysis)
  - GET `/api/v1/analyses/{id}` (get analysis details)
  - POST `/api/v1/analyses/{id}/upload` (upload CSV)
  - GET `/api/v1/analyses/{id}/columns` (get column info)
  - POST `/api/v1/analyses/{id}/validate` (validate data)
- ✅ Database integration with auto-user creation
- ✅ CSV/Excel file parsing with pandas
- ✅ Transaction data storage and validation
- ✅ Analysis creation and persistence
- ✅ Complete UI workflow (Screens 1→2→3→4)

**Next Up:**
- Nexus calculation engine (core business logic)
- Screen 5-7: Detailed results views and reporting
- Integration testing

---

## 🛠️ Common Commands

### Backend
```bash
# Start server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Format code
black app/

# Lint code
ruff check app/

# Test database connection
python test_supabase_connection.py
```

### Frontend
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint
npm run lint

# Type check
npm run type-check
```

---

## 📝 Development Workflow

1. **Pick a feature** from Sprint 1 checklist
2. **Read relevant docs** (screen specs, API specs)
3. **Backend first:** Implement API endpoint + tests
4. **Frontend next:** Build UI component + integration
5. **Test together:** Verify end-to-end flow
6. **Commit:** Use conventional commits (`feat:`, `fix:`, etc.)
7. **Repeat!**

---

## 🐛 Troubleshooting

**Backend won't start?**
- Check Python version: `python --version` (need 3.11+)
- Activate venv: `venv\Scripts\activate`
- Install deps: `pip install -r requirements.txt`

**Frontend won't start?**
- Check Node version: `node --version` (need 18+)
- Install deps: `npm install`
- Check .env.local exists

**Database connection fails?**
- Verify credentials in .env files
- Test: `python test_supabase_connection.py`
- Check Supabase dashboard is accessible

**CORS errors?**
- Backend must allow `http://localhost:3000`
- Frontend must point to `http://localhost:8000`
- Check both servers are running

---

## 📞 Need Help?

1. **Read the docs first:**
   - `SPRINT_1_SETUP_GUIDE.md` for setup issues
   - `INTEGRATION_AND_DEPENDENCIES.md` for integration issues
   - `PHASE_3_TECHNICAL_ARCHITECTURE.md` for API questions

2. **Check logs:**
   - Backend: Terminal output
   - Frontend: Browser console (F12)
   - Database: Supabase dashboard logs

3. **Verify environment:**
   - Python 3.11+
   - Node 18+
   - Correct credentials in .env files

---

**Ready to build? Start with the [Sprint 1 Setup Guide](SPRINT_1_SETUP_GUIDE.md)!** 🚀

---

**Last Updated:** 2025-11-04
**Project Status:** Phase 4, Sprint 1 - Screens 1-4 Complete (UI), Building Calculation Engine
