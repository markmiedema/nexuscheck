# Analysis Management - Manual Testing Checklist

**Sprint 1A: Analysis Management**
**Created:** 2025-11-07
**Purpose:** Comprehensive manual testing checklist for analysis list, view, and delete features

---

## Pre-Testing Setup

- [ ] Backend running on port 8000
  ```bash
  cd backend
  python -m uvicorn app.main:app --reload --port 8000
  ```
- [ ] Frontend running on port 3000
  ```bash
  cd frontend
  npm run dev
  ```
- [ ] Logged in as test user (valid Supabase auth)
- [ ] At least 2-3 test analyses exist in database with different statuses:
  - [ ] At least one `complete` analysis
  - [ ] At least one `draft` analysis
  - [ ] Analyses with different client names

---

## Test Cases

### 1. List Analyses Page

**Navigate to:** `http://localhost:3000/analyses`

- [ ] Page loads without errors (check browser console)
- [ ] Loading skeletons appear briefly while data fetches
- [ ] Analyses display in a table
- [ ] **Table Headers Present:**
  - [ ] Client
  - [ ] Period
  - [ ] Status
  - [ ] States with Nexus
  - [ ] Est. Liability
  - [ ] Created
  - [ ] Actions
- [ ] **Data Displays Correctly:**
  - [ ] Client names show correctly
  - [ ] Analysis periods formatted as "Nov 7, 2024"
  - [ ] Status badges display with correct colors:
    - [ ] Draft = Gray with Clock icon
    - [ ] Processing = Blue with Loader icon
    - [ ] Complete = Green with CheckCircle icon
    - [ ] Error = Red with AlertCircle icon
  - [ ] States with nexus shows numbers or "—"
  - [ ] Estimated liability formatted as currency ($12,345)
  - [ ] Created dates formatted consistently
- [ ] **Actions Column:**
  - [ ] View button (eye icon) present for each row
  - [ ] Delete button (trash icon) present for each row
- [ ] **Page Header:**
  - [ ] "Analysis History" title displays
  - [ ] Description text displays
  - [ ] "New Analysis" button appears in top right
- [ ] **Pagination Info:**
  - [ ] "Showing X of Y analyses" displays at bottom
  - [ ] Count is accurate

---

### 2. Search Functionality

**On the Analyses page:**

- [ ] Search input box appears below header
- [ ] Search icon displays in input
- [ ] Placeholder text: "Search by client name..."
- [ ] **Test Search:**
  1. [ ] Type partial client name (e.g., "ACME")
  2. [ ] Results filter as you type (without page reload)
  3. [ ] Only matching analyses display
  4. [ ] Count updates: "Showing X of Y analyses"
- [ ] **Clear Search:**
  1. [ ] Clear search box
  2. [ ] All analyses return
  3. [ ] Count returns to total
- [ ] **No Results:**
  1. [ ] Search for non-existent client (e.g., "ZZZZZ")
  2. [ ] Empty state appears:
    - [ ] Icon displays
    - [ ] "No analyses found" message
    - [ ] "No analyses match your search" message
    - [ ] NO "Create Analysis" button (only shows when not searching)

---

### 3. View Analysis

**Test with a COMPLETE analysis:**

1. [ ] Click "View" button (eye icon) on a complete analysis
2. [ ] **Navigation:**
   - [ ] Redirects to `/analysis/{id}/results`
   - [ ] URL contains correct analysis ID
3. [ ] **Results Page Loads:**
   - [ ] No errors in console
   - [ ] Client name displays correctly
   - [ ] Analysis period displays correctly
   - [ ] State results display (if analysis is complete)
   - [ ] Liability summary shows
4. [ ] **Navigate to State Details:**
   - [ ] Click on a state with nexus
   - [ ] State detail page loads correctly
5. [ ] **Return to List:**
   - [ ] Use browser back button
   - [ ] Returns to `/analyses`
   - [ ] List still shows correct data
   - [ ] Search term preserved (if was searching)

**Test with a DRAFT analysis:**

1. [ ] Click "View" on a draft analysis
2. [ ] Should redirect to appropriate page for that status
3. [ ] No errors occur

---

### 4. Delete Analysis

**Basic Delete Flow:**

1. [ ] Click "Delete" button (trash icon) on any analysis
2. [ ] **Browser Confirmation:**
   - [ ] Browser confirm dialog appears
   - [ ] Message shows: 'Are you sure you want to delete the analysis for "{CLIENT_NAME}"?'
   - [ ] Client name matches the row
3. [ ] **Cancel Delete:**
   - [ ] Click "Cancel" in confirm dialog
   - [ ] Dialog closes
   - [ ] Analysis remains in list
   - [ ] No API calls made (check network tab)
4. [ ] **Confirm Delete:**
   - [ ] Click "Delete" again
   - [ ] Click "OK" in confirm dialog
   - [ ] Delete button shows loading spinner (briefly)
   - [ ] Analysis removed from list
   - [ ] Total count decrements
   - [ ] No errors in console
5. [ ] **Verify Deletion:**
   - [ ] Refresh the page
   - [ ] Deleted analysis does not reappear
   - [ ] Count remains accurate

