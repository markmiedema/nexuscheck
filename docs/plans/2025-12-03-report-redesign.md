# Nexus Analysis Report Redesign

**Date:** December 3, 2025  
**Status:** Approved for Implementation

---

## Overview

Redesign the PDF report to be a professional presentation tool for tax professionals meeting with clients. The report should tell a story, lead to clear recommendations, and have supporting data ready for questions.

### Design Principles

1. **Presentation-first** - Designed for 30-60 minute client meetings, not standalone reading
2. **Story → Recommendations → Evidence** - Clear narrative flow
3. **Scalable** - Works for 3 states or 40 states without becoming unwieldy
4. **Actionable** - Every page should help answer "what do we do?"

---

## Report Structure

| Section | Pages | Purpose |
|---------|-------|---------|
| Cover Page | 1 | Professional first impression |
| Executive Summary | 1 | "What's the situation?" in 10 seconds |
| Action Items | 1 | "What do we do?" - the key page |
| State Details | 1 per state | Supporting detail for nexus/approaching states only |
| Appendix | 1-2 | Reference material (full state list, methodology) |

**Typical report length:**
- Small client (1-3 nexus states): 5-7 pages
- Medium client (5-10 nexus states): 10-15 pages
- Large client (15+ nexus states): 20-25 pages

---

## Section 1: Cover Page

Clean, professional, minimal.

**Content:**
- Firm logo placeholder (or "NexusCheck" branding)
- Title: "Sales Tax Nexus Analysis"
- Client company name (prominent)
- Analysis period (e.g., "January 2023 - December 2024")
- "Prepared by [Firm Name]"
- Date prepared
- "CONFIDENTIAL" notice at bottom

**Design notes:**
- White background, minimal color
- Company name should be the largest text element
- No data on this page - sets professional tone only

---

## Section 2: Executive Summary

One page maximum. Answers "What's the situation?" at a glance.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  EXECUTIVE SUMMARY                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │    12    │ │    5     │ │  $47,230 │            │
│  │  States  │ │ Require  │ │ Estimated│            │
│  │ Analyzed │ │  Action  │ │ Liability│            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  BOTTOM LINE                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ "[Company] has sales tax nexus in 5 states  │   │
│  │  with an estimated liability of $47,230.    │   │
│  │  We recommend registration in 3 states and  │   │
│  │  VDA consideration for 2 states, which      │   │
│  │  could reduce total liability to $28,530."  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  NEXUS BREAKDOWN                                    │
│  ┌─────────────────────────────────────┐           │
│  │  ● Has Nexus: 5 states              │           │
│  │  ● Approaching Threshold: 3 states  │           │
│  │  ● No Nexus: 4 states               │           │
│  └─────────────────────────────────────┘           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Content:**
- Three key metrics (large, scannable numbers)
- "Bottom Line" narrative paragraph - plain English summary the presenter can read aloud
- Simple visual breakdown (not a complex chart)

