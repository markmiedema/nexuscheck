# Systematic Exempt Sales Testing Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Systematically test all exempt sales functionality from the TESTING_GUIDE with structured verification at each step

**Architecture:** Execute tests from existing TESTING_GUIDE.md in order, verify results against expected values, document findings

**Tech Stack:**
- Frontend: Next.js app at http://localhost:3000
- Backend: FastAPI + Supabase
- Test Files: CSV files in `frontend/public/templates/`

---

## Prerequisites

**Before starting:**
- Frontend running on http://localhost:3000
- Backend running and connected to Supabase
- Migration 019 deployed (allows negative exempt amounts)
- All test CSV files exist in `frontend/public/templates/`

---

## Task 1: Test 2.3 - Complete Clothing Partial Exempt Verification

**Files:**
- Test File: `frontend/public/templates/test_clothing_partial_exempt.csv`
- Reference: `docs/TESTING_GUIDE.md:174-212`

### Step 1: Verify California (already partially tested)

Navigate to analysis with test_clothing_partial_exempt.csv uploaded
Click "View Detail" for California
Verify transaction table shows:

**Expected Transactions:**
- Jan 4, 2024: $125,000 gross, $80,000 taxable, $45,000 exempt, Direct
- Jan 19, 2024: $98,000 gross, $63,000 taxable, $35,000 exempt, Direct
- Feb 9, 2024: $110,000 gross, $70,000 taxable, $40,000 exempt, Marketplace
- Feb 24, 2024: -$3,500 gross, -$2,300 taxable, -$1,200 exempt, Direct

**Expected CA Summary:**
- Gross Sales: $329,500
- Taxable Sales: $210,700
- Exempt Sales: $118,800
- Exempt %: ~36%

**Verification Command:**
```
✓ All 4 transactions display correctly
✓ Return shows negative values in all columns
✓ Running total ends at $329,500
✓ State table shows correct totals
✓ Exempt badge shows "36% exempt"
```

### Step 2: Verify New York

Click back, navigate to New York detail page

**Expected Transactions:**
- Mar 7, 2024: $155,000 gross, $155,000 taxable, - exempt, Direct
- Mar 21, 2024: $87,000 gross, - taxable, $87,000 exempt, Direct
- Apr 14, 2024: $132,000 gross, $80,000 taxable, $52,000 exempt, Direct

**Expected NY Summary:**
- Gross Sales: $374,000
- Taxable Sales: $235,000
- Exempt Sales: $139,000
- Exempt %: ~37%

**Verification Command:**
```
✓ All 3 transactions display correctly
✓ Fully taxable transaction shows "-" in exempt column
✓ Fully exempt transaction shows "-" in taxable column
✓ Partial exempt shows both values
✓ State table shows correct totals
```

### Step 3: Verify Pennsylvania

Click back, navigate to Pennsylvania detail page

**Expected Transactions (from CSV lines 9-11):**
- May 9, 2024: $95,000 gross, - taxable, $95,000 exempt, Direct
- May 27, 2024: $112,000 gross, - taxable, $112,000 exempt, Direct
- Jun 11, 2024: $88,000 gross, - taxable, $88,000 exempt, Marketplace

**Expected PA Summary:**
- Gross Sales: $295,000
- Taxable Sales: $0
- Exempt Sales: $295,000
- Exempt %: 100%
- Nexus Status: "Has Nexus" (crossed $100K gross)
- Estimated Liability: $0 (no taxable sales)

**Verification Command:**
```
✓ All 3 transactions show $0 taxable
✓ All exempt amounts display correctly
✓ Running total ends at $295,000
✓ State table shows "100% exempt" badge
✓ Estimated Liability is $0
✓ Nexus Status shows "Has Nexus" (not "None")
```

### Step 4: Verify Texas

Click back, navigate to Texas detail page

