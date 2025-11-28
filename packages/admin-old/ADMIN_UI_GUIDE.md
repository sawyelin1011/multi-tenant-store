# Admin UI - Production Ready Guide

## Overview

Production-grade admin dashboard built with:
- **Vite + React 18 + TypeScript** - Fast, modern build system
- **shadcn/ui** - Beautiful, accessible components
- **Tailwind CSS** - Utility-first styling with full dark mode support
- **Responsive Design** - Mobile-first with adaptive layouts
- **Collapsible Sidebar** - Icon-only mode by default, expandable
- **Real-time Charts** - Recharts for data visualization
- **Configuration-driven** - Customizable branding, themes, and features

## Features

### 🎨 Theme System
- **Dark/Light Mode** - Full support with proper contrast
- **Customizable Colors** - CSS variables for easy theming
- **Responsive Typography** - Optimized for all screen sizes

### 📱 Mobile-First Design
- **Responsive Grids** - 1 column mobile, 2 tablet, 4 desktop
- **Mobile Drawer** - Slide-out navigation
- **Touch-Optimized** - Large tap targets, smooth animations

### 🧭 Navigation
- **Docked Sidebar** - Always visible on desktop (left side)
- **Icon-Only Default** - Collapsed state shows icons
- **Expandable** - Click chevron to show labels
- **Mobile Menu** - Sheet overlay with full menu

### 📊 Dashboard
- **Stat Cards** - Key metrics with trends
- **Charts** - Sales, Orders, Revenue, Analytics
- **Recent Orders Table** - Latest transactions
- **Grid Layout** - Responsive across all devices

### 🔧 Configuration
- **Environment Variables** - API URL, branding, features
- **Feature Flags** - Enable/disable sections
- **Templates** - Default, dark, light, custom themes

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Configuration

Create `.env` file:

```env
# API
VITE_API_URL=http://localhost:3000/api
VITE_API_KEY=sk_test_admin123456

# Branding
VITE_APP_NAME=MTC Platform
VITE_COMPANY_NAME=Your Company
VITE_LOGO_URL=/logo.png
VITE_LOGO_SMALL_URL=/logo-small.png

# Theme
VITE_THEME=system
VITE_TEMPLATE=default

# Features
VITE_ENABLE_TENANTS=true
VITE_ENABLE_STORES=true
VITE_ENABLE_PRODUCTS=true
VITE_ENABLE_ORDERS=true
VITE_ENABLE_USERS=true
VITE_ENABLE_ANALYTICS=true
```

## File Structure

```
packages/admin/
├── src/
│   ├── App.tsx                    # Main app with routing
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles + theme
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Collapsible sidebar
│   │   │   ├── HeaderNew.tsx     # Top navigation
│   │   │   ├── MainLayout.tsx    # Page wrapper
│   │   │   └── Navigation.tsx    # Menu items
│   │   ├── dashboard/
│   │   │   ├── DashboardGrid.tsx # Stat cards grid
│   │   │   ├── StatCard.tsx      # Metric card
│   │   │   └── ChartCard.tsx     # Chart wrapper
│   │   ├── charts/
│   │   │   ├── SalesChart.tsx    # Line chart
│   │   │   ├── OrderStatusChart.tsx # Pie chart
│   │   │   ├── RevenueChart.tsx  # Bar chart
│   │   │   └── AnalyticsChart.tsx # Area chart
│   │   ├── tables/
│   │   │   ├── TenantsTable.tsx
│   │   │   ├── StoresTable.tsx
│   │   │   ├── ProductsTable.tsx
│   │   │   ├── OrdersTable.tsx
│   │   │   └── UsersTable.tsx
│   │   ├── dialogs/
│   │   │   ├── DeleteConfirmation.tsx
│   │   │   ├── CreateModal.tsx
│   │   │   └── BulkUploadModal.tsx
│   │   ├── common/
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorAlert.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── FilterBar.tsx
│   │   └── ui/                   # shadcn components
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
│   │   ├── useFetch.ts
│   │   ├── useSidebar.ts
│   │   ├── useResponsive.ts
│   │   └── useTheme.ts
│   ├── store/
│   │   ├── authStore.ts         # Zustand auth state
│   │   ├── uiStore.ts           # UI preferences
│   │   └── appStore.ts          # Global state
│   ├── lib/
│   │   ├── api.ts               # API client (Axios)
│   │   └── utils.ts             # Utilities
│   ├── config/
│   │   ├── admin.config.ts      # Main config
│   │   ├── branding.config.ts   # Branding
│   │   ├── template.config.ts   # Theme templates
│   │   └── environments/        # Per-env configs
│   ├── templates/
│   │   └── default/
│   │       ├── colors.ts        # Color palette
│   │       └── layout.ts        # Layout settings
│   └── types/
│       └── index.ts             # TypeScript types
├── public/                       # Static assets
├── components.json               # shadcn config
├── tailwind.config.ts           # Tailwind config
├── vite.config.ts               # Vite config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

## Customization

### Theme Colors

Edit `src/index.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Blue */
  --secondary: 210 40% 96.1%;    /* Gray */
  /* ... more colors */
}

