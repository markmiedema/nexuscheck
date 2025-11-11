# Sprint 1C: Auto-Detect Date Range - Integration Testing Checklist

**Feature**: Automatically detect analysis period dates from uploaded CSV transaction data

**Date**: 2025-11-07

---

## Pre-Testing Setup

- [ ] Backend server is running on http://localhost:8000
- [ ] Frontend server is running on http://localhost:3000
- [ ] Database migration 012 has been applied
- [ ] Test user account exists and can log in

---

## Test Scenario 1: Auto-Detect with No Manual Dates

**Purpose**: Verify that dates are automatically detected when user leaves date fields blank

### Steps:
1. [ ] Navigate to `/analysis/new`
2. [ ] Fill in **Company Name**: "Test Company 1"
3. [ ] **Leave Period Start and Period End blank**
4. [ ] Select **Business Type**: "Product Sales"
5. [ ] Click "Continue to Upload"
6. [ ] Upload CSV file with transactions spanning 2024-01-05 to 2024-06-20

### Expected Results:
- [ ] Upload succeeds without validation errors
- [ ] Date confirmation dialog appears showing:
  - Period Start: January 5, 2024
  - Period End: June 20, 2024
  - Message: "We automatically detected and set the analysis period..."
  - Green checkmark: "✓ Analysis period has been automatically set"
- [ ] After clicking "Continue", navigates to mapping screen
- [ ] In database, `analysis_period_start` = '2024-01-05'
- [ ] In database, `analysis_period_end` = '2024-06-20'

---

## Test Scenario 2: Manual Dates Override Auto-Detection

**Purpose**: Verify that manually entered dates are preserved and not overwritten

### Steps:
1. [ ] Navigate to `/analysis/new`
2. [ ] Fill in **Company Name**: "Test Company 2"
3. [ ] Set **Period Start**: 2024-03-01
4. [ ] Set **Period End**: 2024-05-31
5. [ ] Select **Business Type**: "Digital Products"
6. [ ] Click "Continue to Upload"
7. [ ] Upload CSV file with transactions spanning 2024-01-05 to 2024-06-20

### Expected Results:
- [ ] Upload succeeds
- [ ] Date confirmation dialog appears showing:
  - Period Start: January 5, 2024 (detected from CSV)
  - Period End: June 20, 2024 (detected from CSV)
  - Message: "We detected the following date range..." (NOT "auto-populated")
  - NO green checkmark (dates were not auto-populated)
- [ ] In database, original manual dates are preserved:
  - `analysis_period_start` = '2024-03-01' (NOT '2024-01-05')
  - `analysis_period_end` = '2024-05-31' (NOT '2024-06-20')

---

## Test Scenario 3: Multi-Year Date Range

**Purpose**: Verify detection works across multiple years

### Steps:
1. [ ] Navigate to `/analysis/new`
2. [ ] Fill in **Company Name**: "Test Company 3"
3. [ ] **Leave dates blank**
4. [ ] Select **Business Type**: "Mixed"
5. [ ] Upload CSV with transactions spanning 2022-06-15 to 2024-03-20

### Expected Results:
- [ ] Date confirmation dialog shows:
  - Period Start: June 15, 2022
  - Period End: March 20, 2024
- [ ] Database stores correct multi-year range

---

## Test Scenario 4: Different Date Formats

**Purpose**: Verify auto-detection handles MM/DD/YYYY format

### Steps:
1. [ ] Create CSV with dates in MM/DD/YYYY format:
   ```
   transaction_date,customer_state,revenue_amount,sales_channel
   01/05/2024,CA,1000.00,direct
   03/15/2024,NY,2000.00,direct
   06/20/2024,TX,3000.00,marketplace
   ```
2. [ ] Navigate to `/analysis/new`
3. [ ] Fill in **Company Name**: "Test Company 4"
4. [ ] **Leave dates blank**
5. [ ] Select **Business Type**: "Product Sales"
6. [ ] Upload the CSV

### Expected Results:
- [ ] Dates are correctly parsed and detected:
  - Period Start: January 5, 2024
  - Period End: June 20, 2024

---

## Test Scenario 5: Invalid Dates in CSV

**Purpose**: Verify that invalid dates are filtered out gracefully

### Steps:
1. [ ] Create CSV with some invalid dates:
   ```
   transaction_date,customer_state,revenue_amount,sales_channel
   2024-01-05,CA,1000.00,direct
   not-a-date,NY,2000.00,direct
   2024-06-20,TX,3000.00,marketplace
   ```
2. [ ] Navigate to `/analysis/new`
3. [ ] Fill in **Company Name**: "Test Company 5"
4. [ ] **Leave dates blank**
5. [ ] Upload the CSV

### Expected Results:
- [ ] Upload succeeds (invalid dates are filtered)
- [ ] Date confirmation dialog shows dates from valid rows only:
  - Period Start: January 5, 2024
  - Period End: June 20, 2024
- [ ] No errors or crashes

---

## Test Scenario 6: CSV with No Valid Dates

**Purpose**: Verify proper error handling when no valid dates exist