**Design notes:**
- Maximum 3 large numbers (don't overwhelm)
- Bottom line should be 2-3 sentences max
- No tables on this page
- Color coding: red for nexus count, yellow for approaching, green for safe

---

## Section 3: Action Items

The most important page. Answers "What do we need to do?"

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  RECOMMENDED ACTIONS                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔴 REGISTER NOW                                    │
│  States requiring immediate sales tax registration  │
│  ┌───────────┬───────────┬──────────┬───────────┐  │
│  │ State     │ Liability │ Priority │ Trigger   │  │
│  ├───────────┼───────────┼──────────┼───────────┤  │
│  │ California│ $23,450   │ High     │ Revenue   │  │
│  │ Texas     │ $12,100   │ High     │ Revenue   │  │
│  │ Florida   │ $8,200    │ Medium   │ Revenue   │  │
│  └───────────┴───────────┴──────────┴───────────┘  │
│                                                     │
│  🟡 CONSIDER VDA                                    │
│  Voluntary disclosure could reduce liability        │
│  ┌───────────┬───────────┬───────────┬──────────┐  │
│  │ State     │ Full      │ With VDA  │ Savings  │  │
│  │           │ Liability │           │          │  │
│  ├───────────┼───────────┼───────────┼──────────┤  │
│  │ New York  │ $18,500   │ $6,200    │ $12,300  │  │
│  │ Illinois  │ $9,800    │ $3,400    │ $6,400   │  │
│  └───────────┴───────────┴───────────┴──────────┘  │
│                                                     │
│  🟢 MONITOR                                         │
│  States approaching nexus threshold                 │
│  ┌───────────┬───────────┬───────────┬──────────┐  │
│  │ State     │ Current   │ Threshold │ Headroom │  │
│  ├───────────┼───────────┼───────────┼──────────┤  │
│  │ Georgia   │ $92,000   │ $100,000  │ $8,000   │  │
│  │ Ohio      │ $88,500   │ $100,000  │ $11,500  │  │
│  └───────────┴───────────┴───────────┴──────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Content:**

**Register Now (red section):**
- States with established nexus, sorted by liability (highest first)
- Columns: State, Estimated Liability, Priority (High/Medium/Low), Trigger (Revenue/Transactions/Physical)
- Priority based on liability amount and time since nexus triggered

**Consider VDA (yellow section):**
- All nexus states shown with VDA "what if" calculation
- Columns: State, Full Liability, With VDA, Potential Savings
- VDA calculated automatically using existing VDACalculator
- Sorted by savings amount (highest first)
- Note: Shows all states as VDA candidates; discussion determines which to pursue

**Monitor (green section):**
- States at 80-99% of threshold
- Columns: State, Current Sales, Threshold, Headroom (amount until nexus)
- Sorted by headroom (smallest first - most urgent)

**Design notes:**
- Each section only appears if there are states in that category
- Clear color coding with icons (🔴🟡🟢)
- Tables should be compact - this page should rarely exceed 1 page
- If many states, prioritize top 5-7 per section with "and X more..." note

---

## Section 4: State Detail Pages

One page per state with nexus or approaching threshold. States with no nexus are NOT included (they go to appendix).

**Layout for "Has Nexus" states:**

```
┌─────────────────────────────────────────────────────┐
│  CALIFORNIA                          🔴 HAS NEXUS   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  WHY NEXUS EXISTS                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Economic nexus triggered: March 2023         │   │
│  │ • Revenue: $523,450 (threshold: $500,000)   │   │
│  │ • Transactions: 1,247 (threshold: N/A)      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  LIABILITY ESTIMATE                                 │
│  ┌────────────┬────────────┬────────────┐         │
│  │ Base Tax   │ Interest   │ Penalties  │         │
│  │ $18,200    │ $3,150     │ $2,100     │         │
│  └────────────┴────────────┴────────────┘         │
│                              Total: $23,450        │
│                                                     │
│  VDA OPPORTUNITY                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ With VDA: $21,350  │  Savings: $2,100       │   │
│  │ Penalties waived, interest retained          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  SALES BY YEAR                                      │
│  ┌──────┬────────────┬────────┬───────────┐       │
│  │ Year │ Sales      │ Txns   │ Liability │       │
│  ├──────┼────────────┼────────┼───────────┤       │
│  │ 2024 │ $312,500   │ 724    │ $14,200   │       │
│  │ 2023 │ $210,950   │ 523    │ $9,250    │       │
│  └──────┴────────────┴────────┴───────────┘       │
│                                                     │
│  COMPLIANCE REQUIREMENTS                            │
│  • Register with: CA CDTFA                         │
│  • Filing frequency: Quarterly                     │
│  • Combined tax rate: 8.68%                        │
│  • Registration URL: cdtfa.ca.gov                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Layout for "Approaching" states:**

```
┌─────────────────────────────────────────────────────┐
│  GEORGIA                            🟡 APPROACHING  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  THRESHOLD STATUS                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Revenue: $92,000 of $100,000 (92%)          │   │
│  │ ████████████████████░░░░                    │   │
│  │                                              │   │
│  │ Transactions: 145 of 200 (73%)              │   │
│  │ ██████████████░░░░░░░░░░                    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  HEADROOM                                           │
│  • $8,000 in revenue until nexus triggered         │
│  • 55 transactions until nexus triggered           │
│  • At current pace: ~2 months until threshold      │
│                                                     │
│  SALES BY YEAR                                      │
│  ┌──────┬────────────┬────────┐                   │
│  │ Year │ Sales      │ Txns   │                   │
│  ├──────┼────────────┼────────┤                   │
│  │ 2024 │ $92,000    │ 145    │                   │
│  └──────┴────────────┴────────┘                   │
│                                                     │
│  RECOMMENDATION                                     │
│  Monitor monthly. If growth continues, proactive   │
│  registration recommended before threshold to      │
│  avoid retroactive liability.                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Content details:**

**For Nexus States:**
- Why Nexus Exists: Clear statement of what triggered nexus and when
- Liability Estimate: Base tax, interest, penalties breakdown
- VDA Opportunity: Show potential savings (always included)
- Sales by Year: Summary table, not transaction-level
- Compliance Requirements: Registration info, filing frequency, tax rate, URL

**For Approaching States:**
- Threshold Status: Visual progress bars for revenue and transactions
- Headroom: How much room before nexus triggers
- Projected Timeline: Estimate when threshold will be hit (if calculable)
- Recommendation: Proactive guidance

**Design notes:**
- State name and status badge prominent at top
- Use progress bars for threshold visualization
- Keep year-by-year to summary level (no monthly breakdown)
- One state per page maximum (prevents cramming)

---

## Section 5: Appendix

Optional reference material at the end.

**A. Complete State Summary (1 page)**

Table with ALL states analyzed, for completeness:

| State | Status | Total Sales | Threshold % | Est. Liability |
|-------|--------|-------------|-------------|----------------|
| CA | Nexus | $523,450 | 105% | $23,450 |
| TX | Nexus | $287,300 | 287% | $12,100 |
| ... | ... | ... | ... | ... |

- Sorted by liability (highest first)
- Includes states with no nexus (for completeness)
- Compact format - aim for all states on one page

**B. Methodology Notes (half page)**

Brief explanation:
- How economic nexus is determined (state thresholds, OR/AND logic)
- Liability calculation approach (base tax × rate + interest + penalties)
- Data sources (state DOR published thresholds)
- Analysis period covered
- Limitations and assumptions

**C. Disclaimer (bottom of last page)**

> "This report is for informational purposes only and does not constitute tax, legal, or accounting advice. The liability estimates are based on available data and standard calculation methods. Actual tax obligations may vary based on specific circumstances, exemptions, and state regulations. Consult with a qualified tax professional before making compliance decisions."

---

## Page Footer (all pages)

```
─────────────────────────────────────────────────────
CONFIDENTIAL | [Firm Name] | Page X of Y
```

---

## Implementation Notes

### Data Requirements

The report generator will need access to:

1. **Analysis data** (existing)
   - Company name, analysis period
   - State results with nexus status, sales, transactions

2. **Liability breakdown** (existing)
   - Base tax, interest, penalties per state

3. **VDA calculations** (existing - VDACalculator)
   - Calculate VDA savings for ALL nexus states automatically
   - No user selection required for report generation

4. **Threshold data** (existing)
   - Revenue and transaction thresholds per state
   - Current percentage of threshold

5. **Compliance info** (existing)
   - Tax rates, filing frequency, registration URLs

### New Functionality Needed

1. **"Bottom Line" narrative generation**
   - Template-based sentence construction
   - Inputs: nexus count, total liability, VDA savings potential

2. **Priority assignment logic**
   - High: Liability > $10,000 or nexus > 12 months old
   - Medium: Liability $5,000-$10,000
   - Low: Liability < $5,000

3. **Projected threshold date** (for approaching states)
   - Based on sales velocity over analysis period
   - "At current pace, threshold reached in ~X months"

### Template Structure

Recommend splitting into multiple Jinja2 templates:
- `report_cover.html`
- `report_executive_summary.html`
- `report_action_items.html`
- `report_state_detail.html`
- `report_state_approaching.html`
- `report_appendix.html`

Main template assembles these with page breaks.

### Styling

- Use CSS `@page` rules for print optimization
- Consistent color scheme: Blue headers, Red/Yellow/Green status
- Professional fonts (system fonts for reliability)
- Page breaks: `page-break-before: always` for each state detail

---

## Success Criteria

1. **Professional appearance** - Could be handed to a Fortune 500 CFO
2. **30-second scan** - Executive summary conveys key message at a glance
3. **Meeting-ready** - Tax professional can present without additional prep
4. **Scalable** - 3-state report is tight; 40-state report is still navigable
5. **Actionable** - Clear recommendations on every relevant page

---

## Next Steps

1. Create new template files following this design
2. Update `report_generator.py` to use new templates
3. Add VDA auto-calculation for all nexus states in report generation
4. Add priority assignment logic
5. Add "bottom line" narrative generation
6. Test with various client sizes (small, medium, large)
