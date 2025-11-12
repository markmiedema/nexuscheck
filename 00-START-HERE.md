# Nexus Check - Project Documentation

**Last Updated:** 2025-11-11
**For Current Status:** See `_05-development/CURRENT_STATUS_2025-11-05.md`
**Quick Summary:** Core app complete [x] | Sprint 1 (Physical Nexus, VDA, Exempt Sales) in planning

---

## Quick Start for LLMs

You are helping build a SALT (State and Local Tax) automation tool for boutique tax agencies. This document is your entry point to understand the project.

### Read These Files First (in order):
1. `_01-project-overview/vision.md` - What we're building and why
2. `_02-requirements/target-users.md` - Who this is for
3. `_02-requirements/mvp-scope.md` - What we're building first
4. `_03-planning/task-breakdown.md` - Full professional workflow
5. `_03-planning/priority-tiers.md` - What to build when

### What's Been Built:
- [x] **Core Application** (Phases 1-4, completed 2025)
  - Data model, database (Supabase with 239 rows of state rules)
  - Next.js frontend + FastAPI backend
  - Economic nexus calculation (calendar year lookback, 44 states)
  - Multi-year analysis with sticky nexus tracking
  - Data upload, validation, column mapping
  - Results dashboard and state-by-state breakdown
  - Analysis management (list, view, delete)

- [x] **Recent UX Improvements** (Nov 2025)
  - Smart column mapping with auto-detection
  - Auto-detect date range from CSV
  - Streamlined analysis flow (75% click reduction)

### What's Next:
- **Sprint 1** (Physical Nexus, VDA, Exempt Sales) - Planning complete, ready to build
- **Sprint 2-5** - Outlined in `docs/plans/ROADMAP.md`

**For detailed current status:** See `_05-development/CURRENT_STATUS_2025-11-05.md`

---

## Project Structure

```
SALT-Tax-Tool/
├── 00-START-HERE.md               You are here
├── _01-project-overview/          High-level context and vision
├── _02-requirements/              Requirements from definition framework
├── _03-planning/                  Workflow, priorities, roadmap
├── _04-technical-specs/           Data models, architecture
│   ├── data-model-specification.md      (Phase 1, Step 1) [DONE]
│   └── state-rules-schema.md            (Phase 1, Step 2) [DONE]
├── _05-development/               Project-wide dev docs (status, changelog, guides)
├── _07-decisions/                 Decision log with rationale
├── _08-llm-guides/                LLM instructions and project summary
├── backend/                       FastAPI backend code
├── frontend/                      Next.js frontend code
├── docs/                          Sprint planning and roadmaps
└── _archives/                     Historical documents
```

---

## š¨ Critical Rules for Working on This Project

### Token Limits
- **No single file over 25,000 tokens** - Break large files into logical modules
- If a topic requires >25k tokens, split into parts (e.g., `state-rules-part-1.md`, `state-rules-part-2.md`)
- Each part should be self-contained enough to be useful independently

### File Organization
- Use numbered prefixes for reading order (_01, _02, etc.)
- Use descriptive filenames (no abbreviations unless obvious)
- Include "Last Updated" date at top of each file
- Cross-reference related files clearly
- **Note:** Numbering skips _06 because: (1) state rules live in Supabase database, not files; (2) actual code lives in `/backend` and `/frontend` at root level; `_05-development/` contains project-wide development documentation

### Documentation Standards
- Write for LLMs reading cold (assume no prior context)
- Include "Why" with every decision
- Use concrete examples over abstract descriptions
- Flag open questions with `[QUESTION]` tag
- Flag decisions needed with `[DECISION NEEDED]` tag

---

## "Š Project Status

### Completed:
[DONE] Problem definition and user research
[DONE] Task breakdown for SALT professionals
[DONE] MVP scope definition
[DONE] Priority tier planning
[DONE] Project structure setup
[DONE] **Phase 1 - Technical Foundation:**
  - **Step 1:** Data Model Design (Excel input, physical nexus, report output)
  - **Step 2:** State Rules Database Structure (5 tables, optimized queries)
[DONE] **Phase 2A - Database Implementation:**
  - All 12 tables created in Supabase with RLS policies
  - 9 migration scripts deployed successfully (001, 002, 003, 004b, 005, 006, 007, 007b, 008)
  - 239 rows of state rules data loaded and verified
  - Complete deployment guide with lessons learned

### Recently Completed:
"„ **Phase 3:** Technical Architecture (November 3, 2025)
- 30+ API endpoints fully specified with request/response examples
- Frontend architecture (Next.js 14 + React + Tailwind + shadcn/ui)
- Backend architecture (FastAPI + Python 3.11)
- Authentication strategy (Supabase Auth with JWT)
- Deployment plan (Vercel + Railway + Supabase)
- Security, performance, and error handling strategies
- See `PHASE_3_TECHNICAL_ARCHITECTURE.md`

### Next Up:
â¬œ **Phase 4, Sprint 1:** Data Upload & Validation (2-3 weeks)
- Set up Next.js + FastAPI projects with proper structure
- Implement authentication with Supabase Auth
- Build Screens 1-3 (Setup, Upload, Data Mapping)
- CSV processing service with pandas
- Data validation engine with comprehensive error handling

