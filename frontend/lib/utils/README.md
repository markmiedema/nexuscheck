# Toast Notifications & Error Handling

This document describes the toast notification system and centralized error handling utilities used throughout the Nexus Check frontend.

## Table of Contents
- [Toast System Overview](#toast-system-overview)
- [Error Handling Utilities](#error-handling-utilities)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Toast System Overview

The application uses **Sonner** by Emil Kowalski for toast notifications. Sonner is the officially recommended toast library by shadcn/ui (the previous toast component was deprecated).

### Why Sonner?

- ✅ **Officially recommended** by shadcn/ui
- ✅ **Simpler API** - Single function calls instead of complex objects
- ✅ **Better animations** - Smooth, modern toast transitions
- ✅ **Auto-stacking** - Multiple toasts stack nicely
- ✅ **Rich colors** - Automatic color coding for success/error/info
- ✅ **Zero config** - Works out of the box

### Setup

Sonner is installed as a package:
```bash
npm install sonner
```

The `<Toaster />` component is added to the root layout:
```tsx
// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
```

## Error Handling Utilities

Located in `frontend/lib/utils/errorHandler.ts`, these utilities provide consistent error handling and user feedback across the application.

### Functions

#### 1. `handleApiError(error, options)`

Centralized API error handler that extracts error messages from multiple sources.

**Parameters:**
- `error: any` - The error object (from Axios, fetch, or any Error)
- `options?: object`
  - `userMessage?: string` - Fallback message if none found
  - `logToConsole?: boolean` - Whether to log to console (default: true)
  - `showToast?: boolean` - Whether to show toast notification (default: true)

**Returns:** `string` - The extracted error message

**Error Sources (in priority order):**
1. `error.response.data.detail` (FastAPI validation errors)
2. `error.response.data.message` (Generic API errors)
3. `error.message` (JavaScript Error objects)
4. `userMessage` (Fallback)
5. `'An unknown error occurred'` (Ultimate fallback)

#### 2. `showSuccess(message)`

Convenience function for displaying success toast notifications.

**Parameters:**
- `message: string` - The success message to display

**Returns:** `void`

#### 3. `showError(message)`

Convenience function for displaying error toast notifications.

**Parameters:**
- `message: string` - The error message to display

**Returns:** `void`

## Usage Examples

### Direct Sonner Usage

If you need to use Sonner directly (rare - prefer the helper functions):

```typescript
import { toast } from 'sonner'

// Success notification
toast.success('Your changes have been saved')

// Error notification
toast.error('Something went wrong')

// Info notification
toast.info('Processing your request')

// Warning notification
toast.warning('This action cannot be undone')

// Default notification
toast('Something happened')
```

### Using Helper Functions (Recommended)

Instead of using Sonner directly, use the centralized helper functions:

```typescript
import { showSuccess } from '@/lib/utils/errorHandler'

const handleSave = async () => {
  // ... save logic
  showSuccess('Analysis created successfully')
}
```

### Using Error Helper

```typescript
import { showError } from '@/lib/utils/errorHandler'

const handleDelete = async () => {
  if (!canDelete) {
    showError('Cannot delete: analysis is in progress')
    return
  }
  // ... delete logic
}
```

### API Error Handling (Recommended)

```typescript
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import apiClient from '@/lib/api/client'

const loadAnalyses = async () => {
  try {
    const response = await apiClient.get('/api/v1/analyses')
    setAnalyses(response.data)
  } catch (error) {
    handleApiError(error, { userMessage: 'Failed to load analyses' })
  }
}

const deleteAnalysis = async (id: string) => {
  try {
    await apiClient.delete(`/api/v1/analyses/${id}`)
    showSuccess('Analysis deleted successfully')
  } catch (error) {
    handleApiError(error, { userMessage: 'Failed to delete analysis' })
  }
}
```

### Custom Error Handling (without toast)

```typescript
import { handleApiError } from '@/lib/utils/errorHandler'

const validateData = async () => {
  try {
    const response = await apiClient.post('/api/v1/validate', data)
    return response.data
  } catch (error) {
    const errorMsg = handleApiError(error, {
      userMessage: 'Validation failed',
      showToast: false, // Don't show toast, handle error manually
    })
    setError(errorMsg)
    return null
  }
}
```

### Form Validation Errors

```typescript
import { toast } from '@/hooks/use-toast'

const validateForm = (): boolean => {
  if (!email) {
    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description: 'Email is required',
    })
    return false
  }

  if (!password || password.length < 8) {
    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description: 'Password must be at least 8 characters',
    })
    return false
  }

  return true
}
```

## Best Practices

### 1. Always Use Error Handlers for API Calls

**Do:**
```typescript
try {
  await apiClient.post('/api/v1/endpoint', data)
  showSuccess('Operation completed')
} catch (error) {
  handleApiError(error, { userMessage: 'Operation failed' })
}
```

**Don't:**
```typescript
try {
  await apiClient.post('/api/v1/endpoint', data)
  alert('Success!') // ❌ Don't use alert()
} catch (error) {
  console.error(error) // ❌ Silent failure
}
```

### 2. Provide Meaningful Fallback Messages

**Do:**
```typescript
handleApiError(error, {
  userMessage: 'Failed to upload transaction file'
})
```

**Don't:**
```typescript
handleApiError(error, {
  userMessage: 'Error' // ❌ Too vague
})
```

### 3. Use Appropriate Toast Variants

- **Default variant**: Success messages, informational updates
- **Destructive variant**: Errors, validation failures, warnings

### 4. Toast Auto-Dismiss

Toasts automatically dismiss after 5 seconds (configurable in `use-toast.ts`). For critical errors that require user action, consider:
- Using a modal/dialog instead
- Setting a longer dismiss time
- Adding an action button to the toast

### 5. Avoid Toast Spam

**Do:**
```typescript
// Debounce or batch multiple operations
const results = await Promise.allSettled(operations)
const failed = results.filter(r => r.status === 'rejected')
if (failed.length > 0) {
  showError(`${failed.length} operations failed`)
}
```

**Don't:**
```typescript
// Show separate toast for each operation
operations.forEach(async (op) => {
  try {
    await op()
  } catch (error) {
    handleApiError(error) // ❌ Too many toasts
  }
})
```

### 6. Consistent Error Messages

Follow these conventions:
- **Failed to [action]**: "Failed to load analyses", "Failed to upload file"
- **Cannot [action]**: "Cannot delete: analysis in progress"
- **[Field] is required**: "Email is required", "Company name is required"

### 7. Loading States with Toasts

```typescript
const [loading, setLoading] = useState(false)

const handleSubmit = async () => {
  setLoading(true)
  try {
    await apiClient.post('/api/v1/endpoint', data)
    showSuccess('Data submitted successfully')
    router.push('/next-page')
  } catch (error) {
    handleApiError(error, { userMessage: 'Failed to submit data' })
  } finally {
    setLoading(false)
  }
}
```

## Migration from Alert/Console

If you encounter legacy code using `alert()` or `console.error()`:

**Before:**
```typescript
try {
  await fetch('/api/endpoint')
} catch (error) {
  console.error('Failed:', error)
  alert('Operation failed')
}
```

**After:**
```typescript
try {
  await apiClient.get('/api/endpoint')
} catch (error) {
  handleApiError(error, { userMessage: 'Operation failed' })
}
```

## Troubleshooting

### Toast Not Showing

1. Verify `<Toaster />` is rendered in root layout
2. Check that you're calling `toast()` or error handlers correctly
3. Open browser console for any React errors

### Error Message Not Extracted

1. Check API response structure (should be `{ detail: "..." }` or `{ message: "..." }`)
2. Verify `apiClient` interceptors are configured correctly
3. Use `logToConsole: true` to debug error object structure

### Styling Issues

Toast components use Tailwind CSS classes. Ensure:
1. Tailwind config includes component paths
2. `globals.css` imports are correct
3. No CSS conflicts with custom styles

## Future Enhancements

Potential improvements to consider:
- Toast action buttons (undo, retry, etc.)
- Toast queue management for bulk operations
- Persistent toasts for critical errors
- Custom toast durations per type
- Integration with analytics for error tracking