**Expected Transactions (from CSV lines 12-14):**
- Jul 7, 2024: $145,000 gross, $145,000 taxable, - exempt, Direct (Luxury_Fashion)
- Jul 24, 2024: $92,000 gross, $62,000 taxable, $30,000 exempt, Direct (Clothing)
- Aug 14, 2024: $108,000 gross, $73,000 taxable, $35,000 exempt, Direct (Apparel)

**Expected TX Summary:**
- Gross Sales: $345,000
- Taxable Sales: $280,000
- Exempt Sales: $65,000
- Exempt %: ~19%

**Verification Command:**
```
✓ Transaction 1 shows fully taxable (no exempt)
✓ Transactions 2 and 3 show partial exemptions
✓ All calculations correct
✓ State table shows correct totals
```

### Step 5: Verify Florida (already tested)

Navigate to Florida detail page

**Expected Transactions (from CSV lines 15-17):**
- Sep 4, 2024: $135,000 gross, $87,000 taxable, $48,000 exempt, Direct
- Sep 19, 2024: $78,000 gross, - taxable, $78,000 exempt, Marketplace
- Oct 11, 2024: $122,000 gross, $80,000 taxable, $42,000 exempt, Direct

**Expected FL Summary:**
- Gross Sales: $335,000
- Taxable Sales: $167,000
- Exempt Sales: $168,000
- Exempt %: ~50%

**Verification Command:**
```
✓ Transaction 2 shows fully exempt
✓ Other transactions show partial exemptions
✓ Mix of direct and marketplace channels
✓ All totals correct
```

### Step 6: Verify State Table Aggregation

Return to main analysis results page
Review State-by-State Results table

**Expected State Table:**
| State | Gross Sales | Taxable Sales | Exempt | Status | Est. Liability |
|-------|-------------|---------------|--------|--------|----------------|
| CA | $329,500 | $210,700 | $118,800 (36%) | Has Nexus | > $0 |
| NY | $374,000 | $235,000 | $139,000 (37%) | Has Nexus | > $0 |
| PA | $295,000 | $0 | $295,000 (100%) | Has Nexus | $0 |
| TX | $345,000 | $280,000 | $65,000 (19%) | Has Nexus | > $0 |
| FL | $335,000 | $167,000 | $168,000 (50%) | Has Nexus | > $0 |

**Verification Command:**
```
✓ All 5 states show Gross, Taxable, Exempt columns
✓ Percentages displayed in Exempt column
✓ PA shows $0 liability despite having nexus
✓ All other states show positive liability
✓ Liability calculated on taxable amount (not gross)
```

### Step 7: Document Test 2.3 Results

Create summary of findings:

```markdown
## Test 2.3: Clothing Partial Exempt - Results

**Status:** PASS / FAIL / PASS WITH ISSUES

**States Tested:**
- ✓ California: 4 transactions (3 sales + 1 return)
- ✓ New York: 3 transactions (mixed exempt %)
- ✓ Pennsylvania: 3 transactions (100% exempt)
- ✓ Texas: 3 transactions (partial exempt)
- ✓ Florida: 3 transactions (mix of full/partial exempt)

**Key Findings:**
- Negative exempt amounts work correctly (CA return with -$1,200)
- 100% exempt scenarios work (PA shows $0 liability)
- Partial exemptions calculate correctly
- State table aggregation accurate
- Transaction detail displays properly

**Issues Found:** (if any)
[List any discrepancies]
```

---

## Task 2: Test 2.1 - All Exempt Sales (Groceries)

**Files:**
- Test File: `frontend/public/templates/test_exempt_sales_grocery.csv`
- Reference: `docs/TESTING_GUIDE.md:101-131`

### Step 1: Upload and Analyze

Navigate to "New Analysis"
Upload `test_exempt_sales_grocery.csv`
Enter name: "Test 2.1 - All Exempt Groceries"
Click "Analyze"
Wait for processing to complete

