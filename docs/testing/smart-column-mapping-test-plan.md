# Smart Column Mapping - End-to-End Test Plan

**Plan Version:** 1.0
**Date:** 2025-11-09
**Feature:** Smart Column Mapping UX Improvements
**Tester:** _To be assigned_

## Overview

This test plan covers end-to-end testing of the smart column mapping feature, which reduces user clicks from 8 to 2 (75% reduction) for the happy path by auto-detecting column mappings.

## Prerequisites

- Backend server running locally
- Frontend dev server running locally
- Test CSV files prepared with various column name patterns
- User account created and logged in

## Test Data Files

### File 1: Exact Match CSV (`test-exact-match.csv`)
```csv
transaction_date,customer_state,revenue_amount,sales_channel,transaction_id
2024-01-15,CA,150.00,marketplace,TXN001
2024-01-16,NY,200.50,direct,TXN002
2024-01-17,TX,99.99,marketplace,TXN003
2024-01-18,FL,175.25,other,TXN004
2024-01-19,CA,210.00,direct,TXN005
```

### File 2: Common Variants CSV (`test-common-variants.csv`)
```csv
date,state,amount,channel,order_id
2024-01-15,CA,150.00,marketplace,ORD001
2024-01-16,NY,200.50,direct,ORD002
2024-01-17,TX,99.99,marketplace,ORD003
2024-01-18,FL,175.25,other,ORD004
2024-01-19,CA,210.00,direct,ORD005
```

### File 3: Mixed Variants CSV (`test-mixed-variants.csv`)
```csv
order_date,buyer_state,total,source,invoice_num
2024-01-15,CA,150.00,marketplace,INV001
2024-01-16,NY,200.50,direct,INV002
2024-01-17,TX,99.99,marketplace,INV003
2024-01-18,FL,175.25,other,INV004
2024-01-19,CA,210.00,direct,INV005
```

### File 4: Partial Match CSV (`test-partial-match.csv`)
```csv
transaction_date,location,revenue_amount,vendor
2024-01-15,CA,150.00,Amazon
2024-01-16,NY,200.50,Direct Website
2024-01-17,TX,99.99,eBay
```

### File 5: No Match CSV (`test-no-match.csv`)
```csv
when,where,how_much,what_channel
2024-01-15,CA,150.00,marketplace
2024-01-16,NY,200.50,direct
```

## Test Cases

---

### TC-01: Happy Path - Exact Column Names

**Objective:** Verify auto-detection works perfectly with exact column names

**Preconditions:**
- User is logged in
- On analysis creation page

**Test Steps:**
1. Create new analysis with name "Test Exact Match"
2. Upload `test-exact-match.csv`
3. Verify file preview shows correct headers and 5 rows
4. Click "Continue to Mapping"
5. Verify Date Confirmation Dialog does NOT appear (dates auto-detected)
6. Verify Column Mapping Confirmation Dialog appears
7. Review auto-detected mappings:
   - transaction_date → transaction_date ✓
   - customer_state → customer_state ✓
   - revenue_amount → revenue_amount ✓
   - sales_channel → sales_channel ✓
8. Verify sample values are displayed for each field
9. Verify data summary shows:
   - Transactions: 5
   - States: 4
   - Date Range: 2024-01-15 - 2024-01-19
10. Click "Confirm & Calculate Nexus"
11. Verify navigation to results page
12. Verify 5 transactions were processed successfully

**Expected Results:**
- All columns auto-detected with high confidence
- Confirmation dialog shows correct mappings
- Sample values are visible
- Data summary is accurate
- Processing completes successfully
- Total clicks: 2 (Continue + Confirm)

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### TC-02: Happy Path - Common Variants

**Objective:** Verify auto-detection works with common column name variants

**Preconditions:**
- User is logged in
- On analysis creation page

**Test Steps:**
1. Create new analysis with name "Test Common Variants"
2. Upload `test-common-variants.csv`
3. Verify file preview shows headers: date, state, amount, channel
4. Click "Continue to Mapping"
5. Verify Column Mapping Confirmation Dialog appears
6. Review auto-detected mappings:
   - transaction_date → date ✓
   - customer_state → state ✓
   - revenue_amount → amount ✓
   - sales_channel → channel ✓
