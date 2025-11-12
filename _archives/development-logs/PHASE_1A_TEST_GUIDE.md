# Phase 1A Test Data Guide

## Test File: `phase_1a_test_data.csv`

This CSV contains 110 transactions across 5 states designed to demonstrate all Phase 1A features.

---

## What Each State Tests

### 1. **California (CA)** - Multi-Year Sticky Nexus
**Threshold:** $500,000 revenue (Current or Previous Calendar Year)
**Expected Results:**

**2022:**
- Total Sales: $668,000
- Nexus Date: **2022-06-20** (transaction TXN-005 crosses $500K threshold)
- Obligation Start: **2022-07-01** (first day of following month)
- Liability: Only on sales from July 1 onwards (TXN-006: $65K + TXN-007: $48K)
- Estimated Liability: ~$9,310 (8.25% avg rate on $113K)

**2023:**
- Total Sales: $343,000
- Nexus Date: **2022-06-20** (sticky - uses original nexus date)
- Obligation Start: **2023-01-01** (full year due to sticky nexus)
- First Nexus Year: **2022**
- Liability: All direct sales ($343K × 8.25%)
- Estimated Liability: ~$28,298

**2024:**
- Total Sales: $200,000
- Nexus Date: **2022-06-20** (sticky)
- Obligation Start: **2024-01-01** (full year)
- First Nexus Year: **2022**
- Liability: All direct sales ($200K × 8.25%)
- Estimated Liability: ~$16,500

**Total CA Liability Across 3 Years:** ~$54,108

---

### 2. **Illinois (IL)** - Nexus Without Liability
**Threshold:** $100,000 revenue OR 200 transactions (Current or Previous Calendar Year)
**Marketplace Facilitator Law:** Excludes marketplace sales from liability
**Expected Results:**

**2024:**
- Total Sales: $151,200 (Direct: $74,200 + Marketplace: $77,500)
- Nexus Date: **2024-07-03** (transaction TXN-016 crosses $100K threshold)
- Obligation Start: **2024-08-01**
- **Liability: $0** (No direct sales after Aug 1, only marketplace)
- Demonstrates: Nexus can exist with zero liability

---

### 3. **Florida (FL)** - Previous Calendar Year Lookback
**Threshold:** $100,000 revenue (Previous Calendar Year)
**Expected Results:**

**2023:**
- Total Sales: $115,000
- No nexus in 2023 (only looks at 2022, which has no data)

**2024:**
- Total Sales: $120,000
- Nexus Date: **2024-01-15** (first transaction in 2024, because 2023 had $115K)
- Obligation Start: **2024-02-01**
- Liability: Sales from Feb 1 onwards ($32K + $29K + $31K = $92K)
- Estimated Liability: ~$5,980 (6.5% avg rate on $92K)
- Demonstrates: Lookback to previous year establishes nexus from start of current year

---

### 4. **Texas (TX)** - Marketplace Facilitator Exclusion
**Threshold:** $500,000 revenue (Current or Previous Calendar Year)
**Marketplace Facilitator Law:** Excludes marketplace sales from liability
**Expected Results:**

**2024:**
- Total Sales: $320,000 (Direct: $137K + Marketplace: $183K)
- No nexus (doesn't cross $500K threshold)
- Demonstrates: Marketplace sales count toward nexus threshold but not liability

---

### 5. **New York (NY)** - Transaction Threshold
**Threshold:** $500,000 revenue OR 100 transactions (Current or Previous Calendar Year)
**Expected Results:**

**2024:**
- Total Sales: ~$138,000 (110 transactions of ~$1,250 each)
- Transaction Count: 110 transactions
- Nexus Date: **2024-09-05** (transaction TXN-100 is the 100th transaction)
- Obligation Start: **2024-10-01**
- Liability: Transactions from Oct 1 onwards (TXN-101 through TXN-110 = ~$13,050)
- Estimated Liability: ~$1,131 (8.67% avg rate on $13,050)
- Demonstrates: Transaction threshold can trigger nexus before revenue threshold

---

## Phase 1A Features Demonstrated

### ✅ Chronological Processing
- Exact nexus dates based on actual threshold crossing
- Not just "end of period" or "today"

### ✅ Multi-Year Tracking
- California shows nexus across 3 years (2022, 2023, 2024)
- Each year tracked separately in database

### ✅ Sticky Nexus Logic
- California 2023 & 2024 show `first_nexus_year: 2022`
- Obligation starts Jan 1 in subsequent years

### ✅ Obligation Start Date Calculation
- Always first day of month following nexus
- CA: June 20 nexus → July 1 obligation
- NY: Sept 5 nexus → Oct 1 obligation

### ✅ Calendar Year Lookback
- **Current or Previous Calendar Year:** CA, IL, TX, NY
- **Previous Calendar Year Only:** FL (shows lookback to 2023)

### ✅ Marketplace Facilitator Handling
- IL: Marketplace sales excluded from liability (but count toward threshold)
- TX: Marketplace sales excluded from liability

### ✅ Liability Calculation Accuracy
- Only includes sales on/after obligation start date
- IL shows $0 liability despite having nexus

### ✅ Transaction vs Revenue Thresholds
- NY crosses transaction threshold (100 txns) before revenue threshold ($500K)
- IL uses OR operator (crosses revenue threshold)

---

## How to Use This Test Data

### 1. Upload to Your Application
- Create a new analysis in the UI
- Upload `phase_1a_test_data.csv`
- Set analysis period: **2022-01-01 to 2024-12-31** (covers all 3 years)

### 2. Run Calculation
- Click "Calculate Nexus"
- Wait for V2 calculator to process

### 3. Verify Results

**Check Summary Dashboard:**
- States with nexus: 4 (CA, IL, FL, NY)
- States without nexus: 1 (TX)
- Total liability: ~$69,317

**Check State Results Table:**
Each state should show `year_data` array with per-year breakdown

**Check Individual State Details:**
- **CA:** Should show 3 years with sticky nexus
- **IL:** Should show nexus with $0 liability
- **FL:** Should show nexus date in Jan 2024 (from 2023 lookback)
- **NY:** Should show Oct 1 obligation start (from Sept 5 nexus)
- **TX:** Should show "No nexus"

---

## Expected API Response Structure

```json
{
  "states": [
    {
      "state_code": "CA",
      "state_name": "California",
      "nexus_status": "has_nexus",
      "total_sales": 1211000,
      "estimated_liability": 54108,
      "year_data": [
        {
          "year": 2022,
          "nexus_date": "2022-06-20",
          "obligation_start_date": "2022-07-01",
          "first_nexus_year": 2022,
          "estimated_liability": 9310
        },
        {
          "year": 2023,
          "nexus_date": "2022-06-20",
          "obligation_start_date": "2023-01-01",
          "first_nexus_year": 2022,
          "estimated_liability": 28298
        },
        {
          "year": 2024,
          "nexus_date": "2022-06-20",
          "obligation_start_date": "2024-01-01",
          "first_nexus_year": 2022,
          "estimated_liability": 16500
        }
      ]
    }
  ]
}
```

---

## Troubleshooting

### "No nexus detected for California"
- Check migration was applied (state_results has `year` column)
- Check state data was imported (lookback_period populated)
- Check V2 calculator is being used (not V1)

### "All states show current date as nexus_date"
- V1 calculator is still being used
- Restart backend after switching import

### "Year_data array is empty"
- API endpoints need to be updated
- Check `analyses.py` has multi-year grouping logic

---

**Ready to demonstrate Phase 1A is working!** 🎉