**Verification Command:**
```
✓ Upload succeeds without errors
✓ Analysis completes successfully
✓ Redirects to results page
```

### Step 2: Verify State Table

Review State-by-State Results table

**Expected Results:**
| State | Gross Sales | Taxable Sales | Exempt | Status | Est. Liability |
|-------|-------------|---------------|--------|--------|----------------|
| CA | ~$385,000 | $0 | ~$385,000 (100%) | Has Nexus | $0 |
| NY | ~$380,000 | $0 | ~$380,000 (100%) | Has Nexus | $0 |
| TX | ~$200,000 | $0 | ~$200,000 (100%) | Has Nexus | $0 |
| FL | ~$275,000 | $0 | ~$275,000 (100%) | Has Nexus | $0 |
| WA | ~$88,000 | $0 | ~$88,000 (100%) | None | $0 |

**Verification Command:**
```
✓ CA, NY, TX, FL show "Has Nexus" (crossed $100K threshold)
✓ WA shows "None" (didn't cross threshold)
✓ ALL states show 100% exempt badge
✓ ALL states show $0 taxable sales
✓ ALL states show $0 estimated liability
✓ ALL states show $0 base tax
```

### Step 3: Verify California Detail Page

Click "View Detail" for California
Scroll through all sections

**Expected State Detail:**
- Summary Cards: Gross $385K, Taxable $0, Exempt $385K
- Sales Breakdown: Visual equation showing "$385K - $385K = $0"
- Explanation box: Explains nexus vs liability difference
- Liability Breakdown: Base Tax $0, Interest $0, Penalties $0
- Transaction Table: All transactions show $0 taxable, full exempt amounts

**Verification Command:**
```
✓ Sales Breakdown section appears
✓ Visual equation displays correctly (minus and equals signs visible)
✓ Explanation box visible with bullet points
✓ Liability Breakdown shows all $0
✓ Transaction table shows all transactions with 100% exempt
```

### Step 4: Verify Nexus vs Liability Logic

**Critical Verification:**
This test verifies the core logic: **Nexus uses GROSS sales, Liability uses TAXABLE sales**

**Expected Behavior:**
- CA crossed $100K gross sales → Has Nexus ✓
- CA has $0 taxable sales → $0 Liability ✓
- This is CORRECT: nexus obligation exists but no tax owed

**Verification Command:**
```
✓ CA shows "Has Nexus" status (NOT "None")
✓ CA shows $0 Estimated Liability
✓ Base tax calculated on $0 taxable (not $385K gross)
✓ No errors or warnings about inconsistency
```

### Step 5: Document Test 2.1 Results

```markdown
## Test 2.1: All Exempt Sales (Groceries) - Results

**Status:** PASS / FAIL / PASS WITH ISSUES

**Key Verification:**
- ✓ Nexus determination uses gross sales
- ✓ Liability calculation uses taxable sales
- ✓ States can have nexus but $0 liability
- ✓ 100% exempt badge displays correctly
- ✓ Sales Breakdown visualization works

**Issues Found:** (if any)
[List any discrepancies]
```

---

## Task 3: Test 2.2 - Mixed Taxable and Exempt with Returns

**Files:**
- Test File: `frontend/public/templates/test_mixed_taxable_exempt.csv`
- Reference: `docs/TESTING_GUIDE.md:135-170`

### Step 1: Upload and Analyze

Navigate to "New Analysis"
Upload `test_mixed_taxable_exempt.csv`
Enter name: "Test 2.2 - Mixed Taxable Exempt"
Click "Analyze"

**Verification Command:**
```
✓ Upload succeeds without errors
✓ Analysis completes successfully
```

### Step 2: Verify California State Table

**Expected CA Results:**
- Gross Sales: ~$295,000
- Taxable Sales: ~$180,000
- Exempt: ~$115,000 (~39%)
- Status: Has Nexus
- Est. Liability: Based on $180K (NOT $295K)

