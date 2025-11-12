# Accurate Sample Sales Data Summary

## File: `sample-sales-data-accurate.csv`

### Purpose
Demonstrates the nexus calculation engine with **CORRECT** state-specific thresholds:
- ✅ **Triggers economic nexus** in 2 states with $100,000 thresholds
- ❌ **Does NOT trigger nexus** in 2 states with $500,000 thresholds

---

## Actual Economic Nexus Thresholds (from database)

| State | Revenue Threshold | Transaction Threshold | Operator |
|-------|-------------------|----------------------|----------|
| **California** | $500,000 | None | (revenue only) |
| **Texas** | $500,000 | None | (revenue only) |
| **Florida** | $100,000 | None | (revenue only) |
| **Colorado** | $100,000 | None | (revenue only) |

Source: `economic_nexus_threshold.csv` loaded into database

---

## Expected Results

### States WITH Economic Nexus (exceeds threshold):

| State | Threshold | Transactions | Total Sales | Status |
|-------|-----------|--------------|-------------|--------|
| **Florida (FL)** | $100,000 | 35 | ~$120,000 | ✅ HAS NEXUS |
| **Colorado (CO)** | $100,000 | 30 | ~$110,000 | ✅ HAS NEXUS |

### States WITHOUT Nexus (below threshold):

| State | Threshold | Transactions | Total Sales | Status |
|-------|-----------|--------------|-------------|--------|
| **California (CA)** | $500,000 | 30 | ~$80,000 | ❌ NO NEXUS (only 16% of threshold) |
| **Texas (TX)** | $500,000 | 25 | ~$70,000 | ❌ NO NEXUS (only 14% of threshold) |

---

## Overall Totals

- **Total Transactions:** 120
- **Total Sales:** ~$380,000
- **States Analyzed:** 4
- **States with Nexus:** 2 (Florida, Colorado)
- **States without Nexus:** 2 (California, Texas)
- **States Approaching Threshold:** 0

---

## Expected Tax Liability (Estimates)

Assuming combined tax rates from database:
- **Florida:** 7.01% = $120k × 7.01% = **~$8,412**
- **Colorado:** 7.77% = $110k × 7.77% = **~$8,547**

**Total Estimated Liability:** **~$16,959**

California and Texas: $0 (no nexus)

*(Actual amounts will vary based on exact transaction totals and tax rate data in database)*

---

## Transaction Breakdown by State

### Florida (35 transactions)
- Average: ~$3,428 per transaction
- Sales Channel Mix: ~60% direct, ~40% marketplace
- Total: ~$120,000

### Colorado (30 transactions)
- Average: ~$3,666 per transaction
- Sales Channel Mix: ~60% direct, ~40% marketplace
- Total: ~$110,000

### California (30 transactions)
- Average: ~$2,666 per transaction
- Sales Channel Mix: ~60% direct, ~40% marketplace
- Total: ~$80,000

### Texas (25 transactions)
- Average: ~$2,800 per transaction
- Sales Channel Mix: ~60% direct, ~40% marketplace
- Total: ~$70,000

---

## Key Insights

### Why This Data is Better:

1. **Realistic State Differences**: Shows that nexus thresholds vary significantly by state
   - CA & TX have **$500,000** thresholds (5x higher!)
   - FL & CO have **$100,000** thresholds (standard)

2. **Clear Pass/Fail**: No ambiguity
   - FL is 20% over its threshold (clear nexus)
   - CO is 10% over its threshold (clear nexus)
   - CA is 84% below its threshold (clear no nexus)
   - TX is 86% below its threshold (clear no nexus)

3. **No Transaction Threshold Confusion**: All 4 states use revenue-only thresholds
   - No need to worry about "OR 200 transactions" logic
   - Clean test of revenue-based nexus determination

---

## How to Use This File