**Delete Loading State:**

1. [ ] Click delete on an analysis
2. [ ] Confirm deletion
3. [ ] **While Deleting:**
   - [ ] Trash icon replaced with spinning loader
   - [ ] Delete button disabled
   - [ ] Other analyses' delete buttons still clickable

**Delete Error Handling:**

1. [ ] Stop backend server
2. [ ] Try to delete an analysis
3. [ ] Confirm deletion
4. [ ] **Error Handling:**
   - [ ] Alert shows: "Failed to delete analysis. Please try again."
   - [ ] Analysis remains in list
   - [ ] Loading spinner stops
5. [ ] Restart backend server

---

### 5. Empty States

**New User with No Analyses:**

1. [ ] Create fresh test user OR delete all test analyses
2. [ ] Navigate to `/analyses`
3. [ ] **Empty State Displays:**
   - [ ] FileText icon (centered)
   - [ ] "No analyses found" heading
   - [ ] "Get started by creating your first analysis." message
   - [ ] "Create Analysis" button
4. [ ] **Click "Create Analysis":**
   - [ ] Redirects to `/analysis/new`
   - [ ] New analysis form loads

---

### 6. Dashboard Integration

**On Dashboard Page:**

1. [ ] Navigate to `/dashboard`
2. [ ] **Recent Analyses Card:**
   - [ ] Card displays in dashboard grid
   - [ ] FileText icon shows
   - [ ] "Recent Analyses" heading
   - [ ] Description text: "View and manage your previous sales tax nexus analyses"
   - [ ] "View All Analyses" button present
3. [ ] **Click Button:**
   - [ ] Redirects to `/analyses`
   - [ ] Analyses list loads correctly

---

### 7. Navigation & Routing

- [ ] **From Dashboard → Analyses:**
  - [ ] Click "View All Analyses" button
  - [ ] Correct routing
- [ ] **From Analyses → New Analysis:**
  - [ ] Click "New Analysis" button (top right)
  - [ ] Redirects to `/analysis/new`
- [ ] **From Analyses → View Results:**
  - [ ] Click eye icon
  - [ ] Correct analysis loads
- [ ] **Browser Back/Forward:**
  - [ ] Navigate: Dashboard → Analyses → View → States
  - [ ] Use browser back repeatedly
  - [ ] Each page loads correctly
  - [ ] No errors occur

---

### 8. Responsive Design (Optional)

**Desktop (1920x1080):**
- [ ] Table displays full width
- [ ] All columns visible
- [ ] No horizontal scroll

**Tablet (768px):**
- [ ] Table remains readable
- [ ] May have horizontal scroll (acceptable)

**Mobile (375px):**
- [ ] Page doesn't break
- [ ] Essential info visible

---

### 9. Performance

- [ ] **With 10 analyses:**
  - [ ] List loads in < 1 second
  - [ ] Search responds instantly
- [ ] **With 50+ analyses:**
  - [ ] List loads in < 2 seconds
  - [ ] Pagination info accurate
  - [ ] Smooth scrolling

---

### 10. Security

**Authentication:**
1. [ ] Log out
2. [ ] Try to access `/analyses` directly
3. [ ] **Should:**
   - [ ] Redirect to `/login`
   - [ ] OR show "Please log in" message
   - [ ] NOT show any analysis data

**Authorization:**
1. [ ] Log in as User A
2. [ ] Note analysis IDs
3. [ ] Log in as User B
4. [ ] **Verify:**
   - [ ] User B sees only their analyses
   - [ ] User B cannot see User A's analyses
   - [ ] If User B tries to view User A's analysis by URL:
     - [ ] Should get 404 or access denied
     - [ ] Should NOT show data

---

## Known Issues / Notes

**Optional Enhancements (not implemented yet):**
- ⬜ Custom delete confirmation dialog (currently uses browser confirm)
  - See: `frontend/components/analyses/README.md` for implementation guide
- ⬜ Pagination controls (currently shows all up to 50)
- ⬜ Status filter dropdown
- ⬜ Sort by different columns

**Expected Behavior:**
- Soft delete is used (sets `deleted_at` timestamp)
- Deleted analyses have 30-day recovery window
- Hard delete happens via scheduled job (not implemented yet)

---

## Post-Testing Cleanup

- [ ] Delete test analyses created during testing
  ```sql
  -- In Supabase SQL Editor:
  DELETE FROM analyses
  WHERE client_company_name LIKE '%Test%';
  ```
- [ ] Log out test users
- [ ] Stop backend server (`Ctrl+C`)
- [ ] Stop frontend server (`Ctrl+C`)

---

## Bug Report Template

If you find bugs during testing:

**Bug:** [Short description]
**Location:** [Page/Component]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happened]
**Console Errors:** [Paste any console errors]
**Priority:** [P0 - Blocker / P1 - High / P2 - Medium / P3 - Low]

---

**Testing Completed By:** _______________
**Date:** _______________
**Status:** [ ] Pass [ ] Pass with minor issues [ ] Fail
**Notes:** _________________________________
