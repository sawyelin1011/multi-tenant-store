# V0 Dashboard Integration Guide

## Status: IN PROGRESS

The v0-dashboard-demo repository has been cloned and integrated as the new admin UI. This document outlines what's been done and what remains.

## ✅ Completed

1. **Repository Cloned**: Copied v0-dashboard-demo to `/home/engine/project/packages/admin`
2. **Old Admin Backed Up**: Moved to `/home/engine/project/packages/admin-old`
3. **Package.json Updated**: 
   - Updated name to `@mtc-platform/admin`
   - Added MTC platform dependencies
   - Kept all v0 dashboard dependencies
   - Changed React version to 18.3.1 for compatibility

4. **API Client Adapted**: Updated `src/lib/api.ts`:
   - Changed base URL to `http://localhost:3000/api`
   - Added API key authentication
   - Added store context headers
   - Created endpoints for:
     - Tenants API
     - Stores API
     - Products API
     - Orders API
     - Users API
     - Analytics API

## 🚧 Remaining Tasks

### 1. Update AuthStore for Multi-Tenant
**File**: `src/store/authStore.ts`

Add these fields:
```typescript
interface AuthStore {
  // Existing
  token: string | null
  user: User | null
  isAuthenticated: boolean
  
  // NEW: Multi-Tenant
  apiKey: string | null
  currentStore: Store | null
  stores: Store[]
  currentTenant: Tenant | null
  
  // NEW: Actions
  setCurrentStore: (store: Store) => void
  setStores: (stores: Store[]) => void
  setApiKey: (key: string) => void
}
```

### 2. Create Store Selector Component
**New File**: `src/components/admin/store-selector.tsx`

```typescript
import { Select } from '@/components/ui/select'
import { useAuthStore } from '@/store/authStore'
import { storesApi } from '@/lib/api'

export function StoreSelector() {
  const { stores, currentStore, setCurrentStore } = useAuthStore()
  // Dropdown to switch between stores
  // Fetch stores on mount
  // Show current store name
  // Allow creating new store
}
```

### 3. Update Admin Header
**File**: `src/components/admin/admin-header.tsx`

Add `<StoreSelector />` to the header, probably in the top-right area before the user menu.

### 4. Rename Pages/Components

#### Collections → Products
- Rename: `src/pages/admin/collections/*` → `src/pages/admin/products/*`
- Update imports and routing

#### Content → Orders
- Rename: `src/pages/admin/content/*` → `src/pages/admin/orders/*`
- Adapt UI to show orders instead of CMS content

#### Media → Keep (can be used for product images)
- Update to connect to `/api/media` endpoints

###5. Create New Pages

#### Stores Page
**New File**: `src/pages/admin/stores/StoresPage.tsx`
- List all stores for current tenant
- Create new store
- Edit store settings
- Delete store
- Switch active store

#### Tenants Page (Super Admin Only)
**New File**: `src/pages/admin/tenants/TenantsPage.tsx`
- List all tenants
- Create new tenant
- Manage tenant settings

### 6. Update Hooks

#### Create useStores Hook
**New File**: `src/hooks/useStores.ts`
```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { storesApi } from '@/lib/api'

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list()
  })
}

export function useCreateStore() {
  return useMutation({
    mutationFn: (data: any) => storesApi.create(data)
  })
}
```

#### Rename useCollections → useProducts
**File**: `src/hooks/useCollections.ts` → `src/hooks/useProducts.ts`
- Update to use `productsApi` instead

#### Rename useContent → useOrders  
**File**: `src/hooks/useContent.ts` → `src/hooks/useOrders.ts`
- Update to use `ordersApi` instead

### 7. Update Navigation

**File**: `src/components/admin/admin-sidebar.tsx`

Change menu items from:
- Dashboard ✓ (keep)
- Collections → **Products**
- Content → **Orders**
- Media ✓ (keep)
- Users ✓ (keep)
- **NEW: Stores** (add)
- **NEW: Tenants** (super admin only)
- Settings ✓ (keep)
- Plugins ✓ (keep or remove)

### 8. Update Types

**File**: `src/types/index.ts`

Add multi-tenant types:
```typescript
export interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  status: 'active' | 'suspended'
  createdAt: string
  updatedAt: string
}

export interface Store {
  id: string
  tenantId: string
  name: string
  slug: string
  domain?: string
  status: 'active' | 'inactive'
  settings: StoreSettings
  createdAt: string
  updatedAt: string
}

export interface StoreSettings {
  currency: string
  language: string
  timezone: string
  theme?: string
}

export interface Product {
  id: string
  storeId: string
  name: string
  description: string
  price: number
  currency: string
  status: 'active' | 'draft' | 'archived'
  images: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  storeId: string
  customerEmail: string
  total: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}
```

