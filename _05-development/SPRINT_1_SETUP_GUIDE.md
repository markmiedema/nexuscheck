# Sprint 1 Setup Guide

**Created:** 2025-11-03
**Status:** Ready for Development

---

## What's Been Set Up

### Backend Structure (FastAPI)
- ✅ Complete project structure in `backend/`
- ✅ Core configuration (`config.py`)
- ✅ Supabase client integration
- ✅ JWT authentication module
- ✅ API endpoints structure (placeholder for analyses)
- ✅ Pydantic schemas for validation
- ✅ Requirements.txt with all dependencies

### Frontend Structure (Next.js 14)
- ✅ Complete project structure in `frontend/`
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS setup
- ✅ Supabase auth client
- ✅ API client with JWT interceptors
- ✅ Zustand auth store
- ✅ Package.json with all dependencies

---

## Quick Start: Get Running in 10 Minutes

### Step 1: Backend Setup (5 minutes)

```bash
# Navigate to backend directory
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env

# Edit .env file with your Supabase credentials
# Use the credentials from your prompt:
# SUPABASE_URL=https://aljqqzdpndvuojkwfkfz.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_JWT_SECRET=SmBY+uFn3sveWzLNaaOofnTif+nCdKMbkcYkN75f6Cxj4u1JwYsI6We+e4R9KA59oOb92A4XNfEwag6lUMSq2Q==

# Test the backend
python -c "from app.core.supabase import supabase; states = supabase.table('states').select('*').execute(); print(f'✅ Connected! Found {len(states.data)} states')"

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Test: Open http://localhost:8000/health - should return `{"status":"healthy"}`

---

### Step 2: Frontend Setup (5 minutes)

```bash
# Open a new terminal
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend"

# Install dependencies
npm install

# Create .env.local file from example
copy .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=https://aljqqzdpndvuojkwfkfz.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the frontend dev server
npm run dev
```

**Expected output:**
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

Test: Open http://localhost:3000 - should see Nexus Check home page

---

## Verify Everything Works

### Test 1: Backend Health Check
```bash
curl http://localhost:8000/health
```
**Expected:** `{"status":"healthy","environment":"development","version":"1.0.0"}`

### Test 2: Database Connection
```bash
cd backend
python test_supabase_connection.py
```
**Expected:**
```
✅ Connected to Supabase! Found 52 states
✅ Total state rules data: 239 rows
```

### Test 3: Frontend Loads
Open browser to http://localhost:3000

**Expected:** Home page with "Nexus Check" title and Login/Sign Up buttons

### Test 4: API Endpoint (without auth)
```bash
curl http://localhost:8000/api/v1/analyses
```
**Expected:** `{"detail":"Not authenticated"}` (This is correct - endpoint requires auth)

---

## What to Build Next (Sprint 1 Features)

Now that the infrastructure is set up, here's what you'll build:

### Week 1: Authentication & Screen 1 ✅ COMPLETED
- [x] Implement login/signup pages (frontend)
- [x] Test authentication flow end-to-end
- [x] Build Screen 1: Client Setup Form
  - Company name, period, business type
  - Retention period selection
  - Known registrations (optional)
- [x] Implement POST /api/v1/analyses endpoint (backend)

### Week 2: CSV Upload & Validation ✅ COMPLETED
- [x] Build Screen 2: CSV Upload
  - Drag-and-drop file upload
  - File preview
  - Column detection
- [x] Implement POST /api/v1/analyses/{id}/upload endpoint
- [x] Implement CSV processing service with pandas
- [x] Build Screen 3: Data Mapping
  - Column mapping interface
  - Auto-detection of mappings
  - Data validation with detailed errors
  - Error reporting
- [x] Implement GET /api/v1/analyses/{id}/columns endpoint
- [x] Implement POST /api/v1/analyses/{id}/validate endpoint

### Week 3: Results Dashboard & Calculation Engine
- [x] Build Screen 4: Results Dashboard (UI structure)
- [x] Implement GET /api/v1/analyses/{id} endpoint
- [ ] Build nexus calculation engine (core business logic)
- [ ] Implement GET /api/v1/analyses/{id}/results/summary endpoint
- [ ] Implement GET /api/v1/analyses/{id}/results/map endpoint
- [ ] Integration tests
- [ ] Documentation

---

## Project Structure Reference

```
SALT-Tax-Tool-Clean/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app
│   │   ├── config.py                  # Settings
│   │   ├── core/
│   │   │   ├── auth.py                # JWT authentication
│   │   │   └── supabase.py            # Supabase client
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── analyses.py        # Analysis endpoints
│   │   └── schemas/
│   │       └── analysis.py            # Pydantic models
│   ├── requirements.txt
│   └── .env                           # Your credentials
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home page
│   │   └── globals.css                # Global styles
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts              # Supabase auth
│   │   ├── api/
│   │   │   └── client.ts              # API client
│   │   └── stores/
│   │       └── authStore.ts           # Auth state
│   ├── package.json
│   └── .env.local                     # Your credentials
│
└── migrations/                        # Database migrations (already deployed)
```

---

## Troubleshooting

### Backend won't start
**Error:** `ModuleNotFoundError: No module named 'fastapi'`
**Fix:** Make sure you activated the virtual environment and ran `pip install -r requirements.txt`

### Frontend won't start
**Error:** `Cannot find module 'next'`
**Fix:** Run `npm install` in the frontend directory

### Database connection fails
**Error:** `401 Unauthorized`
**Fix:** Check your .env file has the correct Supabase credentials

### CORS errors in browser
**Fix:** Make sure:
1. Backend is running on port 8000
2. Frontend .env.local has `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Backend ALLOWED_ORIGINS includes `http://localhost:3000`

---

## Environment Variables Reference

### Backend (.env)
```bash
SUPABASE_URL=https://aljqqzdpndvuojkwfkfz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
SUPABASE_JWT_SECRET=[your-jwt-secret]
ENVIRONMENT=development
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000
MAX_FILE_SIZE_MB=50
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://aljqqzdpndvuojkwfkfz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

---

## Next Steps

1. **Verify setup works** - Run through all verification steps above
2. **Create a test user** - Sign up through Supabase dashboard or implement signup page
3. **Start building Screen 1** - Client Setup Form is the first feature to implement
4. **Refer to documentation:**
   - `PHASE_2B_SCREEN_SPECIFICATIONS.md` - UI/UX designs
   - `PHASE_3_TECHNICAL_ARCHITECTURE.md` - API specs
   - `INTEGRATION_AND_DEPENDENCIES.md` - Integration patterns

---

## Need Help?

- **Can't connect to database?** Check credentials in .env files
- **Port already in use?** Change ports in commands (e.g., `--port 8001`)
- **Dependencies not installing?** Make sure you have Python 3.11+ and Node 18+
- **Authentication not working?** Check JWT secret matches between backend and Supabase

---

**You're ready to start Sprint 1 development!** 🚀

The infrastructure is set up, dependencies are configured, and you have working skeleton apps for both frontend and backend. Now it's time to build the features!