**Verification Command:**
```
✓ Gross $295K displayed
✓ Taxable $180K displayed
✓ Exempt $115K with ~39% badge
✓ Liability calculated on $180K taxable
✓ If CA rate 8.98%, base tax ≈ $16,164 (not $26,491)
```

### Step 3: Verify California Returns

Click "View Detail" for California
Scroll to transaction table

**Expected Transactions (from CSV):**
- Jan 9, 2024: $120,000 Software (taxable)
- Jan 14, 2024: $85,000 Groceries (exempt)
- Feb 4, 2024: $95,000 Mixed ($30K exempt, $65K taxable)
- Feb 19, 2024: -$5,000 Software return (taxable return)

**Verification Command:**
```
✓ Return transaction shows negative gross sales
✓ Return shows negative taxable amount
✓ Return reduced gross total ($120K + $85K + $95K - $5K = $295K)
✓ Return reduced taxable total
✓ No errors from negative amounts
✓ Running total decreases at return row
```

### Step 4: Verify California Detail Page

**Expected Sales Breakdown:**
- Gross Sales: $295,000
- Exempt Sales: $115,000
- Taxable Sales: $180,000
- Visual equation: "$295K - $115K = $180K"

**Expected Liability:**
- Base Tax: $180,000 × 8.98% ≈ $16,164
- NOT $295,000 × 8.98% ≈ $26,491

**Verification Command:**
```
✓ Sales Breakdown shows correct equation
✓ Base tax calculated on $180K taxable
✓ Liability does NOT use gross sales amount
```

### Step 5: Verify New York State

Click back, navigate to New York
Review transactions

**Expected NY Transactions (from CSV):**
- Mar 9, 2024: $150,000 SaaS (taxable)
- Mar 14, 2024: $45,000 Food (exempt)
- Apr 4, 2024: $200,000 Services (taxable)
- Apr 11, 2024: -$8,000 Services return (taxable)

**Expected NY Summary:**
- Gross: $387,000 ($150K + $45K + $200K - $8K)
- Exempt: $45,000 (only the Food)
- Taxable: $342,000 ($150K + $200K - $8K)

**Verification Command:**
```
✓ Gross $387K
✓ Exempt $45K (Food only)
✓ Taxable $342K (return reduced taxable, not exempt)
✓ Return properly reduced gross AND taxable
✓ Return did NOT reduce exempt (correct - was taxable return)
```

### Step 6: Verify All States Handle Returns

Review transaction tables for CA and NY

**Return Handling Rules:**
- Taxable return (is_taxable=Y, exempt_amount=0): Reduces gross and taxable
- Exempt return (is_taxable=N OR exempt_amount > 0): Reduces gross and exempt

**Verification Command:**
```
✓ CA return: -$5,000 reduced gross and taxable (Software is taxable)
✓ NY return: -$8,000 reduced gross and taxable (Services is taxable)
✓ Both show negative values in transaction table
✓ Both reduced running totals correctly
✓ No errors or crashes from negative amounts
```

### Step 7: Document Test 2.2 Results

```markdown
## Test 2.2: Mixed Taxable and Exempt - Results

**Status:** PASS / FAIL / PASS WITH ISSUES

**Key Verification:**
- ✓ Returns reduce gross sales
- ✓ Taxable returns reduce taxable sales
- ✓ Negative amounts display correctly
- ✓ Running totals decrease at return rows
- ✓ Liability calculated on taxable (not gross)

**Return Scenarios Tested:**
- ✓ CA: -$5,000 taxable Software return
- ✓ NY: -$8,000 taxable Services return

**Issues Found:** (if any)
[List any discrepancies]
```

---

## Task 4: Test State Quick View Modal

**Files:**
- Any existing analysis with nexus
- Reference: `docs/TESTING_GUIDE.md:517-534`

### Step 1: Open State Quick View

From any analysis results page
Click on a state ROW in the State Table (not "View Detail" button)
Modal should open

