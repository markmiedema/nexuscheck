# Implementation Context for Tax Professional Questionnaire

This document provides context on what NexusCheck currently implements for each question area, helping tax professionals understand what needs validation.

---

## Summary of Current Implementation

### Threshold Logic
| Aspect | Current Implementation | Files |
|--------|----------------------|-------|
| Revenue basis | Gross sales (`sales_amount` column) | `nexus_calculator_v2.py` |
| Transaction counting | 1 row = 1 transaction | `nexus_calculator_v2.py` |
| Threshold operators | NY/CT use AND; all others use OR | `005_populate_state_data.sql` |

### Lookback Periods
| Type | States (hardcoded) | Implementation Status |
|------|-------------------|----------------------|
| Current/Previous CY | Default (~25 states) | Implemented |
| Previous CY Only | AL, FL, MI, PA, NM, NE | Partially implemented |
| Rolling 12 Months | IL, MN, MS, TN, TX | Implemented (Phase 1B) |
| Quarterly | NY, VT | Implemented |
| Special (Oct-Sep) | CT | Implemented |

### Marketplace Facilitator Rules
| Category | States | Count |
|----------|--------|-------|
| MF sales COUNT toward threshold | CA, CT, DC, HI, IA, ID, KS, KY, MD, MN, MO, NC, NE, NJ, NV, NY, OH, RI, SC, SD, TX, VT, WA, WI, WV | 25+ |
| MF sales EXCLUDED from threshold | AL, AR, AZ, CO, FL, GA, LA, MA, ME, MI, NM, TN, UT, VA, WY | 15 |

### Interest Calculation
| Method | Rate | States (assumed) |
|--------|------|-----------------|
| Simple | 3% default | Most states |
| Compound Monthly | Varies | TX |
| Compound Daily | Varies | NY |

### Penalty Calculation
| Type | Default |
|------|---------|
| Late registration | 10% of base tax |
| Maximum cap | $500 |
| VDA treatment | Penalties waived, interest charged |

---

## Question Mapping: Original → Refined

### Priority 1 Questions

| Original | Refined | Key Changes |
|----------|---------|-------------|
| Q1 (Gross vs Net) | Q1 | Added specific column name (`sales_amount`), asked about returns/refunds |
| Q2 (MF Threshold) | Q4 | Added complete state-by-state breakdown, identified conflicting states (IL, IN, PA) |
| Q3 (AND/OR Operators) | Q3 | Confirmed NY has 100 transactions (not 200), provided table format |
| Q4 (Transaction Count) | Q2 | Added specific scenarios: multi-item orders, split shipments |
| Q7 (Lookback Variants) | Q5, Q6, Q7 | Split into 3 questions with state assignments, CT special handling |
| Q14 (Tax Rates) | Q11 | Added origin-based sourcing question |
| Q20 (Interest Start) | Q15 | Asked about due dates vs sale dates, grace periods |

### Priority 2 Questions

| Original | Refined | Key Changes |
|----------|---------|-------------|
| Q5 (Physical Nexus Start) | Q9 | Asked about different nexus types (office, warehouse, trade show) |
| Q6 (Physical + Economic) | Q10 | Asked about state-specific implications |
| Q8 (Mid-Year Nexus) | Q8 | Clarified retroactive vs prospective application |
| Q9-Q13 (Lookback Details) | Q5-Q8 | Consolidated into comprehensive lookback section |
| Q15 (Exempt Handling) | Q12 | Added partial exemptions, exemption certificates |
| Q16 (Use Tax) | Q14 | Asked when it applies, different nexus triggers |
| Q17-Q19 (MF Rules) | Q4, Q13 | Consolidated MF questions, added FBA/drop-ship scenarios |
| Q21-Q22 (Interest Details) | Q16, Q17 | Added rate sources, compounding on interest |

### Priority 3 Questions

