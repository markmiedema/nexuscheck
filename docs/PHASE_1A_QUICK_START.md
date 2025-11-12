# Phase 1A Quick Start Guide

**Get Phase 1A running in 10 minutes**

---

## Prerequisites

- Database access (Supabase)
- Python environment set up
- Backend running

---

## Step 1: Apply Database Migration (2 mins)

Navigate to Supabase dashboard or use your migration tool:

```sql
-- Run this migration file:
-- D:\01 - Projects\SALT-Tax-Tool-Clean\migrations\010_phase_1a_multi_year_chronological.sql
```

**What it does:**
- Adds `lookback_period` column to `economic_nexus_thresholds`
- Adds `year`, `nexus_date`, `obligation_start_date`, `first_nexus_year` to `state_results`
- Updates constraints and indexes

**Verify:**
```sql
-- Check new columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'state_results'
AND column_name IN ('year', 'nexus_date', 'obligation_start_date', 'first_nexus_year');

-- Should return 4 rows
```

---

## Step 2: Import State Nexus Rules (3 mins)

```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\backend
python scripts/import_state_nexus_rules.py
```

**Expected output:**
```
Loading state nexus rules from: D:\01 - Projects\SALT-Tax-Tool-Clean\state_sales_tax_nexus.json
Found 45 states in JSON
Processing AL (Alabama)
  Lookback: Previous Calendar Year
  Revenue threshold: $250,000
  ...
✓ Updated existing threshold record
...
============================================================
Import complete!
Updated: 45 states
Skipped: 0 states
============================================================
```

**Verify:**
```sql
-- Check lookback periods were imported
SELECT state, lookback_period
FROM economic_nexus_thresholds
WHERE effective_to IS NULL
LIMIT 10;

-- Should see lookback periods populated
```

---

## Step 3: Run Tests (2 mins)

```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\backend
pytest tests/test_nexus_calculator_v2_phase1a.py -v
```

**Expected output:**
```
test_illinois_nexus_without_liability PASSED
test_florida_nexus_with_liability PASSED
test_multi_year_sticky_nexus PASSED
test_find_threshold_crossing PASSED
test_calculate_obligation_start_date PASSED
test_no_nexus_result PASSED
test_transaction_threshold PASSED
test_zero_sales_state PASSED
test_marketplace_only_transactions PASSED

========================= 9 passed in 2.5s =========================
```

All tests should pass ✅

---

## Step 4: Test V2 Calculator Manually (Optional - 3 mins)

Create a test script to verify V2 works with your database:

```python
# test_v2_manual.py
from app.core.database import get_supabase_client
from app.services.nexus_calculator_v2 import NexusCalculatorV2

# Connect to database
supabase = get_supabase_client()

# Create calculator
calculator = NexusCalculatorV2(supabase)

# Test with existing analysis (replace with your analysis ID)
analysis_id = "your-analysis-id-here"

result = calculator.calculate_nexus_for_analysis(analysis_id)

print(f"States analyzed: {result['total_states_analyzed']}")
print(f"States with nexus: {result['states_with_nexus']}")
print(f"Total liability: ${result['total_estimated_liability']:,.2f}")
print(f"Status: {result['status']}")
```

Run it:
```bash
python test_v2_manual.py
```

---

## Step 5: Update API to Use V2 (When Ready)

When you're ready to switch from V1 to V2 in production:

**Find your API endpoint** (likely in `app/api/routes/analysis.py` or similar):

```python
# OLD (V1):
from app.services.nexus_calculator import NexusCalculator

# NEW (V2):
from app.services.nexus_calculator_v2 import NexusCalculatorV2
```

**Change instantiation:**
```python
# OLD:
calculator = NexusCalculator(supabase)

# NEW:
calculator = NexusCalculatorV2(supabase)
```

The V2 calculator has the same interface (`calculate_nexus_for_analysis`), so it's a drop-in replacement!

---

## Verification Checklist

After deployment, verify:

### Database
- [ ] Migration 010 applied
- [ ] state_results has new columns (year, nexus_date, obligation_start_date, first_nexus_year)
- [ ] economic_nexus_thresholds has lookback_period column
- [ ] All 45 states have lookback periods populated

### Code
- [ ] V2 calculator tests pass
- [ ] Manual test works with real analysis

### Results
- [ ] Nexus dates are actual dates (not current date)
- [ ] Obligation start dates are first of following month
- [ ] Multi-year analyses show separate results per year
- [ ] Sticky nexus works (nexus continues in subsequent years)

---

## Troubleshooting

### "Column 'lookback_period' does not exist"
**Solution:** Run migration 010

### "No module named 'dateutil'"
**Solution:**
```bash
pip install python-dateutil
```

### "Import script says 'skipped 45 states'"
**Solution:** Check that `state_sales_tax_nexus.json` is in the project root

### Tests fail with "ModuleNotFoundError"
**Solution:** Make sure you're in the backend directory:
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\backend
```

### "Duplicate key value violates unique constraint"
**Solution:** Migration might have been run twice. Check if columns already exist:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'state_results';
```

---

## Rolling Back (If Needed)

If you need to roll back Phase 1A:

```sql
-- Remove added columns
ALTER TABLE state_results DROP COLUMN IF EXISTS year;
ALTER TABLE state_results DROP COLUMN IF EXISTS nexus_date;
ALTER TABLE state_results DROP COLUMN IF EXISTS obligation_start_date;
ALTER TABLE state_results DROP COLUMN IF EXISTS first_nexus_year;

ALTER TABLE economic_nexus_thresholds DROP COLUMN IF EXISTS lookback_period;
ALTER TABLE marketplace_facilitator_rules DROP COLUMN IF EXISTS effective_from;

-- Restore old constraint
ALTER TABLE state_results DROP CONSTRAINT IF EXISTS unique_analysis_state_year;
ALTER TABLE state_results ADD CONSTRAINT unique_analysis_state UNIQUE (analysis_id, state);
```

Then switch API back to V1 calculator.

---

## Next Steps

Once Phase 1A is verified working:

**Immediate options:**
1. **Use it!** Run analyses with the new calculator
2. **Build Phase 1B** (rolling 12-month lookback for IL, TX, etc.)
3. **Build Phase 2** (interest calculation and VDA scenarios)
4. **Build Phase 3** (pre-law marketplace scenarios)

**Reference documents:**
- Full plan: `docs/plans/nexus_calculation_implementation_plan.md`
- Summary: `docs/plans/PHASE_1A_IMPLEMENTATION_SUMMARY.md`

---

**Questions or Issues?**

Check the implementation plan or review the test cases for examples of expected behavior.

**Happy Calculating!** 🎉
