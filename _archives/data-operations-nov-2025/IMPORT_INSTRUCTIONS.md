# Importing Research Data - Quick Start Guide

**Goal:** Load your 21 states of research data into Supabase

---

## Prerequisites

✅ You have research data in: `D:\SALT-Tax-Data\parsed_data\`
✅ Supabase tables created: `interest_penalty_rates`, `vda_programs`
✅ Python environment with `supabase` package installed

---

## Step 1: Set Environment Variables

```bash
# In Git Bash:
export SUPABASE_URL="https://aljqqzdpndvuojkwfkfz.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsanFxemRwbmR2dW9qa3dma2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjEwODcwMywiZXhwIjoyMDc3Njg0NzAzfQ.pTxo-0dW1MpODJaqDpmG9Q9SCikxL8977s0-UxZ6yBc"
```

---

## Step 2: Run Import Script

```bash
cd /d/01\ -\ Projects/SALT-Tax-Tool-Clean/backend
source venv/Scripts/activate
python import_research_data.py
```

**Expected Output:**
```
Connecting to Supabase...
✓ Connected

======================================================================
IMPORTING STATE RESEARCH DATA
======================================================================

Found 10 interest files
Found 10 penalty files
Found 10 VDA files

======================================================================
STEP 1: Importing Interest Rates
======================================================================

Processing al_ar_interest.json...
  ✓ AL: Interest rate imported
  ✓ AR: Interest rate imported
...

✅ All data imported successfully!
```

---

## Step 3: Create Compatibility View

This view makes your new detailed schema work with the existing Phase 2 code.

**In Supabase Dashboard:**

1. Go to SQL Editor
2. Open `create_phase2_compatibility_view.sql`
3. Copy and paste the entire file
4. Click "Run"

**Expected:** View `interest_penalty_rates_v2_compat` created successfully

---

## Step 4: Update Phase 2 Code

Make a small change to use the compatibility view:

**File:** `backend/app/services/interest_calculator.py`

**Line ~292:** Change from:

```python
result = self.supabase.table('interest_penalty_rates') \
    .select('*') \
    .eq('state_code', state_code) \
    .is_('effective_to', 'null') \
    .limit(1) \
    .execute()
```

**To:**

```python
result = self.supabase.from_('interest_penalty_rates_v2_compat') \
    .select('*') \
    .eq('state_code', state_code) \
    .limit(1) \
    .execute()
```

**Note:** Use `from_()` instead of `table()` for views, and remove the `effective_to` filter (handled by view).

---

## Step 5: Restart Backend

```bash
cd /d/01\ -\ Projects/SALT-Tax-Tool-Clean/backend
source venv/Scripts/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Step 6: Test with Real Data

Upload your test CSV (`test_data_phase2.csv`) and check Texas:

**Expected API Response:**
```json
{
  "state_code": "TX",
  "year_data": [
    {
      "year": 2023,
      "summary": {
        "base_tax": 8774.0,
        "interest": 745.79,      ← Real 8.5% rate!
        "penalties": 438.70,      ← Real 5% penalty!
        "estimated_liability": 9958.49
      }
    }
  ]
}
```

**Before (with placeholder 18% rate):** Interest would be ~$3,156
**After (with real 8.5% rate):** Interest is ~$746

---

## Troubleshooting

### Issue: "Module 'supabase' not found"

```bash
pip install supabase
```

### Issue: "Permission denied" or "Unauthorized"

Check that `SUPABASE_SERVICE_ROLE_KEY` is the **service role key** (not anon key).

### Issue: "Table 'interest_penalty_rates' does not exist"

Run your schema migration SQL first (the one that creates the three tables).

### Issue: Import script shows errors

Check the error message. Common causes:
- JSON file format issue
- Missing required fields
- Database constraint violation

### Issue: Phase 2 still showing old placeholder rates

1. Verify data imported: Check Supabase table browser
2. Verify view created: Check Supabase SQL Editor
3. Verify code updated: Check `interest_calculator.py` line ~292
4. Restart backend server

---

## Data Summary

**21 States Imported:**
- TX, CA, NY (Batch 1)
- IL, FL (Batch 2)
- PA, OH (Batch 3)
- GA, NC (Batch 4)
- MI, NJ (Batch 5)
- WA, AZ (Batch 6)
- AL, AR (Batch 7)
- MA, VA (Batch 8)
- CO, TN (Batch 9)
- MD, WI (Batch 10)

**29 States Remaining:** Need to continue Deep Research for remaining states.

---

## Real Rates Examples

Your research revealed the REAL rates (not our placeholders!):

| State | Interest Rate | Method | Penalty | Our Placeholder |
|-------|--------------|--------|---------|-----------------|
| Texas | **8.5%** annual | simple_daily | 5-10% tiered | Was 18% |
| California | **10%** annual | simple_monthly | 10% (capped) | Was 3% |
| New York | **14.5%** annual | compound_daily | 10-30% tiered | Was 3% |

**Impact:** Much more accurate liability calculations!

---

## Next Steps

1. ✅ Import the 21 states you have
2. ✅ Test Phase 2 calculations with real rates
3. 🔜 Continue Deep Research for remaining 29 states
4. 🔜 Update frontend to show interest/penalty breakdown
5. 🔜 Document rate update process (quarterly/annually)

---

**Questions?** Check the files:
- `import_research_data.py` - Import script source code
- `create_phase2_compatibility_view.sql` - View definition
- `docsplans/PHASE_2_IMPLEMENTATION_SUMMARY.md` - Phase 2 docs
