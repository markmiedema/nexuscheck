# Frontend Design Review — NexusCheck

**Reviewer:** Claude (automated design review)
**Date:** 2026-02-10
**Scope:** Full frontend — theming, layout, components, pages, accessibility, consistency

---

## Executive Summary

NexusCheck has a solid, professional frontend built on a modern stack (Next.js 14, shadcn/ui, Tailwind CSS, TypeScript). The design system is well-considered with proper dark/light theming, a consistent color palette, and good component reuse. The codebase shows thoughtful architectural decisions—Radix UI primitives for accessibility, Zustand for auth state, TanStack Query for server state, and CSS variables for theming.

That said, there are actionable areas where the design can be tightened up for consistency, accessibility, and polish. Below are the findings organized by category.

---

## 1. Color & Theming System

### Strengths
- HSL-based CSS variable system is well-structured and maintainable
- Light mode uses a comfortable "cool platinum" palette that reduces eye strain
- Dark mode uses a classic slate palette with appropriate contrast adjustments
- Shadow system has separate light/dark definitions with inner-glow borders in dark mode — this is a nice detail
- The `bg-grainy` paper texture is a premium touch

### Issues

**1.1 — `secondary`, `muted`, and `accent` are identical in light mode**
All three map to `214 30% 85%` (Slate-300). This means `<Badge variant="secondary">`, muted text backgrounds, and hover accent states are visually indistinguishable. Components using these tokens will look the same when they should communicate different semantic meanings.

**Recommendation:** Differentiate `accent` from `secondary`/`muted`. For example:
- `--secondary: 214 30% 85%` (keep as-is for buttons)
- `--muted: 220 14% 92%` (slightly lighter, less saturated for backgrounds)
- `--accent: 214 30% 80%` (slightly darker for hover states to provide visible feedback)

**1.2 — Hardcoded colors bypass the design system**
Several components use hardcoded Tailwind color classes (`bg-emerald-100`, `text-blue-600`, `bg-purple-100`, `text-amber-500`, etc.) instead of the CSS variable system. This is found in:
- `dashboard/page.tsx:167` — metric card icon backgrounds
- `clients/page.tsx:161-167` — status badges
- `analysis/[id]/results/page.tsx:316-338` — map legend colors

This means these colors won't adapt correctly to future theme changes and may have contrast issues in dark mode.

**Recommendation:** Create semantic color tokens for status states (`--status-active`, `--status-warning`, `--status-approaching`, etc.) or at minimum use the existing `success`/`warning`/`info` tokens with opacity modifiers. For the map legend, consider defining chart/map colors as CSS variables.

**1.3 — Chart colors are identical in light and dark mode**
The `--chart-1` through `--chart-5` variables use the same HSL values in both `:root` and `.dark`. These colors may have poor contrast against the slate-800 dark background.

**Recommendation:** Adjust dark mode chart colors to be slightly lighter/brighter for adequate contrast against the dark background.

---

## 2. Layout & Navigation

### Strengths
- Collapsible sidebar with localStorage persistence is well-implemented
- Mobile responsive via Sheet drawer pattern
- Breadcrumb component is clean with proper `aria-label`
- AppLayout is flexible with `maxWidth` and `noPadding` props

### Issues

**2.1 — Sticky header overlaps sticky section tabs**
In `AppLayout.tsx:58`, the header uses `sticky top-0 z-40`. In `clients/[id]/page.tsx:146`, the section tabs use `sticky top-0 z-10`. Both are `top-0`, so the section tabs will slide under the header on scroll rather than stacking below it. The z-index saves the header from being obscured, but the tabs disappear.

**Recommendation:** Set the section tabs to `sticky top-16` (matching the header height `h-16`) so they stack below the header instead of overlapping.

**2.2 — Inconsistent page header patterns**
Pages use different approaches for their headers:
- Dashboard: inline `<div>` with `h1` + description + action buttons
- Clients: same inline pattern
- Settings: `<div className="mb-8">` with just heading, no breadcrumbs
- Client detail: entirely different pattern with `EngagementHeader` + horizontal tabs
- Results: relies on breadcrumbs from AppLayout

This makes the app feel inconsistent as users navigate between sections. There's no shared `PageHeader` component.

**Recommendation:** Extract a reusable `PageHeader` component that standardizes the title + description + action buttons + breadcrumbs pattern across all pages.

**2.3 — Sidebar collapse/expand has no keyboard shortcut**
The sidebar has a collapse button, but power users have no keyboard shortcut to toggle it.

**Recommendation:** Add a keyboard shortcut (e.g., `Cmd+B` / `Ctrl+B`) via a `useEffect` listener.

---

## 3. Component Consistency

### Strengths
- shadcn/ui provides a strong foundation with accessible Radix primitives
- Button variants are well-defined with 6 variants and 4 sizes
- Card component has light/dark differentiation (white vs glass-morphism)
- Badge component has proper semantic variants

### Issues

