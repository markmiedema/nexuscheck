# Theming Guide

## Overview

NexusCheck uses **shadcn/ui** theming with CSS variables defined in `app/globals.css`. The palette is built on **Slate** (structure) and **Gray** (content) tones for a professional, neutral appearance in both light and dark modes.

**Last verified against globals.css:** 2026-02-10

---

## Design Philosophy

- **Slate** = Structure (page backgrounds, containers, borders)
- **Gray** = Content (text hierarchy, icons, subtle elements)
- **Three neutral roles**: `secondary` (heaviest — buttons), `accent` (middle — hover/focus), `muted` (lightest — quiet backgrounds)
- **Dark mode depth** comes from background color stepping (Slate-800 → 700 → 600), not heavy shadows

---

## CSS Variables — Actual Values

### Light Mode (`:root`)

```css
--background: 220 20% 97%;           /* Cool platinum — page background */
--foreground: 222 47% 11%;           /* Deep slate — main text */

--card: 0 0% 100%;                   /* Pure white — elevated cards */
--card-foreground: 222 47% 11%;

--popover: 0 0% 100%;
--popover-foreground: 222 47% 11%;

--primary: 217.2 32.6% 17.5%;        /* Slate-800 — buttons, anchors */
--primary-foreground: 210 40% 98%;

--secondary: 214 30% 85%;            /* Slate-300 — clickable surfaces (heaviest neutral) */
--secondary-foreground: 222 47% 11%;

--muted: 220 16% 93%;                /* Light neutral — backgrounds, placeholders (lightest neutral) */
--muted-foreground: 215 16% 47%;

--accent: 214 22% 89%;               /* Mid neutral — hover/focus highlights (between secondary and muted) */
--accent-foreground: 222 47% 11%;

--destructive: 0 84.2% 60.2%;
--destructive-foreground: 210 40% 98%;

--border: 214 25% 80%;               /* Visible but not dominant */
--input: 214 25% 80%;                /* Matches border */
--ring: 217.2 32.6% 17.5%;           /* Slate-800 — focus rings */

--success: 142.1 76.2% 36.3%;
--warning: 32.1 94.6% 43.7%;
--info: 221.2 83.2% 53.3%;
```

### Dark Mode (`.dark`)

```css
--background: 217.2 32.6% 17.5%;     /* Slate-800 — page background */
--foreground: 214.3 31.8% 91.4%;     /* Slate-200 — main text */

--card: 215.3 25% 26.7%;             /* Slate-700 — one step up from background */
--card-foreground: 214.3 31.8% 91.4%;

--popover: 215.3 25% 26.7%;
--popover-foreground: 212.7 26.8% 83.9%;

--primary: 210 40% 98%;              /* Slate-50 — light accent on dark */
--primary-foreground: 217.2 32.6% 17.5%;

--secondary: 215.3 19.3% 34.5%;      /* Slate-600 — interactive surfaces */
--secondary-foreground: 210 40% 98%;

--muted: 215.3 19.3% 34.5%;          /* Slate-600 — quiet backgrounds */
--muted-foreground: 215 20.2% 65.1%; /* Slate-400 */

--accent: 215.4 16.3% 42%;           /* Between Slate-500 and 600 — hover/focus feedback */
--accent-foreground: 210 40% 98%;

--destructive: 0 62.8% 50%;
--destructive-foreground: 210 40% 98%;

--border: 215.3 19.3% 34.5%;         /* Slate-600 — subtle separation (~17pt gap from bg) */
--input: 215.4 16.3% 46.9%;          /* Slate-500 — form fields slightly brighter than borders */
--ring: 215 20.2% 65.1%;             /* Slate-400 — focus rings should be prominent */

--success: 142.1 70.6% 45.3%;
--warning: 32.1 94.6% 43.7%;
--info: 221.2 83.2% 53.3%;
```

---

## Using Colors in Components

### Semantic Variables (Preferred)

Use semantic tokens that automatically switch with the theme:

