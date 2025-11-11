# Toast Notifications, Error Handling & Button Standardization - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace browser alerts with professional toast notifications, create centralized error handling, and standardize all buttons to use shadcn/ui components.

**Architecture:** Install shadcn/ui toast components, create a centralized error handler utility that integrates with toasts, replace all browser alerts and custom buttons across the application.

**Tech Stack:** React, Next.js 14, TypeScript, shadcn/ui, @radix-ui/react-toast, Tailwind CSS

**Related Design Doc:** `docsplans/2025-11-08-toast-error-handling-buttons-design.md`

---

## Prerequisites

**Verify dependencies installed:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm list @radix-ui/react-toast
```
Expected: `@radix-ui/react-toast@1.1.5` (already installed)

**Verify project structure:**
- Frontend: `D:\01 - Projects\SALT-Tax-Tool-Clean\frontend`
- Components: `frontend/components/ui/`
- App directory: `frontend/app/`

---

## Task 1: Install shadcn/ui Toast Components

**Files:**
- Create: `frontend/components/ui/toast.tsx`
- Create: `frontend/components/ui/toaster.tsx`
- Create: `frontend/hooks/use-toast.ts`

### Step 1: Install toast component via shadcn CLI

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npx shadcn-ui@latest add toast
```

**Expected Output:**
- Prompt: "Would you like to proceed?" → Answer: Yes
- Creates `components/ui/toast.tsx`
- Creates `components/ui/toaster.tsx`
- Creates `hooks/use-toast.ts`
- Success message

**If CLI fails:** Manually create files (see Step 2)

### Step 2: Verify files were created

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
dir components\ui\toast.tsx
dir components\ui\toaster.tsx
dir hooks\use-toast.ts
```

**Expected:** All three files exist

**If files don't exist:** Create them manually:

**File: `frontend/components/ui/toast.tsx`**
```tsx
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

**File: `frontend/components/ui/toaster.tsx`**
```tsx
"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

**File: `frontend/hooks/use-toast.ts`**
```ts
"use client"

import * as React from "react"

import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

### Step 3: Commit toast component installation

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/components/ui/toast.tsx frontend/components/ui/toaster.tsx frontend/hooks/use-toast.ts
git commit -m "feat: install shadcn toast components

- Add Toast UI components (toast.tsx, toaster.tsx)
- Add useToast hook for toast state management
- Supports multiple toasts, auto-dismiss, variants

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 2: Add Toaster to Root Layout

**Files:**
- Modify: `frontend/app/layout.tsx`

### Step 1: Read current layout file

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
type app\layout.tsx
```

**Expected:** See current RootLayout component

### Step 2: Add Toaster import and component

**File: `frontend/app/layout.tsx`**

Add import at top:
```tsx
import { Toaster } from '@/components/ui/toaster'
```

Add `<Toaster />` before closing `</body>` tag:
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### Step 3: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 4: Test toast in browser (manual)

**Start dev server:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run dev
```

**Temporary test code** (add to any page, like `app/dashboard/page.tsx`):
```tsx
import { useToast } from '@/hooks/use-toast'

// Inside component:
const { toast } = useToast()

// Add a test button:
<button onClick={() => toast({ title: "Test Toast", description: "This is a test" })}>
  Test Toast
</button>
```

**Expected:** Click button → Toast appears top-right, auto-dismisses after 5 seconds

**Remove test code** after verification

### Step 5: Commit Toaster integration

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/layout.tsx
git commit -m "feat: add Toaster to root layout

- Import and render Toaster in RootLayout
- Toasts now available app-wide
- Positioned top-right with auto-dismiss

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 3: Create Centralized Error Handler

**Files:**
- Create: `frontend/lib/utils/errorHandler.ts`

### Step 1: Create errorHandler.ts file

