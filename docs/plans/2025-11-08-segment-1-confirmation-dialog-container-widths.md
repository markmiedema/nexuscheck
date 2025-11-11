# Segment 1: Confirmation Dialog & Container Standardization

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace browser confirm() dialogs with professional AlertDialog components and standardize container widths across all pages for visual consistency.

**Architecture:** Install shadcn AlertDialog component, create reusable ConfirmDialog wrapper, replace all browser confirm() calls, audit and standardize max-width values across pages, document standards.

**Tech Stack:** Next.js 14, React 18, shadcn/ui (AlertDialog), TypeScript, Tailwind CSS

---

## Task 1: Install shadcn AlertDialog Component

**Files:**
- Create: `frontend/components/ui/alert-dialog.tsx`
- Modify: `frontend/package.json` (dependencies auto-updated)

**Step 1: Install AlertDialog via shadcn CLI**

```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend"
npx shadcn@latest add alert-dialog
```

**Expected output:**
```
✔ Done. Alert Dialog component installed.
```

**Step 2: Verify component was created**

```bash
ls components/ui/alert-dialog.tsx
```

**Expected:** File exists

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 4: Commit**

```bash
git add components/ui/alert-dialog.tsx package.json package-lock.json
git commit -m "feat: install shadcn AlertDialog component

- Add AlertDialog component from shadcn/ui
- Will be used to replace browser confirm() dialogs
- Provides better UX and accessibility

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Reusable ConfirmDialog Component

**Files:**
- Create: `frontend/components/shared/ConfirmDialog.tsx`

**Step 1: Create shared components directory**

```bash
mkdir -p "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend\components\shared"
```

**Step 2: Create ConfirmDialog component**

Create file `frontend/components/shared/ConfirmDialog.tsx`:

```typescript
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 4: Commit**

```bash
git add components/shared/ConfirmDialog.tsx
git commit -m "feat: create reusable ConfirmDialog component

- Wraps shadcn AlertDialog with simplified API
- Supports destructive variant for delete actions
- Replaces browser confirm() with accessible dialog

Props:
- title, description, confirmText, cancelText
- onConfirm callback
- variant for styling (default | destructive)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Replace Browser confirm() in Analyses List

**Files:**
- Modify: `frontend/app/analyses/page.tsx:69-72`

**Context:** Currently uses browser confirm() for delete confirmation. Need to replace with ConfirmDialog component.

**Step 1: Read current implementation**

```bash
# View the current delete handler
grep -A 10 "handleDelete" frontend/app/analyses/page.tsx
```

**Expected:** See browser confirm() call around line 69

**Step 2: Add ConfirmDialog state and import**

At top of file, add import:
```typescript
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
```

Inside component, add state (after existing useState calls):
```typescript
const [deleteDialog, setDeleteDialog] = useState<{
  open: boolean
  analysisId: string | null
  clientName: string
}>({
  open: false,
  analysisId: null,
  clientName: '',
})
```

**Step 3: Update handleDelete function**

Replace the current `handleDelete` function with:

```typescript
const handleDelete = async (analysisId: string, clientName: string) => {
  setDeleteDialog({
    open: true,
    analysisId,
    clientName,
  })
}

