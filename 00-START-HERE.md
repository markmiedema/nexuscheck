# SALT Tax Tool - Project Documentation

**Last Updated:** 2025-11-07
**Status:** Phase 1A Complete - V2 Nexus Calculator Production-Ready ✅
**Current Phase:** Phase 1A Complete → Phase 1B (Rolling 12-Month Lookback)

---

## ðŸŽ¯ Quick Start for LLMs

You are helping build a SALT (State and Local Tax) automation tool for boutique tax agencies. This document is your entry point to understand the project.

### Read These Files First (in order):
1. `_01-project-overview/vision.md` - What we're building and why
2. `_02-requirements/target-users.md` - Who this is for
3. `_02-requirements/mvp-scope.md` - What we're building first
4. `_03-planning/task-breakdown.md` - Full professional workflow
5. `_03-planning/priority-tiers.md` - What to build when

### Current Work:
- **Phase 1 Complete:** âœ… Data model and state rules database designed
- **Phase 2A Complete:** âœ… Database implemented and deployed to Supabase (all migrations run successfully)
  - 12 tables created with RLS policies
  - 239 rows of state rules data (52 states, 47 nexus rules, 47 marketplace rules, 46 tax rates, 47 interest/penalty rates)
  - See `migrations/DEPLOYMENT_GUIDE.md` for complete deployment summary
- **Phase 2B Complete:** ✅ User Flow Design finished with 7 core screens
  - See `_04-technical-specs/PHASE_2B_SCREEN_SPECIFICATIONS.md` for complete UX specifications
- **Phase 3 Complete:** ✅ Technical Architecture fully defined
  - 30+ API endpoints specified
  - Frontend/Backend architecture designed
  - Authentication & security strategy
  - Deployment infrastructure planned
  - See `_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md` for complete technical specs
- **Phase 4 Sprints 1-5:** ✅ Core application built and deployed
  - Next.js frontend + FastAPI backend fully functional
  - Data upload, validation, and processing working
  - Economic nexus calculation engine operational
  - Liability estimation complete
  - Report generation functional
