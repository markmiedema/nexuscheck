# Semantic Color System Migration Implementation Plan

> **CRITICAL:** This plan addresses OKLCH/HSL compatibility, removes brittle line-number dependencies, and provides pattern-based replacements for reliable implementation.

**Goal:** Migrate entire frontend from hardcoded colors to OKLCH semantic tokens for consistent theming

**Architecture:** Extend globals.css with missing semantic tokens (success, warning, info), then systematically replace all hardcoded color classes across 18+ files with semantic equivalents. This eliminates manual dark mode variants and ensures theme consistency.

**Tech Stack:** Tailwind CSS + OKLCH color space + CSS custom properties

---

## Problem Summary

**Current State (40/100):**
- ✅ Excellent OKLCH foundation in globals.css
- ✅ UI components use semantic tokens correctly
- ❌ Page/feature components bypass theme with hardcoded colors
- ❌ Missing semantic tokens: `--success`, `--warning`, `--info`
- ❌ Heavy use of manual `dark:` variants (maintenance nightmare)
- ❌ Inconsistent status colors across components
- ❌ USMap uses hex colors (completely bypasses theme)
- ⚠️ Tailwind config uses `hsl()` wrapper but globals.css uses direct OKLCH values

**Files Affected:** 18+ page and component files

---

## CRITICAL: OKLCH Format Compatibility

**Current Tailwind Config Issue:**
```javascript
// tailwind.config.js uses HSL wrapper:
background: "hsl(var(--background))"  // ❌ Won't work with OKLCH values

// But globals.css uses direct OKLCH:
--background: oklch(0.45 0.04 257);   // ✓ Current format
```

**Solution:** We'll keep OKLCH format in CSS variables and update Tailwind config to use direct variable references without HSL wrapper.

---

## Task 1: Fix Tailwind Config & Add Semantic Tokens

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/app/globals.css`

### Step 1: Update Tailwind Config for OKLCH Compatibility

**Current config uses HSL wrapper which is incompatible with OKLCH values.**

Read `frontend/tailwind.config.js` and verify the colors section (lines 19-52).

Replace the entire `colors` object in the `extend` section with:

```javascript
colors: {
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: {
    DEFAULT: "var(--primary)",
    foreground: "var(--primary-foreground)",
  },
  secondary: {
    DEFAULT: "var(--secondary)",
    foreground: "var(--secondary-foreground)",
  },
  destructive: {
    DEFAULT: "var(--destructive)",
    foreground: "var(--destructive-foreground)",
  },
  muted: {
    DEFAULT: "var(--muted)",
    foreground: "var(--muted-foreground)",
  },
  accent: {
    DEFAULT: "var(--accent)",
    foreground: "var(--accent-foreground)",
  },
  popover: {
    DEFAULT: "var(--popover)",
    foreground: "var(--popover-foreground)",
  },
  card: {
    DEFAULT: "var(--card)",
    foreground: "var(--card-foreground)",
  },
  // NEW: Success, Warning, Info tokens
  success: {
    DEFAULT: "var(--success)",
    foreground: "var(--success-foreground)",
  },
  warning: {
    DEFAULT: "var(--warning)",
    foreground: "var(--warning-foreground)",
  },
  info: {
    DEFAULT: "var(--info)",
    foreground: "var(--info-foreground)",
  },
},
```

**Key change:** Removed `hsl()` wrapper - now uses direct `var()` references compatible with OKLCH.

### Step 2: Add Missing Semantic Tokens to globals.css (Light Mode)

Read `frontend/app/globals.css` and locate the `:root` section (should be around lines 6-55).

After the `--ring` definition (around line 44), add these new semantic tokens:

```css
    /* Success State */
    --success: oklch(0.60 0.15 155);              /* Green for success (muted, not vibrant) */
    --success-foreground: oklch(0.98 0.00 248);   /* Slate-50: Light text */

    /* Warning State */
    --warning: oklch(0.70 0.12 95);               /* Amber for warnings (muted) */
    --warning-foreground: oklch(0.21 0.04 266);   /* Slate-900: Dark text for contrast */

    /* Info State */
    --info: oklch(0.60 0.10 255);                 /* Blue-slate for info (subtle) */
    --info-foreground: oklch(0.98 0.00 248);      /* Slate-50: Light text */
```

**Color Philosophy:**
- Hues chosen to complement existing slate-based palette (hue 257)
- Lower chroma (0.10-0.15) for muted, professional look
- Success: Green (hue 155) - natural semantic meaning
- Warning: Amber (hue 95) - attention-grabbing but not alarming
- Info: Blue-slate (hue 255) - close to slate hue, subtle differentiation

### Step 3: Add Missing Semantic Tokens to globals.css (Dark Mode)

In the `.dark` section (around lines 57-103), after the `--ring` definition (around line 95), add:

```css
    /* Success State */
    --success: oklch(0.65 0.15 155);              /* Brighter green for dark backgrounds */
    --success-foreground: oklch(0.98 0.00 248);   /* Slate-50: Light text */

    /* Warning State */
    --warning: oklch(0.75 0.12 95);               /* Brighter amber for visibility */
    --warning-foreground: oklch(0.21 0.04 266);   /* Slate-900: Dark text */

    /* Info State */
    --info: oklch(0.65 0.12 255);                 /* Brighter blue-slate */
    --info-foreground: oklch(0.98 0.00 248);      /* Slate-50: Light text */
