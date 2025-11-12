# Snapshot: Nov 3-10, 2025 - Core App Build Phase

**Snapshot Date:** 2025-11-11
**Period Covered:** November 3-10, 2025 (7 days)
**Project Phase:** Phase 4 (Development) - Building MVP Core Application

---

## Project Status During This Period

### Start of Period (Nov 3):
- **Status:** Phase 3 (Technical Architecture) just completed
- **Next:** Beginning Phase 4, Sprint 1 (Development)
- **Task:** Set up Next.js + FastAPI projects, build Screens 1-3

### End of Period (Nov 10):
- **Status:** Sprint 1 COMPLETE - Core app functional and deployed
- **Achievement:** Full workflow working (Upload → Map → Calculate → Results)
- **Features:** Authentication, 4 screens, calculation engine, database integration

### Velocity:
- **7 days:** Went from "starting development" to "deployed working application"
- **Extreme pace:** Rapid iteration, docs struggled to keep up with reality

---

## What LLMs Needed During This Phase

### Critical Information:
1. **Database Schema Rules** (highest priority)
   - Schema was newly locked (Nov 2)
   - LLMs needed to understand: DON'T modify schema without updating specs
   - Frequent references to exact table structures

2. **Integration Patterns** (second highest priority)
   - How frontend talks to backend (API client, JWT tokens)
   - How backend talks to database (Supabase client, RLS policies)
   - Authentication flow (Supabase Auth)

3. **Development Environment Setup**
   - Exact dependency versions (avoid compatibility issues)
   - Environment variable configuration
   - How to run dev servers

4. **Screen Specifications**
   - What each screen should do
   - User flow (Screen 1 → 2 → 3 → 4)
   - Wireframes and component structure

5. **Current Status** (changed daily!)
   - What's working now?
   - What's the next immediate task?
   - What can I assume exists vs what needs building?

### Questions LLMs Asked:
- "What's the current project status?" (asked daily - status changing rapidly)
- "Where is [file]?" (asked frequently - files being reorganized)
- "Is the database schema locked?" (asked multiple times - critical constraint)
- "What should I work on next?" (needed guidance on priorities)

---

## Files in This Snapshot

### 1. LLM-INSTRUCTIONS-2025-11-03.md
**Created:** 2025-11-03
**Last Updated:** 2025-11-03 (never updated during period!)

**Content:**
- Quick reference guide (3-sentence project overview)
- Database schema rules (CRITICAL - schema locked)
- Directory structure
- Working rules (token limits, documentation standards)
- Common pitfalls

**Status Claims:**
- "Current phase: Phase 3 COMPLETE ✅"
- "Next: Phase 4, Sprint 1 (Development - Data Upload & Validation)"

**What Was Accurate:**
- ✅ Database schema rules (stayed locked)
- ✅ Common pitfalls (timeless)
- ✅ Token limits and file organization rules (timeless)
- ✅ Tech stack decisions (locked in)

