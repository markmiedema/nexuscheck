# LLM Guidance Documentation - Evolution Snapshots

**Created:** 2025-11-11
**Purpose:** Track how LLM onboarding and guidance evolves as the project progresses

This folder preserves snapshots of LLM guidance documents at different project phases to:
- Document what information LLMs needed at each phase
- Identify patterns in what changes vs what stays stable
- Build expertise in LLM-assisted software development
- Provide case study material for learning and future projects

---

## Why Archive LLM Guidance?

Unlike code or technical specs, **LLM guidance is meta-documentation** - it's documentation about how to use documentation. By preserving snapshots, we can:

1. **Learn what works** - Which guidance stayed useful? Which became outdated quickly?
2. **Identify patterns** - What do LLMs need during planning vs development vs enhancement?
3. **Build templates** - Extract reusable patterns for future projects
4. **Document evolution** - See how our approach to LLM collaboration matured
5. **Prevent repeated mistakes** - Learn from what didn't work

---

## Snapshots

### [2025-11-03 to 11-10: Core App Build Phase](./2025-11-03-to-11-10-core-app-build/)

**Project Phase:** Phase 4 (Development) - Building MVP core application
**Status:** Sprint 1 in progress → Sprint 1 complete (Screens 1-4, calculation engine)
**Key Characteristic:** Rapid transition from planning to active development to deployed application

**What LLMs Needed:**
- Database schema rules (schema was newly locked - Nov 2)
- Development environment setup guidance
- Screen-by-screen implementation specifications
- Integration patterns (frontend ↔ backend ↔ database)
- Clear current status (changing daily during active dev)

**What Became Outdated Quickly:**
- ❌ **Current status references** - Changed daily during active development
- ❌ **File path references** - Files archived as phases completed (Nov 11 reorganization)
- ❌ **"Next steps" guidance** - Shifted as sprints completed
- ❌ **Sprint terminology** - "Sprint 1" meant different things at different times

**What Stayed Stable:**
- ✅ Core value proposition and target users
- ✅ Technical constraints and design decisions
- ✅ Database schema rules (locked Nov 2)
- ✅ Common pitfalls and pro tips
- ✅ Tech stack and architecture

**Lessons Learned:**

1. **Single Source of Truth for Status**
   - **Problem:** Status duplicated across 4 files, became inconsistent
   - **Solution:** Status should live in ONE file (`CURRENT_STATUS.md`), be referenced elsewhere
   - **Pattern:** Centralize facts, distribute guidance

2. **File Path Brittleness**
   - **Problem:** Guides hardcoded file paths that changed during reorganization
   - **Solution:** Use relative paths, expect reorganization, update systematically
   - **Pattern:** Assume file locations will change, design for easy updates

3. **Sprint Terminology Confusion**
   - **Problem:** "Sprint 1" referred to different things (core app build vs Physical Nexus/VDA)
   - **Solution:** Use descriptive names ("Sprint 1: Core App" vs "Sprint 1: Physical Nexus")
   - **Pattern:** Avoid reusing numbered labels, be explicit

4. **Operational Docs Need Regular Updates**
   - **Problem:** Thought LLM guides were "set it and forget it"
   - **Reality:** Need updates every 7-10 days during active development
   - **Pattern:** Schedule regular doc reviews during active phases

5. **Most Content is Timeless**
   - **Finding:** 80-85% of content remained valid despite rapid development
   - **Insight:** Core guidance (how to work, common pitfalls) is stable
   - **Pattern:** Separate timeless guidance from time-sensitive facts

**Archive Trigger:**
- Major project reorganization (Nov 11, 2025)
- App deployed and operational
- Moving from "building core" to "enhancing with features"
- File path changes (many docs archived to `_archives/`)

**Replaced By:**
- Updated versions in `_08-llm-guides/` (Nov 11, 2025)
- Applied lessons learned from this snapshot
- Implemented single source of truth pattern
- Fixed all file paths and references

---

## How to Use These Snapshots

### For Learning:
1. **Compare snapshots** - See what changed between phases
2. **Extract patterns** - What's common across all snapshots?
3. **Build templates** - Reuse stable sections in future projects
4. **Document insights** - Add lessons learned to each snapshot README

### For Future Projects:
1. **Start with templates** - Use stable sections from previous snapshots
2. **Customize for phase** - Adapt based on project phase (planning, dev, maintenance)
3. **Plan for evolution** - Expect to update docs every 7-10 days during active dev
4. **Centralize facts** - Single source of truth for status, paths, current phase

### For This Project:
1. **Reference only when needed** - Current docs are in `_08-llm-guides/`
2. **Don't copy outdated content** - These are historical snapshots
3. **Learn from mistakes** - See what became outdated quickly, avoid repeating

---

## Snapshot Naming Convention

```
YYYY-MM-DD-to-MM-DD-[phase-description]/
```

**Examples:**
- `2025-11-03-to-11-10-core-app-build/` - Building MVP
- `2025-11-11-to-12-15-feature-enhancement/` - Adding Physical Nexus, VDA
- `2026-01-01-to-03-31-scaling-phase/` - Multi-tenant, performance optimization

---

## When to Create a New Snapshot

**Create snapshot when:**
- Major phase transitions (planning → development → enhancement → maintenance)
- Significant project reorganization
- Substantial file structure changes
- Every 4-6 weeks during active development
- When current docs feel substantially different from archived version

**Don't create snapshot for:**
- Minor typo fixes
- Small path updates
- Adding a single new section
- Clarifying existing content

**Rule of thumb:** If you're rewriting >50% of content, create a snapshot.

---

## Metadata to Capture in Each Snapshot

Each snapshot folder should include a README documenting:

1. **Context:**
   - Project phase
   - Date range
   - Key characteristics of this period

2. **What LLMs Needed:**
   - What information was critical at this phase?
   - What questions did LLMs ask most often?

3. **What Changed Quickly:**
   - Which sections became outdated fast?
   - What needed frequent updates?

4. **What Stayed Stable:**
   - Which sections remained useful?
   - What's reusable for future projects?

5. **Lessons Learned:**
   - What worked well?
   - What didn't work?
   - What would you do differently?

6. **Archive Trigger:**
   - Why was this snapshot created?
   - What changed to warrant preservation?

---

## Future Improvements

**Ideas for next snapshots:**
- Add metrics: How often were docs accessed? Which sections?
- Track specific LLM questions that docs didn't answer
- Compare doc length over time (growing complexity?)
- Measure time between updates (stability indicator)
- Document which docs were MOST useful at each phase

---

**Last Updated:** 2025-11-11
**Current Active Docs:** `_08-llm-guides/` (supersedes all archived versions)