```

**Dark Mode Adjustments:**
- Slightly higher lightness (60% → 65%, 70% → 75%) for visibility against dark backgrounds
- Same hues and chroma for consistency
- Light foreground text (slate-50) for readability

### Step 4: Test Configuration

Stop existing dev server (Ctrl+C if running), clear cache, and restart:

```bash
cd frontend
rm -rf .next
npm run dev
```

**Expected:** Server starts with no Tailwind config errors.

**Verify in browser DevTools:**
1. Open http://localhost:3000
2. Open DevTools → Console
3. No CSS variable errors
4. Inspect any element → Computed styles → Check that `--success`, `--warning`, `--info` are defined

### Step 5: Commit Foundation

```bash
git add frontend/tailwind.config.js frontend/app/globals.css
git commit -m "$(cat <<'EOF'
feat(theme): add success/warning/info tokens, fix OKLCH compatibility

- Remove hsl() wrapper from Tailwind config for OKLCH compatibility
- Add --success, --warning, --info semantic tokens with muted palette
- Use slate-adjacent hues (155, 95, 255) for brand consistency
- Optimize lightness/chroma for both light and dark modes
EOF
)"
```

---

## Task 2: Fix USMap Component (CRITICAL - Uses Hex Colors)

**Why First:** This component completely bypasses the theme system with hardcoded hex colors. Fixing it early establishes the pattern for status color usage.

**Files:**
- Modify: `frontend/components/dashboard/USMap.tsx`

### Step 1: Locate USMap Component

```bash
find frontend/components -name "*Map*.tsx" -type f
```

Expected output: Path to USMap component

### Step 2: Read Current Implementation

Use Read tool to examine the file and identify:
- Hex color definitions (likely `#EF4444`, `#FBBF24`, `#10B981`)
- Where colors are applied (probably in fill logic)
- Any hardcoded gray backgrounds

### Step 3: Replace Hex Colors with Semantic Tokens

**Pattern to find:**
```tsx
// ❌ Hardcoded hex colors (likely in a getFillColor or similar function)
case 'has_nexus': return '#EF4444'    // Red
case 'approaching': return '#FBBF24'   // Yellow
default: return '#10B981'              // Green
```

**Replace with:**
```tsx
// ✓ Semantic tokens
case 'has_nexus': return 'hsl(var(--destructive))'
case 'approaching': return 'hsl(var(--warning))'
default: return 'hsl(var(--success))'
```

**Note:** Since SVG fill requires color strings (not CSS classes), we must use `hsl(var(--variable))` format for inline styles or JavaScript-generated colors.

### Step 4: Replace Tooltip/Legend Colors

**Pattern to find:**
```tsx
// ❌ Hardcoded backgrounds
className="bg-gray-900 text-white"
```

**Replace with:**
```tsx
// ✓ Semantic tokens
className="bg-popover text-popover-foreground border border-border"
```

### Step 5: Test Map Rendering

```bash
npm run dev
```

Visit page with map component and verify:
- ✓ States with nexus show destructive color (red-ish)
- ✓ Approaching states show warning color (amber-ish)
- ✓ No nexus states show success color (green-ish)
- ✓ Colors change appropriately when toggling dark mode
- ✓ Tooltips use theme colors

**DevTools verification:**
1. Inspect SVG path element
2. Check `fill` attribute value
3. Should reference CSS variable, not hex code

### Step 6: Commit

```bash
git add frontend/components/dashboard/USMap.tsx
git commit -m "refactor(USMap): replace hex colors with semantic tokens"
```

---

## Task 3: Fix StateTable Component (40+ violations)

**Files:**
- Modify: `frontend/components/analysis/StateTable.tsx`

### Step 1: Read Current File

Use Read tool to examine `frontend/components/analysis/StateTable.tsx` and identify all hardcoded color patterns.

### Step 2: Replace Table Container Colors

**Pattern to find:**
```tsx
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
```

**Replace with:**
```tsx
<div className="bg-card border border-border">
```

**Pattern to find:**
```tsx
<div className="text-gray-900 dark:text-gray-100">
```

**Replace with:**
```tsx
<div className="text-card-foreground">
```

### Step 3: Replace Search Input Colors

**Pattern to find:**
```tsx
className="text-gray-400"  // Icon color
className="border-gray-200 focus:border-gray-400 focus:ring-gray-400"  // Input styling
```

**Replace with:**
```tsx
className="text-muted-foreground"  // Icon color
className="border-input focus:border-ring focus:ring-ring"  // Input styling
```

### Step 4: Replace Table Header Colors

**Pattern to find:**
```tsx
className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
```

**Replace with:**
```tsx
className="bg-muted/50 hover:bg-muted/70"
className="text-muted-foreground hover:text-foreground"
```

### Step 5: Replace Sort Icon Colors

**Pattern to find:**
```tsx
className="text-gray-400 dark:text-gray-500"  // Inactive sort
className="text-gray-700 dark:text-gray-300"  // Active sort
```

**Replace with:**
```tsx
className="text-muted-foreground"  // Inactive sort
className="text-foreground"  // Active sort
```

### Step 6: Replace Status Badge Colors

**Pattern to find (this is the most important change):**
```tsx
// ❌ Hardcoded status colors
state.nexus_type === 'both'
  ? 'bg-purple-500/10 text-purple-400'
  : state.nexus_type === 'physical'
  ? 'bg-info-500/10 text-info-400'
  : state.nexus_type === 'economic'
  ? 'bg-red-500/10 text-red-400'
  : state.nexus_status === 'approaching'
  ? 'bg-yellow-500/10 text-yellow-400'
  : 'bg-green-500/10 text-green-400'
```

