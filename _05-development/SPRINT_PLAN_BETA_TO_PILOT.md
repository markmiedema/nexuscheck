# Sprint Plan: Beta to Pilot Launch

**Last Updated:** 2025-11-07
**Status:** Active Development - Week 1 in Progress
**Target:** Beta tester feedback (1-2 weeks) → Agency pilot (2-3 weeks)

---

## 🎯 Overview

This document outlines the optimal sprint sequence to take the Nexus Check from current state to production-ready for agency pilot. Based on full-time development pace.

**Current State:**
- ✅ Core nexus calculation engine complete (all 3 lookback methods)
- ✅ Interest/penalty calculator complete (21 states populated, adding rest)
- ✅ Full-stack application functional
- ⚠️ Missing: Analysis retrieval, PDF generation, some UX polish

**Target State:**
- ✅ Beta-ready (Week 1): Functional tool for real client work
- ✅ Pilot-ready (Week 2): Accurate & professional for agency use
- ✅ Production-ready (Week 3+): Full coverage for all 52 jurisdictions

---

## 📅 WEEK 1: Make It Functional (Beta-Ready)
**Goal:** Beta tester can actually use it with real clients
**Total Effort:** 22-31 hours (1 week full-time)

### Sprint 1A: Analysis Management ✅ COMPLETE
**Estimated:** 8-12 hours | **Actual Hours:** ~4-5 hours
**Priority:** P0 (Blocker)
**Completed:** 2025-11-07

**What Was Built:**
1. **Backend Enhancements:**
   - DELETE /api/v1/analyses/{id} endpoint with soft delete
   - Enhanced GET /api/v1/analyses with pagination (limit/offset)
   - Search by client company name (ilike query)
   - Status filtering capability
   - Comprehensive test coverage (5 unit tests passing)

2. **Frontend Features:**
   - Full analyses list page at /analyses
   - Search by client name with live filtering
   - Status badges with icons (Draft, Processing, Complete, Error)
   - View and delete actions per analysis
   - Delete confirmation (browser confirm - optional custom dialog documented)
   - Empty state for new users
   - Loading skeletons for better UX
   - Dashboard integration with "View All Analyses" button

3. **Testing & Documentation:**
   - 5 backend unit tests (all passing)
   - 1 integration test (documented, requires live DB)
   - Comprehensive manual testing checklist (10 test sections, 100+ checkpoints)
   - Optional enhancement documented (custom delete dialog)

**Files Created/Modified:**
- ✅ `backend/app/api/v1/analyses.py` - Enhanced with delete, pagination, search
- ✅ `backend/tests/test_analyses_api.py` - 5 unit tests
- ✅ `backend/tests/test_analyses_integration.py` - E2E test
- ✅ `frontend/lib/api/analyses.ts` - TypeScript API client
- ✅ `frontend/app/analyses/page.tsx` - Full list UI (260 lines)
- ✅ `frontend/app/dashboard/page.tsx` - Added "View All Analyses" button
- ✅ `docs/testing/analysis-management-checklist.md` - Manual testing guide
- ✅ `frontend/components/analyses/README.md` - Optional enhancements

**Acceptance Criteria:**
- [x] User can see list of all their previous analyses
- [x] User can click to view any past analysis
- [x] All data displays correctly for past analyses
- [x] User can navigate to state details from past analyses
- [x] User can delete analyses with confirmation

**Lessons Learned:**
- shadcn/ui components worked excellently for rapid UI development
- Supabase filtering with `.is_('deleted_at', 'null')` cleanly excludes soft-deleted items
- Browser confirm() works well for MVP; custom dialog is nice-to-have
- TypeScript interfaces improved type safety across frontend/backend
- Manual testing checklist valuable for future QA

---

### Sprint 1B: PDF Generation 📄 CRITICAL
**Estimated:** 12-16 hours | **Priority:** P0 (Blocker)

