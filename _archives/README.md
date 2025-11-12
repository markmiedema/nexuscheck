# Project Archives

**Created:** 2025-11-11
**Purpose:** Preserve historical documents, completed work, and superseded files for learning and reference

---

## 📋 Archive Organization

This folder contains historical documents organized by category and date. Files are archived (not deleted) to preserve project evolution and learning opportunities.

---

## 📁 Folder Structure

### completion-reports/
**Purpose:** Milestone completion reports from core application development
**Date Range:** November 2025
**Contents:** Reports documenting major feature completions (core app, screen integrations)

**Files:**
- `CORE_APP_COMPLETE_2025-11-04.md` - Core application completion report (renamed from SPRINT_1_COMPLETE)
- `SCREEN_4_INTEGRATION_COMPLETE_2025-11-04.md` - Results dashboard completion

**When to Reference:** Understanding what was built in the core application phase

---

### development-logs/
**Purpose:** Session-by-session development notes, planning documents, and testing guides
**Date Range:** November 2025
**Contents:** Daily development progress, setup guides, sprint plans, manual testing documentation

**Files:**
- `DEVELOPMENT_NOTES_PHASE4_2025-11-04.md` - Detailed implementation notes from core app build
- `SPRINT_1_SETUP_GUIDE_2025-11-03.md` - Initial sprint setup instructions
- `SPRINT_PLAN_BETA_TO_PILOT_2025-11-07.md` - Beta to pilot transition plan
- `TESTING_CALCULATOR.md` - Manual testing procedures for nexus calculator (archived Nov 11, 2025)
- `PHASE_1A_TEST_GUIDE.md` - Phase 1A validation guide (archived Nov 11, 2025)

**When to Reference:** Understanding implementation details, development approach, and initial testing methodology

---

### historical-logs/
**Purpose:** Early project documentation updates and summaries
**Date Range:** November 2, 2025
**Contents:** Documentation reorganization logs

**Files:**
- `DOCUMENTATION-UPDATE-2025-11-02.md` - Documentation update record
- `DOCUMENTATION-UPDATE-SUMMARY.md` - Summary of documentation changes

**When to Reference:** Understanding early project organization decisions

---

### llm-guides-snapshots/
**Purpose:** Evolution of LLM onboarding and guidance documents
**Date Range:** November 3-10, 2025 (first snapshot)
**Contents:** Timestamped snapshots of LLM guidance documents with lessons learned

**Snapshots:**
- `2025-11-03-to-11-10-core-app-build/` - LLM guidance during core app development phase

**When to Reference:**
- Learning what LLM guidance works (and what becomes outdated quickly)
- Understanding project phase transitions
- Building better LLM collaboration patterns for future projects

**Special Value:** Meta-documentation showing how to collaborate effectively with LLMs

---

### phase-2a-database/
**Purpose:** Database implementation completion reports and summaries
**Date Range:** November 2025
**Contents:** Database deployment documentation, schema addendums

**Files:**
- `COMPLETE_DATABASE_DEPLOYMENT_SUMMARY.md` - Full database deployment record
- `DATABASE_IMPLEMENTATION_SUMMARY.md` - Implementation summary
- `state-rules-schema-ADDENDUM.md` - State rules schema additions

**When to Reference:** Understanding database structure evolution and deployment

---

### superseded-docs/
**Purpose:** Files replaced by newer versions
**Date Range:** November 2-3, 2025
**Contents:** Old versions of planning documents, specifications, and guides
**Organization:** Date-based subfolders (2025-11-02/, 2025-11-03/)

**Files Archived:**

**2025-11-02 (Gap Analysis Updates):**
- `decision-log-OLD.md` → Replaced by `_07-decisions/decision-log.md`
- `data-model-specification-OLD.md` → Replaced by `_04-technical-specs/data-model-specification.md`
- `workflow-phases_OLD.md` → Replaced by sprint planning in `docs/plans/`
- `CURRENT_STATUS_2025-11-05_OLD.md` → Replaced by `_05-development/CURRENT_STATUS_2025-11-05.md`

**2025-11-03 (Early Project Consolidation):**
- `DIRECTORY-GUIDE.md` → Replaced by `00-START-HERE.md`
- `FILE-INDEX.md` → Replaced by `00-START-HERE.md`
- `NEW-LLM-SESSION-TEMPLATE.md` → Replaced by `QUICK_START_FOR_NEW_SESSIONS.md`
- `user-flow-definition.md` → Replaced by screen specifications

**When to Reference:** Understanding how specifications and planning evolved

**Note:** Consolidated from two separate folders (`superseded/` and `superseded-2025-11-02/`) on Nov 11, 2025

---

### bug-fixes-nov-2025/
**Purpose:** Completed bug fix reports and task verification documentation
**Date Range:** November 2025
**Contents:** Bug fix reports, feature implementation reports, test suite documentation

**Files:**
- `TASK_2_VERIFICATION.md` - Tax rate division bug fix (100x calculation error)
- `TASK_5_IMPLEMENTATION_REPORT.md` - Interest/penalty calculation implementation
- `TEST_IMPLEMENTATION_REPORT.md` - Phase 1A/1B automated test suite completion

**When to Reference:** Understanding bug history, debugging regressions, learning from past issues

---

### data-operations-nov-2025/
**Purpose:** One-time data operation documentation from initial database setup
**Date Range:** November 2025
**Contents:** Data import procedures, quality fixes, sample data documentation

**Files:**
- `DATA_FIXES_LOG.md` - Data quality fixes applied to JSON source files
- `IMPORT_INSTRUCTIONS.md` - Research data import guide (⚠️ contains hardcoded credentials - historical reference only)
- `SAMPLE_DATA_SUMMARY.md` - Initial test data characteristics
- `SAMPLE_DATA_ACCURATE_SUMMARY.md` - Accurate test data with real state thresholds