**Replace with:**
```tsx
// ✓ Semantic tokens
state.nexus_type === 'both'
  ? 'bg-info/10 text-info-foreground border border-info/20'
  : state.nexus_type === 'physical'
  ? 'bg-info/5 text-info-foreground border border-info/10'
  : state.nexus_type === 'economic'
  ? 'bg-destructive/10 text-destructive-foreground border border-destructive/20'
  : state.nexus_status === 'approaching'
  ? 'bg-warning/10 text-warning-foreground border border-warning/20'
  : 'bg-success/10 text-success-foreground border border-success/20'
```

### Step 7: Replace Nexus Status Dots

**Pattern to find:**
```tsx
// ❌ Hardcoded red/green dots
className={`w-2 h-2 rounded-full ${
  state.nexus_status === 'has_nexus' ? 'bg-red-500' : 'bg-green-500'
}`}
```

**Replace with:**
```tsx
// ✓ Semantic tokens
className={`w-2 h-2 rounded-full ${
  state.nexus_status === 'has_nexus' ? 'bg-destructive' : 'bg-success'
}`}
```

### Step 8: Replace Table Row Colors

**Pattern to find:**
```tsx
className="hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700"
className="text-gray-500 dark:text-gray-400"  // Secondary text
className="text-gray-900 dark:text-gray-100"  // Primary text
```

**Replace with:**
```tsx
className="hover:bg-muted/30 border-b border-border"
className="text-muted-foreground"  // Secondary text
className="text-card-foreground"  // Primary text
```

### Step 9: Replace Threshold Percentage Colors

**Pattern to find:**
```tsx
// ❌ Hardcoded color logic
className={`text-xs font-medium ${
  state.threshold_percent >= 100
    ? 'text-red-600 dark:text-red-400'
    : state.threshold_percent >= 80
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-green-600 dark:text-green-400'
}`}
```

**Replace with:**
```tsx
// ✓ Semantic tokens
className={`text-xs font-medium ${
  state.threshold_percent >= 100
    ? 'text-destructive'
    : state.threshold_percent >= 80
    ? 'text-warning'
    : 'text-success'
}`}
```

### Step 10: Replace Action Button Colors

**Pattern to find:**
```tsx
className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
```

**Replace with:**
```tsx
className="text-foreground hover:text-foreground hover:bg-muted"
```

### Step 11: Replace Pagination Colors

**Pattern to find:**
```tsx
className="border-gray-200 dark:border-gray-700"  // Pagination container
className="text-gray-600 dark:text-gray-400"      // Page info text
className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"  // Buttons
```

**Replace with:**
```tsx
className="border-border"  // Pagination container
className="text-muted-foreground"  // Page info text
className="border-border text-foreground hover:bg-muted"  // Buttons
```

### Step 12: Test StateTable

Clear cache and restart dev server:
```bash
rm -rf .next
npm run dev
```

Navigate to any page with StateTable component and verify:
- ✓ Table background uses card color
- ✓ Headers have subtle muted background
- ✓ Status badges use semantic colors (red/amber/green visible)
- ✓ Hover states work smoothly
- ✓ Dark mode toggle transitions smoothly without color jumps
- ✓ All text remains readable in both modes

**DevTools verification:**
1. Inspect table element
2. Computed styles → background-color
3. Should see CSS variable reference, not hardcoded value

### Step 13: Commit

```bash
git add frontend/components/analysis/StateTable.tsx
git commit -m "refactor(StateTable): migrate to semantic color tokens"
```

---

## Task 4: Fix New Analysis Page (50+ violations)

**Files:**
- Modify: `frontend/app/analysis/new/page.tsx`

### Step 1: Read Current File

Use Read tool to examine the file and identify all hardcoded patterns.

### Step 2: Replace Page Container & Cards

**Pattern to find:**
```tsx
className="bg-white rounded-lg shadow-sm border border-gray-200"
className="text-gray-900"
```

**Replace with:**
```tsx
className="bg-card rounded-lg shadow-sm border border-border"
className="text-card-foreground"
```

### Step 3: Replace Error Banners

**Pattern to find:**
```tsx
className="bg-red-50 border border-red-200"
className="text-red-800"
```

**Replace with:**
```tsx
className="bg-destructive/10 border border-destructive/20"
className="text-destructive-foreground"
```

### Step 4: Replace Section Headers

**Pattern to find:**
```tsx
className="text-gray-900 border-b"
```

**Replace with:**
```tsx
className="text-card-foreground border-b border-border"
```

### Step 5: Replace Form Labels

**Pattern to find:**
```tsx
className="text-gray-700"  // Labels
className="text-red-500"   // Required asterisks
```

**Replace with:**
```tsx
className="text-foreground"
className="text-destructive"
```

### Step 6: Replace Input Styling

**Pattern to find:**
```tsx
className="border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-400 focus:border-gray-400"
```

**Replace with:**
```tsx
className="border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
```

### Step 7: Replace Validation Errors

**Pattern to find:**
```tsx
className="text-red-600"
```

**Replace with:**
```tsx
className="text-destructive"
```

### Step 8: Replace Radio Button Containers

**Pattern to find:**
```tsx
className="border border-gray-300 rounded-md hover:bg-gray-50"
className="text-gray-900"  // Radio labels
```

**Replace with:**
```tsx
className="border border-input rounded-md hover:bg-muted/50"
className="text-foreground"
```

### Step 9: Replace Radio Inputs

**Pattern to find:**
```tsx
className="text-gray-900 focus:ring-gray-400 border-gray-300"
```

**Replace with:**
```tsx
className="text-primary focus:ring-ring border-input"
```

### Step 10: Replace State Registration List

**Pattern to find:**
```tsx
className="bg-gray-50 rounded-md border border-gray-200"  // List container
className="text-gray-900"  // State name
className="text-gray-600"  // Registration date
className="text-red-600 hover:text-red-800"  // Remove button
```