const confirmDelete = async () => {
  if (!deleteDialog.analysisId) return

  setDeleting(deleteDialog.analysisId)

  try {
    await deleteAnalysis(deleteDialog.analysisId)
    showSuccess(`Analysis for "${deleteDialog.clientName}" deleted successfully`)
    await loadAnalyses()
  } catch (error) {
    handleApiError(error, { userMessage: 'Failed to delete analysis' })
  } finally {
    setDeleting(null)
    setDeleteDialog({ open: false, analysisId: null, clientName: '' })
  }
}
```

**Step 4: Add ConfirmDialog component to JSX**

Before the closing tag of the main container, add:

```typescript
<ConfirmDialog
  open={deleteDialog.open}
  onOpenChange={(open) =>
    setDeleteDialog({ open, analysisId: null, clientName: '' })
  }
  onConfirm={confirmDelete}
  title="Delete Analysis"
  description={`Are you sure you want to delete the analysis for "${deleteDialog.clientName}"? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  variant="destructive"
/>
```

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 6: Manual test**

1. Start dev server: `npm run dev`
2. Navigate to analyses list
3. Click delete button on an analysis
4. Verify dialog appears (not browser confirm)
5. Verify "Cancel" closes dialog
6. Verify "Delete" deletes analysis and shows success toast

**Step 7: Commit**

```bash
git add app/analyses/page.tsx
git commit -m "refactor: replace browser confirm with ConfirmDialog in analyses list

- Use ConfirmDialog component instead of browser confirm()
- Better UX with proper dialog styling
- Accessible with keyboard navigation
- Destructive variant for delete action
- Shows full context before deletion

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Audit Current Container Widths

**Files:**
- None (investigation task)

**Step 1: Search for all max-w usage**

```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend"
grep -r "max-w-" app/ --include="*.tsx" | grep -v "node_modules"
```

**Step 2: Document findings**

Create temporary file to track findings:

```bash
cat > container-width-audit.txt << 'EOF'
# Container Width Audit

## Dashboard Pages (Should be max-w-7xl):
- app/dashboard/page.tsx: ???
- app/analyses/page.tsx: ???

## Form Pages (Should be max-w-4xl):
- app/login/page.tsx: ???
- app/signup/page.tsx: ???
- app/analysis/new/page.tsx: ???

## Workflow Pages (Should be max-w-5xl):
- app/analysis/[id]/upload/page.tsx: ???
- app/analysis/[id]/mapping/page.tsx: ???
- app/analysis/[id]/results/page.tsx: ???
- app/analysis/[id]/states/page.tsx: ???

## Component Widths:
- components/layout/AppLayout.tsx: ???
EOF
```

**Step 3: Fill in actual values**

For each file, note the current max-w value used.

**Step 4: No commit** (investigation only)

---

## Task 5: Standardize Dashboard/List Page Widths

**Files:**
- Modify: `frontend/components/layout/AppLayout.tsx` (if needed)
- Modify: `frontend/app/dashboard/page.tsx`
- Modify: `frontend/app/analyses/page.tsx`
- Modify: `frontend/app/analysis/[id]/states/page.tsx`

**Step 1: Update AppLayout to accept maxWidth prop**

Read `components/layout/AppLayout.tsx` to see if it already has maxWidth prop.

If it does, verify these pages use `maxWidth="7xl"`:
- dashboard/page.tsx
- analyses/page.tsx
- analysis/[id]/states/page.tsx

If not, the AppLayout likely wraps content in a container. Find the container div and ensure it uses `max-w-7xl`.

**Step 2: Verify dashboard page**

In `app/dashboard/page.tsx`, ensure the AppLayout or main container uses `max-w-7xl`:

```typescript
<AppLayout maxWidth="7xl">
  {/* content */}
</AppLayout>
```

Or if using direct container:
```typescript
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* content */}
</div>
```

**Step 3: Verify analyses list page**

Same for `app/analyses/page.tsx` - should use `max-w-7xl`.

**Step 4: Verify states list page**

Same for `app/analysis/[id]/states/page.tsx` - should use `max-w-7xl`.

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 6: Manual test**

1. Visit each page
2. Verify content width looks consistent
3. Verify responsive behavior on narrow screens

**Step 7: Commit (if changes made)**

```bash
git add app/dashboard/page.tsx app/analyses/page.tsx app/analysis/[id]/states/page.tsx
git commit -m "refactor: standardize container width for list/dashboard pages

- Use max-w-7xl for all list and dashboard pages
- Consistent visual width across dashboard, analyses, states
- Follows established pattern for wide-content pages

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Standardize Form Page Widths

**Files:**
- Modify: `frontend/app/login/page.tsx`
- Modify: `frontend/app/signup/page.tsx`
- Modify: `frontend/app/analysis/new/page.tsx`

**Step 1: Update login page**

In `app/login/page.tsx`, find the main container and ensure it uses `max-w-md` (for centered forms):

```typescript
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
  <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
    {/* form content */}
  </div>
</div>
```

**Step 2: Update signup page**

Same pattern for `app/signup/page.tsx` - should use `max-w-md`.

**Step 3: Update new analysis page**

For `app/analysis/new/page.tsx`, this is a wider form, so use `max-w-4xl`:

```typescript
<AppLayout maxWidth="4xl">
  {/* form content */}
</AppLayout>
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 5: Manual test**

1. Visit login, signup, new analysis pages
2. Verify forms are properly centered and sized
3. Verify responsive behavior

**Step 6: Commit**

```bash
git add app/login/page.tsx app/signup/page.tsx app/analysis/new/page.tsx
git commit -m "refactor: standardize container width for form pages

