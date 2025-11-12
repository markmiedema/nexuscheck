# Manual Testing Guide - Toast Notifications & Button Standardization

**Date:** 2025-11-08
**Changes:** MEDIUM Priority UI/UX Improvements
**Estimated Testing Time:** 15-20 minutes

---

## What Was Changed

### 1. Toast Notification System
- ✅ Installed shadcn/ui toast components
- ✅ Replaced all browser `alert()` calls with professional toast notifications
- ✅ Added centralized error handling utilities

### 2. Button Standardization
- ✅ Replaced all custom buttons with shadcn Button component
- ✅ Applied semantic variants (default, outline, ghost)

### 3. Files Modified (10 files)
- `app/layout.tsx` - Added Toaster component
- `app/login/page.tsx` - Standardized button
- `app/signup/page.tsx` - Standardized button
- `app/analyses/page.tsx` - Error handling + toasts + delete success
- `app/analysis/new/page.tsx` - Success toast + standardized buttons
- `app/analysis/[id]/upload/page.tsx` - Success toast + standardized buttons
- `app/analysis/[id]/mapping/page.tsx` - Validation toasts + standardized buttons
- `app/analysis/[id]/results/page.tsx` - Standardized all buttons

### 4. New Files Created (5 files)
- `components/ui/toast.tsx` - Toast UI component
- `components/ui/toaster.tsx` - Global toast container
- `hooks/use-toast.ts` - Toast state management
- `lib/utils/errorHandler.ts` - Error handling utilities
- `lib/utils/README.md` - Developer documentation

---

## Prerequisites

**Before testing, ensure:**
1. ✅ Backend is running: `http://localhost:8000`
2. ✅ Frontend is running: `http://localhost:3000`
3. ✅ Database is accessible (Supabase)
4. ✅ You have a test user account (or can create one)

**Start servers:**
```bash
# Terminal 1 - Backend
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\backend"
source venv/Scripts/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend"
npm run dev
```

---

## Test Plan

### Test 1: Authentication Pages (Login/Signup)

#### 1.1 Signup Page
**URL:** `http://localhost:3000/signup`

**Test Steps:**
1. Navigate to signup page
2. **Verify button styling:**
   - [ ] "Create account" button has indigo background
   - [ ] Button has consistent padding and rounded corners
   - [ ] Hover effect works (darker indigo)
3. **Test validation toasts:**
   - [ ] Leave email empty, click submit
   - [ ] Toast appears at bottom-right (or top-right)
   - [ ] Toast says "Email is required" or similar
   - [ ] Toast has red/destructive styling
   - [ ] Toast auto-dismisses after ~5 seconds
4. **Test password mismatch:**
   - [ ] Enter different passwords in password/confirm fields
   - [ ] Toast shows "Passwords do not match"
   - [ ] Toast has destructive variant (red border/background)
5. **Test successful signup:**
   - [ ] Fill in valid email and password
   - [ ] Submit form
   - [ ] Success screen shows (green checkmark)
   - [ ] Redirects to login after 2 seconds

**Expected Result:** ✅ No browser alerts, only toast notifications

---

#### 1.2 Login Page
**URL:** `http://localhost:3000/login`

**Test Steps:**
1. Navigate to login page
2. **Verify button styling:**
   - [ ] "Sign in" button matches signup button style
   - [ ] Consistent hover effects
3. **Test failed login:**
   - [ ] Enter wrong credentials
   - [ ] Toast appears with error message
   - [ ] Toast is destructive variant (red)
   - [ ] No browser alert appears
4. **Test successful login:**
   - [ ] Enter correct credentials
   - [ ] Redirects to dashboard
   - [ ] No toast shown (redirect happens immediately)

**Expected Result:** ✅ All buttons standardized, errors show as toasts

---

### Test 2: Dashboard & Analyses List

#### 2.1 Dashboard
**URL:** `http://localhost:3000/dashboard`

**Test Steps:**
1. Navigate to dashboard
2. **Verify logout button:**
   - [ ] Logout button has outline variant (border, no fill)
   - [ ] Hover effect changes background to light gray
   - [ ] Button is properly aligned in nav bar

**Expected Result:** ✅ Logout button uses shadcn Button component

---

#### 2.2 Analyses List
**URL:** `http://localhost:3000/analyses`