**Verification Command:**
```
✓ Clicking state row opens modal
✓ Modal displays without errors
✓ Modal centered on screen
```

### Step 2: Verify Modal Content

Review all sections of modal

**Expected Sections:**
- Header: State name and code
- Nexus Status: Badge with status
- Nexus Type: Economic/Physical/Both/None
- Nexus Date: When established
- Key Metrics: Sales, Liability, Interest
- Liability Breakdown: Base Tax, Interest, Penalties
- Year-by-Year Summary: Table with yearly data

**Verification Command:**
```
✓ All sections display
✓ Metrics show correct values
✓ Year table shows all years
✓ "View Full Details" button present
✓ Close (X) button works
```

### Step 3: Test Modal Navigation

Click "View Full Details" button
Should navigate to state detail page

**Verification Command:**
```
✓ Button navigates to state detail page
✓ Correct state loaded
✓ URL matches state code
```

### Step 4: Document Quick View Results

```markdown
## State Quick View Modal - Results

**Status:** PASS / FAIL / PASS WITH ISSUES

**Verified:**
- ✓ Modal opens from state table row click
- ✓ All sections display correctly
- ✓ Navigation to detail page works
- ✓ Close button works

**Issues Found:** (if any)
[List any discrepancies]
```

---

## Task 5: Test Transaction Table Display

**Purpose:** Verify the enhanced transaction table with Gross/Taxable/Exempt columns

### Step 1: Verify Column Headers

Navigate to any state detail page
Scroll to "View All Transactions" section (should be expanded by default)

**Expected Headers:**
- Date
- Transaction ID
- Gross Sales
- Taxable Sales
- Exempt
- Channel
- Running Total

**Verification Command:**
```
✓ All 7 columns display
✓ Headers clearly labeled
✓ Column widths balanced (not cramped)
```

### Step 2: Verify Positive Transactions

Review transactions with positive sales amounts

**Expected Display:**
- Gross Sales: Always shows dollar amount
- Taxable Sales: Shows amount if > 0, otherwise "-"
- Exempt: Shows amount if > 0, otherwise "-"
- Channel: Shows Direct or Marketplace badge
- Running Total: Cumulative gross sales

**Verification Command:**
```
✓ Fully taxable shows: amount, amount, -
✓ Fully exempt shows: amount, -, amount
✓ Partial exempt shows: amount, amount, amount
✓ All dollar amounts formatted with commas
```

### Step 3: Verify Negative Transactions (Returns)

Find transactions with negative amounts

**Expected Display:**
- Gross Sales: Negative dollar amount (e.g., -$8,000)
- Taxable Sales: Negative if taxable return, otherwise "-"
- Exempt: Negative if exempt return, otherwise "-"
- Running Total: Decreases from previous row

**Verification Command:**
```
✓ Negative amounts display with minus sign
✓ Red text or visual indication of return
✓ Running total decreases
✓ Taxable return shows negative in Taxable column
✓ Exempt return would show negative in Exempt column
```

### Step 4: Verify Table Initially Expanded

When first navigating to state detail page:

**Expected Behavior:**
- Transaction table section is OPEN (not collapsed)
- Can see transactions immediately
- Don't need to click accordion to expand

**Verification Command:**
```
✓ Table section expanded by default
✓ Transactions visible immediately
✓ Can still collapse/expand with header button
```

### Step 5: Test Sorting and Filtering

Click column headers to sort
Use filters at top of table

**Expected Functionality:**
- Date column: Sortable ascending/descending
- Gross Sales column: Sortable by amount
- Channel filter: Direct/Marketplace/All
- Search: Filter by Transaction ID

**Verification Command:**
```
✓ Sorting works on Date column
✓ Sorting works on Gross Sales column
✓ Channel filter dropdown works
✓ Search filter works
✓ Pagination works if > 25 transactions
```

### Step 6: Test CSV Export

Click "Export CSV" button

