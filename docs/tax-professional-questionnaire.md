# Tax Professional Questionnaire: NexusCheck Tax Engine Validation

**Document Purpose:** This questionnaire seeks validation and correction of sales tax calculation logic implemented in our nexus analysis tool. We need tax professionals to confirm our current assumptions or provide corrections.

**Response Format:** For each question, please indicate if our current implementation is correct, incorrect, or partially correct, and provide the accurate rule.

---

## Section 1: Threshold Calculation Logic (Critical)

### Q1: Revenue Basis for Threshold Determination

**Current Implementation:**
- Uses `sales_amount` (gross sales) for threshold calculations
- Includes all sales before exemptions, refunds, or adjustments

**Questions:**
1. Is **gross sales** the correct basis for all states, or do some states use:
   - Net taxable sales (after exemptions)?
   - Sales after returns/refunds?
   - A different calculation basis?

2. If states vary, please specify which states use which basis.

---

### Q2: Transaction Count Definition

**Current Implementation:**
- Each row in the uploaded CSV = 1 transaction
- No distinction between single-item and multi-item orders

**Questions:**
1. How do states define a "transaction" for threshold purposes?
   - Is it per order/invoice (regardless of line items)?
   - Is it per line item?
   - Is it per shipment?

2. How should the following be counted?
   - Multiple line items in a single order: ___ transaction(s)
   - Split shipments from one order: ___ transaction(s)
   - Refunds/returns: Should these reduce the transaction count?

---

### Q3: Threshold Operator Logic (AND vs OR)

**Current Implementation:**
| State | Revenue | Transactions | Operator |
|-------|---------|--------------|----------|
| NY | $500,000 | 100 | AND |
| CT | $100,000 | 200 | AND |
| All others | Various | Various | OR |

**Questions:**
1. Is NY correct as **AND** (must meet BOTH $500K AND 100 transactions)?
2. Is CT correct as **AND** (must meet BOTH $100K AND 200 transactions)?
3. Are there other states that use **AND** logic that we're missing?
4. For **OR** states: Does meeting either threshold independently trigger nexus?

---

### Q4: Marketplace Sales Inclusion in Threshold

**Current Implementation:**

**States where MF sales COUNT toward seller's threshold (36 states):**
CA, CT, DC, HI, IA, ID, IL*, IN*, KS, KY, MD, MN, MO, NC, NE, NJ, NV, NY, OH, PA*, PR, RI, SC, SD, TX, VT, WA, WI, WV

**States where MF sales are EXCLUDED from seller's threshold (15 states):**
AL, AR, AZ, CO, FL, GA, LA, MA, ME, MI, NM, TN, UT, VA, WY

**Questions:**
1. Is this state-by-state breakdown accurate?
2. For states marked with *, we have conflicting information. Please confirm:
   - IL: Count toward threshold? (currently: YES in config, marked as exception elsewhere)
   - IN: Count toward threshold?
   - PA: Count toward threshold?
3. Are there recent law changes (2024-2025) that modified any of these rules?

---

## Section 2: Lookback Period Rules (Critical)

### Q5: Lookback Period Types by State

**Current Implementation supports 4 types:**

**Type A: "Current or Previous Calendar Year" (Default)**
- Checks current year first, then prior year
- If prior year exceeded threshold → obligation starts Jan 1
- If current year exceeds → obligation starts month after crossing

**Type B: "Previous Calendar Year Only"**
- Only checks prior year's totals
- Current year sales alone cannot establish nexus

**Type C: "Rolling 12 Months"**
- For each month, sum sales from trailing 12 months
- Nexus established when rolling total exceeds threshold

**Type D: "Quarterly Lookback"**
- NY: Preceding 4 Sales Tax Quarters
- VT: Preceding 4 Calendar Quarters

**Questions:**
1. Please assign EACH state to one of these categories:

| Lookback Type | States (current assumption) | Confirm/Correct |
|---------------|---------------------------|-----------------|
| Current or Previous CY | ~25 states (default) | |
| Previous CY Only | AL, FL, MI, PA, NM, NE | |
| Rolling 12 Months | IL, MN, MS, TN, TX | |
| Preceding 4 Quarters | NY, VT | |
| Special (CT: Oct-Sep) | CT | |

2. Are there states that ONLY look at the current year (no lookback)?

3. For **Rolling 12 Months** states:
   - Does the window use calendar month boundaries?
   - Or any consecutive 12-month period (e.g., mid-month to mid-month)?

---

### Q6: Connecticut's Special Period

**Current Implementation:**
- Measurement period: October 1 (prior year) to September 30 (current year)
- Requires BOTH $100,000 AND 200 transactions

**Questions:**
1. Is the Oct 1 - Sep 30 measurement period correct?
2. If nexus is established, does obligation:
   - Apply to the full calendar year?
   - Apply only from October 1 forward?
   - Apply from the first day of the next month?

---

### Q7: Quarterly Lookback Interpretation (NY)

**Current Implementation:**
- NY uses "preceding 4 sales tax quarters"
- When checking Q2 2024: looks at Q2'23, Q3'23, Q4'23, Q1'24
- "Preceding" means the 4 quarters BEFORE the current quarter

