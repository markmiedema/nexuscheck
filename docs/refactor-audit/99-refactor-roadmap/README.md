# Refactoring Roadmap

**Created**: 2025-01-14
**Status**: 📋 Ready for Review
**Estimated Total Effort**: 4-6 weeks

---

## Executive Summary

This comprehensive audit of the SALT Tax Tool has identified **29 critical and important issues** across 5 subsystems. While the application works, it's built on technical debt that will make future development slower, riskier, and more expensive.

**Key Findings**:
- 🔴 **10 Critical Issues** - Must fix before scaling
- 🟡 **13 Important Issues** - Should fix soon
- 🟢 **6 Nice-to-Have** - Can defer

**Most Critical**:
1. **Triple Aggregation Problem** - Frontend re-calculates what backend already computed (25 instances)
2. **No Response Validation** - 14 of 15 endpoints return untyped dicts
3. **Missing Foreign Keys** - 3 database FKs missing (data integrity risk)
4. **God Object** - 1,830-line API file doing everything
5. **Zero Unit Tests** - Core business logic (1,168 lines) untested

---

## Impact Analysis

### By Risk Level

**🔴 Critical (10 issues)**:
- Impact: System breaks, data corruption, security vulnerabilities
- Urgency: Fix within 1-2 sprints
- Examples: Missing FKs, broken constraints, no response validation

**🟡 Important (13 issues)**:
- Impact: Performance degradation, maintenance burden, developer friction
- Urgency: Fix within 1-2 months
- Examples: God object, no ORM, type drift

**🟢 Nice-to-Have (6 issues)**:
- Impact: Code quality, developer experience
- Urgency: Ongoing improvements
- Examples: Computed columns, enum types, documentation

### By Subsystem

| Subsystem | Critical | Important | Nice-to-Have | Total |
|-----------|----------|-----------|--------------|-------|
| API Contracts | 5 | 4 | 3 | 12 |
| Data Models | 3 | 5 | 3 | 11 |
| Frontend/Backend Sync | 3 | 2 | 0 | 5 |
| Type System | 4 | 3 | 2 | 9 |
| Nexus Calculation | 3 | 4 | 2 | 9 |
| **TOTAL** | **18** | **18** | **10** | **46** |

---

## Prioritized Issues List

### 🔴 Critical - Fix Immediately (Weeks 1-2)

#### **1. Frontend Triple Aggregation (Audit 04)**
**Problem**: Frontend manually aggregates data that backend already calculated (25 instances)

**Impact**:
- Violates single source of truth
- Risk of inconsistent totals
- Wasted CPU cycles
- Hard to debug

**Solution**:
- Add 7 missing aggregate fields to backend response
- Update TypeScript types
- Remove all 25 `.reduce()` calls from frontend
- Frontend trusts backend values

**Effort**: 2-3 days
**Files Changed**: 3 (backend API, frontend types, 2 components)

---

#### **2. Missing Database Foreign Keys (Audit 03)**
**Problem**: 3 tables missing FK constraints to `states` table

**Impact**:
- Invalid state codes can be inserted
- Data integrity at risk
- No cascade behavior

**Solution**:
```sql
ALTER TABLE state_results
ADD CONSTRAINT fk_state_results_state
FOREIGN KEY (state) REFERENCES states(code);

ALTER TABLE physical_nexus
ADD CONSTRAINT fk_physical_nexus_state
FOREIGN KEY (state_code) REFERENCES states(code);

ALTER TABLE sales_transactions
ADD CONSTRAINT fk_sales_transactions_state
FOREIGN KEY (customer_state) REFERENCES states(code);
```

**Effort**: 1 day (includes testing existing data)
**Files Changed**: 1 migration file

---

#### **3. Broken Database Constraint (Audit 03)**
**Problem**: `analyses.valid_period` CHECK constraint fails when dates are NULL

**Impact**:
- Database errors on INSERT
- Blocks analysis creation