7. Verify sample values match the CSV data
8. Click "Confirm & Calculate Nexus"
9. Verify successful processing

**Expected Results:**
- All columns auto-detected (medium confidence)
- Confirmation dialog displays correctly
- Sample values are accurate
- Processing completes successfully
- Total clicks: 2

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### TC-03: Happy Path - Mixed Variants

**Objective:** Verify auto-detection works with less common but valid variants

**Preconditions:**
- User is logged in
- On analysis creation page

**Test Steps:**
1. Create new analysis with name "Test Mixed Variants"
2. Upload `test-mixed-variants.csv`
3. Click "Continue to Mapping"
4. Verify Column Mapping Confirmation Dialog appears
5. Review auto-detected mappings:
   - transaction_date → order_date ✓
   - customer_state → buyer_state ✓
   - revenue_amount → total ✓
   - sales_channel → source ✓
6. Verify confidence levels may vary (some medium/low)
7. Click "Confirm & Calculate Nexus"
8. Verify successful processing

**Expected Results:**
- All columns auto-detected (mixed confidence)
- Dialog shows all 4 required mappings
- Processing succeeds
- Total clicks: 2

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### TC-04: Adjustment Workflow - User Adjusts Mappings

**Objective:** Verify user can adjust auto-detected mappings if needed

**Preconditions:**
- User is logged in
- On analysis creation page

**Test Steps:**
1. Create new analysis with name "Test Adjustment"
2. Upload `test-exact-match.csv`
3. Click "Continue to Mapping"
4. In Column Mapping Confirmation Dialog, click "Adjust Mappings"
5. Verify navigation to full mapping page
6. Verify mapping page shows redesigned UI:
   - Card-based layout
   - 4-column grid for required fields
   - Sample values displayed as badges
   - Status icons (CheckCircle2)
7. Verify auto-detected mappings are pre-selected:
   - Transaction Date: transaction_date (selected)
   - Customer State: customer_state (selected)
   - Revenue Amount: revenue_amount (selected)
   - Sales Channel: sales_channel (selected)
8. Change one mapping (e.g., change Transaction Date to a different column if available)
9. Click "Validate & Process Transactions"
10. Verify validation occurs
11. Click "Calculate Nexus" if validation passes
12. Verify navigation to results page

**Expected Results:**
- Adjust button navigates to full mapping page
- New mapping page design is visible
- Auto-detected mappings are pre-selected
- User can change mappings
- Validation works correctly
- Processing completes successfully
- Total clicks: 3+ (Continue + Adjust + Validate + Calculate)

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### TC-05: Low Confidence - Partial Detection

**Objective:** Verify behavior when only some columns are detected

**Preconditions:**
- User is logged in
- On analysis creation page

**Test Steps:**
1. Create new analysis with name "Test Partial Match"
2. Upload `test-partial-match.csv`
3. Click "Continue to Mapping"
4. Verify Column Mapping Confirmation Dialog does NOT appear
5. Verify navigation directly to full mapping page
6. Verify partially detected mappings are pre-selected:
   - Transaction Date: transaction_date (selected)
   - Customer State: (not selected - "location" not recognized)
   - Revenue Amount: revenue_amount (selected)
   - Sales Channel: (not selected - "vendor" not recognized)
7. Manually select mappings for missing fields:
   - Customer State → location
   - Sales Channel → vendor
8. Click "Validate & Process Transactions"
9. Verify validation feedback
10. Complete the flow

**Expected Results:**
- No confirmation dialog (not all_required_detected)
- Direct navigation to mapping page
- Partially detected mappings are pre-selected
- User can complete remaining mappings
- Validation works
- Total clicks: 3+ (Continue + Validate + Calculate)

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### TC-06: No Detection - Manual Mapping Required

**Objective:** Verify behavior when no columns are auto-detected

**Preconditions:**
- User is logged in
- On analysis creation page

**Test Steps:**
1. Create new analysis with name "Test No Match"
2. Upload `test-no-match.csv`
3. Click "Continue to Mapping"
4. Verify navigation directly to full mapping page
5. Verify NO mappings are pre-selected
6. Verify dropdown shows available columns:
   - when, where, how_much, what_channel
