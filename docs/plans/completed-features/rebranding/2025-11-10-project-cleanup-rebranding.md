# Project Cleanup and Rebranding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete rebranding from "SALT Tax Tool" to "Nexus Check" across all user-facing files, documentation, and code.

**Architecture:** Systematic file-by-file updates organized in priority phases (user-facing → documentation → technical specs), with validation at each phase to ensure consistency.

**Tech Stack:** Next.js, FastAPI, Markdown documentation

---

## Phase 1: Critical User-Facing Files

### Task 1.1: Update README.md

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/README.md`

**Step 1: Read current README**

```bash
cat README.md | head -20
```

Expected: See "# SALT Tax Tool" and references throughout

**Step 2: Update title and overview section**

Replace lines 1-11:
```markdown
# Nexus Check

**Status:** Active Development
**Last Updated:** November 10, 2025

---

## 📋 Overview

Nexus Check is a web application that helps tax professionals analyze state sales tax nexus obligations for their clients. Upload transaction data, and the tool automatically determines which states require sales tax registration and calculates estimated tax liabilities.
```

**Step 3: Update metadata at bottom**

Replace lines 279-280:
```markdown
**Last Updated:** November 10, 2025
**Version:** 0.1.0 (MVP in progress)
```

**Step 4: Verify changes**

```bash
grep -n "SALT Tax Tool" README.md
```

Expected: No matches found

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: rebrand README from SALT Tax Tool to Nexus Check"
```

---

### Task 1.2: Update Frontend Layout Metadata

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/app/layout.tsx:9-12`

**Step 1: Read current metadata**

```bash
grep -A 2 "export const metadata" frontend/app/layout.tsx
```

Expected: See `title: 'SALT Tax Tool'`

**Step 2: Update metadata**

Replace lines 9-12:
```typescript
export const metadata: Metadata = {
  title: 'Nexus Check',
  description: 'Automated sales tax nexus determination and liability estimation',
}
```

**Step 3: Verify change**

```bash
grep "title:" frontend/app/layout.tsx
```

Expected: `title: 'Nexus Check',`

**Step 4: Commit**

```bash
git add frontend/app/layout.tsx
git commit -m "feat(frontend): update page title to Nexus Check"
```

---

### Task 1.3: Update Landing Page

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/app/page.tsx:5-7`

**Step 1: Read current landing page**

```bash
cat frontend/app/page.tsx
```

Expected: See "SALT Tax Tool" in h1 and description

**Step 2: Update branding**

Replace lines 5-7:
```typescript
        <h1 className="text-4xl font-bold mb-4">Nexus Check</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Automated sales tax nexus determination and liability estimation
        </p>
```

**Step 3: Verify changes**

```bash
grep -n "Nexus Check" frontend/app/page.tsx
```

Expected: Line 5 shows "Nexus Check"

**Step 4: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat(frontend): rebrand landing page to Nexus Check"
```

---

### Task 1.4: Fix Dashboard Mixed References

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/app/dashboard/page.tsx:48`

**Step 1: Find the mixed reference**

```bash
grep -n "SALT" frontend/app/dashboard/page.tsx
```

Expected: Line 48 shows "Start a new SALT nexus analysis"

**Step 2: Update description**

Replace line 48:
```typescript
                Start a new nexus analysis
```

**Step 3: Verify change**

```bash
grep -n "SALT" frontend/app/dashboard/page.tsx
```

Expected: No matches found

**Step 4: Commit**

```bash
git add frontend/app/dashboard/page.tsx
git commit -m "fix(frontend): remove remaining SALT reference from dashboard"
```

---

### Task 1.5: Update Frontend Package Name

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/package.json:2`

**Step 1: Read current package name**

```bash
grep '"name"' frontend/package.json
```

Expected: `"name": "salt-tax-tool-frontend",`

**Step 2: Update package name**

Replace line 2:
```json
  "name": "nexus-check-frontend",
