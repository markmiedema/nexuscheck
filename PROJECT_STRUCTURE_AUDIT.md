# Nexus Check - Comprehensive Project Structure Analysis
**Date:** 2025-11-16  
**Analysis Type:** Complete Directory Structure & Code Organization Audit

---

## Executive Summary

The **nexuscheck** project is a mature SALT (State and Local Tax) automation tool with a well-organized structure. The project consists of:
- **Frontend:** Next.js application (67 TypeScript/TSX files)
- **Backend:** FastAPI Python application (39 Python files)
- **Documentation:** Extensive (97 markdown files)
- **Archives:** Significant historical and one-time scripts (558 KB, 61 files)
- **Test Data:** Multiple CSV datasets for testing (11 files)

**Key Stats:**
- Total markdown files: 38 across the project
- Total test files: 30+ (backend tests + test data)
- Total configuration files: 10 key config files
- Disk usage: ~3.7 MB total (2.1 MB docs, 943 KB frontend, 694 KB backend, 558 KB archives)

---

## 1. ROOT DIRECTORY STRUCTURE

### Root-Level Files (13 files + directories)

**Documentation:**
- `00-START-HERE.md` - Entry point for all users/LLMs
- `README.md` - Project overview
- `CHANGELOG-2025-11-12.md` - Recent changes log
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `PHYSICAL_NEXUS_SETUP.md` - Physical nexus feature setup

**Scripts:**
- `restart-backend.sh` - Backend restart script (shell)
- `restart-backend.ps1` - Backend restart script (PowerShell)

**Directories:**
- `.claude/` - Claude AI configuration
- `.git/` - Git repository
- `frontend/` - Next.js frontend application
- `backend/` - FastAPI backend application
- `docs/` - Main documentation folder (2.1 MB)
- `_archives/` - Historical files and one-time scripts (558 KB)
- `test-data/` - Test datasets and integration test data
- Plus 8 numbered planning/development directories

### Configuration Files in Root

| File | Type | Purpose |
|------|------|---------|
| `.gitignore` | Git | Prevents committing sensitive files |
| `.claude/settings.local.json` | JSON | Claude Code configuration |
| `.claude/commands/audit-files.md` | Markdown | Custom Claude command |

---

## 2. FRONTEND STRUCTURE (`/frontend` - 943 KB)

### Directory Layout
```
frontend/
├── app/                          # Next.js App Router
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   ├── dashboard/                # Main dashboard
│   ├── analyses/                 # Analysis list
│   └── analysis/                 # Analysis detail pages
│       ├── [id]/                 # Dynamic analysis ID
│       │   ├── states/           # State-by-state view
│       │   │   └── [stateCode]/
│       │   ├── results/          # Results display
│       │   └── mapping/          # Column mapping
│       └── new/                  # New analysis creation
├── components/                   # React Components (43 files)
│   ├── ui/                       # Shadcn UI components
│   ├── layout/                   # Header, nav, breadcrumbs
│   ├── analysis/                 # Analysis-specific components
│   ├── dashboard/                # Dashboard components
│   ├── analyses/                 # Analysis list components
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   ├── error-boundary.tsx
│   └── ProtectedRoute.tsx
├── lib/                          # Utilities & API
│   ├── api/                      # API client functions
│   ├── stores/                   # Zustand state stores
│   ├── supabase/                 # Supabase client setup
│   └── utils/                    # Helper utilities
├── hooks/                        # React Hooks
├── types/                        # TypeScript type definitions
├── public/                       # Static assets
│   └── templates/                # CSV test templates (11 CSV files)
├── docs/                         # Frontend documentation
│   ├── COLOR_OPTIMIZATION_ANALYSIS.md
│   ├── SLATE_GRAY_OPTIMIZATION.md
│   └── THEMING.md
├── Configuration Files:
│   ├── package.json              # Dependencies
│   ├── package-lock.json         # Locked versions (292 KB)
│   ├── tsconfig.json             # TypeScript config
│   ├── next.config.js            # Next.js config
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── postcss.config.js          # PostCSS config
│   ├── components.json           # Shadcn UI config
│   ├── vercel.json               # Vercel deployment config
│   ├── .env.example              # Environment template
│   ├── .gitignore                # Git ignore rules
│   ├── .vercelignore             # Vercel ignore rules
│   ├── README.md                 # Frontend README
│   └── VERCEL_DEPLOYMENT.md      # Vercel deployment guide
```

