# Quick Start Guide for New LLM Sessions

**Last Updated:** 2025-11-10
**Purpose:** Get up to speed quickly in new conversation sessions

---

## 🚨 FIRST: Navigate to Working Directory

**This project is located at:**

```
D:\01 - Projects\SALT-Tax-Tool-Clean
```

**Before reading any files, navigate to this directory first.**

If you start in the wrong directory (like `C:\Users\markw\SALT-Tax-Tool`), you won't find the project files and will get confused. Always confirm you're in the correct directory before proceeding.

---

## ⚡ 30-Second Overview

You're helping build **Nexus Check**, a tool that automates nexus determination for boutique tax agencies.

**Current Status:** Sprint 1 COMPLETE ✅ → Screens 1-4 functional with working calculation engine

**Tech Stack:** Next.js 14 + FastAPI + Supabase

---

## 📚 Essential Reading Order (5 minutes)

Read these files in order for complete context:

1. **THIS FILE** (you're here) - 2 min
2. `DEVELOPMENT_NOTES.md` - **Latest decisions & implementation details** - 3 min
3. `INTEGRATION_AND_DEPENDENCIES.md` - Critical for development - 3 min

**If working on specific tasks, also read:**
- Planning work? → `PROJECT-SUMMARY.md`
- UI/UX work? → `PHASE_2B_SCREEN_SPECIFICATIONS.md`
- Backend work? → `PHASE_3_TECHNICAL_ARCHITECTURE.md`
- Database work? → `data-model-specification.md` + `state-rules-schema.md`
- Want to see what changed? → `CHANGELOG.md`

---

## 🎯 What We're Building

**Problem:** SALT professionals spend 12-20 hours manually analyzing nexus obligations per client.

**Solution:** Automated tool that reduces analysis time to <1 hour with 90-95% accuracy.

**MVP Features:**
1. Upload CSV of transactions
2. Determine economic nexus across all 50 states
3. Calculate estimated tax liability
4. Generate professional PDF report for clients

**Target User:** SALT tax professional at boutique agency, ex-Big 4, expert in tax law.

---

## 📊 Current Project Status

### ✅ Completed Phases:

**Phase 1: Data Model & State Rules Database**
- 12 tables designed (user data + state rules)
- All schemas documented

**Phase 2A: Database Implementation**
- Deployed to Supabase
- 239 rows of state rules data loaded
- All RLS policies active

**Phase 2B: User Flow Design**
- 7 core screens fully specified
- Complete wireframes and user interactions
- Error states documented

**Phase 3: Technical Architecture**
- 30+ API endpoints specified
- Frontend architecture (Next.js 14 + React + Tailwind)
- Backend architecture (FastAPI + Python)
- Authentication strategy (Supabase Auth + JWT)
- Deployment plan (Vercel + Railway + Supabase)

**Phase 4, Sprint 1 - Week 1: ✅ COMPLETED**
- ✅ Set up Next.js + FastAPI projects
- ✅ Implemented Supabase Auth (login, signup, protected routes)
- ✅ Built Screen 1: Client Setup
- ✅ Backend API endpoint: POST /api/v1/analyses
- ✅ Database integration working
- ✅ Both dev servers running

**Phase 4, Sprint 1 - Week 2: ✅ COMPLETED**
- ✅ Built Screen 2: CSV Upload with drag-and-drop
- ✅ Backend endpoint: POST /api/v1/analyses/{id}/upload
- ✅ CSV processing with pandas
- ✅ 30 test transactions uploaded successfully
- ✅ Built Screen 3: Data Mapping & Validation
- ✅ Backend endpoints: GET /api/v1/analyses/{id}/columns, POST /api/v1/analyses/{id}/validate
- ✅ Auto-detection of column mappings
- ✅ Comprehensive data validation
- ✅ End-to-end flow tested (Screens 1→2→3)
- ✅ Built Screen 4: Results Dashboard (UI structure)
- ✅ Backend endpoint: GET /api/v1/analyses/{id}
- ✅ Complete dashboard UI with summary cards
- ✅ US Map placeholder with legend
- ✅ Nexus breakdown section
- ✅ Action buttons and navigation

**Phase 4, Sprint 1 - Week 3: ✅ COMPLETED**
- ✅ Built Nexus Calculation Engine
- ✅ Backend service: NexusCalculator class
- ✅ Backend endpoints: POST /api/v1/analyses/{id}/calculate, GET /api/v1/analyses/{id}/results/summary
- ✅ Aggregates transactions by state using pandas
- ✅ Compares vs state-specific economic nexus thresholds ($100k/$250k/$500k)
- ✅ Calculates estimated tax liability per state
- ✅ Saves results to state_results table
- ✅ Integrated Screen 4 with real calculated data
- ✅ Streamlined workflow: Calculate button on mapping page triggers automatic calculation
- ✅ Top states ranking, nexus breakdown, summary statistics
- ✅ End-to-end tested with accurate sample data

### ✅ Sprint 1 Complete!

**Working Features:**
1. User authentication (login/signup)
2. Client setup form (Screen 1)
3. CSV file upload with preview (Screen 2)
4. Column mapping & validation (Screen 3)
5. **Nexus calculation engine** (backend)
6. Results dashboard with real data (Screen 4)
7. Complete flow: Upload → Map → **Calculate → View Results**

### 🔜 Next: Sprint 2

**Upcoming Features:**
- Screen 5: State Table (sortable/filterable list of all states)
- Screen 6: State Detail View (complete breakdown per state)
- US Map visualization with react-simple-maps
- PDF Report generation

---

## 🗂️ Project Structure

```
SALT-Tax-Tool-Clean/
├── 00-START-HERE.md                    ← Read second
├── QUICK_START_FOR_NEW_SESSIONS.md    ← You are here
├── INTEGRATION_AND_DEPENDENCIES.md     ← Read third (CRITICAL)
├── PROJECT-SUMMARY.md
├── PHASE_2B_SCREEN_SPECIFICATIONS.md   ← Complete UX design
├── PHASE_3_TECHNICAL_ARCHITECTURE.md   ← Complete API specs
├── LLM-INSTRUCTIONS.md
│
├── data-model-specification.md         ← Tables 1-7 (user data)
├── state-rules-schema.md               ← Tables 8-12 (state rules)
│
├── _01-project-overview/
├── _02-requirements/
├── _03-planning/
├── _07-decisions/
│   └── decision-log.md                 ← Key architectural decisions
│
└── migrations/                         ← Supabase migrations (deployed ✅)
    ├── 001-008 SQL files
    └── DEPLOYMENT_GUIDE.md
```

---

## 🔑 Key Context Points

### Tech Stack (Locked In):

**Frontend:**
- Next.js 14.2.0 (App Router)
- React 18.3.0
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Supabase Auth

**Backend:**
- FastAPI 0.110.0
- Python 3.11+
- Pandas (CSV processing)
- WeasyPrint (PDF generation)

**Database:**
- Supabase (PostgreSQL 15)
- 12 tables with RLS policies
- 239 rows of state rules data

**Deployment:**
- Vercel (frontend)
- Railway (backend)
- Supabase (database + storage)

### Critical Constraints:

1. **Database schema is LOCKED** - Don't modify without updating specs first
2. **90-95% accuracy target** - Not 100%, human review required
3. **Professional users** - Conservative, serious design
4. **10-15 minute workflow** - Upload to report
5. **User-controlled data retention** - Privacy-focused (delete immediately, 90 days, 1 year)

### Key Design Decisions:

1. **Physical nexus included in MVP** - Essential for accuracy
2. **Marketplace facilitator handling** - Critical for e-commerce clients
3. **Average local tax rates** - Not exact (acceptable for estimates)
4. **Excel/CSV input only** - No API integrations for MVP
5. **Human-in-the-loop** - Tool assists, doesn't replace professional judgment

---

## 🚀 If Starting Development Now

### Step 1: Verify Supabase Access (2 min)

```bash
# Get credentials from user
# Supabase Dashboard → Settings → API

SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=...
```

### Step 2: Test Database Connection (1 min)

```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
states = supabase.table('states').select('*').execute()
print(f"Connected! Found {len(states.data)} states")
# Should print: Connected! Found 52 states
```

### Step 3: Read Critical Files (5 min)

1. `INTEGRATION_AND_DEPENDENCIES.md` - **MUST READ before coding**
   - Complete dependency versions
   - Integration points (frontend ↔ backend ↔ database)
   - Common issues and solutions

2. `PHASE_3_TECHNICAL_ARCHITECTURE.md`
   - API endpoint specifications
   - Request/response examples
   - Authentication flow

3. `PHASE_2B_SCREEN_SPECIFICATIONS.md`
   - User flow (7 screens)
   - Wireframes
   - What each screen should do

### Step 4: Set Up Development Environment

Follow instructions in `INTEGRATION_AND_DEPENDENCIES.md` → Section 4 (Setup Validation Checklist)

---

## 📋 Quick Reference

### API Endpoints (Summary)

**✅ Implemented:**
- `POST /api/v1/analyses` - Create analysis
- `GET /api/v1/analyses/{id}` - Get analysis details
- `POST /api/v1/analyses/{id}/upload` - Upload CSV
- `GET /api/v1/analyses/{id}/columns` - Get column info & summary
- `POST /api/v1/analyses/{id}/validate` - Validate data
- `POST /api/v1/analyses/{id}/calculate` - **Run nexus calculations** ✨
- `GET /api/v1/analyses/{id}/results/summary` - **Get results summary** ✨

**🔜 Coming Soon:**
- `GET /api/v1/analyses/{id}/results/states` - Get all states table data
- `GET /api/v1/analyses/{id}/results/states/{state_code}` - Get single state detail
- `GET /api/v1/analyses/{id}/results/map` - Get map data
- `POST /api/v1/analyses/{id}/reports/generate` - Generate PDF

See `PHASE_3_TECHNICAL_ARCHITECTURE.md` for complete specs with request/response examples.

### Database Tables (Summary)

**User Data (7 tables):**
1. `analyses` - Analysis projects
2. `data_upload_log` - CSV uploads
3. `physical_nexus` - Physical presence data
4. `nexus_determination` - Nexus results per state
5. `tax_liability_estimate` - Liability calculations
6. `marketplace_sales` - Marketplace aggregations
7. `error_logs` - Validation errors

**State Rules (5 tables):**
8. `states` - State metadata
9. `state_nexus_rules` - Economic nexus thresholds
10. `marketplace_facilitator_rules` - Marketplace rules
11. `state_tax_rates` - State + avg local rates
12. `state_interest_penalty_rates` - Interest/penalty rates

See `data-model-specification.md` and `state-rules-schema.md` for complete schemas.

### The 7-Screen User Flow

1. **Client Setup** ✅ - Company name, period, retention choice
2. **CSV Upload** ✅ - Drag-and-drop, preview
3. **Data Mapping** ✅ - Map CSV columns, **calculate nexus**
4. **Results Dashboard** ✅ - **Real calculated results**, summary cards, top states
5. **State Table** 🔜 - Sortable/filterable all states
6. **State Detail** 🔜 - Complete breakdown per state
7. **Export & Reports** 🔜 - Generate PDF, download

See `PHASE_2B_SCREEN_SPECIFICATIONS.md` for complete wireframes.

---

## ⚠️ Common Pitfalls (From Previous Attempts)

### 1. Integration Issues

**Problem:** Frontend can't talk to backend, CORS errors, JWT validation fails.

**Solution:** Read `INTEGRATION_AND_DEPENDENCIES.md` → Section 6 (Common Issues & Solutions)

### 2. Database RLS Blocking Queries

**Problem:** Queries return empty even though data exists.

**Solution:** Always include `user_id` from JWT in database operations. RLS policies enforce user data isolation.

```python
# ✅ Correct
result = supabase.table('analyses').insert({
    'user_id': user_id,  # From JWT
    'company_name': 'ACME Corp',
}).execute()

# ❌ Wrong - RLS will block
result = supabase.table('analyses').insert({
    'company_name': 'ACME Corp',
}).execute()
```

### 3. Environment Variables Not Loading

**Problem:** `undefined` values, different behavior in dev vs prod.

**Solution:**
- Frontend: Use `NEXT_PUBLIC_` prefix for client-side vars
- Backend: Load with `python-dotenv` before importing config
- Restart dev servers after changing .env files

### 4. Dependency Version Mismatches

**Problem:** "Module not found", incompatible versions, build fails.

**Solution:** Use **exact versions** from `INTEGRATION_AND_DEPENDENCIES.md`:
- Next.js 14.2.0
- React 18.3.0
- FastAPI 0.110.0
- Python >= 3.11
- Node >= 18.17.0

---

## 💡 Pro Tips

1. **Start with integration tests first** - Verify all pieces connect before building features
2. **Use exact dependency versions** - Avoid "latest" to prevent compatibility issues
3. **Test authentication early** - JWT flow is critical, test it works before building features
4. **Read error messages carefully** - They often point directly to config issues
5. **Check RLS policies** - If queries return empty, likely RLS blocking access

---

## 📞 Need More Info?

| Question | File to Read |
|----------|--------------|
| What are we building? | `PROJECT-SUMMARY.md` |
| Who is this for? | `_02-requirements/target-users.md` |
| What's the MVP scope? | `_02-requirements/mvp-scope.md` |
| How do screens work? | `PHASE_2B_SCREEN_SPECIFICATIONS.md` |
| What are the API endpoints? | `PHASE_3_TECHNICAL_ARCHITECTURE.md` |
| How does auth work? | `PHASE_3_TECHNICAL_ARCHITECTURE.md` → Section 3 |
| What's the database schema? | `data-model-specification.md` + `state-rules-schema.md` |
| How do I set up locally? | `INTEGRATION_AND_DEPENDENCIES.md` → Section 4 |
| What if things don't connect? | `INTEGRATION_AND_DEPENDENCIES.md` → Section 6 |
| What have we decided and why? | `_07-decisions/decision-log.md` |

---

## 🎯 Ready to Code?

**For Sprint 1 (Data Upload & Validation):**

1. Read `INTEGRATION_AND_DEPENDENCIES.md` (15 min)
2. Set up local environment (30 min)
3. Run integration tests to verify everything connects (10 min)
4. Start with Screen 1 (Client Setup) frontend + backend (2-3 hours)
5. Move to Screen 2 (CSV Upload) with file handling (3-4 hours)
6. Finish with Screen 3 (Data Mapping) and validation logic (4-5 hours)

**Estimated Sprint 1 Duration:** 2-3 weeks

---

## ✅ Validation Checklist

Before starting development, verify:

- [ ] Read this file
- [ ] Read `00-START-HERE.md`
- [ ] Read `INTEGRATION_AND_DEPENDENCIES.md`
- [ ] Have Supabase credentials
- [ ] Tested database connection (52 states found)
- [ ] Understand the 7-screen flow
- [ ] Know where API endpoints are documented
- [ ] Aware of common pitfalls from previous attempts

---

**You're ready! Start with `INTEGRATION_AND_DEPENDENCIES.md` and follow the setup guide.**

Good luck! 🚀
