# Phase 2 Test Data Guide

**File:** `test_data_phase2.csv`
**Purpose:** Test interest and penalty calculations across multiple states and scenarios
**Total Transactions:** 120 transactions spanning 2022-2024

---

## 📊 What This Data Tests

### States Included

| State | Transactions | Time Period | Threshold | Expected Outcome |
|-------|--------------|-------------|-----------|------------------|
| **California (CA)** | 47 (35 direct + 12 marketplace) | 2022-2024 | $500K | ✅ Nexus 2022-2024, Simple interest |
| **Texas (TX)** | 22 | 2023-2024 | $500K | ✅ Nexus 2023-2024, Compound monthly |
| **Florida (FL)** | 17 | 2023-2024 | $100K | ✅ Nexus 2023-2024, Simple interest |
| **Illinois (IL)** | 20 | 2023-2024 | $100K | ✅ Nexus 2023-2024, Rolling 12-month |
| **New York (NY)** | 11 | 2022-2024 | $500K | ❌ No nexus (below threshold) |

---

## 🎯 Expected Results by State

### California (CA) - Simple Interest at 3% Annual

**Scenario:** Large e-commerce company with 3 years of sales

**Expected Nexus:**
- **2022:** Nexus established in April 2022 (crossed $500K threshold)
- **2023:** Has nexus (sticky from 2022)
- **2024:** Has nexus (sticky from 2022)

**Sales Breakdown:**
- **Direct sales 2022:** $242,000
- **Direct sales 2023:** $262,000
- **Direct sales 2024:** $230,000
- **Marketplace sales:** Excluded from liability (not counted in taxable sales)

**Obligation Start:** May 1, 2022 (first of month after crossing)

**Expected Interest Calculation (2024):**
```
Base tax 2022 (May-Dec): ~$15,000
Interest (May 2022 → Dec 2024): ~2.67 years
Interest: $15,000 × 3% × 2.67 = ~$1,200

Base tax 2023: ~$23,000
Interest (Jan 2023 → Dec 2024): ~2 years
Interest: $23,000 × 3% × 2 = ~$1,380

Base tax 2024: ~$20,000
Interest (Jan 2024 → Dec 2024): ~1 year
Interest: $20,000 × 3% × 1 = ~$600

Total interest: ~$3,180
Total penalties: ~$5,800 (10% of base tax)
```

**Why This Matters:**
- Tests simple interest calculation (most common method)
- Tests multi-year sticky nexus with interest accumulation
- Tests marketplace exclusion rules

---

### Texas (TX) - Compound Monthly Interest at 18% Annual (1.5% per month)

**Scenario:** Growing SaaS company

**Expected Nexus:**
- **2023:** Nexus established in January 2023 (crossed $500K threshold)
- **2024:** Has nexus (sticky from 2023)

**Sales Breakdown:**
- **Direct sales 2023:** $636,000 (well above $500K threshold)
- **Direct sales 2024:** $593,000

**Obligation Start:** February 1, 2023

**Expected Interest Calculation (2024):**
```
Base tax 2023 (Feb-Dec): ~$62,000
Months: Feb 2023 → Dec 2024 = 23 months
Monthly rate: 18% / 12 = 1.5%
Interest: $62,000 × [(1.015)^23 - 1] = $62,000 × 0.4131 = ~$25,612

Base tax 2024: ~$49,000
Months: Jan 2024 → Dec 2024 = 12 months
Interest: $49,000 × [(1.015)^12 - 1] = $49,000 × 0.1956 = ~$9,584

Total interest: ~$35,196 (MUCH higher than simple!)
Total penalties: ~$5,550 (5% of base tax)
```

**Why This Matters:**
- Tests compound monthly interest (rare but very expensive)
- Shows dramatic difference vs simple interest
- Tests Texas-specific rules

---

### Florida (FL) - Simple Interest, Lower Threshold

**Scenario:** Mid-sized online retailer

**Expected Nexus:**
- **2023:** Nexus established in June 2023 (crossed $100K threshold in rolling window)
- **2024:** Has nexus (sticky from 2023)

**Sales Breakdown:**
- **Direct sales 2023:** $206,000 (Jun-Dec only)
- **Direct sales 2024:** $271,000

**Obligation Start:** July 1, 2023

**Expected Interest Calculation (2024):**
```
Base tax 2023 (Jul-Dec): ~$13,000
Interest (Jul 2023 → Dec 2024): ~1.5 years
Interest: $13,000 × 3% × 1.5 = ~$585

Base tax 2024: ~$18,000
Interest (Jan 2024 → Dec 2024): ~1 year
Interest: $18,000 × 3% × 1 = ~$540

Total interest: ~$1,125
Total penalties: ~$3,100 (10% of base tax)
```

**Why This Matters:**
- Tests lower threshold ($100K vs $500K)
- Tests calendar year lookback (Previous Year method)
- Tests mid-year nexus establishment

---

### Illinois (IL) - Rolling 12-Month Lookback

**Scenario:** New company growing rapidly

**Expected Nexus:**
- **2023:** Nexus established in September 2023 (rolling 12-month total crossed $100K)
- **2024:** Has nexus (sticky from 2023)

