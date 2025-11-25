# MTC Platform - Admin Dashboard

Production-ready admin dashboard built with Vite, React 18, TypeScript, shadcn/ui, and Tailwind CSS. Features responsive design, collapsible sidebar, customizable themes, and complete CRUD operations.

## Features

✅ **Modern Tech Stack**
- Vite 5 + React 18 + TypeScript
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS 3 + CSS Variables
- React Router v7 for navigation
- Zustand for state management
- Recharts for data visualization
- Axios for API calls
- React Hook Form + Zod for forms

✅ **Responsive Design**
- Mobile-first approach
- Collapsible sidebar with icon-only mode
- Touch-optimized interactions
- Breakpoints: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)

✅ **Dark Mode**
- System, Light, Dark theme options
- CSS variables for easy customization
- Persisted preferences

✅ **Feature Management**
- Configuration-driven features
- Environment-based settings
- Customizable branding
- Template system

✅ **Complete CRUD Pages**
- Dashboard with stats and charts
- Tenants management
- Stores management
- Products management (with bulk upload)
- Orders tracking
- Users management
- Analytics with charts
- Settings

## Quick Start

### Installation

```bash
cd packages/admin
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update environment variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_API_KEY=your_api_key_here

# Branding
VITE_APP_NAME=Your Company
VITE_COMPANY_NAME=Your Company Inc
VITE_LOGO_URL=/logo.png
VITE_LOGO_SMALL_URL=/logo-small.png

# Theme
VITE_THEME=system
VITE_TEMPLATE=default

# Features (true/false)
VITE_ENABLE_TENANTS=true
VITE_ENABLE_STORES=true
VITE_ENABLE_PRODUCTS=true
VITE_ENABLE_ORDERS=true
VITE_ENABLE_USERS=true
VITE_ENABLE_ANALYTICS=true

# Environment
VITE_ENV=development
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
packages/admin/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── HeaderNew.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── Navigation.tsx
│   │   ├── dashboard/       # Dashboard widgets
│   │   │   ├── StatCard.tsx
│   │   │   ├── DashboardGrid.tsx
│   │   │   ├── ChartCard.tsx
│   │   │   └── RecentOrdersTable.tsx
│   │   ├── tables/          # Data tables
│   │   │   ├── TenantsTable.tsx
│   │   │   ├── StoresTable.tsx
│   │   │   ├── ProductsTable.tsx
│   │   │   ├── OrdersTable.tsx
│   │   │   └── UsersTable.tsx
│   │   ├── charts/          # Recharts components
│   │   │   ├── SalesChart.tsx
│   │   │   ├── OrderStatusChart.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── AnalyticsChart.tsx
│   │   ├── dialogs/         # Modal dialogs
│   │   │   ├── DeleteConfirmation.tsx
│   │   │   ├── CreateModal.tsx
│   │   │   └── BulkUploadModal.tsx
│   │   └── common/          # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorAlert.tsx
│   │       ├── SearchBar.tsx
│   │       ├── FilterBar.tsx
│   │       └── Breadcrumbs.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Tenants.tsx
│   │   ├── Stores.tsx
│   │   ├── Products.tsx
│   │   ├── Orders.tsx
│   │   ├── Users.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useSidebar.ts
│   │   ├── useResponsive.ts
│   │   ├── useFetch.ts
│   │   └── useTheme.ts
│   ├── store/
│   │   ├── authStore.ts      # Zustand auth state
│   │   ├── uiStore.ts        # UI preferences
│   │   └── appStore.ts       # Global app state
│   ├── lib/
│   │   ├── api.ts            # API client (Axios)
│   │   └── utils.ts          # Utility functions
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── config/
│   │   ├── admin.config.ts   # Main configuration
│   │   ├── branding.config.ts
│   │   ├── template.config.ts
│   │   ├── config.ts         # Runtime config
│   │   └── environments/
│   │       ├── dev.ts
│   │       ├── staging.ts
│   │       └── prod.ts
│   ├── templates/
│   │   └── default/
│   │       ├── colors.ts
│   │       └── layout.ts
│   ├── App.tsx              # Router setup
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/
├── components.json          # shadcn/ui config
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── .env.example
├── package.json
└── README.md
```

## Configuration

### Admin Configuration (`src/config/admin.config.ts`)

```typescript
export const adminConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
  },
  branding: {
    appName: import.meta.env.VITE_APP_NAME || 'MTC Platform',
    logo: import.meta.env.VITE_LOGO_URL || '/logo.png',
    company: import.meta.env.VITE_COMPANY_NAME || 'Your Company',
  },
  theme: {
    defaultTheme: 'system',
    templates: ['default', 'dark', 'light', 'custom'],
  },
  features: {
    enableTenantManagement: true,
    enableStoreManagement: true,
    enableProductManagement: true,
    enableOrderManagement: true,
    enableUserManagement: true,
    enableAnalytics: true,
    enableSettings: true,
  },
  layout: {
    sidebarCollapsedByDefault: false,
    sidebarPosition: 'left',
  },
};
```

