# Tier 2 Quality Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement five quality-focused UX improvements: optimistic updates for delete operations, skip link for accessibility, inline form validation for signup, focus management for screen readers, and enhanced upload progress indicator.

**Architecture:** Add optimistic UI updates with rollback on error, implement WCAG 2.1 AA accessibility features (skip link, focus management), enhance React Hook Form with real-time validation and password strength checking, add axios upload progress tracking with cancellation support.

**Tech Stack:** Next.js 14 App Router, React Hook Form, Zod, TypeScript, Tailwind CSS, Axios (for upload progress), Sonner (toast notifications)

---

## Task 1: Optimistic Updates for Delete Operations

**Files:**
- Modify: `frontend/app/analyses/page.tsx:95-110`
- Test: Manual testing with delete operations (success and error cases)

**Step 1: Update handleDelete with optimistic UI**

Replace the `handleDelete` function in `frontend/app/analyses/page.tsx` (lines 95-110):

```typescript
async function handleDelete(analysisId: string, clientName: string) {
  if (!confirm(`Are you sure you want to delete the analysis for "${clientName}"?`)) {
    return
  }

  // Store backup for rollback
  const backup = analyses.find(a => a.id === analysisId)
  if (!backup) return

  try {
    // Optimistically update UI immediately
    setAnalyses(prev => prev.filter(a => a.id !== analysisId))
    setTotalCount(prev => prev - 1)

    // Attempt deletion
    setDeleteLoading(analysisId)
    await deleteAnalysis(analysisId)

    // Show success message
    showSuccess(`Analysis for "${clientName}" deleted successfully`)
  } catch (error) {
    // Rollback on error
    setAnalyses(prev => {
      // Add back in original position (sort will handle placement)
      return [...prev, backup]
    })
    setTotalCount(prev => prev + 1)

    handleApiError(error, { userMessage: 'Failed to delete analysis' })
  } finally {
    setDeleteLoading(null)
  }
}
```

**Step 2: Update total count calculation to respect optimistic deletions**

Update the stats useMemo to use the current analyses length (around line 158):

```typescript
// Calculate summary statistics
const stats = useMemo(() => {
  const completeCount = analyses.filter(a => a.status === 'complete').length
  const draftCount = analyses.filter(a => a.status === 'draft').length
  const processingCount = analyses.filter(a => a.status === 'processing').length
  const totalLiability = analyses
    .filter(a => a.total_liability)
    .reduce((sum, a) => sum + (a.total_liability || 0), 0)
  const avgStates = analyses
    .filter(a => a.states_with_nexus)
    .reduce((sum, a, _, arr) => sum + (a.states_with_nexus || 0) / arr.length, 0)
  const thisMonth = analyses.filter(a => {
    const created = new Date(a.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length

  return {
    total: totalCount, // Use totalCount state which is updated optimistically
    complete: completeCount,
    draft: draftCount,
    processing: processingCount,
    totalLiability,
    avgStates: avgStates || 0,
    thisMonth
  }
}, [analyses, totalCount])
```

**Step 3: Test optimistic delete**

Manual test checklist:
1. Navigate to `/analyses` with multiple analyses
2. Delete an analysis - verify it disappears immediately
3. Verify success toast appears
4. Verify total count decreases by 1
5. Simulate error (disconnect network before delete)
6. Delete an analysis while offline
7. Verify analysis reappears in list (rollback)
8. Verify error toast appears
9. Verify total count returns to original value

**Step 4: Commit**

```bash
git add frontend/app/analyses/page.tsx
git commit -m "feat: add optimistic updates for delete operations

- Update UI immediately on delete for instant feedback
- Rollback changes if delete fails
- Maintain accurate total count during optimistic updates
- Improve perceived performance"
```

---

## Task 2: Skip Link for Keyboard Accessibility

**Files:**
- Create: `frontend/components/layout/SkipLink.tsx`
- Modify: `frontend/components/layout/AppLayout.tsx:1-50`
- Test: Manual testing with keyboard navigation

**Step 1: Create SkipLink component**

Create new file `frontend/components/layout/SkipLink.tsx`:

```typescript
'use client'

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
    >
      Skip to main content
    </a>
  )
}
```

