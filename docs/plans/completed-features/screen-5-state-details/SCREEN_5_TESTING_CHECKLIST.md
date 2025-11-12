# Screen 5 (State Table) - End-to-End Testing Checklist

**Date:** 2025-01-04
**Feature:** State Table with Sorting, Filtering, and Navigation
**Status:** Ready for Testing

---

## Prerequisites

### Environment Setup
- [ ] Frontend server running: `npm run dev` (port 3000)
- [ ] Backend server running: `uvicorn app.main:app --reload --port 8000` (port 8000)
- [ ] Test data file available: `sample-sales-data-accurate.csv`

### Expected Test Results
- **Total states**: 52 (all US states + DC + territories)
- **States with nexus**: 2 (Florida, Colorado)
- **Total liability**: ~$16,959

---

## Test Suite 1: Complete User Flow

### 1.1 Authentication & Analysis Creation
- [ ] Login to application with valid credentials
- [ ] Create new analysis (Screen 1)
- [ ] Upload `sample-sales-data-accurate.csv` (Screen 2)
- [ ] Map columns correctly (Screen 3)
- [ ] Click "Calculate Nexus" button

### 1.2 Navigation to State Table
- [ ] View results dashboard (Screen 4)
- [ ] Verify "View Detailed Table" button is visible
- [ ] Click "View Detailed Table" button
- [ ] Verify navigates to `/analysis/{id}/states`

### 1.3 Initial Page Load
- [ ] Skeleton loading state appears (breadcrumb, header, filters, 10 rows)
- [ ] Breadcrumb shows: "Results Dashboard > State Table"
- [ ] Page heading shows: "State-by-State Results"
- [ ] Count shows: "Showing 52 states"
- [ ] Table loads with all 52 states

### 1.4 Table Content Verification
- [ ] Florida shows red dot, "Has Nexus", "Economic" type
- [ ] Colorado shows red dot, "Has Nexus", "Economic" type
- [ ] California shows green dot, "No Nexus"
- [ ] Texas shows green dot, "No Nexus"
- [ ] All states show threshold percentages (colored: red >= 100%, yellow >= 90%, green < 90%)
- [ ] Liability amounts formatted correctly ($X,XXX.XX)
- [ ] Confidence badges show "High" for all states
- [ ] Revenue breakdown shows Direct/Marketplace when applicable

---

## Test Suite 2: Filtering Functionality

### 2.1 Nexus Status Filter
- [ ] Select "Has Nexus" → Shows only 2 states (Florida, Colorado)
- [ ] Count updates: "Showing 2 of 52 states"
- [ ] Select "Approaching" → Shows states at 90-100% of threshold
- [ ] Select "No Nexus" → Shows states with no nexus
- [ ] Select "All" → Shows all 52 states again

### 2.2 Registration Filter
- [ ] Select "Registered" → Shows only registered states
- [ ] Select "Not Registered" → Shows only non-registered states
- [ ] Select "All" → Shows all states

### 2.3 Confidence Filter
- [ ] Select "High" → Shows all states (all have high confidence)
- [ ] Select "Medium" → Shows states with medium confidence
- [ ] Select "Low" → Shows states with low confidence
- [ ] Select "All" → Shows all states

### 2.4 Search Functionality
- [ ] Type "calif" → Finds California
- [ ] Type "fl" → Finds Florida
- [ ] Type "invalid" → Shows "No states match your filters"
- [ ] Clear search → Shows all states again

### 2.5 Clear Filters Button
- [ ] Apply multiple filters (nexus + registration)
- [ ] "Clear Filters" button appears
- [ ] Click "Clear Filters"
- [ ] All filters reset to "All"
- [ ] Search input clears
- [ ] All 52 states visible again

---

## Test Suite 3: Sorting Functionality

### 3.1 Column Headers
- [ ] All 6 column headers have hover effect (light gray background)
- [ ] Cursor changes to pointer on hover
- [ ] Headers show "State", "Nexus Status", "Revenue", "Threshold", "Est. Liability", "Confidence"

### 3.2 Default Sort
- [ ] Default sort: Nexus Status descending
- [ ] "Has Nexus" states first (Florida, Colorado)
- [ ] "Approaching" states next
- [ ] "No Nexus" states last
- [ ] Within same nexus status, sorted by liability (high to low)

### 3.3 Sort by State
- [ ] Click "State" header
- [ ] Sort indicator (↑ or ↓) appears
- [ ] States sorted alphabetically
- [ ] Click again → Reverses order (Z to A)

### 3.4 Sort by Revenue
- [ ] Click "Revenue" header
- [ ] States sorted by total_sales (highest first)
- [ ] Click again → Lowest first

### 3.5 Sort by Threshold
- [ ] Click "Threshold" header
- [ ] States sorted by threshold_percent (highest first)
- [ ] Click again → Lowest first

### 3.6 Sort by Liability
- [ ] Click "Est. Liability" header
- [ ] States sorted by estimated_liability (highest first)
- [ ] Click again → Lowest first

### 3.7 Sort by Confidence
- [ ] Click "Confidence" header
- [ ] States sorted by confidence_level
- [ ] Click again → Reverses order

### 3.8 Reset Sort
- [ ] Apply any sort
- [ ] Click "Reset to Default Sort" button
- [ ] Sort returns to: Nexus Status descending

---

## Test Suite 4: URL State Management

### 4.1 URL Updates
- [ ] Apply nexus filter → URL updates: `?nexus=has_nexus`
- [ ] Apply sort → URL adds: `&sort=liability&order=desc`
- [ ] Apply multiple filters → All params in URL
- [ ] Clear filters → URL returns to clean path
- [ ] Search is NOT in URL (ephemeral)