**Replace with:**
```tsx
className="bg-muted rounded-md border border-border"
className="text-foreground"
className="text-muted-foreground"
className="text-destructive hover:text-destructive/80"
```

### Step 11: Replace Add State Button

**Pattern to find:**
```tsx
className="text-gray-900 hover:text-gray-900"
```

**Replace with:**
```tsx
className="text-primary hover:text-primary/80"
```

### Step 12: Replace Add State Form

**Pattern to find:**
```tsx
className="border border-gray-300"  // Form border
className="bg-gray-900 text-white hover:bg-gray-800"  // Add button
className="bg-gray-200 text-gray-700 hover:bg-gray-300"  // Cancel button
```

**Replace with:**
```tsx
className="border border-input"
className="bg-primary text-primary-foreground hover:bg-primary/90"
className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
```

### Step 13: Replace File Upload Zone

**Pattern to find:**
```tsx
className="border-gray-300 hover:border-gray-400 hover:bg-gray-50/50"  // Upload area
className="text-gray-400"  // Icon
className="text-gray-700"  // Upload text
className="text-gray-500"  // Helper text
className="border-b-2 border-gray-400"  // Loading spinner
className="text-gray-600"  // Loading text
```

**Replace with:**
```tsx
className="border-border hover:border-ring hover:bg-muted/50"
className="text-muted-foreground"
className="text-foreground"
className="text-muted-foreground"
className="border-b-2 border-primary"
className="text-muted-foreground"
```

### Step 14: Replace Success States

**Pattern to find:**
```tsx
className="bg-green-50 border border-green-200"  // Success banner
className="text-green-600"  // Icon
className="text-green-900"  // Heading
className="text-green-700"  // Message
```

**Replace with:**
```tsx
className="bg-success/10 border border-success/20"
className="text-success"
className="text-success-foreground"
className="text-success-foreground"
```

### Step 15: Replace Upload Error State

**Pattern to find:**
```tsx
className="bg-red-50 border border-red-200"
className="text-red-800"
```

**Replace with:**
```tsx
className="bg-destructive/10 border border-destructive/20"
className="text-destructive-foreground"
```

### Step 16: Replace Loading Overlay

**Pattern to find:**
```tsx
className="bg-white"  // Overlay background
className="border-b-2 border-gray-400"  // Spinner
className="text-gray-900"  // Loading heading
className="text-gray-600"  // Loading message
```

**Replace with:**
```tsx
className="bg-card"
className="border-b-2 border-primary"
className="text-card-foreground"
className="text-muted-foreground"
```

### Step 17: Test New Analysis Form

```bash
rm -rf .next
npm run dev
```

Navigate to `/analysis/new` and test:
- ✓ Form renders with consistent theme
- ✓ Input focus states use ring color
- ✓ Validation errors show destructive color
- ✓ File upload states (success/error) use semantic colors
- ✓ Dark mode transitions smoothly
- ✓ All text remains readable

### Step 18: Commit

```bash
git add frontend/app/analysis/new/page.tsx
git commit -m "refactor(new-analysis): migrate to semantic color tokens"
```

---

## Task 5: Fix Results Page (35+ violations)

**Files:**
- Modify: `frontend/app/analysis/[id]/results/page.tsx`

### Step 1: Read Current File

Use Read tool to examine the file.

### Step 2: Replace Loading Spinner

**Pattern to find:**
```tsx
className="border-b-2 border-gray-400"
className="text-gray-600"
```

**Replace with:**
```tsx
className="border-b-2 border-primary"
className="text-muted-foreground"
```

### Step 3: Replace Header Card

**Pattern to find:**
```tsx
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
className="text-gray-900 dark:text-gray-100"
className="text-gray-500 dark:text-gray-400"
className="text-gray-600 dark:text-gray-300"
```

**Replace with:**
```tsx
className="bg-card border border-border"
className="text-card-foreground"
className="text-muted-foreground"
className="text-muted-foreground"
```

### Step 4: Replace Summary Cards

**Pattern to find (appears in 3 cards):**
```tsx
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
className="text-gray-600 dark:text-gray-400"
className="text-gray-900 dark:text-gray-100"
className="text-gray-500 dark:text-gray-400"
```

**Replace with:**
```tsx
className="bg-card border border-border"
className="text-muted-foreground"
className="text-card-foreground"
className="text-muted-foreground"
```

### Step 5: Replace Map Container

**Pattern to find:**
```tsx
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
className="text-gray-900 dark:text-gray-100"
className="text-gray-600 dark:text-gray-300"
```

**Replace with:**
```tsx
className="bg-card border border-border"
className="text-card-foreground"
className="text-muted-foreground"
```

### Step 6: Replace Map Legend (CRITICAL)

**Pattern to find:**
```tsx
// ❌ Hardcoded status colors in legend
<div className="w-4 h-4 rounded bg-red-500"></div>
<span className="text-gray-600 dark:text-gray-300">Has Nexus</span>

<div className="w-4 h-4 rounded bg-yellow-500"></div>
<span className="text-gray-600 dark:text-gray-300">Approaching</span>

<div className="w-4 h-4 rounded bg-green-500"></div>
<span className="text-gray-600 dark:text-gray-300">No Nexus</span>
```

**Replace with:**
```tsx
// ✓ Semantic tokens
<div className="w-4 h-4 rounded bg-destructive"></div>
<span className="text-muted-foreground">Has Nexus</span>

<div className="w-4 h-4 rounded bg-warning"></div>
<span className="text-muted-foreground">Approaching</span>

<div className="w-4 h-4 rounded bg-success"></div>
<span className="text-muted-foreground">No Nexus</span>
```

