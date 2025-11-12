# Superseded Documents Archive

**Created:** 2025-11-11 (consolidated from two separate folders)
**Purpose:** Preserve previous versions of documents that have been replaced by newer, improved versions

---

## Organization

This folder is organized by date of archival, with each subfolder containing documents that were superseded on that date.

```
superseded-docs/
├── 2025-11-02/    # Files superseded on November 2, 2025
└── 2025-11-03/    # Files superseded on November 3, 2025
```

---

## 2025-11-02: Definition Framework Gap Analysis Updates

**Context:** Major update to specifications during definition framework gap analysis

### decision-log-OLD.md
**Superseded by:** `_07-decisions/decision-log.md`

**What changed:**
- Added 5 major decisions from gap analysis:
  - User Account & Data Management
  - File Storage Strategy
  - Report Branding & Customization
  - Error Handling & Recovery Strategy
  - Pricing Model (Deferred)

**Why archived:** New version is more comprehensive with additional decisions

---

### data-model-specification-OLD.md
**Superseded by:** `_04-technical-specs/data-model-specification.md`

**What changed:**
- Added Section 7: User Account & Analysis Management Schema
- Added Section 8: Error Handling & Status Tracking
- Added Section 9: Retention Policy & Cleanup
- Complete database schema with all new tables

**Why archived:** New version includes user management and error handling schemas

---

### workflow-phases_OLD.md
**Superseded by:** `docs/plans/ROADMAP.md` and current sprint planning

**What changed:**
- Original planning document described proposed phases (Phase 1-4, Sprints 1-6)
- Claimed "Phase 1 in progress, all others not started"
- Reality: Phases 1-4 actually COMPLETE, app deployed and operational
- Superseded by actual execution and current Sprint 1 planning (Physical Nexus/VDA)

**Why archived:**
- Contradicted actual project status
- Original plan vs actual execution diverged significantly
- Historical value showing original development plan before execution

---

### CURRENT_STATUS_2025-11-05_OLD.md
**Superseded by:** `_05-development/CURRENT_STATUS_2025-11-05.md`

**What changed:**
- Duplicate file archived during project organization audit
- Used old "SALT Tax" branding (project rebranded to "Nexus Check")
- Outdated status information
- Primary version updated to Nov 11, 2025 with current status

**Why archived:** Duplicate with outdated branding and status

---

## 2025-11-03: Early Project Organization

**Context:** Early project structure consolidation and documentation improvements

### DIRECTORY-GUIDE.md
**Superseded by:** `00-START-HERE.md` → "Project Structure" section

**What changed:**
- Information merged into main entry document
- Better integration with overall project navigation

**Why archived:** Redundant with START-HERE, consolidation improves clarity

---

### FILE-INDEX.md
**Superseded by:** `00-START-HERE.md` → "Finding What You Need" section

**What changed:**
- Original indexed only 11 files
- Project now has 30+ files
- Functionality merged into better-organized START-HERE navigation

**Why archived:** Outdated file count, functionality absorbed by START-HERE

---

### NEW-LLM-SESSION-TEMPLATE.md
**Superseded by:** `_08-llm-guides/QUICK_START_FOR_NEW_SESSIONS.md`

**What changed:**
- Original template was Phase 2A-specific
- New version is more comprehensive
- Includes integration guide references
- Updated for current project phase

**Why archived:** Outdated context, less comprehensive than new version

---

### user-flow-definition.md
**Evolution:** Planning → Specifications → Implementation

**What changed:**
- Planning/definition document replaced by detailed specifications (also archived: `_archives/technical-planning/PHASE_2B_SCREEN_SPECIFICATIONS_PLANNING.md`)
- Detailed screen-by-screen specs replaced high-level flow
- Then actual implementation in production app replaced the specifications

**Why archived:** Planning document superseded by specs, which were then superseded by actual implementation

**Current implementation:** See production app in `frontend/` and `backend/` directories

---

## When to Reference These Files

### Good Reasons:
- **Understanding evolution** - Compare old vs new to see how specs changed
- **Debugging changes** - Check if behavior changed between versions
- **Learning history** - Understand decision-making process

### Bad Reasons:
- **Current development** - Always use the current version for active work
- **Implementation reference** - Use actual code or current specs
- **Status information** - These files contain outdated status claims

---

## Archive Principles

### Why We Keep Superseded Files:
1. **Historical reference** - Understanding how project evolved
2. **Decision tracking** - See what changed and why
3. **Debugging** - Compare versions if behavior changed
4. **Learning** - Extracting patterns and lessons learned

### Why We Don't Just Update in Place:
1. **Lose context** - Can't see what changed or why
2. **Lose history** - Evolution of thinking is valuable
3. **Lose lessons** - Mistakes and improvements documented in changes

---

## Adding New Superseded Files

When archiving superseded documents:

1. **Create dated subfolder** - Format: `YYYY-MM-DD/`
2. **Add "-OLD" suffix** - Makes supersession clear in filename
3. **Update this README** - Document what changed and why
4. **Note replacement location** - "Superseded by: [path]"
5. **Explain rationale** - Why was the new version better?

---

**Last Updated:** 2025-11-11
**Consolidation Date:** 2025-11-11 (merged `superseded/` and `superseded-2025-11-02/`)