**When to Reference:** Understanding initial data import process, data quality issues encountered

**⚠️ Security Note:** IMPORT_INSTRUCTIONS.md contains hardcoded service role key - archived for historical reference only, never use as-is

---

### technical-planning/
**Purpose:** Superseded technical planning documents
**Date Range:** November 2025
**Contents:** Screen specifications and UX planning documents

**Files:**
- `PHASE_2B_SCREEN_SPECIFICATIONS_PLANNING.md` - Original screen planning (superseded by implementation)

**When to Reference:** Comparing original plans vs actual implementation

---

## 🎯 Archive Principles

### We Archive (Not Delete) When:
1. **Superseded by better version** - New file provides same information more clearly
2. **Task completed** - One-time scripts, bug fix reports, temporary files
3. **Historical value** - Documents project evolution, lessons learned
4. **Prevents confusion** - Old terminology, outdated status claims

### We Do NOT Archive:
1. **Current active files** - Anything still used in daily work
2. **Duplicate content with no historical value** - Just delete duplicates
3. **Temporary debugging code** - Delete, don't archive
4. **Commented-out code** - Clean it up, don't archive

---

## 📖 How to Use This Archive

### For New LLMs/Developers:
1. **Start with current docs** - Read active documentation first
2. **Reference archives sparingly** - Only when you need historical context
3. **Check archive READMEs** - Each folder has a README explaining its contents
4. **Note "superseded by" references** - Always use the current version for active work

### For Understanding Evolution:
1. **Compare old vs new** - See how specifications changed during development
2. **Learn from lessons** - LLM guides snapshot shows what worked vs what didn't
3. **Extract patterns** - Identify reusable approaches and pitfalls to avoid

### For Debugging:
1. **Check if behavior changed** - Compare archived vs current versions
2. **Understand why replaced** - Archive READMEs document reasoning
3. **Verify logic preserved** - Ensure critical logic wasn't lost during updates

---

## 🔍 Finding Archived Content

### By Date:
- **Nov 2, 2025:** Database deployment, superseded planning docs
- **Nov 3, 2025:** Early superseded documents
- **Nov 4, 2025:** Core app completion, development notes
- **Nov 5-7, 2025:** Sprint planning, beta-to-pilot transition
- **Nov 3-10, 2025:** LLM guidance snapshot (core app build phase)
- **Nov 11, 2025:** Task reports, temporary files

### By Type:
- **Completion reports:** `completion-reports/`
- **Development logs:** `development-logs/`
- **Bug fixes:** `bug-fixes-nov-2025/`
- **Data operations:** `data-operations-nov-2025/`
- **LLM guidance:** `llm-guides-snapshots/`
- **Database docs:** `phase-2a-database/`
- **Superseded specs:** `superseded-docs/`
- **Planning docs:** `technical-planning/`

### By Purpose:
- **Learning:** LLM guides snapshots, development logs, bug fixes
- **Historical reference:** Completion reports, superseded docs, data operations
- **Debugging:** Development logs, bug fixes
- **Understanding changes:** Superseded docs with "why archived" explanations

---

## 🚨 Important Notes

### Archive Folder Naming Convention:
- **Descriptive folders:** `completion-reports/`, `development-logs/` (preferred)
- **Date-based folders:** `superseded-2025-11-02/`, `task-reports-2025-11/` (when multiple archives of same type)
- **Dated files:** `CORE_APP_COMPLETE_2025-11-04.md` (always include date in filename)

### Consolidation History:
✅ **November 11, 2025 - Phase 1:** Consolidated two "superseded" folders
- Merged `superseded/` (Nov 3) and `superseded-2025-11-02/` (Nov 2) into `superseded-docs/`
- Organized by date into subfolders: `2025-11-02/` and `2025-11-03/`
- Created comprehensive README documenting all superseded files

✅ **November 11, 2025 - Phase 2:** Reorganized task-reports catch-all folder
- Removed `task-reports-2025-11/` (was a catch-all with mixed file types)
- Created `bug-fixes-nov-2025/` for bug fix reports (3 files)
- Created `data-operations-nov-2025/` for data import docs (4 files)
- Moved test documentation to `development-logs/` (2 files)
- Deleted temporary files (commit scripts, batch files, validation logs)
- Result: Clearer categorization, better organization

### Adding New Archives:
1. **Choose appropriate folder** - Use existing category if possible
2. **Include date in filename** - Format: `DESCRIPTION_YYYY-MM-DD.md`
3. **Update folder README** - Add entry explaining what's archived and why
4. **Update this main README** - Add to relevant section if new category

---

## 📊 Archive Statistics

**Total Archive Folders:** 8 primary folders (10 including date-based subfolders)
**Total Archived Files:** 45 markdown files
**Date Range:** November 2-11, 2025
**Primary Archive Phase:** Core application development (Phase 4)

**Recent Changes (Nov 11, 2025):**
- Consolidated two "superseded" folders into `superseded-docs/`
- Created `bug-fixes-nov-2025/` for bug fix reports (3 files)
- Created `data-operations-nov-2025/` for data import documentation (4 files)
- Moved test documentation to `development-logs/` (2 files)
- Deleted temporary files (commit scripts, validation logs)

---

## 🔗 Related Documentation

- **Current Status:** `../_05-development/CURRENT_STATUS_2025-11-05.md`
- **Project Overview:** `../00-START-HERE.md`
- **Sprint Planning:** `../docs/plans/ROADMAP.md`
- **Development Guide:** `../_05-development/README_DEVELOPMENT.md`

---

**Last Updated:** 2025-11-11
**Maintained By:** Project team
**Review Frequency:** Monthly during active development, quarterly in maintenance