- Login/Signup: max-w-md (centered, narrow forms)
- New Analysis: max-w-4xl (wider form with multiple sections)
- Consistent form sizing across authentication and data entry

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Standardize Workflow Page Widths

**Files:**
- Modify: `frontend/app/analysis/[id]/upload/page.tsx`
- Modify: `frontend/app/analysis/[id]/mapping/page.tsx`
- Modify: `frontend/app/analysis/[id]/results/page.tsx`

**Step 1: Update upload page**

In `app/analysis/[id]/upload/page.tsx`:

```typescript
<AppLayout maxWidth="5xl">
  {/* upload content */}
</AppLayout>
```

**Step 2: Update mapping page**

In `app/analysis/[id]/mapping/page.tsx`:

```typescript
<AppLayout maxWidth="4xl">
  {/* mapping content */}
</AppLayout>
```

**Step 3: Update results page**

In `app/analysis/[id]/results/page.tsx`:

```typescript
<AppLayout maxWidth="7xl">
  {/* results content - wide for map and tables */}
</AppLayout>
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 5: Manual test**

1. Go through full analysis workflow
2. Verify each step has appropriate width
3. Upload should be medium-wide for file preview
4. Mapping should be narrower for form focus
5. Results should be wide for data visualization

**Step 6: Commit**

```bash
git add app/analysis/[id]/upload/page.tsx app/analysis/[id]/mapping/page.tsx app/analysis/[id]/results/page.tsx
git commit -m "refactor: standardize container width for workflow pages

- Upload: max-w-5xl (file preview needs space)
- Mapping: max-w-4xl (form-focused)
- Results: max-w-7xl (wide for map and data tables)
- Consistent progression through analysis workflow

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Create Container Width Style Guide

**Files:**
- Create: `frontend/docs/STYLE_GUIDE.md`

**Step 1: Create docs directory**

```bash
mkdir -p "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend\docs"
```

**Step 2: Create style guide**

Create file `frontend/docs/STYLE_GUIDE.md`:

```markdown
# Frontend Style Guide

## Container Widths

Use consistent max-width values for different page types:

### Dashboard & List Pages: `max-w-7xl`

**Usage:** Pages displaying multiple items, tables, or dashboards

**Examples:**
- Dashboard (`/dashboard`)
- Analyses List (`/analyses`)
- States List (`/analysis/[id]/states`)
- Any page with data tables or grids

**Implementation:**
\`\`\`tsx
<AppLayout maxWidth="7xl">
  {/* content */}
</AppLayout>
\`\`\`

---

### Form Pages (Wide): `max-w-4xl`

**Usage:** Multi-section forms requiring more horizontal space

**Examples:**
- New Analysis (`/analysis/new`)
- Column Mapping (`/analysis/[id]/mapping`)

**Implementation:**
\`\`\`tsx
<AppLayout maxWidth="4xl">
  {/* form content */}
</AppLayout>
\`\`\`

---

### Form Pages (Narrow): `max-w-md`

**Usage:** Simple, focused forms (login, signup)

**Examples:**
- Login (`/login`)
- Signup (`/signup`)

**Implementation:**
\`\`\`tsx
<div className="max-w-md w-full mx-auto">
  {/* form content */}
</div>
\`\`\`

---

### Workflow Pages: `max-w-5xl`

**Usage:** Pages in multi-step workflows requiring medium width

**Examples:**
- File Upload (`/analysis/[id]/upload`)

**Implementation:**
\`\`\`tsx
<AppLayout maxWidth="5xl">
  {/* workflow content */}
</AppLayout>
\`\`\`

---

### Results/Visualization Pages: `max-w-7xl`

**Usage:** Pages with maps, charts, or wide data visualizations

**Examples:**
- Analysis Results (`/analysis/[id]/results`)

**Implementation:**
\`\`\`tsx
<AppLayout maxWidth="7xl">
  {/* visualization content */}
</AppLayout>
\`\`\`

---

## Quick Reference

| Page Type | Max Width | Tailwind Class |
|-----------|-----------|----------------|
| Dashboard/Lists | 1280px | `max-w-7xl` |
| Wide Forms | 896px | `max-w-4xl` |
| Narrow Forms | 448px | `max-w-md` |
| Workflow Steps | 1024px | `max-w-5xl` |
| Visualizations | 1280px | `max-w-7xl` |

---

## AppLayout Component

The `AppLayout` component accepts a `maxWidth` prop for convenience:

\`\`\`tsx
interface AppLayoutProps {
  children: React.ReactNode
  maxWidth?: '4xl' | '5xl' | '6xl' | '7xl'
  breadcrumbs?: Breadcrumb[]
}
\`\`\`

**Default:** `7xl`

**Usage:**
\`\`\`tsx
import AppLayout from '@/components/layout/AppLayout'

export default function MyPage() {
  return (
    <AppLayout maxWidth="4xl">
      <h1>My Page</h1>
    </AppLayout>
  )
}
\`\`\`

---

## Best Practices

1. **Always use AppLayout** for authenticated pages (provides nav, breadcrumbs)
2. **Match content type to width** - don't force wide content into narrow containers
3. **Be consistent** - similar pages should use the same width
4. **Test responsiveness** - all max-widths should work on mobile (with px-4 padding)
5. **Use semantic values** - choose based on content needs, not arbitrary preferences

---

## Exceptions

**When to deviate:**
- Landing pages or marketing content (may use full width or custom widths)
- Error pages (404, 500) may use custom layouts
- PDF/print views (may need different constraints)

**How to deviate:**
- Document the reason in code comments
- Ensure responsive behavior is maintained
- Get design approval for custom widths

---

Last Updated: 2025-11-08
```