**What to Build:**
1. **PDF Export Service**
   - Use WeasyPrint or similar (Python)
   - Professional template with:
     - Company logo placeholder (for white labeling later)
     - Client name
     - Analysis period
     - Executive summary
     - State-by-state results table
     - Liability summary (tax + interest + penalties)
     - Methodology notes

2. **Download Button**
   - "Export PDF" button on results page
   - Generates and downloads PDF
   - Loading state while generating

**Why Second:** This is what gets delivered to the client. Without PDF, beta tester can't actually deliver results.

**Files to Create/Modify:**
- `backend/app/services/pdf_generator.py` (new)
- `backend/app/api/v1/analyses.py` (add GET /analyses/{id}/pdf endpoint)
- `frontend/app/analysis/[id]/results/page.tsx` (add export button)

**Acceptance Criteria:**
- [ ] User can click "Export PDF" button
- [ ] PDF generates within 3-5 seconds
- [ ] PDF looks professional and client-ready
- [ ] PDF includes all nexus determinations
- [ ] PDF includes liability summary with interest & penalties
- [ ] PDF downloads correctly

**Technical Decisions Needed:**
- [ ] Which PDF library? (WeasyPrint recommended)
- [ ] Logo placement for future white labeling
- [ ] Report structure/sections

---

### Sprint 1C: Auto-Detect Date Range ✅ COMPLETE
**Estimated:** 2-3 hours | **Actual Hours:** ~2-3 hours
**Priority:** P1 (High)
**Completed:** 2025-11-07

**What Was Built:**
1. **Backend Enhancements:**
   - Made `analysis_period_start` and `analysis_period_end` nullable in database
   - Created migration 012 to alter table constraints
   - Implemented auto-detection logic in CSV upload endpoint
   - Extracts min/max dates from transaction_date column using pandas
   - Auto-populates analysis dates if not manually provided
   - Handles multiple date formats (YYYY-MM-DD, MM/DD/YYYY)
   - Filters out invalid dates gracefully
   - Returns detected dates in API response

2. **Frontend Features:**
   - Removed date inputs entirely from analysis creation form
   - Updated Zod validation schema (removed date fields completely)
   - Simplified form to just: Company Name, Business Type, Registrations, Notes
   - Created DateConfirmationDialog component to show detected dates
   - Dialog displays formatted dates after upload
   - Shows whether dates were auto-populated
   - Seamless navigation to mapping screen after confirmation

3. **Testing & Documentation:**
   - 4 backend unit tests for date detection logic
   - Comprehensive integration testing checklist (12 test scenarios)
   - Tests cover: auto-detection, manual override, multi-year, different formats, invalid dates
   - TypeScript compilation verified (no type errors)

**Files Created/Modified:**
- ✅ `backend/app/schemas/analysis.py` - Made dates optional
- ✅ `backend/app/api/v1/analyses.py` - Auto-detection logic (lines 353-405)
- ✅ `backend/migrations/012_make_analysis_dates_nullable.sql` - Database migration
- ✅ `backend/tests/test_auto_detect_dates.py` - 4 unit tests
- ✅ `frontend/app/analysis/new/page.tsx` - Optional date inputs
- ✅ `frontend/app/analysis/[id]/upload/page.tsx` - Dialog integration
- ✅ `frontend/components/analysis/DateConfirmationDialog.tsx` - New component
- ✅ `frontend/components/ui/dialog.tsx` - shadcn dialog component
- ✅ `docsplans/SPRINT_1C_INTEGRATION_TESTING.md` - Testing checklist

**Acceptance Criteria:**
- [x] Analysis period auto-detected from uploaded CSV
- [x] User can see detected dates in confirmation dialog
- [x] Works with various date formats in CSV (YYYY-MM-DD, MM/DD/YYYY)
- [x] No manual date entry on analysis creation form
- [x] Cleaner, simpler user experience