**File: `frontend/lib/utils/errorHandler.ts`**
```typescript
import { toast } from '@/hooks/use-toast'

/**
 * Centralized error handler for API errors
 *
 * @param error - The error object from try-catch
 * @param options - Configuration options
 * @returns The error message string
 *
 * @example
 * try {
 *   await apiCall()
 * } catch (error) {
 *   handleApiError(error, { userMessage: 'Failed to load data' })
 * }
 */
export function handleApiError(
  error: any,
  options?: {
    userMessage?: string
    logToConsole?: boolean
    showToast?: boolean
  }
): string {
  const defaultOptions = {
    logToConsole: true,
    showToast: true,
    userMessage: 'An unexpected error occurred',
  }

  const opts = { ...defaultOptions, ...options }

  // Extract error message from various sources
  const errorMessage =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    opts.userMessage

  // Log to console in development
  if (opts.logToConsole && process.env.NODE_ENV !== 'production') {
    console.error('Error:', error)
  }

  // Show toast notification
  if (opts.showToast) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: errorMessage,
    })
  }

  return errorMessage
}

/**
 * Show a success toast notification
 *
 * @param message - Success message to display
 *
 * @example
 * showSuccess('Analysis deleted successfully')
 */
export function showSuccess(message: string): void {
  toast({
    title: 'Success',
    description: message,
  })
}

/**
 * Show an info toast notification
 *
 * @param title - Toast title
 * @param message - Info message to display
 *
 * @example
 * showInfo('Processing', 'Your analysis is being processed')
 */
export function showInfo(title: string, message: string): void {
  toast({
    title,
    description: message,
  })
}
```

### Step 2: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 3: Commit error handler

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/lib/utils/errorHandler.ts
git commit -m "feat: create centralized error handler utility

- Add handleApiError for consistent error handling
- Add showSuccess and showInfo helpers
- Extracts errors from multiple sources (FastAPI, Axios, Error)
- Auto-logs in development, silent in production
- Integrates with toast system

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 4: Replace Alerts in Analyses List Page

**Files:**
- Modify: `frontend/app/analyses/page.tsx`

### Step 1: Read current analyses page

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
type app\analyses\page.tsx | findstr /N "alert confirm console.error"
```

**Expected:** See line numbers with alert/console.error calls

### Step 2: Add error handler imports

**File: `frontend/app/analyses/page.tsx`**

Add import at top:
```tsx
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
```

### Step 3: Replace console.error in loadAnalyses (around line 74)

**Before:**
```tsx
} catch (error) {
  console.error('Failed to load analyses:', error)
}
```

**After:**
```tsx
} catch (error) {
  handleApiError(error, { userMessage: 'Failed to load analyses' })
}
```

### Step 4: Replace alert in handleDelete and add success toast (around line 90)

**Before:**
```tsx
try {
  setDeleteLoading(analysisId)
  await deleteAnalysis(analysisId)
  await loadAnalyses()
} catch (error) {
  alert('Failed to delete analysis. Please try again.')
} finally {
  setDeleteLoading(null)
}
```

**After:**
```tsx
try {
  setDeleteLoading(analysisId)
  await deleteAnalysis(analysisId)
  showSuccess(`Analysis for "${clientName}" deleted successfully`)
  await loadAnalyses()
} catch (error) {
  handleApiError(error, { userMessage: 'Failed to delete analysis' })
} finally {
  setDeleteLoading(null)
}
```

### Step 5: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 6: Test in browser (manual)

**Start dev server:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run dev
```

**Test scenarios:**
1. Navigate to analyses list
2. Trigger error by disconnecting network → See error toast
3. Delete an analysis → See success toast
4. Verify no browser alerts appear

**Expected:** Toasts appear instead of alerts

### Step 7: Commit analyses page updates

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/analyses/page.tsx
git commit -m "feat: replace alerts with toasts in analyses page

- Replace console.error with handleApiError
- Replace alert() with toast notifications
- Add success toast after delete
- Improved user feedback experience

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 5: Replace Alerts in Mapping Page

**Files:**
- Modify: `frontend/app/analysis/[id]/mapping/page.tsx`

### Step 1: Read current mapping page

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
type app\analysis\[id]\mapping\page.tsx | findstr /N "alert console.error"
```

**Expected:** See line numbers with alert/console.error calls (around line 96)

### Step 2: Add error handler imports

**File: `frontend/app/analysis/[id]/mapping/page.tsx`**

Add import at top:
```tsx
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
```

### Step 3: Replace alert in error handler (around line 96)

**Before:**
```tsx
} catch (error: any) {
  console.error('Failed to fetch column info:', error)
  alert(error.response?.data?.detail || 'Failed to load column information')
}
```

**After:**
```tsx
} catch (error) {
  handleApiError(error, { userMessage: 'Failed to load column information' })
}
```

### Step 4: Add success toast after processing (find handleSubmit function)

**Find the success redirect** (likely around line 150-170):
```tsx
router.push(`/analysis/${id}/results`)
```

**Add before redirect:**
```tsx
showSuccess('Column mapping saved successfully')
router.push(`/analysis/${id}/results`)
```

### Step 5: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 6: Test in browser (manual)

**Test scenarios:**
1. Upload a CSV
2. Navigate to mapping page
3. Trigger error (invalid mapping) → See error toast
4. Submit valid mapping → See success toast
5. Verify no browser alerts

**Expected:** Toasts appear instead of alerts

### Step 7: Commit mapping page updates

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/analysis/[id]/mapping/page.tsx
git commit -m "feat: replace alerts with toasts in mapping page

- Replace alert() with handleApiError
- Add success toast after column mapping
- Consistent error handling with rest of app

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 6: Add Success Toasts to Analysis Creation

**Files:**
- Modify: `frontend/app/analysis/new/page.tsx`

### Step 1: Read current analysis creation page

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
type app\analysis\new\page.tsx | findstr /N "router.push"
```