### Steps:
1. [ ] Create CSV with only invalid dates:
   ```
   transaction_date,customer_state,revenue_amount,sales_channel
   not-a-date,NY,2000.00,direct
   invalid,TX,3000.00,marketplace
   ```
2. [ ] Navigate to `/analysis/new`
3. [ ] Fill in **Company Name**: "Test Company 6"
4. [ ] **Leave dates blank**
5. [ ] Upload the CSV

### Expected Results:
- [ ] Upload fails with clear error message:
  - "No valid transaction dates found in uploaded file"
- [ ] User can upload a different file

---

## Test Scenario 7: Backend Unit Tests

**Purpose**: Verify backend date detection logic

### Steps:
1. [ ] Navigate to `backend/tests/test_auto_detect_dates.py`
2. [ ] Run: `pytest tests/test_auto_detect_dates.py -v`

### Expected Results:
- [ ] ✓ test_auto_detect_dates_from_csv - PASSED
- [ ] ✓ test_auto_detect_handles_different_date_formats - PASSED
- [ ] ✓ test_auto_detect_multi_year - PASSED
- [ ] ✓ test_auto_detect_filters_invalid_dates - PASSED
- [ ] All 4 tests pass

---

## Test Scenario 8: Frontend Type Safety

**Purpose**: Verify TypeScript compilation with no errors

### Steps:
1. [ ] Navigate to frontend directory
2. [ ] Run: `npx tsc --noEmit`

### Expected Results:
- [ ] No TypeScript errors
- [ ] All type definitions are correct

---

## Test Scenario 9: Database Schema Validation

**Purpose**: Verify migration was applied correctly

### Steps:
1. [ ] Connect to Supabase database
2. [ ] Check `analyses` table schema
3. [ ] Verify:
   ```sql
   -- Check if columns are nullable
   SELECT column_name, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'analyses'
   AND column_name IN ('analysis_period_start', 'analysis_period_end');
   ```

### Expected Results:
- [ ] `analysis_period_start` - is_nullable = 'YES'
- [ ] `analysis_period_end` - is_nullable = 'YES'
- [ ] Check constraint `valid_period` allows NULL dates

---

## Test Scenario 10: UI/UX Validation

**Purpose**: Verify user interface displays correct messages

### Steps:
1. [ ] Navigate to `/analysis/new`
2. [ ] Verify date inputs show:
   - Section header: "Analysis Period (Optional)"
   - Helper text: "Leave blank to auto-detect from uploaded transaction data"
   - No red asterisks on date labels
3. [ ] After upload with auto-detection:
   - Dialog title: "Date Range Auto-Detected"
   - Dialog shows formatted dates (e.g., "January 5, 2024")
   - Green success message visible
   - "Continue" button works

### Expected Results:
- [ ] All UI text is clear and helpful
- [ ] Dialog is visually appealing
- [ ] No console errors in browser

---

## Regression Testing

**Purpose**: Ensure existing functionality still works

### Steps:
1. [ ] Test creating analysis WITH manual dates (old behavior)
2. [ ] Test uploading CSV to existing analysis
3. [ ] Test navigation between screens
4. [ ] Test analysis list page still displays correctly

### Expected Results:
- [ ] All existing features work as before
- [ ] No breaking changes introduced

---

## Performance Testing

**Purpose**: Verify date detection doesn't slow down upload

### Steps:
1. [ ] Upload CSV with 1,000 transactions
2. [ ] Upload CSV with 10,000 transactions
3. [ ] Measure upload time

### Expected Results:
- [ ] Upload completes within reasonable time (<5 seconds)
- [ ] Date detection adds minimal overhead
- [ ] No memory issues or crashes

---

## Test Results Summary

**Tester**: _______________
**Date**: _______________
**Environment**: Production / Staging / Local

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Auto-Detect with No Manual Dates | ⬜ Pass / ⬜ Fail | |
| 2. Manual Dates Override | ⬜ Pass / ⬜ Fail | |
| 3. Multi-Year Date Range | ⬜ Pass / ⬜ Fail | |
| 4. Different Date Formats | ⬜ Pass / ⬜ Fail | |
| 5. Invalid Dates in CSV | ⬜ Pass / ⬜ Fail | |
| 6. CSV with No Valid Dates | ⬜ Pass / ⬜ Fail | |
| 7. Backend Unit Tests | ⬜ Pass / ⬜ Fail | |
| 8. Frontend Type Safety | ⬜ Pass / ⬜ Fail | |
| 9. Database Schema | ⬜ Pass / ⬜ Fail | |
| 10. UI/UX Validation | ⬜ Pass / ⬜ Fail | |
| Regression Testing | ⬜ Pass / ⬜ Fail | |
| Performance Testing | ⬜ Pass / ⬜ Fail | |

**Overall Status**: ⬜ All Tests Passed / ⬜ Issues Found

---

## Known Issues / Bugs Found

1. _____________________________________
2. _____________________________________
3. _____________________________________

---

## Sign-Off

- [ ] All tests passed
- [ ] Feature is ready for production
- [ ] Documentation updated

**Tested by**: _______________
**Date**: _______________
**Approved by**: _______________
**Date**: _______________