### Frontend Statistics
- **TypeScript/TSX Files:** 67
- **React Components:** 43 files
  - UI Library Components: 18 (buttons, cards, dialogs, tables, etc.)
  - Page Components: 7 (analysis pages)
  - Analysis Components: 9 (ComplianceSection, VDAModePanel, etc.)
  - Layout Components: 3 (AppLayout, AppNav, Breadcrumbs)
  - Other: 6 (theme, error-boundary, protected-route)
- **Dependencies:** ~40 npm packages
- **Key Libraries:** Next.js 15, React 19, Tailwind CSS, Shadcn UI, Zustand, Supabase, React Hook Form

---

## 3. BACKEND STRUCTURE (`/backend` - 694 KB)

### Directory Layout
```
backend/
├── app/                          # Main application
│   ├── main.py                   # FastAPI entry point
│   ├── config.py                 # Configuration
│   ├── schemas/                  # Pydantic models
│   │   ├── physical_nexus.py      # Physical nexus schemas
│   │   ├── analysis.py           # Analysis schemas
│   │   ├── responses.py          # Response schemas
│   │   └── __init__.py
│   ├── api/
│   │   └── v1/                   # API v1 endpoints
│   │       ├── analyses.py       # Analysis endpoints
│   │       ├── vda.py            # VDA calculator endpoints
│   │       ├── physical_nexus.py  # Physical nexus endpoints
│   │       └── __init__.py
│   ├── services/                 # Business logic (6 files)
│   │   ├── nexus_calculator_v2.py        # Core nexus calculation
│   │   ├── column_detector.py            # CSV column detection
│   │   ├── simple_interest_calculator.py # Interest calculation
│   │   ├── interest_calculator.py        # Advanced interest calc
│   │   └── vda_calculator.py             # VDA mode calculation
│   └── core/                     # Core utilities
│       ├── supabase.py           # Supabase client
│       ├── auth.py               # Authentication
│       └── __init__.py
├── migrations/                   # Database migrations (23+ SQL files)
│   ├── 001_initial_schema.sql
│   ├── 005_populate_state_data.sql
│   ├── 013_update_physical_nexus_schema.sql
│   ├── 018_add_exempt_sales_support.sql
│   └── ... (20+ more)
├── tests/                        # Test suite (14 files)
│   ├── test_analyses_api.py
│   ├── test_nexus_calculator_v2_phase1a.py
│   ├── test_api_contracts.py
│   ├── manual/                   # Manual test scripts
│   │   ├── test_endpoint_syntax.py
│   │   ├── test_calculation.py
│   │   └── README.md
│   └── __init__.py
├── scripts/                      # Utility scripts
│   ├── import_state_nexus_rules.py
│   └── README.md
├── _archived_code/               # Old code (3 files)
│   ├── nexus_calculator_v1_2025-11-04.py (416 lines)
│   ├── test_nexus_calculator_v1_2025-11-04.py (118 lines)
│   └── README.md
├── Configuration Files:
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment template
│   ├── .python-version           # Python version spec
│   ├── .gitignore                # Git ignore rules
│   ├── .dockerignore             # Docker ignore rules
│   ├── Procfile                  # Heroku/Railway deployment
│   ├── railway.json              # Railway deployment config
│   ├── README.md                 # Backend README
│   └── RAILWAY_DEPLOYMENT.md     # Railway deployment guide
├── Standalone Files in Root:
│   ├── run_vda_migration.py      # One-off migration script
│   ├── test_column_detector.py   # One-off test script
```

### Backend Statistics
- **Python Files:** 39 total
  - App code: 20 files (schemas, API, services, core)
  - Tests: 14 files
  - Scripts: 3 files
  - Archived: 2 files
- **Database Migrations:** 23+ SQL files tracking schema evolution
- **Python Version:** 3.13+ (per .python-version)
- **Key Libraries:** FastAPI 0.115.6, Supabase 2.9.1, Pandas 2.2.3, Pydantic 2.10.3, PyTest 8.3.4

### Backend Services (Core Business Logic)
1. `nexus_calculator_v2.py` - Economic nexus calculation engine
2. `vda_calculator.py` - Voluntary Disclosure Agreement calculator
3. `interest_calculator.py` & `simple_interest_calculator.py` - Tax interest & penalty calculation
4. `column_detector.py` - Intelligent CSV column mapping

---

## 4. DOCUMENTATION STRUCTURE (`/docs` - 2.1 MB)

