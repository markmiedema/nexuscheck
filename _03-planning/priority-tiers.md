# Priority Tiers for Development

**Last Updated:** 2025-11-11
**Location:** Save as `03-planning/priority-tiers.md`

---

## Build Order Strategy

This document defines what to build and when, based on user value, technical dependencies, and ROI.

**Guiding Principle:** Deliver massive value quickly, then expand systematically.

**Sprint 1 Update (2025-11-11):** Tier 1 expanded to include VDA mode, exempt sales handling, enhanced column detection, and physical nexus CRUD. Multiple calculation methods deferred to Tier 2/Sprint 2.

---

## Tier 1: MVP - Build First

**Goal:** Prove the core value proposition (12-20 hours -> <1 hour)

### Features:
1. **Data ingestion & cleaning**
   - Excel upload (.xlsx, .xls, .csv)
   - Data validation
   - Format standardization
   - Error handling for messy data

2. **Economic nexus determination**
   - State-by-state threshold analysis (revenue + transaction count)
   - Marketplace facilitator rule application
   - Historical nexus timeline (when did nexus begin?)
   - Multi-year analysis (3-4 year lookback)

3. **Physical nexus management**
   - In-app CRUD interface (add, edit, delete states)
   - Import/Export JSON configuration
   - State-by-state physical presence tracking
   - Nexus establishment dates
   - Manual entry (post-upload)

4. **Exempt sales handling**
   - Support both boolean (is_taxable Y/N) and dollar amount (exempt_amount $)
   - Use gross sales for nexus determination
   - Use taxable sales for liability calculation
   - Hybrid approach for multiple industry formats

5. **VDA mode (Voluntary Disclosure Agreement)**
   - State selection UI (All, None, Top N)
   - Before/after comparison
   - Penalty/interest waiver modeling
   - Savings breakdown and visualization
   - Binary waiver approach (penalty waived or not)

6. **Enhanced column detection**
   - Auto-detect date formats (MM/DD/YYYY, YYYY-MM-DD, etc.)
   - State name normalization ("California" → "CA")
   - Sales channel normalization
   - Multiple column aliases per field
   - Transformation preview

7. **Liability estimation**
   - State rate + average local rate calculation
   - Exclude marketplace-facilitated sales
   - Interest calculation (basic)
   - Penalty estimation (basic)
   - Multi-year liability summary

8. **Report generation**
   - Professional PDF output
   - Nexus analysis by state
   - Liability summary
   - Executive summary
   - Exportable format

### Success Metrics:
- [x] 11+ hour time savings validated
- [x] 90%+ accuracy on nexus determinations
- [x] Users willing to pay after trial
- [x] Reports require <1 hour touch-up

### Estimated Build Time:
- **Sprint 1 (Current):** 10-12 days for core features 1-8
- **Original estimate:** 8-12 weeks total (included features now in Tier 2/3)
- **Status:** Phase 1-2 complete, Sprint 1 in planning

### Why This First:
- Proves core value proposition
- Addresses biggest pain point
- Fastest path to revenue
- Validates product-market fit

---

## Tier 2: Natural Extensions - Add Next

**Goal:** Enhance core product and reduce additional manual work

### Features:
6. **Multiple calculation methods** (Sprint 2)
   - Rolling 12-month window
   - Trailing 4 quarters
   - Current or prior year (whichever higher)
   - Calculation method comparison

7. **Physical/affiliate nexus detection flags**
   - Automatic detection of potential physical nexus indicators
   - Flag for manual review (not full automation)
   - Smart questions based on business type

7. **Multi-year timeline visualization**
   - Visual timeline showing when nexus began
   - Interactive state map
   - Export timeline for client presentations

8. **Compliance gap analysis**
   - Compare "should be registered" vs. "currently registered"
   - Priority ranking by liability exposure
   - Registration recommendation report

9. **Exemption certificate tracking (basic)**
   - Upload and store certificates
   - Track expiration dates
   - Link to transactions

10. **Enhanced data handling**
    - Support more file formats
    - Better handling of edge cases
    - Batch processing for multiple clients

