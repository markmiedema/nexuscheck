# Segment 3: Dark/Light Mode & Slate Theme Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement dark/light mode toggle with next-themes and apply slate color palette from shadcn/ui using HSL format.

**Architecture:** Install next-themes package, create ThemeProvider wrapper, add mode toggle component, replace current color variables with slate palette, ensure all components support both modes.

**Tech Stack:** Next.js 14, React 18, next-themes, shadcn/ui, Tailwind CSS, HSL color format

**Prerequisites:** None (can be done independently of Segments 1 & 2)

---

## Task 1: Install next-themes Package

**Files:**
- Modify: `frontend/package.json` (dependencies auto-updated)

**Step 1: Install next-themes**

```bash
cd "D:\01 - Projects\SALT-Tax-Tool-Clean\frontend"
npm install next-themes --legacy-peer-deps
```

**Expected output:**
```
+ next-themes@0.x.x
```

**Step 2: Verify installation**

```bash
npm list next-themes
```

**Expected:** Shows next-themes version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install next-themes for dark mode support

- Add next-themes package for theme management
- Handles light/dark/system theme switching
- Prevents hydration mismatches in Next.js

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Theme Provider Component

**Files:**
- Create: `frontend/components/theme-provider.tsx`

**Step 1: Create theme provider**

Create file `frontend/components/theme-provider.tsx`:

```typescript
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 3: Commit**

```bash
git add components/theme-provider.tsx
git commit -m "feat: create ThemeProvider wrapper component

- Wraps next-themes ThemeProvider
- Client component for theme management
- Re-exports ThemeProviderProps for type safety

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add ThemeProvider to Root Layout

**Files:**
- Modify: `frontend/app/layout.tsx`

**Step 1: Read current layout**

```bash
cat frontend/app/layout.tsx
```

**Step 2: Add suppressHydrationWarning to html tag**

Change:
```typescript
<html lang="en">
```

To:
```typescript
<html lang="en" suppressHydrationWarning>
```

**Step 3: Add ThemeProvider import**

At top of file:
```typescript
import { ThemeProvider } from '@/components/theme-provider'
```

**Step 4: Wrap children with ThemeProvider**

Change:
```typescript
<body className={inter.className}>
  {children}
  <Toaster richColors position="bottom-right" />
</body>
```

To:
```typescript
<body className={inter.className}>
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
  >
    {children}
    <Toaster richColors position="bottom-right" />
  </ThemeProvider>
</body>
```

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 6: Manual test**

1. Start dev server: `npm run dev`
2. Open browser DevTools console
3. Run: `document.documentElement.classList`
4. **Verify:** Should show 'light' or 'dark' class based on system preference

**Step 7: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add ThemeProvider to root layout

Configure next-themes with:
- attribute='class' (adds .dark class to html)
- defaultTheme='system' (respects OS preference)
- enableSystem (detects system theme changes)
- disableTransitionOnChange (prevents flash)
- suppressHydrationWarning on html tag

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Update CSS Variables with Slate Theme

**Files:**
- Modify: `frontend/app/globals.css`

**Step 1: Replace existing CSS variables**

In `frontend/app/globals.css`, replace the `:root` and `.dark` sections with slate theme:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 47.4% 11.2%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 47.4% 11.2%;

    --radius: 0.5rem;

    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;

    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 2: Remove old primary-hover variable**

Since we updated primary colors, remove the old `--primary-hover` variable if it exists.

**Step 3: Update button hover state**

Read `components/ui/button.tsx` and update the hover state to work with new variables:

```typescript
default: "bg-primary text-primary-foreground hover:bg-primary/90",
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 5: Manual test**

1. Start dev server
2. View any page
3. **Verify:** Light mode shows white background, dark text
4. Open DevTools and add `.dark` class to `<html>`:
   ```javascript
   document.documentElement.classList.add('dark')
   ```
5. **Verify:** Dark mode shows dark background, light text

**Step 6: Commit**

```bash
git add app/globals.css components/ui/button.tsx
git commit -m "feat: implement slate theme with dark mode support

Light mode (slate):
- Neutral backgrounds (white, light gray)
- Dark slate text and borders
- Professional, modern appearance

Dark mode (slate):
- Very dark slate backgrounds
- Light text for readability
- Inverted but cohesive palette

Added chart colors for future visualization support.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create Theme Toggle Component

**Files:**
- Create: `frontend/components/theme-toggle.tsx`

**Step 1: Create toggle component**