**Sales Breakdown:**
- **Direct sales 2023:** $189,000 total (Mar-Dec)
- **Direct sales 2024:** $221,000

**Obligation Start:** October 1, 2023 (first of month after rolling window crossed)

**Expected Interest Calculation (2024):**
```
Base tax 2023 (Oct-Dec): ~$4,200
Interest (Oct 2023 → Dec 2024): ~1.25 years
Interest: $4,200 × 3% × 1.25 = ~$158

Base tax 2024: ~$19,000
Interest (Jan 2024 → Dec 2024): ~1 year
Interest: $19,000 × 3% × 1 = ~$570

Total interest: ~$728
Total penalties: ~$2,320 (10% of base tax)
```

**Why This Matters:**
- Tests rolling 12-month lookback (Phase 1B feature)
- Tests threshold crossing detection in rolling window
- Tests sticky nexus from mid-year establishment

---

### New York (NY) - No Nexus (Below Threshold)

**Scenario:** Small business with limited NY sales

**Expected Nexus:**
- **2022-2024:** NO NEXUS (total sales ~$141,000 across 3 years, below $500K)

**Sales Breakdown:**
- **Direct sales 2022:** $39,000
- **Direct sales 2023:** $51,000
- **Direct sales 2024:** $40,500

**Expected Results:**
```
No nexus established
No tax liability
No interest
No penalties
```

**Why This Matters:**
- Tests edge case where threshold is NOT met
- Verifies system doesn't incorrectly create nexus
- Tests multi-year tracking without nexus

---

## 🧪 How to Test

### Step 1: Upload the CSV

1. Go to your SALT Tax Tool dashboard
2. Click "Upload Transactions" or "New Analysis"
3. Select `test_data_phase2.csv`
4. Click "Upload" or "Analyze"

### Step 2: Review State Results

**California (CA):**
```
Expected to see:
✓ Year 2022: Nexus established April 2022
  - Obligation start: May 1, 2022
  - Base tax: ~$15,000
  - Interest: ~$1,200
  - Penalties: ~$1,500

✓ Year 2023: Has nexus (sticky)
  - Base tax: ~$23,000
  - Interest: ~$1,380
  - Penalties: ~$2,300

✓ Year 2024: Has nexus (sticky)
  - Base tax: ~$20,000
  - Interest: ~$600
  - Penalties: ~$2,000
```

**Texas (TX):**
```
Expected to see:
✓ Year 2023: Nexus established January 2023
  - Obligation start: February 1, 2023
  - Base tax: ~$62,000
  - Interest: ~$25,612 (compound monthly - HIGH!)
  - Penalties: ~$3,100

✓ Year 2024: Has nexus (sticky)
  - Base tax: ~$49,000
  - Interest: ~$9,584 (compound monthly)
  - Penalties: ~$2,450
```

**Florida (FL):**
```
Expected to see:
✓ Year 2023: Nexus established June 2023
  - Obligation start: July 1, 2023
  - Base tax: ~$13,000
  - Interest: ~$585
  - Penalties: ~$1,300

✓ Year 2024: Has nexus (sticky)
  - Base tax: ~$18,000
  - Interest: ~$540
  - Penalties: ~$1,800
```

**Illinois (IL):**
```
Expected to see:
✓ Year 2023: Nexus established September 2023 (rolling)
  - Obligation start: October 1, 2023
  - Base tax: ~$4,200
  - Interest: ~$158
  - Penalties: ~$420

✓ Year 2024: Has nexus (sticky)
  - Base tax: ~$19,000
  - Interest: ~$570
  - Penalties: ~$1,900
```

**New York (NY):**
```
Expected to see:
✗ No nexus in any year
  - Total sales below $500K threshold
  - No tax liability
```

---

## 🔍 What to Look For

### 1. **Interest Calculation Method**

Check that each state uses the correct method:
- **CA, FL, NY, IL:** Simple interest
- **TX:** Compound monthly interest (should be significantly higher)

### 2. **Multi-Year Accumulation**

Verify that:
- Interest accumulates year over year
- Older years have more interest than recent years
- 2022 liabilities have ~2-3 years of interest
- 2024 liabilities have ~1 year of interest

### 3. **Sticky Nexus**

Confirm that:
- Once nexus is established, it shows in all future years
- "First Nexus Year" is correctly displayed
- Each year shows "Has nexus (from [year])" message

### 4. **Marketplace Exclusions**

Verify that:
- California marketplace sales ($336,000 total) are NOT included in liability
- Only direct sales are counted toward tax liability
- Marketplace sales ARE counted toward threshold (for crossing detection)

### 5. **Penalty Calculation**

Check that:
- Penalties are 5-10% of base tax (depending on state)
- Penalties are separate line items
- Total liability = base_tax + interest + penalties

### 6. **API Response Format**

Verify JSON structure:
```json
{
  "state_code": "CA",
  "year_data": [
    {
      "year": 2022,
      "nexus_date": "2022-04-15",
      "obligation_start_date": "2022-05-01",
      "summary": {
        "estimated_liability": 17700,
        "base_tax": 15000,
        "interest": 1200,
        "penalties": 1500
      }
    }
  ]
}
```