**Technical Achievements:**
- Conditional database constraints (NULL allowed only if both dates NULL)
- pandas date parsing with automatic format detection
- Backward compatibility maintained (manual dates still work)
- Error handling for invalid/missing dates
- Professional UI with shadcn/ui dialog component

---

## ✅ WEEK 1 DELIVERABLE
**Beta-Ready Tool:**
- ✅ Can save and retrieve analyses (Sprint 1A complete)
- ⬜ Can generate client-deliverable PDFs (Sprint 1B pending)
- ✅ Auto-detects dates from data (Sprint 1C complete)
- ⬜ Fully functional for real client work (pending Sprint 1B)

**Progress:** 2 of 3 sprints complete
**Total Effort:** 22-31 hours (1 week full-time)
**Actual So Far:** ~7-8 hours

---

## 📅 WEEK 2: Ensure Accuracy (Pilot-Ready)
**Goal:** Agency pilot sees professional, accurate tool
**Total Effort:** 12-18 hours

### Sprint 2A: Verify Transaction Count Logic 🔍 CRITICAL
**Estimated:** 4-6 hours | **Priority:** P0 (Accuracy)

**What to Test:**
1. **Create test cases** for states with transaction thresholds:
   - Connecticut: $100K AND 200 transactions (both required)
   - New York: $500K AND 100 transactions (both required)
   - Arkansas: $100K OR 200 transactions (either triggers)
   - Georgia: $100K OR 200 transactions
   - Hawaii: $100K OR 200 transactions
   - ~15 other states with OR logic

2. **Test scenarios:**
   - High revenue, low transactions (should trigger for OR states, not AND states)
   - Low revenue, high transactions (should trigger for OR states, not AND states)
   - Both thresholds exceeded (should trigger for all)
   - Neither exceeded (no nexus)

3. **Fix any bugs found**

**Why First in Week 2:** Accuracy is critical for tax work. Wrong nexus determinations = liability for the agency.

**Files to Test:**
- `backend/app/services/nexus_calculator_v2.py` (verify transaction count logic)
- `backend/tests/test_nexus_calculator.py` (add transaction count tests)

**Acceptance Criteria:**
- [ ] Tests created for AND states (CT, NY)
- [ ] Tests created for OR states (AR, GA, HI, etc.)
- [ ] All transaction count tests passing
- [ ] Manual verification with sample data

---

### Sprint 2B: Employee/Inventory Tracking 👥 MVP REQUIRED
**Estimated:** 4-6 hours | **Priority:** P1 (Completeness)

**What to Build:**
1. **Enhance Physical Nexus Form**
   - For each state with physical presence:
     - ☐ Has employees
     - ☐ Has inventory/warehouse
     - ☐ Has office/physical location
     - ☐ Has sales reps/contractors
   - Store in database

2. **Update Database Schema**
   - Add fields to `physical_nexus` table:
     - `has_employees` (boolean)
     - `has_inventory` (boolean)
     - `has_office` (boolean)
     - `has_representatives` (boolean)

3. **Display in Reports**
   - Show what created physical nexus in each state
   - Include in PDF exports

**Why Second:** Completes the physical nexus analysis. Important for accuracy and client understanding.

**Files to Modify:**
- `frontend/app/analysis/[id]/physical-nexus/page.tsx` (add checkboxes)
- Migration: `011_add_physical_nexus_details.sql` (add columns)
- `backend/app/api/v1/analyses.py` (update endpoints)

**Acceptance Criteria:**
- [ ] Physical nexus form has employee/inventory checkboxes
- [ ] Data saves to database correctly
- [ ] Displays in state detail pages
- [ ] Shows in PDF exports
- [ ] Migration runs successfully

---

### Sprint 2C: UX Polish ✨ Quality of Life
**Estimated:** 4-6 hours | **Priority:** P2 (Nice to have)