### 4.2 URL Persistence
- [ ] Apply filter + sort combination
- [ ] Copy URL from address bar
- [ ] Open new browser tab
- [ ] Paste URL
- [ ] Verify filters and sort are restored correctly

### 4.3 Browser Navigation
- [ ] Apply filter
- [ ] Apply sort
- [ ] Change filter
- [ ] Click browser Back button → Previous filter state
- [ ] Click browser Forward button → Next filter state

---

## Test Suite 5: Navigation

### 5.1 Breadcrumb Navigation
- [ ] Breadcrumb shows "Results Dashboard > State Table"
- [ ] "Results Dashboard" link has hover effect
- [ ] Click "Results Dashboard" → Navigates to `/analysis/{id}/results`
- [ ] "State Table" is not clickable (current page)

### 5.2 Back Button
- [ ] "Back to Results" button visible at bottom
- [ ] Click button → Navigates to results dashboard

### 5.3 Row Click (Future Screen 6)
- [ ] Hover over any table row → Gray background, arrow appears
- [ ] Click row → Navigates to `/analysis/{id}/states/{state_code}`
- [ ] Current: Shows 404 (Screen 6 not built yet)
- [ ] Expected: Will show state detail page when Screen 6 is complete

---

## Test Suite 6: Error Handling

### 6.1 No Calculation Error
- [ ] Create new analysis (don't run calculation)
- [ ] Navigate directly to `/analysis/{id}/states`
- [ ] Yellow warning appears: "Nexus Not Calculated Yet"
- [ ] Two buttons: "Go to Mapping Page" and "Back to Dashboard"
- [ ] Click "Go to Mapping Page" → Navigates to mapping page
- [ ] Return to states URL
- [ ] Click "Back to Dashboard" → Navigates to results page

### 6.2 Analysis Not Found Error
- [ ] Navigate to `/analysis/invalid-id-12345/states`
- [ ] Red error appears: "Analysis Not Found"
- [ ] Message: "This analysis does not exist or you don't have permission to access it."
- [ ] Click "Go to Dashboard" → Navigates to main dashboard

### 6.3 Generic Error (Simulate)
To test, temporarily break the API:
- [ ] Stop backend server
- [ ] Refresh state table page
- [ ] Red error appears: "Error Loading States"
- [ ] Error message shows: Connection error details
- [ ] Two buttons: "Retry" and "Back to Results"
- [ ] Start backend server
- [ ] Click "Retry" → Page reloads and data loads successfully

---

## Test Suite 7: Edge Cases

### 7.1 Empty Filter Results
- [ ] Apply nexus filter: "Has Nexus"
- [ ] Apply confidence filter: "Low"
- [ ] If no states match: "No states match your filters" message appears
- [ ] Clear filters → All states return

### 7.2 Rapid Filter Changes
- [ ] Quickly change filters multiple times
- [ ] Table updates smoothly
- [ ] No errors or flickering
- [ ] Final state matches selected filters

### 7.3 Very Long Search Query
- [ ] Type very long search query (50+ characters)
- [ ] Search input handles gracefully
- [ ] No states match → Empty state message

### 7.4 Special Characters in Search
- [ ] Type special characters: `!@#$%^&*()`
- [ ] No errors occur
- [ ] No states match (expected)

---

## Test Suite 8: Responsive Design (Optional)

### 8.1 Desktop View (1920x1080)
- [ ] Table displays correctly
- [ ] All columns visible
- [ ] Filter bar fits on one row

### 8.2 Laptop View (1366x768)
- [ ] Table still readable
- [ ] Filter bar may wrap (acceptable)
- [ ] Scroll bar appears if needed

### 8.3 Tablet View (Optional)
- [ ] Test on tablet or resize browser
- [ ] Verify usability

---

## Test Suite 9: Performance

### 9.1 Loading Time
- [ ] Measure time from navigation to table display
- [ ] Expected: < 2 seconds on localhost
- [ ] Skeleton appears immediately

### 9.2 Filter Performance
- [ ] Apply filters
- [ ] Table updates instantly (< 100ms)
- [ ] No lag or delay

### 9.3 Sort Performance
- [ ] Click sort headers rapidly
- [ ] Table re-sorts quickly
- [ ] No performance issues with 52 states

---

## Test Suite 10: Accessibility (Optional)

### 10.1 Keyboard Navigation
- [ ] Tab through page elements
- [ ] Filter dropdowns accessible via keyboard
- [ ] Buttons focusable and clickable with Enter
- [ ] Table rows focusable

### 10.2 Screen Reader (Optional)
- [ ] Nav element properly labeled
- [ ] Table has proper structure
- [ ] Buttons have clear labels

---

## Bug Tracking

### Bugs Found During Testing
List any issues discovered:

1. **Bug Title:**
   - **Description:**
   - **Steps to Reproduce:**
   - **Expected Behavior:**
   - **Actual Behavior:**
   - **Severity:** Critical / High / Medium / Low
   - **Status:** Open / Fixed / Won't Fix

*(Add more as needed)*

---

## Test Results Summary

**Date Tested:** _______________
**Tested By:** _______________
**Environment:** Development / Staging / Production

### Results Overview
- Total Test Cases: 100+
- Passed: ___
- Failed: ___
- Blocked: ___
- Not Tested: ___

### Critical Issues Found
*(List any critical issues)*

### Recommendations
*(Any improvements or follow-up items)*

---

## Sign-Off

**Tester Name:** _______________
**Date:** _______________
**Status:** ✅ Approved / ❌ Needs Fixes / ⏸️ Blocked

---

## Notes
- Screen 6 (State Detail) is not yet implemented, so clicking rows will show 404 (expected)
- All tests should be performed with `sample-sales-data-accurate.csv`
- Backend and frontend must both be running for full test coverage