**Test Steps:**
1. Navigate to analyses list
2. **Test delete analysis (if you have analyses):**
   - [ ] Click delete button (trash icon)
   - [ ] Browser confirm dialog appears (this is expected - LOW priority to replace)
   - [ ] Confirm deletion
   - [ ] Toast appears: "Analysis for '[ClientName]' deleted successfully"
   - [ ] Toast is default variant (no red border)
   - [ ] Toast auto-dismisses
   - [ ] Analysis is removed from list
3. **Test error handling:**
   - [ ] If you get a loading error, check for toast (not browser alert)

**Expected Result:** ✅ Success toast shows on delete, no browser alerts for errors

---

### Test 3: Analysis Creation Workflow

#### 3.1 New Analysis Page
**URL:** `http://localhost:3000/analysis/new`

**Test Steps:**
1. Click "New Analysis" from dashboard
2. **Verify buttons:**
   - [ ] "Cancel" button has outline variant
   - [ ] "Continue to Upload" button has default variant (indigo)
   - [ ] Both buttons have consistent sizing
3. **Test form submission:**
   - [ ] Fill in company name and business type
   - [ ] Click "Continue to Upload"
   - [ ] Toast appears: "Analysis created successfully"
   - [ ] Toast has default variant (success)
   - [ ] Redirects to upload page

**Expected Result:** ✅ Success toast shows, buttons standardized

---

#### 3.2 Upload Page
**URL:** `http://localhost:3000/analysis/[id]/upload`

**Test Steps:**
1. From new analysis, continue to upload
2. **Verify buttons:**
   - [ ] "Choose File" button has outline variant
   - [ ] "← Back" button has outline variant
   - [ ] "Continue to Mapping" button has default variant
3. **Test file upload:**
   - [ ] Upload a CSV file
   - [ ] File preview shows
   - [ ] "Upload Different File" button appears (ghost variant)
4. **Test continue:**
   - [ ] Click "Continue to Mapping"
   - [ ] Toast appears: "File uploaded successfully: [filename]"
   - [ ] Toast auto-dismisses
   - [ ] Redirects to mapping page

**Expected Result:** ✅ Success toast on upload, all buttons standardized

---

#### 3.3 Mapping Page
**URL:** `http://localhost:3000/analysis/[id]/mapping`

**Test Steps:**
1. From upload, continue to mapping
2. **Verify buttons:**
   - [ ] "← Back to Upload" button has outline variant
   - [ ] "Calculate Nexus →" button has default variant
3. **Test validation (required fields):**
   - [ ] Clear one of the required dropdowns (e.g., Transaction Date)
   - [ ] Click "Calculate Nexus"
   - [ ] Toast appears: "Validation Error: Transaction Date is required"
   - [ ] Toast has destructive variant (red)
   - [ ] **NO browser alert appears**
4. **Test successful calculation:**
   - [ ] Map all required fields correctly
   - [ ] Click "Calculate Nexus"
   - [ ] Toast appears: "Column mapping saved successfully"
   - [ ] Redirects to results page after 1 second

**Expected Result:** ✅ Validation errors show as toasts, NOT browser alerts

---

#### 3.4 Results Page
**URL:** `http://localhost:3000/analysis/[id]/results`

**Test Steps:**
1. From mapping, view results
2. **Verify all buttons:**
   - [ ] "← Back to Mapping" has outline variant
   - [ ] "🔄 Recalculate" has outline variant (if visible)
   - [ ] "Start New Analysis" has default variant
   - [ ] "View Detailed Table →" has custom dark background
   - [ ] "Generate Report (Coming Soon)" has outline variant + disabled state
3. **Test button interactions:**
   - [ ] Hover over each button to verify hover effects
   - [ ] Click "Start New Analysis" - should redirect to `/analysis/new`
   - [ ] Click "← Back to Mapping" - should go back

**Expected Result:** ✅ All 5 action buttons use shadcn Button component

---

### Test 4: Error Handling

#### 4.1 Network Errors
**Test Steps:**
1. Stop your backend server
2. Try to load analyses list
3. **Verify:**
   - [ ] Toast appears with error message
   - [ ] Toast has destructive variant
   - [ ] NO browser alert
   - [ ] Error is also logged to console (check DevTools)
4. Restart backend and verify recovery

**Expected Result:** ✅ Network errors show as toasts

---

#### 4.2 API Errors
**Test Steps:**
1. Try to create analysis with invalid data (if possible)
2. **Verify:**
   - [ ] Toast shows API error message
   - [ ] FastAPI error detail is extracted correctly
   - [ ] Toast is destructive variant

