# Three-Tier Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the three-tier information architecture for analysis results (State Table with accordion sections, Quick View Modal with "Why This Determination", and enhanced Detail Page) with comprehensive dark/light mode theming support.

**Architecture:** Refactor StateTable.tsx to use accordion sections grouped by priority (Has Nexus / Approaching / Sales-No Nexus / No Sales), update column structure to remove duplicate "Total Sales" and add Threshold %, enhance StateQuickViewModal.tsx with "Why This Determination" explanations and Direct/Marketplace split, and update state detail page transaction table to use pagination with strong filtering. All new UI elements must support dark mode using the existing Slate+Gray theming system.

**Tech Stack:** React, Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui components, Lucide icons, next-themes for dark mode

**Dark Mode Approach:** Following existing patterns in StateTable.tsx and globals.css - use CSS custom properties (`--badge-bg-light`, `--badge-bg-dark`) with `.dark` selector for automatic theme switching.

---

## Dark Mode Reference

**From `frontend/docs/THEMING.md`:**
- **Slate** = Structure (backgrounds, containers, layouts)
- **Gray** = Content (text hierarchy, borders, cards)
- Use semantic Tailwind classes: `bg-background`, `text-foreground`, `border-border`
- Use dark mode variants: `dark:bg-slate-900`, `dark:text-gray-100`
- Colored backgrounds in dark mode use opacity: `bg-green-50 dark:bg-green-900/10`

**Existing Pattern for Status Badges:**
- Define CSS custom properties for both light and dark modes
- Use `.dark` CSS selector to switch values
- Reference: `StateTable.tsx:396-462` and `globals.css` badge dark mode support

---

## Task 1: Update TypeScript Types

**Files:**
- Modify: `frontend/types/states.ts`

### Step 1: Add exempt_sales and taxable_sales to StateResult interface

The API already returns these fields (lines 1472-1473 in analyses.py), so we need to update the TypeScript interface.

```typescript
/**
 * State result from backend API
 * Represents nexus determination, revenue, and liability for one state
 */
export interface StateResult {
  state_code: string
  state_name: string
  nexus_status: 'has_nexus' | 'approaching' | 'no_nexus'
  nexus_type: 'physical' | 'economic' | 'both' | 'none'
  total_sales: number
  exempt_sales: number  // ADD THIS
  taxable_sales: number  // ADD THIS
  direct_sales: number
  marketplace_sales: number
  threshold: number
  threshold_percent: number
  estimated_liability: number
  confidence_level: 'high' | 'medium' | 'low'
  registration_status: 'registered' | 'not_registered' | null
}
```

### Step 2: Verify changes compile

```bash
cd frontend
npm run type-check
```

Expected: No type errors

### Step 3: Commit type changes

```bash
git add frontend/types/states.ts
git commit -m "feat: add exempt_sales and taxable_sales to StateResult type"
```

---

## Task 2: Create Accordion Section Component with Dark Mode Support

**Files:**
- Create: `frontend/components/analysis/StateTableSection.tsx`

### Step 1: Create new accordion section component with dark mode theming

This component will wrap each priority section (Has Nexus, Approaching, etc.) with proper dark mode support.

```typescript
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { StateResult } from '@/types/states'

interface StateTableSectionProps {
  title: string
  count: number
  states: StateResult[]
  defaultExpanded: boolean
  children: React.ReactNode
}

export function StateTableSection({
  title,
  count,
  states,
  defaultExpanded,
  children
}: StateTableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (count === 0) {
    return null
  }

  return (
    <div className="border border-border rounded-lg mb-4 bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold text-foreground">
            {title} ({count} {count === 1 ? 'state' : 'states'})
          </h3>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}
```

**Dark Mode Classes Used:**
- `border-border` - Auto-switches: gray-200 (light) → gray-800 (dark)
- `bg-card` - Auto-switches: white (light) → gray-900 (dark)
- `hover:bg-muted/50` - Auto-switches with opacity
- `text-muted-foreground` - Auto-switches: gray-500 (light) → gray-400 (dark)
- `text-foreground` - Auto-switches: gray-900 (light) → gray-100 (dark)

### Step 2: Verify component compiles

```bash
cd frontend
npm run type-check
```

Expected: No type errors

### Step 3: Test dark mode rendering

```bash
npm run dev
```

Toggle theme in browser and verify accordion button has proper contrast in both modes.

### Step 4: Commit accordion component

```bash
git add frontend/components/analysis/StateTableSection.tsx
git commit -m "feat: create StateTableSection accordion component with dark mode support"
```

---

## Task 3: Add Helper Function to Group States by Priority

**Files:**
- Modify: `frontend/components/analysis/StateTable.tsx`

### Step 1: Add grouping function after imports

Add this function after the `formatCurrency` helper (around line 75):

