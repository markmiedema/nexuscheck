# Instructions for LLMs Working on This Project

**Last Updated:** 2025-11-11
**Last Verified:** 2025-11-11

---

## Quick Start

**First action:** Read `00-START-HERE.md` in the project root.

**For complete context:** Read `PROJECT-SUMMARY.md` in this folder.

**For current project status:** See `_05-development/CURRENT_STATUS_2025-11-05.md`

**Current reality:** Core application COMPLETE and DEPLOYED ✅ | Sprint 1 (Physical Nexus, VDA, Exempt Sales) in PLANNING

---

## 🚨 CRITICAL: Database Schema is LOCKED

**The database schema is IMPLEMENTED, DEPLOYED, and FROZEN.**

### Rules for Working with the Database:

1. **DO NOT modify table structures** without updating specification files first
2. **DO NOT change column names, types, or constraints**
3. **DO NOT add/remove tables** without documenting in `_07-decisions/decision-log.md`
4. **USE EXACT SQL** from specification files

### Where the Schema Lives:

**📄 Specification Files (Source of Truth):**
- `_04-technical-specs/data-model-specification.md` - Tables 1-7 (user data)
- `_04-technical-specs/state-rules-schema.md` - Tables 8-12 (state rules)

**🗄️ Deployed Database:**
- Supabase PostgreSQL with 12 tables
- 239 rows of state rules data loaded
- Row Level Security (RLS) policies active
- All migrations deployed (001-008)

**⚠️ IF YOU NEED TO CHANGE THE SCHEMA:**
1. Update specification file first
2. Document reason in `_07-decisions/decision-log.md`
3. Create new migration script (009+)
4. Never modify existing migrations

---

## Project Overview in 3 Sentences

You're helping build **Nexus Check**, a SALT tax automation tool that reduces 12-20 hours of manual nexus analysis work to minutes. Target users are SALT professionals at boutique agencies who left Big 4 firms. The core application is deployed and operational; current work focuses on adding Physical Nexus, VDA mode, and Exempt Sales features.

---

## Directory Structure

```
SALT-Tax-Tool-Clean/
├── 00-START-HERE.md              <- Read first
├── _01-project-overview/          <- Vision and context
├── _02-requirements/              <- Target users, MVP scope
├── _03-planning/                  <- Task breakdown, priorities
├── _04-technical-specs/           <- Data models, architecture (AS-BUILT)
│   ├── data-model-specification.md     <- LOCKED SCHEMA (Tables 1-7)
│   ├── state-rules-schema.md           <- LOCKED SCHEMA (Tables 8-12)
│   ├── PHASE_3_TECHNICAL_ARCHITECTURE.md  <- AS-BUILT architecture
│   └── INTEGRATION_AND_DEPENDENCIES.md    <- Critical integration patterns
├── _05-development/               <- Project-wide dev docs
│   ├── CURRENT_STATUS_2025-11-05.md    <- PRIMARY STATUS DOCUMENT
│   ├── CHANGELOG.md                     <- Version history
│   ├── README_DEVELOPMENT.md            <- Developer onboarding
│   └── (assessments, audit reports)
├── _07-decisions/                 <- Architectural decisions
│   ├── decision-log.md                  <- All major decisions with rationale
│   └── SECURITY_NOTES.md                <- Security audit findings
├── _08-llm-guides/                <- You are here
│   ├── LLM-INSTRUCTIONS.md             <- This file
│   ├── QUICK_START_FOR_NEW_SESSIONS.md
│   ├── LLM-ONBOARDING-WORKFLOW.md
│   └── PROJECT-SUMMARY.md
├── backend/                       <- FastAPI backend code
│   ├── app/                            <- Application code
│   ├── tests/                          <- Test suite
│   ├── migrations/                     <- Database migrations (deployed)
│   └── README.md                       <- Backend-specific setup
├── frontend/                      <- Next.js frontend code
│   ├── app/                            <- Next.js App Router
│   ├── lib/                            <- Shared utilities
│   └── README.md                       <- Frontend-specific setup
├── docs/                          <- Sprint planning
│   └── plans/                          <- Roadmap, sprint docs
├── _archives/                     <- Historical documents
│   ├── completion-reports/             <- Milestone completion docs
│   ├── development-logs/               <- Historical dev notes
│   ├── llm-guides-snapshots/           <- Previous versions of LLM guides
│   └── (other archived docs)
└── test-data/                     <- Test CSV files
```