### Step 7: Replace Empty Map State

**Pattern to find:**
```tsx
className="bg-gray-100 dark:bg-gray-700"
className="text-gray-400 dark:text-gray-500"
className="text-gray-700 dark:text-gray-300"
className="text-gray-500 dark:text-gray-400"
```

**Replace with:**
```tsx
className="bg-muted"
className="text-muted-foreground"
className="text-foreground"
className="text-muted-foreground"
```

### Step 8: Replace Nexus Breakdown Card

**Pattern to find:**
```tsx
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
className="text-gray-900 dark:text-gray-100"
className="text-gray-700 dark:text-gray-300"
className="text-gray-600 dark:text-gray-300"
className="text-gray-500 dark:text-gray-400"
```

**Replace with:**
```tsx
className="bg-card border border-border"
className="text-card-foreground"
className="text-foreground"
className="text-muted-foreground"
className="text-muted-foreground"
```

### Step 9: Replace Warning Banner

**Pattern to find:**
```tsx
className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
className="text-yellow-900 dark:text-yellow-200"
className="text-yellow-800 dark:text-yellow-300"
```

**Replace with:**
```tsx
className="bg-warning/10 border border-warning/20"
className="text-warning-foreground"
className="text-warning-foreground"
```

### Step 10: Test Results Page

```bash
rm -rf .next
npm run dev
```

Navigate to `/analysis/[any-id]/results` and verify:
- ✓ All cards use card background
- ✓ Map legend colors match map state colors
- ✓ Warning banners use warning color
- ✓ Summary metrics are readable
- ✓ Dark mode transitions smoothly

### Step 11: Commit

```bash
git add frontend/app/analysis/[id]/results/page.tsx
git commit -m "refactor(results): migrate to semantic color tokens"
```

---

## Task 6: Fix Mapping Page (30+ violations)

**Files:**
- Modify: `frontend/app/analysis/[id]/mapping/page.tsx`

### Step 1: Read Current File

Use Read tool to examine the file.

### Step 2: Apply Gray Scale Replacements

**Common patterns to find and replace:**

| Pattern | Replacement |
|---------|-------------|
| `bg-white dark:bg-gray-800` | `bg-card` |
| `text-gray-900 dark:text-gray-100` | `text-card-foreground` |
| `text-gray-600 dark:text-gray-400` | `text-muted-foreground` |
| `text-gray-700 dark:text-gray-300` | `text-foreground` |
| `border-gray-200 dark:border-gray-700` | `border-border` |
| `bg-gray-50 dark:bg-gray-700` | `bg-muted` |
| `bg-gray-100 dark:bg-gray-600` | `bg-muted/70` |
| `hover:bg-gray-50 dark:hover:bg-gray-700` | `hover:bg-muted` |

### Step 3: Replace Validation State Colors

**Pattern to find:**
```tsx
// Success states
className="bg-green-50 border-green-200 text-green-800"
className="text-green-600"

// Error states
className="bg-red-50 border-red-200 text-red-800"
className="text-red-600"

// Warning states
className="bg-yellow-50 border-yellow-200 text-yellow-800"
className="text-yellow-600"
```

**Replace with:**
```tsx
// Success states
className="bg-success/10 border-success/20 text-success-foreground"
className="text-success"

// Error states
className="bg-destructive/10 border-destructive/20 text-destructive-foreground"
className="text-destructive"

// Warning states
className="bg-warning/10 border-warning/20 text-warning-foreground"
className="text-warning"
```

### Step 4: Replace Background Gradients

**Pattern to find:**
```tsx
className="bg-gradient-to-r from-gray-50 to-gray-100"
```

**Replace with:**
```tsx
className="bg-gradient-to-r from-muted/50 to-muted"
```

### Step 5: Test Mapping Page

```bash
rm -rf .next
npm run dev
```

Navigate to `/analysis/[any-id]/mapping` and verify:
- ✓ Form inputs use semantic colors
- ✓ Validation states (success/error/warning) are clearly visible
- ✓ Dark mode transitions smoothly

### Step 6: Commit

```bash
git add frontend/app/analysis/[id]/mapping/page.tsx
git commit -m "refactor(mapping): migrate to semantic color tokens"
```

---

## Task 7: Fix Authentication Pages

**Files:**
- Modify: `frontend/app/login/page.tsx`
- Modify: `frontend/app/signup/page.tsx`

### Step 1: Fix Login Page

Read `frontend/app/login/page.tsx` and apply these replacements:

**Error Banners:**
```tsx
// ❌ Find:
className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400"

// ✓ Replace:
className="bg-destructive/10 border-destructive/20 text-destructive-foreground"
```

**Form Container:**
```tsx
// ❌ Find:
className="bg-card text-foreground border-border"

// ✓ Already correct - verify it uses semantic tokens
```

**Input Labels:**
```tsx
// ❌ Find:
className="text-gray-700 dark:text-gray-300"

// ✓ Replace:
className="text-foreground"
```

**Input Fields:**
```tsx
// ❌ Find:
className="border-gray-300 focus:ring-gray-400"

// ✓ Replace:
className="border-input focus:ring-ring"
```

### Step 2: Fix Signup Page

Read `frontend/app/signup/page.tsx` and apply replacements:

**Success Messages:**
```tsx
// ❌ Find:
className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"

// ✓ Replace:
className="bg-success/10 text-success-foreground"
```

**Form Labels:**
```tsx
// ❌ Find:
className="text-gray-700 dark:text-gray-300"

// ✓ Replace:
className="text-foreground"
```

