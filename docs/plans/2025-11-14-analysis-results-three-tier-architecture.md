# Analysis Results: Three-Tier Information Architecture

**Date:** 2025-11-14
**Status:** Design Complete
**Context:** Professional SALT tax workflow for lookback nexus analysis and liability estimation

---

## Executive Summary

This design establishes a clear three-tier information architecture for analysis results:

1. **State Table** - Professional triage and validation layer
2. **Quick View Modal** - "Does this need investigation?" decision checkpoint
3. **Detail Page** - Deep investigation and client presentation prep

The design optimizes for the SALT professional's workflow: quickly validate the tool's calculations across all states, identify edge cases requiring attention, and investigate specific states with transaction-level detail.

---

## User Context

**Primary User:** SALT tax professionals working for boutique to small agencies, serving multiple clients

**Core Workflow:**
1. Client engagement → Lookback nexus analysis → Liability estimation
2. Goal: Fast, rough estimates (not exact math) to help clients make decisions
3. Output: Comprehensive report for client presentation
4. Tool replaces: 12-20 hour manual process → automated in minutes

**Key Use Cases:**
- **Validation:** Did the tool get this right? What needs explanation?
- **Edge case identification:** High exempt %, marketplace splits, multi-year patterns
- **Triage:** Which states need deeper investigation before presenting to client?
- **Client prep:** Pull specific transactions, understand patterns, build narrative

---

## Three-Tier Architecture

### Mental Model
- **Layer 1 (State Table)** = Scan and validate all states
- **Layer 2 (Quick View Modal)** = Quick validation checkpoint
- **Layer 3 (Detail Page)** = Deep investigation with transaction detail

### Information Flow
```
State Table (scan 47 states)
    ↓ click row
Quick View Modal (validate determination)
    ↓ if needs investigation
Detail Page (transaction-level analysis)
    ↓ validated and ready
Report Builder (client deliverable)
```

---

## Layer 1: State Table - Professional Triage

### Purpose
Help tax professionals quickly validate the tool's calculations and spot states needing deeper review.

### Design: Priority Accordion Sections

**Section 1: Has Nexus (expanded by default)**
- Shows: All states with `nexus_status = 'has_nexus'`
- Sort: By estimated liability descending
- Why: These require action (registration/VDA), always visible
- Example: `▼ Has Nexus (8 states)`

**Section 2: Approaching Threshold (expanded by default)**
- Shows: States at 80-99% of threshold
- Sort: By threshold percentage descending
- Why: Monitor closely, potential future obligations
- Example: `▼ Approaching Threshold (2 states)`

**Section 3: Sales, but No Nexus (expanded by default)**
- Shows: States with sales > $10k but below threshold
- Sort: By gross sales descending
- Why: Validation needed - edge cases like multi-year splits, marketplace exclusions
- Example: `▼ Sales, but No Nexus (5 states)`

**Section 4: No Sales (collapsed by default)**
- Shows: States with zero transactions
- Sort: Alphabetically by state name
- Why: Clean states, minimal attention needed
- Example: `▶ No Sales (32 states)`

### Column Structure

All sections use the same column layout:

| # | Column | Data | Format | Purpose |
|---|--------|------|--------|---------|
| 1 | State | State name + code | "Florida (FL)" | Identification |
| 2 | Gross Sales | Total revenue | "$335,000" | Nexus determination basis |
| 3 | Taxable Sales | Subject to tax | "$335,000" | Liability calculation basis |
| 4 | Exempt | Exempt amount + % | "$0" or "$119K (36%)" | Tax-exempt portion |
| 5 | Threshold % | Percent of threshold with color | "335% 🔴" | Quick triage signal |
| 6 | Status | Nexus badge (color-coded) | "Economic Nexus" | Current obligation status |
| 7 | Est. Liability | Bottom-line number | "$16,750" | Financial impact |
| 8 | Actions | View Details + ellipsis menu | Buttons | Investigation actions |

### Threshold % Column Details
- **Color coding:**
  - 🟢 Green: <80% (comfortably under)
  - 🟡 Yellow: 80-99% (approaching)
  - 🔴 Red: ≥100% (triggered)