**Note:** Numbering skips _06 because: (1) state rules live in Supabase database, not files; (2) actual code lives in `/backend` and `/frontend` at root level; `_05-development/` contains project-wide development documentation

---

## Current Status

**🎯 For detailed, up-to-date project status:** See `_05-development/CURRENT_STATUS_2025-11-05.md`

**Quick Summary:**
- ✅ Core application deployed and operational
- ✅ Features working: Authentication, CSV upload, column mapping, nexus calculation, results dashboard
- ✅ Database: 12 tables deployed with 239 rows of state rules
- ⏳ Current: Sprint 1 (Physical Nexus, VDA, Exempt Sales) in planning phase
- 📍 Next: Sprint 1 implementation

**What's Working:**
- Full user authentication (login/signup)
- 7-screen workflow end-to-end
- Economic nexus calculation (calendar year, 44 states)
- Multi-year analysis with sticky nexus tracking
- Data upload, validation, column mapping
- Results dashboard and state-by-state breakdown
- Analysis management (list, view, delete)

**Recent Additions (Nov 2025):**
- Smart column mapping with auto-detection
- Auto-detect date range from CSV
- Streamlined analysis flow (75% click reduction)

---

## Working Rules (CRITICAL)

### Schema Management

**The database schema is FROZEN:**
- ✅ All 12 tables defined, documented, and deployed
- ✅ Foreign keys, indexes, constraints locked
- ✅ RLS policies implemented and active
- ⚠️ Any changes require documentation updates FIRST

**Before making schema changes:**
1. Read `_04-technical-specs/data-model-specification.md` and `state-rules-schema.md`
2. Check if change is truly necessary
3. Update specification files
4. Document in `_07-decisions/decision-log.md`
5. Create new migration script (never modify existing ones)

### Token Management
- **No file over 25,000 tokens** - Break into logical parts if needed
- Name parts clearly: `feature-part-1-description.md`
- Each part should be useful standalone

### Documentation Standards
- Include "Last Updated: YYYY-MM-DD" at top of every file
- Include "Last Verified: YYYY-MM-DD" for operational docs
- Write for cold starts (assume reader has no context)
- Use concrete examples over abstract descriptions
- Flag open questions with `[QUESTION]` tag
- Flag needed decisions with `[DECISION NEEDED]` tag
- Cross-reference related documents

### Decision Making
- Check `_07-decisions/decision-log.md` before re-deciding
- Document ALL significant decisions in decision log
- Include: rationale, alternatives, implications
- Update affected specifications

### File Organization (NEW - 2025-11-11)

**Understanding file organization:**
- `_0X-` folders = Documentation (planning, specs, development docs)
- Root folders (`backend/`, `frontend/`) = Actual code
- `_archives/` = Historical documents (completion reports, superseded docs)

**When files have been archived:**
- Check `_archives/` folder structure and READMEs
- Historical docs preserved for learning, not for current use
- Always use docs in main folders, not archives

---

## Key Context to Remember

### The Core Value Proposition
- **Current state:** 12-20 hours manual work
- **With tool:** Minutes + <1 hour review
- **Savings:** 11-19 hours per engagement
- **Client pays:** $5,000-$25,000 per engagement
- **Result:** Tool pays for itself on single use

### Target Users
- Former Big 4 SALT professionals at boutique agencies
- Comfortable with Excel, NOT with coding
- Need 90-95% accuracy (not 100%)
- Value professional output and ease of use

