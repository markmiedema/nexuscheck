# Sprint 1 Testing Guide

## Overview

This guide walks you through comprehensive testing of all Sprint 1 features:
- Enhanced column detection (state names, dates, channels)
- Exempt sales tracking and display
- US Map improvements
- Loading states and error handling
- VDA mode functionality

**Estimated time:** 2-3 hours

---

## Setup

1. **Ensure migration 018 is deployed** (already done ✅)
2. **Frontend is running** on http://localhost:3000
3. **Backend is running** and connected to Supabase
4. **Test files location:** `frontend/public/templates/`

---

## Test Suite 1: Basic Functionality (15 min)

### Test 1.1: Basic CSV Upload
**File:** `sales_data_template.csv`
**Purpose:** Verify system still works with simple data

**Steps:**
1. Navigate to "New Analysis"
2. Upload `sales_data_template.csv`
3. Enter analysis name: "Test 1.1 - Basic Upload"
4. Click "Analyze"

**Expected Results:**
- ✅ Upload succeeds without errors
- ✅ Shows 3 transactions across 3 states (CA, NY, TX)
- ✅ State table displays with all columns
- ✅ All states show "No Nexus" (amounts too small)

**Pass/Fail:** ________

---

### Test 1.2: Column Detection - State Names
**File:** Create new file `test_state_names.csv`

**Steps:**
1. Create file with state names instead of codes:
```csv
transaction_date,customer_state,revenue_amount,sales_channel
2024-01-15,California,125000,direct
2024-02-10,New York,145000,direct
2024-03-05,Texas,110000,Website
2024-04-12,Florida,95000,Amazon
```

2. Upload and analyze

**Expected Results:**
- ✅ "California" → CA
- ✅ "New York" → NY
- ✅ "Website" → direct channel
- ✅ "Amazon" → marketplace channel
- ✅ All states show economic nexus (crossed $100K threshold)

**Pass/Fail:** ________

---

### Test 1.3: Column Detection - Date Formats
**File:** Create `test_date_formats.csv`

**Steps:**
1. Create file with mixed date formats:
```csv
transaction_date,customer_state,revenue_amount,sales_channel
01/15/2024,CA,125000,direct
2024-02-10,NY,145000,direct
Feb 15, 2024,TX,110000,direct
2024/03/05,FL,95000,direct
03-12-2024,WA,105000,direct
```

2. Upload and analyze

**Expected Results:**
- ✅ All date formats parsed correctly
- ✅ No "date parsing errors"
- ✅ Transactions appear in chronological order
- ✅ All states show economic nexus

**Pass/Fail:** ________

---

## Test Suite 2: Exempt Sales - All Scenarios (30 min)

### Test 2.1: All Exempt Sales (Groceries)
**File:** `test_exempt_sales_grocery.csv`
**Purpose:** Verify nexus established but $0 liability

**Steps:**
1. Upload `test_exempt_sales_grocery.csv`
2. Name: "Test 2.1 - All Exempt Groceries"
3. Analyze

**Expected Results:**