- **Phase 1A Complete:** ✅ V2 Nexus Calculator with Calendar Year Lookback (44 states)
  - Chronological processing algorithm
  - Sticky nexus tracking across years
  - Multi-year analysis with year-by-year breakdown
  - Marketplace facilitator rules (30 count, 14 don't count)
  - Production-ready API and UI
  - Comprehensive test coverage (8/8 tests passing)
  - See `docsplans/PHASE_1A_COMPLETION_SUMMARY.md` for complete details
- **Sprint 1A Complete:** ✅ Analysis Management (Nov 7, 2025)
  - List and search previous analyses
  - View saved analysis results
  - Delete analyses (soft delete)
  - Dashboard integration
  - 5 unit tests + integration test
  - Comprehensive manual testing checklist
- **Sprint 1C Complete:** ✅ Auto-Detect Date Range (Nov 7, 2025)
  - Removed date inputs from analysis creation form
  - Automatic date detection from CSV upload
  - Date confirmation dialog with shadcn/ui
  - Database migration for nullable dates
  - Simplified user experience
  - 4 unit tests + integration testing checklist
- **UX Improvements:** ✅ Streamlined Analysis Flow (Nov 9, 2025)
  - Merged new analysis + upload into one page
  - Single confirmation dialog (replaces 2 separate dialogs)
  - Fixed calculation race condition with polling
  - Embedded state table in results page
  - 75% reduction in user clicks (7 clicks → 2 clicks)
  - See `docs/plans/2025-11-09-streamlined-analysis-flow-implementation.md`
- **Next Up:** Sprint 1B - PDF Generation (12-16 hours) - Last remaining Week 1 sprint
- **See:** `_03-planning/workflow-phases.md` for the full build roadmap

---

## ðŸ“ Project Structure

```
SALT-Tax-Tool/
â”œâ”€â”€ 00-START-HERE.md              â† You are here
â”œâ”€â”€ PROJECT-SUMMARY.md            â† Complete summary of all planning
â”œâ”€â”€ LLM-INSTRUCTIONS.md           â† Quick reference for LLMs
â”œâ”€â”€ 01-project-overview/          â† High-level context and vision
â”œâ”€â”€ 02-requirements/              â† Requirements from definition framework
â”œâ”€â”€ 03-planning/                  â† Workflow, priorities, roadmap
â”œâ”€â”€ 04-technical-specs/           â† Data models, architecture
â”‚   â”œâ”€â”€ data-model-specification.md      (Phase 1, Step 1) âœ…
â”‚   â””â”€â”€ state-rules-schema.md            (Phase 1, Step 2) âœ…
â”œâ”€â”€ 05-state-rules/               â† State-specific tax rules (modular)
â”œâ”€â”€ 06-development/               â† Code and implementation
â”œâ”€â”€ 07-decisions/                 â† Decision log with rationale
â”‚   â”œâ”€â”€ decision-log.md                  (current version)
â”‚   â””â”€â”€ _archives/                       (previous versions)
â””â”€â”€ 08-templates/                 â† Reusable templates and examples
```

---

## ðŸš¨ Critical Rules for Working on This Project

### Token Limits
- **No single file over 25,000 tokens** - Break large files into logical modules
- If a topic requires >25k tokens, split into parts (e.g., `state-rules-part-1.md`, `state-rules-part-2.md`)
- Each part should be self-contained enough to be useful independently

### File Organization
- Use numbered prefixes for reading order (01-, 02-, etc.)
- Use descriptive filenames (no abbreviations unless obvious)
- Include "Last Updated" date at top of each file
- Cross-reference related files clearly

### Documentation Standards
- Write for LLMs reading cold (assume no prior context)
- Include "Why" with every decision
- Use concrete examples over abstract descriptions
- Flag open questions with `[QUESTION]` tag
- Flag decisions needed with `[DECISION NEEDED]` tag

---

## ðŸ“Š Project Status

### Completed:
âœ… Problem definition and user research
âœ… Task breakdown for SALT professionals
âœ… MVP scope definition
âœ… Priority tier planning
âœ… Project structure setup
âœ… **Phase 1 - Technical Foundation:**
  - **Step 1:** Data Model Design (Excel input, physical nexus, report output)
  - **Step 2:** State Rules Database Structure (5 tables, optimized queries)
âœ… **Phase 2A - Database Implementation:**
  - All 12 tables created in Supabase with RLS policies
  - 9 migration scripts deployed successfully (001, 002, 003, 004b, 005, 006, 007, 007b, 008)
  - 239 rows of state rules data loaded and verified
  - Complete deployment guide with lessons learned

### Recently Completed:
ðŸ"„ **Phase 3:** Technical Architecture (November 3, 2025)
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

## ðŸ”§ Technical Stack (Decided)

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

## ðŸ” Finding What You Need

### "What are we building?"
â†' `_08-llm-guides/PROJECT-SUMMARY.md` or `_01-project-overview/vision.md`

### "Who is this for?"
→ `_02-requirements/target-users.md`

### "What's in the MVP?"
→ `_02-requirements/mvp-scope.md`

### "What should I work on next?"
→ `_03-planning/workflow-phases.md`

### "What have we decided and why?"
→ `_07-decisions/decision-log.md`

### "How is the data structured?"
→ `_04-technical-specs/data-model-specification.md`

### "How are state rules stored?"
→ `_04-technical-specs/state-rules-schema.md`

### "What's the current status?"
→ `_05-development/CURRENT_STATUS_2025-11-05.md`

---

## ðŸ’¡ Context for New Conversations

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

## ðŸ“ How to Update This Project

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

## ðŸŽ¯ Current Priorities

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

## ðŸ“ˆ Progress Summary

**Time Invested:** ~6-8 hours planning + design  
**Deliverables Created:** 12 documentation files + 2 technical specifications  
**Phase 1 Status:** âœ… Complete  
**Next Milestone:** Phase 2 complete â†’ Ready for detailed technical architecture  

---

## Questions or Issues?

If something is unclear or missing, note it in the appropriate file with a `[QUESTION]` tag and continue with reasonable assumptions. Document your assumptions in `07-decisions/decision-log.md`.

---

## ðŸš€ Ready to Build

With Phase 1 complete, you have:
- âœ… Clear data structures (input, processing, output)
- âœ… Complete database schema (5 normalized tables)
- âœ… Technical stack decided (Supabase + FastAPI + Next.js)
- âœ… All architectural decisions documented
- âœ… MVP scope clearly defined
- âœ… Priority roadmap established

**You're now ready to either:**
- Implement the database and start coding
- Design the user experience (Phase 2)
- Both in parallel (if you have resources)

The foundation is solid. Time to build! ðŸŽ¯