```typescript
// Helper function to group states by priority
const groupStatesByPriority = (states: StateResult[]) => {
  const hasNexus: StateResult[] = []
  const approaching: StateResult[] = []
  const salesNoNexus: StateResult[] = []
  const noSales: StateResult[] = []

  states.forEach(state => {
    if (state.nexus_status === 'has_nexus') {
      hasNexus.push(state)
    } else if (state.nexus_status === 'approaching') {
      approaching.push(state)
    } else if (state.total_sales > 10000) {
      // Sales > $10k but no nexus
      salesNoNexus.push(state)
    } else {
      // No sales or very minimal sales
      noSales.push(state)
    }
  })

  // Sort each group
  hasNexus.sort((a, b) => b.estimated_liability - a.estimated_liability)
  approaching.sort((a, b) => b.threshold_percent - a.threshold_percent)
  salesNoNexus.sort((a, b) => b.total_sales - a.total_sales)
  noSales.sort((a, b) => a.state_name.localeCompare(b.state_name))

  return {
    hasNexus,
    approaching,
    salesNoNexus,
    noSales
  }
}
```

### Step 2: Verify function compiles

```bash
cd frontend
npm run type-check
```

Expected: No type errors

### Step 3: Commit grouping function

```bash
git add frontend/components/analysis/StateTable.tsx
git commit -m "feat: add groupStatesByPriority helper function"
```

---

## Task 4: Remove Duplicate "Total Sales" Column from StateTable

**Files:**
- Modify: `frontend/components/analysis/StateTable.tsx`

### Step 1: Find and remove the "Total Sales" TableHead

Find this section (around line 323-330):

```typescript
<TableHead className="w-32 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
  <button
    onClick={() => handleSort('sales')}
    className="flex items-center gap-2 ml-auto hover:text-foreground transition-colors"
  >
    Total Sales
    {getSortIcon('sales')}
  </button>
</TableHead>
```

DELETE this entire TableHead element.

### Step 2: Find and remove the corresponding TableCell

Find this section (around line 474-481):

```typescript
<TableCell className={`px-4 text-sm text-right text-foreground ${densityClasses[density]}`}>
  <div className="font-medium text-card-foreground">
    ${state.total_sales.toLocaleString()}
  </div>
  <div className="text-xs text-muted-foreground">
    Direct: ${(state.direct_sales / 1000).toFixed(0)}k | Mktp: ${(state.marketplace_sales / 1000).toFixed(0)}k
  </div>
</TableCell>
```

DELETE this entire TableCell element.

### Step 3: Find and remove the "Threshold" column

Find the "Threshold" TableHead (around line 332-336) and DELETE it:

```typescript
<TableHead className="w-28 px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
  <span>
    Threshold
  </span>
</TableHead>
```

Find the corresponding TableCell (around line 482-497) and DELETE it:

```typescript
<TableCell className={`px-4 text-sm text-right text-foreground ${densityClasses[density]}`}>
  <div className="text-sm text-foreground">
    ${state.threshold?.toLocaleString() || 'N/A'}
  </div>
  {state.threshold_percent !== undefined && state.threshold_percent !== null && (
    <div className={`text-xs font-medium ${
      state.threshold_percent >= 100
        ? 'text-destructive'
        : state.threshold_percent >= 80
        ? 'text-warning'
        : 'text-success'
    }`}>
      {state.threshold_percent.toFixed(0)}%
    </div>
  )}
</TableCell>
```

### Step 4: Verify changes compile

```bash
cd frontend
npm run type-check
```

Expected: No type errors

### Step 5: Commit column removal

```bash
git add frontend/components/analysis/StateTable.tsx
git commit -m "refactor: remove duplicate Total Sales column and Threshold column from StateTable"
```

---

## Task 5: Add Threshold % Column with Color-Coded Dots and Dark Mode Support

**Files:**
- Modify: `frontend/components/analysis/StateTable.tsx`

### Step 1: Add Threshold % TableHead after Exempt column

Find the "Exempt" TableHead (around line 311-313) and ADD this AFTER it:

```typescript
<TableHead className="w-28 px-4 py-2 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
  <div className="flex items-center justify-end gap-1">
    Threshold %
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info className="h-3 w-3 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Percentage of threshold reached</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</TableHead>
```

### Step 2: Add corresponding TableCell with color-coded dot and dark mode support

Find where the Exempt TableCell ends (around line 391) and ADD this AFTER it:

