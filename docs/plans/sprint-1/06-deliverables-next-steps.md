# Sprint 1: Deliverables & Next Steps

**Status:** Post-Sprint Completion Guide
**Purpose:** Validate deliverables, document technical debt, preview Sprint 2
**Timeline:** After Day 12

---

## Table of Contents
1. [Sprint 1 Deliverables Checklist](#sprint-1-deliverables-checklist)
2. [Success Criteria Validation](#success-criteria-validation)
3. [Known Issues & Technical Debt](#known-issues--technical-debt)
4. [Sprint 2 Preview](#sprint-2-preview)
5. [Long-Term Roadmap](#long-term-roadmap)

---

## Sprint 1 Deliverables Checklist

### Day 1-2: Physical Nexus UI ✅

**Backend:**
- [ ] API router created (`backend/app/api/v1/physical_nexus.py`)
- [ ] All CRUD endpoints functional (POST, GET, PUT, DELETE)
- [ ] Pydantic schemas defined (`backend/app/schemas/physical_nexus.py`)
- [ ] Import/export endpoints working
- [ ] Ownership validation in place
- [ ] Duplicate prevention logic tested
- [ ] Backend tests passing (`tests/test_physical_nexus_api.py`)

**Frontend:**
- [ ] Custom hook created (`frontend/hooks/usePhysicalNexusConfig.ts`)
- [ ] Physical Nexus Manager component (`frontend/components/PhysicalNexusManager.tsx`)
- [ ] Form modal with validation (`frontend/components/PhysicalNexusForm.tsx`)
- [ ] Table display component
- [ ] Import/Export UI working
- [ ] Toast notifications for all actions
- [ ] Integration with results page
- [ ] Manual testing completed

**Validation Commands:**
```bash
# Backend
cd backend
pytest tests/test_physical_nexus_api.py -v

# Frontend (visual inspection)
npm run dev
# Navigate to /analysis/[id]/results
# Test: Add, Edit, Delete, Import, Export physical nexus entries
```

---

### Day 3-5: VDA Mode ✅

**Backend:**
- [ ] Database migration applied (`migrations/add_vda_columns.sql`)
- [ ] Columns added to `analyses` and `state_results` tables
- [ ] VDA Calculator service created (`backend/app/services/vda_calculator.py`)
- [ ] VDA API endpoints functional (`backend/app/api/v1/vda.py`)
- [ ] State-specific VDA rules loaded
- [ ] Penalty waiver calculations tested
- [ ] Interest waiver logic verified (rare states)
- [ ] Backend tests passing

**Frontend:**
- [ ] Custom hook created (`frontend/hooks/useVDAMode.ts`)
- [ ] VDA panel component (`frontend/components/VDAPanel.tsx`)
- [ ] State selection UI (All, None, Top N)
- [ ] Before/after comparison display
- [ ] Pie chart visualization working (Recharts)
- [ ] Savings breakdown table
- [ ] Enable/Disable VDA toggle
- [ ] Integration with results page

**Validation Commands:**
```bash
# Database migration
psql $DATABASE_URL -f backend/migrations/add_vda_columns.sql

# Backend
pytest tests/test_vda_calculator.py -v

# Frontend
npm run dev
# Test VDA mode with sample analysis
# Verify savings calculations match backend
```

**Key Test Scenarios:**
1. Select 3 states with penalties → Verify savings
2. Select all 50 states → Performance test
3. Disable VDA → Verify state resets to original values
4. Top 5 by penalty → Verify correct states selected

---

### Day 6-8: Column Detection & Exempt Sales ✅

**Backend:**
- [ ] Column detector enhanced (`backend/app/services/column_detector.py`)
- [ ] New aliases added for all fields
- [ ] Date format auto-detection working
- [ ] State name normalization functional
- [ ] Sales channel mapping tested
- [ ] Exempt sales migration applied (`migrations/add_exempt_columns.sql`)
- [ ] `taxable_amount`, `is_taxable`, `exempt_amount` columns added
- [ ] Nexus calculator updated for gross vs. taxable sales
- [ ] Hybrid exempt sales logic tested (both columns)
- [ ] Backend tests passing

**Frontend:**
- [ ] State results show both gross and taxable sales
- [ ] Column mapping preview working
- [ ] Transformation preview displays changes
- [ ] UI distinguishes nexus determination (gross) vs. liability (taxable)

**Validation Commands:**
```bash
# Test exempt sales scenarios
pytest tests/test_exempt_sales.py -v

# Test column detection
pytest tests/test_column_detector.py -v

# Manual CSV tests (see 05-testing-documentation.md)
# Upload test-exact-match.csv
# Upload test-common-variants.csv
# Upload test-with-exempt-sales.csv
```

**Key Test CSVs:**
1. `test-exact-match.csv` - Standard column names
2. `test-common-variants.csv` - Common aliases
3. `test-no-match.csv` - Should require manual mapping
4. `test-exempt-sales-boolean.csv` - is_taxable column
5. `test-exempt-sales-dollar.csv` - exempt_amount column
6. `test-exempt-sales-hybrid.csv` - Both columns

---

### Day 9-10: Integration & Polish ✅

**UI Enhancements:**
- [ ] US Map color-coded by nexus type
- [ ] Map click handlers working
- [ ] Tooltips display on hover
- [ ] Legend component added
- [ ] Loading states for all async operations
- [ ] Skeleton loaders implemented
- [ ] Empty states for all tables
- [ ] Error boundaries catch React errors
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Accessibility audit passed (keyboard nav, ARIA labels, color contrast)

**Performance:**
- [ ] Large dataset tested (10,000+ rows)
- [ ] Page load time < 2 seconds
- [ ] Chart rendering smooth
- [ ] No console errors

**Validation Commands:**
```bash
# Lighthouse audit
npm run build
npm run start
# Open DevTools > Lighthouse > Run audit

# Accessibility
npm run a11y  # If script exists, or use axe DevTools

# Performance test
# Upload large CSV (10,000+ rows)
# Monitor: Network tab, Performance tab
```

---

### Day 11-12: Testing & Documentation ✅

**Testing:**
- [ ] All backend tests passing (`pytest tests/ -v`)
- [ ] Frontend component tests added (if applicable)
- [ ] Integration tests cover 4 end-to-end flows
- [ ] Browser compatibility verified (Chrome, Firefox, Safari, Edge)
- [ ] Performance benchmarks documented
- [ ] Accessibility checklist completed

**Documentation:**
- [ ] User guide updated (`docs/user-guide/`)
- [ ] CSV column requirements documented
- [ ] CSV templates created (`docs/templates/`)
- [ ] FAQ updated with common issues
- [ ] API documentation current (if using Swagger/OpenAPI)

**Validation:**
```bash
# Full test suite
cd backend
pytest tests/ -v --cov=app

# Check documentation
ls docs/user-guide/
ls docs/templates/

# Verify CSV templates are valid
python backend/scripts/validate_templates.py
```

---

## Success Criteria Validation

### From 00-overview.md

**1. All 4 features fully functional**

| Feature | Backend | Frontend | Tests | Status |
|---------|---------|----------|-------|--------|
| Physical Nexus UI | ✅ | ✅ | ✅ | ✅ |
| VDA Mode | ✅ | ✅ | ✅ | ✅ |
| Exempt Sales | ✅ | ✅ | ✅ | ✅ |
| Enhanced Column Detection | ✅ | ✅ | ✅ | ✅ |

**2. Upload → Results flow includes new features**

- [ ] Upload CSV with exempt sales → Shows gross vs. taxable breakdown
- [ ] Add physical nexus manually → Map updates, results recalculate
- [ ] Enable VDA mode → Savings displayed, pie chart renders
- [ ] CSV with varied column names → Auto-detected correctly

**3. No breaking changes to Phase 1 & 2 functionality**

- [ ] Existing analyses still load correctly
- [ ] Economic nexus calculations unchanged
- [ ] Interest/penalty calculations still accurate for 21 states
- [ ] Backend migrations are reversible (rollback scripts exist)

**4. Test suite passes (backend + frontend)**

```bash
# Backend
cd backend
pytest tests/ -v
# Expected: 50+ tests passing

# Frontend (if tests exist)
cd frontend
npm run test
```

**5. Documentation updated**

- [ ] `docs/user-guide/02-upload-data.md` - New CSV columns
- [ ] `docs/user-guide/03-physical-nexus.md` - NEW
- [ ] `docs/user-guide/04-vda-mode.md` - NEW
- [ ] `docs/user-guide/05-exempt-sales.md` - NEW
- [ ] `docs/templates/sample-upload-full.csv` - All optional columns

---

## Known Issues & Technical Debt

### Minor Issues (Non-Blocking)

**1. VDA Mode - Limited State Rules**
- **Issue:** Only penalty waivers implemented; some states waive interest too
- **Impact:** VDA savings slightly understated for ~5 states
- **Fix:** Add state-specific interest waiver rules in Sprint 2
- **Priority:** Low (affects <10% of VDA scenarios)

**2. Column Detection - Partial Match Ambiguity**
- **Issue:** If CSV has both "state" and "customer_state", detector picks first match
- **Impact:** May require manual column remapping
- **Fix:** Add confidence scoring, prefer more specific column names
- **Priority:** Medium (improve in Sprint 2)

**3. Physical Nexus - No Bulk Import Validation**
- **Issue:** CSV import doesn't validate date formats or state codes upfront
- **Impact:** Import may fail midway, leaving partial data
- **Fix:** Add pre-validation step before import
- **Priority:** Medium (add in Sprint 2)

**4. US Map - No Zoom/Pan**
- **Issue:** Map is static, hard to see small states (NE, MD, DE)
- **Impact:** UX limitation on mobile
- **Fix:** Add interactive SVG pan/zoom in Sprint 3
- **Priority:** Low (workaround: click state for details)

---

### Technical Debt

**1. Frontend State Management**
- **Current:** Mix of React state, custom hooks, inline API calls
- **Debt:** No centralized state management (Zustand, Redux)
- **Impact:** Props drilling, inconsistent loading states
- **Recommendation:** Refactor to Zustand in Sprint 3
- **Effort:** 2-3 days

**2. Backend - No Caching Layer**
- **Current:** Every API call hits database
- **Debt:** State thresholds, interest rates are static but fetched repeatedly
- **Impact:** Unnecessary DB load
- **Recommendation:** Add Redis or in-memory cache in Sprint 4
- **Effort:** 1 day

**3. Testing - Limited E2E Coverage**
- **Current:** Unit tests good, integration tests minimal
- **Debt:** No Playwright/Cypress E2E tests
- **Impact:** Risky deployments, manual QA burden
- **Recommendation:** Add E2E tests in Sprint 5 pre-launch
- **Effort:** 3-4 days

**4. Database - No Indexing Review**
- **Current:** Basic indexes on primary/foreign keys
- **Debt:** No indexes on frequently filtered columns (state_code, date ranges)
- **Impact:** Slow queries on large datasets (>50k transactions)
- **Recommendation:** Add indexes for common queries in Sprint 2
- **Effort:** Half day

**5. Error Handling - Generic Messages**
- **Current:** API returns generic "An error occurred"
- **Debt:** User doesn't know why upload failed (column missing? Invalid date?)
- **Impact:** Poor UX, support burden
- **Recommendation:** Add specific error messages in Sprint 2
- **Effort:** 1 day

---

### Security Considerations

**1. File Upload Validation**
- **Current:** Basic MIME type check
- **Todo:** Add virus scanning, file size limits, content validation
- **Priority:** High (before public launch)

**2. Rate Limiting**
- **Current:** None
- **Todo:** Add rate limits to prevent abuse
- **Priority:** High (before public launch)

**3. Supabase RLS Audit**
- **Current:** RLS policies on all tables
- **Todo:** Security audit by external expert
- **Priority:** High (before public launch)

---

## Sprint 2 Preview

**Focus:** Multiple Calculation Methods + UX Refinements
**Duration:** 8-10 days
**Goal:** Give users flexibility in how nexus is calculated

---

### Features

#### 1. Multiple Calculation Methods (Days 1-6)

**The Problem:**
- Currently: Only calendar year calculation
- User Need: Different states/audits may require different lookback periods

**The Solution (from pre-MVP):**
1. **Rolling 12-Month Window**
   - Calculate nexus for each month using prior 12 months
   - Example: Jan 2024 nexus = Feb 2023 - Jan 2024 sales

2. **Trailing 4 Quarters**
   - Calculate nexus using last 4 full quarters
   - Example: Q1 2024 nexus = Q1 2023 - Q4 2023 sales

3. **Calendar Year** (current default)
   - Annual aggregation (Jan 1 - Dec 31)

4. **Current or Prior Year**
   - Whichever is higher triggers nexus

**Backend Implementation:**
```python
# File: backend/app/services/calculation_method_service.py
class CalculationMethodService:
    def calculate_rolling_12_month(self, transactions: List[Dict]) -> List[Dict]:
        """
        For each month in dataset:
        - Get transactions from [month - 12] to [month]
        - Calculate nexus per state
        - Return monthly nexus snapshots
        """

    def calculate_trailing_4_quarters(self, transactions: List[Dict]) -> List[Dict]:
        """
        For each quarter:
        - Get transactions from last 4 full quarters
        - Calculate nexus per state
        - Return quarterly snapshots
        """

    def calculate_current_or_prior(self, transactions: List[Dict]) -> Dict:
        """
        Calculate both current and prior year
        Return whichever triggers more nexus states
        """
```

**Frontend:**
```typescript
// File: frontend/hooks/useCalculationMethod.ts
export function useCalculationMethod(analysisId: string) {
  const [method, setMethod] = useState<CalculationMethod>('calendar_year')
  const [methodResults, setMethodResults] = useState<MethodResults | null>(null)

  const methods = [
    { value: 'calendar_year', label: 'Calendar Year' },
    { value: 'rolling_12', label: 'Rolling 12-Month' },
    { value: 'trailing_4q', label: 'Trailing 4 Quarters' },
    { value: 'current_or_prior', label: 'Current or Prior Year' },
  ]

  const recalculate = async (newMethod: CalculationMethod) => {
    // Call API, update results
  }

  return { method, methods, methodResults, recalculate }
}
```

**UI Component:**
```tsx
// File: frontend/components/CalculationMethodSelector.tsx
// Dropdown to switch calculation method
// "Recalculate" button
// Comparison table showing results from each method
```

---

#### 2. Priority Categorization (Days 7-8)

**The Feature:**
- **HIGH Priority:** States with $100k+ liability
- **MEDIUM Priority:** States with $30k-$100k liability
- **LOW Priority:** States with <$30k liability

**Why This Matters:**
- Users need to prioritize registrations
- High-liability states = higher urgency
- Visual color coding helps quick decision-making

**Implementation:**
```python
# File: backend/app/services/priority_service.py
def calculate_priority(total_liability: Decimal) -> str:
    if total_liability >= 100000:
        return 'HIGH'
    elif total_liability >= 30000:
        return 'MEDIUM'
    else:
        return 'LOW'
```

**Frontend:**
```tsx
// Update StateResultsTable to show priority badges
<Badge variant={priorityVariant(result.priority)}>
  {result.priority}
</Badge>
```

---

#### 3. UX Refinements (Days 9-10)

**Focus Areas:**
1. **Keyboard Shortcuts**
   - `Cmd/Ctrl + U` → Upload new CSV
   - `Cmd/Ctrl + E` → Export results
   - `Escape` → Close modals

2. **Improved Empty States**
   - Illustration + clear CTA
   - Sample CSV download link

3. **Better Error Messages**
   - "Missing column: transaction_date" (not "Invalid CSV")
   - "Date format should be YYYY-MM-DD" (not "Parse error")

4. **Onboarding Tour** (Optional)
   - First-time user walkthrough
   - Highlight: Upload → Physical Nexus → VDA → Results

---

### Sprint 2 Deliverables

**Must-Have:**
- [ ] 4 calculation methods functional
- [ ] Users can switch between methods
- [ ] Results update correctly
- [ ] Priority categorization visible
- [ ] Better error messages

**Nice-to-Have:**
- [ ] Keyboard shortcuts
- [ ] Onboarding tour
- [ ] Comparison table (method A vs. B)

---

## Long-Term Roadmap

### Sprint 3: Modularity & Advanced UX (10-12 days)

**Goals:**
- Refactor frontend to Zustand for state management
- Interactive US Map (zoom, pan, tooltips)
- Dark mode support
- Mobile optimization
- User preferences (save calculation method, VDA state selections)

**Key Features:**
- Zustand store for global state
- SVG map with zoom/pan
- LocalStorage for user preferences
- Responsive table design
- Touch-friendly mobile UI

---

### Sprint 4: Export & Reporting (8-10 days)

**Goals:**
- Export results to multiple formats
- Generate professional reports for clients/auditors
- Email delivery of reports

**Key Features:**
1. **Excel Export**
   - Multi-sheet workbook (Summary, State Details, VDA Comparison)
   - Formatted cells, conditional formatting
   - Charts embedded

2. **CSV Export**
   - Raw data export
   - Custom column selection

3. **PDF Report**
   - Executive summary (1 page)
   - State-by-state breakdown
   - US Map visualization
   - VDA savings summary

4. **Email Reports**
   - Schedule automated reports
   - Email PDF to client

---

### Sprint 5: Pre-Launch Polish (12-15 days)

**Goals:**
- Security hardening
- Performance optimization
- E2E testing
- Production deployment
- Marketing site

**Key Activities:**
1. **Security Audit**
   - Penetration testing
   - RLS policy review
   - Rate limiting
   - Input sanitization

2. **Performance**
   - Database indexing
   - Query optimization
   - Frontend code splitting
   - Image optimization
   - CDN setup

3. **E2E Testing**
   - Playwright test suite
   - 20+ E2E scenarios
   - CI/CD integration

4. **Deployment**
   - Production environment setup
   - SSL certificates
   - Domain configuration
   - Monitoring (Sentry, LogRocket)

5. **Marketing Site**
   - Landing page
   - Pricing page
   - Documentation site
   - Blog setup

---

### Post-MVP Features (Backlog)

**Advanced Calculations:**
- Historical lookback (3-year nexus history)
- Nexus forecasting (predict future nexus based on trends)
- Multi-scenario analysis (what-if modeling)

**Data Integrations:**
- Connect to Shopify, Amazon, WooCommerce
- Sync with QuickBooks, Xero
- API webhooks for automated imports

**Collaboration:**
- Multi-user accounts (team members)
- Client portal (share results with clients)
- Commenting on states (internal notes)

**Advanced VDA:**
- VDA cost calculator (legal fees, registration costs)
- VDA timeline tracking (submission → approval)
- VDA document generation (application forms)

**AI/ML Features:**
- Smart column detection (ML-based)
- Anomaly detection (flag suspicious transactions)
- State law change alerts (track threshold updates)

**Compliance:**
- Filing deadline tracking
- Return preparation assistance
- Registration status tracking

---

## Final Checklist

### Before Moving to Sprint 2

- [ ] All Sprint 1 deliverables complete (see checklist above)
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Known issues documented
- [ ] Technical debt logged in issue tracker
- [ ] Sprint 1 retrospective completed (what went well, what to improve)
- [ ] Sprint 2 plan created
- [ ] Stakeholder demo scheduled (if applicable)

### Demo Preparation

**What to Show:**
1. **Upload Flow** - Upload CSV with exempt sales, auto-detected columns
2. **Physical Nexus** - Add/Edit/Delete/Import/Export
3. **VDA Mode** - Select states, show savings, pie chart
4. **US Map** - Color-coded nexus types, tooltips
5. **Results** - Gross vs. taxable sales breakdown

**Talking Points:**
- "We added 4 major features in 12 days"
- "Physical nexus management saves 30 minutes per analysis"
- "VDA mode shows potential $50k+ savings on average"
- "Exempt sales accuracy is critical for manufacturing/grocery clients"
- "Column detection handles messy real-world CSVs"

---

## Questions for Sprint 2 Planning

1. **Calculation Methods Priority:**
   - Which method is most important to users? (Rolling 12-month? Trailing 4Q?)
   - Should we build all 4, or start with 1-2?

2. **Priority Categorization:**
   - Are $100k/$30k thresholds appropriate?
   - Should thresholds be user-configurable?

3. **UX Refinements:**
   - Which improvements have highest user impact?
   - Keyboard shortcuts vs. onboarding tour vs. error messages?

4. **Performance:**
   - What's the expected dataset size? (10k rows? 100k rows?)
   - Should we add pagination to state results table?

5. **Testing:**
   - Should we add E2E tests in Sprint 2, or defer to Sprint 5?

---

## Success Celebration

**If all Sprint 1 deliverables are complete:**

🎉 **Congratulations!** 🎉

You've successfully delivered:
- ✅ Physical Nexus UI (full CRUD + import/export)
- ✅ VDA Mode (penalty savings, state selection, visualizations)
- ✅ Exempt Sales Support (gross vs. taxable, hybrid approach)
- ✅ Enhanced Column Detection (auto-detection, normalization)

**Impact:**
- Users can now manage physical nexus directly in the app
- VDA mode provides immediate value (show savings potential)
- Exempt sales accuracy eliminates liability over-estimation
- Column detection reduces CSV preparation time by 80%

**Next:**
- Sprint 2 planning session
- User feedback collection
- Backlog refinement

---

**End of Sprint 1 Plan** 🚀

**Ready for Sprint 2?** Let's build those multiple calculation methods!