---

## 📈 Expected Totals (Approximate)

| State | Total Base Tax | Total Interest | Total Penalties | Grand Total |
|-------|----------------|----------------|-----------------|-------------|
| California | $58,000 | $3,180 | $5,800 | $66,980 |
| Texas | $111,000 | $35,196 | $5,550 | $151,746 |
| Florida | $31,000 | $1,125 | $3,100 | $35,225 |
| Illinois | $23,200 | $728 | $2,320 | $26,248 |
| New York | $0 | $0 | $0 | $0 |
| **TOTAL** | **$223,200** | **$40,229** | **$16,770** | **$280,199** |

**Key Insight:** Texas compound monthly interest is ~$35K, while California simple interest on similar base is only ~$3K. This shows the dramatic impact of compound interest!

---

## 🐛 Troubleshooting

### Issue: "No nexus found for any state"

**Possible Causes:**
1. Database missing state rules
2. Thresholds configured incorrectly
3. Calculator routing error

**Fix:**
```sql
-- Check if state rules exist
SELECT state_code, revenue_threshold, lookback_period
FROM nexus_rules
WHERE state_code IN ('CA', 'TX', 'FL', 'IL', 'NY');
```

---

### Issue: "Interest is 0 for all states"

**Possible Causes:**
1. `interest_penalty_rates` table not populated
2. Configuration fetch failing
3. Interest calculation not integrated

**Fix:**
```sql
-- Check if interest config exists
SELECT state_code, annual_interest_rate, interest_calculation_method
FROM interest_penalty_rates
WHERE effective_to IS NULL;
```

---

### Issue: "Penalties are 0 for all states"

**Possible Causes:**
1. `late_registration_penalty_rate` not set in database
2. Penalty calculation not integrated

**Fix:**
```sql
-- Add penalty rates
UPDATE interest_penalty_rates
SET late_registration_penalty_rate = 0.10  -- 10%
WHERE state_code IN ('CA', 'FL', 'IL', 'NY');

UPDATE interest_penalty_rates
SET late_registration_penalty_rate = 0.05  -- 5%
WHERE state_code = 'TX';
```

---

### Issue: "Texas interest seems too low"

**Check:**
- Is `annual_interest_rate` set to 0.18 (not 0.015)?
- Is `interest_calculation_method` set to 'compound_monthly'?

**Fix:**
```sql
UPDATE interest_penalty_rates
SET annual_interest_rate = 0.18,
    interest_calculation_method = 'compound_monthly'
WHERE state_code = 'TX';
```

---

## 📝 Manual Verification Checklist

Use this checklist to verify Phase 2 is working correctly:

### California
- [ ] Nexus established in 2022
- [ ] Obligation starts May 1, 2022
- [ ] Base tax ~$15K (2022), ~$23K (2023), ~$20K (2024)
- [ ] Interest calculation method: simple
- [ ] Interest accumulates year over year
- [ ] Penalties at 10% of base tax
- [ ] Marketplace sales excluded from liability

### Texas
- [ ] Nexus established in 2023
- [ ] Obligation starts February 1, 2023
- [ ] Base tax ~$62K (2023), ~$49K (2024)
- [ ] Interest calculation method: compound_monthly
- [ ] Interest is MUCH higher than simple interest states
- [ ] Penalties at 5% of base tax

### Florida
- [ ] Nexus established mid-2023
- [ ] Threshold is $100K (not $500K)
- [ ] Interest calculation method: simple
- [ ] Penalties at 10% of base tax

### Illinois
- [ ] Nexus established using rolling 12-month lookback
- [ ] Nexus date is in September 2023
- [ ] Sticky nexus applies to 2024
- [ ] Interest calculation method: simple

### New York
- [ ] NO nexus established (below threshold)
- [ ] $0 liability, $0 interest, $0 penalties
- [ ] Shows as "No nexus" status

---

## 🎯 Success Criteria

Phase 2 is working correctly if:

1. ✅ All states show correct nexus determination
2. ✅ Interest amounts are non-zero for states with nexus
3. ✅ Texas interest is significantly higher than other states (compound vs simple)
4. ✅ Penalties are calculated and shown separately
5. ✅ Multi-year interest accumulation is visible
6. ✅ API responses include `base_tax`, `interest`, `penalties` fields
7. ✅ New York shows no nexus (edge case verification)
8. ✅ Marketplace sales excluded from California liability

---

## 📚 Next Steps After Testing

Once you've verified the test data works correctly:

1. **Test with Real Data:** Upload actual company transaction data
2. **Database Population:** Populate `interest_penalty_rates` for all 50 states
3. **VDA Testing:** Test VDA scenarios with penalty waivers
4. **Frontend Updates:** Ensure UI shows interest/penalty breakdown
5. **Phase 3 Planning:** Start planning pre-law marketplace scenarios

---

**Test Data Version:** 1.0
**Created:** November 5, 2025
**Total Transactions:** 120
**States Tested:** 5 (CA, TX, FL, IL, NY)
**Time Period:** 2022-2024