### Success Metrics:
- [x] Users adopt 3+ Tier 2 features regularly
- [x] Further time savings (5+ additional hours)
- [x] Increased willingness to pay (higher plan tier)

### Estimated Build Time: 6-10 weeks

### Why This Second:
- Builds on proven MVP foundation
- Low technical risk
- Clear user demand
- Expands addressable use cases

---

## Tier 3: Platform Expansion - Build Later

**Goal:** Expand to additional workflow phases

### Features:
11. **VDA application form preparation** (modeling moved to Tier 1)
    - Automated form generation for VDA applications
    - State-specific templates
    - Letter templates
    - Document preparation

12. **Registration form preparation**
    - State-specific application forms
    - Business info auto-fill
    - Status tracking

13. **Return preparation (basic)**
    - Monthly/quarterly return calculation
    - Form generation
    - Filing deadline reminders

14. **Ongoing monitoring**
    - Periodic data uploads
    - New nexus alerts
    - Threshold tracking
    - Quarterly compliance checks

15. **Historical threshold tracking**
    - Database of threshold changes over time
    - More accurate historical nexus determination
    - Account for states that changed thresholds mid-lookback

### Success Metrics:
- [x] Users replace manual processes with tool for 4+ workflow phases
- [x] Engagement from "point solution" to "platform"
- [x] Higher LTV through expanded usage

### Estimated Build Time: 12-16 weeks

### Why This Third:
- Requires mature platform foundation
- Higher technical complexity
- Benefit is incremental vs. transformational
- Market validation needed first

---

## Features NOT Planned (and Why)

### Explicitly Excluded:

**Audit defense automation**
- Requires deep expertise and judgment
- Too variable to systematize
- Low automation ROI
- Professional liability risk

**Client portal with direct access**
- Adds complexity without clear value
- Professionals want to control client interaction
- Security and liability concerns

**API integrations with accounting systems**
- High maintenance burden
- Many different systems to support
- MVP users comfortable with Excel export/import
- Consider only after platform adoption proven

**Mobile app**
- Work is done at desktop
- No clear mobile use case
- Resource intensive to maintain

**Multi-language support**
- US market is primary target
- Adds significant complexity
- Revisit if expanding internationally

**Advanced AI features** (tax advice, strategy)
- Liability risk too high
- Professionals won't trust black-box recommendations
- Better to augment human judgment than replace it

---

## Decision Framework for New Features

When evaluating new feature requests, ask:

### 1. Value Assessment:
- How much time does this save?
- How many users would use this regularly?
- Does this enable new revenue or prevent churn?

### 2. Technical Feasibility:
- Can we build this reliably?
- What's the maintenance burden?
- Does it introduce new risk?

### 3. Strategic Fit:
- Does this align with core value proposition?
- Does it expand our moat or just add surface area?
- Would competitors easily copy this?

### 4. Resource Requirements:
- Build time vs. other priorities?
- Ongoing support needed?
- Does this unlock other features or stand alone?

**Prioritization Rule:** Must score high on value AND feasibility to make the roadmap.

---

## Roadmap Timeline (Estimated)

### Months 1-3: Tier 1 (MVP)
- Focus: Prove core value
- Goal: First paying customers
- Success: 10+ active users, 90%+ satisfaction

### Months 4-6: Tier 2 (Extensions)
- Focus: Expand value and retain users
- Goal: Increase ARPU and reduce churn
- Success: 50+ active users, feature adoption

### Months 7-12: Tier 3 (Platform)
- Focus: Become platform, not point solution
- Goal: High switching costs
- Success: 200+ active users, multi-product usage

---

## Open Questions

[DECISION NEEDED] Should we build Tier 2 features in parallel with Tier 1, or wait for full MVP validation?
- **Argument for parallel:** Faster time to feature parity
- **Argument for sequential:** Focus resources, validate demand first
- **Recommendation:** Sequential - prove MVP first

[DECISION NEEDED] Do we build for freemium or paid-only from day one?
- **Impact:** Go-to-market strategy
- **Consideration:** Professional users may distrust free tools
- **Recommendation:** Trial period then paid (no free tier)