```

**Step 3: Verify change**

```bash
grep '"name"' frontend/package.json
```

Expected: `"name": "nexus-check-frontend",`

**Step 4: Commit**

```bash
git add frontend/package.json
git commit -m "chore(frontend): rename package to nexus-check-frontend"
```

---

### Task 1.6: Update Backend API Metadata

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/backend/app/main.py:16-19`

**Step 1: Read current FastAPI metadata**

```bash
grep -A 4 "app = FastAPI" backend/app/main.py
```

Expected: See `title="SALT Tax Tool API"`

**Step 2: Update FastAPI app configuration**

Replace lines 16-21:
```python
app = FastAPI(
    title="Nexus Check API",
    version="1.0.0",
    description="API for automated sales tax nexus determination and liability estimation",
    debug=settings.DEBUG
)
```

**Step 3: Verify changes**

```bash
grep "title=" backend/app/main.py
```

Expected: `title="Nexus Check API",`

**Step 4: Commit**

```bash
git add backend/app/main.py
git commit -m "feat(backend): rebrand API to Nexus Check"
```

---

### Task 1.7: Update Login and Signup Pages

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/app/login/page.tsx`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/app/signup/page.tsx`

**Step 1: Check login page for branding**

```bash
grep -n "SALT Tax Tool" frontend/app/login/page.tsx
```

**Step 2: If found, update all instances to "Nexus Check"**

Use exact line replacements based on grep output

**Step 3: Check signup page for branding**

```bash
grep -n "SALT Tax Tool" frontend/app/signup/page.tsx
```

**Step 4: If found, update all instances to "Nexus Check"**

Use exact line replacements based on grep output

**Step 5: Commit if changes were made**

```bash
git add frontend/app/login/page.tsx frontend/app/signup/page.tsx
git commit -m "feat(frontend): rebrand auth pages to Nexus Check"
```

---

## Phase 2: Core Documentation

### Task 2.1: Update Main Entry Point (00-START-HERE.md)

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/00-START-HERE.md:1`

**Step 1: Read header**

```bash
head -10 00-START-HERE.md
```

Expected: See "# SALT Tax Tool - Project Documentation"

**Step 2: Update title**

Replace line 1:
```markdown
# Nexus Check - Project Documentation
```

**Step 3: Update last updated date**

Replace line 3:
```markdown
**Last Updated:** 2025-11-10
```

**Step 4: Update quick start section if needed**

Review lines 9-20 for any "SALT Tax Tool" references and update to "Nexus Check"

**Step 5: Verify changes**

```bash
grep -n "SALT Tax Tool" 00-START-HERE.md
```

Expected: No matches (or only historical context mentions)

**Step 6: Commit**

```bash
git add 00-START-HERE.md
git commit -m "docs: rebrand main entry point to Nexus Check"
```

---

### Task 2.2: Update LLM Project Summary

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_08-llm-guides/PROJECT-SUMMARY.md`

**Step 1: Check for SALT Tax Tool references**

```bash
grep -n "SALT Tax Tool" _08-llm-guides/PROJECT-SUMMARY.md
```

**Step 2: Update all references to Nexus Check**

Replace each instance found in Step 1 with "Nexus Check"

**Step 3: Update last modified date if present**

Add or update date at top of file:
```markdown
**Last Updated:** 2025-11-10
```

**Step 4: Verify changes**

```bash
grep -n "SALT Tax Tool" _08-llm-guides/PROJECT-SUMMARY.md
```

Expected: No matches

**Step 5: Commit**

```bash
git add _08-llm-guides/PROJECT-SUMMARY.md
git commit -m "docs(llm): rebrand project summary to Nexus Check"
```

---

### Task 2.3: Update LLM Quick Start Guide

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_08-llm-guides/QUICK_START_FOR_NEW_SESSIONS.md`

**Step 1: Check for SALT Tax Tool references**

```bash
grep -n "SALT Tax Tool" _08-llm-guides/QUICK_START_FOR_NEW_SESSIONS.md
```

**Step 2: Update all references to Nexus Check**

Replace each instance found in Step 1

**Step 3: Update date stamp**

```markdown
**Last Updated:** 2025-11-10
```

**Step 4: Verify changes**

```bash
grep -n "SALT Tax Tool" _08-llm-guides/QUICK_START_FOR_NEW_SESSIONS.md
```

Expected: No matches

**Step 5: Commit**

```bash
git add _08-llm-guides/QUICK_START_FOR_NEW_SESSIONS.md
git commit -m "docs(llm): rebrand quick start guide to Nexus Check"
```

---

### Task 2.4: Update Current Status Document

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_05-development/CURRENT_STATUS_2025-11-05.md`