**3.1 — Status badges are inconsistently implemented**
Status badges are defined ad-hoc in multiple places with hardcoded colors rather than using the Badge component's variant system:
- `dashboard/page.tsx:113-125` — `getStatusBadge()` uses inline `className` overrides
- `clients/page.tsx:158-169` — `StatusBadge` component uses inline `className` overrides
- Both bypass the badge variant system entirely

**Recommendation:** Extend the Badge component's `badgeVariants` to include status-specific variants (e.g., `active`, `processing`, `draft`, `error`, `prospect`, `paused`). This centralizes all status styling.

**3.2 — Summary/metric cards have no shared component**
The dashboard, clients page, and results page all build metric cards independently with slightly different structures:
- Dashboard: `<Card><CardContent className="pt-6">` with icon in colored circle
- Clients: `<Card className="p-4">` with icon in different colored circle
- Results: raw `<div className="rounded-lg border...">` not using Card component
- SummaryCards component: uses `<Card>` with yet another layout

**Recommendation:** Create a shared `MetricCard` component that standardizes the label/value/icon/description pattern.

**3.3 — Loading states vary across pages**
- Dashboard: `<Skeleton className="h-24 rounded-lg" />`
- Clients: `<Skeleton className="h-48 w-full rounded-xl" />`
- Client detail: Custom spinner with `border-4 border-primary/20 border-t-primary`
- Results: Different spinner with `border-b-2 border-primary`
- Clients page (Suspense): Yet another spinner pattern with `border-b-2 border-ring`

**Recommendation:** Create a shared `LoadingSpinner` component and standardize skeleton patterns with consistent border-radius values.

**3.4 — Empty states lack consistency**
- Dashboard action items: icon + "All caught up!" text
- Dashboard recent projects: icon + text + link button
- Clients: dashed border container + circular icon background + dynamic text

**Recommendation:** Create a shared `EmptyState` component with props for icon, title, description, and optional action button.

---

## 4. Accessibility

### Strengths
- Radix UI primitives provide built-in keyboard navigation and ARIA
- Breadcrumbs use `aria-label="Breadcrumb"`
- Mobile sidebar trigger has `sr-only` label
- Form inputs use labels (though inconsistently)

### Issues

**4.1 — Interactive cards lack proper semantics**
Dashboard metric cards and client rows use `onClick` on `<Card>` and `<div>` elements with `cursor-pointer` but are not focusable or keyboard-accessible:
- `dashboard/page.tsx:158` — Card with `onClick` but no `role="button"`, `tabIndex`, or `onKeyDown`
- `dashboard/page.tsx:251-254` — Action item `<div>` with `onClick` only

These are inaccessible to keyboard users and screen readers.

**Recommendation:** Either use `<button>` elements or add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space to all clickable card/div elements.

**4.2 — Login form labels are not associated with inputs**
In `login/page.tsx:125-126`, the label uses plain `<label className="text-sm font-medium">` without an `htmlFor` attribute, so it's not programmatically associated with the input. The signup page correctly uses `htmlFor`.

**Recommendation:** Add `htmlFor` attributes to all login form labels, or use the shadcn/ui `<Form>` / `<FormField>` components which handle this automatically.

**4.3 — Color-only status indication**
The US map legend and status badges rely solely on color to communicate state (red = nexus, green = no nexus, amber = approaching). Users with color vision deficiency cannot distinguish these.

**Recommendation:** Add secondary indicators — icons, patterns, or text labels alongside colors for critical status information.

**4.4 — Delete confirmation uses `window.confirm()`**
`clients/page.tsx:76` uses `window.confirm()` which is non-styleable, breaks the design system's visual consistency, and doesn't work well in all contexts.

**Recommendation:** Replace with a styled confirmation dialog using the existing Dialog/AlertDialog component.

---

## 5. Responsiveness

### Strengths
- Grid layouts use responsive breakpoints (`grid-cols-2 lg:grid-cols-4`)
- Sidebar collapses to Sheet drawer on mobile
- Header email is hidden on mobile (`hidden md:inline`)
- Form pages are properly centered and constrained

### Issues

**5.1 — Client detail page doesn't collapse context rail gracefully**
`clients/[id]/page.tsx:221` hides the context rail entirely below `xl` breakpoint (`hidden xl:block`). On tablets and smaller laptops, users lose the context rail with no way to access it.

**Recommendation:** On screens below `xl`, convert the context rail into a collapsible drawer or bottom sheet that can be toggled open.

**5.2 — Results page has fixed-width map legend that may wrap poorly**
`analysis/[id]/results/page.tsx:314` uses `flex flex-wrap justify-center gap-4` for the map legend, which works but on narrow screens the legend items may wrap in a confusing layout.

**Recommendation:** Consider a 2-column or 3-column grid for the legend on small screens instead of free-flowing flex wrap.

**5.3 — Table components don't have horizontal scroll on mobile**
`clients/page.tsx:278-311` renders a full table that will overflow on mobile. The `overflow-hidden` on the container will clip content.

**Recommendation:** Change to `overflow-x-auto` to allow horizontal scrolling on the table container.

---