**Expected:** See redirect after successful creation

### Step 2: Add error handler imports

**File: `frontend/app/analysis/new/page.tsx`**

Add import at top:
```tsx
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
```

### Step 3: Add success toast after analysis creation

**Find the onSubmit handler** (likely has router.push to upload page):
```tsx
const data = await createAnalysis(formData)
router.push(`/analysis/${data.id}/upload`)
```

**Add success toast before redirect:**
```tsx
const data = await createAnalysis(formData)
showSuccess('Analysis created successfully')
router.push(`/analysis/${data.id}/upload`)
```

### Step 4: Replace any error handling if needed

**If there's a catch block with console.error:**
```tsx
catch (error) {
  handleApiError(error, { userMessage: 'Failed to create analysis' })
}
```

### Step 5: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 6: Test in browser (manual)

**Test scenarios:**
1. Navigate to new analysis page
2. Fill form and submit
3. See success toast
4. Verify redirect works

**Expected:** Success toast appears before redirect

### Step 7: Commit analysis creation updates

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/analysis/new/page.tsx
git commit -m "feat: add success toast to analysis creation

- Show success toast after creating analysis
- Consistent feedback across workflow
- Improved user experience

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 7: Add Success Toasts to Upload Page

**Files:**
- Modify: `frontend/app/analysis/[id]/upload/page.tsx`

### Step 1: Read current upload page

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
type app\analysis\[id]\upload\page.tsx | findstr /N "router.push"
```

**Expected:** See redirect after successful upload

### Step 2: Add error handler imports

**File: `frontend/app/analysis/[id]/upload/page.tsx`**

Add import at top:
```tsx
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
```

### Step 3: Add success toast after file upload

**Find the upload success handler** (likely has router.push to mapping):
```tsx
// After successful upload
router.push(`/analysis/${id}/mapping`)
```

**Add success toast before redirect:**
```tsx
// After successful upload
showSuccess(`File uploaded successfully: ${acceptedFiles[0].name}`)
router.push(`/analysis/${id}/mapping`)
```

### Step 4: Replace any error handling with handleApiError

**If there's error handling:**
```tsx
catch (error) {
  handleApiError(error, { userMessage: 'Failed to upload file' })
}
```

### Step 5: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 6: Test in browser (manual)

**Test scenarios:**
1. Navigate to upload page
2. Upload a CSV file
3. See success toast with filename
4. Verify redirect to mapping

**Expected:** Success toast appears with filename

### Step 7: Commit upload page updates

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/analysis/[id]/upload/page.tsx
git commit -m "feat: add success toast to file upload

- Show success toast with filename after upload
- Improved upload feedback
- Consistent with other workflow steps

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 8: Standardize Dashboard Logout Button

**Files:**
- Modify: `frontend/app/dashboard/page.tsx`

### Step 1: Read current dashboard page

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
type app\dashboard\page.tsx | findstr /N "button.*Logout"
```

**Expected:** See custom button with Tailwind classes (around line 37-42)

### Step 2: Find and replace logout button

**File: `frontend/app/dashboard/page.tsx`**

**Verify Button import exists:**
```tsx
import { Button } from '@/components/ui/button'
```

**If not, add it at top of file**

**Before (custom button):**
```tsx
<button
  onClick={handleLogout}
  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
  Logout
</button>
```

**After (shadcn Button):**
```tsx
<Button variant="outline" onClick={handleLogout}>
  Logout
</Button>
```

### Step 3: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 4: Test in browser (manual)

**Test scenarios:**
1. Navigate to dashboard
2. Verify logout button looks correct (outline style)
3. Click logout → Verify it works
4. Check hover state
5. Check focus state (tab to button, press space)

**Expected:** Button works identically, looks consistent with design system

### Step 5: Commit dashboard button standardization

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/dashboard/page.tsx
git commit -m "refactor: standardize logout button in dashboard

- Replace custom button with shadcn Button component
- Use 'outline' variant for secondary action
- Consistent with design system
- Maintains all functionality

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 9: Standardize Login Page Buttons