**Solution**:
```sql
ALTER TABLE analyses
DROP CONSTRAINT valid_period;

ALTER TABLE analyses
ADD CONSTRAINT valid_period
CHECK (
  (analysis_period_start IS NULL AND analysis_period_end IS NULL)
  OR
  (analysis_period_end > analysis_period_start)
);
```

**Effort**: 2 hours
**Files Changed**: 1 migration file

---

#### **4. No Pydantic Response Models (Audit 02, 05)**
**Problem**: 14 of 15 endpoints return untyped `dict`

**Impact**:
- No response validation
- Breaking changes deployed silently
- Frontend has no contract guarantee

**Solution**:
- Create `backend/app/schemas/responses.py`
- Define Pydantic models for all 15 endpoints
- Use `response_model` parameter in FastAPI
- Enable OpenAPI auto-docs

**Effort**: 3-4 days
**Files Changed**: 1 new schema file, 15 endpoint updates

---

#### **5. Type Mismatches (Audit 05)**
**Problem**: 5 known mismatches between TypeScript and backend

**Impact**:
- Runtime errors (null reference, undefined)
- Incorrect assumptions
- Bugs in production

**Solution**:
- Fix nullable fields (`analysis_period_start`)
- Add missing fields (`year_data` in StateResult)
- Remove phantom fields (`gross_sales`)
- Add missing aggregates (7 fields)

**Effort**: 1-2 days
**Files Changed**: 3 TypeScript files, 1 backend endpoint

---

#### **6. Column Naming Confusion (Audit 03)**
**Problem**: `total_sales` vs `gross_sales` used interchangeably

**Impact**:
- Unclear which to use
- Risk of wrong calculations

**Solution**:
- Standardize on `gross_sales`
- Deprecate `total_sales`
- Update all code to use `gross_sales`

**Effort**: 2 days
**Files Changed**: 1 migration, 3 backend files, 2 frontend files

---

#### **7. No Data Validation Constraints (Audit 03)**
**Problem**: Database allows invalid data (`exempt_amount` > `sales_amount`)

**Impact**:
- Data integrity issues
- Invalid calculations

**Solution**:
```sql
ALTER TABLE sales_transactions
ADD CONSTRAINT valid_taxable_amount
CHECK (taxable_amount = sales_amount - COALESCE(exempt_amount, 0));

ALTER TABLE state_results
ADD CONSTRAINT valid_sales_breakdown
CHECK (gross_sales >= taxable_sales);
```

**Effort**: 1 day
**Files Changed**: 1 migration file

---

#### **8. Backend Re-Aggregates Database Data (Audit 04)**
**Problem**: API aggregates data that's already in `state_results` table

**Impact**:
- Performance waste
- Duplicate logic
- Harder to maintain

**Solution**:
- Create database view `state_results_all_years`
- Query view instead of aggregating in Python
- Eliminate 60+ lines of aggregation code

**Effort**: 2 days
**Files Changed**: 1 migration (view), 2 backend endpoints

---

#### **9. TODOs in Production (Audit 02)**
**Problem**: 4 active TODOs including unimplemented features

**Impact**:
- Users expect features that don't work
- Incomplete functionality
- `PATCH /analyses/{id}` returns "TODO"

**Solution**:
- Implement `states_approaching_threshold` calculation
- Implement `PATCH` endpoint or remove it
- Document known registrations limitation
- Fix all 4 TODOs

**Effort**: 3-4 days
**Files Changed**: 2 backend files

---

#### **10. No ORM Layer (Audit 03)**
**Problem**: All database queries are raw SQL strings

**Impact**:
- SQL injection risk
- No type safety
- Hard to maintain
- Can't reuse queries

**Solution**:
- Evaluate ORMs (SQLAlchemy, Tortoise, Piccolo)
- Create models for core tables
- Gradually migrate raw SQL to ORM
- Keep raw SQL for complex queries initially

**Effort**: 1 week
**Files Changed**: New models directory, 5+ service files

---

