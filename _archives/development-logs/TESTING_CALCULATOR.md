# Testing the Nexus Calculation Engine

This guide explains how to test the nexus calculation engine that was just built.

## What Was Built

### Core Service: `app/services/nexus_calculator.py`
- `NexusCalculator` class with complete business logic
- Aggregates transactions by state
- Fetches thresholds and tax rates from database
- Determines nexus status for each state
- Calculates estimated tax liability
- Saves results to `state_results` table
- Updates `analyses` table with summary

### API Endpoints: `app/api/v1/analyses.py`

1. **POST `/api/v1/analyses/{id}/calculate`**
   - Triggers the calculation engine
   - Returns summary of results

2. **GET `/api/v1/analyses/{id}/results/summary`**
   - Returns detailed results for dashboard display
   - Includes nexus breakdown and top states

## Prerequisites

Before testing, ensure:

1. **Backend server is running:**
   ```bash
   cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **You have a test analysis with uploaded transactions:**
   - Analysis ID from previous testing: `5b803d55-bb22-4c26-8433-145c4012bfc3`
   - Has 30 transactions across 6 states

3. **You have a valid JWT token** (get from frontend login)

## Testing Methods

### Method 1: Direct Python Test (Recommended)

This bypasses the API layer and tests the calculator logic directly.

```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
python test_calculator_direct.py
```

**What it does:**
1. Connects to Supabase
2. Verifies analysis exists
3. Checks for transactions
4. Runs the calculator
5. Displays detailed results

**Expected Output:**
```
======================================================================
Direct Test: Nexus Calculation Engine
======================================================================

[1/6] Connecting to Supabase...
✅ Connected to Supabase

[2/6] Verifying analysis 5b803d55-bb22-4c26-8433-145c4012bfc3...
✅ Found analysis: ACME Corporation
   Period: 2024-01-01 to 2024-12-31
   Status: processing

[3/6] Checking for transactions...
✅ Found 30 transactions
   Unique states: 6
   Total sales: $X,XXX.XX

[4/6] Initializing NexusCalculator...
✅ Calculator initialized

[5/6] Running nexus calculation...
   This may take a few seconds...
✅ Calculation completed!

[6/6] Results Summary:
----------------------------------------------------------------------
   Total States Analyzed: 6
   States with Nexus: X
   States Approaching Threshold: X
   Total Estimated Liability: $X,XXX.XX
   Status: complete

[Bonus] Detailed State Results:
----------------------------------------------------------------------
   States with Nexus (X):
      XX: $XXX.XX
         - Type: economic
         - Total Sales: $X,XXX.XX
         - Direct Sales: $X,XXX.XX
         - Marketplace Sales: $X,XXX.XX

======================================================================
🎉 Test completed successfully!
======================================================================
```

### Method 2: API Test with cURL

Test the calculate endpoint:

```bash
# Set your JWT token
set JWT_TOKEN=your_jwt_token_here

# Call calculate endpoint
curl -X POST http://localhost:8000/api/v1/analyses/5b803d55-bb22-4c26-8433-145c4012bfc3/calculate ^
  -H "Authorization: Bearer %JWT_TOKEN%"

# Get results summary
curl http://localhost:8000/api/v1/analyses/5b803d55-bb22-4c26-8433-145c4012bfc3/results/summary ^
  -H "Authorization: Bearer %JWT_TOKEN%"