.dark {
  --primary: 217.2 91.2% 59.8%;  /* Lighter blue */
  /* ... dark mode colors */
}
```

### Branding

Edit `src/config/branding.config.ts`:

```typescript
export const brandingConfig = {
  name: 'Your App Name',
  company: 'Your Company',
  logo: {
    light: '/logo-light.png',
    dark: '/logo-dark.png',
  },
};
```

### Navigation

Edit `src/components/layout/Navigation.tsx`:

```typescript
export const NAVIGATION_ITEMS = [
  {
    label: 'Custom Page',
    href: '/custom',
    icon: <CustomIcon />,
    featureFlag: true,
  },
];
```

## Responsive Breakpoints

```typescript
// Mobile: < 768px
// Tablet: 768px - 1024px
// Desktop: >= 1024px
```

## Grid System

```tsx
// Mobile: 1 column
// Tablet: 2 columns
// Desktop: 4 columns
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {/* Cards */}
</div>
```

## Sidebar Behavior

### Desktop
- Always visible and docked left
- Default: Collapsed (icon-only, 64px wide)
- Expanded: Full width (256px wide)
- Toggle button in header

### Mobile
- Hidden by default
- Hamburger menu button (top-left)
- Sheet drawer overlay when opened
- Full width (288px)

## API Integration

All API calls go through `src/lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// Fetch data
const tenants = await api.getTenants();
const products = await api.getProducts({ search: 'query' });

// Create/Update
await api.createTenant({ name: 'New Tenant' });
await api.updateProduct(id, { price: 99.99 });

// Delete
await api.deleteTenant(id);
```

## State Management

### Auth State (Zustand)
```typescript
import { useAuthStore } from '@/store/authStore';

const { isAuthenticated, setApiKey, logout } = useAuthStore();
```

### UI State
```typescript
import { useSidebar } from '@/hooks/useSidebar';
import { useTheme } from '@/hooks/useTheme';

const { isCollapsed, toggle } = useSidebar();
const { theme, setTheme } = useTheme();
```

## Charts

All charts use Recharts:

```tsx
import { SalesChart } from '@/components/charts/SalesChart';

<ChartCard title="Sales">
  <SalesChart data={customData} />
</ChartCard>
```

## Dark Mode

Toggle theme:

```typescript
import { useTheme } from '@/hooks/useTheme';

const { theme, setTheme } = useTheme();

// Toggle
setTheme(theme === 'dark' ? 'light' : 'dark');

// System preference
setTheme('system');
```

## Production Checklist

- [ ] Update `.env` with production API URL
- [ ] Customize branding (logo, colors, name)
- [ ] Configure authentication
- [ ] Test all responsive breakpoints
- [ ] Verify dark mode
- [ ] Test API integration
- [ ] Enable/disable features via config
- [ ] Optimize bundle size
- [ ] Add error boundaries
- [ ] Configure analytics

## Performance

- **Code Splitting** - Lazy load routes
- **Tree Shaking** - Remove unused code
- **CSS Purging** - Tailwind removes unused styles
- **Asset Optimization** - Vite optimizes images/fonts
- **Caching** - Service worker ready

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- **Keyboard Navigation** - Full support
- **Screen Readers** - ARIA labels
- **Focus Management** - Visible focus states
- **Color Contrast** - WCAG AA compliant
- **Responsive Text** - Scalable fonts

## Deployment

### Build
```bash
npm run build
```

Outputs to `dist/` directory.

### Serve
```bash
npm run preview
```

### Deploy
Upload `dist/` contents to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting

## Troubleshooting

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Dark mode not working
- Check `html` element has `class="dark"`
- Verify CSS variables in `index.css`
- Check `useTheme` hook implementation

### Sidebar not collapsing
- Clear localStorage: `localStorage.removeItem('sidebar-state')`
- Check `useSidebar` hook
- Verify responsive breakpoints

### API 404 errors
- Check API base URL in `.env`
- Verify backend is running
- Check API key is set
- Review `src/lib/api.ts` endpoints

## Support

For issues or questions:
- Check documentation
- Review examples in `/examples`
- Open an issue on GitHub
- Contact support team

---

Built with ❤️ by the Platform Team