### 🟡 Important - Fix Soon (Weeks 3-4)

#### **11. God Object Anti-Pattern (Audit 02)**
**Problem**: `analyses.py` is 1,830 lines doing everything

**Solution**:
- Split into multiple files (crud.py, uploads.py, calculations.py, results.py)
- Create service layer
- Create repository layer
- Extract business logic

**Effort**: 1 week
**Files Changed**: 1 → 10+ files

---

#### **12. Complex Business Logic in API (Audit 02)**
**Problem**: `get_state_detail()` is 330 lines of aggregation

**Solution**:
- Move logic to `results_service.py`
- API becomes thin router
- Reusable business logic

**Effort**: 2-3 days
**Files Changed**: 2 files

---

#### **13. No Type Generation (Audit 05)**
**Problem**: TypeScript types manually maintained

**Solution**:
- Install `openapi-typescript-codegen`
- Generate types from backend
- Add to build process
- Add CI check

**Effort**: 1-2 days
**Files Changed**: package.json, CI config, generate script

---

#### **14. Memory Management Issues (Audit 02)**
**Problem**: Loads entire CSV into memory, all transactions for state

**Solution**:
- Add pagination to transaction lists
- Stream large files
- Batch processing

**Effort**: 2-3 days
**Files Changed**: 3 endpoints

---

#### **15. Missing Indexes (Audit 03)**
**Problem**: Common query patterns not indexed

**Solution**:
```sql
CREATE INDEX idx_sales_transactions_analysis_state_date
ON sales_transactions(analysis_id, customer_state, transaction_date);

CREATE INDEX idx_analyses_user_status
ON analyses(user_id, status);

CREATE INDEX idx_state_results_state
ON state_results(state);
```

**Effort**: 1 day
**Files Changed**: 1 migration

---

#### **16. No Archival Strategy (Audit 03)**
**Problem**: `sales_transactions`, `error_logs`, `audit_log` grow forever

**Solution**:
- Implement retention policy enforcement
- Archive old analyses
- Prune logs
- GDPR compliance

**Effort**: 3-4 days
**Files Changed**: New background job, 3 tables

---

#### **17. Unused Columns (Audit 03)**
**Problem**: 3 columns never used

**Solution**:
- Remove `analyses.uploaded_file_path`
- Remove `sales_transactions.transaction_count`
- Document `sales_transactions.tax_collected` or remove

**Effort**: 1 day
**Files Changed**: 1 migration, 2 backend files

---

#### **18. No Background Jobs (Audit 02)**
**Problem**: Calculation could take minutes, user waits

**Solution**:
- Add Celery or FastAPI BackgroundTasks
- Calculation runs async
- Poll for completion
- Keep sync endpoint for backward compat

**Effort**: 3-5 days
**Files Changed**: 2 endpoints, new worker setup

---

#### **19. Hard-Coded Values (Audit 02)**
**Problem**: `confidence_level: "high"` everywhere

**Solution**:
- Implement actual confidence scoring
- Make configurable
- Remove hard-coded values

**Effort**: 2-3 days
**Files Changed**: 2 backend files

---

#### **20. Debug Logging in Production (Audit 02)**
**Problem**: 8 debug log statements still present

**Solution**:
- Remove or use proper log levels
- Use environment-based logging

**Effort**: 1 hour
**Files Changed**: 2 files

---

#### **21. No Unit Tests (Audit 01)**
**Problem**: Core business logic (1,168 lines) has 0% test coverage

**Solution**:
- Extract pure functions from `NexusCalculatorV2`
- Write unit tests for nexus determination
- Test threshold crossing, sticky nexus, MF rules

**Effort**: 1 week
**Files Changed**: 1 service file, new test files

---

#### **22. No Linting for Regressions (Audit 04)**
**Problem**: Easy to re-introduce manual aggregation

**Solution**:
- Add ESLint rule to prevent `.reduce()` on `year_data`
- Add code review checklist