Create file `frontend/components/theme-toggle.tsx`:

```typescript
'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 3: Commit**

```bash
git add components/theme-toggle.tsx
git commit -m "feat: create ThemeToggle component

Dropdown menu with 3 options:
- Light: Force light mode
- Dark: Force dark mode
- System: Follow OS preference

Features:
- Animated sun/moon icons
- Accessible (sr-only label)
- Uses shadcn DropdownMenu
- Small icon button (size='icon')

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Add Theme Toggle to Navigation

**Files:**
- Modify: `frontend/components/layout/AppNav.tsx`

**Step 1: Read current navigation**

```bash
cat frontend/components/layout/AppNav.tsx
```

**Step 2: Add import**

```typescript
import { ThemeToggle } from '@/components/theme-toggle'
```

**Step 3: Add ThemeToggle to nav**

Find the section with user email and logout button. Add ThemeToggle before logout:

```typescript
<div className="flex items-center gap-3">
  <ThemeToggle />
  <span className="text-sm text-gray-700 dark:text-gray-300">{user?.email}</span>
  <Button variant="outline" onClick={handleLogout}>
    Logout
  </Button>
</div>
```

**Step 4: Update text colors for dark mode**

Find any hardcoded text colors and make them dark-mode aware:
- Change `text-gray-900` to `text-gray-900 dark:text-gray-100`
- Change `text-gray-700` to `text-gray-700 dark:text-gray-300`

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 6: Manual test**

1. Start dev server
2. Navigate to any authenticated page (dashboard)
3. **Verify:** Theme toggle button appears in nav
4. Click toggle and select "Dark"
5. **Verify:** Page switches to dark mode
6. **Verify:** Nav bar shows dark background
7. Click toggle and select "Light"
8. **Verify:** Page switches to light mode
9. Click toggle and select "System"
10. **Verify:** Follows OS preference

**Step 7: Commit**

```bash
git add components/layout/AppNav.tsx
git commit -m "feat: add theme toggle to navigation bar

- Place ThemeToggle before logout button
- Update text colors for dark mode support
- Accessible from all authenticated pages

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Update Authentication Pages for Dark Mode

**Files:**
- Modify: `frontend/app/login/page.tsx`
- Modify: `frontend/app/signup/page.tsx`

**Step 1: Update login page**

In `app/login/page.tsx`, update the gradient background to support dark mode:

Change:
```typescript
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
```

To:
```typescript
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
```

Update card background:
```typescript
<div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-10 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
```

Update text colors:
```typescript
<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Nexus Check</h1>
<h2 className="mt-6 text-2xl font-semibold text-gray-800 dark:text-gray-200">
```

**Step 2: Update signup page**

Apply same changes to `app/signup/page.tsx`:
- Gradient background with dark variant
- Card background with dark variant
- Text colors with dark variant

**Step 3: Add ThemeToggle to auth pages**

In top-right corner of both pages, add:

```typescript
<div className="absolute top-4 right-4">
  <ThemeToggle />
</div>
```

Don't forget to import:
```typescript
import { ThemeToggle } from '@/components/theme-toggle'
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Expected:** No errors

**Step 5: Manual test**

1. Log out to see login page
2. **Verify:** Theme toggle appears top-right
3. Toggle between light/dark
4. **Verify:** Background gradient changes
5. **Verify:** Card changes background
6. **Verify:** Text is readable in both modes
7. Test signup page similarly

**Step 6: Commit**

```bash
git add app/login/page.tsx app/signup/page.tsx
git commit -m "feat: add dark mode support to authentication pages

Login and signup pages now support dark mode:
- Dark gradient backgrounds (slate-900 to slate-800)
- Dark card backgrounds (slate-900)
- Readable text colors in both modes
- Theme toggle in top-right corner

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Audit and Update Components for Dark Mode

**Files:**
- Modify: Multiple component files as needed

**Step 1: Create audit checklist**

```bash
cat > dark-mode-audit.txt << 'EOF'
# Dark Mode Component Audit

## Strategy
Look for hardcoded colors that need dark mode variants:
- bg-white → bg-white dark:bg-slate-900
- bg-gray-50 → bg-gray-50 dark:bg-slate-800
- text-gray-900 → text-gray-900 dark:text-gray-100
- text-gray-600 → text-gray-600 dark:text-gray-400
- border-gray-200 → border-gray-200 dark:border-slate-700

