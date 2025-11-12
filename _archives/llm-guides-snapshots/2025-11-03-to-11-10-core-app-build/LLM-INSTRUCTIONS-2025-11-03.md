# Instructions for LLMs Working on This Project

**Last Updated:** 2025-11-03

---

## Quick Start

**First action:** Read `00-START-HERE.md` in the project root.

**For complete context:** Read `PROJECT-SUMMARY.md`

**Current phase:** Phase 3 COMPLETE ✅ - Technical Architecture fully defined with 30+ API endpoints. Next: Phase 4, Sprint 1 (Development - Data Upload & Validation)

---

## 🚨 CRITICAL: Database Schema is LOCKED

**The database schema is now IMPLEMENTED and FROZEN.**

### Rules for Working with the Database:

1. **DO NOT modify table structures** without updating specification files first
2. **DO NOT change column names, types, or constraints**
3. **DO NOT add/remove tables** without documenting in decision-log.md
4. **USE EXACT SQL** from specification files:
   - `data-model-specification.md` (lines 72-709)
   - `state-rules-schema.md` (lines 54-843)

### Where the Schema Lives:

**📄 Specification Files (Source of Truth):**
- `data-model-specification.md` - Tables 1-7 (user data)
- `state-rules-schema.md` - Tables 8-12 (state rules)

**🗄️ Migration Scripts (Executable SQL):**
- `migrations/001_initial_schema.sql` - All 12 tables (DEPLOYED ✅)
- `migrations/002_row_level_security.sql` - RLS policies (DEPLOYED ✅)
- `migrations/003_validation_checks.sql` - Validation queries (DEPLOYED ✅)
- `migrations/004b_allow_negative_local_rates.sql` - Fix for NJ negative rates (DEPLOYED ✅)
- `migrations/005_populate_state_data.sql` - States, nexus, marketplace, tax_rates (DEPLOYED ✅)
- `migrations/006_add_compound_annually_support.sql` - Schema fix for AZ/NJ (DEPLOYED ✅)
- `migrations/007_add_late_payment_penalty_bounds.sql` - Flat fee support (DEPLOYED ✅)
- `migrations/007b_add_filing_penalty_bounds_and_compounding.sql` - Additional columns (DEPLOYED ✅)
- `migrations/008_populate_interest_penalty_rates.sql` - Interest/penalty rates, 47 jurisdictions (DEPLOYED ✅)
- `migrations/DEPLOYMENT_GUIDE.md` - Complete deployment instructions with lessons learned

**⚠️ IF YOU NEED TO CHANGE THE SCHEMA:**
1. Update specification file first
2. Document reason in `decision-log.md`
3. Create new migration script (005_description.sql)
4. Update `DATABASE_IMPLEMENTATION_SUMMARY.md`
5. Never modify existing migrations

---

## Project Overview in 3 Sentences

You're helping build a SALT tax automation tool that reduces 12-20 hours of manual nexus analysis work to minutes. Target users are SALT professionals at boutique agencies who left Big 4 firms. MVP focuses on economic nexus determination, physical nexus tracking, and liability estimation with professional report generation.

---

## Directory Structure

```
SALT-Tax-Tool/
├── 00-START-HERE.md              ← Read first
├── PROJECT-SUMMARY.md            ← Complete context
├── LLM-INSTRUCTIONS.md           ← This file
├── DATABASE_IMPLEMENTATION_SUMMARY.md  ← Database status
├── 01-project-overview/
│   └── vision.md                 ← What & why we're building
├── 02-requirements/
│   ├── target-users.md           ← Who this is for
│   └── mvp-scope.md              ← What we're building first
├── 03-planning/
│   ├── task-breakdown.md         ← All SALT professional tasks
│   ├── priority-tiers.md         ← Build order (Tier 1/2/3)
│   └── workflow-phases.md        ← Current phase & next steps
├── 04-technical-specs/
│   ├── data-model-specification.md     ← LOCKED SCHEMA (Tables 1-7)
│   └── state-rules-schema.md           ← LOCKED SCHEMA (Tables 8-12)
├── 05-state-rules/
│   └── (TBD - state-specific data)
├── 06-development/
│   └── (TBD - application code)
├── 07-decisions/
│   └── decision-log.md           ← Key decisions & rationale
├── 08-templates/
│   └── (TBD - reusable templates)
└── migrations/                   ← Database migration scripts
    ├── 001_initial_schema.sql
    ├── 002_row_level_security.sql
    ├── 003_validation_checks.sql
    └── 004_initial_data_population.sql
```

---

## Current Status

**Phase:** Phase 3 (Technical Architecture) - COMPLETE ✅
**Status:** Complete technical architecture with 30+ API endpoints, auth strategy, deployment plan
**Next Task:** Phase 4, Sprint 1 - Data Upload & Validation (Next.js + FastAPI setup, authentication, Screens 1-3)
**See:** `PHASE_3_TECHNICAL_ARCHITECTURE.md` for complete technical specifications

**What's Done:**
- ✅ All 12 database tables deployed to Supabase
- ✅ 239 rows of state rules data loaded
- ✅ 7 core screen flows defined
- ✅ Complete wireframes and user interactions documented
- ✅ 30+ API endpoints fully specified
- ✅ Frontend architecture (Next.js 14 + React + Tailwind)
- ✅ Backend architecture (FastAPI + Python)
- ✅ Authentication strategy (Supabase Auth with JWT)
- ✅ Deployment plan (Vercel + Railway + Supabase)

**What's Next:**
- ⏳ Set up Next.js project with proper structure
- ⏳ Set up FastAPI project with proper structure
- ⏳ Implement Supabase Auth integration
- ⏳ Build Screens 1-3 (Setup, Upload, Mapping)
- ⏳ Implement CSV processing service
- ⏳ Build data validation engine

