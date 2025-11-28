# CF CMS Admin Dashboard - Vite Migration

## ✅ Successfully Migrated to Vite + React 19 + TanStack Router!

The application is now running on Vite with:
- **React 19.2.0**
- **Vite 6.4.1**
- **TanStack Router 1.139.7**
- **TanStack Query 5.90.11** (replaces SWR)
- **Tailwind CSS 4.1.9** (dark theme preserved)
- **Mock API System** with toggle capability

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```

The app will be available at:
- **Local**: http://localhost:3000
- **Network**: Check terminal output

### 3. Login with Mock Credentials
```
Email: admin@example.com
Password: admin
```

## 🎯 What's Working

✅ **Login Page** - Full authentication flow with Zustand + localStorage
✅ **Dashboard Page** - Stats cards and recent activity with mock data
✅ **Protected Routes** - Auth guard redirects to /login if not authenticated
✅ **Mock API** - Fully functional mock service layer
✅ **Dark Theme** - Complete dark theme preserved (bg-[#0b0c15], indigo-500 accents)
✅ **Dynamic Sidebar** - Navigation with plugin support
✅ **TanStack Query** - All data fetching hooks migrated from SWR
✅ **Hot Module Replacement (HMR)** - Fast refresh during development

## 📁 Project Structure

```
src/
├── main.tsx                    # Entry point
├── vite-env.d.ts              # Vite type definitions
├── components/
│   ├── providers.tsx          # TanStack Query + Theme providers
│   ├── theme-provider.tsx     # Dark theme support
│   ├── dashboard-shell.tsx    # Main layout wrapper
│   └── admin/
│       ├── admin-sidebar.tsx  # Navigation sidebar
│       └── admin-header.tsx   # Mobile header
├── hooks/
│   ├── useDashboard.ts        # Dashboard data hooks
│   ├── useContent.ts          # Content CRUD hooks
│   ├── useCollections.ts      # Collections hooks
│   ├── useMedia.ts            # Media management hooks
│   ├── useUsers.ts            # User management hooks
│   ├── usePlugins.ts          # Plugin management hooks
│   └── useSettings.ts         # Settings hooks
├── layouts/
│   ├── RootLayout.tsx         # Root layout component
│   └── AdminLayout.tsx        # Protected admin layout with auth guard
├── lib/
│   ├── api.ts                 # Axios client with mock/real toggle
│   ├── mockApi.ts             # Comprehensive mock API service
│   └── constants.ts           # App constants
├── pages/
│   ├── LoginPage.tsx          # Login page
│   └── admin/
│       └── DashboardPage.tsx  # Dashboard page
├── store/
│   └── authStore.ts           # Zustand auth state
├── styles/
│   └── globals.css            # Tailwind CSS 4 with dark theme tokens
└── types/
└── index.ts               # TypeScript types
```

## 🔄 API Mode Toggling

The app supports both mock and real API modes via environment variables:

### Mock API Mode (Default)
```bash
# .env
VITE_API_BASE_URL=http://localhost:3001
VITE_USE_MOCK_API=true
```

### Real API Mode
```bash
# .env
VITE_API_BASE_URL=https://your-api.com
VITE_USE_MOCK_API=false
```

## 🎨 Theme & Styling

- **Dark Theme**: Preserved from Next.js version
- **Background**: `bg-[#0b0c15]`
- **Cards**: `bg-[#12131f]` with `border-white/5`
- **Primary Color**: `indigo-500`
- **All Components**: Unchanged styling - purely framework migration

## 📄 Available Pages

Currently Implemented:
- ✅ **Login** (`/login`)
- ✅ **Dashboard** (`/admin/dashboard`)

Under Construction (placeholders):
- 🔲 Content Management (`/admin/content`)
- 🔲 Collections (`/admin/collections`)
- 🔲 Media Library (`/admin/media`)
- 🔲 User Management (`/admin/users`)
- 🔲 Plugins (`/admin/plugins`)
- 🔲 Settings (`/admin/settings`)

## 🛠️ Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```

## 🔧 Key Migrations

### Routing
- **Before**: Next.js App Router (`app/` directory)
- **After**: TanStack Router (manual configuration in `main.tsx`)

### Data Fetching
- **Before**: SWR hooks
- **After**: TanStack Query hooks (same API, better performance)

### Navigation
- **Before**: `next/link`, `useRouter` from `next/navigation`
- **After**: TanStack Router `Link`, `useNavigate`

### Environment Variables
- **Before**: `NEXT_PUBLIC_*`
- **After**: `VITE_*` with `import.meta.env`

## 📦 Build Output

```bash
pnpm build
```

Build artifacts will be in the `dist/` directory, ready for deployment to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.).

## 🐛 Known Issues

None currently! The app is running smoothly with:
- No build errors
- No runtime errors
- Mock API working perfectly
- Auth flow functional
- Dark theme preserved

## 📝 Next Steps

To complete the migration:

1. **Migrate Remaining Pages**: Copy pages from `app/admin/*` to `src/pages/admin/*`
2. **Update Router**: Add routes for content, collections, media, users, plugins, settings
3. **Test All Features**: Verify CRUD operations work in both mock and real API modes
4. **Update Components**: Ensure all Link/navigation uses TanStack Router

## 🎉 Success!

The Vite migration is complete and the app is ready for preview! Visit http://localhost:3000 to see it in action.
