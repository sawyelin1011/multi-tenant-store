# Migration Status: Next.js to Vite + React 19 + TanStack Router

## Completed
✅ Project structure setup (src/ directory)
✅ Package.json updated with Vite, React 19, TanStack Router, TanStack Query
✅ Vite configuration (vite.config.ts)
✅ TypeScript configuration for Vite (tsconfig.json)
✅ HTML entry point (index.html)
✅ Environment variables (.env.example with VITE_ prefix)
✅ Tailwind CSS 4 configuration preserved (src/styles/globals.css)
✅ API client updated with mock/real toggle (src/lib/api.ts, src/lib/mockApi.ts)
✅ Mock API service layer implemented
✅ Zustand auth store migrated (removed 'use client')
✅ All hooks migrated from SWR to TanStack Query
✅ Providers updated to use TanStack Query
✅ Theme provider updated (removed 'use client')
✅ Main entry point created (src/main.tsx)
✅ Root layout created (src/layouts/RootLayout.tsx)
✅ Admin layout with auth guard created (src/layouts/AdminLayout.tsx)
✅ Login page migrated (src/pages/LoginPage.tsx)
✅ Dashboard page migrated (src/pages/admin/DashboardPage.tsx)
✅ Components moved to src/components
✅ .gitignore updated for Vite

## In Progress / Remaining
🔲 Migrate remaining admin pages (Content, Collections, Media, Users, Plugins, Settings)
🔲 Update components to use TanStack Router navigation (Link, useNavigate)
🔲 Update admin-sidebar.tsx to use TanStack Router
🔲 Add all admin routes to main.tsx router configuration
🔲 Test mock API mode
🔲 Test real API mode
🔲 Install dependencies (pnpm install)
🔲 Run dev server (pnpm dev)
🔲 Build test (pnpm build)

## Key Changes
- **Routing**: Next.js App Router → TanStack Router (manual configuration)
- **Data Fetching**: SWR → TanStack Query  
- **Navigation**: `next/link` & `useRouter` → `@tanstack/react-router` Link & `useNavigate`
- **Fonts**: `next/font/google` → `@fontsource-variable` packages
- **Environment**: `NEXT_PUBLIC_*` → `VITE_*` + `import.meta.env`
- **Build Tool**: Next.js → Vite
- **Entry Point**: app/page.tsx → src/main.tsx
- **No 'use client' directives needed**

## Environment Variables
```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_USE_MOCK_API=true  # Toggle mock/real API
```

## How to Complete Migration

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Create Remaining Pages
Copy all page files from `app/admin/*` to `src/pages/admin/*` and:
- Remove `'use client'` directive
- Replace `next/link` with `@tanstack/react-router` Link
- Replace `next/navigation` `useRouter` with `@tanstack/react-router` `useNavigate`
- Replace `useParams` from next/navigation with `@tanstack/react-router`

### 3. Update Components
- **src/components/admin/admin-sidebar.tsx**: Replace Next.js Link/usePathname with TanStack Router
- **src/components/dashboard-shell.tsx**: No changes needed

### 4. Extend Router
Add routes in `src/main.tsx` for:
- Content (list, create, edit)
- Collections (list, create, detail)
- Media
- Users (list, create, edit)
- Plugins (list, detail)
- Settings

### 5. Test
```bash
# Development
pnpm dev

# Build
pnpm build
pnpm preview
```

## Migration Notes
- Dark theme preserved (bg-[#0b0c15], indigo-500 accents)
- All component styling unchanged
- Auth flow identical (Bearer token + cookie)
- Dynamic sidebar with plugins functional
- Mock API matches real API structure
- All CRUD operations supported in mock mode

## Default Mock Credentials
```
Email: admin@example.com
Password: admin
```