### 1. Create New Analysis
```
1. Go to: http://localhost:3000/analysis/new
2. Fill in:
   - Company Name: "Test Company - Accurate Thresholds"
   - Period: 2024-01-01 to 2024-12-31
   - Business Type: product_sales
3. Click "Continue to Upload"
```

### 2. Upload CSV
```
1. Drag and drop: sample-sales-data-accurate.csv
2. Preview should show 120 transactions
3. Click "Confirm Upload"
```

### 3. Map & Validate
```
1. Columns should auto-map correctly
2. Click "Validate Data"
3. Should pass with 0 errors
4. Click "Proceed to Results"
```

### 4. Calculate Nexus
```
1. Click "Calculate Nexus" button
2. Wait 2-3 seconds
3. Results should show:
   - States with Nexus: 2
   - Est. Liability: ~$16,959
   - Economic Nexus: 2
   - No Nexus: 2
```

### 5. View Top States
```
Should see ranking:
#1 Colorado: ~$8,547
#2 Florida: ~$8,412

California and Texas should NOT appear (no liability)
```

---

## Verification in Database

After calculating, run these queries:

```sql
-- Should show sales by state
SELECT customer_state, COUNT(*), SUM(sales_amount)
FROM sales_transactions
WHERE analysis_id = 'YOUR_ANALYSIS_ID'
GROUP BY customer_state
ORDER BY customer_state;

-- Expected results:
-- CA: 30 transactions, ~$80,000
-- CO: 30 transactions, ~$110,000
-- FL: 35 transactions, ~$120,000
-- TX: 25 transactions, ~$70,000
```

```sql
-- Should show nexus determinations
SELECT state, nexus_type, total_sales, estimated_liability
FROM state_results
WHERE analysis_id = 'YOUR_ANALYSIS_ID'
ORDER BY state;

-- Expected results:
-- CA: 'none', $80,000, $0
-- CO: 'economic', $110,000, ~$8,547
-- FL: 'economic', $120,000, ~$8,412
-- TX: 'none', $70,000, $0
```

---

## Testing the Calculator Logic

This data tests:

✅ **Different threshold amounts** ($100k vs $500k)
✅ **Clear pass/fail scenarios** (no edge cases)
✅ **Multiple states with nexus** (2 states to rank)
✅ **Multiple states without nexus** (ensures "no nexus" logic works)
✅ **Liability calculation** (can verify against expected ~$17k)
✅ **State-specific tax rates** (FL vs CO have different rates)

---

## Important Notes

### About State Thresholds:

- **California**: $500,000 (unique to CA and NY/TX)
- **Texas**: $500,000 (same as CA)
- **New York**: $500,000 AND 100 transactions (more complex)
- **Alabama**: $250,000 (in between)
- **Mississippi**: $250,000 (in between)
- **Most other states**: $100,000 OR 200 transactions

### Why I Chose These 4 States:

1. **Florida** - Standard $100k threshold, very common
2. **Colorado** - Standard $100k threshold, tests consistency
3. **California** - High $500k threshold, largest state economy
4. **Texas** - High $500k threshold, no state income tax

This mix shows the calculator handles different thresholds correctly!

---

## Comparison to Previous Samples

### Old Sample #1: `sample-sales-data.csv`
- ❌ 150 transactions across 6 states
- ❌ $195k total, all states below $100k
- ❌ Result: 0 states with nexus (too low)

### Old Sample #2: `sample-sales-data-with-nexus.csv`
- ❌ 260 transactions across 8 states
- ❌ Assumed ALL states have $100k threshold (WRONG!)
- ❌ Would incorrectly show CA/TX with nexus

### New Sample: `sample-sales-data-accurate.csv`
- ✅ 120 transactions across 4 states
- ✅ Uses ACTUAL thresholds from database
- ✅ Clean 2 with / 2 without nexus result
- ✅ Realistic and demonstrates state differences

---

**Created:** 2025-11-04
**Purpose:** Testing nexus calculation with ACCURATE state thresholds
**Status:** Ready to use
**Recommended:** Use this for all testing going forward!