**Expected Result:** ✅ API errors properly extracted and displayed

---

### Test 5: Toast Behavior

#### 5.1 Toast Appearance
**Test Steps:**
1. Trigger any toast (e.g., delete analysis)
2. **Verify:**
   - [ ] Toast appears smoothly (slide-in animation)
   - [ ] Toast is positioned in viewport (bottom-right or top-right)
   - [ ] Toast has proper styling (border, shadow, padding)
   - [ ] Text is readable (proper contrast)

---

#### 5.2 Toast Auto-Dismiss
**Test Steps:**
1. Trigger a toast
2. **Verify:**
   - [ ] Toast remains visible for ~5 seconds
   - [ ] Toast slides out automatically
   - [ ] Toast can be manually dismissed (X button)

---

#### 5.3 Multiple Toasts
**Test Steps:**
1. Trigger multiple errors quickly (e.g., submit mapping without filling fields multiple times)
2. **Verify:**
   - [ ] Toasts stack properly (don't overlap)
   - [ ] Each toast dismisses independently
   - [ ] Toasts are readable

---

### Test 6: Accessibility

#### 6.1 Keyboard Navigation
**Test Steps:**
1. Use Tab key to navigate through forms
2. **Verify:**
   - [ ] Buttons are reachable via Tab
   - [ ] Focus indicator is visible on buttons
   - [ ] Enter key activates buttons

---

#### 6.2 Screen Reader (Optional)
**Test Steps:**
1. Use browser DevTools to inspect buttons
2. **Verify:**
   - [ ] Buttons have proper semantic HTML (`<button>`)
   - [ ] Buttons have text content (not just icons)

---

## Critical Issues to Watch For

### 🚨 Should NOT Happen:
- ❌ Browser `alert()` dialogs (except for delete confirmation - that's LOW priority)
- ❌ Errors logged to console without user feedback
- ❌ Custom `<button>` elements (should all be shadcn Button)
- ❌ Inline error divs for temporary messages (should use toasts)

### ✅ Should Happen:
- ✅ Toast notifications appear for all success/error messages
- ✅ Toasts auto-dismiss after 5 seconds
- ✅ All buttons use consistent styling
- ✅ Hover effects work on all buttons
- ✅ Forms still validate properly

---

## Quick Regression Test (5 Minutes)

If you're short on time, test this minimal flow:

1. **Login** → Verify button style
2. **Dashboard** → Verify logout button
3. **New Analysis** → Create analysis, verify success toast
4. **Upload** → Upload file, verify success toast
5. **Mapping** → Leave field empty, click Calculate, verify validation toast (NO alert)
6. **Delete Analysis** → Verify success toast

---

## Browser Testing

**Recommended browsers:**
- ✅ Chrome/Edge (primary)
- ✅ Firefox (secondary)
- ⚠️ Safari (if on Mac)

**Test in:**
- Desktop (1920x1080 or similar)
- Mobile view (DevTools responsive mode)

---

## Reporting Issues

If you find bugs, note:
1. **Page/URL** where issue occurred
2. **Expected behavior** (from this guide)
3. **Actual behavior** (what you saw)
4. **Browser** and viewport size
5. **Console errors** (if any)

---

## Success Criteria

All tests pass when:
- ✅ No browser alerts appear (except delete confirmation)
- ✅ All success/error messages show as toasts
- ✅ All buttons use shadcn Button component
- ✅ Toasts auto-dismiss correctly
- ✅ Error messages are clear and helpful
- ✅ All workflows complete successfully

---

## Reference Documentation

**For developers:**
- `frontend/lib/utils/README.md` - Toast & error handling guide
- `docsplans/UI_UX_AUDIT_2025-11-08.md` - Implementation summary

**Components used:**
- `@/components/ui/button` - Button component
- `@/components/ui/toast` - Toast component
- `@/hooks/use-toast` - Toast hook
- `@/lib/utils/errorHandler` - Error utilities

---

## Next Steps After Testing

**If all tests pass:**
- ✅ Mark MEDIUM priority items as complete in roadmap
- ✅ Consider tackling LOW priority items (optional)
- ✅ Continue with other development tasks

**If issues found:**
- 🐛 Document issues
- 🔧 Create fixes
- 🧪 Re-test

---

**Happy Testing!** 🎉