**Step 1: Check for SALT Tax Tool references**

```bash
grep -n "SALT Tax Tool" _05-development/CURRENT_STATUS_2025-11-05.md
```

**Step 2: Update all references to Nexus Check**

Replace each instance found

**Step 3: Add update note at top**

```markdown
**Rebranding Update:** 2025-11-10 - Project rebranded from "SALT Tax Tool" to "Nexus Check"
```

**Step 4: Verify changes**

```bash
grep -n "SALT Tax Tool" _05-development/CURRENT_STATUS_2025-11-05.md
```

Expected: No matches (except possibly in historical context)

**Step 5: Commit**

```bash
git add _05-development/CURRENT_STATUS_2025-11-05.md
git commit -m "docs(dev): rebrand current status to Nexus Check"
```

---

## Phase 3: Implementation Plans and Design Docs

### Task 3.1: Update Recent Planning Documents

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docs/plans/2025-11-08-visual-polish-light-dark-modes.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docs/plans/2025-11-08-visual-polish-slate-gray-only.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docs/plans/2025-11-09-smart-column-mapping-implementation.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docs/plans/2025-11-09-streamlined-analysis-flow.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docs/plans/2025-11-08-segment-1-confirmation-dialog-container-widths.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docs/plans/2025-11-08-segment-2-dashboard-enhancements.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docs/plans/2025-11-08-segment-3-dark-mode-slate-theme.md`

**Step 1: Find all SALT Tax Tool references in docs/plans**

```bash
grep -l "SALT Tax Tool" docs/plans/*.md
```

**Step 2: For each file, replace "SALT Tax Tool" with "Nexus Check"**

Use sed or manual editing:
```bash
for file in $(grep -l "SALT Tax Tool" docs/plans/*.md); do
  sed -i 's/SALT Tax Tool/Nexus Check/g' "$file"
done
```

**Step 3: Verify changes**

```bash
grep -n "SALT Tax Tool" docs/plans/*.md
```

Expected: No matches in recent plans

**Step 4: Commit**

```bash
git add docs/plans/*.md
git commit -m "docs(plans): rebrand recent planning documents to Nexus Check"
```

---

### Task 3.2: Update Additional Planning Documents

**Files:**
- Modify files in `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docsplans/`

**Step 1: Find all SALT Tax Tool references**

```bash
grep -l "SALT Tax Tool" docsplans/*.md
```

**Step 2: Replace all references**

```bash
for file in $(grep -l "SALT Tax Tool" docsplans/*.md); do
  sed -i 's/SALT Tax Tool/Nexus Check/g' "$file"
done
```

**Step 3: Verify changes**

```bash
grep -n "SALT Tax Tool" docsplans/*.md
```

Expected: No matches

**Step 4: Commit**

```bash
git add docsplans/
git commit -m "docs(plans): rebrand docsplans to Nexus Check"
```

---

### Task 3.3: Update Frontend Component Documentation

**Files:**
- Check: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/components/layout/README.md`
- Check: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/lib/utils/README.md`
- Check: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/frontend/docs/THEMING.md`

**Step 1: Check for references**

```bash
grep -rn "SALT Tax Tool" frontend/components/
grep -rn "SALT Tax Tool" frontend/lib/
grep -rn "SALT Tax Tool" frontend/docs/
```

**Step 2: Update any found references to "Nexus Check"**

**Step 3: Commit if changes made**

```bash
git add frontend/components/ frontend/lib/ frontend/docs/
git commit -m "docs(frontend): rebrand component docs to Nexus Check"
```

---

## Phase 4: Technical Specifications

### Task 4.1: Update Technical Architecture Documents

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_04-technical-specs/PHASE_2B_SCREEN_SPECIFICATIONS.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_04-technical-specs/data-model-specification.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_04-technical-specs/state-rules-schema.md`

**Step 1: Find all references**

```bash
grep -l "SALT Tax Tool" _04-technical-specs/*.md
```

**Step 2: Update all references**

```bash
for file in $(grep -l "SALT Tax Tool" _04-technical-specs/*.md); do
  sed -i 's/SALT Tax Tool/Nexus Check/g' "$file"
done
```

**Step 3: Verify changes**

```bash
grep -n "SALT Tax Tool" _04-technical-specs/*.md
```

Expected: No matches

**Step 4: Commit**

```bash
git add _04-technical-specs/
git commit -m "docs(specs): rebrand technical specifications to Nexus Check"
```

---

### Task 4.2: Update Planning Documents

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_03-planning/workflow-phases.md`

**Step 1: Check for references**

```bash
grep -rn "SALT Tax Tool" _03-planning/
```

**Step 2: Update any found references**

**Step 3: Commit if changes made**

```bash
git add _03-planning/
git commit -m "docs(planning): rebrand planning docs to Nexus Check"
```

---

### Task 4.3: Update Development Documentation

**Files:**
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_05-development/README_DEVELOPMENT.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_05-development/SPRINT_PLAN_BETA_TO_PILOT.md`
- Modify: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/_05-development/SPRINT_1_SETUP_GUIDE.md`

**Step 1: Find all references**

```bash
grep -l "SALT Tax Tool" _05-development/*.md
```

**Step 2: Update all references**

```bash
for file in $(grep -l "SALT Tax Tool" _05-development/*.md); do
  sed -i 's/SALT Tax Tool/Nexus Check/g' "$file"
done
```

**Step 3: Verify changes**

```bash
grep -n "SALT Tax Tool" _05-development/*.md
```

Expected: No matches (except CURRENT_STATUS which was already updated)

**Step 4: Commit**

```bash
git add _05-development/
git commit -m "docs(dev): rebrand development docs to Nexus Check"
```

---

## Phase 5: Validation and Testing

### Task 5.1: Final Reference Search

**Files:**
- All project files

**Step 1: Comprehensive search for remaining references**

```bash
grep -r "SALT Tax Tool" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=_archives --exclude-dir=migrations --exclude="*.lock"
```

**Step 2: Review each result**

Determine if it needs updating or is intentionally historical (archives, migrations)

**Step 3: Update any missed files**

**Step 4: Commit any final changes**

```bash
git add .
git commit -m "docs: fix remaining SALT Tax Tool references"
```

---

### Task 5.2: Test Frontend Build

**Files:**
- None (validation step)

**Step 1: Run type checking**

```bash
cd frontend
npm run type-check
```

Expected: No errors

**Step 2: Run development build**

```bash
npm run dev
```

Expected: Server starts successfully on port 3000

**Step 3: Check browser title**

Open http://localhost:3000 and verify:
- Browser tab shows "Nexus Check"
- Landing page shows "Nexus Check"
- No console errors

**Step 4: Stop dev server**

Press Ctrl+C

**Step 5: Document validation**

```bash
echo "✅ Frontend build validated - all branding updated" >> validation.log
git add validation.log
git commit -m "test: validate frontend build after rebranding"
```

---

### Task 5.3: Test Backend API Docs

**Files:**
- None (validation step)

**Step 1: Start backend server**

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

Expected: Server starts on port 8000

**Step 2: Check API docs page**

Open http://localhost:8000/docs

Verify:
- Title shows "Nexus Check API"
- Description mentions "nexus determination"
- No "SALT Tax Tool" references

**Step 3: Check OpenAPI schema**

```bash
curl http://localhost:8000/openapi.json | grep -i "title"
```

Expected: Shows "Nexus Check API"

**Step 4: Stop backend server**

Press Ctrl+C

**Step 5: Document validation**

```bash
echo "✅ Backend API validated - all branding updated" >> validation.log
git add validation.log
git commit -m "test: validate backend API after rebranding"
```

---

### Task 5.4: Create Final Summary

**Files:**
- Create: `/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/docs/plans/2025-11-10-rebranding-complete-summary.md`

**Step 1: Create summary document**

```markdown
# Rebranding Complete: SALT Tax Tool → Nexus Check

**Date:** 2025-11-10

## Summary

Successfully rebranded entire project from "SALT Tax Tool" to "Nexus Check" across all files.

## Files Updated

### Phase 1: User-Facing (7 files)
- README.md
- frontend/app/layout.tsx
- frontend/app/page.tsx
- frontend/app/dashboard/page.tsx
- frontend/package.json
- backend/app/main.py
- frontend/app/login/page.tsx, signup/page.tsx

### Phase 2: Core Documentation (4 files)
- 00-START-HERE.md
- _08-llm-guides/PROJECT-SUMMARY.md
- _08-llm-guides/QUICK_START_FOR_NEW_SESSIONS.md
- _05-development/CURRENT_STATUS_2025-11-05.md

### Phase 3: Planning Documents (~20 files)
- docs/plans/*.md
- docsplans/*.md
- frontend/components/*/README.md
- frontend/docs/THEMING.md