**Questions:**
1. Is this interpretation correct? Or does "preceding" include the current quarter?
2. Does NY use calendar quarters or state fiscal quarters?
3. Is NY's transaction threshold 100 (not 200 like most states)?

---

### Q8: Mid-Year Nexus Establishment

**Current Implementation:**
- If threshold crossed in June 2024 → nexus starts July 1, 2024
- Obligation is "first day of the month following" threshold crossing

**Questions:**
1. Is "first day of month following" the correct rule for:
   - Calendar year states?
   - Rolling 12-month states?
   - Quarterly lookback states?

2. For calendar year states: If threshold is crossed mid-year in 2024:
   - Does nexus apply only to remainder of 2024?
   - Or retroactively to January 1, 2024?
   - Or both current year sales AND carry forward to full year 2025?

---

## Section 3: Physical Nexus Rules

### Q9: Physical Nexus Obligation Start

**Current Implementation:**
- Physical nexus obligation starts immediately on the date provided
- No "first day of following month" rule applied

**Questions:**
1. Is immediate obligation correct for physical nexus?
2. Or should physical nexus also use "first day of month following" establishment?
3. Do different types of physical nexus (office, warehouse, employee, trade show) have different start rules?

---

### Q10: Physical + Economic Nexus Combination

**Current Implementation:**
- When both physical and economic nexus exist, uses the EARLIER date
- Labels nexus type as "both"

**Questions:**
1. Is using the earlier date correct?
2. Should one type of nexus take precedence (e.g., physical always overrides)?
3. Are there states where physical and economic nexus have different implications?

---

## Section 4: Tax Rate & Liability Calculation

### Q11: Combined Tax Rate Accuracy

**Current Implementation:**
- Uses a single combined rate per state (state rate + average local rate)
- Example: California = 7.25% state + 1.73% avg local = 8.98% combined

**Questions:**
1. Is using an average combined rate acceptable for **estimates/exposure analysis**?
2. For precise liability: Should we calculate at destination zip code level?
3. How should we handle states with **origin-based sourcing** (TX, AZ, etc.)?
   - Use seller's location rate?
   - Use buyer's location rate?
   - Different rules for different product types?

---

### Q12: Exempt Sales Handling

**Current Implementation:**
Three-tier priority system:
1. If `exempt_amount` column present → use that value
2. If `is_taxable = FALSE` → entire sale is exempt
3. Default: Entire sale is taxable

**Questions:**
1. Is this priority logic correct?
2. How should we handle:
   - Partially exempt transactions (e.g., $100 order, $20 exempt)?
   - State-specific exemptions (e.g., clothing exempt in PA/NJ)?
   - Exemption certificates (resale, government, nonprofit)?
3. Should exempt sales be included in gross sales for threshold determination? (Currently: YES)

---

### Q13: Marketplace Facilitator Liability Exclusion

**Current Implementation:**
- Marketplace sales are ALWAYS excluded from seller's tax liability
- Marketplace is responsible for collecting/remitting
- This applies to ALL states with MF laws

**Questions:**
1. Is universal MF liability exclusion correct?
2. Are there exceptions where seller retains liability even with MF?
   - Commingled inventory?
   - Private label products?
   - Services vs goods?
3. What if a marketplace collects tax but remits incorrectly? Does seller have backup liability?

---

### Q14: Use Tax vs Sales Tax