### 9. Create .env.example

**New File**: `.env.example`
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=your_api_key_here

# App Configuration
VITE_APP_NAME=MTC Platform Admin
VITE_APP_VERSION=2.0.0

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PLUGINS=false
```

### 10. Update Main Entry

**File**: `src/main.tsx`

Remove Tanstack Router, use React Router instead:
```typescript
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import App from './App'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

### 11. Create App.tsx with Routes

**New File**: `src/App.tsx`
```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { ProductsPage } from './pages/admin/products/ProductsPage'
import { OrdersPage } from './pages/admin/orders/OrdersPage'
import { StoresPage } from './pages/admin/stores/StoresPage'
import { TenantsPage } from './pages/admin/tenants/TenantsPage'
import { UsersPage } from './pages/admin/users/UsersPage'
import { SettingsPage } from './pages/admin/settings/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products/*" element={<ProductsPage />} />
        <Route path="orders/*" element={<OrdersPage />} />
        <Route path="stores/*" element={<StoresPage />} />
        <Route path="tenants/*" element={<TenantsPage />} />
        <Route path="users/*" element={<UsersPage />} />
        <Route path="settings/*" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
```

### 12. Update AdminLayout

**File**: `src/layouts/AdminLayout.tsx`

Remove Tanstack Router dependencies, use React Router:
```typescript
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { DashboardShell } from '@/components/dashboard-shell'
import { storesApi } from '@/lib/api'

export function AdminLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, setStores } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      // Load stores on mount
      storesApi.list().then(stores => {
        setStores(stores)
        setLoading(false)
      })
    }
  }, [isAuthenticated])

  if (loading) return <div>Loading...</div>

  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  )
}
```

## 📦 Installation Steps

```bash
cd /home/engine/project/packages/admin

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API key

# Start development server
npm run dev
```

## 🎨 UI/UX Features Preserved

The v0-dashboard has excellent UI/UX features that are preserved:
- ✅ Dark theme by default
- ✅ Glassmorphism effects
- ✅ Smooth animations
- ✅ Responsive mobile design
- ✅ Collapsible sidebar
- ✅ Modern component library (Radix UI)
- ✅ Tailwind CSS 4
- ✅ Beautiful charts (Recharts)
- ✅ Toast notifications (Sonner)
- ✅ Form validation (React Hook Form + Zod)

## 🔄 Migration Checklist

- [ ] Update authStore with multi-tenant fields
- [ ] Create StoreSelector component
- [ ] Update admin-header with StoreSelector
- [ ] Rename collections → products
- [ ] Rename content → orders
- [ ] Create stores page
- [ ] Create tenants page
- [ ] Update navigation menu
- [ ] Create/update hooks (useStores, useProducts, useOrders)
- [ ] Update types with multi-tenant models
- [ ] Remove Tanstack Router, use React Router
- [ ] Create App.tsx with routes
- [ ] Update AdminLayout
- [ ] Create .env file
- [ ] Test all endpoints
- [ ] Test store switching
- [ ] Test responsive design
- [ ] Test authentication flow
- [ ] Build and deploy

## 📝 Notes

- The v0-dashboard uses React 19, but we downgraded to React 18.3.1 for better compatibility
- Tailwind CSS 4 is used (newer than our previous v3)
- Uses Tanstack Query for data fetching (excellent choice, keep it)
- Replace Tanstack Router with React Router Dom (simpler, already installed)
- The UI is production-ready and modern
- All Radix UI components are already included
- The dark theme and animations are superior to our previous implementation

## 🚀 Next Steps

1. **Complete all remaining tasks above** (estimate: 4-6 hours)
2. **Test thoroughly**
3. **Remove old admin backup**: `rm -rf /home/engine/project/packages/admin-old`
4. **Update documentation**
5. **Deploy**

## 📚 Resources

- Original v0-dashboard: https://github.com/sawyelin1011/v0-dashboard-demo
- MTC Platform Backend API: http://localhost:3000/api
- React Router: https://reactrouter.com
- Tanstack Query: https://tanstack.com/query
- Radix UI: https://www.radix-ui.com
- Tailwind CSS: https://tailwindcss.com

---

**Status**: Repository cloned and integrated. API client adapted. Remaining work: Update routing, rename components, create new pages, add store switching functionality.

**Estimate**: 4-6 hours to complete full integration.