7. Manually map all required fields:
   - Transaction Date → when
   - Customer State → where
   - Revenue Amount → how_much
   - Sales Channel → what_channel
8. Click "Validate & Process Transactions"
9. Complete the flow

**Expected Results:**
- No confirmation dialog
- Direct navigation to mapping page
- No pre-selected mappings
- All dropdowns show "Select column..."
- User can manually map all fields
- Validation works
- Total clicks: 3+ (Continue + Validate + Calculate)

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### TC-07: Visual Design - Mapping Page Redesign

**Objective:** Verify the redesigned mapping page matches design specifications

**Preconditions:**
- User is on the mapping page (any test file)

**Visual Checklist:**
- [ ] **Required Fields Section**
  - [ ] Card component with proper border and shadow
  - [ ] 4-column grid layout: Your Column | → | Maps To | Status
  - [ ] Column headers are visible and properly styled
  - [ ] Each field row shows:
    - [ ] Field name (Transaction Date, Customer State, etc.)
    - [ ] Arrow icon (ArrowRight)
    - [ ] Dropdown with selected column or "Select column..."
    - [ ] Sample values displayed as Badge components (max 3)
    - [ ] Status icon (CheckCircle2 green when mapped, AlertCircle orange when not)
  - [ ] Separator (thin line) between each field row
  - [ ] Proper spacing and alignment

- [ ] **Optional Fields Section**
  - [ ] Card with dashed border
  - [ ] "Optional" badge in header
  - [ ] 3-column layout (more compact than required)
  - [ ] Same Badge style for sample values
  - [ ] Expandable/collapsible (if implemented)

- [ ] **Data Summary Section**
  - [ ] Card with gradient background (blue/purple)
  - [ ] White text on colored background
  - [ ] Three stats displayed:
    - [ ] Total Transactions (large number)
    - [ ] Unique States (large number)
    - [ ] Date Range (formatted dates)
  - [ ] Small labels below each stat
  - [ ] Proper spacing in grid layout

- [ ] **Validation Feedback**
  - [ ] Alert component (green for success, red for errors)
  - [ ] Proper icon (CheckCircle2 or AlertCircle)
  - [ ] Error messages list validation issues
  - [ ] Success message confirms readiness

- [ ] **Action Buttons**
  - [ ] Back button (outline variant)
  - [ ] Validate button (primary, with icon)
  - [ ] Calculate Nexus button (appears after validation)
  - [ ] Proper loading states with spinners
  - [ ] Disabled states when appropriate

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

### TC-08: Validation Errors

**Objective:** Verify validation error handling on mapping page

**Preconditions:**
- User is on mapping page

**Test Steps:**
1. Upload `test-exact-match.csv`
2. Navigate to mapping page (via Adjust or direct)
3. Select same column for multiple required fields
   - e.g., transaction_date for both Transaction Date and Customer State
4. Click "Validate & Process Transactions"
5. Verify validation error appears in Alert component
6. Verify error message indicates duplicate column usage
7. Fix the issue by selecting correct column
8. Click "Validate & Process Transactions" again
9. Verify validation success
10. Verify "Calculate Nexus" button appears

**Expected Results:**
- Validation catches duplicate column mappings
- Error displayed in Alert component (red/destructive variant)
- Error message is clear and actionable
- After fixing, validation passes
- Success Alert appears (green variant)
- Calculate button becomes available

**Pass/Fail:** ___________

**Notes:** ___________________________________________

---

## Test Execution Summary

**Date Tested:** ___________
**Tester:** ___________
**Environment:** ___________

**Results:**
- Total Test Cases: 8
- Passed: ___________
- Failed: ___________
- Blocked: ___________

**Critical Issues Found:**
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Non-Critical Issues Found:**
1. ___________________________________________
2. ___________________________________________

**Overall Assessment:**
___________________________________________
___________________________________________
___________________________________________

**Recommendations:**
___________________________________________
___________________________________________
___________________________________________

**Sign-off:**
- Developer: ___________ Date: ___________
- QA: ___________ Date: ___________
- Product Owner: ___________ Date: ___________