**What to Improve:**
1. **Better Error Messages**
   - Invalid CSV format → show specific issues
   - Missing columns → show which columns needed
   - Date format issues → show examples of accepted formats

2. **Loading States**
   - Show progress during nexus calculation
   - "Processing 3 of 52 states..." type feedback
   - Spinner/progress bar

3. **Auto-Detect Date Formats**
   - Handle MM/DD/YYYY, YYYY-MM-DD, DD/MM/YYYY
   - Try common formats automatically
   - Only error if can't parse

**Why Last:** Nice improvements but not blockers.

**Files to Modify:**
- `frontend/app/analysis/[id]/upload/page.tsx` (error messages)
- `backend/app/services/csv_processor.py` (date detection)
- `frontend/app/analysis/[id]/processing/page.tsx` (progress indicator)

**Acceptance Criteria:**
- [ ] Error messages are specific and helpful
- [ ] Loading states show during long operations
- [ ] Multiple date formats accepted automatically
- [ ] User experience is smooth and professional

---

## ✅ WEEK 2 DELIVERABLE
**Pilot-Ready Tool:**
- ✅ Transaction count logic verified and working correctly
- ✅ Complete physical nexus tracking (employees/inventory)
- ✅ Professional error handling and UX
- ✅ Confidence for agency pilot

**Total Effort:** 12-18 hours (Week 2)

---

## 📅 WEEK 3+: Full Coverage (Production-Ready)
**Goal:** Handle all 52 jurisdictions perfectly
**Total Effort:** 10-15 hours

### Sprint 3: Remaining Lookback Methods 🌐 COMPLETE COVERAGE
**Estimated:** 10-15 hours | **Priority:** P2 (Enhancement)

**What to Build:**
Implement 4 additional lookback calculation methods:

1. **"12-month period ending on September 30"** (Connecticut)
   - Calculate Sep 30 lookback window
   - Effort: 3-4 hours

2. **"Preceding 4 Sales Tax Quarters"** (New York)
   - Quarterly aggregation logic
   - Effort: 3-4 hours

3. **"Preceding 4 calendar Quarters"** (South Dakota)
   - Similar to NY but calendar quarters
   - Effort: 2-3 hours

4. **"Seller's accounting year"** (North Dakota)
   - Use user-provided accounting year dates
   - Effort: 2-3 hours

**Why Later:** Only affects 4-6 states. Can work around manually for beta/pilot.

**Files to Modify:**
- `backend/app/services/nexus_calculator_v2.py` (add new calculation methods)
- `backend/tests/test_nexus_calculator.py` (add tests for each)

**States Affected:**
- Connecticut: Sep 30 ending
- New York: Sales tax quarters
- South Dakota: Calendar quarters
- North Dakota: Accounting year

**Acceptance Criteria:**
- [ ] Connecticut special period implemented and tested
- [ ] NY sales tax quarters implemented and tested
- [ ] SD calendar quarters implemented and tested
- [ ] ND accounting year implemented and tested
- [ ] All affected states show correct nexus determinations

---

## 🎯 TOTAL TIMELINE

| Phase | Effort | Deliverable |
|-------|--------|-------------|
| **Week 1** | 22-31 hours | Beta-ready - Functional tool |
| **Week 2** | 12-18 hours | Pilot-ready - Accurate & professional |
| **Week 3+** | 10-15 hours | Production-ready - Full coverage |
| **Total** | **44-64 hours** | **~1.5-2 weeks** to production-ready |

---

## 💡 RECOMMENDED APPROACH

### For Beta Tester (next 1-2 weeks):
- Complete **Week 1** ASAP (22-31 hours)
- This gives them a fully usable tool
- They can provide feedback while you work on Week 2

### For Agency Pilot (2-3 weeks out):
- Complete **Week 1 + Week 2** (34-49 hours)
- This is polished enough for an agency to pilot
- Week 3 can happen during or after pilot based on feedback