- **Tooltip on hover:** "Florida: $335,000 of $100,000 threshold (335%)"
- **Alignment:** Right-aligned with other numbers
- **Purpose:** Quick triage signal during validation scan

### Visual Flags (Future Enhancement)
- High exempt percentage (>50%)
- Unusual patterns (all marketplace or all direct)
- Multi-year edge cases
- States with notes/flags added by professional

### What We Removed
- ❌ Duplicate "Total Sales" column (redundant with Gross Sales)
- ❌ Direct/Marketplace split in table (moved to Quick View Modal - critical context but clutters table)

---

## Layer 2: Quick View Modal - Validation Checkpoint

### Purpose
Quick validation check - "Can I move on to the next state, or does this one need deeper investigation?"

### Modal Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [State Name] - Quick Summary              [✓ Mark Reviewed] [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Status Badge: Economic Nexus]                              │
│                                                             │
│ Why This Determination:                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ Economic Nexus Triggered - Sep 14, 2024              │ │
│ │ • Exceeded $100,000 threshold with $335,000 in sales   │ │
│ │ • All sales are direct (marketplace: $0)                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Quick Facts:                                                │
│   Gross Sales:        $335,000                              │
│   Taxable Sales:      $335,000                              │
│   Exempt Sales:       $0                                    │
│   ─────────────────────────────                            │
│   Direct Sales:       $335,000  (100%)                      │
│   Marketplace Sales:  $0        (0%)                        │
│   ─────────────────────────────                            │
│   Transactions:       12                                    │
│   Date Range:         Jan - Dec 2024                        │
│   Tax Rate:           6.5%                                  │
│   Est. Liability:     $16,750                               │
│                                                             │
│ Recommended Action:                                         │
│ • Register for sales tax permit                             │
│ • Consider VDA if lookback liability exists                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     [Close]    [View Full Analysis →]       │
└─────────────────────────────────────────────────────────────┘
```

### "Why This Determination" Variations

**Scenario 1: Straightforward Economic Nexus (Florida)**
```
┌─────────────────────────────────────────────────────────┐
│ ✓ Economic Nexus Triggered - Sep 14, 2024              │
│ • Exceeded $100,000 threshold with $335,000 in sales   │
│ • All sales are direct (marketplace: $0)                │
└─────────────────────────────────────────────────────────┘
```

**Scenario 2: Multi-Year Split (California)**
```
┌─────────────────────────────────────────────────────────┐
│ ✓ No Nexus - Sales Split Across Years                  │
│ • Total sales: $329,500 across 2023-2024               │
│ • 2023: $145,000 (below $100,000 threshold)            │
│ • 2024: $184,500 (below $100,000 threshold)            │
│ • Note: Each year evaluated independently               │
└─────────────────────────────────────────────────────────┘
```

**Scenario 3: Marketplace Facilitator Exclusion (Texas)**
```
┌─────────────────────────────────────────────────────────┐
│ ✓ No Nexus - Marketplace Facilitator Exclusion         │
│ • Total sales: $345,000                                 │
│ • Marketplace sales: $280,000 (excluded per TX rules)  │
│ • Direct sales: $65,000 (below $500,000 threshold)     │
└─────────────────────────────────────────────────────────┘
```

**Scenario 4: High Exempt Percentage (Pennsylvania)**
```
┌─────────────────────────────────────────────────────────┐
│ ✓ Has Nexus - But Zero Liability                       │
│ • Exceeded $100,000 threshold with $295,000 in sales   │
│ • All sales are tax-exempt (groceries/manufacturing)   │
│ • Taxable sales: $0 → Estimated liability: $0          │
│ • Note: Nexus obligation exists, but no tax due        │
└─────────────────────────────────────────────────────────┘
```

### Key Features
- **Direct/Marketplace split:** Critical validation context, shows percentage breakdown
- **Transaction count & date range:** Spot data quality issues (1 transaction = $335K might indicate problem)
- **Close button:** Return to table without going to Detail Page
- **Mark as Reviewed (optional):** Quick validation action right in modal
- **View Full Analysis:** Navigate to Detail Page for deep investigation

### Time Investment
- **Target:** 10-30 seconds per state
- **Decision:** "Move on" or "Investigate deeper"

---

## Layer 3: Detail Page - Deep Investigation

### Purpose
Complete analysis with transaction-level detail, compliance info, and everything needed for client conversations or report building.

### Page Structure

#### 1. Header Section
- **Breadcrumbs:** Analyses > Analysis Results > FL - Florida
- **Year selector:** Toggle between individual years or "All Years" view
- **Period display:** "Analysis Period: Jan 1, 2024 - Dec 31, 2024"
- **Export options:** PDF/Excel for client delivery

#### 2. Executive Summary Cards
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Gross Sales     │ │ Taxable Sales   │ │ Exempt Sales    │ │ Transactions    │
│ $335,000        │ │ $335,000        │ │ $0              │ │ 12              │
│ Total revenue   │ │ Subject to tax  │ │ Tax-exempt      │ │ # of trans.     │
│ (for nexus)     │ │ (for liability) │ │ portion         │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

#### 3. Sales Breakdown - Visual Equation
Shows the Gross → Exempt → Taxable relationship:
```
┌──────────────────────────────────────────────────────────────┐
│ Sales Breakdown                                               │
│                                                               │
│  $335,000         -        $0          =      $335,000       │
│  Gross Sales             Exempt              Taxable         │
│                                                               │
│  Direct: $335,000 (100%)  │  Marketplace: $0 (0%)            │
└──────────────────────────────────────────────────────────────┘
```

**Purpose:** Visual representation helps explain to clients how gross sales breaks down into taxable and exempt portions.

#### 4. Nexus & Liability Summary
```
┌──────────────────────────────────────────────────────────────┐
│ Nexus Determination                                           │
│ Status: [Economic Nexus Badge]                                │
│ Triggered: September 14, 2024                                 │
│ Threshold: $335,000 of $100,000 (335%)                       │
│                                                               │
│ Estimated Liability                                           │
│ Base Tax:        $21,775                                      │
│ Interest:        $1,250                                       │
│ Penalties:       $0 (waived under VDA)                       │
│ ─────────────────────────────                                │
│ Total Liability: $23,025                                      │
│                                                               │
│ [Show Calculation Details]                                    │
└──────────────────────────────────────────────────────────────┘
```

#### 5. Transaction Table (Expanded by Default)

**Header:**
```
▼ All Transactions (547 total)                    [Export CSV]
   [🔍 Search by ID or amount] [Filter ▾] [Sort: Date ▾]