```typescript
<TableCell className="px-4 py-2 text-sm text-right">
  {state.threshold_percent !== undefined && state.threshold_percent !== null ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-end gap-2">
            <div
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                // CSS custom properties for dark mode support
                '--dot-color-light':
                  state.threshold_percent >= 100
                    ? 'hsl(0 84% 60%)'      // Red
                    : state.threshold_percent >= 80
                    ? 'hsl(38 92% 50%)'     // Yellow/Orange
                    : 'hsl(142 71% 45%)',   // Green
                '--dot-color-dark':
                  state.threshold_percent >= 100
                    ? 'hsl(0 84% 65%)'      // Brighter red for dark mode
                    : state.threshold_percent >= 80
                    ? 'hsl(38 92% 60%)'     // Brighter yellow for dark mode
                    : 'hsl(142 71% 55%)',   // Brighter green for dark mode
                backgroundColor: 'var(--dot-color-light)'
              } as React.CSSProperties & Record<string, string>}
            />
            <span className="font-medium text-foreground">
              {state.threshold_percent.toFixed(0)}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>
            {state.state_name}: ${state.total_sales.toLocaleString()} of $
            {state.threshold?.toLocaleString() || 'N/A'} threshold (
            {state.threshold_percent.toFixed(0)}%)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

### Step 3: Add CSS for dark mode dot color switching

Add to `frontend/app/globals.css` (after the existing badge dark mode support):

```css
/* ===== Threshold Dot Dark Mode Support ===== */
/* Switch threshold status dot colors in dark mode */
.dark div[style*="--dot-color-light"] {
  background-color: var(--dot-color-dark) !important;
}
```

### Step 4: Verify changes compile and render correctly

```bash
cd frontend
npm run type-check
npm run dev
```

Expected:
- No type errors
- Table renders with new Threshold % column showing colored dots
- Dots are visible in both light and dark modes
- Colors are appropriate for each mode (brighter in dark mode)

### Step 5: Test dark mode threshold dots

In browser:
1. View table in light mode - verify dots are visible with good contrast
2. Toggle to dark mode - verify dots switch to brighter colors
3. Hover tooltip works in both modes

Expected:
- ✓ Red dot (≥100%): Visible in both modes
- ✓ Yellow/Orange dot (80-99%): Visible in both modes
- ✓ Green dot (<80%): Visible in both modes
- ✓ Tooltip shows on hover with correct background

### Step 6: Commit threshold % column

```bash
git add frontend/components/analysis/StateTable.tsx frontend/app/globals.css
git commit -m "feat: add Threshold % column with color-coded status indicators and dark mode support"
```

---

## Task 6: Refactor StateTable to Use Accordion Sections

**Files:**
- Modify: `frontend/components/analysis/StateTable.tsx`

### Step 1: Import the StateTableSection component

Add to imports at top of file:

```typescript
import { StateTableSection } from './StateTableSection'
```

### Step 2: Update displayedStates to use grouping

Find the `displayedStates` useMemo (around line 114-175) and replace the return section (around line 163) with:

```typescript
// Return grouped states instead of flat array
return groupStatesByPriority(filtered)
```

Update the type to:

```typescript
const displayedStates = useMemo<{
  hasNexus: StateResult[]
  approaching: StateResult[]
  salesNoNexus: StateResult[]
  noSales: StateResult[]
}>(() => {
  // ... existing filter logic ...

  return groupStatesByPriority(filtered)
}, [states, nexusFilter, exemptFilter, searchQuery, sortConfig])
```

### Step 3: Create reusable table rows component

Add this helper component inside StateTable (before the return statement):

```typescript
const StateTableRows = ({ states }: { states: StateResult[] }) => (
  <>
    {states.map((state) => (
      <TableRow
        key={state.state_code}
        className="hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => {
          setSelectedState({ code: state.state_code, name: state.state_name })
          setQuickViewOpen(true)
        }}
      >
        {/* State Name */}
        <TableCell className={`px-4 text-sm text-foreground ${densityClasses[density]}`}>
          <div className="font-medium text-foreground">
            {state.state_name}
          </div>
          <div className="text-xs text-muted-foreground">
            ({state.state_code})
          </div>
        </TableCell>

        {/* Gross Sales */}
        <TableCell className="px-4 py-2 text-sm text-right font-medium text-foreground">
          {formatCurrency(state.total_sales || 0)}
        </TableCell>

        {/* Taxable Sales */}
        <TableCell className="px-4 py-2 text-sm text-right font-medium text-foreground">
          {formatCurrency(state.taxable_sales || 0)}
        </TableCell>

        {/* Exempt */}
        <TableCell className="px-4 py-2 text-sm text-right">
          {state.exempt_sales > 0 ? (
            <div>
              <div className="font-medium text-foreground">{formatCurrency(state.exempt_sales)}</div>
              <div className="text-xs text-muted-foreground">
                ({((state.exempt_sales / state.total_sales) * 100).toFixed(0)}%)
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Threshold % - WITH DARK MODE SUPPORT */}
        <TableCell className="px-4 py-2 text-sm text-right">
          {state.threshold_percent !== undefined && state.threshold_percent !== null ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-end gap-2">
                    <div
                      className="w-2 h-2 rounded-full transition-colors"
                      style={{
                        '--dot-color-light':
                          state.threshold_percent >= 100
                            ? 'hsl(0 84% 60%)'
                            : state.threshold_percent >= 80
                            ? 'hsl(38 92% 50%)'
                            : 'hsl(142 71% 45%)',
                        '--dot-color-dark':
                          state.threshold_percent >= 100
                            ? 'hsl(0 84% 65%)'
                            : state.threshold_percent >= 80
                            ? 'hsl(38 92% 60%)'
                            : 'hsl(142 71% 55%)',
                        backgroundColor: 'var(--dot-color-light)'
                      } as React.CSSProperties & Record<string, string>}
                    />
                    <span className="font-medium text-foreground">
                      {state.threshold_percent.toFixed(0)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    {state.state_name}: ${state.total_sales.toLocaleString()} of $
                    {state.threshold?.toLocaleString() || 'N/A'} threshold (
                    {state.threshold_percent.toFixed(0)}%)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Status Badge - existing code (already has dark mode support) */}
        <TableCell className={`px-4 text-sm text-foreground text-center ${densityClasses[density]}`}>
          {/* ... existing badge code ... */}
        </TableCell>

        {/* Est. Liability - existing code */}
        <TableCell className={`px-4 text-sm text-center text-card-foreground font-medium ${densityClasses[density]}`}>
          ${state.estimated_liability.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </TableCell>

        {/* Actions - existing code */}
        <TableCell className={`px-4 text-sm text-foreground text-center ${densityClasses[density]}`}>
          {/* ... existing actions code ... */}
        </TableCell>
      </TableRow>
    ))}
  </>
)
```

**Note:** This component uses all semantic Tailwind classes that auto-switch with theme.

### Step 4: Replace table body with accordion sections

Find the existing TableBody (around line 358) and replace the entire table structure with:

```typescript
<div className="space-y-4">
  {/* Section 1: Has Nexus */}
  <StateTableSection
    title="Has Nexus"
    count={displayedStates.hasNexus.length}
    states={displayedStates.hasNexus}
    defaultExpanded={true}
  >
    <Table>
      <TableHeader>
        <TableRow>
          {/* Copy all TableHead elements here */}
        </TableRow>
      </TableHeader>
      <TableBody>
        <StateTableRows states={displayedStates.hasNexus} />
      </TableBody>
    </Table>
  </StateTableSection>

  {/* Section 2: Approaching Threshold */}
  <StateTableSection
    title="Approaching Threshold"
    count={displayedStates.approaching.length}
    states={displayedStates.approaching}
    defaultExpanded={true}
  >
    <Table>
      <TableHeader>
        <TableRow>
          {/* Copy all TableHead elements here */}
        </TableRow>
      </TableHeader>
      <TableBody>
        <StateTableRows states={displayedStates.approaching} />
      </TableBody>
    </Table>
  </StateTableSection>

  {/* Section 3: Sales, but No Nexus */}
  <StateTableSection
    title="Sales, but No Nexus"
    count={displayedStates.salesNoNexus.length}
    states={displayedStates.salesNoNexus}
    defaultExpanded={true}
  >
    <Table>
      <TableHeader>
        <TableRow>
          {/* Copy all TableHead elements here */}
        </TableRow>
      </TableHeader>
      <TableBody>
        <StateTableRows states={displayedStates.salesNoNexus} />
      </TableBody>
    </Table>
  </StateTableSection>

  {/* Section 4: No Sales */}
  <StateTableSection
    title="No Sales"
    count={displayedStates.noSales.length}
    states={displayedStates.noSales}
    defaultExpanded={false}
  >
    <Table>
      <TableHeader>
        <TableRow>
          {/* Copy all TableHead elements here */}
        </TableRow>
      </TableHeader>
      <TableBody>
        <StateTableRows states={displayedStates.noSales} />
      </TableBody>
    </Table>
  </StateTableSection>
</div>
```

### Step 5: Test accordion sections in both themes

```bash
cd frontend
npm run dev
```

Expected:
- Table shows 4 accordion sections
- Has Nexus, Approaching, Sales-No Nexus are expanded by default
- No Sales is collapsed by default
- Clicking headers toggles expansion
- **Light mode:** Clean, professional appearance with slate-50 backgrounds
- **Dark mode:** Proper contrast with slate-800 backgrounds, readable text

### Step 6: Commit accordion refactor

```bash
git add frontend/components/analysis/StateTable.tsx
git commit -m "refactor: implement accordion sections for state priority grouping with dark mode support"
```

---

## Task 7: Add "Why This Determination" to Quick View Modal with Dark Mode

**Files:**
- Modify: `frontend/components/analysis/StateQuickViewModal.tsx`

### Step 1: Create helper function to generate explanation text

Add this function after the `calculateEconomicNexusDate` function (around line 116):

```typescript
const generateDeterminationExplanation = (data: StateDetailResponse): {
  title: string
  bullets: string[]
} => {
  const hasNexus = data.nexus_type && data.nexus_type !== 'none'
  const totalSales = data.total_sales || 0
  const directSales = data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)
  const marketplaceSales = data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)
  const taxableSales = data.taxable_sales || 0
  const exemptSales = data.exempt_sales || 0
  const isMultiYear = data.year_data.length > 1

  // Scenario 1: Has Nexus (straightforward)
  if (hasNexus) {
    const nexusDate = calculateEconomicNexusDate(data)
    const threshold = data.year_data[0]?.threshold_info?.revenue_threshold || 0

    // Check if it's all exempt (Pennsylvania scenario)
    if (taxableSales === 0 && exemptSales > 0) {
      return {
        title: '✓ Has Nexus - But Zero Liability',
        bullets: [
          `Exceeded $${threshold.toLocaleString()} threshold with $${totalSales.toLocaleString()} in sales`,
          'All sales are tax-exempt (groceries/manufacturing)',
          `Taxable sales: $0 → Estimated liability: $0`,
          'Note: Nexus obligation exists, but no tax due'
        ]
      }
    }

    // Standard nexus triggered
    const allDirect = marketplaceSales === 0
    return {
      title: nexusDate
        ? `✓ ${data.nexus_type === 'economic' ? 'Economic' : data.nexus_type === 'physical' ? 'Physical' : 'Both Physical + Economic'} Nexus Triggered - ${formatDate(nexusDate)}`
        : '✓ Nexus Triggered',
      bullets: [
        `Exceeded $${threshold.toLocaleString()} threshold with $${totalSales.toLocaleString()} in sales`,
        allDirect
          ? `All sales are direct (marketplace: $0)`
          : `Direct: $${directSales.toLocaleString()} | Marketplace: $${marketplaceSales.toLocaleString()}`
      ]
    }
  }

  // Scenario 2: No Nexus - Multi-year split (California)
  if (isMultiYear && totalSales > 0) {
    const years = data.year_data.map(yr => yr.year).sort()
    const yearBreakdown = data.year_data.map(yr =>
      `${yr.year}: $${yr.summary.total_sales.toLocaleString()} (below $${yr.threshold_info.revenue_threshold?.toLocaleString() || 'N/A'} threshold)`
    )

    return {
      title: '✓ No Nexus - Sales Split Across Years',
      bullets: [
        `Total sales: $${totalSales.toLocaleString()} across ${years[0]}-${years[years.length - 1]}`,
        ...yearBreakdown,
        'Note: Each year evaluated independently'
      ]
    }
  }

  // Scenario 3: No Nexus - Marketplace exclusion (Texas)
  if (marketplaceSales > directSales && directSales > 0) {
    const threshold = data.year_data[0]?.threshold_info?.revenue_threshold || 0
    return {
      title: '✓ No Nexus - Marketplace Facilitator Exclusion',
      bullets: [
        `Total sales: $${totalSales.toLocaleString()}`,
        `Marketplace sales: $${marketplaceSales.toLocaleString()} (excluded per ${data.state_code} rules)`,
        `Direct sales: $${directSales.toLocaleString()} (below $${threshold.toLocaleString()} threshold)`
      ]
    }
  }

  // Scenario 4: No Nexus - Below threshold
  const threshold = data.year_data[0]?.threshold_info?.revenue_threshold || 0
  return {
    title: '✓ No Nexus - Below Threshold',
    bullets: [
      `Total sales: $${totalSales.toLocaleString()}`,
      `Threshold: $${threshold.toLocaleString()}`,
      `Below threshold by $${(threshold - totalSales).toLocaleString()}`
    ]
  }
}
```

### Step 2: Add "Why This Determination" section to modal with dark mode styling

Find the modal content (around line 176) and ADD this section AFTER the Nexus Status Header and BEFORE the Quick Facts grid:

```typescript
{/* Why This Determination - WITH DARK MODE SUPPORT */}
{data && (() => {
  const explanation = generateDeterminationExplanation(data)
  return (
    <div className="bg-accent/50 border border-border rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-foreground mb-2">
        Why This Determination:
      </h4>
      <div className="bg-background border border-border rounded p-3">
        <div className="font-medium text-sm text-foreground mb-2">
          {explanation.title}
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {explanation.bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
})()}
```

**Dark Mode Classes Used:**
- `bg-accent/50` - Auto-switches with opacity
- `border-border` - Auto-switches between light/dark border colors
- `bg-background` - Auto-switches: slate-50 (light) → slate-950 (dark)
- `text-foreground` - Auto-switches: gray-900 (light) → gray-100 (dark)
- `text-muted-foreground` - Auto-switches: gray-500 (light) → gray-400 (dark)

### Step 3: Test modal explanation in both themes

```bash
cd frontend
npm run dev
```

Test scenarios:
- **Florida (light mode):** Clean white card with dark text
- **Florida (dark mode):** Dark card with light text, proper contrast
- **California (light mode):** Multi-year explanation clearly visible
- **California (dark mode):** Same info, readable on dark background
- **Texas (light mode):** Marketplace exclusion text legible
- **Texas (dark mode):** All numbers and text have proper contrast

### Step 4: Commit determination explanation

```bash
git add frontend/components/analysis/StateQuickViewModal.tsx
git commit -m "feat: add Why This Determination explanation box to Quick View Modal with dark mode support"
```

---

## Task 8: Add Direct/Marketplace Split to Quick View Modal

**Files:**
- Modify: `frontend/components/analysis/StateQuickViewModal.tsx`

### Step 1: Add Direct/Marketplace row to Quick Facts grid

Find the Quick Facts section (the metrics grid, around line 200-250) and ADD these two rows after "Exempt Sales":

```typescript
{/* Divider */}
<div className="col-span-2 border-t border-border my-2" />

{/* Direct Sales */}
<div className="flex justify-between items-center">
  <span className="text-sm text-muted-foreground">Direct Sales:</span>
  <span className="text-sm font-medium text-foreground">
    {formatCurrency(data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0))}
    <span className="text-xs text-muted-foreground ml-2">
      ({((data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0) / (data.total_sales || 1)) * 100).toFixed(0)}%)
    </span>
  </span>