**What Became Outdated:**
- ❌ Current status (became stale immediately as development progressed)
- ❌ "Next steps" (Sprint 1 completed within 7 days)
- ❌ Directory structure (showed `05-state-rules/`, `06-development/` which don't exist)
- ❌ File references (many files got archived Nov 11)

---

### 2. LLM-ONBOARDING-WORKFLOW-2025-11-07.md
**Created:** Earlier (unknown)
**Last Updated:** 2025-11-07

**Content:**
- Step-by-step onboarding process (5-step workflow)
- Critical rules (TodoWrite, no auto-commits, read before editing)
- Documentation update responsibilities
- Example session starts (good vs bad)

**Status Claims:**
- References `SPRINT_PLAN_BETA_TO_PILOT.md` (later archived)
- References `PHASE_2B_SCREEN_SPECIFICATIONS.md` (later archived)
- Says to update sprint plan and current status docs weekly

**What Was Accurate:**
- ✅ Onboarding workflow (still valid approach)
- ✅ Critical rules (TodoWrite, read before edit - still apply)
- ✅ Documentation responsibilities (still needed)
- ✅ Example session starts (still good templates)

**What Became Outdated:**
- ❌ File path references (SPRINT_PLAN archived, PHASE_2B archived)
- ❌ Specific docs to read in steps (some archived)
- ❌ "Current sprint" references (Sprint 1 completed)

---

### 3. PROJECT-SUMMARY-2025-11-10.md
**Created:** 2025-11-01
**Last Updated:** 2025-11-10 (most recent!)

**Content:**
- Executive summary (value prop, target market, MVP focus)
- Problem definition (detailed user profile)
- Solution overview (what we're building)
- Key features (MVP scope)
- Critical design decisions
- Out of scope items
- Build priority tiers
- Development workflow phases
- Success metrics
- Open questions

**Status Claims:**
- "Status: Requirements complete, ready to begin data model design"
- "Next Action: Design Excel input schema and output structure"

**What Was Accurate:**
- ✅ Problem definition (still accurate)
- ✅ Solution overview (still accurate)
- ✅ Key features (still the MVP)
- ✅ Critical design decisions (still apply)
- ✅ Target user profile (still accurate)
- ✅ Success metrics (still the goals)

**What Became Outdated:**
- ❌ Status line (data model was designed, app was BUILT and DEPLOYED)
- ❌ "Next Action" (we're way past data model design)
- ❌ Development workflow phases (showed Phase 1 as "CURRENT")

---

### 4. QUICK_START_FOR_NEW_SESSIONS-2025-11-10.md
**Created:** Earlier (unknown)
**Last Updated:** 2025-11-10

**Content:**
- 30-second overview
- Essential reading order
- What we're building
- Current project status (detailed completion checklist)
- Project structure
- Tech stack
- Critical constraints
- Development startup guide
- API endpoints summary
- Database tables summary
- Common pitfalls
- Validation checklist

**Status Claims:**
- "Current Status: Sprint 1 COMPLETE ✅ → Screens 1-4 functional"
- "Next: Sprint 2"
- Very detailed phase completion status

**What Was Accurate:**
- ✅ Tech stack (correct and locked in)
- ✅ Critical constraints (still apply)
- ✅ Common pitfalls (still valuable)
- ✅ Database tables summary (schema locked)
- ✅ Integration patterns (still correct)

**What Became Outdated:**
- ❌ File paths (DEVELOPMENT_NOTES.md archived, PHASE_2B archived)
- ❌ Directory structure (showed files at wrong locations)
- ❌ "Sprint 1" terminology (ambiguous - old Sprint 1 vs new Sprint 1)

---

## Key Insights from This Snapshot

### What Changed Most Frequently:

1. **Project Status** (daily changes)
   - "What's working now" changed as features were built
   - "What's next" changed as tasks were completed
   - File created Nov 3 said "Phase 3 complete", by Nov 10 app was deployed

2. **File Locations** (changed once, but dramatically)
   - Nov 11: Major reorganization
   - Many files archived (completion reports, development notes, planning docs)
   - LLM guides suddenly had broken references

3. **Sprint Terminology** (confused over time)
   - "Sprint 1" initially meant "core app build" (Nov 3-10)
   - "Sprint 1" later meant "Physical Nexus/VDA/Exempt Sales" (Nov 11+)
   - Caused significant confusion

### What Stayed Stable:

1. **Core Value Proposition**
   - Problem: 12-20 hours manual work
   - Solution: Minutes + <1 hour review
   - Target: SALT pros at boutique agencies
   - **Never changed**

2. **Technical Constraints**
   - Database schema locked (Nov 2, stayed locked)
   - 90-95% accuracy target
   - Human-in-the-loop design
   - **Never changed**

3. **Tech Stack**
   - Next.js 14, FastAPI, Supabase
   - Specific versions locked
   - Architecture decisions locked
   - **Never changed**

4. **Common Pitfalls**
   - Integration issues (CORS, JWT)
   - RLS blocking queries
   - Environment variables not loading
   - **Never changed**

---

## Lessons Learned

### 🎯 Lesson 1: Status Information Needs Single Source of Truth

**Problem:**
- 4 files all claimed different "current status"
- LLM-INSTRUCTIONS said "Phase 3 complete, starting Phase 4"
- PROJECT-SUMMARY said "Requirements complete, ready to begin data model design"
- QUICK_START said "Sprint 1 COMPLETE"
- All were written at different times, never synchronized

**Impact:**
- LLMs got confused about project state
- Guidance contradicted reality
- Wasted time asking "what's the actual status?"

**Solution for Next Snapshot:**
- Status lives in ONE file: `CURRENT_STATUS.md`
- LLM guides REFERENCE it, don't duplicate it
- Pattern: "For current status, see CURRENT_STATUS.md"

---

### 🎯 Lesson 2: File Path References Are Brittle

**Problem:**
- Guides said "Read `DEVELOPMENT_NOTES.md`"
- Nov 11: File archived to `_archives/development-logs/DEVELOPMENT_NOTES_PHASE4_2025-11-04.md`
- LLMs got file not found errors

**Impact:**
- Broken references
- LLMs couldn't find recommended reading
- Trust in documentation eroded

**Solution for Next Snapshot:**
- Expect files to move
- Use relative paths where possible
- When reorganizing, systematically update ALL references
- Consider: Don't hardcode specific filenames, describe what to look for

---

### 🎯 Lesson 3: Operational Docs Need Active Maintenance

**Problem:**
- Thought LLM guides were "write once, use forever"
- LLM-INSTRUCTIONS never updated (Nov 3 → Nov 11)
- Reality changed daily, docs didn't

**Impact:**
- Guides became historical artifacts, not operational tools
- Had to tell LLMs "ignore that, here's what's real"
- Documentation debt accumulated

**Solution for Next Snapshot:**
- Schedule weekly doc reviews during active development
- Treat LLM guides like code: needs refactoring
- Add "Last Verified" date separate from "Last Updated"

---

### 🎯 Lesson 4: Separate Facts from Guidance

**Problem:**
- Mixed timeless guidance with time-sensitive facts
- "Database schema is locked" (timeless) in same section as "Current phase: Phase 3" (time-sensitive)
- When facts changed, whole document felt outdated

**Impact:**
- Threw out useful guidance because it was mixed with stale facts
- Couldn't easily update just the facts

**Solution for Next Snapshot:**
- Separate sections:
  - Timeless: "How to work on this project" (rarely changes)
  - Facts: "Current state" (changes frequently)
- Make it easy to update facts without touching guidance

---

### 🎯 Lesson 5: Most Content IS Reusable

**Finding:**
- 80-85% of content remained accurate despite rapid development
- Problem definition: Still accurate
- Design decisions: Still accurate
- Common pitfalls: Still accurate
- Tech stack: Still accurate

**Insight:**
- Core guidance is stable
- Only facts about "current state" change
- Can build templates from stable sections

**Application for Next Snapshot:**
- Extract timeless sections as templates
- Reuse across snapshots
- Focus updates on dynamic sections

---

## What Would We Do Differently?

### If Starting This Phase Again:

1. **Centralize Status**
   - Create `CURRENT_STATUS.md` on Day 1
   - All guides reference it, never duplicate status
   - Update status daily during active dev

2. **Plan for File Movement**
   - Expect files to be archived
   - Use descriptive references ("See the current status document") vs specific paths
   - Schedule systematic update when reorganizing

3. **Update Guides Weekly**
   - Friday: Review all LLM guides
   - Check status claims, file paths, next steps
   - 15-minute investment prevents hours of confusion

4. **Namespace Sprint Numbers**
   - "Sprint 1: Core App Build" (explicit)
   - "Sprint 1: Physical Nexus" (explicit)
   - Never reuse bare numbers

5. **Version the Guides**
   - Add "Last Verified: YYYY-MM-DD" to every file
   - If >7 days old during active dev, assume stale
   - Prompt review when verification date is old

---

## Comparison to Replacement Docs

**Created:** 2025-11-11 (day after this snapshot)

**What Changed in New Versions:**
- ✅ Fixed all file path references
- ✅ Updated directory structure to match reality
- ✅ Implemented single source of truth for status
- ✅ Clarified Sprint 1 terminology (old vs new)
- ✅ Removed stale "next steps" claims
- ✅ Updated current reality (app deployed, not in planning)

**What Stayed the Same:**
- ✅ Core value proposition
- ✅ Technical constraints
- ✅ Common pitfalls
- ✅ Best practices and rules
- ✅ Tech stack information

**Lessons Applied:**
- Status references `CURRENT_STATUS.md` instead of duplicating
- File paths updated systematically
- Clear distinction between timeless guidance and current facts
- Added "Last Verified" dates

---

## When to Reference This Snapshot

**DO reference when:**
- Learning about LLM documentation patterns
- Understanding what guidance was needed during active development
- Extracting timeless sections for new projects
- Comparing documentation evolution

**DON'T reference when:**
- Looking for current project status (use current docs)
- Finding current file locations (paths are outdated)
- Onboarding new LLM to project (use current guides)

**Remember:** These are historical learning artifacts, not operational documentation.

---

**Snapshot Created:** 2025-11-11
**Archived By:** Mark
**Replaced By:** Updated LLM guides in `_08-llm-guides/` (2025-11-11)
**Primary Value:** Learning what works in LLM documentation at different project phases
