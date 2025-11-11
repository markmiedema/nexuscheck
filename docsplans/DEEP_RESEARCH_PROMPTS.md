# Deep Research Prompts: State Interest & Penalty Rates

**Purpose:** Structured prompts for researching sales tax interest and penalty rates in batches

**Batch Strategy:** 10 states per batch (50 states = 5 batches)

---

## Instructions for Use

1. Copy one batch prompt below
2. Paste into Deep Research / Claude with web search
3. Wait for complete results
4. Review and validate outputs
5. Copy the structured output into your spreadsheet/database
6. Move to next batch

---

## Batch 1: High-Volume States (Priority)

**States:** California, Texas, Florida, New York, Illinois, Pennsylvania, Ohio, Georgia, North Carolina, Michigan

```
You are researching current sales tax interest and penalty rates for 10 US states. This research is for a professional tax compliance tool, so accuracy is critical.

STATES TO RESEARCH:
1. California (CA)
2. Texas (TX)
3. Florida (FL)
4. New York (NY)
5. Illinois (IL)
6. Pennsylvania (PA)
7. Ohio (OH)
8. Georgia (GA)
9. North Carolina (NC)
10. Michigan (MI)

RESEARCH REQUIREMENTS:

For each state, find and document:

1. INTEREST RATE INFORMATION:
   - Current annual interest rate (as of November 2025)
   - If compound interest: monthly or daily rate
   - Calculation method: simple, compound monthly, or compound daily
   - Update frequency (fixed, quarterly, variable based on federal rate)
   - Effective date of current rate

2. PENALTY INFORMATION:
   - Late registration penalty rate/amount
   - Late filing penalty rate/amount
   - Late payment penalty rate/amount
   - Minimum penalty amounts (if any)
   - Maximum penalty caps (if any)
   - What penalties apply to: tax only, or tax + interest

3. VOLUNTARY DISCLOSURE AGREEMENT (VDA) TERMS:
   - Are interest charges waived under VDA?
   - Are penalties waived under VDA?
   - Lookback period limitation (e.g., 36, 48, 60 months)
   - Any special VDA conditions

4. SOURCE DOCUMENTATION:
   - Direct URL to state Department of Revenue page
   - Statute or regulation citation
   - Date the information was last verified/updated on the state website

AUTHORITATIVE SOURCES (Use ONLY these):
✅ REQUIRED - State Department of Revenue official websites:
   - comptroller.texas.gov
   - cdtfa.ca.gov
   - floridarevenue.com
   - tax.ny.gov
   - tax.illinois.gov
   - revenue.pa.gov
   - tax.ohio.gov
   - dor.georgia.gov
   - ncdor.gov
   - michigan.gov/taxes

✅ ACCEPTABLE - If primary source unclear:
   - State statutes (official .gov legislative websites)
   - State administrative codes/regulations
   - Official state tax bulletins or notices

❌ DO NOT USE:
   - Third-party tax websites (TaxJar, Avalara, etc.)
   - Wikipedia
   - Blog posts or articles
   - Law firm websites (unless citing primary source)
   - Outdated information (older than 2024)

OUTPUT FORMAT:

For each state, provide results in this EXACT format:

---
STATE: [State Name] ([XX])
RESEARCH DATE: [MM/DD/YYYY]

INTEREST:
- Annual Rate: [X.XX%]
- Monthly Rate: [X.XX%] (if applicable)
- Calculation Method: [simple | compound_monthly | compound_daily]
- Update Frequency: [fixed | quarterly | annually | variable]
- Effective Date: [MM/DD/YYYY]

PENALTIES:
- Late Registration: [X.XX%] of [tax | tax+interest]
  - Minimum: $[amount] or N/A
  - Maximum: $[amount] or N/A
- Late Filing: [X.XX%] or $[amount] per return
- Late Payment: [X.XX%] of tax
- Notes: [Any special conditions]

VDA TERMS:
- Interest Waived: [YES | NO | REDUCED to X%]
- Penalties Waived: [YES | NO | REDUCED to X%]
- Lookback Period: [XX months | UNLIMITED]
- Special Conditions: [Any restrictions or requirements]

SOURCES:
- Primary URL: [Full URL to specific page]
- Statute: [State Code § XX.XXX]
- Regulation: [Admin Code § XX.XXX] (if applicable)
- Last Verified on State Website: [MM/DD/YYYY]

DATABASE VALUES (ready to use):
```sql
INSERT INTO interest_penalty_rates VALUES (
    'XX',                    -- state_code
    0.XXXX,                  -- annual_interest_rate (decimal)
    '[method]',              -- interest_calculation_method
    0.XX,                    -- late_registration_penalty_rate (decimal)
    XX.XX,                   -- late_registration_penalty_min (or NULL)
    XXXX.XX,                 -- late_registration_penalty_max (or NULL)
    '[tax|tax_plus_interest]', -- penalty_applies_to
    [true|false],            -- vda_interest_waived
    [true|false],            -- vda_penalties_waived
    XX,                      -- vda_lookback_period_months
    'YYYY-MM-DD',           -- effective_from
    NULL                     -- effective_to (current rate)
);
```

CONFIDENCE LEVEL: [HIGH | MEDIUM | LOW]
- HIGH: Found on official state DOR website with clear documentation
- MEDIUM: Found in statute but not explicitly on DOR website
- LOW: Information unclear or conflicting

NOTES: [Any important caveats, special rules, or areas of uncertainty]
---

VALIDATION CHECKS:

Before providing results, verify:
1. ✓ All URLs are from official .gov websites
2. ✓ Interest rates are current (2024-2025)
3. ✓ Calculation method is explicitly stated
4. ✓ VDA information is from official state VDA program pages
5. ✓ SQL syntax is correct and ready to run

EXAMPLE OUTPUT (Texas):

---
STATE: Texas (TX)
RESEARCH DATE: 11/06/2025

INTEREST:
- Annual Rate: 15.00%
- Monthly Rate: 1.25%
- Calculation Method: compound_monthly
- Update Frequency: quarterly
- Effective Date: 01/01/2025

PENALTIES:
- Late Registration: 5.00% of tax
  - Minimum: N/A
  - Maximum: N/A
- Late Filing: 5.00% of tax (one-time)
- Late Payment: 5.00% of tax
- Notes: Penalties can stack (max 50% total)

VDA TERMS:
- Interest Waived: NO (charged at full rate)
- Penalties Waived: YES (fully waived)
- Lookback Period: 48 months
- Special Conditions: Must not have been contacted by state

SOURCES:
- Primary URL: https://comptroller.texas.gov/taxes/sales/rates.php
- Statute: Texas Tax Code §111.060 (interest), §111.061 (penalties)
- Regulation: 34 TAC §3.2 (VDA program)
- Last Verified on State Website: 11/05/2025

DATABASE VALUES:
```sql
INSERT INTO interest_penalty_rates VALUES (
    'TX',
    0.15,
    'compound_monthly',
    0.05,
    NULL,
    NULL,
    'tax',
    false,
    true,
    48,
    '2025-01-01',
    NULL
);
```

CONFIDENCE LEVEL: HIGH
- Found on official Texas Comptroller website
- Cross-referenced with statute
- VDA program details confirmed on official VDA page

NOTES: Texas uses 1.25% per month compounded monthly (15% annual equivalent). Rate adjusts quarterly based on federal short-term rate. Penalties can stack up to 50% maximum total.
---

BEGIN RESEARCH. Provide complete results for all 10 states.
```