### Main Documentation Directories
```
docs/
├── plans/                        # Feature planning & roadmap
│   ├── ROADMAP.md                # Overall roadmap
│   ├── SPRINT_1_SUMMARY.md
│   ├── sprint-1/                 # Sprint 1 specific
│   │   ├── 00-overview.md
│   │   ├── 01-physical-nexus.md
│   │   ├── 02-vda-mode.md
│   │   ├── 03-column-detection-exempt-sales.md
│   │   ├── DAY-1-COMPLETE.md through DAY-7-COMPLETE.md
│   │   └── (+ 12 more files)
│   ├── sprint-2/ through sprint-5/  # Future sprints
│   ├── completed-features/        # Documentation of finished work
│   │   ├── analysis-management/
│   │   ├── auto-detect-date-range/
│   │   ├── bug-fixes/
│   │   ├── phase-1a/
│   │   ├── phase-summaries/
│   │   ├── rebranding/
│   │   ├── screen-5-state-details/
│   │   ├── smart-column-mapping/
│   │   ├── streamlined-flow/
│   │   ├── testing/
│   │   ├── toast-error-handling/
│   │   ├── ui-navigation/
│   │   └── visual-polish/
│   └── 2025-01-14-*.md (various planning docs)
├── refactor-audit/               # Code quality audit
│   ├── 00-high-level-overview.md
│   ├── 01-nexus-calculation/
│   ├── 02-api-contracts/
│   ├── 03-data-models/
│   ├── 04-frontend-backend-sync/
│   ├── 05-type-system/
│   ├── 99-refactor-roadmap/
│   ├── AUDIT-COMPLETE-SUMMARY.md
│   ├── IMPLEMENTATION-GUIDE-NEXUS-ACCURACY.md
│   └── RESEARCH-TODO.md
├── testing/                      # QA & Testing
│   ├── MANUAL_TESTING_GUIDE.md
│   ├── smart-column-mapping-test-plan.md
│   └── analysis-management-checklist.md
├── reference/                    # Research & reference docs
│   ├── DEEP_RESEARCH_PROMPTS.md
│   └── INTEREST_PENALTY_RATE_RESEARCH_TEMPLATE.md
├── DEPLOYMENT_ENV_VARS.md
├── PHASE_1A_QUICK_START.md
├── SCHEMA-SYNC-GUIDE.md
├── SECURITY_AUDIT.md
├── SESSION_SUMMARY.md
├── SUPABASE_PRODUCTION_CHECKLIST.md
└── TESTING_GUIDE.md
```

### Documentation Statistics
- **Total Markdown Files in /docs:** 97
- **Largest Subdirectories:**
  - plans/: 50+ files
  - refactor-audit/: 10+ files
  - testing/: 3 files
  - reference/: 2 files
- **Documentation Focus:** Feature planning, sprint tracking, testing guides, security & deployment

---

## 5. PLANNING & DEVELOPMENT DIRECTORIES (Root-Level)

### Numbered Planning Folders
```
├── _01-project-overview/         (1 file: vision.md)
├── _02-requirements/             (2 files: mvp-scope.md, target-users.md)
├── _03-planning/                 (6 files: task-breakdown, priority-tiers, planning assessments)
├── _04-technical-specs/          (5 files: data-model, state-rules-schema, architecture)
├── _05-development/              (11 files: status, changelogs, development guides)
├── _07-decisions/                (2 files: decision-log.md, SECURITY_NOTES.md)
└── _08-llm-guides/               (4 files: onboarding, instructions, quick-start guides)
```

**Purpose:** These serve as project context and planning documents for LLM sessions and new developers.

---

## 6. ARCHIVES STRUCTURE (`/_archives` - 558 KB)