**Files:**
- Modify: `frontend/app/login/page.tsx`

### Step 1: Read current login page

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
type app\login\page.tsx | findstr /N "<button"
```

**Expected:** See button elements

### Step 2: Verify Button import and add if missing

**File: `frontend/app/login/page.tsx`**

Add import if not present:
```tsx
import { Button } from '@/components/ui/button'
```

### Step 3: Replace login button

**Find the login/submit button** (likely custom Tailwind button):

**Before:**
```tsx
<button
  type="submit"
  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
  Sign in
</button>
```

**After:**
```tsx
<Button type="submit" className="w-full">
  Sign in
</Button>
```

### Step 4: Replace any secondary buttons (if present)

**Example: "Create account" link as button:**

**Use `variant="link"` for text links:**
```tsx
<Button variant="link" onClick={() => router.push('/signup')}>
  Create an account
</Button>
```

### Step 5: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 6: Test in browser (manual)

**Test scenarios:**
1. Navigate to login page
2. Verify button styling is correct
3. Test login flow works
4. Check responsive behavior

**Expected:** Buttons work identically, consistent styling

### Step 7: Commit login page button standardization

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/login/page.tsx
git commit -m "refactor: standardize buttons in login page

- Replace custom buttons with shadcn Button
- Use 'default' variant for primary action
- Use 'link' variant for secondary links
- Consistent with design system

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 10: Standardize Signup Page Buttons

**Files:**
- Modify: `frontend/app/signup/page.tsx`

### Step 1: Read current signup page

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
type app\signup\page.tsx | findstr /N "<button"
```

**Expected:** See button elements

### Step 2: Add Button import if missing

**File: `frontend/app/signup/page.tsx`**

Add import:
```tsx
import { Button } from '@/components/ui/button'
```

### Step 3: Replace signup button

**Before (custom button):**
```tsx
<button
  type="submit"
  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
  Sign up
</button>
```

**After:**
```tsx
<Button type="submit" className="w-full">
  Sign up
</Button>
```

### Step 4: Replace "Already have account" button if present

**Use link variant:**
```tsx
<Button variant="link" onClick={() => router.push('/login')}>
  Already have an account? Sign in
</Button>
```

### Step 5: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 6: Test in browser (manual)

**Test scenarios:**
1. Navigate to signup page
2. Verify styling
3. Test signup flow
4. Test link to login page

**Expected:** All buttons work, consistent styling

### Step 7: Commit signup page button standardization

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/signup/page.tsx
git commit -m "refactor: standardize buttons in signup page

- Replace custom buttons with shadcn Button
- Use 'default' variant for primary action
- Use 'link' variant for navigation links
- Consistent with design system

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 11: Verify Buttons in Analysis Workflow Pages

**Files:**
- Check: `frontend/app/analysis/new/page.tsx`
- Check: `frontend/app/analysis/[id]/upload/page.tsx`
- Check: `frontend/app/analysis/[id]/mapping/page.tsx`
- Check: `frontend/app/analysis/[id]/results/page.tsx`

### Step 1: Search for custom buttons

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
findstr /S /N "className=.*button" app\analysis\*.tsx app\analysis\[id]\*.tsx
```

**Expected:** See any remaining custom button styling

### Step 2: Check each file for Button imports

**For each file, verify:**
```tsx
import { Button } from '@/components/ui/button'
```

### Step 3: Replace any remaining custom buttons

**Pattern to look for:**
```tsx
<button className="...tailwind classes...">
```

**Replace with:**
```tsx
<Button variant="..." size="...">
```

**Variant guide:**
- Primary actions (Submit, Continue, Next) → `default`
- Cancel/Back actions → `outline`
- Delete actions → `destructive`
- Icon-only → `ghost` + `size="sm"`

### Step 4: Verify TypeScript compiles

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 5: Commit any changes

**Only if changes were made:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/app/analysis/*.tsx frontend/app/analysis/[id]/*.tsx
git commit -m "refactor: standardize buttons in analysis workflow

- Replace remaining custom buttons with shadcn Button
- Consistent variant usage throughout workflow
- All buttons now use design system

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Create Documentation

**Files:**
- Create: `frontend/lib/utils/README.md`

### Step 1: Create utils README

**File: `frontend/lib/utils/README.md`**
```markdown
# Utilities - Error Handling & Notifications

## Error Handler

Centralized error handling for API errors with automatic toast notifications.

### handleApiError

Handle API errors consistently across the application.

