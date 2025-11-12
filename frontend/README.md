# Nexus Check - Frontend

**Tech Stack:** Next.js 14.2.0 (App Router) + React 18 + TypeScript + Tailwind CSS
**Last Updated:** 2025-11-11

---

## 🏗️ Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (auth provider, toaster)
│   ├── page.tsx                  # Landing/home page
│   ├── globals.css               # Global styles and theme variables
│   ├── login/                    # Login page
│   ├── signup/                   # Signup page
│   ├── dashboard/                # Dashboard (auth required)
│   ├── analyses/                 # Analyses list page
│   ├── analysis/
│   │   ├── new/                  # Create new analysis
│   │   └── [id]/                 # Dynamic analysis routes
│   │       ├── mapping/          # Column mapping screen
│   │       ├── results/          # Results summary
│   │       └── states/           # State-by-state results
│   │           └── [stateCode]/  # Individual state detail
│   └── ...
│
├── components/                   # React components
│   ├── ProtectedRoute.tsx        # Authentication guard
│   ├── theme-provider.tsx        # Dark/light mode provider
│   ├── theme-toggle.tsx          # Theme switcher component
│   ├── analyses/                 # Analysis list components
│   │   └── README.md             # Component documentation
│   ├── analysis/                 # Analysis workflow components
│   ├── dashboard/                # Dashboard components
│   ├── layout/                   # Layout components (nav, breadcrumbs)
│   │   └── README.md             # Layout documentation
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...                   # 20+ UI components
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts              # Toast notification hook
│
├── lib/                          # Utilities and shared code
│   ├── api.ts                    # State detail API functions
│   ├── api/
│   │   ├── client.ts             # Axios client with auth
│   │   └── analyses.ts           # Analysis API functions
│   ├── stores/
│   │   └── authStore.ts          # Zustand auth state
│   ├── supabase/
│   │   └── client.ts             # Supabase client initialization
│   ├── utils.ts                  # Tailwind merge utilities
│   └── utils/
│       ├── errorHandler.ts       # Centralized error handling
│       └── README.md             # Error handling documentation
│
├── types/                        # TypeScript type definitions
│   └── states.ts                 # State-related types
│
├── docs/                         # Documentation
│   ├── THEMING.md                # Theme system guide
│   ├── COLOR_OPTIMIZATION_ANALYSIS.md  # Color palette analysis
│   └── SLATE_GRAY_OPTIMIZATION.md      # Gray/Slate palette guide
│
├── .env.example                  # Environment variable template
├── .env.local                    # Local environment (gitignored)
├── .gitignore                    # Git ignore rules
├── components.json               # shadcn/ui configuration
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_API_URL
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will start at: http://localhost:3000

---

## 📚 Key Concepts

### App Router (Next.js 14)

This project uses Next.js 14's App Router, not the Pages Router:
- Routes defined by folder structure in `app/`
- Server Components by default
- Client Components marked with `'use client'`
- Built-in loading and error states

### Authentication

- **Provider:** Supabase Auth
- **Flow:** JWT tokens stored in authStore (Zustand)
- **Protected Routes:** Wrapped with `<ProtectedRoute>` component
- **Auto-redirect:** Unauthenticated users redirected to /login

### State Management

- **Zustand:** Lightweight state management (auth store)
- **React Query:** Not used (direct API calls with axios)
- **Local state:** useState for component-specific state

### Styling

- **Tailwind CSS:** Utility-first CSS framework
- **shadcn/ui:** High-quality component library
- **Dark mode:** Full support via next-themes
- **Theme:** Slate (structure) + Gray (content) palette

---

## 🧪 Development Workflow

### Running the App

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Adding New Routes

1. Create folder in `app/` (e.g., `app/reports/`)
2. Add `page.tsx` for the route
3. Add `layout.tsx` if custom layout needed
4. Use `<ProtectedRoute>` for authenticated routes

**Example:**
```tsx
// app/reports/page.tsx
'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <AppLayout breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reports' },
      ]}>
        <h1>Reports</h1>
      </AppLayout>
    </ProtectedRoute>
  )
}
```

### Adding shadcn/ui Components

```bash
# Add a specific component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button input card dialog
```

### API Integration

Use the centralized API client:

```tsx
import apiClient from '@/lib/api/client'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'

const loadData = async () => {
  try {
    const response = await apiClient.get('/api/v1/endpoint')
    setData(response.data)
  } catch (error) {
    handleApiError(error, { userMessage: 'Failed to load data' })
  }
}
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers (auth, theme, toaster) |
| `app/globals.css` | Global styles and CSS variables for theming |
| `components/ProtectedRoute.tsx` | Authentication guard for protected pages |
| `components/layout/AppLayout.tsx` | Consistent page layout with nav/breadcrumbs |
| `lib/api/client.ts` | Axios client with auth interceptors |
| `lib/stores/authStore.ts` | Zustand store for authentication state |
| `lib/utils/errorHandler.ts` | Centralized error handling and toast notifications |
| `hooks/use-toast.ts` | Toast notification hook (Sonner) |

---

## 🎨 Theming & Styling

### Theme System

The app supports light and dark modes with a professional Slate + Gray color palette.

**See:** `docs/THEMING.md` for complete guide

**Quick Reference:**
```tsx
// Backgrounds
bg-background       // Page background (Slate-50/Slate-950)
bg-card             // Card background (white/Gray-900)

