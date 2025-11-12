# Sprint 1: Overview & Goals

**Project:** Nexus Check (formerly SALT Tax Tool)
**Sprint Duration:** 10-12 days
**Status:** In Progress - Days 1-2 Complete ✅
**Created:** 2025-01-11
**Last Updated:** 2025-11-11

---

## Table of Contents

This Sprint 1 plan is broken into the following parts:

1. **00-overview.md** (this file) - Overview, goals, timeline
2. **01-physical-nexus.md** - Days 1-2: Physical Nexus UI implementation
3. **02-vda-mode.md** - Days 3-5: VDA Mode implementation
4. **03-column-detection-exempt-sales.md** - Days 6-8: Enhanced CSV handling
5. **04-integration-polish.md** - Days 9-10: Integration and Polish
6. **05-testing-documentation.md** - Days 11-12: Testing and Documentation
7. **06-deliverables-next-steps.md** - Success criteria and next steps

---

## Sprint Goals

### Primary Objectives

✅ **Physical Nexus UI** - Enable manual entry with CRUD operations (MUST HAVE) **[COMPLETE - Days 1-2]**
⏳ **VDA Mode** - Implement Voluntary Disclosure Agreement scenario modeling (HIGH PRIORITY) **[NEXT - Days 3-5]**
⏳ **Enhanced Column Detection** - Better CSV handling with normalization **[Days 6-8]**
⏳ **Exempt Sales Support** - Handle taxable vs. non-taxable sales properly (CRITICAL) **[Days 6-8]**
⏳ **UX Polish** - Visual indicators, better data display, responsive design **[Days 9-10]**

### Why These Features?

These four features were identified from analyzing the pre-MVP project that you loved:

1. **Physical Nexus** - Current project has backend but NO frontend UI (critical gap)
2. **VDA Mode** - You said "I LOVE this feature" from the pre-MVP
3. **Multiple Calculation Methods** - You said "very important to add"
4. **Exempt Sales** - Critical for accuracy (you identified this gap)

---

## Features from Pre-MVP Analysis

### Pre-MVP Repository
- **URL:** https://github.com/markmiedema/test
- **Branch:** `claude/incomplete-description-011CUznRBf2NtbLdmr5qZPL8`
- **Architecture:** Highly modular with custom hooks and reusable components

### Key Patterns to Port

#### 1. Custom Hooks Architecture
The pre-MVP used sophisticated custom hooks to separate state logic from UI:

- **`usePhysicalNexusConfig`** - CRUD operations + import/export
- **`useVDAMode`** - State selection, calculations, pie chart data (21 return values!)
- **`useFileUpload`** - Drag-drop state management

**Why adopt this?** Clean separation of concerns, reusable logic, easier testing

#### 2. Column Normalization
The pre-MVP had smart CSV handling:

```typescript
// Features:
- Case-insensitive matching + whitespace trimming
- Date format conversion (MM/DD/YYYY → YYYY-MM-DD)
- State name → code mapping ("California" → "CA")
- Value normalization (channel variants → "marketplace"/"direct")
- Default value injection for missing fields
```

**Why adopt this?** Better user experience, handles messy real-world data

#### 3. VDA Calculation Pattern
The pre-MVP's VDA implementation:

```typescript
// Features:
- Dynamic penalty/interest waivers
- State selection presets (All, None, Top N)
- Before/After comparison
- Pie chart visualization
- Savings breakdown by component
```

**Why adopt this?** Unique selling point, professional analysis tool

---

## Current Project Status (Phase 1 & 2 Complete)

### ✅ Already Complete

**Architecture:**
- FastAPI backend with async support
- Supabase PostgreSQL with RLS policies
- Next.js 14 frontend with App Router
- Authentication (login/signup)
- shadcn/ui component library

**Features:**
- CSV upload and parsing
- Basic column detection
- Economic nexus calculation (V2 - chronological)
- Multi-year tracking with sticky nexus
- Calendar year lookback method
- Marketplace facilitator exclusion
- Interest calculation (3 methods: simple, monthly compound, daily compound)
- Penalty calculation (maximum exposure)
- 21 states with real interest/penalty data
- Liability breakdown component
- State-by-state results view
- State detail page with year selection

### ❌ Missing (Sprint 1 Adds)

**Critical Gaps:**
- No physical nexus UI (backend exists, no frontend)
- No VDA mode (unique competitive advantage)
- Limited column normalization (basic detection only)
- No exempt sales handling (affects accuracy)
- Basic US map (no interactivity)

---

## Timeline Overview

| Days | Phase | Features | Status | Effort |
|------|-------|----------|--------|--------|
| 1-2 | Physical Nexus UI | Backend API + Frontend CRUD | ✅ **COMPLETE** | 2 days |
| 3-5 | VDA Mode | Backend calculator + Frontend UI | ⏳ Next | 3 days |
| 6-8 | Enhanced CSV + Exempt Sales | Better handling + new column support | ⏳ Pending | 3 days |
| 9-10 | Integration & Polish | US Map, UI improvements, testing | ⏳ Pending | 2 days |
| 11-12 | Testing & Documentation | QA + user docs | ⏳ Pending | 2 days |
| **Total** | **Complete MVP Features** | **All Sprint 1 Deliverables** | **16% Complete** | **10-12 days** |

---

## Key Decisions Made

### 1. Exempt Sales Approach: Hybrid ✅

**Decision:** Support both `is_taxable` (boolean) AND `exempt_amount` (dollar value)