**Usage:**
```typescript
import { handleApiError } from '@/lib/utils/errorHandler'

try {
  await apiCall()
} catch (error) {
  handleApiError(error, { userMessage: 'Failed to load data' })
}
```

**Parameters:**
- `error: any` - The error object from try-catch
- `options?: object` - Optional configuration
  - `userMessage?: string` - Custom error message (default: "An unexpected error occurred")
  - `logToConsole?: boolean` - Log to console in dev (default: true)
  - `showToast?: boolean` - Show error toast (default: true)

**Returns:** `string` - The extracted error message

**Error Message Priority:**
1. `error.response.data.detail` (FastAPI format)
2. `error.response.data.message` (Alternative API format)
3. `error.message` (JavaScript Error)
4. `options.userMessage` (Fallback)

**Examples:**

```typescript
// Basic usage
try {
  await deleteAnalysis(id)
} catch (error) {
  handleApiError(error, { userMessage: 'Failed to delete analysis' })
}

// Console only, no toast
try {
  await savePreferences(data)
} catch (error) {
  handleApiError(error, {
    showToast: false,
    userMessage: 'Failed to save preferences'
  })
}

// Get error message for additional handling
try {
  await criticalOperation()
} catch (error) {
  const errorMsg = handleApiError(error, {
    userMessage: 'Critical operation failed'
  })
  // Do something with errorMsg
  trackError(errorMsg)
}
```

---

### showSuccess

Display a success toast notification.

**Usage:**
```typescript
import { showSuccess } from '@/lib/utils/errorHandler'

showSuccess('Analysis deleted successfully')
```

**Parameters:**
- `message: string` - Success message to display

**Examples:**

```typescript
// After successful delete
await deleteAnalysis(id)
showSuccess(`Analysis for "${clientName}" deleted successfully`)

// After successful creation
const data = await createAnalysis(formData)
showSuccess('Analysis created successfully')

// After successful upload
await uploadFile(file)
showSuccess(`File uploaded: ${file.name}`)
```

---

### showInfo

Display an info toast notification.

**Usage:**
```typescript
import { showInfo } from '@/lib/utils/errorHandler'

showInfo('Processing', 'Your analysis is being processed')
```

**Parameters:**
- `title: string` - Toast title
- `message: string` - Info message to display

**Examples:**

```typescript
// Processing notification
showInfo('Processing', 'Your analysis is being processed')

// Warning notification
showInfo('Note', 'This analysis is using estimated tax rates')

// Information
showInfo('Tip', 'You can edit column mappings later')
```

---

## Toast Notifications

Direct access to the toast system for custom toasts.

### useToast Hook

**Usage:**
```typescript
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const handleAction = () => {
    toast({
      title: "Custom Title",
      description: "Custom message",
      variant: "default", // or "destructive"
      duration: 5000, // milliseconds
    })
  }

  return <button onClick={handleAction}>Show Toast</button>
}
```

**Toast Options:**
- `title: string` - Toast title (required)
- `description?: string` - Toast message
- `variant?: 'default' | 'destructive'` - Visual style
- `duration?: number` - Auto-dismiss time in ms (default: 5000)
- `action?: { label: string, onClick: () => void }` - Optional action button

**Examples:**

```typescript
// Basic toast
toast({
  title: "Saved",
  description: "Your changes have been saved"
})

// Error toast
toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong"
})

// Toast with action
toast({
  title: "Analysis deleted",
  description: "The analysis has been removed",
  action: {
    label: "Undo",
    onClick: () => restoreAnalysis(id)
  }
})

// Long-lived toast
toast({
  title: "Processing",
  description: "This may take a few minutes",
  duration: 10000 // 10 seconds
})
```

---

## Button Components

All buttons should use shadcn/ui Button component for consistency.

### Button Variants

**default** - Primary actions (indigo background, white text)
```tsx
<Button onClick={handleSubmit}>Submit</Button>
```

**outline** - Secondary actions (border only, transparent background)
```tsx
<Button variant="outline" onClick={handleCancel}>Cancel</Button>
```

**ghost** - Minimal/tertiary actions (no border, hover effect)
```tsx
<Button variant="ghost" onClick={handleMinor}>Minor Action</Button>
```

**destructive** - Dangerous actions (red background, white text)
```tsx
<Button variant="destructive" onClick={handleDelete}>Delete</Button>
```

**link** - Text-only links styled as buttons
```tsx
<Button variant="link" onClick={() => router.push('/help')}>Learn more</Button>
```

### Button Sizes

**sm** - Small buttons, icon buttons (h-8)
```tsx
<Button size="sm" variant="ghost">
  <Icon className="h-4 w-4" />
</Button>
```