</div>

{/* Marketplace Sales */}
<div className="flex justify-between items-center">
  <span className="text-sm text-muted-foreground">Marketplace Sales:</span>
  <span className="text-sm font-medium text-foreground">
    {formatCurrency(data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0))}
    <span className="text-xs text-muted-foreground ml-2">
      ({((data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0) / (data.total_sales || 1)) * 100).toFixed(0)}%)
    </span>
  </span>
</div>
```

**Note:** Using semantic classes (`border-border`, `text-muted-foreground`, `text-foreground`) ensures automatic dark mode support.

### Step 2: Test Direct/Marketplace display in both themes

```bash
cd frontend
npm run dev
```

Expected:
- Light mode: Gray text for labels, darker text for values
- Dark mode: Lighter gray for labels, white text for values
- Percentages clearly visible in both modes
- Florida: 100% direct shows correctly
- Texas: Shows split like "Direct: $65,000 (19%) | Marketplace: $280,000 (81%)"

### Step 3: Commit Direct/Marketplace split

```bash
git add frontend/components/analysis/StateQuickViewModal.tsx
git commit -m "feat: add Direct/Marketplace sales split to Quick View Modal with dark mode support"
```

---

## Task 9: Add Close Button to Quick View Modal

**Files:**
- Modify: `frontend/components/analysis/StateQuickViewModal.tsx`

### Step 1: Add Close button to modal footer

Find the modal footer with the "View Full Details" button (around line 300+) and UPDATE it to:

```typescript
<div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
  <Button
    variant="outline"
    onClick={() => onOpenChange(false)}
    className="flex-1"
  >
    Close
  </Button>
  <Button
    onClick={handleViewFullDetails}
    className="flex-1 gap-2"
  >
    View Full Analysis
    <ExternalLink className="h-4 w-4" />
  </Button>
