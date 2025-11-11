# Theming Guide

## Overview

The Nexus Check uses **shadcn/ui** theming with a combination of **Slate** (structure) and **Gray** (content) palettes for a cohesive, professional design across light and dark modes.

## Design Philosophy

- **Slate** = Structure (backgrounds, containers, page layouts)
- **Gray** = Content (text hierarchy, borders, cards)
- Creates consistent visual hierarchy and better contrast in both modes

---

## Color System

### Optimized Slate + Gray Combination

**Light Mode:**
- **Page Background**: Slate-50 (warm, subtle tint vs pure white)
- **Cards**: Pure white (creates elevation against Slate-50)
- **Text**: Gray-950 → Gray-600 (clear hierarchy)
- **Borders**: Gray-200 (subtle but visible)
- **Primary Buttons**: Slate-900 (dark, authoritative)

**Dark Mode:**
- **Page Background**: Slate-950 (deepest dark)
- **Cards**: Gray-900 (elevated from background)
- **Text**: Gray-50 → Gray-400 (readable hierarchy)
- **Borders**: Gray-800 (visible separation)
- **Primary Buttons**: Gray-200 (light accent on dark)

---

## CSS Variables

All colors are defined as CSS variables in `app/globals.css`:

### Light Mode (`:root`)

```css
--background: 210 40% 98%;       /* Slate-50 - warm page background */
--foreground: 220.9 39.3% 11%;   /* Gray-900 - main text */
--card: 0 0% 100%;               /* White - elevated cards */
--primary: 222.2 47.4% 11.2%;    /* Slate-900 - dark authoritative */
--secondary: 220 14.3% 95.9%;    /* Gray-100 - subtle backgrounds */
--muted: 220 14.3% 95.9%;        /* Gray-100 */
--muted-foreground: 220 8.9% 46.1%; /* Gray-500 - muted text */
--border: 220 13% 91%;           /* Gray-200 - subtle borders */
--destructive: 0 84.2% 60.2%;    /* Red for errors */
```

### Dark Mode (`.dark`)

```css
--background: 222.2 84% 4.9%;    /* Slate-950 - deepest background */
--foreground: 210 20% 98%;       /* Gray-50 - main text */
--card: 220.9 39.3% 11%;         /* Gray-900 - elevated cards */
--primary: 220 13% 91%;          /* Gray-200 - light accent */
--primary-foreground: 220.9 39.3% 11%; /* Gray-900 - dark text on button */
--secondary: 215 27.9% 16.9%;    /* Gray-800 - mid-tone */
--muted: 215 27.9% 16.9%;        /* Gray-800 */
--muted-foreground: 217.9 10.6% 64.9%; /* Gray-400 - muted text */
--border: 215 27.9% 16.9%;       /* Gray-800 - visible borders */
--destructive: 0 62.8% 30.6%;    /* Darker red for dark mode */
```

---

## Using Colors in Components

### Semantic Color Variables (Recommended)

Use semantic variables that automatically switch with theme:

```tsx
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Tailwind Dark Mode Classes

For custom colors, use dark mode variants:

```tsx
<div className="bg-white dark:bg-slate-900">
  <p className="text-gray-900 dark:text-gray-100">Text</p>
  <div className="border border-gray-200 dark:border-slate-700" />
</div>
```

---

## Common Patterns

### Backgrounds

```tsx
/* Page layouts - Use Slate for warmth */
bg-slate-50 dark:bg-slate-950

/* Cards, containers - Use white/Gray-900 for elevation */
bg-white dark:bg-gray-900

/* Subtle backgrounds - Gray-50/Gray-800 */
bg-gray-50 dark:bg-gray-800

/* Hover states */
hover:bg-gray-100 dark:hover:bg-gray-800

/* Success backgrounds */
bg-green-50 dark:bg-green-900/10

/* Error backgrounds */
bg-red-50 dark:bg-red-900/10

/* Info backgrounds */
bg-blue-50 dark:bg-blue-900/10
```

### Text Colors (use Gray palette for hierarchy)

```tsx
/* Headings */
text-gray-950 dark:text-gray-50

/* Primary text */
text-gray-900 dark:text-gray-100

/* Secondary text */
text-gray-700 dark:text-gray-300

/* Tertiary text */
text-gray-600 dark:text-gray-400

/* Muted text */
text-gray-500 dark:text-gray-500

/* Disabled text */
text-gray-400 dark:text-gray-600
```

### Borders (use Gray for better visibility)

```tsx
/* Default borders */
border-gray-200 dark:border-gray-800

/* Emphasized borders */
border-gray-300 dark:border-gray-700

/* Input borders */
border-gray-300 dark:border-gray-800
```

---

## Theme Toggle

### Using ThemeToggle Component

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

<ThemeToggle />
```

### Using useTheme Hook

```tsx
import { useTheme } from 'next-themes'

function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme('dark')}>
      Switch to dark mode
    </button>
  )
}
```

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

```tsx
bg-green-50 dark:bg-green-900/10
```

### 5. Don't Hardcode Shadows

Use Tailwind's shadow utilities - they adapt to theme:

```tsx
shadow-sm  /* Works in both modes */
shadow-lg  /* Works in both modes */
```

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