### Flexible on Week 3:
- Can manually handle the 4-6 special states during beta/pilot
- Implement based on which states the agency actually needs
- Only ~4-6 states affected, so low risk

---

## 📊 KNOWN GAPS & FUTURE WORK

### Not in This Sprint Plan (Post-Pilot):
- ⬜ White labeling (6-8 hours)
- ⬜ VDA lookback scenario UI (4-6 hours) - calculator already exists
- ⬜ Affiliate nexus detection flags (6-8 hours)
- ⬜ Historical threshold changes (8-12 hours)
- ⬜ Exact local rate lookups (40+ hours - Tier 2 feature)
- ⬜ Multi-user/team features
- ⬜ API integrations
- ⬜ Client portal

### Already Complete (No work needed):
- ✅ Calendar year lookback (44 states)
- ✅ Rolling 12-month lookback (5 states)
- ✅ Interest calculator (3 methods)
- ✅ Penalty calculator with min/max bounds
- ✅ VDA calculations (backend complete)
- ✅ Marketplace facilitator rules
- ✅ Sticky nexus tracking
- ✅ Multi-year analysis
- ✅ State detail pages with visualizations

---

## 🔄 DOCUMENTATION UPDATE SCHEDULE

**When to Update This Document:**

1. **After completing each sprint** - Mark complete, add actual hours spent
2. **When priorities change** - Adjust sprint order based on beta feedback
3. **When new features are requested** - Add to "Future Work" section
4. **Weekly on Friday** - Review progress, update status

**Update Process:**
1. Mark completed sprints with ✅
2. Add "Actual Hours:" to completed sprints
3. Update "Last Updated" date at top
4. Note any blockers or issues discovered
5. Adjust upcoming sprint estimates based on learnings

---

## 📝 SPRINT COMPLETION LOG

### Completed Sprints

#### Sprint 1A: Analysis Management ✅
**Completed:** 2025-11-07
**Actual Time:** ~4-5 hours (estimated: 8-12 hours) - **50% faster than expected!**
**Status:** All acceptance criteria met

**Key Achievements:**
- Full CRUD operations for analyses (list, view, delete)
- Professional UI with search and filtering
- Comprehensive test coverage (5 unit tests + integration test)
- Delete confirmation with soft delete (30-day recovery)
- Excellent documentation (100+ test checkpoints)

**Performance Notes:**
- Went faster than expected due to:
  - Existing API endpoints partially implemented
  - shadcn/ui components ready to use
  - Clear plan with code examples
- Browser confirm() acceptable for MVP (custom dialog documented for later)

**Next:** Sprint 1B - PDF Generation

#### Sprint 1C: Auto-Detect Date Range ✅
**Completed:** 2025-11-07
**Actual Time:** ~2-3 hours (estimated: 2-3 hours) - **On target!**
**Status:** All acceptance criteria met

**Key Achievements:**
- Removed date inputs entirely from analysis creation form
- Automatic date detection from CSV transaction data
- Professional date confirmation dialog with shadcn/ui
- Database migration to allow nullable dates
- Simplified user experience (fewer form fields)
- Comprehensive testing checklist (12 scenarios)

**Performance Notes:**
- Completed exactly as estimated (2-3 hours)
- pandas date parsing handles multiple formats automatically
- Dialog UX is clean and professional
- No type errors, clean TypeScript compilation

**User Experience Improvements:**
- Eliminates manual date entry step entirely
- Shows detected dates in confirmation dialog for verification
- Handles edge cases (invalid dates, multiple formats)
- Cleaner, simpler analysis creation form
- Dates automatically extracted from actual transaction data (more accurate)

**Next:** Sprint 1B - PDF Generation (only remaining Week 1 sprint)

### In Progress
*None currently*

### Blocked/Issues
*None currently*

---

**Last Updated:** 2025-11-07
**Next Review:** After Sprint 1B completion
**Document Owner:** Mark (Project Lead)