**Effort**: 2 hours
**Files Changed**: .eslintrc.js

---

#### **23. Schema Drift (Audit 03)**
**Problem**: 22 migrations indicate evolving understanding

**Solution**:
- Create ER diagram
- Document schema
- Consolidate migrations (optional)

**Effort**: 2-3 days
**Deliverable**: Documentation

---

### 🟢 Nice-to-Have - Ongoing Improvements (Weeks 5-6+)

#### **24-29. Lower Priority Items**
- Database views for complex queries
- Materialized views for performance
- Free text ENUMs to PostgreSQL ENUMs
- Computed columns for derived data
- Better error response standards
- API versioning strategy

**Effort**: 1-2 days each
**Total**: 1-2 weeks

---

## Recommended Sprint Plan

### Sprint 1 (Week 1-2): Critical Fixes

**Goal**: Fix data integrity and contract issues

**Tasks**:
1. Add missing foreign keys (1 day)
2. Fix broken constraint (0.5 day)
3. Add data validation constraints (0.5 day)
4. Fix type mismatches (2 days)
5. Standardize column names (2 days)
6. Add Pydantic response models (4 days)

**Deliverable**: Database integrity, type safety, API contracts

**Total**: 10 days (2 weeks)

---

### Sprint 2 (Week 3-4): Architecture Improvements

**Goal**: Reduce technical debt, improve maintainability

**Tasks**:
1. Frontend aggregation fix (3 days)
2. Create database view for aggregates (2 days)
3. Fix TODOs (4 days)
4. Set up type generation (2 days)
5. Add missing indexes (1 day)

**Deliverable**: Single source of truth, better performance

**Total**: 12 days (2.5 weeks)

---

### Sprint 3 (Week 5-6): Refactoring & Testing

**Goal**: Clean code, testability

**Tasks**:
1. Introduce ORM (5 days)
2. Split God Object (5 days)
3. Extract business logic (3 days)
4. Write unit tests (5 days)
5. Add archival strategy (3 days)

**Deliverable**: Maintainable codebase, test coverage

**Total**: 21 days (4 weeks)

---

### Sprint 4+ (Week 7+): Ongoing Improvements

**Goal**: Performance, developer experience

**Tasks**:
- Background jobs for calculations
- Pagination for large lists
- Complex business logic extraction
- Memory optimization
- Nice-to-have items

**Deliverable**: Production-ready system

---

## Migration Risk Assessment

### Low Risk (Safe to Deploy Independently)

✅ **Can deploy immediately**:
- Database constraint fixes
- Foreign key additions (if data is clean)
- Missing indexes
- Debug logging removal
- Type generation setup

**Strategy**: Deploy in any order, no coordination needed

---

### Medium Risk (Requires Coordination)

⚠️ **Deploy backend + frontend together**:
- Frontend aggregation fix (7 new fields)
- Type mismatch fixes
- Column name standardization

**Strategy**: Feature flag or blue-green deployment

---

### High Risk (Requires Careful Planning)

🔴 **Major refactoring**:
- God object split
- ORM introduction
- Background jobs
- Service layer extraction

**Strategy**:
- Feature branch
- Gradual rollout
- Monitoring
- Rollback plan

---

## Success Metrics

### Code Quality

**Before**:
- Lines in largest file: 1,830
- Test coverage: 0%
- Type coverage: ~70% (manual)
- Response validation: 0%

**After**:
- Lines in largest file: <500
- Test coverage: >80%
- Type coverage: 100% (generated)
- Response validation: 100%

---

### Performance

**Before**:
- Frontend aggregates 25× per page load
- Backend aggregates in Python (slow)
- N+1 query issues
- No pagination

**After**:
- Frontend trusts backend (0 aggregations)
- Database aggregates (fast)
- Optimized queries
- Paginated lists

---

### Developer Experience

**Before**:
- Hard to add new features (God object)
- Manual type sync (error-prone)
- No tests (risky changes)
- Unclear contracts