### Critical Design Decisions Made
1. ✅ Physical nexus included in MVP (essential for accuracy)
2. ✅ Marketplace facilitator handling (critical for e-commerce)
3. ✅ Average local rates, not exact (acceptable for estimates)
4. ✅ Excel/CSV input only (no API integrations for MVP)
5. ✅ Human-in-the-loop design (tool assists, doesn't replace)
6. ✅ User-controlled data retention (privacy-focused)
7. ✅ Multi-tenant with RLS (boutique agencies as separate users)
8. ✅ Comprehensive error handling (never lose user work)

### Database Architecture
- **12 tables:** 7 user data + 5 state rules
- **Security:** Row Level Security (RLS) policies active
- **Isolation:** Multi-tenant - users cannot see each other's data
- **Retention:** User-controlled (delete_immediate, 90_days, 1_year)
- **Integrity:** Foreign keys with CASCADE DELETE
- **Performance:** Indexes for query optimization
- **Data:** 239 rows of state rules (nexus thresholds, tax rates, interest/penalty)

### Out of Scope for MVP
- ❌ Exact local tax rate lookups
- ❌ VDA preparation (being added in Sprint 1!)
- ❌ Registration automation
- ❌ Return filing
- ❌ API integrations
- ❌ Report branding/customization (Tier 2 feature)
- ❌ Payment processing (pilot is free)

---

## Common Pitfalls to Avoid

### ❌ Don't:
- Modify database schema without updating specification files
- Make decisions without checking decision log first
- Create files without "Last Updated" dates
- Assume context from previous conversations
- Break the 25k token limit
- Add features not in current sprint scope
- Use camelCase column names (use snake_case)
- Invent table structures (use exact SQL from specs)
- Reference archived files as if they're current

### ✅ Do:
- Read `CURRENT_STATUS.md` for project status
- Check decision log before re-deciding
- Reference exact line numbers from specification files
- Write for someone with zero context
- Provide concrete examples
- Cross-reference related docs
- Ask clarifying questions when needed
- Use EXACT schema from specification files
- Check `_archives/` if a file isn't where expected

---

## Quick Reference

### "What are we building?"
→ Nexus Check: Nexus analysis tool (12-20 hrs → minutes)

### "Who is it for?"
→ SALT pros at boutique agencies (ex-Big 4)

### "What's the current status?"
→ See `_05-development/CURRENT_STATUS_2025-11-05.md`

### "What's next?"
→ Sprint 1: Physical Nexus, VDA, Exempt Sales (in planning)

### "What's been decided?"
→ See `_07-decisions/decision-log.md`

### "Where is the database schema?"
→ See `_04-technical-specs/data-model-specification.md` and `state-rules-schema.md`

### "Can I modify the database?"
→ NO - Schema is frozen. Update docs first if absolutely necessary.

### "Where do I start?"
→ Read `00-START-HERE.md` then `QUICK_START_FOR_NEW_SESSIONS.md`

### "What if a file isn't where the docs say?"
→ Check `_archives/` - many historical docs were archived Nov 11, 2025

---

## For New Conversations

**Essential context files to read:**
1. `_08-llm-guides/QUICK_START_FOR_NEW_SESSIONS.md` (**START HERE** - 5-minute orientation)
2. `00-START-HERE.md` (project orientation)
3. `_05-development/CURRENT_STATUS_2025-11-05.md` (current status - SINGLE SOURCE OF TRUTH)
4. `_08-llm-guides/PROJECT-SUMMARY.md` (complete context)
5. `_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md` (**CRITICAL** before coding)
6. `_07-decisions/decision-log.md` (architectural decisions)

**For specific work:**
- **Planning:** `_03-planning/priority-tiers.md`, `docs/plans/ROADMAP.md`
- **Architecture:** `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md`
- **Database:** `_04-technical-specs/data-model-specification.md`, `state-rules-schema.md`
- **Development:** `_05-development/README_DEVELOPMENT.md`
- **Security:** `_07-decisions/SECURITY_NOTES.md`

**For database work specifically:**
- Always reference specification files
- Use exact SQL from migration scripts
- Never modify existing migrations
- Create new migrations for changes (009+)

---

## Tech Stack (Locked In)

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
- Frontend: Vercel
- Backend: Railway
- Database: Supabase

---

## Remember

**The schema is LOCKED.** All 12 tables are defined, documented, deployed, and operational. Any changes require specification updates first.

**Status lives in ONE place.** Check `_05-development/CURRENT_STATUS_2025-11-05.md` for current reality. Don't rely on status claims in other documents.

**Document everything.** Future LLMs and humans will thank you.

**Focus on value.** Every feature maps to saving 11-19 hours per engagement.

**Build sequentially.** Validate each sprint before moving to next.

**Check archives.** If a file isn't where expected, it may have been archived. Check `_archives/` folder structure.

---

**Last Updated:** 2025-11-11
**Last Verified:** 2025-11-11
**Previous Version:** Archived to `_archives/llm-guides-snapshots/2025-11-03-to-11-10-core-app-build/`