**Rationale:**
- Flexibility: Users choose simplicity (boolean) or precision (amount)
- Backward compatible: Both columns optional
- Default behavior: All sales taxable if neither column present
- Precedence: `exempt_amount` → `is_taxable` → default taxable

**Why this matters:**
- Gross sales used for nexus determination (economic activity)
- Taxable sales used for liability calculation (what generates tax)
- Critical for accuracy in industries with exemptions (grocery, clothing, manufacturing)

### 2. Physical Nexus: Post-Upload Manual Entry ✅

**Decision:** Manual form-based entry after data upload (like pre-MVP)

**Phases:**
- **MVP (Sprint 1):** Manual entry with import/export JSON
- **Phase 2:** CSV column support for bulk import
- **Phase 3+:** CRM with discovery meetings workflow

**Rationale:**
- Immediate value for MVP
- Matches pre-MVP UX that you loved
- Import/export handles bulk scenarios
- Foundation for future CRM features

### 3. Column Detection: Enhanced with Normalization ✅

**Decision:** Keep current detection, add automatic transformations

**Enhancements:**
- More column aliases (expand pattern matching)
- Date format auto-detection (try multiple formats)
- State name → code conversion
- Sales channel normalization
- Preview transformations before processing

**Rationale:**
- Current detection works but limited
- Pre-MVP's normalization handles real-world messiness
- User sees what will happen (transparency)

### 4. VDA Implementation: Start Simple, Add Complexity ✅

**Decision:** MVP uses binary penalty waiver (yes/no per state)

**Phase 1 (Sprint 1):**
- Query `vda_programs` table for state rules
- Most states: Penalties waived, interest NOT waived
- Simple binary: Include in VDA or not

**Future Enhancements:**
- Partial penalty waivers (some states offer 50% reduction)
- Interest reduction (rare, but exists)
- Lookback period limitations
- Pre-law marketplace scenarios

**Rationale:**
- 90% of value in binary waiver model
- Can iterate based on user feedback
- Database-driven rules allow easy updates

---

## Success Metrics

### Must-Have by End of Sprint 1:

**Functional:**
- [x] User can add physical nexus in < 1 minute per state **✅ COMPLETE**
- [x] Import/export works for physical nexus **✅ COMPLETE**
- [ ] VDA mode accurately calculates savings for selected states
- [ ] Exempt sales properly affect liability but not nexus
- [ ] Gross vs. taxable sales distinction clear in UI
- [ ] US map has visual indicators for physical/economic nexus

**Quality:**
- [ ] Zero critical bugs
- [ ] < 3 high-priority bugs
- [ ] All test scenarios passing
- [ ] Performance: < 2s for all page loads
- [ ] Responsive: Works on mobile/tablet/desktop
- [ ] Accessible: Keyboard navigation works

**Documentation:**
- [ ] User guide covers all new features
- [ ] CSV template updated with optional columns
- [ ] API documentation complete
- [ ] FAQ addresses common questions

---

## Risk Mitigation

### Known Risks

**1. VDA Calculation Complexity**
- **Risk:** State-specific VDA rules are complex and varied
- **Mitigation:** Start with simple penalty waiver model, iterate
- **Fallback:** Show "VDA available - consult tax professional" for complex states

**2. Exempt Sales Edge Cases**
- **Risk:** Exempt_amount > revenue_amount, missing data, etc.
- **Mitigation:** Defensive coding, validation, clear error messages
- **Fallback:** Cap at 0, show warnings, allow manual correction

**3. CSV Data Quality**
- **Risk:** Real-world CSVs messier than expected
- **Mitigation:** Robust validation, helpful errors, normalization
- **Fallback:** "Fix in Excel and re-upload" option

**4. Performance with Large Datasets**
- **Risk:** 100,000+ transactions may slow down
- **Mitigation:** Progress indicators, background processing
- **Fallback:** Batch processing, suggest data aggregation

**5. Scope Creep**
- **Risk:** "Can we add just one more thing?"
- **Mitigation:** Strict sprint scope, defer to backlog
- **Fallback:** Create Sprint 1.5 for quick wins

---

## Development Environment

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project (dev + prod)
- Git

### Tech Stack Confirmation

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui components
- Zustand (state management)
- React Hook Form + Zod (forms)
- Recharts (visualizations)

**Backend:**
- Python 3.11
- FastAPI
- Supabase Python client
- Pandas (CSV processing)
- Pydantic (validation)

**Database:**
- Supabase PostgreSQL
- Row Level Security (RLS) enabled
- 12 tables (existing)
- Will add VDA columns to `analyses` and `state_results`

---

## Next: Continue Implementation

**✅ Completed:** Days 1-2 - Physical Nexus UI (Backend + Frontend)

Ready to continue? Next up:

**→ 02-vda-mode.md** - Days 3-5 VDA Mode implementation guide

Or jump to any section:
- **01-physical-nexus.md** - Days 1-2 (✅ Complete - View implementation details)
- **02-vda-mode.md** - Days 3-5 VDA implementation (← **Next**)
- **03-column-detection-exempt-sales.md** - Days 6-8 CSV enhancements
- **04-integration-polish.md** - Days 9-10 polish
- **05-testing-documentation.md** - Days 11-12 testing
- **06-deliverables-next-steps.md** - Wrap-up and Sprint 2

**Completion Reports:**
- **DAY-1-COMPLETE.md** - Backend implementation summary
- **DAY-2-COMPLETE.md** - Frontend implementation summary

---

**Status:** Days 1-2 complete (16% of Sprint 1). Ready for Day 3!