**After**:
- Easy to add features (small modules)
- Auto-generated types (always in sync)
- Tested core logic (safe changes)
- Documented contracts (OpenAPI)

---

## Resource Requirements

### Team Composition

**Ideal**:
- 1 Senior Backend Engineer (Python/FastAPI)
- 1 Senior Frontend Engineer (TypeScript/React)
- 1 Database Engineer (PostgreSQL)
- 1 QA Engineer (Testing)

**Minimum**:
- 1 Full-Stack Engineer (can do all, slower)

---

### Timeline

**Fast Track** (dedicated team):
- Sprint 1: 2 weeks
- Sprint 2: 2 weeks
- Sprint 3: 4 weeks
- **Total**: 8 weeks

**Gradual** (part-time, ongoing features):
- Sprint 1: 1 month
- Sprint 2: 1 month
- Sprint 3: 2 months
- **Total**: 4 months

**Recommended**: Hybrid approach
- Sprint 1 (critical): Dedicated 2 weeks
- Sprint 2-3 (important): 50% time over 2 months

---

## Decision Framework

### Should We Do This?

**Yes, if**:
- ✅ Planning to scale (more users, more features)
- ✅ Want to move faster in the future
- ✅ Need to onboard new developers
- ✅ Compliance requirements coming (SOC 2, GDPR)

**Maybe, if**:
- ⚠️ Just need it to work for current scope
- ⚠️ Limited engineering resources
- ⚠️ Uncertain product-market fit

**No, if**:
- ❌ This is a short-term tool
- ❌ No plans to grow
- ❌ Willing to accept technical debt risks

---

## What If We Don't Refactor?

### Consequences of Inaction

**Short Term** (3-6 months):
- Bugs from type mismatches
- Slow feature development (spaghetti code)
- Developer frustration
- Hard to onboard new team members

**Medium Term** (6-12 months):
- Performance degradation (unbounded data growth)
- Data integrity issues (missing FKs)
- Security vulnerabilities (SQL injection risk)
- Increasing maintenance burden

**Long Term** (12+ months):
- Complete rewrite needed (too much debt)
- Lost competitive advantage (can't ship fast)
- Team turnover (frustration)
- Business impact (bugs, downtime)

**Cost Comparison**:
- Refactor now: 4-8 weeks
- Rewrite later: 6-12 months

---

## Quick Wins (If Short on Time)

If you can only do 5 things, prioritize these:

1. **Add missing foreign keys** (1 day)
   - Biggest data integrity risk

2. **Fix frontend aggregation** (3 days)
   - Biggest performance/consistency issue

3. **Add Pydantic response models** (4 days)
   - Prevents future breaking changes

4. **Set up type generation** (2 days)
   - Catches mismatches automatically

5. **Fix broken constraint** (0.5 day)
   - Blocking issue

**Total**: 10.5 days
**Impact**: 70% of risk reduction

---

## Conclusion

The SALT Tax Tool is a **working prototype that needs to become production-ready**. The codebase has accumulated technical debt typical of rapid MVP development.

**Good News**:
- Core logic works
- Clean database schema foundation
- Modern tech stack
- Issues are well-understood

**Action Required**:
- 4-8 weeks of focused refactoring
- Prioritize critical issues (Sprint 1)
- Gradual improvements (Sprints 2-3)
- Establish better patterns going forward

**Outcome**:
- Faster feature development
- Fewer bugs
- Easier onboarding
- Production-ready system

**Decision Point**:
Do we invest 4-8 weeks now to save 6-12 months later?

---

## Next Steps

1. **Review this roadmap** with team
2. **Prioritize** based on business needs
3. **Commit to Sprint 1** (critical fixes)
4. **Create tickets** for each task
5. **Start refactoring** 🚀

---

*End of Audit*

**Total Pages**: 5 subsystems audited
**Total Issues**: 29 identified
**Total Effort**: 4-8 weeks estimated
**Confidence**: High (detailed analysis completed)
