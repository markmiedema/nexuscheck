# Priority Validation Questionnaire for Tax Professionals

**Purpose:** Validate NexusCheck's sales tax calculation logic before commercial launch.

**Instructions:** For each question, please indicate if our implementation is CORRECT, INCORRECT, or NEEDS MODIFICATION. Provide the accurate rule where we're wrong.

**Response Priority:** Questions are ordered by impact on calculation accuracy. Please prioritize Q1-Q5 if time is limited.

---

## CRITICAL: Must Validate Before Launch

### Q1: Revenue Basis for Threshold Determination

**Our Implementation:**
- Uses **gross sales** (total revenue before any deductions) for threshold calculations
- Includes all sales before exemptions, refunds, or adjustments

**Question:** Is gross sales the correct basis for ALL states?

| Option | Your Answer |
|--------|-------------|
| A) Yes, all states use gross sales | [ ] |
| B) No, some states use net taxable sales (after exemptions) | [ ] |
| C) No, some states use sales after returns/refunds | [ ] |
| D) It varies - please specify which states use which basis | [ ] |

**If D, please list exceptions:**
_______________________________________________

---

### Q2: Lookback Period by State

**Our Implementation:** We currently default most states to "Current or Previous Calendar Year"

**Question:** Please assign each state to the correct lookback type:

| Lookback Type | States (please list) |
|---------------|---------------------|
| **Current OR Previous Calendar Year** (if exceeded in either, nexus applies) | |
| **Previous Calendar Year ONLY** (current year alone cannot trigger) | |
| **Rolling 12 Months** (trailing 12-month window) | |
| **Preceding 4 Quarters** (we have: NY, VT) | |
| **Special Period** (we have: CT uses Oct 1 - Sep 30) | |

**Additional states with special lookback rules:**
_______________________________________________

---

### Q3: Marketplace Sales in Threshold Calculation

**Our Implementation:**
- **36 states:** Marketplace facilitator (MF) sales COUNT toward seller's threshold
- **15 states:** MF sales EXCLUDED from seller's threshold:
  `AL, AR, AZ, CO, FL, GA, LA, MA, ME, MI, NM, TN, UT, VA, WY`

**Question:** Is this list of 15 exclusion states accurate?

| Option | Your Answer |
|--------|-------------|
| A) Yes, this list is correct | [ ] |
| B) No, these states should be ADDED to exclusion list: _______ | [ ] |
| C) No, these states should be REMOVED from exclusion list: _______ | [ ] |

**Notes on recent law changes (2024-2025):**
_______________________________________________

---

### Q4: When Does Interest Start Accruing?

**Our Implementation:**
- Interest starts from `obligation_start_date` (when seller should have started collecting)
- Calculated on base tax amount only

**Question:** When should interest begin?

| Option | Your Answer |
|--------|-------------|
| A) From obligation start date (our current approach) | [ ] |
| B) From the due date of each return (monthly/quarterly) | [ ] |
| C) From the date of first taxable sale after nexus | [ ] |
| D) It varies by state - please specify | [ ] |

**If D, please list state-specific rules:**
_______________________________________________

---

### Q5: Obligation Start Date After Threshold Crossing

**Our Implementation:**
- When threshold crossed mid-year → obligation starts **first day of month following**
- Example: Nexus on June 15 → Obligation starts July 1

**Question:** Is "first day of month following" correct for all states?

| Option | Your Answer |
|--------|-------------|
| A) Yes, this is universally correct | [ ] |
| B) No, some states use a different rule - please specify | [ ] |
| C) Partially correct - see notes below | [ ] |

**State-specific variations:**
_______________________________________________

---

## IMPORTANT: Validate for Accuracy

### Q6: "Sticky" Nexus Duration

**Our Implementation:**
- Once nexus is established, it persists **indefinitely**
- Never expires even if sales drop below threshold

**Question:** Is perpetual nexus correct?

| Option | Your Answer |
|--------|-------------|
| A) Yes, nexus persists indefinitely once established | [ ] |
| B) No, nexus can expire after X years below threshold | [ ] |
| C) No, nexus ends if seller formally de-registers | [ ] |
| D) It varies by state - please specify | [ ] |

**State-specific rules:**
_______________________________________________

---

### Q7: AND vs OR Threshold Logic

**Our Implementation:**
- **NY:** $500,000 AND 100 transactions (must meet BOTH)
- **CT:** $100,000 AND 200 transactions (must meet BOTH)
- **All other states:** OR logic (meeting either threshold triggers nexus)

**Question:** Are NY and CT the ONLY "AND" states?

