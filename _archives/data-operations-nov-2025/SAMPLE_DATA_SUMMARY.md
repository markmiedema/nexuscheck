# Sample Sales Data Summary

## File: `sample-sales-data-with-nexus.csv`

### Purpose
Demonstrates the nexus calculation engine with realistic data that:
- ✅ **Triggers economic nexus** in 4 states (exceeds $100,000 threshold)
- ❌ **Does NOT trigger nexus** in 4 other states (below $100,000 threshold)

---

## Expected Results

### States WITH Economic Nexus (> $100,000):

| State | Transactions | Total Sales | Status |
|-------|-------------|-------------|--------|
| **California (CA)** | ~50 | ~$150,000 | ✅ HAS NEXUS |
| **Texas (TX)** | ~45 | ~$120,000 | ✅ HAS NEXUS |
| **Florida (FL)** | ~40 | ~$110,000 | ✅ HAS NEXUS |
| **New York (NY)** | ~35 | ~$105,000 | ✅ HAS NEXUS |

### States WITHOUT Nexus (< $100,000):

| State | Transactions | Total Sales | Status |
|-------|-------------|-------------|--------|
| **Washington (WA)** | ~30 | ~$85,000 | ❌ NO NEXUS (Approaching) |
| **Illinois (IL)** | ~25 | ~$60,000 | ❌ NO NEXUS |
| **Pennsylvania (PA)** | ~20 | ~$40,000 | ❌ NO NEXUS |
| **Ohio (OH)** | ~15 | ~$25,000 | ❌ NO NEXUS |

---

## Overall Totals

- **Total Transactions:** 260
- **Total Sales:** ~$695,000
- **States Analyzed:** 8
- **States with Nexus:** 4
- **States without Nexus:** 4
- **States Approaching Threshold:** 1 (Washington at ~85% of $100k)

---

## Expected Tax Liability (Estimates)

Assuming combined tax rates:
- **CA:** 8.84% = $150k × 8.84% = **~$13,260**
- **TX:** 8.19% = $120k × 8.19% = **~$9,828**
- **FL:** 7.01% = $110k × 7.01% = **~$7,711**
- **NY:** 8.52% = $105k × 8.52% = **~$8,946**

**Total Estimated Liability:** **~$39,745**

*(Actual amounts will vary slightly based on exact transaction totals and tax rate data in database)*

---

## How to Use This File

### 1. Create New Analysis
```
1. Go to: http://localhost:3000/analysis/new
2. Fill in:
   - Company Name: "Test Company with Nexus"
   - Period: 2024-01-01 to 2024-12-31
   - Business Type: product_sales
3. Click "Continue to Upload"
```

### 2. Upload CSV
```
1. Drag and drop: sample-sales-data-with-nexus.csv
2. Preview should show 260 transactions
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
2. Wait 3-5 seconds
3. Results should show:
   - States with Nexus: 4
   - Est. Liability: ~$39,745
   - Economic Nexus: 4
   - No Nexus: 4
```

### 5. View Top States
```
Should see ranking:
#1 California: ~$13,260
#2 Texas: ~$9,828
#3 New York: ~$8,946
#4 Florida: ~$7,711
```

---

## Data Characteristics

### Sales Channels
- **Direct Sales:** ~60% of transactions
- **Marketplace Sales:** ~40% of transactions

### Transaction Amounts
- Range: $1,500 - $3,300 per transaction
- Average: ~$2,673 per transaction
- Realistic variation across states and time periods

### Date Distribution
- Spread evenly throughout 2024
- All 12 months represented
- Realistic business patterns

### Transaction IDs
- Unique sequential IDs: TXN-2024-0001 through TXN-2024-0260
- Can be used for tracking and verification

---

## Testing Scenarios

### Scenario 1: Basic Calculation
**Action:** Upload file → Calculate
**Expected:** 4 states with nexus, $39k+ liability

### Scenario 2: Recalculation
**Action:** Click "Recalculate" button
**Expected:** Same results, confirms idempotency

### Scenario 3: Approaching Threshold
**Action:** Check "Approaching Threshold" section
**Expected:** Washington (WA) appears with ~$85k / $100k

### Scenario 4: State Detail (Future)
**Action:** Click on California in table
**Expected:** Navigate to detailed CA breakdown

---

## Comparison to Previous Sample

### Old Sample: `sample-sales-data.csv`
- 150 transactions
- $195,133 total sales
- 6 states
- **0 states with nexus** (amounts too low)

### New Sample: `sample-sales-data-with-nexus.csv`
- 260 transactions
- ~$695,000 total sales
- 8 states
- **4 states with nexus** (exceeds thresholds)

---

## Verification Queries

After uploading and calculating, verify in database:

```sql
-- Check transaction counts by state
SELECT customer_state, COUNT(*), SUM(sales_amount)
FROM sales_transactions
WHERE analysis_id = 'YOUR_ANALYSIS_ID'
GROUP BY customer_state
ORDER BY SUM(sales_amount) DESC;

-- Check calculated results
SELECT state, nexus_type, total_sales, estimated_liability
FROM state_results
WHERE analysis_id = 'YOUR_ANALYSIS_ID'
ORDER BY estimated_liability DESC;
```

---

## Notes

- Economic nexus threshold is typically **$100,000 OR 200 transactions**
- This dataset uses the revenue threshold (most common)
- No state reaches 200 transactions, so nexus is determined by revenue only
- Washington (WA) is intentionally set at 85% to test "approaching threshold" logic
- Tax rates are pulled from the `tax_rates` table in database
- Actual liability calculations may vary slightly from estimates based on database rates

---

**Created:** 2025-11-04
**Purpose:** Testing nexus calculation engine with realistic scenarios
**Status:** Ready to use