## Components to Check
- [ ] components/layout/AppLayout.tsx
- [ ] components/layout/Breadcrumbs.tsx
- [ ] components/dashboard/StatCard.tsx
- [ ] components/dashboard/RecentAnalyses.tsx
- [ ] components/shared/ConfirmDialog.tsx (uses shadcn, should work)
- [ ] app/dashboard/page.tsx
- [ ] app/analyses/page.tsx
- [ ] app/analysis/new/page.tsx
- [ ] app/analysis/[id]/upload/page.tsx
- [ ] app/analysis/[id]/mapping/page.tsx
- [ ] app/analysis/[id]/results/page.tsx

## Common Patterns
bg-white → bg-white dark:bg-slate-900
bg-gray-50 → bg-gray-50 dark:bg-slate-800
bg-red-50 → bg-red-50 dark:bg-red-900/10
bg-green-50 → bg-green-50 dark:bg-green-900/10
bg-blue-50 → bg-blue-50 dark:bg-blue-900/10
text-gray-900 → text-gray-900 dark:text-gray-100
text-gray-700 → text-gray-700 dark:text-gray-300
text-gray-600 → text-gray-600 dark:text-gray-400
text-gray-500 → text-gray-500 dark:text-gray-500 (midpoint, often unchanged)
border-gray-200 → border-gray-200 dark:border-slate-700
border-gray-300 → border-gray-300 dark:border-slate-600

## Notes
- shadcn components (Button, Dialog, etc.) should work automatically with CSS variables
- Focus on custom backgrounds and text colors
- Test each page after updating
EOF
```

**Step 2: Update one component at a time**

For each component, search for hardcoded Tailwind colors and add dark mode variants.

Example for StatCard:

```typescript
// Before
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 className="text-sm font-medium text-gray-600">{title}</h3>
  <p className="text-3xl font-bold text-gray-900">{value}</p>
</div>

// After
<div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
</div>
```

**Step 3: Test each component**

After updating each component:
1. View in light mode - verify looks normal
2. Switch to dark mode - verify readable and attractive
3. Check borders, backgrounds, text contrast

**Step 4: Commit incrementally**

After updating 2-3 related components:

```bash
git add <files>
git commit -m "feat: add dark mode support to [component names]

- Update background colors with dark variants
- Update text colors for readability
- Update border colors for contrast
- All components tested in both modes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Repeat for all components in checklist**

---

## Task 9: Test Dark Mode Across All Pages

**Files:**
- None (testing task)

**Step 1: Create test checklist**

```bash
cat > dark-mode-test-report.txt << 'EOF'
# Dark Mode Testing Report

Date: 2025-11-08

## Authentication Pages
- [ ] Login page - Light mode looks good
- [ ] Login page - Dark mode looks good
- [ ] Login page - Theme toggle works
- [ ] Signup page - Light mode looks good
- [ ] Signup page - Dark mode looks good
- [ ] Signup page - Theme toggle works

## Dashboard
- [ ] Dashboard - Light mode (all elements readable)
- [ ] Dashboard - Dark mode (all elements readable)
- [ ] Stat cards - Both modes look good
- [ ] Recent analyses - Both modes look good
- [ ] Quick actions - Both modes look good

## Analyses List
- [ ] Analyses list - Light mode
- [ ] Analyses list - Dark mode
- [ ] Table - Both modes readable
- [ ] Search bar - Both modes
- [ ] Empty state - Both modes

## Analysis Workflow
- [ ] New analysis form - Light mode
- [ ] New analysis form - Dark mode
- [ ] Upload page - Both modes
- [ ] Mapping page - Both modes
- [ ] Results page - Both modes
- [ ] States page - Both modes

## Components
- [ ] Buttons - All variants in both modes
- [ ] Toasts - Success/error in both modes
- [ ] Dialogs - ConfirmDialog in both modes
- [ ] Dropdowns - Navigation dropdown in both modes
- [ ] Forms - Inputs readable in both modes

## Theme Persistence
- [ ] Select "Light" - Reload page - Still light
- [ ] Select "Dark" - Reload page - Still dark
- [ ] Select "System" - Reload page - Still system
- [ ] Change OS theme - App updates (if System selected)

## Responsive
- [ ] Mobile (375px) - Both modes
- [ ] Tablet (768px) - Both modes
- [ ] Desktop (1024px+) - Both modes

## Issues Found:
(List any issues)

## Notes:
(Any observations)
EOF
```

**Step 2: Test systematically**

Work through the checklist, testing each page and component in both modes.