### Customizing Branding

1. **Update environment variables** in `.env`:
   ```env
   VITE_APP_NAME=My Platform
   VITE_COMPANY_NAME=My Company
   ```

2. **Replace logo files** in `public/`:
   - `logo.png` - Full logo
   - `logo-small.png` - Icon/small logo
   - `favicon.ico` - Browser icon

3. **Customize colors** in `src/templates/default/colors.ts`

### Adding New Pages

1. Create page component in `src/pages/`:
   ```tsx
   // src/pages/MyNewPage.tsx
   export function MyNewPage() {
     return <div>My New Page</div>;
   }
   ```

2. Add route in `src/App.tsx`:
   ```tsx
   <Route
     path="/my-page"
     element={
       <PrivateRoute>
         <MyNewPage />
       </PrivateRoute>
     }
   />
   ```

3. Add navigation item in `src/components/layout/Navigation.tsx`

## API Integration

### API Client

The app uses Axios with interceptors for authentication:

```typescript
// src/lib/api.ts
import axios from 'axios';
import { adminConfig } from '@/config/admin.config';

export const apiClient = axios.create({
  baseURL: adminConfig.api.baseUrl,
  timeout: adminConfig.api.timeout,
});

// Auto-attach API key to requests
apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }
  return config;
});

// Auto-redirect to login on 401
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Using API Hooks

```tsx
import { useApi } from '@/hooks/useApi';

function MyComponent() {
  const { data, loading, error, refetch } = useApi('/endpoint');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return <div>{JSON.stringify(data)}</div>;
}
```

### Direct API Calls

```tsx
import { api } from '@/lib/api';

async function fetchData() {
  const tenants = await api.getTenants();
  const tenant = await api.getTenant('id');
  await api.createTenant(data);
  await api.updateTenant('id', data);
  await api.deleteTenant('id');
}
```

## Authentication

The app uses API key authentication stored in localStorage:

```tsx
import { useAuthStore } from '@/store/authStore';

function LoginPage() {
  const { setApiKey } = useAuthStore();

  const handleLogin = (apiKey: string) => {
    localStorage.setItem('api_key', apiKey);
    setApiKey(apiKey);
    navigate('/dashboard');
  };
}
```

Protected routes automatically redirect to `/login` if not authenticated.

## Responsive Design

### Breakpoints

```typescript
// useResponsive hook
const { isMobile, isTablet, isDesktop, width } = useResponsive();

// Breakpoints:
// Mobile: < 768px
// Tablet: 768px - 1024px
// Desktop: > 1024px
```

### Sidebar Behavior

- **Desktop**: Full sidebar with labels
- **Desktop (collapsed)**: Icon-only sidebar (80px width)
- **Tablet**: Auto-collapse option
- **Mobile**: Overlay sidebar with backdrop

## Theming

### Switch Theme

```tsx
import { useTheme } from '@/hooks/useTheme';

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

### Customizing Colors

Edit CSS variables in `src/index.css`:

```css
:root {
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* ... more variables */
}
```

## Charts

Using Recharts for data visualization:

```tsx
import { SalesChart } from '@/components/charts/SalesChart';

function Dashboard() {
  const data = [
    { date: 'Jan', sales: 4000, orders: 240 },
    { date: 'Feb', sales: 3000, orders: 198 },
  ];

  return <SalesChart data={data} />;
}
```

Available charts:
- `SalesChart` - Line chart
- `OrderStatusChart` - Pie chart
- `RevenueChart` - Bar chart
- `AnalyticsChart` - Area chart

## Forms

Using React Hook Form + Zod for validation:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Environment-Specific Builds

```bash
# Development
VITE_ENV=development npm run build

# Staging
VITE_ENV=staging npm run build

# Production
VITE_ENV=production npm run build
```

### Deploy to Static Hosting

The built files can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Cloudflare Pages
- Any static file hosting

## Testing

```bash
# Run tests (if configured)
npm test

# Type checking
npm run build
```

## Troubleshooting

### API Connection Issues

1. Check `VITE_API_URL` in `.env`
2. Verify API server is running
3. Check browser console for errors
4. Ensure CORS is configured on backend

### Authentication Issues

1. Check API key is valid
2. Clear localStorage: `localStorage.clear()`
3. Re-login with valid API key

### Build Issues

1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

## License

MIT

## Support

For issues or questions, contact: support@example.com