## 6. Typography & Spacing

### Strengths
- Consistent use of `tracking-tight` on headings
- Good hierarchy: `text-3xl font-bold` for page titles, `text-sm` for descriptions
- Muted foreground for secondary text is used consistently

### Issues

**6.1 — Metric card font sizes vary**
- Dashboard: `text-3xl font-bold`
- Clients: `text-2xl font-bold`
- Results: `text-4xl font-bold`
- SummaryCards: `text-4xl font-bold`

These should be consistent for the same type of information.

**Recommendation:** Standardize metric card values to `text-3xl font-bold` across all pages (or whichever size the team prefers), extracting this into a shared MetricCard component.

**6.2 — Inconsistent spacing between sections**
- Dashboard: `mb-8` between header and cards, `gap-6` between two-column layout
- Clients: `mb-8` between header and stats, `mb-6` between tabs and content
- Results: `mb-6` between all sections
- Settings: `mb-8` between header and account card

**Recommendation:** Establish a standard section spacing rhythm (e.g., `mb-8` between major sections, `gap-6` within sections).

---

## 7. Dark Mode Quality

### Strengths
- Dedicated dark mode shadow system with inner-glow borders
- Card uses glass-morphism effect (`backdrop-blur-sm`) in dark mode
- Input fields have dark mode hover/focus state overrides in globals.css

### Issues

**7.1 — Table cursor overrides are too aggressive**
`globals.css:256-259` sets `cursor: default !important` and `caret-color: transparent !important` on all table elements. This affects any input elements that might be rendered inside tables (e.g., inline editing) and uses `!important` which makes it difficult to override.

**Recommendation:** Scope this more narrowly, e.g., only apply to `table td` and `table th`, and avoid `!important`.

**7.2 — Dark mode badge/dot/banner system uses `!important` overrides on inline styles**
`globals.css:278-295` targets elements by their inline `style` attribute to switch dark mode colors. This is fragile — any change to the inline style variable names will break dark mode.

**Recommendation:** Refactor to use CSS custom properties directly in the component classes or use Tailwind's `dark:` variants instead of targeting inline style attributes.

---

## 8. Performance Considerations

### Strengths
- USMap is lazy-loaded with `dynamic()` to save ~200KB
- React Query handles caching and background refetching
- Skeleton loading states prevent layout shift

### Issues

**8.1 — SidebarProvider initializes from localStorage in state initializer**
`Sidebar.tsx:86-91` reads from `localStorage` in the `useState` initializer, which is fine, but then also runs a `useEffect` to read the same value again on mount. The `useEffect` is redundant.

**8.2 — No `React.memo` or `useMemo` on NavItem**
The `NavItem` component re-renders on every sidebar render even when its props haven't changed. With a small nav list this is negligible, but wrapping it in `React.memo` is free and a good practice.

---

## 9. Micro-Interactions & Polish

### Issues

**9.1 — Button press has `active:scale-95` but no transition duration**
`button.tsx:8` defines `active:scale-95` on all buttons. Without an explicit `duration-*` class, the scale snaps instantly, which feels abrupt.

**Recommendation:** Add `duration-100` or `duration-75` alongside `active:scale-95` for a subtle press animation.

**9.2 — No focus ring on cards used as buttons**
Clickable cards (dashboard metrics, action items, settings cards) have `hover:bg-muted/50` but no focus-visible ring, making keyboard focus invisible.

**Recommendation:** Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to all clickable card elements.

**9.3 — The "Documents (Coming Soon)" nav item lacks visual distinction**
The disabled nav item shows dimmed text and a "Soon" badge, but it still looks like a nav link. Users may repeatedly try to click it.

**Recommendation:** Consider removing it from the sidebar entirely until it's available, or add a clear visual lock icon.

---

## 10. Summary of Priority Recommendations

| Priority | Issue | Impact |
|----------|-------|--------|
| **High** | Clickable divs/cards lack keyboard accessibility (4.1) | Users cannot navigate with keyboard |
| **High** | Table container overflow hidden clips content on mobile (5.3) | Data inaccessible on mobile |
| **High** | Form labels not associated with inputs (4.2) | Screen reader accessibility |
| **Medium** | Status badges inconsistently hardcoded (3.1) | Maintenance burden, dark mode issues |
| **Medium** | Metric card pattern not standardized (3.2) | Visual inconsistency |
| **Medium** | Secondary/muted/accent tokens identical (1.1) | Semantic meaning lost |
| **Medium** | Sticky header overlaps sticky tabs (2.1) | Tabs disappear on scroll |
| **Medium** | Loading state patterns vary (3.3) | Visual inconsistency |
| **Low** | Chart colors same in light/dark (1.3) | Potential contrast issue |
| **Low** | Button active:scale lacks transition (9.1) | Micro-interaction feel |
| **Low** | SidebarProvider redundant localStorage read (8.1) | Minor perf |

---

*This review is based on static code analysis. A visual audit in-browser with real data and user testing would uncover additional issues around real-world contrast, responsiveness edge cases, and interaction flows.*