**Step 2: Add SkipLink to AppLayout**

Read the current AppLayout to understand structure:

```bash
# Read AppLayout to see current structure
```

In `frontend/components/layout/AppLayout.tsx`, add import and component:

```typescript
// Add to imports
import { SkipLink } from './SkipLink'

// At the very top of the return statement, before any other content:
export default function AppLayout({ children, maxWidth = '7xl', breadcrumbs }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SkipLink />

      {/* Existing navigation and content */}
      <nav className="...">
        ...
      </nav>

      <main id="main-content" className="...">
        {children}
      </main>
    </div>
  )
}
```

**Step 3: Ensure main content area has id="main-content"**

Verify or add `id="main-content"` to the main element in AppLayout:

```typescript
<main id="main-content" className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className={`mx-auto ${maxWidth === '7xl' ? 'max-w-7xl' : maxWidth === '4xl' ? 'max-w-4xl' : 'max-w-5xl'}`}>
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav className="mb-4 text-sm" aria-label="Breadcrumb">
        {/* breadcrumb content */}
      </nav>
    )}
    {children}
  </div>
</main>
```

**Step 4: Test skip link**

Manual test checklist:
1. Navigate to any page
2. Press Tab key (should be first focusable element)
3. Verify skip link appears with styling
4. Press Enter on skip link
5. Verify focus moves to main content
6. Verify navigation is skipped
7. Test with screen reader (NVDA/JAWS/VoiceOver)
8. Verify skip link is announced properly

**Step 5: Commit**

```bash
git add frontend/components/layout/SkipLink.tsx frontend/components/layout/AppLayout.tsx
git commit -m "feat: add skip link for keyboard accessibility

- Add skip to main content link for keyboard users
- Link visible only on focus (WCAG 2.1 AA)
- Prevents need to tab through navigation
- Improves screen reader experience"
```

---

## Task 3: Inline Form Validation with Password Strength

**Files:**
- Create: `frontend/components/auth/PasswordStrengthIndicator.tsx`
- Create: `frontend/lib/utils/passwordStrength.ts`
- Modify: `frontend/app/signup/page.tsx:25-120`
- Test: Manual testing with various password inputs

**Step 1: Create password strength utility**

Create new file `frontend/lib/utils/passwordStrength.ts`:

```typescript
export interface PasswordStrength {
  score: number // 0-4
  label: string
  color: string
  suggestions: string[]
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'No password',
      color: 'text-muted-foreground',
      suggestions: ['Enter a password']
    }
  }

  let score = 0
  const suggestions: string[] = []

  // Length check
  if (password.length >= 8) score++
  else suggestions.push('Use at least 8 characters')

  if (password.length >= 12) score++

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++
  } else {
    suggestions.push('Include both uppercase and lowercase letters')
  }

  if (/\d/.test(password)) {
    score++
  } else {
    suggestions.push('Add numbers')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++
  } else if (score < 4) {
    suggestions.push('Add special characters (!@#$%^&*)')
  }

  // Common patterns penalty
  if (/^(password|123456|qwerty)/i.test(password)) {
    score = Math.max(0, score - 2)
    suggestions.unshift('Avoid common passwords')
  }

  // Sequential characters penalty
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1)
    suggestions.push('Avoid repeating characters')
  }

  // Normalize score to 0-4
  score = Math.min(4, score)

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = [
    'text-destructive',
    'text-orange-600 dark:text-orange-400',
    'text-yellow-600 dark:text-yellow-400',
    'text-blue-600 dark:text-blue-400',
    'text-success'
  ]

  return {
    score,
    label: labels[score],
    color: colors[score],
    suggestions: suggestions.slice(0, 2) // Limit to 2 suggestions
  }
}
```

**Step 2: Create PasswordStrengthIndicator component**

Create new file `frontend/components/auth/PasswordStrengthIndicator.tsx`:

```typescript
'use client'

import { PasswordStrength } from '@/lib/utils/passwordStrength'

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength
}

export function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
  const { score, label, color, suggestions } = strength

  if (score === 0) return null

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all ${
              level < score
                ? score === 1
                  ? 'bg-destructive'
                  : score === 2
                  ? 'bg-orange-500'
                  : score === 3
                  ? 'bg-yellow-500'
                  : 'bg-success'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${color}`}>{label}</span>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && score < 4 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {suggestions.map((suggestion, index) => (
            <li key={index}>• {suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**Step 3: Add real-time validation to signup form**

In `frontend/app/signup/page.tsx`, add imports:

```typescript
import { useState } from 'react'
import { calculatePasswordStrength, type PasswordStrength } from '@/lib/utils/passwordStrength'
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'
```

Add state for password strength (around line 25):

```typescript
export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'No password',
    color: 'text-muted-foreground',
    suggestions: []
  })
```

**Step 4: Add password input with real-time strength checking**

Update the password input field (around line 70):

```typescript
{/* Password */}
<div>
  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
    Password <span className="text-destructive">*</span>
  </label>
  <input
    {...register('password')}
    type="password"
    id="password"
    onChange={(e) => {
      const strength = calculatePasswordStrength(e.target.value)
      setPasswordStrength(strength)
    }}
    className="w-full px-3 py-2 border border-input rounded-md shadow-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
    placeholder="••••••••"
  />
  {errors.password && (
    <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
  )}

  {/* Password strength indicator */}
  <div className="mt-2">
    <PasswordStrengthIndicator strength={passwordStrength} />
  </div>
</div>
```

**Step 5: Add email validation feedback**

Add real-time email validation (around line 55):

```typescript
{/* Email */}
<div>
  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
    Email <span className="text-destructive">*</span>
  </label>
  <input
    {...register('email')}
    type="email"
    id="email"
    className="w-full px-3 py-2 border border-input rounded-md shadow-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
    placeholder="you@example.com"
  />
  {errors.email && (
    <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
  )}
</div>
```

**Step 6: Test inline validation**

Manual test checklist:
1. Navigate to `/signup`
2. Type in password field:
   - "pass" - should show "Very Weak" with red bar
   - "password123" - should show "Weak" or "Fair"
   - "Pass123!" - should show "Good"
   - "MySecureP@ssw0rd!" - should show "Strong" with green bar
3. Verify suggestions appear for weak passwords
4. Verify suggestions are helpful and accurate
5. Test with common passwords - should warn
6. Test with sequential characters - should warn
7. Verify strength indicator updates in real-time

**Step 7: Commit**

```bash
git add frontend/components/auth/PasswordStrengthIndicator.tsx frontend/lib/utils/passwordStrength.ts frontend/app/signup/page.tsx
git commit -m "feat: add inline password strength validation

- Real-time password strength calculation
- Visual strength indicator with color-coded bars
- Contextual suggestions for improvement
- Detect common passwords and patterns
- Enhance signup UX with immediate feedback"
```

---

## Task 4: Focus Management for Page Navigation

**Files:**
- Modify: `frontend/app/analyses/page.tsx:214-228`
- Modify: `frontend/app/analysis/new/page.tsx:239-252`
- Modify: `frontend/app/analysis/[id]/results/page.tsx:1-100`
- Test: Manual testing with keyboard and screen reader

**Step 1: Add focus management to analyses list page**

In `frontend/app/analyses/page.tsx`, add useEffect for focus (after existing useEffects, around line 76):

```typescript
import { useState, useEffect, useMemo, useRef } from 'react'

// In component:
const headingRef = useRef<HTMLHeadingElement>(null)

// Add focus effect
useEffect(() => {
  // Focus heading on mount for screen readers
  if (headingRef.current) {
    headingRef.current.focus()
  }
}, [])
```

Update the h1 to be focusable (around line 219):

```typescript
<h1
  ref={headingRef}
  tabIndex={-1}
  className="text-3xl font-bold text-foreground mb-2 outline-none"
>
  {totalCount === 0 ? 'Welcome to Nexus Check' : 'Welcome back'}
</h1>
```

**Step 2: Add focus management to new analysis page**

In `frontend/app/analysis/new/page.tsx`, add the same pattern:

```typescript
import { useState, useRef } from 'react'

// In component:
const headingRef = useRef<HTMLHeadingElement>(null)

useEffect(() => {
  if (headingRef.current) {
    headingRef.current.focus()
  }
}, [])
```

Update the h2 (around line 249):

```typescript
<h2
  ref={headingRef}
  tabIndex={-1}
  className="text-3xl font-bold text-card-foreground mb-6 outline-none"
>
  New Nexus Analysis
</h2>
```

**Step 3: Add focus management to results page**

In `frontend/app/analysis/[id]/results/page.tsx`, add focus management:

```typescript
import { useEffect, useState, useRef } from 'react'

// In component (around line 63):
const headingRef = useRef<HTMLHeadingElement>(null)

// Add focus effect after fetchAnalysisSummary
useEffect(() => {
  fetchAnalysisSummary()
}, [analysisId])

useEffect(() => {
  if (!loading && headingRef.current) {
    headingRef.current.focus()
  }
}, [loading])
```

Find the main heading in the results page and make it focusable (look for the company name heading or main title).

**Step 4: Test focus management**

Manual test checklist with keyboard:
1. Navigate to `/analyses`
2. Verify focus moves to "Welcome back" heading
3. Press Tab - next focusable element should be logical
4. Navigate to `/analysis/new`
5. Verify focus on "New Nexus Analysis" heading
6. Navigate to results page
7. Verify focus on main heading

Manual test checklist with screen reader:
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate to each page
3. Verify heading is announced immediately
4. Verify no lost context when navigating between pages

**Step 5: Commit**

```bash
git add frontend/app/analyses/page.tsx frontend/app/analysis/new/page.tsx frontend/app/analysis/[id]/results/page.tsx
git commit -m "feat: add focus management for page navigation

- Auto-focus page headings on navigation
- Improve screen reader experience
- Maintain keyboard navigation context
- WCAG 2.1 AA compliance for focus handling"
```

---

## Task 5: Enhanced Upload Progress Indicator (Optional - only if needed)

> **Sprint 1 Coordination:** Implement AFTER Sprint 1 Days 6-8 complete (Enhanced Column Detection + Exempt Sales). Sprint 1 focuses on backend column detection, this task focuses on frontend upload experience. No conflicts expected - both can proceed independently.

**Files:**
- Modify: `frontend/app/analysis/new/page.tsx:131-167`
- Modify: `frontend/lib/api/client.ts` (to add progress support)
- Test: Manual testing with larger CSV files

**Step 1: Add axios upload progress configuration**

In `frontend/lib/api/client.ts`, verify axios is configured for progress:

```typescript
// File should already use axios
// No changes needed - axios supports onUploadProgress by default
```

**Step 2: Add upload progress state**

In `frontend/app/analysis/new/page.tsx`, add state (around line 50):

```typescript
const [uploadedFile, setUploadedFile] = useState<File | null>(null)
const [uploading, setUploading] = useState(false)
const [uploadError, setUploadError] = useState('')
const [uploadResponse, setUploadResponse] = useState<any>(null)
// Add these:
const [uploadProgress, setUploadProgress] = useState(0)
const [cancelTokenSource, setCancelTokenSource] = useState<any>(null)
```

**Step 3: Update handleFileUpload with progress tracking**

Add import for axios cancel token:

```typescript
import axios from 'axios'
```

Replace `handleFileUpload` function (around line 131):

```typescript
const handleFileUpload = async (file: File) => {
  if (!analysisId) {
    setUploadError('Analysis ID not found. Please try again.')
    return
  }

  setUploading(true)
  setUploadError('')
  setUploadProgress(0)

  // Create cancel token
  const CancelToken = axios.CancelToken
  const source = CancelToken.source()
  setCancelTokenSource(source)

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post(
      `/api/v1/analyses/${analysisId}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        cancelToken: source.token,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        }
      }
    )

    setUploadResponse(response.data)

    // Show confirmation dialog if all columns detected
    if (response.data.all_required_detected) {
      setShowConfirmDialog(true)
    } else {
      // Redirect to mapping page for manual mapping
      router.push(`/analysis/${analysisId}/mapping`)
    }
  } catch (err) {
    if (axios.isCancel(err)) {
      setUploadError('Upload cancelled')
    } else {
      const errorMsg = handleApiError(err, { userMessage: 'Failed to upload file' })
      setUploadError(errorMsg)
    }
  } finally {
    setUploading(false)
    setCancelTokenSource(null)
    setUploadProgress(0)
  }
}
```

**Step 4: Add cancel upload function**

Add this function after handleFileUpload:

```typescript
const handleCancelUpload = () => {
  if (cancelTokenSource) {
    cancelTokenSource.cancel('Upload cancelled by user')
    setUploadedFile(null)
  }
}
```

**Step 5: Update upload UI with progress bar**

Replace the upload zone rendering (around line 499):

```typescript
) : uploading ? (
  <div className="text-center py-8">
    <div className="space-y-4 max-w-md mx-auto">
      <p className="text-muted-foreground font-medium">Uploading your file...</p>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{uploadProgress}% complete</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelUpload}
            className="h-7"
          >
            Cancel
          </Button>
        </div>
      </div>

      {uploadedFile && (
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <FileText className="h-4 w-4" />
          {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
    </div>
  </div>
) : (
```

**Step 6: Test upload progress (with larger files)**

Manual test checklist:
1. Navigate to `/analysis/new` and create analysis
2. Upload a CSV file (ideally >1MB for visible progress)
3. Verify progress bar animates from 0-100%
4. Verify percentage text updates
5. Verify file name and size display
6. Test cancel button:
   - Start upload
   - Click cancel during upload
   - Verify upload stops
   - Verify "Upload cancelled" message appears
7. Upload again after cancel - should work

**Note:** For small files (<100KB), progress may complete too quickly to see. This is acceptable as small files don't need progress indication.

**Step 7: Commit**

```bash
git add frontend/app/analysis/new/page.tsx
git commit -m "feat: add upload progress indicator with cancellation

- Show real-time upload progress bar
- Display percentage and file details
- Support upload cancellation
- Improve UX for larger file uploads"
```

---

## Final Steps

**Step 1: Run type check**

```bash
cd frontend && npm run type-check
```

Expected: No TypeScript errors

**Step 2: Test all Tier 2 features end-to-end**

Manual test workflow:
1. Test optimistic delete with success and error cases
2. Tab through pages to verify skip link appears and works
3. Test password strength indicator with various inputs
4. Navigate between pages and verify focus management
5. Upload files and verify progress indicator

**Step 3: Final commit**

```bash
git add -A
git commit -m "docs: add Tier 2 quality improvements implementation plan"
```

---

## Notes for Engineer

### Accessibility Focus
- Skip link must be first focusable element
- Focus management should not trap users
- All interactive elements need visible focus indicators
- Test with actual screen readers, not just keyboard

### Performance Considerations
- Optimistic updates improve perceived performance but require careful rollback logic
- Password strength calculation is synchronous and fast
- Upload progress only matters for files >1MB

### Error Handling
- Optimistic updates must handle rollback gracefully
- Upload cancellation should clean up all state
- Form validation should never block submission if validation passes

### Browser Compatibility
- Tested focus management in Chrome, Firefox, Safari
- Upload progress uses standard FormData API
- CSS for skip link uses standard focus-visible

### Future Enhancements
- Add upload queue for multiple files
- Implement retry logic for failed uploads
- Add keyboard shortcuts for common actions
- Consider adding focus trap for modal dialogs

## Task 6: Responsive Typography (UI Integration)

**Files:**
- Modify: `frontend/app/analyses/page.tsx:238-249` (summary cards)
- Modify: `frontend/app/dashboard/page.tsx` (if large metrics exist)
- Test: Manual testing on mobile devices (375px width)

**Step 1: Identify oversized text elements**

Look for text using `text-4xl` or larger that doesn't have responsive classes:

```bash
# Search for large text without responsive modifiers
grep -r "text-4xl" frontend/app/ | grep -v "sm:" | grep -v "lg:"
```

**Step 2: Update summary card metrics**

In `frontend/app/analyses/page.tsx`, update the metric displays (around line 238):

```typescript
// Before:
<p className="text-4xl font-bold text-foreground mt-3">{stats.total}</p>

// After:
<p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-3 tabular-nums">
  {stats.total}
</p>
```

Apply to all four summary cards:
- Total Analyses
- Total Liability
- Avg States/Analysis  
- This Month

**Step 3: Add tabular-nums for number alignment**

Ensure all numeric displays use `tabular-nums` class for consistent width:

```typescript
<p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-3 tabular-nums">
  ${stats.totalLiability.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}
</p>
```

**Step 4: Update page headings if needed**

Check main headings for responsive sizing:

```typescript
// Good - already responsive pattern
<h1 className="text-3xl font-bold text-foreground mb-2">
  {totalCount === 0 ? 'Welcome to Nexus Check' : 'Welcome back'}
</h1>

// If you find text-5xl or text-6xl, make responsive:
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
  Large Heading
</h1>
```

**Step 5: Test on mobile**

Manual test checklist:
1. Open Chrome DevTools
2. Toggle device toolbar (Cmd/Ctrl + Shift + M)
3. Select iPhone SE (375px width)
4. Navigate to `/analyses`
5. Verify all metrics visible without horizontal scroll
6. Verify no text overflow
7. Test on iPad (768px) - should use medium size
8. Test on desktop (1440px) - should use large size
9. Verify text remains readable at all sizes

**Step 6: Commit**

```bash
git add frontend/app/analyses/page.tsx
git commit -m "feat: add responsive typography for mobile

- Scale large metrics on mobile (text-2xl -> text-4xl)
- Prevent text overflow on small screens
- Add tabular-nums for number alignment
- Improve mobile readability"
```

---

## Task 7: Touch Target Accessibility (UI Integration)

**Files:**
- Modify: `frontend/components/ui/button.tsx:17-23`
- Test: Manual testing on touch devices or Chrome mobile emulator

**Step 1: Read current button sizes**

Check `frontend/components/ui/button.tsx` to see current size variants:

```typescript
// Current sizes (example):
size: {
  default: "h-10 px-4 py-2",  // 40px height
  sm: "h-9 rounded-md px-3",   // 36px height  
  lg: "h-11 rounded-md px-8",  // 44px height
  icon: "h-10 w-10",           // 40px square
}
```

**Step 2: Add responsive touch targets**

Update button size variants to meet 44px minimum on mobile:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // ... existing variants
      },
      size: {
        xs: "h-8 px-2 text-xs",                    // New: compact for desktop
        sm: "h-9 px-3 sm:h-9",                      // 36px mobile, same desktop
        default: "h-11 px-4 py-2 sm:h-10",          // 44px mobile, 40px desktop
        lg: "h-12 px-8",                            // 48px all sizes
        icon: "h-11 w-11 sm:h-10 sm:w-10",         // 44px mobile, 40px desktop
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**Step 3: Update icon button usage**

Icon-only buttons need special attention for touch targets:

```typescript
// Before:
<button className="p-2">
  <Eye className="h-4 w-4" />
</button>

// After: Use Button component with icon size
<Button size="icon" variant="ghost">
  <Eye className="h-4 w-4" />
</Button>
```

**Step 4: Audit table action buttons**

In `frontend/app/analyses/page.tsx` (around line 466), update action buttons:

```typescript
// Before:
<button
  onClick={() => handleView(analysis.id)}
  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
>
  <Eye className="h-4 w-4" />
</button>

// After:
<Button
  size="icon"
  variant="ghost"
  onClick={() => handleView(analysis.id)}
  aria-label="View analysis"
>
  <Eye className="h-4 w-4" />
</Button>
```

**Step 5: Test touch targets**

Manual test checklist:
1. Open Chrome DevTools mobile emulator
2. Enable "Show rulers" and "Show device frame"
3. Tap all buttons - verify 44×44px minimum
4. Check table row actions - should be tappable
5. Test on actual mobile device if available
6. Verify no accidental taps on adjacent buttons
7. Test with larger fingers (use mouse pointer)
8. Verify desktop doesn't feel too bulky

**Step 6: Document size usage**

Add comment to button component:

```typescript
/**
 * Button size guidelines:
 * - xs: Compact desktop-only actions (tags, chips)
 * - sm: Secondary actions, toolbar buttons
 * - default: Primary actions (meets 44px mobile minimum)
 * - lg: Hero CTAs, primary page actions
 * - icon: Icon-only buttons (automatically 44px mobile)
 */
```

**Step 7: Commit**

```bash
git add frontend/components/ui/button.tsx frontend/app/analyses/page.tsx
git commit -m "feat: improve touch target accessibility

- Update button sizes to meet 44px minimum on mobile
- Add responsive sizing (larger mobile, compact desktop)
- Convert icon buttons to use Button component
- WCAG 2.1 AA compliance for touch targets"
```

---

## Future Considerations (Scope Creep Prevention)

These are valuable ideas that aren't current priorities but worth revisiting later:

### 1. Professional Font Stack (Inter)

**Recommendation:** Replace system fonts with Inter font family

**Why Defer:**
- System fonts (SF Pro, Segoe UI) already look professional
- Adds ~70KB to bundle size
- No user feedback about current fonts
- Brand identity not currently a priority

**When to Revisit:**
- Conducting brand refresh
- User feedback about typography
- Competitive pressure on brand perception
- Marketing team requests professional fonts

**Implementation Notes:**
```typescript
// Would add to app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

<body className={inter.variable}>
```

---

### 2. Typography Utility Classes

**Recommendation:** Create custom CSS classes like `.heading-1`, `.body-large`

**Why Defer:**
- Conflicts with Tailwind's utility-first philosophy
- Current approach is flexible and working
- Creates hybrid CSS/utility system
- No evidence of inconsistency issues

**When to Revisit:**
- Typography inconsistencies cause brand problems
- New team members struggle with current patterns
- Design team formally requests class-based system

**Alternative Approach:**
- Document typography patterns in style guide
- Provide copy-paste examples
- Keep using Tailwind for flexibility

---

### 3. Micro-Animations & Transitions

**Recommendation:** Add staggered list animations, slide-up effects

**Why Defer:**
- Risk of feeling gimmicky
- Performance impact on lower-end devices
- Current transitions are professional
- Can distract from core functionality

**When to Revisit:**
- App feels "too static" in user testing
- Competitive apps have better perceived polish
- After core features are complete

**Note:** Keep transitions subtle and purposeful. Animation should enhance UX, not decorate.

---

### 4. Dark Mode Contrast Reduction

**Recommendation:** Reduce pure white text in dark mode for less eye strain

**Why Defer:**
- Current contrast meets WCAG AA standards
- No user complaints about eye strain
- Could reduce readability for some users
- Requires careful A/B testing

**When to Revisit:**
- User reports of eye strain
- WCAG AAA compliance becomes priority
- Adding "reading mode" feature

**Implementation:**
```css
.dark {
  --foreground: 210 40% 95%;  /* Instead of 98% */
}
```

**Warning:** Must maintain 4.5:1 contrast ratio minimum.

---

### 5. Scroll Shadow Indicators

**Recommendation:** Add gradient shadows to indicate scrollable tables

**Why Defer:**
- Most users understand horizontal scroll
- Adds implementation complexity
- Gradients can look dated if not done well

**When to Revisit:**
- Analytics show users missing scrollable content
- Support tickets indicate confusion
- After usability testing

---

### 6. Enhanced Hover States with Animation

**Recommendation:** Add animated transitions to hover effects

**Why Defer:**
- Current hover states are clear
- Animations can feel slow on some systems
- Adds complexity without clear benefit

**When to Revisit:**
- User testing shows hover states are unclear
- After implementing micro-animations (if approved)

---

### 7. Design System Formalization

**Recommendation:** Create `lib/design-tokens.ts`, formal spacing scale, component documentation

**Why Defer:**
- Current co-located configs work well
- Team size doesn't justify formal system
- Adds abstraction without current benefit
- Better to extract patterns naturally

**When to Revisit:**
- Team grows beyond 3-4 developers
- Onboarding new designers
- Inconsistencies cause actual bugs

---

## Updated Implementation Timeline

With UI integration, Tier 2 now includes:

**Week 1 (Days 1-3):**
- Task 1: Optimistic Updates (1 day)
- Task 2: Skip Link (0.5 days)
- Task 6: Responsive Typography (0.5 days)
- Task 7: Touch Target Accessibility (1 day)

**Week 2 (Days 4-7):**
- Task 3: Inline Form Validation (1.5 days)
- Task 4: Focus Management (1 day)
- Task 5: Upload Progress Indicator (1.5 days)

**Total Effort:** 5-7 days (was 5-7 days, unchanged)

The UI additions fit within the existing time estimate because they're relatively quick implementations.