**Helper Text:**
```tsx
// ❌ Find:
className="text-gray-600 dark:text-gray-400"

// ✓ Replace:
className="text-muted-foreground"
```

**Password Requirements:**
```tsx
// ❌ Find:
className="text-red-600" // Invalid
className="text-green-600" // Valid

// ✓ Replace:
className="text-destructive"
className="text-success"
```

### Step 3: Test Authentication Pages

```bash
rm -rf .next
npm run dev
```

Test both pages:
- `/login` - Check error states, form styling
- `/signup` - Check success messages, validation indicators

### Step 4: Commit

```bash
git add frontend/app/login/page.tsx frontend/app/signup/page.tsx
git commit -m "refactor(auth): migrate login/signup to semantic color tokens"
```

---

## Task 8: Fix Analyses List & Dashboard

**Files:**
- Modify: `frontend/app/analyses/page.tsx`
- Modify: `frontend/app/dashboard/page.tsx` (if exists)

### Step 1: Fix Analyses List Page

Read `frontend/app/analyses/page.tsx` and apply replacements:

**Status Badges:**
```tsx
// ❌ Find:
state.status === 'complete'
  ? 'bg-green-500/10 text-green-400 border-green-500/20'
  : 'bg-red-500/10 text-red-400 border-red-500/20'

// ✓ Replace:
state.status === 'complete'
  ? 'bg-success/10 text-success-foreground border-success/20'
  : 'bg-destructive/10 text-destructive-foreground border-destructive/20'
```

**Delete Button Hover:**
```tsx
// ❌ Find:
className="hover:text-red-600 dark:hover:text-red-400"

// ✓ Replace:
className="hover:text-destructive"
```

**List Items:**
```tsx
// ❌ Find:
className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"

// ✓ Replace:
className="bg-card hover:bg-muted/30"
```

### Step 2: Fix Dashboard Page (if exists)

If dashboard page exists, apply same pattern replacements as above.

### Step 3: Test

```bash
rm -rf .next
npm run dev
```

Navigate to `/analyses` and verify status badges and list styling.

### Step 4: Commit

```bash
git add frontend/app/analyses/page.tsx
git commit -m "refactor(analyses): migrate to semantic color tokens"

# If dashboard exists:
git add frontend/app/dashboard/page.tsx
git commit -m "refactor(dashboard): migrate to semantic color tokens"
```

---

## Task 9: Fix Remaining Analysis Component Files

**Files:**
- Modify: `frontend/components/layout/AppNav.tsx`
- Modify: `frontend/components/analysis/ComplianceSection.tsx` (if exists)
- Modify: `frontend/components/analysis/DateConfirmationDialog.tsx` (if exists)
- Modify: `frontend/components/analysis/LiabilityBreakdown.tsx` (if exists)
- Modify: `frontend/components/analysis/StateDetailHeader.tsx` (if exists)
- Modify: `frontend/components/analysis/TransactionTable.tsx` (if exists)

### Step 1: Fix AppNav Component

Read `frontend/components/layout/AppNav.tsx`:

**Navigation Link Colors:**
```tsx
// ❌ Find:
className="text-gray-950 dark:text-gray-50"  // Active link
className="text-gray-600 dark:text-gray-400"  // Inactive link

// ✓ Replace:
className="text-foreground"
className="text-muted-foreground"
```

### Step 2: Check for Remaining Component Files

```bash
find frontend/components/analysis -name "*.tsx" -type f
```

For each file found, read and apply standard replacements:
- Gray colors → Semantic equivalents
- Status colors → success/warning/destructive
- Remove all `dark:` variants

### Step 3: Test Navigation & Components

```bash
rm -rf .next
npm run dev
```

Navigate through app and verify:
- ✓ Navigation styling consistent
- ✓ All component colors use theme
- ✓ Dark mode transitions smooth

### Step 4: Commit Each File

```bash
git add frontend/components/layout/AppNav.tsx
git commit -m "refactor(AppNav): migrate to semantic color tokens"

# Repeat for each analysis component found
```

---

## Task 10: Fix Remaining Page Files

**Files:**
- `frontend/app/analysis/[id]/states/page.tsx`
- `frontend/app/analysis/[id]/states/[stateCode]/page.tsx`
- Any other page files with hardcoded colors

### Step 1: Find Remaining Pages with Hardcoded Colors

```bash
cd frontend
grep -r "gray-[0-9]" app/ --include="*.tsx" -l
grep -r "red-[0-9]" app/ --include="*.tsx" -l
grep -r "green-[0-9]" app/ --include="*.tsx" -l
```

### Step 2: Fix Each Page

For each file found, apply standard pattern replacements.

### Step 3: Commit Each File

```bash
git add frontend/app/analysis/[id]/states/page.tsx
git commit -m "refactor(states-list): migrate to semantic color tokens"

git add frontend/app/analysis/[id]/states/[stateCode]/page.tsx
git commit -m "refactor(state-detail): migrate to semantic color tokens"
```

---

## Task 11: Verification and Testing

### Step 1: Search for Remaining Violations

```bash
cd frontend

# Count hardcoded gray colors
echo "Gray colors remaining:"
grep -r "gray-[0-9]" app/ components/ --include="*.tsx" | wc -l

# Count dark: variants (excluding globals.css)
echo "Manual dark variants remaining:"
grep -r "dark:" app/ components/ --include="*.tsx" | wc -l

# Find hex colors
echo "Hex colors remaining:"
grep -r "#[0-9A-Fa-f]\{6\}" app/ components/ --include="*.tsx"
```

**Expected results:**
- Gray colors: 0
- Dark variants: 0 (or very few for edge cases)
- Hex colors: None