### Archive Subdirectories
```
_archives/
├── superseded-docs/              (120 KB)
│   ├── 2025-11-02/               (Old docs from Nov 2)
│   │   ├── decision-log-OLD.md
│   │   ├── data-model-specification-OLD.md
│   │   ├── CURRENT_STATUS_2025-11-05_OLD.md
│   │   └── workflow-phases_OLD.md
│   └── 2025-11-03/               (Old docs from Nov 3)
│       ├── DIRECTORY-GUIDE.md
│       ├── FILE-INDEX.md
│       ├── NEW-LLM-SESSION-TEMPLATE.md
│       └── user-flow-definition.md
├── bug-fixes-nov-2025/           (24 KB)
│   ├── README.md
│   ├── TASK_2_VERIFICATION.md
│   └── TASK_5_IMPLEMENTATION_REPORT.md
├── phase-2a-database/            (54 KB)
│   ├── COMPLETE_DATABASE_DEPLOYMENT_SUMMARY.md
│   ├── DATABASE_IMPLEMENTATION_SUMMARY.md
│   └── state-rules-schema-ADDENDUM.md
├── completion-reports/           (30 KB)
│   ├── CORE_APP_COMPLETE_2025-11-04.md
│   └── SCREEN_4_INTEGRATION_COMPLETE_2025-11-04.md
├── development-logs/             (83 KB)
│   ├── DEVELOPMENT_NOTES_PHASE4_2025-11-04.md
│   ├── PHASE_1A_TEST_GUIDE.md
│   ├── SPRINT_1_SETUP_GUIDE_2025-11-03.md
│   └── (4 more files)
├── historical-logs/              (25 KB)
│   ├── DOCUMENTATION-UPDATE-2025-11-02.md
│   └── DOCUMENTATION-UPDATE-SUMMARY.md
├── technical-planning/           (51 KB)
│   └── PHASE_2B_SCREEN_SPECIFICATIONS_PLANNING.md
├── llm-guides-snapshots/         (74 KB)
│   └── 2025-11-03-to-11-10-core-app-build/
│       ├── LLM-INSTRUCTIONS-2025-11-03.md
│       ├── LLM-ONBOARDING-WORKFLOW-2025-11-07.md
│       └── (2 more files)
├── data-operations-nov-2025/     (33 KB)
│   ├── DATA_FIXES_LOG.md
│   ├── IMPORT_INSTRUCTIONS.md
│   └── (2 more files)
└── one-time-scripts/             (47 KB)
    ├── batch/                    (Windows batch files)
    │   ├── run_mf_test.bat
    │   ├── run_test.bat
    │   └── run_pytest.bat
    └── python/                   (One-off Python utilities)
        ├── import_research_data.py
        ├── test_fix.py
        ├── create_storage_bucket.py
        ├── (5 more files)
```

**Total Archive Files:** 61
**Archive Categories:**
- Superseded documentation: 8 files
- Implementation reports: 7 files
- Development logs: 7 files
- One-time scripts: 14 files (9 Python, 5 batch)
- Phase-specific docs: 20+ files

---

## 7. TEST DATA (`/test-data` - 81 KB)

### Test Data Files
```
test-data/
├── integration/                  # Integration test data
│   ├── phase_1a_test_data.csv
│   ├── test_data_phase2.csv
│   ├── test-nexus-threshold-data.csv
│   ├── sample-sales-data.csv
│   ├── sample-sales-data-with-nexus.csv
│   ├── sample-sales-data-accurate.csv
│   └── TEST_DATA_PHASE2_GUIDE.md
├── manual-testing/               # Manual testing datasets
│   ├── test-exact-match.csv
│   ├── test-common-variants.csv
│   ├── test-mixed-variants.csv
│   ├── test-no-match.csv
│   └── test-partial-match.csv
├── config/                       # Configuration
└── README.md
```

**Purpose:** Sample datasets for testing nexus calculations, VDA modes, and exempt sales logic.

---

## 8. CONFIGURATION FILES SUMMARY

### Root Configuration
| File | Location | Purpose |
|------|----------|---------|
| `.env.example` | Frontend & Backend | Environment variable template |
| `.gitignore` | Root, Frontend, Backend | VCS ignore rules |
| `tsconfig.json` | Frontend | TypeScript configuration |
| `package.json` | Frontend | Node dependencies & scripts |
| `package-lock.json` | Frontend | Locked npm versions (292 KB) |
| `requirements.txt` | Backend | Python dependencies |
| `.python-version` | Backend | Python version spec (3.13+) |
| `next.config.js` | Frontend | Next.js configuration |
| `tailwind.config.js` | Frontend | Tailwind CSS config |
| `postcss.config.js` | Frontend | PostCSS configuration |

### Deployment Configurations
| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment config |
| `railway.json` | Railway deployment config |
| `Procfile` | Heroku/Railway process definition |
| `.vercelignore` | Vercel build ignore |
| `.dockerignore` | Docker build ignore |

---

## 9. IDENTIFIED DUPLICATE/REDUNDANT FILES