**Step 3: Fix any issues found**

If you find problems:
1. Document in "Issues Found"
2. Fix the issue
3. Commit the fix
4. Re-test

**Step 4: No commit** (testing only)

---

## Task 10: Update Documentation

**Files:**
- Create: `frontend/docs/THEMING.md`
- Modify: `docsplans/UI_UX_AUDIT_2025-11-08.md`

**Step 1: Create theming documentation**

Create file `frontend/docs/THEMING.md`:

```markdown
# Theming Guide

## Overview

The Nexus Check uses **shadcn/ui** theming with the **Slate** color palette and supports light/dark mode.

---

## Color System

### Base Theme: Slate

We use the Slate color palette from Tailwind/shadcn for a professional, neutral appearance.

**Light Mode:**
- Backgrounds: White to light gray
- Text: Dark slate
- Borders: Light gray

**Dark Mode:**
- Backgrounds: Very dark slate
- Text: Light gray to white
- Borders: Medium slate

---

## CSS Variables

All colors are defined as CSS variables in `app/globals.css`:

### Light Mode (`:root`)

\`\`\`css
--background: 0 0% 100%;        /* White */
--foreground: 222.2 47.4% 11.2%; /* Dark slate */
--primary: 222.2 47.4% 11.2%;    /* Dark slate */
--secondary: 210 40% 96.1%;      /* Very light blue-gray */
--muted: 210 40% 96.1%;          /* Very light blue-gray */
--accent: 210 40% 96.1%;         /* Very light blue-gray */
--destructive: 0 84.2% 60.2%;    /* Red */
--border: 214.3 31.8% 91.4%;     /* Light gray */
\`\`\`

### Dark Mode (`.dark`)

\`\`\`css
--background: 222.2 84% 4.9%;    /* Very dark slate */
--foreground: 210 40% 98%;       /* Almost white */
--primary: 210 40% 98%;          /* Light */
--secondary: 217.2 32.6% 17.5%;  /* Dark gray */
--muted: 217.2 32.6% 17.5%;      /* Dark gray */
--accent: 217.2 32.6% 17.5%;     /* Dark gray */
--destructive: 0 62.8% 30.6%;    /* Dark red */
--border: 217.2 32.6% 17.5%;     /* Medium slate */
\`\`\`

---

## Using Colors in Components

### Semantic Color Variables (Recommended)

Use semantic variables that automatically switch with theme:

\`\`\`tsx
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
\`\`\`

### Tailwind Dark Mode Classes

For custom colors, use dark mode variants:

\`\`\`tsx
<div className="bg-white dark:bg-slate-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
  <div className="border border-gray-200 dark:border-slate-700" />
</div>
\`\`\`

---

## Common Patterns

### Backgrounds

\`\`\`tsx
/* Cards, containers */
bg-white dark:bg-slate-900

/* Subtle backgrounds */
bg-gray-50 dark:bg-slate-800

/* Hover states */
hover:bg-gray-100 dark:hover:bg-slate-800

/* Success backgrounds */
bg-green-50 dark:bg-green-900/10

/* Error backgrounds */
bg-red-50 dark:bg-red-900/10

/* Info backgrounds */
bg-blue-50 dark:bg-blue-900/10
\`\`\`

### Text Colors

\`\`\`tsx
/* Primary text */
text-gray-900 dark:text-gray-100

/* Secondary text */
text-gray-700 dark:text-gray-300

/* Tertiary text */
text-gray-600 dark:text-gray-400

/* Muted text */
text-gray-500 dark:text-gray-500
\`\`\`

### Borders

\`\`\`tsx
/* Default borders */
border-gray-200 dark:border-slate-700

/* Subtle borders */
border-gray-300 dark:border-slate-600

/* Input borders */
border-gray-300 dark:border-slate-700
\`\`\`

---

## Theme Toggle

### Using ThemeToggle Component

\`\`\`tsx
import { ThemeToggle } from '@/components/theme-toggle'

<ThemeToggle />
\`\`\`

### Using useTheme Hook

\`\`\`tsx
import { useTheme } from 'next-themes'

function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme('dark')}>
      Switch to dark mode
    </button>
  )
}
\`\`\`

---

## Best Practices

### 1. Always Test Both Modes

When creating or modifying components, test in both light and dark mode.

### 2. Use Semantic Variables

Prefer `bg-background` over `bg-white` when possible. Semantic variables adapt automatically.

### 3. Maintain Contrast

Ensure text has sufficient contrast against backgrounds in both modes:
- Light mode: Dark text on light background
- Dark mode: Light text on dark background

### 4. Use Opacity for Colored Backgrounds

In dark mode, use opacity for colored backgrounds to prevent overwhelming colors:

\`\`\`tsx
bg-green-50 dark:bg-green-900/10
\`\`\`

### 5. Don't Hardcode Shadows

Use Tailwind's shadow utilities - they adapt to theme:

\`\`\`tsx
shadow-sm  /* Works in both modes */
shadow-lg  /* Works in both modes */
\`\`\`

---

## Troubleshooting

### Theme not persisting

- Check localStorage in DevTools
- Verify ThemeProvider is in layout
- Ensure `suppressHydrationWarning` on html tag

### Flash of wrong theme

- Add `disableTransitionOnChange` to ThemeProvider
- Ensure theme script loads before content

### Colors not switching

- Check if using hardcoded colors instead of dark: variants
- Verify CSS variables are defined in globals.css
- Check if `.dark` class is being applied to html element

---

## Future: User-Selectable Color Palettes

See Segment 4 implementation plan for allowing users to choose from multiple color palettes (zinc, stone, blue, etc.).

---

Last Updated: 2025-11-08
\`\`\`

**Step 2: Update UI/UX audit**

In `docsplans/UI_UX_AUDIT_2025-11-08.md`, add a new section:

\`\`\`markdown
### ✅ Additional Features - Segment 3 Completed (2025-11-08)

**Dark/Light Mode & Slate Theme:**

1. **Dark Mode Implementation**
   - Installed next-themes package
   - Created ThemeProvider wrapper
   - Added ThemeToggle component to navigation
   - Supports Light, Dark, and System preferences
   - Theme persists across sessions

2. **Slate Color Palette**
   - Replaced default colors with Slate theme
   - Professional neutral appearance
   - Optimized for readability in both modes
   - HSL format for consistency

3. **Component Updates**
   - All pages support dark mode
   - Authentication pages include theme toggle
   - Stat cards, navigation, forms all tested
   - Consistent styling across light/dark modes

**New Files:**
- `components/theme-provider.tsx`: ThemeProvider wrapper
- `components/theme-toggle.tsx`: Theme switcher component
- `frontend/docs/THEMING.md`: Complete theming guide

**Modified Files:**
- `app/globals.css`: Slate theme CSS variables
- `app/layout.tsx`: Added ThemeProvider
- `components/layout/AppNav.tsx`: Added ThemeToggle
- `app/login/page.tsx`: Dark mode support
- `app/signup/page.tsx`: Dark mode support
- [All other components]: Dark mode variants

**Impact:**
- **User preference**: Respects system theme or user choice
- **Professional appearance**: Modern dark mode implementation
- **Accessibility**: Better for different lighting conditions
- **Brand consistency**: Slate theme across all pages
\`\`\`

**Step 3: Commit**

\`\`\`bash
git add frontend/docs/THEMING.md docsplans/UI_UX_AUDIT_2025-11-08.md
git commit -m "docs: add theming guide and update UI/UX audit

Created comprehensive theming documentation:
- Color system overview
- CSS variables reference
- Common patterns and best practices
- Troubleshooting guide

Updated UI/UX audit with Segment 3 completion.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
\`\`\`

---

## Summary

**What was built:**
1. ✅ Installed next-themes package
2. ✅ Created ThemeProvider wrapper
3. ✅ Added theme toggle component
4. ✅ Implemented slate color palette
5. ✅ Updated all pages for dark mode
6. ✅ Created theming documentation

**Total commits:** ~10-12 (depending on component updates)

**Testing:** Comprehensive dark mode testing checklist

**Ready for:** Segment 4 (User-Selectable Color Palettes) - OPTIONAL

---

## Notes for Engineer

**Key files:**
- `components/theme-provider.tsx` - Theme context wrapper
- `components/theme-toggle.tsx` - UI for switching themes
- `app/globals.css` - All color definitions
- `frontend/docs/THEMING.md` - Complete guide

**Testing tips:**
- Test in both Chrome and Firefox
- Check system preference detection
- Verify localStorage persistence
- Test all pages in both modes
- Check contrast with browser tools

**Common issues:**
- If theme doesn't persist: Check ThemeProvider config
- If colors don't switch: Check for hardcoded values
- If flash on load: Ensure suppressHydrationWarning set
- If toggle doesn't work: Check useTheme hook usage
