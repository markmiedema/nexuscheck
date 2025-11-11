# Interest & Penalty Rate Research Template

**Purpose:** Guide for researching and documenting actual state interest and penalty rates

**Status:** 🚨 REQUIRED BEFORE PRODUCTION

---

## Research Checklist

For each state, research and document:

- [ ] Current interest rate
- [ ] Interest calculation method (simple/compound monthly/compound daily)
- [ ] Penalty rate(s)
- [ ] Minimum penalty (if applicable)
- [ ] Maximum penalty (if applicable)
- [ ] What penalties apply to (tax only or tax + interest)
- [ ] VDA terms (interest waived? penalties waived? lookback period?)
- [ ] Effective date of current rates
- [ ] Source URL and statute/regulation citation
- [ ] Date verified

---

## Research Template (Copy for Each State)

### State: [STATE NAME] ([XX])

**Research Date:** [MM/DD/YYYY]
**Researcher:** [Name]

#### Interest Rate Information

**Current Rate:**
- Annual Rate: [X.XX%]
- Monthly Rate (if applicable): [X.XX%]
- Daily Rate (if applicable): [X.XXXX%]

**Calculation Method:**
- [ ] Simple Interest
- [ ] Compound Monthly Interest
- [ ] Compound Daily Interest
- [ ] Other: [Specify]

**Effective Date:** [MM/DD/YYYY]

**Rate History (if available):**
| Effective From | Effective To | Rate | Method |
|----------------|--------------|------|--------|
| MM/DD/YYYY | MM/DD/YYYY | X.XX% | Simple |
| MM/DD/YYYY | Present | X.XX% | Simple |

**Update Frequency:**
- [ ] Fixed (does not change)
- [ ] Quarterly
- [ ] Annually
- [ ] Variable (based on federal rate)
- [ ] Other: [Specify]

---

#### Penalty Information

**Late Registration Penalty:**
- Rate: [X.XX%]
- Applies to: [ ] Tax only [ ] Tax + Interest
- Minimum: $[Amount] or N/A
- Maximum: $[Amount] or N/A
- Notes: [Any special conditions]

**Late Filing Penalty:**
- Rate: [X.XX%] or $[Amount] per return
- Applies to: [ ] Per return [ ] Per period [ ] Percentage of tax
- Notes: [Any special conditions]

**Late Payment Penalty:**
- Rate: [X.XX%]
- Accrual: [ ] One-time [ ] Monthly [ ] Daily
- Maximum: [X.XX%] or $[Amount]
- Notes: [Any special conditions]

**Other Penalties:**
- [Description]: [Rate/Amount]
- [Description]: [Rate/Amount]

---

#### VDA (Voluntary Disclosure Agreement) Terms

**Interest:**
- [ ] Waived completely
- [ ] Reduced to [X.XX%]
- [ ] Charged at standard rate
- Notes: [Conditions]

**Penalties:**
- [ ] Waived completely
- [ ] Reduced to [X.XX%]
- [ ] Charged at standard rate
- Notes: [Conditions]

**Lookback Period:**
- Months: [XX months] (e.g., 36, 48, 60)
- Or: [ ] No limit / Unlimited lookback
- Notes: [Any conditions or exceptions]

**VDA Eligibility:**
- Requirements: [List key requirements]
- Exclusions: [Who cannot use VDA]

---

#### Source Documentation

**Primary Source(s):**
1. URL: [Full URL]
   - Document: [Title/Section]
   - Verified: [MM/DD/YYYY]

2. URL: [Full URL]
   - Document: [Title/Section]
   - Verified: [MM/DD/YYYY]

**Statutory/Regulatory Citations:**
- Interest: [State Code § XX.XXX]
- Penalties: [State Code § XX.XXX]
- VDA: [State Code § XX.XXX or Administrative Rule]