### Not Started:
â¬œ Phase 4, Sprint 2-6: Remaining Development Sprints
  - Sprint 2: Physical Nexus Intake (1-2 weeks)
  - Sprint 3: Economic Nexus Calculation Engine (3-4 weeks)
  - Sprint 4: Liability Estimation Engine (2-3 weeks)
  - Sprint 5: Report Generation (2-3 weeks)
  - Sprint 6: Polish & Testing (2-3 weeks)  
â¬œ Phase 5: Launch & Iterate (Beta testing, user feedback, production deployment)  

---

## "§ Technical Stack (Decided)

**Frontend:** Next.js 14 + React + Tailwind CSS  
**Backend:** FastAPI (Python 3.11+)  
**Database:** Supabase (Managed Postgres)  
**Authentication:** Supabase Auth  
**File Storage:** Supabase Storage  
**Data Processing:** pandas + openpyxl  
**PDF Generation:** WeasyPrint (to be confirmed)  
**Hosting:** Vercel (frontend) + Railway (backend)  

See `_07-decisions/decision-log.md` for full rationale.

---

## " Finding What You Need

### "What are we building?"
' `_08-llm-guides/PROJECT-SUMMARY.md` or `_01-project-overview/vision.md`

### "Who is this for?"
-> `_02-requirements/target-users.md`

### "What's in the MVP?"
-> `_02-requirements/mvp-scope.md`

### "What should I work on next?"
-> `_03-planning/workflow-phases.md`

### "What have we decided and why?"
-> `_07-decisions/decision-log.md`

### "How is the data structured?"
-> `_04-technical-specs/data-model-specification.md`

### "How are state rules stored?"
-> `_04-technical-specs/state-rules-schema.md`

### "What's the current status?"
-> `_05-development/CURRENT_STATUS_2025-11-05.md`

---

## '¡ Context for New Conversations

**For New LLM Sessions:**

**⚡ REQUIRED Reading (5-10 minutes) - FOLLOW THIS WORKFLOW:**
1. **`_08-llm-guides/LLM-ONBOARDING-WORKFLOW.md`** - **START HERE** - Complete onboarding process
2. **`_05-development/CURRENT_STATUS_2025-11-05.md`** - What's working now
3. **`_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`** - What we're building next
4. `00-START-HERE.md` - This file (project overview)
5. **`_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md`** - **CRITICAL before coding**

**For Development Work:**
4. `_04-technical-specs/PHASE_2B_SCREEN_SPECIFICATIONS.md` - What to build (UX)
5. `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md` - How to build it (API specs)
6. `_04-technical-specs/data-model-specification.md` + `state-rules-schema.md` - Database schema

**For Planning/Decisions:**
7. `_08-llm-guides/PROJECT-SUMMARY.md` - Complete project context
8. `_07-decisions/decision-log.md` - Architectural decisions

---

## " How to Update This Project

**Use the Documentation Update Checklist:** `_05-development/DOCUMENTATION_UPDATE_CHECKLIST.md`

**Quick Reference:**
1. **When completing a sprint:** Update sprint plan + current status + START-HERE
2. **When adding new information:** Determine which folder it belongs in
3. **When creating new files:** Update this START-HERE file's "Finding What You Need" section
4. **When making decisions:** Log them in `_07-decisions/decision-log.md`
5. **When completing milestones:** Update the "Project Status" section above
6. **Every Friday:** Review and update documentation (10-15 minutes)
7. **After each session:** Leave breadcrumbs in sprint plan for next session

---

## Current Priorities

### Immediate Next Steps:
1. **Optional but Recommended:** Implement database in Supabase (2 days)
   - Create tables from `_04-technical-specs/state-rules-schema.md`
   - Populate top 10 states data
   - Test sample queries

2. **Phase 2, Step 3:** User Flow Mapping (2-3 hours)
   - Design end-to-end user journey
   - Create wireframes for key screens
   - Define error states and edge cases

### Why Phase 2 is Important:
- Validates that the data structures support the UX
- Identifies any gaps in technical design
- Provides clear blueprint for development
- Ensures professional experience for target users

---

##  Progress Summary

**Time Invested:** ~6-8 hours planning + design  
**Deliverables Created:** 12 documentation files + 2 technical specifications  
**Phase 1 Status:** [DONE] Complete  
**Next Milestone:** Phase 2 complete ' Ready for detailed technical architecture  

---

## Questions or Issues?

If something is unclear or missing, note it in the appropriate file with a `[QUESTION]` tag and continue with reasonable assumptions. Document your assumptions in `07-decisions/decision-log.md`.

---

## š€ Ready to Build

With Phase 1 complete, you have:
- [DONE] Clear data structures (input, processing, output)
- [DONE] Complete database schema (5 normalized tables)
- [DONE] Technical stack decided (Supabase + FastAPI + Next.js)
- [DONE] All architectural decisions documented
- [DONE] MVP scope clearly defined
- [DONE] Priority roadmap established

**You're now ready to either:**
- Implement the database and start coding
- Design the user experience (Phase 2)
- Both in parallel (if you have resources)

The foundation is solid. Time to build!