| Original | Refined | Key Changes |
|----------|---------|-------------|
| Q23 (Penalty Types) | Q18 | Asked about penalty stacking |
| Q24 (First-Time Leniency) | Q19 | Clarified VDA vs informal leniency |
| Q25 (Statute of Limitations) | Q22 | Added fraud/negligence extensions |
| Q26 (Sticky Nexus) | Q23 | Asked about de-registration |
| Q27-Q28 (De-Registration) | Q23, Q24 | Combined with sticky nexus, threshold changes |
| Q29-Q30 (MF Dates) | Q25 | Asked for actual effective dates by state |

---

## Key Findings from Codebase Analysis

### 1. Confirmed Implementation Details

**Threshold Logic:**
```python
# From nexus_calculator_v2.py
running_total += txn['sales_amount']  # Uses gross sales
running_count += 1                     # Each row = 1 transaction
```

**Operator Logic:**
```sql
-- From 005_populate_state_data.sql
('NY', 'both', 500000.00, 100, 'and', '2019-01-01')  -- AND operator
('CT', 'both', 100000.00, 200, 'and', '2019-01-01')  -- AND operator
```

**Obligation Start Date:**
```python
# From nexus_calculator_v2.py
# "First day of month following threshold crossing"
obligation_month = nexus_date.replace(day=1) + relativedelta(months=1)
```

### 2. Potential Issues Identified

**Issue 1: Conflicting MF Threshold Rules**
- Migration 005 and Migration 020 have different values for some states
- IL, IN, PA show as exceptions in some places but not others
- **Need tax professional to confirm correct list**

**Issue 2: Interest Rate Data Gap**
- `interest_penalty_rates` table exists but may not have complete state data
- Falls back to 3% default when state config missing
- **Need complete rate table from tax professional**

**Issue 3: No Historical Threshold Tracking**
- All thresholds assumed effective 2019-01-01
- No mechanism to apply different thresholds for 2018 or earlier data
- **Need guidance on historical threshold handling**

### 3. Database Schema Reference

**Key Tables:**
```
economic_nexus_thresholds
├── state (CHAR 2)
├── threshold_type ('revenue', 'transaction', 'both', 'or')
├── revenue_threshold (DECIMAL)
├── transaction_threshold (INT)
├── threshold_operator ('and' or 'or')
├── lookback_period (VARCHAR)
└── effective_from/to (DATE)

marketplace_facilitator_rules
├── state (CHAR 2)
├── has_mf_law (BOOLEAN)
├── mf_law_effective_date (DATE)
├── count_toward_threshold (BOOLEAN)  ← Key for Q4
├── exclude_from_liability (BOOLEAN)
└── effective_from/to (DATE)

interest_penalty_rates
├── state (CHAR 2)
├── annual_interest_rate (DECIMAL)
├── interest_calculation_method ('simple', 'compound_monthly', 'compound_daily')
├── late_registration_penalty_rate (DECIMAL)
├── late_registration_penalty_min/max (DECIMAL)
├── vda_penalties_waived (BOOLEAN)
└── vda_lookback_period_months (INT)
```

---

## Priority Data Requests

Based on the codebase analysis, we need tax professionals to provide:

### High Priority
1. **Complete state-by-state lookback period assignments** (currently hardcoded assumptions)
2. **Confirmation of MF threshold counting rules** (15 exception states list)
3. **Interest rates and methods by state** (database has structure but incomplete data)

### Medium Priority
4. **Penalty rate details** (currently uses 10% default)
5. **Quarterly lookback interpretation** for NY/VT
6. **CT fiscal period obligation rules**

### Lower Priority
7. **VDA terms by state**
8. **Statute of limitations by state**
9. **Historical MF effective dates**

---

## Files Modified by Tax Rule Changes

When tax professionals provide answers, these files will need updates:

| Rule Change | File(s) to Update |
|-------------|-------------------|
| Threshold values | `005_populate_state_data.sql`, new migration |
| Lookback assignments | `nexus_calculator_v2.py`, threshold table |
| MF rules | `020_fix_marketplace_facilitator_threshold_rules.sql` |
| Interest rates | `interest_penalty_rates` table (new migration) |
| Penalty rates | `interest_penalty_rates` table (new migration) |
| State-specific logic | `nexus_calculator_v2.py` |

---

*Generated from NexusCheck codebase analysis - November 2025*