---

## Working Rules (CRITICAL)

### Schema Management (NEW - 2025-11-02)

**The database schema is now FROZEN:**
- ✅ All 12 tables defined and documented
- ✅ Foreign keys, indexes, constraints locked
- ✅ RLS policies designed
- ⚠️ Any changes require documentation updates FIRST

**Before making schema changes:**
1. Read `data-model-specification.md` and `state-rules-schema.md`
2. Check if change is truly necessary
3. Update specification files
4. Document in `decision-log.md`
5. Create new migration script (never modify existing ones)

### Token Management
- **No file over 25,000 tokens** - Break into logical parts if needed
- Name parts clearly: `state-rules-part-1-economic-nexus.md`
- Each part should be useful standalone

### Documentation Standards
- Include "Last Updated: YYYY-MM-DD" at top of every file
- Write for cold starts (assume reader has no context)
- Use concrete examples over abstract descriptions
- Flag open questions with `[QUESTION]` tag
- Flag needed decisions with `[DECISION NEEDED]` tag
- Cross-reference related documents

### Decision Making
- Check `07-decisions/decision-log.md` before re-deciding
- Document ALL significant decisions in decision log
- Include: rationale, alternatives, implications
- Update affected specifications

### File Maintenance & Cleanup (NEW - 2025-11-03)

**When to audit files proactively:**
- ✅ After completing any major phase (2A, 2B, 3, etc.)
- ✅ When root directory has >12 markdown files
- ✅ After 3+ work sessions on same topic
- ✅ When you notice superseded documents

**Cleanup checklist:**
1. Check for files superseded by newer versions
2. Look for work logs that are now historical
3. Find phase-specific files after phase completion
4. Identify redundant documentation
5. Propose archive structure with README explanations

**Archive structure:**
- Create `_archives/` subdirectories with descriptive names
- Always include `README.md` explaining: why archived, what's inside, when to reference
- Keep root directory focused on current work (10-12 essential files max)
- Batch file cleanup is better than ad-hoc moves

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
4. ✅ Excel input only (no API integrations for MVP)
5. ✅ Human-in-the-loop design (tool assists, doesn't replace)
6. ✅ User-controlled data retention (privacy-focused)
7. ✅ Multi-tenant with RLS (boutique agencies as separate users)
8. ✅ Comprehensive error handling (never lose user work)

### Database Architecture (NEW)
- **12 tables:** 7 user data + 5 state rules
- **Security:** Row Level Security (RLS) with 29 policies
- **Isolation:** Multi-tenant - users cannot see each other's data
- **Retention:** User-controlled (delete_immediate, 90_days, 1_year)
- **Integrity:** 11 foreign keys with CASCADE DELETE
- **Performance:** 17 indexes for query optimization

### Out of Scope for MVP
- ❌ VDA preparation
- ❌ Registration automation
- ❌ Return filing
- ❌ API integrations
- ❌ Exact local rates
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
- Add features not in MVP scope
- Use camelCase column names (use snake_case)
- Invent table structures (use exact SQL from specs)

### ✅ Do:
- Read PROJECT-SUMMARY.md for full context
- Check decision log before re-deciding
- Reference exact line numbers from specification files
- Write for someone with zero context
- Provide concrete examples
- Cross-reference related docs
- Ask clarifying questions when needed
- Use EXACT schema from specification files

---

## Quick Reference

### "What are we building?"
→ MVP: Nexus analysis tool (12-20 hrs → minutes)

### "Who is it for?"
→ SALT pros at boutique agencies (ex-Big 4)

### "What's next?"
→ Start development - Sprint 1: Data Upload & Validation

### "What's been decided?"
→ See `07-decisions/decision-log.md`

### "Where is the database schema?"
→ See `data-model-specification.md` and `state-rules-schema.md`

### "Can I modify the database?"
→ NO - Schema is frozen. Update docs first if absolutely necessary.

### "Where do I start?"
→ Read `00-START-HERE.md` then `DATABASE_IMPLEMENTATION_SUMMARY.md`

---

## For New Conversations

**Essential context files to share:**
1. `QUICK_START_FOR_NEW_SESSIONS.md` (**START HERE** - 5-minute orientation)
2. `00-START-HERE.md` (project orientation)
3. `INTEGRATION_AND_DEPENDENCIES.md` (**CRITICAL** - dependencies & integration)
4. `PHASE_2B_SCREEN_SPECIFICATIONS.md` (complete UX design - 7 screens)
5. `PHASE_3_TECHNICAL_ARCHITECTURE.md` (complete technical architecture)
6. `PROJECT-SUMMARY.md` (complete context)
7. `data-model-specification.md` (LOCKED schema - Tables 1-7)
8. `state-rules-schema.md` (LOCKED schema - Tables 8-12)
9. `_07-decisions/decision-log.md` (architectural decisions)

**For database work specifically:**
- Always reference specification files by line number
- Use exact SQL from migration scripts
- Never modify existing migrations
- Create new migrations for changes (005+)

**Template for new sessions:** See `NEW-LLM-SESSION-TEMPLATE.md`

---

## Remember

**The schema is LOCKED.** All 12 tables are defined, documented, and ready for deployment. Any changes require specification updates first.

**Document everything.** Future LLMs and humans will thank you.

**Focus on value.** Every feature maps to saving 11-19 hours per engagement.

**Build sequentially.** Validate MVP before expanding to Tier 2/3.

**Avoid schema drift.** This was the failure mode of the first attempt. Use exact SQL from specs.