Filters: [Channel: All ▾] [Status: All ▾] [Date Range ▾] [Amount Range ▾]

Showing 1-25 of 547 transactions
```

**Table:**
```
Date     | Trans ID | Gross   | Taxable | Exempt | Channel     | Running Total
─────────────────────────────────────────────────────────────────────────────
Jan 5    | TX-001   | $25,000 | $25,000 | -      | Direct      | $25,000
Jan 8    | TX-002   | $30,000 | -       | $30,000| Marketplace | $55,000
Jan 12   | TX-003   | $28,000 | $28,000 | -      | Direct      | $83,000
...
Jan 28   | TX-025   | $32,000 | $32,000 | -      | Direct      | $625,000

                    [← Previous] [1] [2] 3 ... [22] [Next →]
```

**Pagination & Filtering:**
- **Default view:** First 25 transactions with pagination
- **Scope indicator:** "Showing 1-25 of 547 transactions"
- **Page size:** 25 transactions per page (balance between context and performance)
- **Not threshold-focused:** Shows all transactions chronologically, not filtered to threshold-crossing

**Filter Options:**
- **Channel:** All / Direct / Marketplace
- **Status:** All / Taxable / Exempt / Partial Exempt
- **Date Range:** Custom picker or presets (Q1, Q2, Q3, Q4, Custom)
- **Amount Range:** Min/Max inputs (e.g., $1,000 - $50,000)

**Search:**
- Type-ahead search that filters as you type
- Search by: Transaction ID or amount
- Example: Search "$30000" shows all $30,000 transactions

**Sort Options:**
- Date (ascending/descending)
- Amount (high to low / low to high)
- Channel
- Taxable amount

**Export:**
- CSV format with all columns
- Respects current filters (export filtered results or all)
- Filename: `[StateCode]_[Year]_transactions.csv` (e.g., `FL_2024_transactions.csv`)

**Use Cases:**
1. **Validation:** Spot-check classifications across entire period
2. **Pattern detection:** Filter marketplace to see if classifications are consistent
3. **Client questions:** "Show me a typical transaction" or "Why was this exempt?"
4. **Edge case investigation:** Find specific transactions that need explanation

#### 6. Monthly Trend Chart (Optional - Collapsed by Default)
```
▶ Monthly Sales Trend
  [Line chart showing monthly sales progression]