---

## Batch 2: Southern States

**States:** Virginia, Tennessee, Alabama, South Carolina, Louisiana, Kentucky, Oklahoma, Arkansas, Mississippi, West Virginia

```
[Same format as Batch 1, but replace the STATES TO RESEARCH section with:]

STATES TO RESEARCH:
1. Virginia (VA)
2. Tennessee (TN)
3. Alabama (AL)
4. South Carolina (SC)
5. Louisiana (LA)
6. Kentucky (KY)
7. Oklahoma (OK)
8. Arkansas (AR)
9. Mississippi (MS)
10. West Virginia (WV)

[Use same AUTHORITATIVE SOURCES section but update URLs:]

✅ REQUIRED - State Department of Revenue official websites:
   - tax.virginia.gov
   - tn.gov/revenue
   - revenue.alabama.gov
   - dor.sc.gov
   - revenue.louisiana.gov
   - revenue.ky.gov
   - ok.gov/tax
   - dfa.arkansas.gov
   - dor.ms.gov
   - tax.wv.gov

[Rest of prompt remains the same]
```

---

## Batch 3: Western States

**States:** Washington, Arizona, Colorado, Oregon, Nevada, Utah, New Mexico, Idaho, Montana, Wyoming

```
STATES TO RESEARCH:
1. Washington (WA)
2. Arizona (AZ)
3. Colorado (CO)
4. Oregon (OR)
5. Nevada (NV)
6. Utah (UT)
7. New Mexico (NM)
8. Idaho (ID)
9. Montana (MT)
10. Wyoming (WY)

✅ REQUIRED - State Department of Revenue official websites:
   - dor.wa.gov
   - azdor.gov
   - tax.colorado.gov
   - oregon.gov/dor
   - tax.nv.gov
   - tax.utah.gov
   - tax.newmexico.gov
   - tax.idaho.gov
   - mtrevenue.gov
   - revenue.wyo.gov

[Rest of prompt remains the same]
```

---

## Batch 4: Midwest States

**States:** Wisconsin, Minnesota, Missouri, Indiana, Iowa, Kansas, Nebraska, South Dakota, North Dakota, Hawaii

