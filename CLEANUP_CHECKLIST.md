# Nexus Check - Project Cleanup Checklist

## Quick Summary
- **Project Health:** GOOD ✓
- **Total Size:** 3.7 MB (well-managed)
- **Files to Move:** 2-3 files
- **Files to Delete:** 0
- **Cleanup Time:** 30-60 minutes

---

## IMMEDIATE ACTION ITEMS

### 1. Move Root-Level Test File
**File:** `/home/user/nexuscheck/backend/test_column_detector.py` (127 lines)

**Action:** Move to `/home/user/nexuscheck/backend/tests/`
- This is a duplicate test file
- One already exists at `/home/user/nexuscheck/backend/tests/test_column_detector.py`
- Keep the one in tests/, remove root version

**Priority:** HIGH

---

### 2. Move Root-Level Migration Script
**File:** `/home/user/nexuscheck/backend/run_vda_migration.py` (86 lines)

**Action:** Move to `/home/user/nexuscheck/backend/scripts/`
- Consolidates migration scripts in one location
- Already has `import_state_nexus_rules.py` in scripts/
- Maintains clear organization

**Priority:** HIGH

---

## ARCHIVE REVIEW ITEMS

### 3. Consolidate LLM Guide Snapshots
**Location:** `/home/user/nexuscheck/_archives/llm-guides-snapshots/2025-11-03-to-11-10-core-app-build/`

**Contents:**
- `LLM-INSTRUCTIONS-2025-11-03.md`
- `LLM-ONBOARDING-WORKFLOW-2025-11-07.md`
- `PROJECT-SUMMARY-2025-11-10.md`
- `QUICK_START_FOR_NEW_SESSIONS-2025-11-10.md`

**Action:** Review if all versions needed or consolidate to latest
- Keep 2025-11-10 versions only?
- Delete earlier dated versions

**Priority:** MEDIUM

---

### 4. Review Old Documentation Archive
**Location:** `/home/user/nexuscheck/_archives/superseded-docs/2025-11-03/`

**Files:**
- `DIRECTORY-GUIDE.md`
- `FILE-INDEX.md`
- `NEW-LLM-SESSION-TEMPLATE.md`
- `user-flow-definition.md`

**Action:** Verify if still needed
- Consider if these belong in `/docs/` as active docs
- Or if they're truly superseded

**Priority:** MEDIUM

---

### 5. Check Test Data Duplicates
**Location:** `/home/user/nexuscheck/test-data/integration/`

**Potentially Duplicate Files:**
- `sample-sales-data.csv`
- `sample-sales-data-with-nexus.csv`
- `sample-sales-data-accurate.csv`

**Action:** 
- Document which is canonical
- Add comments to `/test-data/README.md`

**Priority:** LOW

---

## DOCUMENTATION ENHANCEMENTS

### 6. Add Architecture Documentation
**Create:** `/home/user/nexuscheck/docs/ARCHITECTURE.md`

**Include:**
- System diagram (frontend → backend → database)
- Component interactions
- Data flow overview
- API structure

**Priority:** LOW (Enhancement)

---

### 7. Update Root README
**File:** `/home/user/nexuscheck/README.md`

**Add:**
- Section explaining `/backend/_archived_code/` purpose
- Link to project cleanup summary
- Architecture overview

**Priority:** LOW (Enhancement)

---

## VERIFICATION CHECKLIST

### Before Cleanup
- [ ] Git status is clean
- [ ] All changes committed
- [ ] Create feature branch: `git checkout -b cleanup/organize-files`

### After Moving Files
- [ ] Update any imports in moved files
- [ ] Verify tests still run: `pytest` in backend/
- [ ] Check no broken references

### Final Steps
- [ ] Commit changes: `git commit -m "cleanup: organize root-level files into appropriate directories"`
- [ ] Push to feature branch
- [ ] Create PR for review

---

## FILES THAT ARE FINE (Don't Touch)

- ✓ `restart-backend.sh` & `restart-backend.ps1` - Quick access scripts, fine at root
- ✓ All `_0*-` directories - Project context, appropriate location
- ✓ `/backend/_archived_code/` - Properly archived with README
- ✓ All `.env.example` files - Different configs per layer, correct
- ✓ All `.gitignore` files - Different rules per layer, correct
- ✓ All migrations in `/backend/migrations/` - Well organized

---

## SUMMARY OF CHANGES

**Files to Move:** 2
- `backend/test_column_detector.py` → `backend/tests/` (remove from root)
- `backend/run_vda_migration.py` → `backend/scripts/`

**Directories to Review:** 2-3
- `_archives/llm-guides-snapshots/` (consolidate versions)
- `_archives/superseded-docs/2025-11-03/` (verify still needed)
- `test-data/integration/` (document canonical files)

**New Files to Create:** 1
- `docs/ARCHITECTURE.md` (system overview)

**Total Estimated Time:** 30-60 minutes
**Estimated Space Saved:** <5 KB (organization only, not size reduction)

---

**Generated:** 2025-11-16
**Status:** Ready for execution