**default** - Standard buttons (h-10)
```tsx
<Button>Standard Button</Button>
```

**lg** - Large/prominent buttons (h-12)
```tsx
<Button size="lg">Large CTA</Button>
```

### Common Patterns

**Form submit button:**
```tsx
<Button type="submit" className="w-full">
  Continue
</Button>
```

**Icon button with aria-label:**
```tsx
<Button
  variant="ghost"
  size="sm"
  aria-label="Delete analysis"
  onClick={handleDelete}
>
  <Trash className="h-4 w-4" />
</Button>
```

**Loading state:**
```tsx
<Button disabled={loading}>
  {loading ? 'Processing...' : 'Submit'}
</Button>
```

**Navigation button:**
```tsx
<Button variant="outline" onClick={() => router.back()}>
  Back
</Button>
```

---

## Best Practices

### Error Handling
- ✅ Always use `handleApiError` for API errors
- ✅ Provide user-friendly messages
- ✅ Let it log to console in development
- ❌ Don't use `console.error` directly
- ❌ Don't use `alert()` or `window.alert()`

### Success Notifications
- ✅ Show success toast after important actions (create, delete, update)
- ✅ Keep messages concise and specific
- ✅ Include relevant details (e.g., filename, client name)
- ❌ Don't toast every minor action

### Button Usage
- ✅ Use shadcn Button component everywhere
- ✅ Choose semantic variants (destructive for delete, outline for cancel)
- ✅ Add aria-labels to icon-only buttons
- ❌ Don't use custom `<button>` elements with Tailwind classes
- ❌ Don't mix button styles

### Accessibility
- ✅ All toasts are announced to screen readers
- ✅ All buttons support keyboard navigation
- ✅ Error toasts have proper ARIA attributes
- ✅ Focus management is automatic

---

## Migration Guide

### From alert() to toast

**Before:**
```typescript
try {
  await action()
} catch (error) {
  alert('Operation failed')
}
```

**After:**
```typescript
import { handleApiError } from '@/lib/utils/errorHandler'

try {
  await action()
} catch (error) {
  handleApiError(error, { userMessage: 'Operation failed' })
}
```

### From custom button to Button component

**Before:**
```tsx
<button
  onClick={handleClick}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
>
  Click Me
</button>
```

**After:**
```tsx
import { Button } from '@/components/ui/button'

<Button onClick={handleClick}>
  Click Me
</Button>
```

---

## Related Files

- Error Handler: `frontend/lib/utils/errorHandler.ts`
- Toast Hook: `frontend/hooks/use-toast.ts`
- Toast Components: `frontend/components/ui/toast.tsx`, `frontend/components/ui/toaster.tsx`
- Button Component: `frontend/components/ui/button.tsx`

---

**Last Updated:** 2025-11-08
```

### Step 2: Commit documentation

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add frontend/lib/utils/README.md
git commit -m "docs: add error handling and button usage guide

- Comprehensive examples for handleApiError
- Toast notification patterns
- Button variant guide
- Best practices and migration guide

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 13: Update UI/UX Audit Document

**Files:**
- Modify: `docsplans/UI_UX_AUDIT_2025-11-08.md`

### Step 1: Read current audit status section

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
type docsplans\UI_UX_AUDIT_2025-11-08.md | findstr /N "Implementation Status"
```

**Expected:** See status section at top

### Step 2: Update implementation status

**File: `docsplans/UI_UX_AUDIT_2025-11-08.md`**

Add to the "Implementation Status Update" section (after existing completed items):