**Expected Behavior:**
- Downloads CSV file
- Filename includes state code and year (e.g., `CA_2024_transactions.csv`)
- CSV includes all displayed columns
- Includes Gross Sales, Taxable, Exempt columns

**Verification Command:**
```
✓ Export button visible
✓ CSV downloads successfully
✓ Filename formatted correctly
✓ CSV contains all 7 columns
✓ Data matches table display
```

### Step 7: Document Transaction Table Results

```markdown
## Transaction Table Display - Results

**Status:** PASS / FAIL / PASS WITH ISSUES

**Verified:**
- ✓ All 7 columns display correctly
- ✓ Positive transactions show proper values
- ✓ Negative transactions (returns) display with minus sign
- ✓ Table initially expanded
- ✓ Sorting and filtering work
- ✓ CSV export includes all columns

**Issues Found:** (if any)
[List any discrepancies]
```

---

## Task 6: Test VDA Mode End-to-End

**Files:**
- Test File: Use existing analysis with multiple states having nexus
- Reference: `docs/TESTING_GUIDE.md:410-479`

### Step 1: Enable VDA Mode

From analysis results page
Scroll to "VDA Mode" panel
Click "Enable VDA Mode" button

**Expected Modal:**
- Title: "Select States for VDA"
- State list with checkboxes
- Quick select buttons: All, Top 3, Top 5, Top 10
- Selected count: "X states selected"
- Calculate button

**Verification Command:**
```
✓ Modal opens
✓ All states with nexus listed
✓ Quick select buttons work
✓ Individual checkboxes toggle
✓ Counter updates when selecting
✓ Calculate button enabled when states selected
```

### Step 2: Select States and Calculate

Select 3-5 states (e.g., CA, NY, TX)
Click "Calculate VDA" button

**Expected Results:**
- Modal closes
- VDA panel updates
- Shows savings summary
- Shows "Active" badge
- Shows state breakdown

**Verification Command:**
```
✓ Calculation completes successfully
✓ Panel shows "Active" badge
✓ Savings summary displays (Before/With VDA/Savings)
✓ Savings percentage shown
✓ "Top States by Savings" accordion appears
```

### Step 3: Verify VDA Calculations

Review savings calculations

**Expected Logic:**
- Before VDA: Full liability (base tax + interest + penalties)
- With VDA: Reduced liability (penalties and/or interest waived)
- Total Savings: Difference between Before and With VDA

**Verification Command:**
```
✓ Before VDA amount > With VDA amount
✓ Total Savings = Before - With VDA
✓ Percentage calculated correctly
✓ All dollar amounts formatted
```

### Step 4: Verify State Breakdown

Expand "Top States by Savings" accordion
Review per-state details

**Expected Per State:**
- State name and code
- Before VDA liability
- With VDA liability
- Savings amount
- Penalties waived
- Interest waived

**Verification Command:**
```
✓ Accordion expands/collapses
✓ Each selected state listed
✓ Savings calculated per state
✓ Shows what was waived (penalties/interest)
```

### Step 5: Test Change States

Click "Change States" button

**Expected Behavior:**
- Reopens state selection modal
- Previously selected states checked
- Can add/remove states
- Recalculates on confirm

**Verification Command:**
```
✓ Modal reopens
✓ Previous selections preserved
✓ Can modify selections
✓ Recalculation works
✓ Panel updates with new results
```

### Step 6: Test Disable VDA

Click "Disable VDA" button

**Expected Behavior:**
- VDA mode turns off
- Panel returns to initial state
- Shows "What is VDA?" explanation
- "Enable VDA Mode" button visible
- Savings summary disappears

**Verification Command:**
```
✓ VDA disabled successfully
✓ Panel returns to initial state
✓ "Active" badge removed
✓ Can re-enable if needed
```

### Step 7: Document VDA Mode Results

