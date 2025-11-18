# SALT Professional Validation Guide
## NexusCheck Calculator Logic Review

**Purpose:** This document maps out the current nexus calculation logic for review by a sales tax professional.
**Intended Reviewer:** Jordan (Domain Expert - Phase 4)
**Created:** 2025-11-17
**Calculator Version:** V2 (Multi-year, chronological processing)

---

## Table of Contents

1. [Overview & Calculation Flow](#1-overview--calculation-flow)
2. [Nexus Determination Logic](#2-nexus-determination-logic)
3. [Lookback Period Types](#3-lookback-period-types)
4. [Liability Calculation](#4-liability-calculation)
5. [Interest & Penalties](#5-interest--penalties)
6. [Sticky Nexus Logic](#6-sticky-nexus-logic)
7. [Marketplace Facilitator Rules](#7-marketplace-facilitator-rules)
8. [Validation Questions for SALT Professional](#8-validation-questions-for-salt-professional)
9. [Real-World Scenarios](#9-real-world-scenarios)
10. [Code References](#10-code-references)

---

## 1. Overview & Calculation Flow

### High-Level Process

```
User uploads transactions → System processes → Calculates nexus for all 51 jurisdictions →
Determines liability per year per state → Calculates interest/penalties → Displays results
```

### Detailed Flow

**For each analysis:**

1. **Load Data**
   - All transactions (chronologically ordered)
   - State threshold rules (revenue/transaction thresholds)
   - Tax rates (combined state + local average)
   - Marketplace facilitator rules
   - Interest/penalty rates
   - User-provided physical nexus dates

2. **Group by State**
   - Separate transactions by customer state (51 jurisdictions: 50 states + DC)

3. **For Each State:**
   - Determine if nexus exists (economic or physical)
   - Find exact date threshold was crossed
   - Calculate obligation start date
   - Calculate tax liability for each year
   - Calculate interest from first taxable sale
   - Calculate penalties based on state rules

4. **Generate Results**
   - Per-state, per-year breakdown
   - Summary totals
   - Save to database

**Code Location:** `/backend/app/services/nexus_calculator_v2.py` lines 37-131

---

## 2. Nexus Determination Logic

### 2.1 Economic Nexus Threshold Logic

**Current Implementation:**

```
For each state:
  1. Use GROSS SALES (sales_amount field) for threshold calculation
  2. Process transactions chronologically (oldest to newest)
  3. Track running totals:
     - running_total (cumulative revenue)
     - running_count (cumulative transaction count)
  4. Compare against thresholds:
     - Revenue threshold (e.g., $100,000)
     - Transaction threshold (e.g., 200 transactions)
  5. Apply operator logic (state-specific):
     - 'or' operator: Revenue >= threshold OR transactions >= threshold
     - 'and' operator: Revenue >= threshold AND transactions >= threshold
  6. When threshold met: Record exact date as nexus date
```

**Key Decision:** Uses `sales_amount` (gross revenue) NOT `taxable_amount`

**Code Location:** Lines 922-981

---

### ❓ VALIDATION QUESTIONS - Nexus Determination

#### Q1: Gross Revenue vs Net Revenue for Thresholds
**Current:** Uses gross sales (before exemptions)
**Question:** Is this correct for all states? Should any states use:
- Net taxable sales?
- Sales after returns/refunds?
- Different basis for economic nexus measurement?

#### Q2: Marketplace Sales Inclusion in Thresholds
**Current:** Marketplace sales ARE counted toward threshold
**Question:** Is this correct for all states?
- Do all states include marketplace facilitator sales in threshold calculation?
- Are there states that exclude MF sales from threshold determination?

#### Q3: Threshold Operator Logic
**Current:**
- Most states: 'or' (revenue OR transactions)
- CT, NY: 'and' (revenue AND transactions)

**Question:** Please confirm which states use 'and' vs 'or' operators:
- Is NY really 'and'? (NY has 100-transaction threshold, not 200)
- Is CT correct as 'and'?
- Are there other states with 'and' logic?

#### Q4: Transaction Count Definition
**Current:** Each row in CSV = 1 transaction
**Question:**
- Is this the correct definition across states?
- Should multiple line items in a single order count as 1 or multiple transactions?
- How should refunds/returns be counted?

---

### 2.2 Physical Nexus Logic

**Current Implementation:**

```
If user provides physical nexus date for a state:
  1. Physical nexus applies to that year and all future years
  2. If physical nexus exists AND economic nexus exists:
     - Nexus type = "both"
     - Use earlier of physical or economic date
  3. If ONLY physical nexus:
     - Nexus type = "physical"
     - Use physical nexus date
     - Obligation starts immediately (no "month following" rule)
```

**Code Location:** Lines 265-272, 349-362

---

### ❓ VALIDATION QUESTIONS - Physical Nexus

#### Q5: Physical Nexus Obligation Start
**Current:** Physical nexus obligation starts on the date provided (no delay)
**Question:** Is this correct, or should physical nexus also use "first day of month following" rule?

#### Q6: Physical + Economic Combination
**Current:** When both exist, uses earlier date and labels as "both"
**Question:** Is this the correct approach? Should one type take precedence?

---

## 3. Lookback Period Types

The calculator implements 4 different lookback period types based on state rules.

### 3.1 Calendar Year Lookback (Phase 1A)

**Two Variants Implemented:**

**Variant A: "Previous Calendar Year"**
```
To determine nexus for 2024:
  1. Look at sales in 2023 (prior calendar year)
  2. If threshold met in 2023 → Nexus for 2024
  3. Also check 2024 itself for current-year nexus
```

**Variant B: "Current or Previous Calendar Year"**
```
To determine nexus for 2024:
  1. Check 2024 sales first
  2. Check 2023 sales if 2024 doesn't meet threshold
  3. Either year meeting threshold = nexus for 2024
```

**Code Location:** Lines 222-399

---

### ❓ VALIDATION QUESTIONS - Calendar Year Lookback

#### Q7: Which States Use Which Variant?
**Current:** Implementation supports both, but needs state-by-state mapping
**Question:** Please provide the definitive list:
- Which states use "Previous Calendar Year" only?
- Which states use "Current or Previous Calendar Year"?
- Are there states that ONLY look at current year (no prior year)?

#### Q8: Mid-Year Implementation
**Current:** If threshold met in June 2024, nexus starts July 2024
**Question:** For calendar year states, is this correct? Or should:
- Nexus for full year 2024 apply retroactively?
- Obligation only apply to remainder of 2024?

---

### 3.2 Rolling 12-Month Lookback (Phase 1B)

**Implementation:**

```
For each month in the analysis period:
  1. Calculate 12-month window: Current month + prior 11 months
  2. Sum all sales in that 12-month window
  3. Check if window total meets threshold
  4. First window meeting threshold = nexus date
  5. Obligation starts first day of month following nexus

Example (Texas):
  Jan 2023: $20K → 12-month window: $20K → No nexus
  Feb 2023: $25K → 12-month window: $45K → No nexus
  Mar 2023: $30K → 12-month window: $75K → No nexus
  Apr 2023: $35K → 12-month window: $110K → NEXUS! (April 2023)
  May 2023: $10K → Obligation starts May 1, 2023
```

**States Using This Method (Current):** IL, TX, TN, MN, MS, and others

**Code Location:** Lines 405-584

---

### ❓ VALIDATION QUESTIONS - Rolling 12-Month

#### Q9: Rolling Window States
**Current:** Hardcoded list of states using rolling 12-month
**Question:** Please provide complete list of states using rolling 12-month lookback

#### Q10: Window Boundary Dates
**Current:** Uses calendar month boundaries (e.g., June 1 - May 31)
**Question:**
- Is this correct, or should it be any consecutive 12-month period?
- Do states specify how the rolling window is measured?

---

### 3.3 Quarterly Lookback (Phase 1C - NY, VT)

**Implementation:**

```
For each quarter in the year:
  1. Look back at "preceding 4 sales tax quarters"
  2. A quarter = Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec
  3. Sum sales in those 4 complete quarters
  4. Check if total meets threshold
  5. First quarter meeting threshold = nexus

Example (New York, checking Q2 2024):
  - Current quarter: Q2 2024 (Apr-Jun)
  - Preceding 4 quarters: Q2 2023, Q3 2023, Q4 2023, Q1 2024
  - Sum sales from those 4 quarters
  - If ≥ threshold → Nexus for Q2 2024
  - Obligation starts first day of Q3 2024 (July 1)
```

**States Using This Method:** NY, VT

**Code Location:** Lines 590-752

---

### ❓ VALIDATION QUESTIONS - Quarterly Lookback

#### Q11: Quarterly Lookback Interpretation
**Current:** "Preceding 4 quarters" means the 4 quarters BEFORE current quarter
**Question:**
- Is this interpretation correct?
- Does "preceding" mean "prior to" or "including"?
- NY specific: Uses 100-transaction threshold (not 200) - is this correct?

#### Q12: Quarter Definition
**Current:** Calendar quarters (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec)
**Question:** Do all states use calendar quarters, or do any use fiscal quarters?

---

### 3.4 Connecticut September 30 Special (Phase 1D)

**Implementation:**

```
Connecticut uses a special fiscal-year lookback:

  To determine nexus for 2024:
    - Measurement period: Oct 1, 2023 - Sep 30, 2024
    - If sales in that period meet threshold → Nexus for 2024
    - Obligation starts first day of month following nexus in that period

Example:
  Period: Oct 1, 2023 - Sep 30, 2024
  Total sales: $150,000
  Threshold: $100,000
  Result: Nexus for calendar year 2024
```

**Code Location:** Lines 758-901

---

### ❓ VALIDATION QUESTIONS - Connecticut Special

#### Q13: Connecticut Period Confirmation
**Current:** Oct 1 - Sep 30 for prior year - current year
**Question:**
- Is this fiscal period correct for Connecticut?
- Does CT obligation apply to full calendar year or just the fiscal period?

---

## 4. Liability Calculation

### 4.1 Sales Categorization

The calculator tracks three types of sales:

```
For each transaction:
  1. exempt_sales = Sales explicitly marked as exempt OR transactions with is_taxable=False
  2. taxable_sales = All sales that are taxable (for threshold tracking)
  3. exposure_sales = Taxable sales during obligation period (for liability)

Key distinction:
  - taxable_sales = Full year (used for threshold)
  - exposure_sales = Only from obligation_start_date forward (used for liability)
```

**Code Location:** Lines 1036-1094

---

### ❓ VALIDATION QUESTIONS - Liability Calculation

#### Q14: Combined Tax Rate Accuracy
**Current:** Uses a single combined rate (state + average local) per state
**Question:**
- Is using an average combined rate acceptable for estimates?
- Should liability be calculated at destination (customer) zip code level?
- How should rates be handled for states with origin-based sourcing?

#### Q15: Exempt Sales Handling
**Current:** Three-tier logic:
  1. If `exempt_amount` provided → Use it
  2. If `is_taxable=False` → Full amount exempt
  3. Else → Full amount taxable

**Question:** Is this logic comprehensive? Are there edge cases:
- Partially exempt transactions (some items exempt, others not)?
- State-specific exemptions (e.g., clothing in some states)?
- Exemption certificates handling?

#### Q16: Use Tax vs Sales Tax
**Current:** Calculator only calculates sales tax
**Question:** Should use tax be calculated separately? When does use tax apply vs sales tax?

---

### 4.2 Marketplace Facilitator Impact

**Current Logic:**

```
Threshold Calculation:
  ✅ Marketplace sales ARE counted toward threshold

Liability Calculation:
  ✅ Marketplace sales are EXCLUDED from liability

Rationale:
  - Marketplace facilitator (Amazon, eBay, etc.) collects and remits tax
  - Seller doesn't owe tax on those sales
  - But sales count toward determining if seller has nexus
```

**Code Location:** Lines 1083-1094

---

### ❓ VALIDATION QUESTIONS - Marketplace Facilitator

#### Q17: MF Sales Threshold Inclusion
**Current:** MF sales count toward threshold for ALL states
**Question:**
- Is this universal across all states?
- Are there states that don't count MF sales toward seller's threshold?

#### Q18: MF Liability Exclusion
**Current:** MF sales always excluded from seller liability
**Question:**
- Is this correct for all states?
- Are there exceptions where seller still has liability even with MF?
- What about commingled inventory scenarios?

#### Q19: Sales Channel Classification
**Current:** Transactions tagged as "direct" or "marketplace"
**Question:**
- Is this binary classification sufficient?
- How should "fulfillment by marketplace" be handled?
- What about sales through multiple channels?

---

## 5. Interest & Penalties

### 5.1 Interest Calculation

**Current Logic:**

```
Interest accrues on unpaid tax liability:

  1. Start Date: First date of taxable sale during obligation period
     (NOT obligation start date - interest only on actual unpaid tax)

  2. End Date: Analysis calculation date (typically current date)

  3. Interest Rate: State-specific annual rate

  4. Method: State-specific
     - Simple interest (most common): Principal × Rate × Years
     - Compound monthly: Principal × [(1 + Rate/12)^months - 1]
     - Compound daily: Principal × [(1 + Rate/365)^days - 1]
```

**Example:**
```
State: California (6% simple interest)
Obligation starts: July 1, 2023
First taxable sale: September 15, 2023
Tax owed: $5,000
Days outstanding: 450 days (Sept 15, 2023 - Dec 31, 2024)

Interest = $5,000 × 0.06 × (450/365) = $369.86
```

**Code Location:**
- Main: Lines 1110-1172
- Interest Calculator: `/backend/app/services/interest_calculator.py`

---

### ❓ VALIDATION QUESTIONS - Interest

#### Q20: Interest Start Date
**Current:** Interest starts on first taxable sale date (when liability first exists)
**Question:** Is this correct? Considerations:
- Should interest start on obligation date even with no sales?
- Should interest start when return was due (not when sale occurred)?
- Do states have filing periods that affect interest start?

#### Q21: Interest Calculation Methods by State
**Current:**
- Simple interest (default)
- Compound monthly (TX at 1.5%/month)
- Compound daily (NY, few others)

**Question:** Please provide state-by-state mapping:
- Which states use simple vs compound?
- What are the correct rates per state?
- Do rates change over time?

#### Q22: Interest Base Amount
**Current:** Interest calculated on base tax only (not tax + penalties)
**Question:**
- Is this correct for all states?
- Do any states compound interest on top of penalties?

---

### 5.2 Penalty Calculation

**Current Logic:**

```
Penalties calculated separately from interest:

  1. Penalty Rate: State-specific percentage

  2. Penalty Base: Configurable per state
     - Base tax only (most common)
     - OR base tax + interest

  3. Min/Max Constraints: State-specific
     - Minimum penalty amount
     - Maximum penalty percentage

  4. VDA Impact: Most states waive penalties in VDA
```

**Code Location:** Interest Calculator Lines 228-279

---

### ❓ VALIDATION QUESTIONS - Penalties

#### Q23: Penalty Types
**Current:** Single penalty rate applied to base
**Question:** Should calculator distinguish between:
- Late filing penalty
- Late payment penalty
- Late registration penalty
- Negligence penalty
- Different rates for different penalty types?

#### Q24: First-Time Filer Leniency
**Current:** No special handling for first-time filers
**Question:**
- Do states offer penalty waivers for first-time filers?
- Should calculator have a "first-time" mode?

#### Q25: Statute of Limitations
**Current:** No lookback limit (calculates all years with data)
**Question:**
- Should calculator limit to 3-4 years (typical statute)?
- Does statute vary by state?
- How does VDA affect statute?

---

## 6. Sticky Nexus Logic

### 6.1 How Sticky Nexus Works

**Current Implementation:**

```
Once nexus is established in ANY year, it "sticks" to all future years:

Example:
  Year 1 (2023): Sales $150K → Threshold crossed June 2023
    - Nexus date: June 15, 2023
    - Obligation: July 1, 2023 - Dec 31, 2023
    - first_nexus_year = 2023

  Year 2 (2024): Sales $50K (below threshold)
    - Still has nexus (sticky from 2023)
    - Obligation: Jan 1, 2024 - Dec 31, 2024 (FULL YEAR)
    - Liability calculated on $50K

  Year 3 (2025): Sales $30K (below threshold)
    - Still has nexus (sticky from 2023)
    - Obligation: Jan 1, 2025 - Dec 31, 2025 (FULL YEAR)
```

**Key Points:**
- Once nexus is established, it doesn't go away
- Future years get FULL YEAR obligation (Jan 1 start)
- Liability calculated even if below threshold

**Code Location:** Lines 279-287

---

### ❓ VALIDATION QUESTIONS - Sticky Nexus

#### Q26: Sticky Nexus Duration
**Current:** Nexus never expires (perpetual once established)
**Question:**
- Is this correct for all states?
- Can nexus be "lost" if below threshold for X consecutive years?
- Do states require annual re-evaluation?

#### Q27: De-Registration
**Current:** No mechanism for voluntary de-registration
**Question:**
- Should calculator support voluntary de-registration?
- If seller stops all sales in a state, when can they de-register?
- What's the process for ending nexus?

#### Q28: Threshold Changes
**Current:** Sticky nexus persists even if thresholds increase
**Question:**
- If a state increases threshold (e.g., $100K → $250K), does old nexus stay valid?
- Should there be a "grandfathering" period?

---

## 7. Marketplace Facilitator Rules

### 7.1 Current Implementation

```yaml
Marketplace Facilitator Logic:

Sales Classification:
  - direct_sales: Sales through seller's own channels
  - marketplace_sales: Sales through Amazon, eBay, Etsy, etc.

Threshold Determination:
  INCLUDE marketplace sales: Yes ✅
  Reason: Marketplace sales show economic presence

Liability Calculation:
  EXCLUDE marketplace sales: Yes ✅
  Reason: Marketplace collects and remits tax

State-Specific Rules:
  - Configurable per state via marketplace_facilitator_rules table
  - Field: exclude_from_liability (default: true)
  - Can be overridden for states with different rules
```

**Code Location:** Lines 1076-1094

---

### ❓ VALIDATION QUESTIONS - Marketplace Facilitator

#### Q29: Universal MF Treatment
**Current:** All states treat MF the same (include threshold, exclude liability)
**Question:**
- Are there states with different MF rules?
- What about states that enacted MF laws later?
- Historical data before MF laws - how should it be treated?

#### Q30: Effective Dates
**Current:** No date-based MF rule application
**Question:**
- Most states enacted MF laws 2019-2020. Should calculator apply rules only after effective date?
- If analyzing 2018 data, should MF sales be treated differently?

---

## 8. Validation Questions for SALT Professional

### Priority 1: Critical Calculation Logic

| # | Question | Current Implementation | Impact if Wrong |
|---|----------|----------------------|-----------------|
| Q1 | Gross vs net revenue for thresholds | Gross sales | High - Wrong threshold determination |
| Q2 | MF sales in threshold calculation | Included | High - Wrong nexus date |
| Q7 | Calendar year lookback variants | Both variants coded | High - Wrong lookback application |
| Q14 | Combined tax rate accuracy | Average combined rate | Medium - Liability estimate accuracy |
| Q20 | Interest start date | First sale date | Medium - Interest amount accuracy |

### Priority 2: State-Specific Rules

| # | Question | Current Implementation | Impact if Wrong |
|---|----------|----------------------|-----------------|
| Q3 | Threshold operator by state | Most 'or', few 'and' | Medium - Wrong nexus for specific states |
| Q9 | Rolling window states | Hardcoded list | Medium - Wrong lookback for specific states |
| Q11 | Quarterly lookback interpretation | Preceding 4 quarters | Medium - Wrong for NY/VT |
| Q13 | Connecticut special period | Oct 1 - Sep 30 | Low - Only affects CT |
| Q21 | Interest methods by state | Simple/compound list | Low - Interest accuracy |

### Priority 3: Edge Cases & Features

| # | Question | Current Implementation | Impact if Wrong |
|---|----------|----------------------|-----------------|
| Q15 | Exempt sales handling | Three-tier logic | Low - Can be refined later |
| Q23 | Penalty types | Single penalty | Low - Enhancement not blocker |
| Q25 | Statute of limitations | No limit | Low - Conservative approach |
| Q26 | Sticky nexus duration | Perpetual | Medium - May over-estimate obligation |
| Q30 | MF effective dates | No date logic | Low - Historical accuracy |

---

## 9. Real-World Scenarios

### Scenario 1: Simple Economic Nexus (California)

**Facts:**
```
Business: E-commerce seller
State: California
Year: 2024
Transactions:
  - Q1 2024: $50,000 (50 transactions)
  - Q2 2024: $60,000 (60 transactions) - Crosses $100K on May 15
  - Q3 2024: $40,000 (40 transactions)
  - Q4 2024: $30,000 (30 transactions)
Total: $180,000 (180 transactions)
```

**Expected Calculation:**
```
Nexus Date: May 15, 2024 (when cumulative sales hit $100,000)
Obligation Start: June 1, 2024
Taxable Period: June 1 - Dec 31, 2024
Exposure Sales: Q2 (partial from June) + Q3 + Q4 = ~$85,000
Tax Rate: 8.25% (combined state + local avg)
Base Tax: $85,000 × 0.0825 = $7,012.50
Interest: From first June sale to today (6% simple)
```

**Validation Needed:**
- [ ] Confirm $100K threshold for CA
- [ ] Confirm 8.25% combined rate is appropriate
- [ ] Confirm obligation starts "month following" nexus
- [ ] Confirm 6% simple interest for CA

---

### Scenario 2: Rolling 12-Month (Texas)

**Facts:**
```
Business: SaaS company
State: Texas
Analysis Period: 2023-2024
Monthly Sales Pattern:
  2023: $8K/month × 12 months = $96,000 (below $500K threshold)
  2024 Jan-Apr: $10K/month = $40,000
  2024 May: $30,000 (big deal)
  2024 Jun-Dec: $10K/month = $70,000
```

**Expected Calculation:**
```
Rolling 12-Month Check (May 2024):
  May 2023 - May 2024: $96,000 - $8,000 + $40,000 + $30,000 = $518,000

Nexus Date: May 2024 (first month 12-month window exceeds $500K)
Obligation Start: June 1, 2024
First Nexus Year: 2024
Sticky to 2025: Yes (if sales continue)
```

**Validation Needed:**
- [ ] Confirm TX uses rolling 12-month lookback
- [ ] Confirm $500K threshold for TX
- [ ] Confirm how rolling window is calculated
- [ ] Confirm TX interest rate and method (compound monthly 1.5%?)

---

### Scenario 3: Physical + Economic Nexus (New York)

**Facts:**
```
Business: Manufacturer
State: New York
Physical Nexus: Office opened January 1, 2023
Economic Activity:
  2023: $50,000 (40 transactions) - below threshold
  2024: $600,000 (95 transactions) - crosses $500K but only 95 transactions
NY Threshold: $500K revenue AND 100 transactions
```

**Expected Calculation:**
```
2023:
  - Physical nexus: Yes (office exists)
  - Economic nexus: No (below economic threshold)
  - Nexus type: "physical"
  - Obligation: Full year 2023
  - Liability: Calculate on $50,000

2024:
  - Physical nexus: Yes (office still exists)
  - Economic nexus: No ($600K meets revenue but only 95 transactions, needs 100)
  - Nexus type: "physical" (still only physical)
  - Obligation: Full year 2024
  - Liability: Calculate on $600,000
```

**Validation Needed:**
- [ ] Confirm NY uses 'and' operator ($500K AND 100 transactions)
- [ ] Confirm 100 transaction threshold (not 200 like most states)
- [ ] Confirm physical nexus starts immediately (no month-following delay)
- [ ] Confirm how to label "both" vs "physical" when both exist

---

### Scenario 4: Sticky Nexus with Declining Sales

**Facts:**
```
Business: Seasonal retailer
State: Illinois
Year 1 (2023): $150,000 - crosses threshold
Year 2 (2024): $60,000 - below threshold
Year 3 (2025): $40,000 - below threshold
```

**Expected Calculation:**
```
2023:
  - Nexus Date: When $100K crossed
  - Obligation: From nexus date forward
  - first_nexus_year = 2023

2024:
  - Still has nexus (sticky from 2023)
  - Obligation: Jan 1 - Dec 31, 2024 (FULL YEAR)
  - Liability: Calculate on $60,000

2025:
  - Still has nexus (sticky from 2023)
  - Obligation: Jan 1 - Dec 31, 2025 (FULL YEAR)
  - Liability: Calculate on $40,000
```

**Validation Needed:**
- [ ] Confirm sticky nexus persists indefinitely
- [ ] Confirm obligation is full year in subsequent years
- [ ] Confirm liability calculated even when below threshold
- [ ] Determine: Can nexus ever expire? If yes, when?

---

### Scenario 5: Marketplace Facilitator Impact

**Facts:**
```
Business: Amazon seller
State: Florida
Year: 2024
Sales Breakdown:
  - Amazon FBA: $500,000 (marketplace)
  - Own website: $60,000 (direct)
  - Total: $560,000
FL Threshold: $100K
```

**Expected Calculation:**
```
Threshold Check:
  Total sales: $560,000 ($500K MF + $60K direct)
  Threshold: $100,000
  Result: NEXUS ✅ (total exceeds threshold)

Liability Calculation:
  MF sales: $500,000 → EXCLUDED (Amazon collects tax)
  Direct sales: $60,000 → INCLUDED

  Base Tax: $60,000 × FL rate (6.0%) = $3,600
  Interest: Calculate on $3,600
```

**Validation Needed:**
- [ ] Confirm MF sales count toward threshold in all states
- [ ] Confirm MF sales excluded from liability in all states
- [ ] Confirm FL rate is 6.0%
- [ ] Ask: Are there states with different MF rules?

---

## 10. Code References

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `nexus_calculator_v2.py` | 1,520 | Main calculator logic |
| `interest_calculator.py` | 406 | Interest & penalty calculations |
| `vda_calculator.py` | 232 | Voluntary Disclosure Agreement scenarios |
| `column_detector.py` | 712 | CSV import and mapping |

### Critical Code Sections

| Functionality | File | Lines | Description |
|--------------|------|-------|-------------|
| **Main entry point** | nexus_calculator_v2.py | 37-131 | Orchestrates entire calculation |
| **Calendar year lookback** | nexus_calculator_v2.py | 222-399 | Variant A & B implementation |
| **Rolling 12-month** | nexus_calculator_v2.py | 405-584 | Monthly window calculation |
| **Quarterly lookback** | nexus_calculator_v2.py | 590-752 | NY/VT 4-quarter method |
| **Connecticut special** | nexus_calculator_v2.py | 758-901 | Oct 1 - Sep 30 period |
| **Threshold crossing** | nexus_calculator_v2.py | 922-981 | Chronological processing |
| **Obligation start** | nexus_calculator_v2.py | 983-997 | "Month following" logic |
| **Liability calculation** | nexus_calculator_v2.py | 999-1194 | Tax, exposure sales, MF rules |
| **Sticky nexus** | nexus_calculator_v2.py | 279-287 | Multi-year persistence |
| **Interest calculation** | interest_calculator.py | 138-222 | Simple, compound monthly, compound daily |
| **Penalty calculation** | interest_calculator.py | 228-279 | Rate application with min/max |

---

## 11. Next Steps for Validation

### Phase 4 Collaboration with Jordan

**Before Meeting:**
1. [ ] Review this entire document
2. [ ] Note any immediate concerns or corrections
3. [ ] Gather authoritative sources (state tax department publications)

**During Meeting:**
1. [ ] Address Priority 1 questions first (critical calculation logic)
2. [ ] Validate state-by-state threshold rules
3. [ ] Confirm lookback period types per state
4. [ ] Review real-world scenarios
5. [ ] Identify any missing edge cases

**After Meeting:**
1. [ ] Document Jordan's answers in this file
2. [ ] Create issue list for code corrections needed
3. [ ] Prioritize changes (critical vs nice-to-have)
4. [ ] Update calculator based on validated rules
5. [ ] Create comprehensive test suite based on validated scenarios

---

## 12. Assumptions Log

Track all assumptions made in the calculator:

| Assumption | Current Implementation | Confidence | Validation Status |
|-----------|------------------------|------------|-------------------|
| Gross sales for threshold | Uses `sales_amount` field | High | ⏳ Pending |
| MF sales in threshold | Always included | Medium | ⏳ Pending |
| Month-following rule | Universal for economic nexus | High | ⏳ Pending |
| Combined tax rate | Single rate per state | Medium | ⏳ Pending |
| Interest start date | First sale date | High | ✅ Validated |
| Sticky nexus | Perpetual once established | Medium | ⏳ Pending |
| Transaction count | One CSV row = one transaction | High | ⏳ Pending |
| Exempt sales | Three-tier logic sufficient | Medium | ⏳ Pending |

**Update this table as validations are completed**

---

## Appendix A: State Threshold Quick Reference

**To be populated by Jordan**

| State | Revenue Threshold | Transaction Threshold | Operator | Lookback Period | Notes |
|-------|------------------|---------------------|----------|-----------------|-------|
| AL | $250,000 | 200 | or | Current/Previous | |
| AK | N/A | N/A | N/A | No sales tax | |
| AZ | $100,000 | 200 | or | Current/Previous | |
| ... | ... | ... | ... | ... | |

---

## Appendix B: Interest Rate Reference

**To be populated by Jordan**

| State | Annual Rate | Method | Compounding | Notes |
|-------|-------------|--------|-------------|-------|
| CA | 6% | Simple | N/A | |
| TX | 18% | Compound | Monthly (1.5%/mo) | |
| NY | ? | Compound | Daily | |
| ... | ... | ... | ... | |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
**Next Review:** Phase 4 - Domain Expert Consultation
**Contact:** Jordan (SALT Professional)
