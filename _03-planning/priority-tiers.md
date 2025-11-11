# Priority Tiers for Development

**Last Updated:** 2025-11-01  
**Location:** Save as `03-planning/priority-tiers.md`

---

## Build Order Strategy

This document defines what to build and when, based on user value, technical dependencies, and ROI.

**Guiding Principle:** Deliver massive value quickly, then expand systematically.

---

## Tier 1: MVP - Build First ðŸŽ¯

**Goal:** Prove the core value proposition (12-20 hours â†’ <1 hour)

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

3. **Physical nexus intake**
   - Simple questionnaire or spreadsheet import
   - State-by-state physical presence tracking
   - Nexus establishment dates

4. **Liability estimation**
   - State rate + average local rate calculation
   - Exclude marketplace-facilitated sales
   - Interest calculation (basic)
   - Penalty estimation (basic)
   - Multi-year liability summary

5. **Report generation**
   - Professional PDF output
   - Nexus analysis by state
   - Liability summary
   - Executive summary
   - Exportable format

### Success Metrics:
- âœ… 11+ hour time savings validated
- âœ… 90%+ accuracy on nexus determinations
- âœ… Users willing to pay after trial
- âœ… Reports require <1 hour touch-up

### Estimated Build Time: 8-12 weeks

### Why This First:
- Proves core value proposition
- Addresses biggest pain point
- Fastest path to revenue
- Validates product-market fit

---

## Tier 2: Natural Extensions - Add Next ðŸ“ˆ

**Goal:** Enhance core product and reduce additional manual work

### Features:
6. **Physical/affiliate nexus detection flags**
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
- âœ… Users adopt 3+ Tier 2 features regularly
- âœ… Further time savings (5+ additional hours)
- âœ… Increased willingness to pay (higher plan tier)

### Estimated Build Time: 6-10 weeks

### Why This Second:
- Builds on proven MVP foundation
- Low technical risk
- Clear user demand
- Expands addressable use cases

---

## Tier 3: Platform Expansion - Build Later ðŸš€

**Goal:** Expand to additional workflow phases

### Features:
11. **VDA preparation assistance**
    - VDA eligibility checker by state
    - Form generation
    - Limited lookback calculation
    - Letter templates

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
- âœ… Users replace manual processes with tool for 4+ workflow phases
- âœ… Engagement from "point solution" to "platform"
- âœ… Higher LTV through expanded usage

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