```

### Method 3: API Test with Python Script

```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
python test_calculation.py
```

This will prompt for JWT token and test all three endpoints:
1. GET analysis details
2. POST calculate nexus
3. GET results summary

### Method 4: Frontend Integration Test

1. Start frontend: `cd frontend && npm run dev`
2. Login to the application
3. Navigate to existing analysis: `/analysis/5b803d55-bb22-4c26-8433-145c4012bfc3/results`
4. Add a "Calculate" button that calls the calculate endpoint
5. Refresh to see real results instead of placeholders

## What to Verify

### Database Changes

After running calculation, check these tables in Supabase:

**`state_results` table:**
```sql
SELECT * FROM state_results WHERE analysis_id = '5b803d55-bb22-4c26-8433-145c4012bfc3';
```

Should show:
- One row per state with transactions
- `nexus_type` = 'economic' or 'none'
- `estimated_liability` calculated for states with nexus
- `total_sales`, `direct_sales`, `marketplace_sales` populated

**`analyses` table:**
```sql
SELECT status, total_liability, states_with_nexus, updated_at
FROM analyses
WHERE id = '5b803d55-bb22-4c26-8433-145c4012bfc3';
```

Should show:
- `status` = 'complete'
- `total_liability` = sum of all state liabilities
- `states_with_nexus` = count of states with nexus
- `updated_at` = current timestamp

### API Responses

**Calculate endpoint response:**
```json
{
  "message": "Nexus calculation completed successfully",
  "analysis_id": "5b803d55-bb22-4c26-8433-145c4012bfc3",
  "summary": {
    "total_states_analyzed": 6,
    "states_with_nexus": 2,
    "states_approaching_threshold": 1,
    "total_estimated_liability": 1234.56,
    "status": "complete"
  }
}
```

**Results summary endpoint response:**
```json
{
  "summary": {
    "total_states_analyzed": 6,
    "states_with_nexus": 2,
    "total_estimated_liability": 1234.56
  },
  "nexus_breakdown": {
    "economic_nexus": 2,
    "physical_nexus": 0,
    "no_nexus": 4,
    "both": 0
  },
  "top_states_by_liability": [
    {
      "state": "CA",
      "estimated_liability": 789.01,
      "nexus_type": "economic",
      "total_sales": 10000.00
    }
  ],
  "approaching_threshold": []
}
```

## Common Issues

### Issue 1: "No transactions found for analysis"
**Solution:** Upload a CSV file first via Screen 2

### Issue 2: "Analysis not found"
**Solutions:**
- Check the analysis ID is correct
- Verify the analysis belongs to the authenticated user
- Check RLS policies in Supabase

### Issue 3: Empty state_results after calculation
**Solutions:**
- Check backend logs for errors
- Verify economic_nexus_thresholds table has data
- Verify tax_rates table has data
- Check RLS policies aren't blocking inserts

### Issue 4: Calculation takes too long
**Solution:** This is normal for large datasets. The calculator processes:
- All transactions (aggregation)
- All 50+ states (threshold lookup)
- Each state result (calculation + database insert)

For 10,000+ transactions, expect 30-60 seconds.

## Next Steps After Testing

1. **Update Screen 4 Dashboard** to call calculate endpoint automatically or add manual "Calculate" button
2. **Replace placeholder values** with real data from results summary endpoint
3. **Add loading states** while calculation is running
4. **Add progress indicators** for long-running calculations
5. **Implement US map visualization** with real state data (colors based on nexus_type)
6. **Build Screen 5** (State Table) to show all 50 states with sortable columns
7. **Build Screen 6** (State Detail) to show complete breakdown per state

## Files Created

1. `backend/app/services/nexus_calculator.py` - Core calculation engine
2. `backend/test_calculator_direct.py` - Direct test script (no API)
3. `backend/test_calculation.py` - API test script (requires backend running)
4. `backend/TESTING_CALCULATOR.md` - This file

## Expected Test Results

Based on the test data (30 transactions, 6 states):

- **Total States Analyzed:** 6 (CA, NY, TX, FL, WA, IL)
- **States with Nexus:** 0-2 (depends on transaction amounts)
- **Total Liability:** $0 - $3,000 (depends on nexus determinations)

Most states likely won't meet economic nexus thresholds ($100,000 or 200 transactions) with only 30 test transactions unless the amounts are very high.

To see states WITH nexus, you may need to:
1. Add more test transactions, OR
2. Increase transaction amounts in existing data, OR
3. Use different test data that exceeds thresholds

## Code Review Checklist

- [x] Calculator uses correct table names (sales_transactions, economic_nexus_thresholds, tax_rates, state_results)
- [x] Column names match database schema
- [x] Nexus determination logic handles AND/OR operators correctly
- [x] Tax calculation uses combined rate (state + avg local)
- [x] Results are saved in batches for performance
- [x] Analysis status is updated to 'complete'
- [x] Error handling with try/catch and logging
- [x] Type hints for all methods
- [x] Docstrings for all public methods

---

**Status:** Calculation engine is complete and ready for testing.

**Author:** Built during Phase 4, Sprint 1, Week 3

**Last Updated:** 2025-11-04