**Step 3: Commit**

```bash
git add frontend/docs/STYLE_GUIDE.md
git commit -m "docs: create frontend style guide for container widths

- Document standard max-width values for each page type
- Provide examples and implementation patterns
- Include quick reference table
- Explain AppLayout maxWidth prop usage
- List exceptions and best practices

Helps maintain visual consistency across the application.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Update UI/UX Audit Document

**Files:**
- Modify: `docsplans/UI_UX_AUDIT_2025-11-08.md`

**Step 1: Read current audit document**

```bash
head -120 "D:\01 - Projects\SALT-Tax-Tool-Clean\docsplans\UI_UX_AUDIT_2025-11-08.md"
```

**Step 2: Add Segment 1 completion section**

After the "MEDIUM Priority Items - Completed" section, add:

```markdown
### ✅ LOW Priority Items - Segment 1 Completed (2025-11-08)

**Recently Implemented:**

1. **Reusable Confirmation Dialog** (Section 4.2)
   - Created ConfirmDialog component wrapping shadcn AlertDialog
   - Replaced browser confirm() in analyses list delete action
   - Supports destructive variant for delete operations
   - Better accessibility and UX than browser dialogs
   - Files: `components/shared/ConfirmDialog.tsx`

2. **Standardized Container Widths** (Section 3.1)
   - Audited all page widths for consistency
   - Dashboard/Lists: max-w-7xl (1280px)
   - Wide Forms: max-w-4xl (896px)
   - Narrow Forms: max-w-md (448px)
   - Workflow Pages: max-w-5xl (1024px)
   - Created comprehensive style guide in `frontend/docs/STYLE_GUIDE.md`

**Files Modified:**
- `app/analyses/page.tsx`: Added ConfirmDialog for delete
- `app/dashboard/page.tsx`: Standardized to max-w-7xl (if needed)
- `app/analyses/page.tsx`: Standardized to max-w-7xl (if needed)
- `app/login/page.tsx`: Standardized to max-w-md
- `app/signup/page.tsx`: Standardized to max-w-md
- `app/analysis/new/page.tsx`: Standardized to max-w-4xl
- `app/analysis/[id]/upload/page.tsx`: Standardized to max-w-5xl
- `app/analysis/[id]/mapping/page.tsx`: Standardized to max-w-4xl
- `app/analysis/[id]/results/page.tsx`: Standardized to max-w-7xl

**New Files Created:**
- `components/ui/alert-dialog.tsx`: shadcn AlertDialog component
- `components/shared/ConfirmDialog.tsx`: Reusable confirmation dialog
- `frontend/docs/STYLE_GUIDE.md`: Container width standards

**Impact:**
- **Professional confirmations**: No more browser confirm() dialogs
- **Visual consistency**: All pages follow standard width conventions
- **Better UX**: Accessible dialogs with proper keyboard navigation
- **Developer guidance**: Style guide documents standards for future pages
```

**Step 3: Update remaining items**

Update the "Remaining Items" section:

```markdown
### 🎯 Remaining Items

**LOW Priority - Segment 2:**
- Dashboard enhancements (stats, recent activity)
```

**Step 4: Commit**

```bash
git add docsplans/UI_UX_AUDIT_2025-11-08.md
git commit -m "docs: update UI/UX audit with Segment 1 completion