**Current Implementation:**
- Calculator only calculates **sales tax** (seller's collection obligation)
- Does NOT calculate use tax

**Questions:**
1. Should our tool also calculate use tax exposure?
2. When does use tax apply instead of sales tax?
   - Out-of-state purchases for own use?
   - Withdrawals from inventory?
3. For nexus purposes, is use tax obligation triggered differently than sales tax?

---

## Section 5: Interest & Penalty Calculations

### Q15: Interest Start Date

**Current Implementation:**
- Interest starts from `obligation_start_date` (when seller should have started collecting)
- Calculated on base tax amount only

**Questions:**
1. Should interest start from:
   - Obligation start date?
   - Date each return was due (e.g., monthly/quarterly)?
   - Date of first taxable sale after nexus?
2. Do states have grace periods before interest accrues?

---

### Q16: Interest Calculation Methods by State

**Current Implementation:**
| Method | Formula | States (assumed) |
|--------|---------|-----------------|
| Simple | P × R × T | Most states |
| Compound Monthly | P × [(1 + R/12)^months - 1] | TX |
| Compound Daily | P × [(1 + R/365)^days - 1] | NY |

**Questions:**
1. Please confirm which states use which method
2. What are the current interest rates by state?
3. Do rates change over time (indexed to federal rate)?
4. For compound states: Is compounding monthly, quarterly, or daily?

---

### Q17: Interest Base Amount

**Current Implementation:**
- Interest calculated on base tax only
- Does NOT include penalties in the interest calculation

**Questions:**
1. Is this correct for all states?
2. Do any states charge interest on (tax + penalties)?
3. Do any states charge "interest on interest" (compound on accrued interest)?

---

### Q18: Penalty Types and Rates

**Current Implementation:**
- Uses single "late registration penalty rate" applied to base tax
- Defaults: 10% of base tax, capped at $500

**Questions:**
1. Should we distinguish between:
   - Late registration penalty
   - Late filing penalty
   - Late payment penalty
   - Negligence/fraud penalty
2. What are typical rates for each penalty type?
3. Can penalties stack (e.g., registration + filing + payment)?
4. Are there minimum/maximum penalty amounts by state?

---

### Q19: First-Time Filer Leniency

**Current Implementation:**
- No special handling for first-time filers
- Same penalties applied regardless of filing history

**Questions:**
1. Do states offer penalty waivers for voluntary first-time registrations?
2. Is this different from formal VDA programs?
3. Should our tool have a "first-time filer" toggle?

---

## Section 6: Voluntary Disclosure Agreement (VDA)

### Q20: VDA Lookback Period

**Current Implementation:**
- Default VDA lookback: 48 months (4 years)
- Penalties waived (default)
- Interest charged (default)

**Questions:**
1. What is the typical VDA lookback period by state?
   - 3 years? 4 years? State-specific?
2. Is the lookback from:
   - VDA filing date?
   - Discovery date?
   - Some other reference point?
3. For states not in the MTC: Are lookback periods different?

---

### Q21: VDA Penalty/Interest Treatment

**Current Implementation:**
- Penalties: Waived by default
- Interest: Charged by default (not waived)

**Questions:**
1. Is this accurate for most states?
2. Which states waive BOTH penalties AND interest under VDA?
3. Are there states that offer reduced interest rates under VDA?
4. What documentation/commitments are typically required?

---

## Section 7: Edge Cases & Advanced Rules

### Q22: Statute of Limitations

**Current Implementation:**
- No lookback limit (calculates all years with data)
- No statute of limitations applied

**Questions:**
1. What is the typical statute of limitations?
   - Most states: 3-4 years?
   - Extended for fraud/negligence?
2. Does VDA affect/extend the statute?
3. Should our tool default to limiting calculations to the statute period?

---

### Q23: "Sticky" Nexus Duration

**Current Implementation:**
- Once nexus is established, it persists indefinitely
- Never expires even if sales drop below threshold

**Questions:**
1. Is perpetual nexus correct?
2. Can nexus be "lost" if a seller:
   - Has zero sales for consecutive years?
   - Falls below threshold for multiple years?
   - Formally de-registers?
3. Do states have annual re-evaluation requirements?

---

### Q24: Threshold Changes Over Time

**Current Implementation:**
- Uses current thresholds for all calculations
- Does not account for historical threshold changes

**Questions:**
1. If a state increases its threshold (e.g., $100K → $250K):
   - Does existing nexus remain valid?
   - Can sellers "lose" nexus if now below new threshold?
2. Should we track effective dates and apply appropriate thresholds by year?

---

### Q25: Marketplace Facilitator Effective Dates

**Current Implementation:**
- All MF laws assumed effective October 1, 2019
- Same treatment applied to all historical data

**Questions:**
1. What are the actual MF law effective dates by state?
2. For pre-MF-law data (e.g., 2018):
   - Should marketplace sales be treated as direct sales?
   - Did sellers have liability for marketplace sales before MF laws?

---

### Q26: Sales Channel Classification

**Current Implementation:**
- Binary classification: "direct" or "marketplace"
- No sub-categories

**Questions:**
1. Is binary classification sufficient?
2. How should these be classified:
   - Fulfilled by Amazon (FBA) but sold direct?
   - Multi-channel fulfillment?
   - Referral sales (affiliate links)?
   - Drop shipping?

---

## Section 8: State-Specific Confirmations

Please confirm or correct our understanding of these specific state rules:

### California
- Threshold: $500,000 revenue only (no transaction count)?
- Lookback: Current or previous calendar year?
- MF sales: Count toward threshold?

### Texas
- Threshold: $500,000 revenue only?
- Lookback: Rolling 12 months?
- Interest: Compound monthly at 1.5%/month?

### New York
- Threshold: $500,000 AND 100 transactions?
- Lookback: Preceding 4 sales tax quarters?
- Interest: Compound daily?

### Florida
- Threshold: $100,000 revenue only?
- Lookback: Previous calendar year only?
- MF sales: Excluded from threshold?

### Pennsylvania
- Threshold: $100,000 revenue only?
- Lookback: Previous calendar year only?
- MF sales: Excluded from threshold?

---

## Response Instructions

For each question above, please provide:
1. **Confirmation** if our implementation is correct
2. **Correction** if our implementation is wrong
3. **Additional detail** where needed
4. **Source/citation** where possible (statute, regulation, or official guidance)

If a rule varies by state, please specify which states follow which rule.

**Priority:** Please prioritize responses in this order:
1. Section 1 (Threshold Calculation)
2. Section 2 (Lookback Periods)
3. Section 5 (Interest/Penalties)
4. Remaining sections

---

*Document generated from NexusCheck codebase analysis*
*Last updated: November 2025*