```

#### 7. Compliance Information (Accordion - Collapsed by Default)

```
▶ Registration & Filing Requirements
  • Registration URL: [link]
  • Filing frequency: Monthly / Quarterly / Annual
  • Permit requirements: [state-specific info]
  • Estimated time to register: 2-4 weeks

▶ Tax Rates
  • State rate: 6.0%
  • Average local rate: 0.5%
  • Combined average: 6.5%
  • Note: Actual rate depends on buyer location

▶ Exemption Rules
  • Resale certificates: Accepted
  • Manufacturing exemptions: [state-specific]
  • Grocery/food exemptions: [state-specific]
```

### Key Differences from Quick View
- **Transaction table:** Full detail with pagination, filtering, export
- **Year-by-year breakdown:** Multi-year view with per-year summaries
- **Monthly sales chart:** Visual trend analysis
- **Full compliance section:** Registration, filing, tax rates
- **Export/print capabilities:** Client deliverable generation
- **Calculation details:** Show-your-work transparency

### Time Investment
- **Target:** 2-10 minutes per state requiring action
- **Activities:** Transaction validation, client prep, narrative building

---

## User Flow Examples

### Scenario 1: Straightforward Case (Florida)
**Context:** Florida shows economic nexus triggered, high liability

1. **State Table:** See FL with 335% threshold, $16,750 liability → looks normal
2. **Click row → Quick View Modal:**
   - "Why This Determination" shows: "Triggered Sep 14, all direct sales"
   - Quick Facts confirm: 12 transactions, all direct, no exempt
   - ✓ Makes sense
3. **Close modal → Mark as reviewed**
4. **Move to next state**

**Time:** 20 seconds
**Outcome:** Validated, ready for report

---

### Scenario 2: Edge Case (California)
**Context:** California shows $329K in sales but NO nexus, 66% threshold

1. **State Table:** See CA with $329K sales but NO nexus, 66% threshold → ❓ Why?
2. **Click row → Quick View Modal:**
   - "Why This Determination" shows: "Sales split across 2023-2024, each year below threshold"
   - 2023: $145K (below $100K threshold)
   - 2024: $184.5K (below $100K threshold)
   - Ah! Each year evaluated independently
3. **Close modal → Mark as reviewed**
4. **Add note:** "Multi-year split, explain to client if asked"

**Time:** 30 seconds
**Outcome:** Edge case understood, validated

---

### Scenario 3: Needs Investigation (Texas)
**Context:** Texas shows $345K sales but NO nexus, threshold shows N/A

1. **State Table:** See TX with $345K sales but NO nexus → ❓ What's happening?
2. **Click row → Quick View Modal:**
   - "Why This Determination" shows: "$280K marketplace (excluded), $65K direct (below $500K threshold)"
   - Interesting pattern - mostly marketplace
   - Need to verify classifications are correct
3. **View Full Analysis → Detail Page**
4. **Transaction table:**
   - Filter: Marketplace → 15 transactions totaling $280K
   - Filter: Direct → 3 transactions totaling $65K
   - Spot-check: All marketplace transactions correctly classified (Amazon/eBay orders)
5. **Add note for client:** "Mostly marketplace sales, likely fulfilled by Amazon/eBay. Marketplace facilitator handles collection, so no TX nexus despite high sales."
6. **Mark as reviewed**

**Time:** 3 minutes
**Outcome:** Pattern validated, client explanation prepared

---

### Scenario 4: High-Volume Validation (New York)
**Context:** New York shows nexus with 547 transactions, need to spot-check

1. **State Table:** See NY with nexus, $342K taxable, $45K exempt (12%) → Need to verify exempt classifications
2. **Quick View Modal:** Shows mix of taxable/exempt, move to Detail Page
3. **Detail Page → Transaction Table:**
   - Filter: Status = Exempt → 47 transactions
   - Sort: Amount (high to low)
   - Spot-check top 10 exempt transactions
   - All correctly classified as "Food" or "Grocery"
4. **Filter: Status = Taxable → 500 transactions**
   - Random spot-check: Transaction #125, #250, #400
   - All correctly classified as "Services" or "Software"
5. **Export CSV:** Download full dataset for records
6. **Mark as reviewed**

**Time:** 5 minutes
**Outcome:** Classifications validated, ready for report

---

## Design Principles Applied

### 1. Progressive Disclosure
- **State Table:** High-level scan (30-60 sec per state)
- **Quick View Modal:** Validation checkpoint (10-30 sec)
- **Detail Page:** Deep investigation (2-10 min)

Information revealed progressively as user needs increase.

### 2. Optimize for the Common Case
- **80% of states:** Quick validation via table + modal
- **20% of states:** Deep investigation via Detail Page
- Design prioritizes fast validation over exhaustive detail

### 3. Professional Trust with Transparency
- Tool makes determinations (nexus status, liability)
- "Why This Determination" explains reasoning
- Transaction table allows spot-checking
- Balance: Trust the tool, but verify when needed

### 4. Client-Facing vs. Professional-Facing
- **Professional-facing:** Layers 1-3 (validation workflow)
- **Client-facing:** Layer 4 (Report Builder, not covered in this doc)
- Clear separation between internal QA and external deliverables

### 5. Reduce Cognitive Load
- Accordion sections group states by priority
- Color coding for quick triage (🟢🟡🔴)
- "Why This Determination" box answers the immediate question
- Filters and search reduce noise in high-volume datasets

---

## Implementation Priorities

### Phase 1: Core Validation Workflow (MVP)
- ✅ State Table with accordion sections
- ✅ Threshold % column with color coding
- ✅ Quick View Modal with "Why This Determination"
- ✅ Basic Detail Page with transaction table (paginated)

### Phase 2: Enhanced Filtering & Validation
- ⬜ Transaction table filters (Channel, Status, Date Range, Amount)
- ⬜ Search functionality
- ⬜ Mark as Reviewed action
- ⬜ Visual flags for edge cases

### Phase 3: Client Prep Features
- ⬜ Sales Breakdown visual equation
- ⬜ Monthly trend chart
- ⬜ Enhanced compliance information
- ⬜ Export/print options

### Phase 4: Professional Enhancements
- ⬜ Notes/tags per state
- ⬜ Calculation detail modals
- ⬜ Compare states side-by-side
- ⬜ Custom reporting options

---

## Success Metrics

**Validation Speed:**
- Time to review 10 states: Target <5 minutes (currently: 30 min manual)
- Modal usage: >80% of states validated via Quick View, <20% need Detail Page

**Professional Confidence:**
- "I understand why the tool made this determination": >90%
- Edge case identification rate: Track how often professionals catch issues

**Client Readiness:**
- States marked as "reviewed and ready for report": Track completion %
- Notes added per analysis: Measure how much context professionals add

---

## Related Documents

- **Report Builder Design:** (To be created - Layer 4 of the workflow)
- **Calculation Logic Documentation:** How nexus and liability are determined
- **Testing Guide:** `docs/TESTING_GUIDE.md` - Validation test cases

---

## Appendix: Column Comparison (Before/After)

### Before (Current State)
State | Gross Sales | Taxable Sales | Exempt | Status | Total Sales | Threshold | Est. Liability | Actions

**Issues:**
- "Gross Sales" and "Total Sales" are redundant
- No threshold percentage visible
- Direct/Marketplace split clutters the table
- No clear priority grouping

### After (New Design)
State | Gross Sales | Taxable Sales | Exempt | Threshold % | Status | Est. Liability | Actions

**Improvements:**
- Remove duplicate "Total Sales" column
- Add threshold % with color coding for quick triage
- Move Direct/Marketplace split to Quick View Modal
- Group states by priority with accordion sections
- Cleaner, more focused on validation workflow

---

## Changelog

**2025-11-14:**
- Initial design document created
- Three-tier architecture defined
- Accordion section structure finalized
- Quick View Modal variations documented
- Detail Page transaction table design completed
- User flow examples added

---

**Status:** ✅ Design Complete - Ready for Implementation
