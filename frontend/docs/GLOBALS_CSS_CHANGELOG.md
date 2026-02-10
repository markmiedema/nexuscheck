# globals.css Update — Changelog & Component Fixes

## What Changed in globals.css

### 1. Light Mode: Secondary / Muted / Accent Separated

**Before:** All three were `214 30% 85%` (identical)

**After:**

| Token | Value | Role |
| --- | --- | --- |
| `--secondary` | `214 30% 85%` | Clickable surfaces (buttons) — heaviest |
| `--accent` | `214 22% 89%` | Hover/focus highlights — middle |
| `--muted` | `220 16% 93%` | Quiet backgrounds, placeholders — lightest |

**Why:** Buttons, hover states, and background placeholders were visually identical. Now there's a clear three-step hierarchy.

---

### 2. Dark Mode: Borders Softened

**Before:** `--border: 215 20.2% 65.1%` (Slate-400, 47.6pt gap from background)
**After:** `--border: 215.3 19.3% 34.5%` (Slate-600, ~17pt gap from background)

**Why:** Borders were brighter than text in dark mode, drawing more attention than the content they framed. The new value proportionally matches the light mode border-to-background contrast ratio.

`--input` is set to Slate-500 (`215.4 16.3% 46.9%`) so form field borders remain slightly more prominent than structural borders — they're interactive and need to look "tappable."

`--ring` stays at Slate-400 (`215 20.2% 65.1%`) because focus rings *should* be the most visible border element.

---

### 3. Dark Mode: Accent Token Differentiated

**Before:** `--accent: 215.4 16.3% 46.9%` (Slate-500 — very bright for hover backgrounds)
**After:** `--accent: 215.4 16.3% 42%` (between Slate-500 and 600)

**Why:** The accent color is used for hover/focus backgrounds on ghost buttons, dropdown items, and menu items. At Slate-500 it was too bright a jump from the card background, making hovers feel flashy. The new value provides visible feedback without shouting.

---

### 4. Dark Mode: Shadows Reduced ~60-70%

**Before -> After opacity comparison:**

| Shadow tier | Before | After |
| --- | --- | --- |
| `shadow-soft` | 0.8 / 0.6 | 0.2 / 0.15 |
| `shadow-card` | 0.9 / 0.7 | 0.3 / 0.2 |
| `shadow-elevated` | 0.95 / 0.8 | 0.35 / 0.25 |
| `shadow-floating` | 1.0 / 0.9 | 0.4 / 0.3 |
| `bg-muted` shadow | 0.5 / 0.4 | 0.15 / 0.1 |

**Also removed:** The `inset 0 0 0 1px rgba(255, 255, 255, ...)` inner glow on card/elevated/floating shadows. These were compensating for invisible borders by adding a white hairline. With borders now at proper visibility (Slate-600), the inner glow is no longer needed.

**Also removed:** `!important` flags on `.dark .shadow-md` and `.dark .shadow-lg`. The selectors are already specific enough to override Tailwind defaults. The `!important` was redundant and would have fought with component-level shadow overrides.

---

### 5. Global Input Selector Overrides — Removed

**Before:** `globals.css` contained these rules:

```css
.dark input[type="text"],
.dark input[type="email"],
.dark input[type="password"],
.dark input[type="date"],
.dark textarea { ... }
/* Plus :hover and :focus variants */
```

**After:** Deleted entirely.

**Why:** These competed with component-level styles. The `Input` component uses `bg-background border-input`, the `SelectTrigger` uses the same tokens, and `Textarea` does too. With the global overrides removed, all form elements now consistently derive their colors from CSS variables. The `--input` variable at Slate-500 ensures form borders are visible.

If you need inputs to have a different *background* than `bg-background` in dark mode (i.e., you want them lighter than the page, not inset/darker), add a `--input-background` variable and reference it in the Input, Textarea, and Select components. But the inset pattern (darker inputs on lighter cards) is the more common dark mode convention.

---

### 6. Dark Mode: Chart Colors Bumped

**Before:** Same values as light mode
**After:** Lightness bumped +10-15% for each chart color

| Chart | Before | After |
| --- | --- | --- |
| `--chart-1` | `220 70% 50%` | `220 70% 65%` |
| `--chart-2` | `160 60% 45%` | `160 60% 58%` |
| `--chart-3` | `30 80% 55%` | `30 80% 65%` |
| `--chart-4` | `280 65% 60%` | `280 65% 70%` |
| `--chart-5` | `340 75% 55%` | `340 75% 65%` |

**Why:** Chart colors at their light mode lightness values had poor contrast against the Slate-800 dark background.

---

### 7. What Was NOT Changed

- All light mode values except secondary/muted/accent are untouched
- Dark mode background, card, popover, primary, foreground — all the same
- Grainy texture — same
- Badge/threshold/banner dark mode CSS overrides — same (these are functional, not color system)
- Table cursor fix — same
- Success/warning/info/destructive — same in both modes

---

## Component-Level Fixes (Applied)

### Fix 1: `components/ui/card.tsx`

```tsx
// Before
"bg-white dark:bg-card dark:backdrop-blur-sm"
// After
"bg-card"
```

**Why:** `bg-white` hardcodes the light mode value, bypassing `--card`. Since `--card` is already `0 0% 100%` (pure white) in light mode, this changes nothing visually but lets the token do its job. Removed `backdrop-blur-sm` too — with opaque cards and proper shadows, blur is unnecessary and adds GPU cost.

### Fix 2: `components/layout/Sidebar.tsx`

```tsx
// Before (desktop sidebar)
'bg-card/50'
// After
'bg-card'
```

**Why:** At 50% opacity, the grainy texture bleeds through the sidebar. An opaque sidebar provides a clean navigation surface. The grain texture is better as a detail that peeks through between content elements, not through structural chrome.

Also removed redundant `useEffect` that re-read localStorage after the `useState` initializer already handled it.

### Fix 3: `components/layout/AppLayout.tsx`

```tsx
// Before (AppHeader)
"bg-card/80 backdrop-blur-sm"
// After
"bg-card"
```

**Why:** Same reasoning as the sidebar. The blur was compensating for transparency, but an opaque header is cleaner. If you want a sticky header to feel "layered," a bottom border (which you already have via `border-b border-border`) is sufficient.

---

## Verify After Deploy

- [ ] Dashboard: Cards should have subtle (not heavy) shadows in dark mode
- [ ] Dashboard: Borders should be visible but not bright
- [ ] Sidebar: Should feel solid, not transparent
- [ ] Any form page: Input borders should be slightly brighter than card borders
- [ ] Skeleton loading states: Should be lighter/quieter than secondary buttons
- [ ] Dropdown menus: Hover state should be visible but not flashy
- [ ] Ghost buttons: Hover should use the new accent value