**State Table:**
- ✅ CA: Gross Sales ~$385K, Taxable Sales $0, Exempt $385K (100% exempt badge)
- ✅ NY: Gross Sales ~$380K, Taxable Sales $0, Exempt $380K (100% exempt badge)
- ✅ TX: Gross Sales ~$200K, Taxable Sales $0, Exempt $200K (100% exempt badge)
- ✅ FL: Gross Sales ~$275K, Taxable Sales $0, Exempt $275K (100% exempt badge)
- ✅ WA: Gross Sales ~$88K, Nexus Status = "None" (didn't cross threshold)

**Nexus vs Liability Check:**
- ✅ CA, NY, TX, FL show "Has Nexus" (crossed $100K gross threshold)
- ✅ ALL states show $0 Estimated Liability (no taxable sales)
- ✅ Base Tax = $0 for all states

**State Detail Page (CA):**
- ✅ Click into California
- ✅ Sales Breakdown section appears
- ✅ Visual equation: $385K - $385K = $0
- ✅ Explanation box visible
- ✅ Liability Breakdown shows $0 base tax

**Pass/Fail:** ________

---

### Test 2.2: Mixed Taxable and Exempt
**File:** `test_mixed_taxable_exempt.csv`
**Purpose:** Verify partial exemptions and returns

**Steps:**
1. Upload `test_mixed_taxable_exempt.csv`
2. Name: "Test 2.2 - Mixed Taxable Exempt"
3. Analyze

**Expected Results:**

**State Table - California:**
- ✅ Gross Sales: ~$295,000
- ✅ Taxable Sales: ~$180,000
- ✅ Exempt: ~$115,000
- ✅ Badge shows "~39% exempt"
- ✅ Estimated Liability: calculated on $180K (not $295K)

**Verify Return/Refund:**
- ✅ CA has -$5,000 return (Software)
- ✅ NY has -$8,000 return (Services, marketplace)
- ✅ Returns reduced gross and taxable totals
- ✅ No errors from negative amounts

**State Detail Page (CA):**
- ✅ Sales Breakdown equation: $295K - $115K = $180K
- ✅ Base tax calculated on $180K only
- ✅ If CA rate is 8.98%, base tax ≈ $16,164 (not $26,491)

**State Detail Page (NY):**
- ✅ Gross: $387K ($150K + $45K + $200K - $8K return)
- ✅ Exempt: $45K (Food only - row 7)
- ✅ Taxable: $342K ($150K SaaS + $200K Services - $8K Services return)
- ✅ Return properly reduced gross AND taxable sales

**Pass/Fail:** ________

---

### Test 2.3: Partial Exemptions (Clothing)
**File:** `test_clothing_partial_exempt.csv`
**Purpose:** Verify exempt_amount column works

**Steps:**
1. Upload `test_clothing_partial_exempt.csv`
2. Name: "Test 2.3 - Clothing Partial Exempt"
3. Analyze

**Expected Results:**

**State Table:**
- ✅ All states show Gross Sales, Taxable Sales, Exempt columns
- ✅ Exempt badges appear (varying percentages)

**California Example:**
- Transaction 1: $125K sale, $45K exempt → $80K taxable
- Transaction 2: $98K sale, $35K exempt → $63K taxable
- Transaction 3: $110K sale, $40K exempt → $70K taxable
- Transaction 4: -$3.5K return, -$1.2K exempt → -$2.3K taxable
- ✅ Total Gross: ~$329.5K
- ✅ Total Exempt: ~$118.8K
- ✅ Total Taxable: ~$210.7K
- ✅ Badge shows "~36% exempt"

**New York Example:**
- Mix of fully taxable luxury apparel ($155K)
- Fully exempt basic clothing ($87K)
- Partial exempt mixed apparel ($132K sale, $52K exempt)
- ✅ Exempt amount varies by transaction
- ✅ All calculations correct

**Pennsylvania:**
- All clothing fully exempt ($95K + $112K + $88K)
- ✅ Shows 100% exempt badge
- ✅ $0 taxable sales
- ✅ $0 liability despite crossing nexus threshold

**Pass/Fail:** ________

---

### Test 2.4: Exempt Sales with Exemptions Template
**File:** `sales_data_with_exemptions_template.csv`
**Purpose:** Verify template example works

**Steps:**
1. Upload `sales_data_with_exemptions_template.csv`
2. Name: "Test 2.4 - Template Example"
3. Analyze

**Expected Results:**
- ✅ Row 1 (CA, Software): Fully taxable ($100)
- ✅ Row 2 (CA, Groceries): Fully exempt ($50)
- ✅ Row 3 (NY, Clothing): Fully taxable ($200)
- ✅ Row 4 (TX, Mixed): Partial exempt ($150 - $25 = $125 taxable)
- ✅ CA: Gross $150, Taxable $100, Exempt $50
- ✅ All states show "None" (amounts too small for nexus)

**Pass/Fail:** ________

---

## Test Suite 3: UI Components (20 min)

### Test 3.1: State Table Tooltips
**File:** Any file from Test Suite 2

**Steps:**
1. View State Results table
2. Hover over "Gross Sales" column header
3. Hover over "Taxable Sales" column header
4. Hover over "Exempt" column header

**Expected Results:**
- ✅ Gross Sales tooltip: "Total revenue (used for nexus determination)"
- ✅ Taxable Sales tooltip: "Sales subject to tax (used for liability)"
- ✅ Tooltips styled correctly (dark background, readable text)
- ✅ No console errors

**Pass/Fail:** ________

---

### Test 3.2: Sales Breakdown Visualization
**File:** `test_mixed_taxable_exempt.csv`

**Steps:**
1. Upload and analyze
2. Click into California (has exempt sales)
3. Scroll to Sales Breakdown section
4. Click into Washington (also has exempt sales)

**Expected Results:**
- ✅ Sales Breakdown section appears ONLY for states with exempt > 0
- ✅ Three boxes show: Gross, Exempt, Taxable
- ✅ Math is correct: Gross - Exempt = Taxable
- ✅ Minus and equals signs visible between boxes
- ✅ Explanation box appears below with bullet points
- ✅ Section styled correctly (borders, colors, spacing)

**Test Negative Case:**
1. Upload `sales_data_template.csv` (no exemptions)
2. Click into any state

**Expected Results:**
- ✅ Sales Breakdown section DOES NOT appear
- ✅ Goes straight from Summary to Liability Breakdown

**Pass/Fail:** ________

---

### Test 3.3: US Map Legend
**File:** Any analysis

**Steps:**
1. View any analysis results page
2. Scroll to US Map
3. Check legend below map

**Expected Results:**
- ✅ Legend shows 5 items:
  - Purple: Physical + Economic
  - Blue: Physical Only
  - Red: Economic Only
  - Amber: Approaching
  - Green: No Nexus
- ✅ Color boxes match map colors
- ✅ Legend centered below map
- ✅ Wraps on mobile/small screens

**Pass/Fail:** ________

---

### Test 3.4: Loading Skeleton States
**Purpose:** Verify loading states appear

**Steps:**
1. Start new analysis upload
2. Immediately after clicking "Analyze", watch the UI
3. Navigate to /analyses page and refresh
4. Navigate to state results and refresh

**Expected Results:**
- ✅ Skeleton loader appears during analysis processing
- ✅ Skeleton table shows on /analyses page during load
- ✅ Skeleton table shows on state results during load
- ✅ Skeleton has animated pulse effect
- ✅ Real data replaces skeleton smoothly

**Pass/Fail:** ________

---

### Test 3.5: Error Boundaries
**Purpose:** Verify errors don't crash the app

**Steps:**
1. Navigate to a state detail page
2. Open browser console
3. Check for any React errors

**Expected Results:**
- ✅ No React boundary errors in console
- ✅ If an error occurs, error boundary shows:
  - Alert icon
  - "Something went wrong" message
  - "Try Again" and "Go Home" buttons
- ✅ Clicking "Try Again" attempts to recover
- ✅ Clicking "Go Home" returns to homepage

**Note:** This is hard to test without forcing an error. Skip if no errors occur naturally.

**Pass/Fail:** ________

---

## Test Suite 4: Column Detection Edge Cases (15 min)

### Test 4.1: State Name Variants
**File:** Create `test_state_variants.csv`

```csv
transaction_date,customer_state,revenue_amount,sales_channel
2024-01-01,California,125000,direct
2024-01-02,calif,125000,direct
2024-01-03,Calif.,125000,direct
2024-01-04,CA,125000,direct
2024-02-01,New York,125000,direct
2024-02-02,NY,125000,direct
2024-03-01,District of Columbia,125000,direct
2024-03-02,D.C.,125000,direct
2024-03-03,DC,125000,direct
```

**Expected Results:**
- ✅ All CA variants → CA
- ✅ All NY variants → NY
- ✅ All DC variants → DC
- ✅ CA: $375K gross sales
- ✅ NY: $250K gross sales
- ✅ DC: $375K gross sales

**Pass/Fail:** ________

---

### Test 4.2: Sales Channel Variants
**File:** Create `test_channel_variants.csv`

```csv
transaction_date,customer_state,revenue_amount,sales_channel
2024-01-01,CA,50000,direct
2024-01-02,CA,50000,Website
2024-01-03,CA,50000,web
2024-01-04,CA,50000,online
2024-01-05,CA,50000,marketplace
2024-01-06,CA,50000,Amazon
2024-01-07,CA,50000,eBay
2024-01-08,CA,50000,Etsy
2024-01-09,CA,50000,platform
```

**Expected Results:**
- ✅ "Website", "web", "online" → direct
- ✅ "marketplace", "Amazon", "eBay", "Etsy", "platform" → marketplace
- ✅ CA: Direct sales = $200K
- ✅ CA: Marketplace sales = $250K
- ✅ CA: Total sales = $450K

**Pass/Fail:** ________

---

## Test Suite 5: VDA Mode (20 min)

### Test 5.1: Enable VDA Mode
**File:** Use `test_mixed_taxable_exempt.csv` (creates nexus in multiple states)

**Steps:**
1. Upload and analyze
2. Scroll to VDA Mode panel
3. Click "Enable VDA Mode"
4. Select 3 states (e.g., CA, NY, TX)
5. Click "Calculate VDA"

**Expected Results:**
- ✅ VDA Mode panel shows "What is VDA?" explanation
- ✅ Four checkmarks with benefits listed
- ✅ "Enable VDA Mode" button visible
- ✅ Modal opens with state selection
- ✅ Quick select buttons work (All, Top 3, Top 5, Top 10)
- ✅ Individual state checkboxes toggle
- ✅ Shows "X states selected" counter
- ✅ Calculate button enabled when states selected

**After Calculation:**
- ✅ Shows savings summary (Before VDA, With VDA, Total Savings)
- ✅ Shows savings percentage
- ✅ "Top States by Savings" accordion appears
- ✅ Can expand/collapse state details
- ✅ Shows penalties waived, interest waived per state
- ✅ "Active" badge shows in panel header
- ✅ "Change States" and "Disable VDA" buttons visible

**Pass/Fail:** ________

---

### Test 5.2: VDA State Selection Persistence
**File:** Continue from Test 5.1

**Steps:**
1. Note which states are selected in VDA
2. Navigate away from analysis
3. Return to analysis
4. Check VDA Mode panel

**Expected Results:**
- ✅ VDA Mode still shows "Active"
- ✅ Same states still selected
- ✅ Same savings calculations displayed
- ✅ Accordion shows same state breakdown

**Pass/Fail:** ________

---

### Test 5.3: Disable VDA Mode
**File:** Continue from Test 5.2

**Steps:**
1. Click "Disable VDA" button
2. Confirm in modal if prompted

**Expected Results:**
- ✅ VDA panel returns to initial state
- ✅ Shows "What is VDA?" explanation again
- ✅ "Enable VDA Mode" button visible
- ✅ Savings summary disappears
- ✅ Accordion disappears
- ✅ "Active" badge removed

**Pass/Fail:** ________

---

## Test Suite 6: Physical Nexus Integration (15 min)

### Test 6.1: Physical Nexus Date Configuration
**File:** `test_mixed_taxable_exempt.csv`

**Steps:**
1. Upload and analyze
2. Scroll to "Physical Nexus Configuration" section
3. Click "Configure Physical Nexus"
4. Select California, set date to 2024-01-01
5. Select New York, set date to 2024-02-15
6. Click "Save Configuration"
7. Click "Recalculate with Physical Nexus"

**Expected Results:**
- ✅ Modal opens with state selection
- ✅ Can add multiple states
- ✅ Date picker appears for each state
- ✅ Can remove states with X button
- ✅ Save button enabled when valid dates entered
- ✅ After save, shows confirmation
- ✅ Recalculate button triggers new calculation

**After Recalculation:**
- ✅ CA shows "Physical + Economic" or "Physical" nexus type
- ✅ NY shows "Physical + Economic" or "Physical" nexus type
- ✅ US Map colors updated (purple or blue)
- ✅ Obligation dates reflect physical nexus dates

**Pass/Fail:** ________

---

### Test 6.2: State Quick View Modal
**File:** Any analysis with nexus

**Steps:**
1. Click on a state row in State Table
2. Modal should open

**Expected Results:**
- ✅ Modal opens with state summary
- ✅ Shows nexus status, type, and date
- ✅ Shows key metrics (sales, liability, interest)
- ✅ Shows liability breakdown
- ✅ Shows year-by-year summary table
- ✅ Physical nexus date shown if configured
- ✅ Economic nexus date calculated from monthly sales
- ✅ "View Full Details" button navigates to state page
- ✅ Close button (X) closes modal

**Pass/Fail:** ________

---

## Test Suite 7: All Years View (10 min)

### Test 7.1: All Years Aggregation
**File:** Create `test_multi_year.csv`

```csv
transaction_date,customer_state,revenue_amount,sales_channel
2022-01-15,CA,60000,direct
2022-06-10,CA,55000,direct
2023-01-20,CA,70000,direct
2023-07-15,CA,65000,direct
2024-01-25,CA,80000,direct
2024-08-10,CA,75000,direct
```

**Steps:**
1. Upload and analyze (name: "Test 7.1 - Multi Year")
2. Click into California
3. Select "All Years" from year dropdown

**Expected Results:**
- ✅ All Years option available in dropdown
- ✅ Summary shows aggregated totals across all years
- ✅ Gross Sales: $405K (sum of all years)
- ✅ Days Outstanding: Uses earliest year's calculation
- ✅ Interest calculated from earliest obligation date
- ✅ "All Years" transaction table appears below
- ✅ Shows all 6 transactions aggregated
- ✅ Transaction table sortable and filterable
- ✅ CSV export filename includes "all_years"

**Pass/Fail:** ________

---

## Test Suite 8: Data Integrity (15 min)

### Test 8.1: Nexus Threshold Logic
**File:** Create `test_nexus_threshold.csv`

```csv
transaction_date,customer_state,revenue_amount,sales_channel,is_taxable,exempt_amount
2024-01-01,CA,80000,direct,Y,0
2024-02-01,CA,25000,direct,N,25000
2024-03-01,CA,50000,marketplace,Y,0
```

**Purpose:** Verify gross sales determine nexus, not taxable sales

**Expected Results:**
- ✅ CA Gross Sales: $155K
- ✅ CA Taxable Sales: $130K (80K + 0 + 50K)
- ✅ CA Exempt Sales: $25K
- ✅ Nexus Status: "Has Nexus" (crossed $100K gross threshold)
- ✅ NOT "None" even though taxable is only $130K
- ✅ Liability calculated on $130K taxable amount

**Calculation Check:**
- ✅ Base Tax ≈ $130K × 8.98% ≈ $11,674
- ✅ NOT $155K × 8.98% ≈ $13,919

**Pass/Fail:** ________

---

### Test 8.2: Marketplace Facilitator Rules
**File:** Create `test_marketplace_mf.csv`

```csv
transaction_date,customer_state,revenue_amount,sales_channel
2024-01-01,CA,100000,direct
2024-02-01,CA,100000,marketplace
```

**Expected Results:**
- ✅ CA Gross Sales: $200K
- ✅ CA Direct Sales: $100K
- ✅ CA Marketplace Sales: $100K
- ✅ CA Exposure Sales: $100K (only direct)
- ✅ Marketplace sales counted toward nexus threshold
- ✅ Marketplace sales NOT counted toward liability
- ✅ Base Tax calculated on $100K (not $200K)

**Pass/Fail:** ________

---

### Test 8.3: Returns Reduce Totals
**File:** Create `test_returns_logic.csv`

```csv
transaction_date,customer_state,revenue_amount,sales_channel
2024-01-01,CA,150000,direct
2024-02-01,CA,-10000,direct
2024-03-01,CA,-5000,marketplace
```

**Expected Results:**
- ✅ CA Gross Sales: $135K (150K - 10K - 5K)
- ✅ Returns show as negative in transaction table
- ✅ Running total decreases when return processed
- ✅ Nexus Status: "Has Nexus" (net $135K crosses threshold)
- ✅ Base Tax calculated on net amount

**Pass/Fail:** ________

---

## Test Suite 9: Regression Testing (10 min)

### Test 9.1: Existing Data Still Works
**Purpose:** Verify old analyses aren't broken

**Steps:**
1. Navigate to /analyses page
2. View an analysis created BEFORE migration 018
3. Click into state details

**Expected Results:**
- ✅ Analysis loads without errors
- ✅ State table shows all columns (may have $0 exempt)
- ✅ State detail page loads
- ✅ Calculations unchanged from before
- ✅ No "column missing" errors in console

**If Errors Occur:**
- ❌ Note the error message
- ❌ Check if recalculation fixes it
- ❌ Report to developer

**Pass/Fail:** ________

---

### Test 9.2: Recalculate Existing Analysis
**Purpose:** Update old data with new exempt sales logic

**Steps:**
1. Open an old analysis (pre-migration)
2. Click "Recalculate" button
3. Wait for completion

**Expected Results:**
- ✅ Recalculation completes successfully
- ✅ New columns populated (gross_sales, exempt_sales)
- ✅ If data had no exempt amounts, exempt = $0
- ✅ Gross sales = total_sales (backfilled)
- ✅ Taxable sales = exposure_sales (backfilled)
- ✅ All calculations still correct

**Pass/Fail:** ________

---

## Test Suite 10: Performance & Polish (10 min)

### Test 10.1: Large Dataset Performance
**File:** Create `test_large_dataset.csv` (500+ rows)

**Purpose:** Verify system handles large uploads

**Note:** You can generate this programmatically or manually create a large file

**Expected Results:**
- ✅ Upload succeeds (may take 10-30 seconds)
- ✅ No timeout errors
- ✅ All transactions processed
- ✅ State table loads and renders
- ✅ Pagination works in transaction tables
- ✅ Filtering/sorting works smoothly

**Pass/Fail:** ________

---

### Test 10.2: Mobile Responsiveness
**Purpose:** Verify UI works on mobile

**Steps:**
1. Open browser dev tools
2. Toggle device emulation (iPhone, iPad, etc.)
3. Navigate through analysis

**Expected Results:**
- ✅ State table readable on mobile
- ✅ Columns don't overflow
- ✅ Exempt badges visible
- ✅ Sales Breakdown boxes stack vertically on mobile
- ✅ US Map legend wraps properly
- ✅ Buttons accessible and clickable
- ✅ Modals fit on screen

**Pass/Fail:** ________

---

### Test 10.3: Dark Mode (if enabled)
**Purpose:** Verify themes work correctly

**Steps:**
1. Toggle dark mode (if system has theme switcher)
2. Navigate through analysis pages

**Expected Results:**
- ✅ All text readable
- ✅ Tooltips styled correctly
- ✅ Cards and borders visible
- ✅ US Map colors still distinct
- ✅ Sales Breakdown boxes visible
- ✅ No white flash on page loads

**Pass/Fail:** ________

---

## Summary Checklist

### Core Features
- [ ] Basic CSV upload works
- [ ] State name normalization works (California → CA)
- [ ] Date format detection works (multiple formats)
- [ ] Channel normalization works (Amazon → marketplace)
- [ ] All exempt sales (groceries) - nexus YES, liability $0
- [ ] Mixed taxable/exempt calculations correct
- [ ] Partial exemptions (exempt_amount) works
- [ ] Returns/refunds (negative amounts) work
- [ ] State table shows Gross/Taxable/Exempt columns
- [ ] Tooltips appear on column headers
- [ ] Sales Breakdown visualization appears
- [ ] US Map legend displays correctly

### Advanced Features
- [ ] VDA Mode enable/disable works
- [ ] VDA state selection and savings calculation
- [ ] Physical nexus configuration works
- [ ] State Quick View modal displays correctly
- [ ] All Years view aggregates properly
- [ ] Loading skeleton states appear
- [ ] Error boundaries prevent crashes

### Data Integrity
- [ ] Nexus uses gross sales (not taxable)
- [ ] Liability uses taxable/exposure sales
- [ ] Marketplace sales excluded from liability
- [ ] Returns reduce totals correctly
- [ ] Existing analyses still work
- [ ] Recalculation updates old data

### Polish
- [ ] Large datasets perform well
- [ ] Mobile responsive
- [ ] Dark mode works (if applicable)
- [ ] No console errors

---

## Test Results Summary

**Total Tests:** 40+
**Passed:** _____ / _____
**Failed:** _____ / _____
**Skipped:** _____ / _____

**Critical Issues Found:**


**Minor Issues Found:**


**Notes:**


---

## Completion Sign-off

**Tester Name:** ________________________
**Date Tested:** ________________________
**Environment:** ________________________
**Overall Status:** [ ] Pass  [ ] Pass with Issues  [ ] Fail

**Ready for Production:** [ ] Yes  [ ] No  [ ] Needs Review

---

## Appendix: Quick Reference

### CSV File Locations
All test files in: `frontend/public/templates/`

### Test File Purposes
- `sales_data_template.csv` - Basic, all taxable
- `sales_data_with_exemptions_template.csv` - Example with all columns
- `test_exempt_sales_grocery.csv` - All exempt (groceries)
- `test_mixed_taxable_exempt.csv` - Mix + returns
- `test_clothing_partial_exempt.csv` - Partial exemptions

### Key Calculations to Verify
```
Gross Sales = Total revenue (all transactions)
Exempt Sales = Sum of exempt amounts
Taxable Sales = Gross Sales - Exempt Sales
Exposure Sales = Taxable sales during obligation period
Base Tax = Exposure Sales × Tax Rate
Est. Liability = Base Tax + Interest + Penalties

Nexus Determination: Uses Gross Sales
Liability Calculation: Uses Exposure Sales
```

### Common Issues & Solutions
1. **"Column missing" errors** → Recalculate analysis
2. **Dates not parsing** → Check CSV has no # comments
3. **VDA not calculating** → Ensure states have nexus
4. **Tooltips not showing** → Check @radix-ui/react-tooltip installed
5. **Build errors** → Run `npm install --legacy-peer-deps`

---

**End of Testing Guide**