### Step 2: Visual Regression Testing Checklist

Test each page in **both light and dark mode**:

**Authentication:**
- ☐ `/login` - Form styling, error states
- ☐ `/signup` - Success messages, validation

**Dashboard & Lists:**
- ☐ `/` or `/dashboard` - Cards, navigation
- ☐ `/analyses` - List items, status badges

**Analysis Workflow:**
- ☐ `/analysis/new` - Form inputs, upload states, validation
- ☐ `/analysis/[id]/mapping` - Validation states
- ☐ `/analysis/[id]/results` - Cards, map, legend, table
- ☐ `/analysis/[id]/states` - State list, status colors
- ☐ `/analysis/[id]/states/[code]` - Detail view

**For each page, verify:**
- ✓ Background colors consistent
- ✓ Text readable in both modes
- ✓ Borders visible but subtle
- ✓ Status colors maintain semantic meaning (red=error, amber=warning, green=success)
- ✓ No color "flashes" when toggling dark mode
- ✓ Focus states (input rings) visible

### Step 3: Dark Mode Toggle Test

For each page:
1. Load page in light mode
2. Toggle to dark mode
3. Verify smooth transition (no flashing)
4. Toggle back to light mode
5. Verify consistency

**Common issues to check:**
- Text disappearing (foreground matches background)
- Borders too faint or invisible
- Status colors lose meaning (all look similar)
- Contrast too low for accessibility

### Step 4: DevTools Verification

Randomly sample 5-10 components and verify in DevTools:

1. Inspect element
2. Computed styles → `background-color`
3. Should see value like: `oklch(0.45 0.04 257)` (from CSS variable)
4. Should NOT see: `rgb(55, 65, 81)` (hardcoded gray-700)

### Step 5: Production Build Test

```bash
cd frontend
npm run build
```

**Expected:** Build succeeds with no Tailwind errors, no CSS warnings.

### Step 6: Accessibility Check

Use browser DevTools Lighthouse:
1. Open any page
2. Run Lighthouse audit (Accessibility category)
3. Check color contrast ratios
4. Should pass WCAG AA standards (4.5:1 for normal text)

**Known issue:** If contrast too low, adjust lightness values in globals.css.

---

## Task 12: Documentation & Completion

### Step 1: Create Completion Summary

Create file: `docs/plans/2025-01-12-semantic-color-migration-complete.md`

Document:
```markdown
# Semantic Color System Migration - Completion Summary

**Date Completed:** [Date]
**Duration:** [X hours]

## Migration Statistics

**Files Modified:** [Count]
**Lines Changed:** ~[Estimate]
**Commits Created:** [Count]

## Before/After

### Color Token Usage
- **Before:** 40% semantic tokens, 60% hardcoded colors
- **After:** 100% semantic tokens

### Manual Dark Mode Variants
- **Before:** ~500 `dark:` class usages
- **After:** 0 (all in globals.css)

### Status Color Consistency
- **Before:** Inconsistent (hex, red-500, green-400 mix)
- **After:** Consistent semantic tokens (success, warning, destructive, info)

## New Semantic Tokens Added

1. `--success` / `--success-foreground` - Green for success states
2. `--warning` / `--warning-foreground` - Amber for warnings
3. `--info` / `--info-foreground` - Blue-slate for info/combined states

## Technical Improvements

✅ Fixed OKLCH/HSL compatibility in Tailwind config
✅ Eliminated all hardcoded gray colors
✅ Replaced hex colors in USMap with semantic tokens
✅ Removed ~500 manual dark mode variants
✅ Standardized status color usage across app

## Remaining Technical Debt

[List any edge cases or intentional exceptions]

## Testing Performed

✅ Visual regression testing (all major pages)
✅ Dark mode toggle testing
✅ Production build verification
✅ DevTools CSS variable verification
✅ Accessibility contrast checking

## Lessons Learned

[Any insights from the migration process]
```

### Step 2: Update Main Plan Document

Add completion note to this file:

```markdown
---
## Migration Status: ✅ COMPLETE

**Completed:** [Date]
**Summary:** docs/plans/2025-01-12-semantic-color-migration-complete.md
---
```

### Step 3: Final Commit

```bash
git add docs/plans/2025-01-12-semantic-color-migration-complete.md
git add docs/plans/2025-01-12-semantic-color-system-migration.md
git commit -m "docs: complete semantic color migration, add summary"
```

### Step 4: Push All Changes

```bash
git push -u origin claude/fix-dark-mode-background-011CV4tBCJJNtRgUAgig98JK
```

---

## Color Mapping Reference Guide

Use this reference throughout all tasks:

### Background Colors

| Hardcoded Pattern | Semantic Token | Use Case |
|-------------------|----------------|----------|
| `white` / `gray-950` | `bg-background` | Page background |
| `white` / `gray-800` | `bg-card` | Card/panel surfaces |
| `gray-50` / `gray-700` | `bg-muted` | Subtle backgrounds, disabled states |
| `gray-100` / `gray-600` | `bg-accent` | Hover states, selected items |
| `gray-900` / `gray-50` | `bg-primary` | Primary buttons, emphasis |

### Text Colors

| Hardcoded Pattern | Semantic Token | Use Case |
|-------------------|----------------|----------|
| `gray-900` / `gray-100` | `text-foreground` | Primary body text |
| `gray-900` / `gray-100` | `text-card-foreground` | Text on card surfaces |
| `gray-600` / `gray-400` | `text-muted-foreground` | Secondary text, labels, metadata |
| `gray-700` / `gray-300` | `text-foreground` | Form labels, section headers |
| `gray-950` / `gray-50` | `text-primary` | Emphasized text, links |