```markdown
## VDA Mode End-to-End - Results

**Status:** PASS / FAIL / PASS WITH ISSUES

**Verified:**
- ✓ Enable VDA Mode workflow
- ✓ State selection and calculation
- ✓ Savings calculations accurate
- ✓ State breakdown displays
- ✓ Change states functionality
- ✓ Disable VDA Mode

**VDA Scenarios Tested:**
- 3-5 states selected
- Savings calculations
- Per-state breakdown

**Issues Found:** (if any)
[List any discrepancies]
```

---

## Task 7: Create Final Test Report

**Files:**
- Create: `docs/test-results/2025-01-14-exempt-sales-test-results.md`

### Step 1: Compile All Test Results

Gather results from all completed tests:
- Test 2.1: All Exempt Sales
- Test 2.2: Mixed Taxable/Exempt with Returns
- Test 2.3: Clothing Partial Exempt (all 5 states)
- State Quick View Modal
- Transaction Table Display
- VDA Mode End-to-End

### Step 2: Create Summary Report

```markdown
# Exempt Sales Testing Results
**Date:** 2025-01-14
**Tester:** [Your Name/LLM ID]
**Environment:** Local Development

## Summary

**Total Tests Executed:** X
**Passed:** X
**Failed:** X
**Pass Rate:** X%

## Test Results by Suite

### Test 2.1: All Exempt Sales (Groceries)
- **Status:** PASS/FAIL
- **Key Findings:** [Summary]
- **Issues:** [List]

### Test 2.2: Mixed Taxable/Exempt with Returns
- **Status:** PASS/FAIL
- **Key Findings:** [Summary]
- **Issues:** [List]

### Test 2.3: Clothing Partial Exempt
- **Status:** PASS/FAIL
- **States Verified:** CA, NY, PA, TX, FL
- **Key Findings:** [Summary]
- **Issues:** [List]

### Transaction Table Display
- **Status:** PASS/FAIL
- **Key Findings:** [Summary]
- **Issues:** [List]

### VDA Mode
- **Status:** PASS/FAIL
- **Key Findings:** [Summary]
- **Issues:** [List]

## Critical Issues Found

[List any blocking issues]

## Minor Issues Found

[List any non-blocking issues]

## Recommendations

[Suggestions for improvements]

## Sign-Off

**Overall Assessment:** READY FOR PRODUCTION / NEEDS FIXES / MAJOR ISSUES

**Confidence Level:** HIGH / MEDIUM / LOW
```

### Step 3: Save Report

Save to: `docs/test-results/2025-01-14-exempt-sales-test-results.md`

**Verification Command:**
```
✓ Report saved successfully
✓ All test results documented
✓ Issues clearly identified
✓ Recommendations provided
```

---

## Completion Criteria

**All tasks complete when:**
- ✅ Test 2.3 verified for all 5 states (CA, NY, PA, TX, FL)
- ✅ Test 2.1 (All Exempt) executed and verified
- ✅ Test 2.2 (Mixed + Returns) executed and verified
- ✅ Transaction table display verified
- ✅ VDA mode tested end-to-end
- ✅ State Quick View modal verified
- ✅ Final test report created and saved
- ✅ All issues documented
- ✅ Pass/fail status determined for each test

---

## Notes for Executing LLM

**Important Reminders:**
1. Frontend must be accessible at http://localhost:3000
2. You need browser automation to interact with UI
3. Record exact values seen (don't approximate)
4. Screenshot any visual issues
5. Copy exact error messages if errors occur
6. Verify calculations manually where possible
7. Document ANY deviation from expected results
8. Don't skip verification steps
9. Mark tests as "PASS WITH ISSUES" if minor problems found
10. Mark tests as "FAIL" if critical problems found

**If You Get Stuck:**
- Check browser console for errors
- Verify backend is running
- Check database has data
- Restart frontend if UI freezes
- Clear browser cache if state issues
- Check network tab for failed API calls

---

**End of Testing Plan**
