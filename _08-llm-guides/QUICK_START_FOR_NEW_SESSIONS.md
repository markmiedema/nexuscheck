# Quick Start Guide for New LLM Sessions

**Last Updated:** 2025-11-11
**Last Verified:** 2025-11-11
**Purpose:** Get up to speed quickly in new conversation sessions

---

## 🚨 FIRST: Navigate to Working Directory

**This project is located at:**

```
D:\01 - Projects\SALT-Tax-Tool-Clean
```

**Before reading any files, navigate to this directory first.**

If you start in the wrong directory, you won't find the project files. Always confirm you're in the correct directory before proceeding.

---

## ⚡ 30-Second Overview

You're helping build **Nexus Check**, a tool that automates nexus determination for boutique tax agencies.

**Current Status:** Core app COMPLETE and DEPLOYED ✅ | Sprint 1 (Physical Nexus, VDA, Exempt Sales) in PLANNING

**Tech Stack:** Next.js 14 + FastAPI + Supabase

---

## 📚 Essential Reading Order (5 minutes)

Read these files in order for complete context:

1. **THIS FILE** (you're here) - 2 min
2. `_05-development/CURRENT_STATUS_2025-11-05.md` - **Current project status** - 3 min
3. `_08-llm-guides/PROJECT-SUMMARY.md` - Complete context - 5 min

**If working on specific tasks, also read:**
- Planning work? → `docs/plans/ROADMAP.md`
- Backend work? → `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md`
- Database work? → `_04-technical-specs/data-model-specification.md` + `state-rules-schema.md`
- Integration? → `_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md` (**CRITICAL**)
- Want to see what changed? → `_05-development/CHANGELOG.md`

---

## 🎯 What We're Building

**Problem:** SALT professionals spend 12-20 hours manually analyzing nexus obligations per client.

**Solution:** Automated tool that reduces analysis time to <1 hour with 90-95% accuracy.

**Current Features (Working):**
1. Upload CSV of transactions ✅
2. Determine economic nexus across all 50 states ✅
3. Calculate estimated tax liability ✅
4. Interactive results dashboard ✅
5. Analysis management (list, view, delete) ✅

**In Development (Sprint 1):**
1. Physical Nexus CRUD UI
2. VDA Mode (penalty savings comparison)
3. Exempt Sales handling
4. Enhanced column detection

**Target User:** SALT tax professional at boutique agency, ex-Big 4, expert in tax law.

---

## 📊 Current Project Status

### ✅ Core Application COMPLETE and DEPLOYED:

**What's Working:**
- Full user authentication (login/signup)
- 7-screen workflow end-to-end
- Economic nexus calculation (calendar year, 44 states)
- Multi-year analysis with sticky nexus tracking
- Data upload, validation, column mapping
- Results dashboard and state-by-state breakdown
- Analysis management

**Recent Additions (Nov 2025):**
- Smart column mapping with auto-detection
- Auto-detect date range from CSV
- Streamlined analysis flow (75% click reduction)

**Database:**
- 12 tables deployed to Supabase
- 239 rows of state rules data loaded
- Row Level Security (RLS) active

### 🔜 What's Next:

**Sprint 1 (Physical Nexus, VDA, Exempt Sales):**
- Status: Planning complete, ready to implement
- Timeline: 10-12 days estimated
- See: `docs/plans/sprint-1/` for detailed plans

**Future Sprints:**
- Sprint 2: Multiple calculation methods
- Sprint 3-5: Additional features per roadmap

**For detailed status:** Always check `_05-development/CURRENT_STATUS_2025-11-05.md`

---

## 🗂️ Project Structure

```
SALT-Tax-Tool-Clean/
├── 00-START-HERE.md                   <- Overview and orientation
├── _01-project-overview/               <- Vision and context
├── _02-requirements/                   <- Target users, MVP scope
├── _03-planning/                       <- Task breakdown, priorities
├── _04-technical-specs/                <- Data models, architecture (AS-BUILT)
│   ├── data-model-specification.md         <- LOCKED SCHEMA (Tables 1-7)
│   ├── state-rules-schema.md               <- LOCKED SCHEMA (Tables 8-12)
│   ├── PHASE_3_TECHNICAL_ARCHITECTURE.md   <- AS-BUILT architecture
│   └── INTEGRATION_AND_DEPENDENCIES.md     <- Critical integration patterns
├── _05-development/                    <- Project-wide dev docs
│   ├── CURRENT_STATUS_2025-11-05.md        <- PRIMARY STATUS DOCUMENT
│   ├── CHANGELOG.md                        <- Version history
│   ├── README_DEVELOPMENT.md               <- Developer onboarding
│   └── (assessments, audit reports)
├── _07-decisions/                      <- Architectural decisions
│   ├── decision-log.md                     <- All major decisions with rationale
│   └── SECURITY_NOTES.md                   <- Security audit findings
├── _08-llm-guides/                     <- You are here
│   ├── QUICK_START_FOR_NEW_SESSIONS.md    <- This file
│   ├── LLM-INSTRUCTIONS.md                 <- Quick reference
│   ├── LLM-ONBOARDING-WORKFLOW.md
│   └── PROJECT-SUMMARY.md
├── backend/                            <- FastAPI backend code
│   ├── app/                                <- Application code
│   ├── tests/                              <- Test suite
│   ├── migrations/                         <- Database migrations (deployed)
│   └── README.md                           <- Backend-specific setup
├── frontend/                           <- Next.js frontend code
│   ├── app/                                <- Next.js App Router
│   ├── lib/                                <- Shared utilities
│   └── README.md                           <- Frontend-specific setup
├── docs/plans/                         <- Sprint planning
│   ├── ROADMAP.md                          <- Sprint 1-5 breakdown
│   └── sprint-1/                           <- Sprint 1 detailed plans
├── _archives/                          <- Historical documents
│   ├── completion-reports/                 <- Milestone completion docs
│   ├── development-logs/                   <- Historical dev notes
│   ├── llm-guides-snapshots/               <- Previous versions of LLM guides
│   └── (other archived docs)
└── test-data/                          <- Test CSV files
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
- Supabase Python client

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
4. **10-15 minute workflow** - Upload to results
5. **User-controlled data retention** - Privacy-focused

### Key Design Decisions:

1. **Physical nexus included** - Essential for accuracy (being added in Sprint 1)
2. **Marketplace facilitator handling** - Critical for e-commerce clients
3. **Average local tax rates** - Not exact (acceptable for estimates)
4. **CSV input only** - No API integrations for MVP
5. **Human-in-the-loop** - Tool assists, doesn't replace professional judgment

---

## 📋 Quick Reference

### API Endpoints

**Currently Implemented:**
- `POST /api/v1/analyses` - Create analysis
- `GET /api/v1/analyses` - List analyses
- `GET /api/v1/analyses/{id}` - Get analysis details
- `DELETE /api/v1/analyses/{id}` - Delete analysis
- `POST /api/v1/analyses/{id}/upload` - Upload CSV
- `GET /api/v1/analyses/{id}/columns` - Get column info
- `POST /api/v1/analyses/{id}/validate` - Validate data
- `POST /api/v1/analyses/{id}/calculate` - Run nexus calculations
- `GET /api/v1/analyses/{id}/results/summary` - Get results summary
- `GET /api/v1/analyses/{id}/states/{state_code}` - Get state detail

See `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md` for complete specs with request/response examples.

### Database Tables

**User Data (7 tables):**
1. `analyses` - Analysis projects
2. `sales_transactions` - Transaction data
3. `physical_nexus` - Physical presence data
4. `state_results` - Nexus results per state
5. `client_profiles` - Client information
6. `analysis_settings` - Configuration
7. `error_logs` - Validation errors

**State Rules (5 tables):**
8. `states` - State metadata
9. `state_nexus_rules` - Economic nexus thresholds
10. `marketplace_facilitator_rules` - Marketplace rules
11. `state_tax_rates` - State + avg local rates
12. `state_interest_penalty_rates` - Interest/penalty rates

See `_04-technical-specs/data-model-specification.md` and `state-rules-schema.md` for complete schemas.

### The 7-Screen User Flow

1. **Login/Signup** ✅ - Authentication
2. **Analyses List** ✅ - View all analyses
3. **Client Setup** ✅ - Company name, period, retention choice
4. **CSV Upload** ✅ - Drag-and-drop, preview
5. **Data Mapping** ✅ - Map CSV columns, calculate nexus
6. **Results Dashboard** ✅ - Summary cards, top states, nexus breakdown
7. **State Details** ✅ - Complete breakdown per state

---

## ⚠️ Common Pitfalls (From Previous Development)

### 1. Integration Issues

**Problem:** Frontend can't talk to backend, CORS errors, JWT validation fails.

**Solution:** Read `_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md` before coding.

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

### 4. File Paths from Old Docs

**Problem:** Documentation references archived files.

**Solution:**
- Check `_archives/` if file not found
- Use current docs in main folders, not archives
- Check file "Last Verified" dates

---

## 💡 Pro Tips

1. **Check CURRENT_STATUS.md first** - Single source of truth for project status
2. **Use exact dependency versions** - Avoid "latest" to prevent compatibility issues
3. **Test authentication early** - JWT flow is critical
4. **Read error messages carefully** - They often point directly to config issues
5. **Check RLS policies** - If queries return empty, likely RLS blocking access
6. **Look in archives** - If a file isn't where expected, it may have been archived Nov 11

---

## 📞 Need More Info?

| Question | File to Read |
|----------|--------------|
| What's the current status? | `_05-development/CURRENT_STATUS_2025-11-05.md` |
| What are we building? | `_08-llm-guides/PROJECT-SUMMARY.md` |
| Who is this for? | `_02-requirements/target-users.md` |
| What's the MVP scope? | `_02-requirements/mvp-scope.md` |
| What are the API endpoints? | `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md` |
| How does auth work? | `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md` → Section 3 |
| What's the database schema? | `_04-technical-specs/data-model-specification.md` + `state-rules-schema.md` |
| How do I integrate components? | `_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md` |
| What have we decided and why? | `_07-decisions/decision-log.md` |
| What's the sprint roadmap? | `docs/plans/ROADMAP.md` |

---

## 🎯 Ready to Code?

**For Sprint 1 Implementation:**

1. Read `_05-development/CURRENT_STATUS_2025-11-05.md` (5 min)
2. Read `docs/plans/sprint-1/00-overview.md` (10 min)
3. Read `_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md` (15 min)
4. Choose a feature to implement (Physical Nexus, VDA, Exempt Sales)
5. Read that feature's detailed plan in `docs/plans/sprint-1/`
6. Create TodoWrite tasks for implementation
7. Start coding!

**Estimated Sprint 1 Duration:** 10-12 days

---

## ✅ Validation Checklist

Before starting development, verify:

- [ ] Read this file
- [ ] Read `_05-development/CURRENT_STATUS_2025-11-05.md`
- [ ] Understand current status (core app deployed, Sprint 1 in planning)
- [ ] Know where key files are located
- [ ] Aware database schema is LOCKED
- [ ] Understand the 7-screen flow
- [ ] Know where API endpoints are documented
- [ ] Aware of common pitfalls
- [ ] Know to check `_archives/` if files not found

---

## 🚀 Important Reminders

**Status Information:**
- **Single source of truth:** `_05-development/CURRENT_STATUS_2025-11-05.md`
- Don't trust status claims in other documents - they may be outdated
- Check "Last Verified" dates on all documents

**File Organization:**
- Many files were archived Nov 11, 2025
- If a file isn't where docs say, check `_archives/`
- Archive READMEs explain why files were archived

**Sprint Terminology:**
- Current "Sprint 1" = Physical Nexus, VDA, Exempt Sales (in planning)
- Different from historical "Sprint 1" which was core app build (complete)
- Always use descriptive names to avoid confusion

**Database:**
- Schema is LOCKED - all 12 tables deployed and operational
- Don't modify without updating specs first
- RLS policies are active - always include user_id

---

**You're ready! Start with `_05-development/CURRENT_STATUS_2025-11-05.md` for current status.**

Good luck! 🚀

---

**Last Updated:** 2025-11-11
**Last Verified:** 2025-11-11
**Previous Version:** Archived to `_archives/llm-guides-snapshots/2025-11-03-to-11-10-core-app-build/`