### Border Colors

| Hardcoded Pattern | Semantic Token | Use Case |
|-------------------|----------------|----------|
| `gray-200` / `gray-700` | `border-border` | Standard borders, dividers |
| `gray-300` / `gray-600` | `border-input` | Input field borders |
| `gray-400` / `gray-500` | `border-ring` | Focus rings, active states |

### Status Colors

| Hardcoded Pattern | Semantic Token | Use Case |
|-------------------|----------------|----------|
| `red-500`, `red-600` / `red-400` | `bg-destructive`, `text-destructive` | Errors, has nexus, delete actions |
| `green-500`, `green-600` / `green-400` | `bg-success`, `text-success` | Success, no nexus, completion |
| `yellow-500`, `yellow-600` / `yellow-400` | `bg-warning`, `text-warning` | Warnings, approaching threshold |
| `blue-500`, `purple-500` / `blue-400`, `purple-400` | `bg-info`, `text-info` | Info messages, combined nexus |

### Status Background Patterns

| Hardcoded Pattern | Semantic Token | Use Case |
|-------------------|----------------|----------|
| `bg-red-50` / `bg-red-900/10` | `bg-destructive/10` | Error banner backgrounds |
| `text-red-800` / `text-red-400` | `text-destructive-foreground` | Text on error backgrounds |
| `border-red-200` / `border-red-800` | `border-destructive/20` | Error banner borders |
| `bg-green-50` / `bg-green-900/10` | `bg-success/10` | Success banner backgrounds |
| `text-green-800` / `text-green-400` | `text-success-foreground` | Text on success backgrounds |
| `border-green-200` / `border-green-800` | `border-success/20` | Success banner borders |
| `bg-yellow-50` / `bg-yellow-900/10` | `bg-warning/10` | Warning banner backgrounds |
| `text-yellow-800` / `text-yellow-400` | `text-warning-foreground` | Text on warning backgrounds |
| `border-yellow-200` / `border-yellow-800` | `border-warning/20` | Warning banner borders |

### Interactive States

| Hardcoded Pattern | Semantic Token | Use Case |
|-------------------|----------------|----------|
| `hover:bg-gray-50` / `hover:bg-gray-700` | `hover:bg-muted` | Hover background |
| `hover:text-gray-900` / `hover:text-gray-100` | `hover:text-foreground` | Hover text |
| `focus:ring-gray-400` | `focus:ring-ring` | Focus ring color |
| `focus:border-gray-400` | `focus:border-ring` | Focus border color |

---

## Common Pitfalls & Solutions

### Pitfall 1: Edit Tool Fails on Non-Unique Strings

**Problem:** Pattern appears multiple times, Edit tool errors.

**Solution:** Add more context to make old_string unique, or use `replace_all: true` parameter.

### Pitfall 2: SVG Fill Requires Color Strings

**Problem:** SVG `fill` attribute doesn't support Tailwind classes.

**Solution:** Use inline styles with CSS variable:
```tsx
<path fill="hsl(var(--destructive))" />
```

### Pitfall 3: Gradient Colors

**Problem:** Gradients use specific color values.

**Solution:** Replace with semantic tokens:
```tsx
// ❌ Before:
className="bg-gradient-to-r from-gray-50 to-gray-100"

// ✓ After:
className="bg-gradient-to-r from-muted/50 to-muted"
```

### Pitfall 4: Opacity Modifiers

**Problem:** Hardcoded colors with opacity like `bg-red-500/10`.

**Solution:** Use semantic token with opacity:
```tsx
// ❌ Before:
className="bg-red-500/10"

// ✓ After:
className="bg-destructive/10"
```

### Pitfall 5: Chart/Data Visualization Colors

**Problem:** Charts need distinct, vibrant colors.

**Solution:** Either:
1. Use CSS variables for chart colors
2. Keep chart colors in globals.css `--chart-1` through `--chart-5` (already defined)

---

## Success Criteria

✅ **Code Quality:**
- Zero `gray-[0-9]` classes in app/component files
- Zero manual `dark:` variants (except globals.css)
- Zero hex color codes
- All status indicators use semantic tokens

✅ **Functionality:**
- Production build succeeds
- All pages render correctly
- Dark mode toggle works smoothly
- No color "flashes" or jumps

✅ **Accessibility:**
- WCAG AA contrast ratios maintained
- All text readable in both modes
- Focus states clearly visible

✅ **Maintainability:**
- Color changes require editing only globals.css
- New features can use existing semantic tokens
- Theme system fully leveraged

---

## Estimated Timeline

**Total Time:** 4-6 hours

**Breakdown:**
- Task 1 (Foundation): 30 minutes
- Task 2 (USMap): 20 minutes
- Task 3 (StateTable): 45 minutes
- Task 4 (New Analysis): 45 minutes
- Task 5 (Results): 30 minutes
- Task 6 (Mapping): 30 minutes
- Task 7 (Auth Pages): 20 minutes
- Task 8 (Analyses/Dashboard): 20 minutes
- Task 9 (Components): 30 minutes
- Task 10 (Remaining Pages): 30 minutes
- Task 11 (Verification): 45 minutes
- Task 12 (Documentation): 15 minutes

---

## Notes

- This plan uses **pattern-based replacements** instead of line numbers for reliability
- All OKLCH values maintain consistent hue families (slate-based)
- New semantic tokens (success/warning/info) use muted chroma for professional aesthetic
- Tailwind config updated to support direct OKLCH variable usage
- Each task is independently committable for easy rollback
- DevTools verification steps ensure changes actually use CSS variables

**Ready for implementation with executing-plans sub-skill.**