- Mark confirmation dialog as complete
- Mark container width standardization as complete
- List all modified and new files
- Update remaining items (only Segment 2 dashboard enhancements)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Final Verification & Testing

**Files:**
- None (testing task)

**Step 1: Run full TypeScript check**

```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend"
npx tsc --noEmit
```

**Expected:** No errors

**Step 2: Run production build**

```bash
npm run build
```

**Expected:** Build succeeds

**Step 3: Manual test - Confirmation Dialog**

1. Start dev server: `npm run dev`
2. Navigate to `/analyses`
3. Click delete on an analysis
4. **Verify:** Dialog appears (not browser confirm)
5. **Verify:** Dialog shows client name in description
6. **Verify:** "Cancel" closes dialog without deleting
7. **Verify:** "Delete" button has red styling (destructive variant)
8. **Verify:** "Delete" deletes analysis and shows success toast
9. **Verify:** Keyboard navigation works (Tab, Enter, Escape)

**Step 4: Manual test - Container Widths**

Visit each page and verify width:

- `/dashboard` - Wide, matches other dashboard pages
- `/analyses` - Wide, same as dashboard
- `/login` - Narrow, centered
- `/signup` - Narrow, centered
- `/analysis/new` - Medium-wide for form
- Create analysis and go through workflow:
  - Upload page - Medium-wide
  - Mapping page - Medium-wide
  - Results page - Wide for visualization
  - States page - Wide for table

**Step 5: Test responsive behavior**

1. Open DevTools
2. Toggle responsive mode
3. Test at: 375px (mobile), 768px (tablet), 1024px (desktop)
4. Verify all pages look good at all sizes
5. Verify horizontal scroll doesn't appear

**Step 6: Create test report**

```bash
cat > segment-1-test-report.txt << 'EOF'
# Segment 1 Test Report

Date: 2025-11-08

## Confirmation Dialog Tests
- [ ] Dialog appears instead of browser confirm
- [ ] Shows correct client name in description
- [ ] Cancel button works
- [ ] Delete button has red styling
- [ ] Delete button deletes analysis
- [ ] Success toast appears after delete
- [ ] Keyboard navigation works (Tab, Enter, Esc)

## Container Width Tests
- [ ] Dashboard: max-w-7xl
- [ ] Analyses list: max-w-7xl
- [ ] Login: max-w-md (centered)
- [ ] Signup: max-w-md (centered)
- [ ] New analysis: max-w-4xl
- [ ] Upload: max-w-5xl
- [ ] Mapping: max-w-4xl
- [ ] Results: max-w-7xl
- [ ] States: max-w-7xl

## Responsive Tests
- [ ] 375px (mobile): No horizontal scroll
- [ ] 768px (tablet): Proper padding and width
- [ ] 1024px+ (desktop): Containers centered properly

## Build Tests
- [ ] TypeScript compiles with no errors
- [ ] Production build succeeds
- [ ] No console errors in dev mode

## Issues Found:
(List any issues)

## Notes:
(Any observations)
EOF
```

**Step 7: No commit** (testing only, report is temporary)

---

## Summary

**What was built:**
1. ✅ Reusable ConfirmDialog component
2. ✅ Replaced browser confirm() in analyses list
3. ✅ Standardized container widths across all pages
4. ✅ Created style guide documentation
5. ✅ Updated UI/UX audit tracking

**Total commits:** 9

**Testing:** Manual testing checklist provided

**Ready for:** Segment 2 (Dashboard Enhancements)

---

## Notes for Engineer

**Key files to understand:**
- `components/shared/ConfirmDialog.tsx` - Reusable confirmation dialog
- `components/layout/AppLayout.tsx` - Layout wrapper with maxWidth support
- `frontend/docs/STYLE_GUIDE.md` - Width standards reference

**Testing tips:**
- Use React DevTools to inspect component state
- Check browser console for any errors
- Test keyboard navigation (Tab, Enter, Escape)
- Verify responsive behavior at different breakpoints

**Common issues:**
- If dialog doesn't appear, check state is being set correctly
- If widths look wrong, verify AppLayout maxWidth prop
- If build fails, check for missing imports

**Getting help:**
- See UI/UX audit: `docsplans/UI_UX_AUDIT_2025-11-08.md`
- See manual testing guide: `MANUAL_TESTING_GUIDE.md`
- See error handling docs: `frontend/lib/utils/README.md`