// Text
text-foreground     // Main text (Gray-900/Gray-50)
text-muted-foreground // Secondary text (Gray-500/Gray-400)

// Buttons
bg-primary          // Primary button (Slate-900/Gray-200)
bg-secondary        // Secondary button (Gray-100/Gray-800)
bg-destructive      // Delete/cancel buttons (red)

// Borders
border              // Standard borders (Gray-200/Gray-800)
```

### Theme Toggle

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

<ThemeToggle />
```

---

## 🔧 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Environment
NODE_ENV=development
```

**⚠️ Security:**
- Only variables prefixed with `NEXT_PUBLIC_` are accessible in client-side code
- Never commit `.env.local` to git
- The anon key is safe for client-side use (not the service role key)

---

## 🧩 Component Libraries

### shadcn/ui Components

Installed components (20+):
- `button`, `input`, `label`, `card`, `badge`
- `select`, `textarea`, `checkbox`, `radio-group`
- `dialog`, `dropdown-menu`, `popover`, `sheet`
- `table`, `tabs`, `toast`, `spinner`
- `accordion`, `alert`, `avatar`, `calendar`

**Documentation:** https://ui.shadcn.com/

### Third-Party Libraries

- **Sonner** - Toast notifications
- **next-themes** - Dark mode support
- **axios** - HTTP client
- **date-fns** - Date formatting
- **recharts** - Data visualization
- **react-dropzone** - File uploads
- **lucide-react** - Icon library

---

## 🛠️ Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build               # Production build
npm start                   # Start production server

# Code Quality
npm run lint                # Run ESLint
npm run type-check          # TypeScript checking

# Dependencies
npm install <package>       # Add dependency
npm install -D <package>    # Add dev dependency
npm update                  # Update all packages
```

---

## 🚨 Troubleshooting

### Build Errors

**Module not found:**
- Check import paths use `@/` alias (e.g., `@/components/...`)
- Verify file extensions (.tsx for React components)
- Run `npm install` to ensure dependencies are installed

**TypeScript errors:**
- Run `npm run type-check` to see all errors
- Check `tsconfig.json` for proper configuration
- Ensure all props are properly typed

### Runtime Errors

**Authentication not working:**
- Verify `.env.local` has correct Supabase credentials
- Check browser localStorage for auth tokens
- Verify backend JWT validation is configured

**API calls failing:**
- Check `NEXT_PUBLIC_API_URL` points to running backend
- Verify CORS is configured on backend
- Check browser network tab for error details

**Styles not applying:**
- Run `npm run dev` to rebuild with Tailwind
- Check `tailwind.config.js` includes all content paths
- Verify `globals.css` is imported in root layout

### Dark Mode Issues

**Theme not persisting:**
- Check ThemeProvider is in root layout
- Verify `suppressHydrationWarning` on `<html>` tag
- Check browser localStorage for theme key

**Colors not switching:**
- Ensure using semantic variables (bg-background, text-foreground)
- Check CSS variables defined in globals.css
- Verify `.dark` class applied to html element

---

## 📖 Related Documentation

### Internal Docs
- **Layout System:** `components/layout/README.md`
- **Error Handling:** `lib/utils/README.md`
- **Theming Guide:** `docs/THEMING.md`
- **Component Tips:** `components/analyses/README.md`

### External Docs
- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Supabase Auth:** https://supabase.com/docs/guides/auth

### Project Docs
- **API Specs:** `../_04-technical-specs/PHASE_3_TECHNICAL_ARCHITECTURE.md`
- **Integration Guide:** `../_04-technical-specs/INTEGRATION_AND_DEPENDENCIES.md`
- **Current Status:** `../_05-development/CURRENT_STATUS_2025-11-05.md`

---

## 🤝 Contributing

Before committing:
1. Run `npm run lint` to check for errors
2. Run `npm run type-check` for TypeScript errors
3. Test in both light and dark mode
4. Verify responsive design (mobile, tablet, desktop)
5. Update this README if adding new folders/patterns

---

## 🎯 Development Best Practices

### 1. Always Use TypeScript

Define interfaces for all props and API responses:
```tsx
interface UserProps {
  name: string
  email: string
}

function UserCard({ name, email }: UserProps) {
  // ...
}
```

### 2. Use Client Components Sparingly

Only add `'use client'` when needed (hooks, event handlers):
```tsx
// ✅ Server Component (default)
export default function StaticContent() {
  return <div>Static content</div>
}

// ✅ Client Component (when needed)
'use client'
export default function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### 3. Consistent Error Handling

Always use the error handler utilities:
```tsx
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'

try {
  await apiClient.post('/api/v1/endpoint', data)
  showSuccess('Success message')
} catch (error) {
  handleApiError(error, { userMessage: 'Failed to perform action' })
}
```

### 4. Protected Routes

Wrap authenticated pages with ProtectedRoute:
```tsx
<ProtectedRoute>
  <AppLayout>
    {/* page content */}
  </AppLayout>
</ProtectedRoute>
```

### 5. Responsive Design

Use Tailwind's responsive classes:
```tsx
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left</div>
  <div className="w-full md:w-1/2">Right</div>
</div>
```

---

**Questions?** See project documentation in `../_05-development/README_DEVELOPMENT.md`