```tsx
<div className="bg-background text-foreground">
  <Card>
    <h1 className="text-primary">Title</h1>
    <p className="text-muted-foreground">Description</p>
  </Card>
</div>
```

### Tailwind Dark Mode Classes

For cases where semantic tokens don't cover your need:

```tsx
<div className="bg-white dark:bg-slate-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
</div>
```

Prefer semantic tokens. Use direct Tailwind classes only when you need a value that doesn't map to an existing token.

---

## Common Patterns

### Backgrounds

```tsx
bg-background                        /* Page — cool platinum / slate-800 */
bg-card                              /* Cards, popovers — white / slate-700 */
bg-muted                             /* Quiet sections, placeholders */
bg-secondary                         /* Button surfaces, clickable areas */
hover:bg-accent                      /* Hover/focus feedback */
```

### Text Hierarchy

```tsx
text-foreground                      /* Primary text */
text-muted-foreground                /* Secondary/tertiary text */
text-primary                         /* Emphasis, links */
```

### Borders

```tsx
border-border                        /* Default — applied globally via @apply */
border-input                         /* Form fields — slightly brighter in dark mode */
```

### Status Colors (Currently Hardcoded)

These use direct Tailwind classes and do not participate in theming:

```tsx
/* Success */
bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700

/* Processing / Info */
bg-blue-100 dark:bg-blue-900/30 text-blue-700

/* Warning */
bg-amber-100 dark:bg-amber-900/30 text-amber-700

/* Error */
bg-red-100 dark:bg-red-900/30 text-red-700
```

> **Future improvement:** These should be migrated to Badge component variants or CSS variable tokens so they adapt to theme changes.

---

## Shadow System

Shadows provide subtle depth reinforcement. Dark mode shadows are intentionally light — depth comes from background color stepping, not shadow intensity.

| Tier | Use case | Dark mode opacity |
|------|----------|-------------------|
| `shadow-soft` | Subtle lift | 0.2 / 0.15 |
| `shadow-card` | Default card elevation | 0.3 / 0.2 |
| `shadow-elevated` | Modals, drawers | 0.35 / 0.25 |
| `shadow-floating` | Tooltips, dropdowns | 0.4 / 0.3 |

Light mode shadows use a slate-blue tint (`--shadow-color: 220 25% 80%`) for a cool, cohesive feel.

---

## Paper Texture

The `bg-grainy` class on `<body>` adds a subtle SVG noise overlay and a soft radial gradient. This creates a "premium paper" feel.

The sidebar and header use opaque `bg-card` so the texture doesn't bleed through structural elements. The grain is visible in the gaps between cards and in the main content background.

---

## Theme Toggle

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

<ThemeToggle />
```

Or programmatically:

```tsx
import { useTheme } from 'next-themes'

const { theme, setTheme } = useTheme()
setTheme('dark')
```

---

## Key Principles

1. **Test both modes** when creating or modifying components
2. **Use semantic tokens** (`bg-card`, `text-foreground`) over hardcoded values (`bg-white`, `text-gray-900`)
3. **Maintain contrast** — dark mode uses ~17pt lightness gaps between background layers
4. **Shadows reinforce, not define** — dark mode depth comes from color stepping
5. **Focus rings should be prominent** — `--ring` is intentionally brighter than `--border`
6. **Use opacity for colored backgrounds in dark mode** — e.g., `dark:bg-green-900/10`

---

## Troubleshooting

**Theme not persisting:** Check localStorage in DevTools. Verify `ThemeProvider` is in `layout.tsx` with `enableSystem` and `suppressHydrationWarning` on `<html>`.

**Flash of wrong theme:** The `disableTransitionOnChange` prop on `ThemeProvider` prevents transition artifacts during theme switch.

**Colors not switching:** Check if using hardcoded colors instead of `dark:` variants or semantic tokens. Verify `.dark` class is being applied to the `<html>` element.

**Borders invisible in dark mode:** If you see no separation between elements, verify the component is using `border-border` (not a hardcoded color). `--border` is Slate-600 in dark mode.