### Phase 4: Technical Specs (~8 files)
- _04-technical-specs/*.md
- _03-planning/*.md
- _05-development/*.md

### Phase 5: Validation
- ✅ Frontend build tested
- ✅ Backend API docs verified
- ✅ No remaining references found

## Unchanged Files (Intentional)

- **_archives/*** - Historical documentation preserved
- **migrations/*** - Database migrations are historical records
- **_01-project-overview/vision.md** - Brand-agnostic vision document

## Testing Results

- Frontend type check: PASS
- Frontend dev build: PASS
- Backend API docs: PASS
- Browser title: "Nexus Check" ✅
- API title: "Nexus Check API" ✅

## Total Commits

~15 commits organized by phase and component

## Next Steps

- Consider renaming project directory: `SALT-Tax-Tool-Clean` → `Nexus-Check`
- Update any remote repository names if applicable
- Update deployment configurations if using old name
```

**Step 2: Save and commit**

```bash
git add docs/plans/2025-11-10-rebranding-complete-summary.md
git commit -m "docs: add rebranding completion summary"
```

---

## Completion Checklist

- [ ] Phase 1: All user-facing files updated (6-7 files)
- [ ] Phase 2: Core documentation updated (4 files)
- [ ] Phase 3: Planning documents updated (~20 files)
- [ ] Phase 4: Technical specifications updated (~8 files)
- [ ] Phase 5: Validation complete
  - [ ] No remaining "SALT Tax Tool" references (except archives/migrations)
  - [ ] Frontend builds successfully
  - [ ] Backend API docs show new branding
  - [ ] Browser title correct
- [ ] Final summary document created
- [ ] All changes committed with clear messages

---

## Notes for Engineer

**Important Patterns:**

1. **Preserve History:** Don't touch `_archives/` or `migrations/` - these are historical records
2. **Use sed carefully:** The sed commands use `-i` (in-place). On macOS, use `sed -i ''` instead
3. **Commit frequency:** Commit after each phase for easy rollback
4. **Testing:** Both frontend and backend must build cleanly after changes
5. **Brand consistency:** "Nexus Check" (two words, title case) everywhere

**Common Issues:**

- **package-lock.json:** Will auto-update when package.json changes - don't manually edit
- **Git conflicts:** If working across branches, rebase carefully
- **Case sensitivity:** "SALT Tax Tool" vs "Salt Tax Tool" - search for both if issues arise

**DRY Principle:**
- Used sed loops for bulk updates across similar files
- Grouped related documentation updates together

**YAGNI Principle:**
- Not renaming directory (requires extensive path updates)
- Not updating package-lock.json manually (auto-generated)
- Not touching historical archives

**Testing Strategy:**
- Type checking catches TypeScript issues
- Dev server validates runtime behavior
- API docs verify backend changes
- Browser check confirms user-facing correctness