```markdown
### ✅ Completed Items - Session 2 (2025-11-08)

**MEDIUM Priority Implementation Complete:**

4. **Toast Notification System** (Section 2.1)
   - Installed shadcn/ui toast components (toast.tsx, toaster.tsx, use-toast hook)
   - Integrated Toaster in root layout
   - Toasts appear top-right with auto-dismiss
   - Supports multiple variants (default, destructive)

5. **Centralized Error Handling Utility** (Section 9.2)
   - Created `lib/utils/errorHandler.ts`
   - `handleApiError()` with automatic toast integration
   - `showSuccess()` and `showInfo()` helpers
   - Extracts errors from multiple sources (FastAPI, Axios, Error)
   - Development logging, production silent

6. **Replace Browser Alerts with Toasts** (Section 2.1)
   - Analyses page: Replaced console.error and alert() calls
   - Mapping page: Replaced alert() with handleApiError
   - Analysis creation: Added success toast
   - Upload page: Added success toast with filename
   - Delete action: Added success toast with confirmation

7. **Standardize Button Components** (Section 3.2)
   - Dashboard: Logout button uses outline variant
   - Login page: Submit button uses default variant
   - Signup page: Submit button uses default variant
   - All workflow pages verified and standardized
   - Removed all custom button Tailwind classes

8. **Comprehensive Documentation**
   - Created `frontend/lib/utils/README.md`
   - Error handling patterns and examples
   - Button variant guide
   - Best practices
   - Migration guide

### 📊 Impact Summary - Session 2

- **Files Modified**: 7 pages (analyses, mapping, new analysis, upload, dashboard, login, signup)
- **Files Created**: 4 new files (toast.tsx, toaster.tsx, use-toast.ts, errorHandler.ts)
- **Alerts Removed**: All browser alert() and console.error() calls replaced
- **Buttons Standardized**: All custom buttons replaced with shadcn Button
- **Success Toasts Added**: 4 success notifications (create, upload, mapping, delete)
- **Documentation Created**: Comprehensive usage guide with examples
- **Estimated Time**: 6-8 hours → Actual: [FILL IN ACTUAL TIME]

### 🎯 MEDIUM Priority Status: ✅ COMPLETE

All MEDIUM priority items from the audit are now implemented.
```

### Step 3: Commit audit update

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git add docsplans/UI_UX_AUDIT_2025-11-08.md
git commit -m "docs: update audit with MEDIUM priority completion

- Mark toast notifications as complete
- Mark error handler as complete
- Mark button standardization as complete
- Add impact summary for session 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Expected:** Commit successful

---

## Task 14: Final Testing & Verification

**This task has no code changes, only verification steps**

### Step 1: Run type checker

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run type-check
```

**Expected:** No TypeScript errors

### Step 2: Start dev server

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
npm run dev
```

**Expected:** Server starts successfully on http://localhost:3000

### Step 3: Manual testing checklist

**Test each scenario:**

- [ ] **Login Page**
  - Navigate to /login
  - Verify button styling (default variant)
  - Test login flow
  - Verify no console errors

- [ ] **Signup Page**
  - Navigate to /signup
  - Verify button styling
  - Test signup flow
  - Verify no console errors

- [ ] **Dashboard**
  - Navigate to /dashboard
  - Verify logout button (outline variant)
  - Click logout → verify it works
  - Verify no console errors

- [ ] **Analyses List**
  - Navigate to /analyses
  - Trigger error (disconnect network) → **Verify error toast appears**
  - Delete an analysis → **Verify success toast appears**
  - Verify no browser alerts
  - Verify no console errors (except intentional network error)

- [ ] **New Analysis**
  - Navigate to /analysis/new
  - Fill form and submit
  - **Verify success toast appears**
  - Verify redirect to upload page
  - Verify no browser alerts

- [ ] **Upload Page**
  - Upload a CSV file
  - **Verify success toast with filename**
  - Verify redirect to mapping
  - Verify no browser alerts

- [ ] **Mapping Page**
  - Map columns
  - Submit mapping
  - **Verify success toast**
  - Trigger error (invalid mapping) → **Verify error toast**
  - Verify no browser alerts

- [ ] **Toast System**
  - Verify toasts appear top-right
  - Verify toasts auto-dismiss after 5 seconds
  - Verify multiple toasts stack vertically
  - Verify close button works
  - Verify error toasts are red
  - Verify success toasts are default color

- [ ] **Button Consistency**
  - Verify all buttons use shadcn Button component
  - Verify no custom Tailwind button classes remain
  - Verify variant usage is semantic
  - Verify hover states work
  - Verify focus states work (keyboard navigation)

- [ ] **Accessibility**
  - Tab through all pages → Verify buttons are keyboard accessible
  - Verify toasts are announced (use screen reader if available)
  - Verify no console warnings about accessibility

### Step 4: Search for any remaining alerts

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
findstr /S /N "alert(" app\*.tsx app\**\*.tsx
```

**Expected:** No matches (or only in node_modules)

### Step 5: Search for custom button classes

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean\frontend
findstr /S /N "className=.*px-.*py-.*bg-.*button" app\*.tsx app\**\*.tsx
```

**Expected:** No matches (or only legitimate non-button classes)

### Step 6: Verify git status

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git status
```

**Expected:** Working tree clean (all changes committed)

### Step 7: Review commit history

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git log --oneline -15
```

**Expected:** See all task commits in chronological order

---

## Success Criteria

✅ **Toast System:**
- [ ] Toast components installed and integrated
- [ ] Toasts appear top-right
- [ ] Auto-dismiss after 5 seconds
- [ ] Multiple toasts stack properly
- [ ] Error toasts use destructive variant
- [ ] Success toasts use default variant