### Expected Duplicates (Appropriate)
1. **.env.example** - Frontend & Backend (correct, separate configs)
2. **.gitignore** - Root, Frontend, Backend (correct, different rules per layer)
3. **README.md** - 38 instances across project (correct, documentation at each level)
4. **DEPLOYMENT_GUIDE.md** - Root & Backend (root is general, backend is specific)
5. **test_column_detector.py** - Backend root AND in tests/ (questionable - see below)

### Potential Redundancy Issues

| File | Locations | Status | Notes |
|------|-----------|--------|-------|
| `test_column_detector.py` | `/backend/` and `/backend/tests/` | ⚠️ Likely Duplicate | Root version (127 lines) vs tests version - should consolidate |
| `DEPLOYMENT_GUIDE.md` | Root and Backend | ✓ OK | Root is general, backend is specific (different content) |
| Archived calculator v1 | `/backend/_archived_code/` | ✓ OK | v1 is archived, v2 is active in production |

### Archived Code Assessment
- `nexus_calculator_v1_2025-11-04.py` (416 lines) - **OLD VERSION** - superseded by v2
- `test_nexus_calculator_v1_2025-11-04.py` (118 lines) - **OLD TESTS** - for v1
- All properly archived with README explaining purpose

---

## 10. OLD/DEPRECATED FILES BY NAMING PATTERN

### Files Marked as OLD/Deprecated
```
_archives/superseded-docs/2025-11-02/
├── decision-log-OLD.md
├── data-model-specification-OLD.md
├── CURRENT_STATUS_2025-11-05_OLD.md
└── workflow-phases_OLD.md

_archives/superseded-docs/2025-11-03/
└── Various superseded docs

backend/_archived_code/
├── nexus_calculator_v1_2025-11-04.py
└── test_nexus_calculator_v1_2025-11-04.py

backend/migrations/
└── 018_add_exempt_sales_support_ROLLBACK.sql (rollback migration)
```

### Version-Dated Files (Historical)
- `CHANGELOG-2025-11-12.md` - Dated changelog
- Multiple `2025-11-*` dated files in planning/development directories
- Archive snapshots: `2025-11-03-to-11-10-core-app-build/`

**Assessment:** All old files are appropriately archived in `_archives/` directory. Active codebase is clean.

---

## 11. BUILD & CACHE DIRECTORIES