| Option | Your Answer |
|--------|-------------|
| A) Yes, only NY and CT use AND logic | [ ] |
| B) No, these states also use AND logic: _______ | [ ] |

---

### Q8: Penalty Types and Stacking

**Our Implementation:**
- Currently only applies "late registration penalty" (typically 10% of base tax)
- Does not stack multiple penalty types

**Question:** Can penalties stack?

| Option | Your Answer |
|--------|-------------|
| A) No, only one penalty applies | [ ] |
| B) Yes, these can stack: Late Registration + Late Filing + Late Payment | [ ] |
| C) It varies by state - please specify | [ ] |

**Typical penalty rates by type:**
- Late Registration: _____%
- Late Filing: _____%
- Late Payment: _____%

---

### Q9: Physical Nexus Obligation Start

**Our Implementation:**
- Physical nexus obligation starts **immediately** on the date established
- No "first day of following month" rule applied

**Question:** Is immediate obligation correct for physical nexus?

| Option | Your Answer |
|--------|-------------|
| A) Yes, obligation is immediate | [ ] |
| B) No, physical nexus also uses "first day of month following" | [ ] |
| C) It depends on the type of physical nexus (office vs employee vs inventory) | [ ] |

**Type-specific rules:**
_______________________________________________

---

### Q10: Combined Physical + Economic Nexus

**Our Implementation:**
- When both physical and economic nexus exist for a state, we use the **EARLIER date**
- Label nexus type as "both"

**Question:** Is using the earlier date correct?

| Option | Your Answer |
|--------|-------------|
| A) Yes, use the earlier date | [ ] |
| B) No, physical nexus should always take precedence | [ ] |
| C) No, economic nexus should always take precedence | [ ] |
| D) It doesn't matter - they have the same implications | [ ] |

---

## SUPPLEMENTARY: For Comprehensive Accuracy

### Q11: Transaction Count Definition

**Our Implementation:**
- Each row in uploaded data = 1 transaction
- No distinction between single-item and multi-item orders

**Question:** How should transactions be counted?

- Multi-item order (5 products, 1 invoice) = _____ transaction(s)
- Split shipments from one order = _____ transaction(s)
- Should refunds/returns reduce the transaction count? _____

---

### Q12: Exempt Sales in Threshold Calculation

**Our Implementation:**
- Exempt sales ARE included in gross sales for threshold determination
- Only excluded from tax liability calculation

**Question:** Should exempt sales count toward threshold?

| Option | Your Answer |
|--------|-------------|
| A) Yes, include exempt sales in threshold calculation | [ ] |
| B) No, exclude exempt sales from threshold calculation | [ ] |
| C) It varies by state | [ ] |

---

### Q13: Historical Threshold Changes

**Our Implementation:**
- Uses current thresholds for all calculations
- Does not account for historical threshold changes

**Question:** If analyzing data from 2020 when a state had different thresholds:

| Option | Your Answer |
|--------|-------------|
| A) Use current thresholds (acceptable for exposure analysis) | [ ] |
| B) Must use historical thresholds for accuracy | [ ] |
| C) Depends on the use case | [ ] |

---

### Q14: Average Tax Rate for Estimates

**Our Implementation:**
- Uses a single combined rate per state (state rate + average local rate)
- Example: California = 7.25% state + 1.73% avg local = 8.98%

**Question:** For **exposure analysis/estimates**, is using average combined rate acceptable?

| Option | Your Answer |
|--------|-------------|
| A) Yes, acceptable for estimates | [ ] |
| B) No, must calculate at destination zip code level | [ ] |
| C) Acceptable with disclaimer about actual rates varying | [ ] |

---

### Q15: VDA (Voluntary Disclosure Agreement) Terms

**Our Implementation:**
- Default lookback: 36-48 months (state-specific)
- Penalties: Waived by default
- Interest: Charged (not waived) by default

**Question:** Are these VDA defaults accurate for most states?

| Option | Your Answer |
|--------|-------------|
| A) Yes, these defaults are reasonable | [ ] |
| B) No, penalties are NOT typically waived | [ ] |
| C) No, interest IS typically waived or reduced | [ ] |
| D) Lookback periods are typically different: _____ months | [ ] |

---

## Your Information

**Name:** _______________________________

**Title/Role:** _______________________________

**Years of SALT Experience:** _______________________________

**States You Specialize In:** _______________________________

**Date Completed:** _______________________________

---

## Additional Comments

Please share any other feedback on our calculation methodology:

_______________________________________________
_______________________________________________
_______________________________________________

---

*Thank you for your time. Your input directly improves the accuracy of NexusCheck for tax professionals like yourself.*

*Questions? Contact: [your email]*