✅ **Error Handling:**
- [ ] `handleApiError` utility created
- [ ] All `alert()` calls removed
- [ ] All `console.error` replaced with `handleApiError`
- [ ] Error messages are user-friendly
- [ ] Development logging works
- [ ] Production logging disabled

✅ **Success Notifications:**
- [ ] Analysis creation shows success toast
- [ ] File upload shows success toast with filename
- [ ] Column mapping shows success toast
- [ ] Analysis delete shows success toast with name

✅ **Button Standardization:**
- [ ] All buttons use shadcn Button component
- [ ] Dashboard logout uses outline variant
- [ ] Login/signup buttons use default variant
- [ ] No custom Tailwind button classes remain
- [ ] Button variants are semantically appropriate

✅ **Code Quality:**
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] No console warnings
- [ ] All imports correct
- [ ] Code formatted consistently

✅ **Testing:**
- [ ] All manual tests pass
- [ ] No browser alerts appear
- [ ] All workflows function correctly
- [ ] No regressions detected

✅ **Documentation:**
- [ ] Usage guide created (`lib/utils/README.md`)
- [ ] Examples are clear and copy-paste ready
- [ ] UI/UX audit updated with completion status
- [ ] All commits have clear messages

---

## Rollback Plan

If major issues are discovered:

### Rollback to before this implementation

**Command:**
```bash
cd D:\01 - Projects\SALT-Tax-Tool-Clean
git log --oneline -15
# Find the commit before "feat: install shadcn toast components"
git reset --hard <commit-hash-before-toasts>
```

### Rollback specific changes

**Example: Rollback just button standardization:**
```bash
git revert <commit-hash-of-button-changes>
```

**Example: Rollback just error handler:**
```bash
git revert <commit-hash-of-error-handler>
```

---

## Next Steps After Completion

### Immediate (If time permits):
1. **Enhance toast styling** - Add custom colors for success variant
2. **Add loading toasts** - For long-running operations
3. **Implement toast queue** - Better management of multiple toasts

### LOW Priority Items (Future session):
1. **Replace confirm() dialogs** - Create reusable AlertDialog component
2. **Standardize container widths** - Document in style guide
3. **Dashboard enhancements** - Recent activity, stats cards

### Future Enhancements:
1. **Error tracking** - Integrate Sentry or similar
2. **Toast persistence** - Keep toasts across navigation if needed
3. **Toast actions** - Add undo functionality to destructive actions
4. **Keyboard shortcuts** - Dismiss all toasts with Escape key

---

## Troubleshooting

### Issue: shadcn CLI fails

**Solution:** Manually create the three files (toast.tsx, toaster.tsx, use-toast.ts) as shown in Task 1, Step 2

### Issue: TypeScript errors about toast variants

**Solution:** Ensure `class-variance-authority` is installed:
```bash
npm install class-variance-authority
```

### Issue: Toasts don't appear

**Solution:** Verify Toaster is in layout.tsx and mounted in DOM:
```bash
cd frontend
type app\layout.tsx | findstr "Toaster"
```

### Issue: Multiple toasts overlap

**Solution:** Check TOAST_LIMIT in use-toast.ts (should be 1 for single toast, 5+ for multiple)

### Issue: Button styling looks wrong

**Solution:** Verify button.tsx exists in components/ui and is imported correctly

### Issue: Console errors about missing lucide-react icons

**Solution:** Install lucide-react:
```bash
npm install lucide-react
```

---

## Time Estimates vs Actuals

| Task | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| 1. Install Toast | 30 min | | |
| 2. Add to Layout | 30 min | | |
| 3. Error Handler | 30 min | | |
| 4. Analyses Page | 30 min | | |
| 5. Mapping Page | 30 min | | |
| 6. Analysis Creation | 20 min | | |
| 7. Upload Page | 20 min | | |
| 8. Dashboard Button | 15 min | | |
| 9. Login Buttons | 15 min | | |
| 10. Signup Buttons | 15 min | | |
| 11. Verify Workflow | 30 min | | |
| 12. Documentation | 45 min | | |
| 13. Update Audit | 15 min | | |
| 14. Testing | 60 min | | |
| **Total** | **6-8 hrs** | | |

---

**Plan Created:** 2025-11-08
**Estimated Duration:** 6-8 hours
**Prerequisites:** Next.js 14, shadcn/ui project setup, @radix-ui/react-toast installed
**Related:** Design doc at `docsplans/2025-11-08-toast-error-handling-buttons-design.md`