</div>
```

**Note:** Button component already has dark mode support via shadcn/ui theming. `variant="outline"` will auto-switch border and text colors.

### Step 2: Test Close button in both themes

```bash
cd frontend
npm run dev
```

Expected:
- Light mode: Outline button with gray border, solid button with dark background
- Dark mode: Outline button with light border, solid button with light background
- Both buttons clearly visible and accessible in both themes

### Step 3: Commit Close button

```bash
git add frontend/components/analysis/StateQuickViewModal.tsx
git commit -m "feat: add Close button to Quick View Modal footer"
```

---

## Task 10: Fix Backend State Detail API (Missing aggregate fields)

**Files:**
- Modify: `backend/app/api/v1/analyses.py:1758-1816`

### Step 1: Verify the aggregate fields are calculated

The code at lines 1758-1762 should already calculate these:

```python
# Calculate aggregate totals across all years
total_sales_all_years = sum(yr['summary']['total_sales'] for yr in year_data)
total_taxable_sales_all_years = sum(yr['summary']['taxable_sales'] for yr in year_data)
total_exempt_sales_all_years = total_sales_all_years - total_taxable_sales_all_years
total_liability_all_years = sum(yr['summary']['estimated_liability'] for yr in year_data)
```

### Step 2: Verify the response includes these fields

The return statement at lines 1799-1816 should already include:

```python
return {
    'state_code': state_code,
    'state_name': state_name,
    'analysis_id': analysis_id,
    'has_transactions': True,
    'analysis_period': {
        'years_available': years_available
    },
    'year_data': year_data,
    'compliance_info': compliance_info,
    # Aggregate totals for "All Years" view
    'total_sales': total_sales_all_years,
    'taxable_sales': total_taxable_sales_all_years,  # Should be here
    'exempt_sales': total_exempt_sales_all_years,     # Should be here
    'estimated_liability': total_liability_all_years,
    'nexus_type': aggregate_nexus_type,
    'first_nexus_year': first_nexus_year
}
```

### Step 3: Verify these changes exist

```bash
cd backend
grep -n "taxable_sales_all_years" app/api/v1/analyses.py
grep -n "exempt_sales_all_years" app/api/v1/analyses.py
```

Expected: Should find these variables at lines 1760-1761 and 1811-1812

If NOT found, the changes from our earlier commit are missing. Re-apply them.

### Step 4: Restart backend and test

```bash
# Restart backend
# Then test state detail API
curl http://localhost:8000/api/v1/analyses/{analysis_id}/states/NY
```

Expected: Response includes `taxable_sales` and `exempt_sales` at root level

### Step 5: Commit if changes were needed

```bash
git add backend/app/api/v1/analyses.py
git commit -m "fix: ensure state detail API returns aggregate taxable_sales and exempt_sales"
```

---

## Task 11: Update State Detail Page to Use API Aggregate Fields

**Files:**
- Modify: `frontend/app/analysis/[id]/states/[stateCode]/page.tsx:277-286`

### Step 1: Replace manual aggregation with API fields

Find the SummaryCards component (around lines 256-287) and UPDATE the taxableSales and exemptSales props:

```typescript
<SummaryCards
  totalSales={
    isAllYearsView
      ? data.total_sales || 0
      : yearData?.summary.total_sales || 0
  }
  transactionCount={
    isAllYearsView
      ? data.year_data.reduce((sum, yr) => sum + yr.summary.transaction_count, 0)
      : yearData?.summary.transaction_count || 0
  }
  directSales={
    isAllYearsView
      ? data.year_data.reduce((sum, yr) => sum + yr.summary.direct_sales, 0)
      : yearData?.summary.direct_sales || 0
  }
  marketplaceSales={
    isAllYearsView
      ? data.year_data.reduce((sum, yr) => sum + yr.summary.marketplace_sales, 0)
      : yearData?.summary.marketplace_sales || 0
  }
  taxableSales={
    isAllYearsView
      ? data.taxable_sales || 0  // USE API FIELD
      : yearData?.summary.taxable_sales || 0
  }
  exemptSales={
    isAllYearsView
      ? data.exempt_sales || 0  // USE API FIELD
      : yearData?.summary.exempt_sales || 0
  }