```
STATES TO RESEARCH:
1. Wisconsin (WI)
2. Minnesota (MN)
3. Missouri (MO)
4. Indiana (IN)
5. Iowa (IA)
6. Kansas (KS)
7. Nebraska (NE)
8. South Dakota (SD)
9. North Dakota (ND)
10. Hawaii (HI)

✅ REQUIRED - State Department of Revenue official websites:
   - revenue.wi.gov
   - revenue.state.mn.us
   - dor.mo.gov
   - in.gov/dor
   - tax.iowa.gov
   - ksrevenue.gov
   - revenue.nebraska.gov
   - dor.sd.gov
   - nd.gov/tax
   - tax.hawaii.gov

[Rest of prompt remains the same]
```

---

## Batch 5: Northeast & Remaining States

**States:** Massachusetts, New Jersey, Maryland, Washington DC, Connecticut, Maine, New Hampshire, Vermont, Rhode Island, Delaware, Alaska

```
STATES TO RESEARCH:
1. Massachusetts (MA)
2. New Jersey (NJ)
3. Maryland (MD)
4. Washington DC (DC)
5. Connecticut (CT)
6. Maine (ME)
7. New Hampshire (NH)
8. Vermont (VT)
9. Rhode Island (RI)
10. Delaware (DE)
11. Alaska (AK)

NOTE: Alaska, Delaware, Montana, New Hampshire, and Oregon have no statewide sales tax, but research any interest/penalty rules for local taxes or use tax.

✅ REQUIRED - State Department of Revenue official websites:
   - mass.gov/dor
   - nj.gov/treasury/taxation
   - marylandtaxes.gov
   - otr.cfo.dc.gov
   - ct.gov/drs
   - maine.gov/revenue
   - revenue.nh.gov
   - tax.vermont.gov
   - tax.ri.gov
   - revenue.delaware.gov
   - tax.alaska.gov

[Rest of prompt remains the same]
```

---

## Post-Research Validation Checklist

After receiving results from Deep Research:

### For Each State, Verify:

- [ ] Source URL is from official .gov website
- [ ] Interest rate is current (2024-2025)
- [ ] Calculation method makes sense (most states use simple)
- [ ] VDA terms are from official VDA program page
- [ ] SQL statement is syntactically correct
- [ ] Confidence level is HIGH or MEDIUM (not LOW)

### Red Flags (Require Manual Review):

- ⚠️ Confidence level is LOW
- ⚠️ Source is not from official state website
- ⚠️ Interest rate seems unusually high (>20% annual) or low (<1% annual)
- ⚠️ Multiple conflicting sources found
- ⚠️ Information is dated (prior to 2024)

### Cross-Check Sample States:

Pick 2-3 states from each batch and manually verify:
1. Visit the source URL
2. Confirm the rate shown
3. Check effective date
4. Verify VDA terms if applicable

---

## Compilation Instructions

After completing all batches:

1. **Create Master Spreadsheet:**
   - Combine all results
   - Sort by state code
   - Flag any LOW confidence entries

2. **Generate Final SQL Script:**
   - Combine all SQL statements
   - Add header comments with sources
   - Include date generated and researcher name

3. **Document Gaps:**
   - List any states with incomplete data
   - Note any conflicting information
   - Identify states needing manual follow-up

4. **Peer Review:**
   - Have another team member spot-check 10-15 states
   - Verify calculations make sense
   - Confirm sources are authoritative

5. **Testing:**
   - Run SQL in test environment
   - Verify no syntax errors
   - Check calculations with known values

---

## Tips for Better Results

**Improving Deep Research Output:**

1. **Be Specific in Follow-ups:**
   - "The interest rate you found for California seems low. Can you verify this is the current 2025 rate on the CDTFA website?"
   - "Texas compound monthly interest: confirm the annual rate is 15% (1.25% per month) not 1.25% annual"

2. **Request Clarification:**
   - "For penalties that apply to 'tax,' confirm this means base tax only, not tax + interest"
   - "Verify the VDA lookback period is in months, not years"

3. **Ask for Screenshots:**
   - "Can you provide the exact text from the state website showing this rate?"

4. **Double-Check Math:**
   - If monthly rate is 1.25%, annual should be 15% (1.25% × 12)
   - Compound monthly at 1.25%/month ≈ 16.08% effective annual rate

---

## Example Batch Output Format (For Your Records)

After each batch, save results as:

```
batch_1_results_YYYYMMDD.md
batch_2_results_YYYYMMDD.md
etc.
```

Then compile into:
```
all_states_interest_penalty_rates_FINAL_YYYYMMDD.xlsx
all_states_interest_penalty_rates_FINAL_YYYYMMDD.sql
```

---

**Document Version:** 1.0
**Created:** November 6, 2025
**Batch Strategy:** 5 batches × 10 states = 50 states
**Estimated Time:** 30-45 minutes per batch