### Status Check: Node/Python Cache Directories
- **node_modules/** - NOT present in repo (correctly ignored)
- **__pycache__/** - NOT present in repo (correctly ignored)
- **dist/** - NOT present in repo (correctly ignored)
- **.next/** - NOT present in repo (correctly ignored)
- **.vercel/** - NOT present in repo (correctly ignored)

**Assessment:** ✓ All cache/build directories properly excluded from version control.

---

## 12. CRITICAL FILES ANALYSIS

### Largest Files
| File | Size | Purpose |
|------|------|---------|
| `frontend/package-lock.json` | 292 KB | Locked npm dependencies |
| `CHANGELOG-2025-11-12.md` | 12.2 KB | Change history |
| `DEPLOYMENT_GUIDE.md` | 25.9 KB | Deployment procedures |
| `_05-development/CURRENT_STATUS_2025-11-05.md` | 50 KB+ | Status documentation |

### Most Important Files
1. **00-START-HERE.md** - LLM/developer entry point
2. **backend/app/services/nexus_calculator_v2.py** - Core business logic
3. **backend/migrations/\*** - Database schema (23+ files)
4. **frontend/app/** - Next.js app structure
5. **_05-development/CURRENT_STATUS_2025-11-05.md** - Project status

---

## 13. UNUSUAL OR OUT-OF-PLACE FILES

### Items of Note
1. ✓ `restart-backend.sh` & `restart-backend.ps1` - Root level restart scripts (acceptable for quick access)
2. ✓ `run_vda_migration.py` - Root-level migration helper (one-off utility, could be moved to scripts/)
3. ✓ `test_column_detector.py` - Root-level test file (should move to tests/)
4. ⚠️ Multiple dated snapshots in `_archives/llm-guides-snapshots/` - Could be consolidated

**Recommendation:** Consider moving `run_vda_migration.py` and `test_column_detector.py` from root to `backend/scripts/` or `backend/tests/`.

---

## 14. PROJECT METRICS & STATISTICS

### Code Volume
```
Frontend TypeScript/TSX:        67 files
Backend Python:                 39 files
Configuration Files:            15 files
Documentation:                  97 markdown files (mostly in /docs)
Test Files:                      14 Python test files
Test Data:                       11 CSV files
Total Archive Files:            61 files
```

### Disk Usage Breakdown
```
Documentation (/docs):          2.1 MB  (57%)
Frontend:                       943 KB  (25%)
Backend:                        694 KB  (18%)
Archives:                       558 KB  (15%)
Test Data:                       81 KB   (2%)
Planning directories:           200 KB   (5%)
Total:                         ~3.7 MB
```

### Development Status
- ✓ Core application complete
- ✓ Database schema mature (23+ migrations)
- ✓ Sprint 1 features documented
- ✓ Comprehensive test coverage
- ✓ Well-documented codebase

---

## 15. CLEANUP OPPORTUNITIES & RECOMMENDATIONS

### Priority 1 (High) - Code Organization
1. **Move `test_column_detector.py` from root to `/backend/tests/`**
   - Avoid duplicate with tests/test_column_detector.py
   - Clear separation of concerns

2. **Move `run_vda_migration.py` from root to `/backend/scripts/`**
   - Keeps migration scripts organized
   - Consistency with other scripts

### Priority 2 (Medium) - Documentation
1. **Consolidate `/docs/plans/sprint-2 through sprint-5/` README files**
   - Review if sprint-3, 4, 5 READMEs are needed
   - All currently just contain "README.md" placeholder

2. **Review `_archives/llm-guides-snapshots/`**
   - Multiple versions from 2025-11-03 to 11-10
   - Consider keeping only latest or consolidating

3. **Audit `_archives/superseded-docs/2025-11-03/` contents**
   - Are NEW-LLM-SESSION-TEMPLATE.md and similar still needed?
   - Move active templates to main docs

### Priority 3 (Low) - Optimization
1. **Review test data in `/test-data/integration/`**
   - Some files appear to be for the same test case (sample-sales-data.csv vs sample-sales-data-accurate.csv)
   - Document which is canonical

2. **Consider archiving very old development logs**
   - `_archives/development-logs/` files from early Nov
   - May be historical interest only

3. **Review rollback migrations**
   - `018_add_exempt_sales_support_ROLLBACK.sql` - ensure needed for documentation only

### Priority 4 (Enhancement) - Documentation
1. Add `/backend/_archived_code/README.md` explanation to root README
2. Add `/test-data/README.md` to explain which datasets are canonical
3. Create `/docs/ARCHITECTURE.md` with system overview
4. Add file-size budgets to each directory (frontend: <1MB, backend: <1MB)

---

## 16. SECURITY & ENVIRONMENT CONSIDERATIONS

### .env Files Status
- ✓ No actual `.env` files in repo (only `.env.example`)
- ✓ .gitignore properly excludes `*.env`
- ✓ Environment variables properly documented in `.env.example` files

### Sensitive Files
- ✓ No credentials in `.example` files (only template fields)
- ✓ Node modules properly ignored
- ✓ Python cache properly ignored
- ⚠️ `.claude/settings.local.json` - Check if contains any secrets

---

## 17. FINAL ASSESSMENT

### Project Health: GOOD ✓
- Clean separation of concerns (frontend/backend)
- Proper archival strategy for old code
- Comprehensive documentation
- Well-organized migrations
- Consistent configuration across layers

### Areas for Improvement: MINOR
1. Move root-level test/script files to appropriate subdirectories
2. Consolidate redundant archive snapshots
3. Add architecture documentation
4. Document canonical test datasets

### Recommended Cleanup Scope
- **Files to move:** 2-3 files (run_vda_migration.py, test_column_detector.py)
- **Files to delete:** 0 (all have documented purpose)
- **Directories to consolidate:** 2-3 archive subdirectories
- **Time estimate:** 30-60 minutes for all cleanup

---

## 18. FILE LOCATION QUICK REFERENCE

### Finding Key Components
```
Core Nexus Calculation:    backend/app/services/nexus_calculator_v2.py
State Rules:               backend/migrations/005_populate_state_data.sql
Frontend Pages:            frontend/app/
API Endpoints:             backend/app/api/v1/
Component Library:         frontend/components/ui/
Type Definitions:          frontend/types/
Test Suite:                backend/tests/
Database Schema:           backend/migrations/
Feature Planning:          docs/plans/
Project Status:            _05-development/CURRENT_STATUS_2025-11-05.md
Entry Point:               00-START-HERE.md
```

---

**Report Generated:** 2025-11-16  
**Total Analysis Time:** Comprehensive directory structure audit  
**Status:** Analysis complete and ready for cleanup planning