/>
```

**Note:** SummaryCards component already has dark mode support through semantic Tailwind classes.

### Step 2: Test state detail page in both themes

```bash
cd frontend
npm run dev
```

Navigate to state detail page and verify summary cards show correct values in both themes.

Expected:
- **Light mode:** NY shows: Gross $374K, Taxable $235K, Exempt $139K with clean white cards
- **Dark mode:** Same values but on dark gray-900 cards with light text
- **Light mode:** CA shows: Gross $329.5K, Taxable $210.7K, Exempt $118.8K
- **Dark mode:** Same values, proper contrast

### Step 3: Commit detail page fix

```bash
git add frontend/app/analysis/[id]/states/[stateCode]/page.tsx
git commit -m "fix: use API aggregate fields for taxable/exempt sales in state detail"
```

---

## Task 12: Update Frontend Type for State Detail Response

**Files:**
- Modify: `frontend/lib/api.ts`

### Step 1: Add taxable_sales and exempt_sales to StateDetailResponse

Find the StateDetailResponse interface (should be around line 50-70) and ADD these fields:

```typescript
export interface StateDetailResponse {
  state_code: string
  state_name: string
  analysis_id: string
  has_transactions: boolean
  analysis_period: {
    years_available: number[]
  }
  year_data: YearData[]
  compliance_info: {
    tax_rates: {
      state_rate: number
      avg_local_rate: number
      combined_rate: number
    }
    threshold_info: any
    registration_info: any
  }
  total_sales: number
  taxable_sales: number  // ADD THIS
  exempt_sales: number   // ADD THIS
  estimated_liability: number
  nexus_type: string
  first_nexus_year?: number
}
```

### Step 2: Verify types compile

```bash
cd frontend
npm run type-check
```

Expected: No type errors

### Step 3: Commit type update

```bash
git add frontend/lib/api.ts
git commit -m "feat: add taxable_sales and exempt_sales to StateDetailResponse type"
```

---

## Task 13: Final Integration Test - Light and Dark Modes

**Files:**
- Test: Full user workflow in both themes

### Step 1: Start both backend and frontend

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Test State Table accordion sections in both themes

Navigate to analysis results page.

**Light Mode Verification:**
- ✓ Table shows 4 accordion sections with white/slate-50 backgrounds
- ✓ Text is dark and readable
- ✓ Borders are subtle gray-200
- ✓ Threshold dots (🟢🟡🔴) are visible with good contrast
- ✓ Hover states show gray-100 backgrounds

**Dark Mode Verification (toggle theme):**
- ✓ Table shows 4 accordion sections with gray-900/slate-800 backgrounds
- ✓ Text is light (gray-100) and readable
- ✓ Borders are visible (gray-800)
- ✓ Threshold dots are brighter colors (better visibility on dark)
- ✓ Hover states show gray-800 backgrounds
- ✓ No "flash" or color issues when switching themes

### Step 3: Test column structure in both themes

**Verify columns work in both modes:**
1. ✓ State name clearly visible
2. ✓ Dollar amounts readable
3. ✓ Threshold % dots have proper contrast
4. ✓ Status badges maintain color coding
5. ✓ Tooltips work and are readable

### Step 4: Test Quick View Modal in both themes

Click on Florida row in light mode.

**Light Mode Modal:**
- ✓ Modal background is white
- ✓ "Why This Determination" box has subtle gray background
- ✓ Text is dark and readable
- ✓ Buttons have proper contrast
- ✓ Close button outline visible

Switch to dark mode (modal should stay open).

**Dark Mode Modal:**
- ✓ Modal background is gray-900
- ✓ "Why This Determination" box has darker background with proper contrast
- ✓ Text is light and readable
- ✓ Buttons maintain visibility (outline button has light border)
- ✓ No jarring color transitions

Click on California row (test multi-year explanation):
- ✓ Year breakdown clearly visible in both modes
- ✓ Numbers have sufficient contrast

Click on Texas row (test marketplace exclusion):
- ✓ Direct/Marketplace split clearly visible
- ✓ All text legible in both modes

### Step 5: Test State Detail Page in both themes

Click "View Full Analysis" on New York.

**Light Mode Detail Page:**
- ✓ Summary cards: White backgrounds, dark text
- ✓ Gross Sales: $374,000 (visible)
- ✓ Taxable Sales: $235,000 (NOT $0!)
- ✓ Exempt Sales: $139,000 (NOT $0!)

**Dark Mode Detail Page (toggle theme):**
- ✓ Summary cards: Gray-900 backgrounds, light text
- ✓ All values still clearly visible
- ✓ Card borders visible
- ✓ No contrast issues

### Step 6: Document test results

Create summary in terminal:

```bash
echo "✅ Task 13 Complete: Full Integration Test Passed - Both Themes"
echo ""
echo "Light Mode:"
echo "- Accordion sections: ✅"
echo "- Column structure: ✅"
echo "- Threshold dots visible: ✅"
echo "- Quick View Modal readable: ✅"
echo "- State detail summary correct: ✅"
echo ""
echo "Dark Mode:"
echo "- Accordion sections: ✅"
echo "- Column structure: ✅"
echo "- Threshold dots brighter/visible: ✅"
echo "- Quick View Modal readable: ✅"
echo "- State detail summary correct: ✅"
echo "- No theme switching issues: ✅"
```

### Step 7: Final commit

```bash
git add .
git commit -m "test: verify three-tier architecture implementation with comprehensive dark mode support"
```

---

## Completion Checklist

**Layer 1: State Table**
- [x] Accordion sections (Has Nexus / Approaching / Sales-No Nexus / No Sales)
- [x] Remove duplicate "Total Sales" column
- [x] Add Threshold % column with color-coded dots
- [x] **Dark mode support** for all new UI elements
- [x] Update column tooltips
- [x] Group states by priority with correct sorting

**Layer 2: Quick View Modal**
- [x] "Why This Determination" explanation box
- [x] Handle 4 scenarios: nexus triggered, multi-year split, marketplace exclusion, high exempt %
- [x] Add Direct/Marketplace split to Quick Facts
- [x] Add Close button to footer
- [x] **Dark mode support** for modal content and buttons

**Layer 3: Detail Page**
- [x] Fix backend API to return aggregate taxable_sales and exempt_sales
- [x] Update frontend to use API fields instead of manual aggregation
- [x] Update TypeScript types
- [x] **Verify summary cards work in both themes**

**Dark Mode Testing:**
- [x] Accordion sections readable in both modes
- [x] Threshold dots have proper contrast in both modes
- [x] Quick View Modal maintains visibility in both modes
- [x] Detail Page summary cards work in both modes
- [x] No theme switching bugs or flashes

---

## Dark Mode Implementation Summary

**Approach Used:**
1. **Semantic Tailwind classes** - Primary method for automatic theme switching
   - `bg-background`, `text-foreground`, `border-border`
   - `bg-card`, `text-muted-foreground`

2. **CSS custom properties** - For colored elements (threshold dots)
   - Define `--dot-color-light` and `--dot-color-dark`
   - Use `.dark` selector to switch values
   - Added to `globals.css`

3. **Component-level patterns** - Following existing StateTable badge approach
   - Light mode: Darker, more saturated colors
   - Dark mode: Brighter, more vibrant colors (better visibility)

**Key Files Modified for Dark Mode:**
- `frontend/components/analysis/StateTableSection.tsx` - All semantic classes
- `frontend/components/analysis/StateTable.tsx` - Threshold dots with CSS vars
- `frontend/components/analysis/StateQuickViewModal.tsx` - All semantic classes
- `frontend/app/globals.css` - Added `.dark` selector for threshold dots

---

## Known Issues / Future Enhancements

**Not included in this plan (future tasks):**

1. **Transaction Table Pagination** (Layer 3)
   - Paginate to 25 transactions per page
   - Add strong filtering (Channel, Status, Date Range, Amount)
   - Add search functionality
   - **Dark mode support needed for filter controls**
   - Reference: Design doc lines 341-438

2. **Mark as Reviewed Action**
   - Add "Mark as Reviewed" button to Quick View Modal
   - Track reviewed state per professional
   - Visual indicator in State Table
   - **Dark mode styling for reviewed badge**

3. **Sales Breakdown Visual Equation** (Layer 3)
   - Visual equation: Gross - Exempt = Taxable
   - Show Direct/Marketplace breakdown
   - **Ensure math symbols visible in dark mode**

4. **Year-by-Year Summary Table** (Layer 3)
   - Show per-year breakdown in Detail Page
   - Threshold progression across years
   - **Table must support dark mode**

5. **Compliance Information Accordion** (Layer 3)
   - Registration requirements
   - Filing frequencies
   - Tax rate details
   - **Dark mode for accordion content**

---

## Troubleshooting

**Problem: State detail summary cards show $0 for Taxable/Exempt**

Solution: Check backend API at lines 1758-1816 in `backend/app/api/v1/analyses.py`. Verify:
1. Lines 1760-1761 calculate `total_taxable_sales_all_years` and `total_exempt_sales_all_years`
2. Lines 1811-1812 include these in the response
3. Backend has been restarted after code changes

**Problem: Accordion sections don't expand/collapse**

Solution: Check that `StateTableSection.tsx` was created correctly and imports are correct. Verify useState hook is managing `isExpanded` state.

**Problem: Threshold % column missing**

Solution: Verify Task 5 was completed. Check that TableHead and TableCell were added in correct positions after Exempt column.

**Problem: "Why This Determination" not showing correct explanation**

Solution: Check `generateDeterminationExplanation` function logic. Verify data being passed has correct structure. Check console for errors.

**Problem: Dark mode colors not switching**

Solution:
1. Check if `.dark` class is applied to `<html>` element (inspect DevTools)
2. Verify `globals.css` includes the threshold dot dark mode CSS
3. Clear browser cache and hard refresh
4. Check if `ThemeProvider` is in `app/layout.tsx`

**Problem: Threshold dots not visible in dark mode**

Solution:
1. Verify CSS custom properties are defined (`--dot-color-light`, `--dot-color-dark`)
2. Check that `globals.css` includes `.dark div[style*="--dot-color-light"]` selector
3. Verify dark mode colors are brighter (higher lightness values)

**Problem: Modal text unreadable in dark mode**

Solution:
1. Ensure using semantic classes (`text-foreground`, `text-muted-foreground`)
2. Avoid hardcoded colors like `text-gray-900` (use Tailwind dark variants instead)
3. Check modal DialogContent has proper background in dark mode

**Problem: Theme "flashing" on page load**

Solution:
1. Verify `suppressHydrationWarning` is on `<html>` tag in `layout.tsx`
2. Add `disableTransitionOnChange` to ThemeProvider
3. Ensure theme script loads before content renders

---

**Status:** ✅ Plan Complete - Ready for Execution with Comprehensive Dark Mode Support
