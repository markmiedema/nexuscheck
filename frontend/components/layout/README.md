# Layout Components

This directory contains layout components that provide consistent structure and navigation across the Nexus Check application.

## Components

### AppLayout

Main layout wrapper that provides consistent page structure with navigation bar, optional breadcrumbs, and content area.

**Usage:**
```tsx
import AppLayout from '@/components/layout/AppLayout'

export default function MyPage() {
  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="7xl"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Page' },
        ]}
      >
        <div>Page content goes here</div>
      </AppLayout>
    </ProtectedRoute>
  )
}
```

**Props:**
- `children` (ReactNode) - Page content to render inside the layout
- `maxWidth` (optional) - Maximum width constraint for the content area
  - Options: `'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '7xl' | 'full'`
  - Default: `'7xl'`
- `breadcrumbs` (optional) - Array of breadcrumb items to display above content
  - Type: `BreadcrumbItem[]`

**Features:**
- Includes AppNav component with logo, dashboard link, user email, and logout button
- Responsive design with mobile-friendly navigation
- Consistent background color (bg-gray-50)
- Configurable content width constraints

### AppNav

Unified navigation bar displayed at the top of all authenticated pages.

**Features:**
- Nexus Check branding (clickable, navigates to dashboard)
- Dashboard link (visible on desktop)
- User email display (visible on desktop)
- Logout button with icon
- Responsive design - hides text labels on mobile
- Consistent styling across the application

**Note:** This component is automatically included when using AppLayout. You don't need to import it separately.

### Breadcrumbs

Hierarchical navigation component showing the current page location within the application.

**Usage:**
```tsx
import Breadcrumbs from '@/components/layout/Breadcrumbs'

<Breadcrumbs
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analysis Results', href: '/analysis/123/results' },
    { label: 'State Table' }, // Last item has no href
  ]}
/>
```

**Props:**
- `items` (BreadcrumbItem[]) - Array of breadcrumb items
  - Each item has:
    - `label` (string) - Text to display
    - `href` (optional string) - Link destination (last item should omit href)

**Features:**
- Chevron separators between items
- Clickable links for all items except the last
- Last item displayed in bold to indicate current location
- Hover effects on links
- Semantic HTML with `<nav>` and `<ol>` for accessibility

**BreadcrumbItem Interface:**
```typescript
export interface BreadcrumbItem {
  label: string
  href?: string
}
```

## Common Patterns

### Multi-Step Workflows

For analysis creation workflows, use breadcrumbs to show progression:

```tsx
// Step 1: New Analysis
<AppLayout breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Analysis' },
]}>

// Step 2: Upload Data
<AppLayout breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Analysis', href: '/analysis/new' },
  { label: 'Upload Data' },
]}>

// Step 3: Map Columns
<AppLayout breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'New Analysis', href: '/analysis/new' },
  { label: 'Upload Data', href: `/analysis/${id}/upload` },
  { label: 'Map Columns' },
]}>
```

### Results and Detail Pages

For viewing results and drilling into details:

```tsx
// Results Summary
<AppLayout breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analysis Results' },
]}>

// State Table
<AppLayout breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analysis Results', href: `/analysis/${id}/results` },
  { label: 'State Table' },
]}>

// State Detail
<AppLayout breadcrumbs={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analysis Results', href: `/analysis/${id}/results` },
  { label: 'State Table', href: `/analysis/${id}/states` },
  { label: 'CA - California' },
]}>
```

### Loading and Error States

Always wrap loading and error states with AppLayout for consistency:

```tsx
if (loading) {
  return (
    <ProtectedRoute>
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

if (error) {
  return (
    <ProtectedRoute>
      <AppLayout breadcrumbs={breadcrumbs}>
        <ErrorMessage error={error} />
      </AppLayout>
    </ProtectedRoute>
  )
}
```

## Best Practices

1. **Always use ProtectedRoute**: Wrap AppLayout with ProtectedRoute for authenticated pages
2. **Last breadcrumb has no href**: The current page should not be a link
3. **Consistent maxWidth**: Use `7xl` for most pages, `5xl` for forms, `4xl` for mapping screens
4. **Mobile-first**: Components are designed mobile-first with responsive breakpoints
5. **Semantic HTML**: Use proper HTML elements for accessibility (nav, ol, li)
6. **ARIA labels**: Include aria-label on buttons with only icons

## Migration Guide

To migrate an existing page to use AppLayout:

1. **Add imports:**
```tsx
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
```

2. **Remove custom nav bar:**
Delete any manual navigation bar code (typically found in a `<nav>` element)

3. **Wrap with AppLayout:**
```tsx
// Before:
return (
  <div className="min-h-screen bg-gray-50">
    <nav>...</nav>
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {content}
    </main>
  </div>
)

// After:
return (
  <ProtectedRoute>
    <AppLayout
      maxWidth="7xl"
      breadcrumbs={breadcrumbs}
    >
      {content}
    </AppLayout>
  </ProtectedRoute>
)
```

4. **Add breadcrumbs:**
Define appropriate breadcrumb trail based on page hierarchy

5. **Update loading/error states:**
Ensure all return paths (loading, error, success) use AppLayout

## Related Files

- `frontend/components/layout/AppNav.tsx` - Navigation bar component
- `frontend/components/layout/AppLayout.tsx` - Main layout wrapper
- `frontend/components/layout/Breadcrumbs.tsx` - Breadcrumb navigation
- `frontend/components/ProtectedRoute.tsx` - Authentication wrapper