**Contact Information:**
- Department: [State DOR/Tax Authority]
- Phone: [(XXX) XXX-XXXX]
- Email: [contact@state.gov]
- Website: [https://...]

---

#### Implementation Notes

**Database Values:**
```sql
INSERT INTO interest_penalty_rates (
    state_code,
    annual_interest_rate,
    interest_calculation_method,
    late_registration_penalty_rate,
    late_registration_penalty_min,
    late_registration_penalty_max,
    penalty_applies_to,
    vda_interest_waived,
    vda_penalties_waived,
    vda_lookback_period_months,
    effective_from,
    effective_to
) VALUES (
    'XX',
    0.XXX,  -- [Comment: Rate as decimal]
    '[simple|compound_monthly|compound_daily]',
    0.XX,   -- [Comment: Penalty rate as decimal]
    XX.XX,  -- [Min penalty or NULL]
    XXXX.XX,-- [Max penalty or NULL]
    '[tax|tax_plus_interest]',
    [true|false],  -- VDA interest waived
    [true|false],  -- VDA penalties waived
    XX,     -- VDA lookback months
    'YYYY-MM-DD',  -- Effective from date
    NULL    -- Current rate (no end date)
);
```

**Special Considerations:**
- [Note any unusual rules or edge cases]
- [Note if rates are scheduled to change]
- [Note if there are different rates for different tax types]

---

## Quick Reference: Where to Find Information

### Common State Department Websites

**Format:** `[state].gov` or `tax.[state].gov` or `dor.[state].gov`

**Examples:**
- Texas: comptroller.texas.gov
- California: cdtfa.ca.gov
- Florida: floridarevenue.com
- New York: tax.ny.gov
- Illinois: tax.illinois.gov

### Search Terms to Use

- "[State] sales tax interest rate"
- "[State] delinquent tax interest"
- "[State] sales tax penalties"
- "[State] voluntary disclosure agreement"
- "[State] VDA program"

### Professional Resources

**CCH State Tax Guide:**
- Subscription required
- Comprehensive state-by-state information
- Updated regularly

**Bloomberg Tax:**
- Subscription required
- State tax portfolios
- Practice tools

**State Bar Tax Sections:**
- Many states publish guides
- Often free to members

---

## Example: Texas (Completed)

### State: Texas (TX)

**Research Date:** 11/05/2025
**Researcher:** Example Researcher

#### Interest Rate Information

**Current Rate:**
- Annual Rate: 15.00% (1.25% per month)
- Monthly Rate: 1.25%

**Calculation Method:**
- [X] Compound Monthly Interest

**Effective Date:** 01/01/2024

**Update Frequency:**
- [X] Variable (updates announced quarterly)

---

#### Penalty Information

**Late Registration Penalty:**
- Rate: 5.00%
- Applies to: [X] Tax only
- Minimum: N/A
- Maximum: N/A

**Late Payment Penalty:**
- Rate: 5.00%
- Accrual: [X] One-time

---

#### VDA Terms

**Interest:**
- [X] Charged at standard rate

**Penalties:**
- [X] Waived completely

**Lookback Period:**
- Months: 48 months

---

#### Source Documentation

**Primary Source:**
1. URL: https://comptroller.texas.gov/taxes/sales/rates.php
   - Document: "Interest Rates on Delinquent Taxes"
   - Verified: 11/05/2025

**Statutory Citation:**
- Interest: Texas Tax Code §111.060
- Penalties: Texas Tax Code §111.061

---

## Research Assignment Tracking

Track who is researching which states:

| State | Assigned To | Status | Completion Date |
|-------|-------------|--------|-----------------|
| AL | [Name] | Not Started | |
| AK | [Name] | Not Started | |
| AZ | [Name] | Not Started | |
| AR | [Name] | Not Started | |
| CA | [Name] | In Progress | |
| ... | ... | ... | ... |

---

## Validation Checklist

Before marking a state as "Complete":

- [ ] All required fields filled in
- [ ] Source URLs tested and working
- [ ] Statutory citations verified
- [ ] Calculation method confirmed
- [ ] VDA terms documented
- [ ] SQL statement prepared
- [ ] Peer review completed
- [ ] Added to database test script

---

**Document Version:** 1.0
**Last Updated:** November 5, 2025
**Next Review:** Before Production Deployment
