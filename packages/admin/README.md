# MTC Platform Admin Dashboard

> **Multi-Tenant Commerce Platform Admin Interface**  
> Modern, production-ready admin dashboard built with React, Vite, TailwindCSS, and Radix UI

## 🎨 Overview

This admin dashboard is based on the excellent [v0-dashboard-demo](https://github.com/sawyelin1011/v0-dashboard-demo) and adapted for the MTC Platform's multi-tenant e-commerce system.

### Features

✨ **Modern UI/UX**
- Dark theme optimized for long sessions
- Glassmorphism effects and smooth animations
- Fully responsive (mobile, tablet, desktop)
- Collapsible sidebar with icon-only mode

🏪 **Multi-Tenant Commerce**
- Store selector to switch between stores
- Tenant management (super admin)
- Product catalog management
- Order processing and fulfillment
- User and role management

🚀 **Tech Stack**
- **React 18.3.1** - UI framework
- **Vite 5.4** - Build tool and dev server
- **TailwindCSS 3.4** - Utility-first CSS
- **Radix UI** - Headless component primitives
- **Tanstack Query** - Data fetching and caching
- **React Router Dom** - Client-side routing
- **Axios** - HTTP client
- **Zustand** - State management
- **React Hook Form + Zod** - Form validation
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons

## 📦 Installation

```bash
cd /home/engine/project/packages/admin

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your API key
nano .env
```

## 🚀 Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🔑 Environment Variables

Create a `.env` file:

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

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── admin-header.tsx      # Top navigation bar
│   │   ├── admin-sidebar.tsx     # Left sidebar navigation
│   │   └── store-selector.tsx    # Store switching dropdown
│   ├── ui/                        # Radix UI components
│   └── dashboard-shell.tsx        # Main layout wrapper
├── pages/
│   ├── admin/
│   │   ├── DashboardPage.tsx     # Analytics overview
│   │   ├── products/             # Product management
│   │   ├── orders/               # Order processing
│   │   ├── stores/               # Store management
│   │   ├── tenants/              # Tenant management
│   │   ├── users/                # User management
│   │   └── settings/             # App settings
│   └── LoginPage.tsx             # Authentication
├── hooks/
│   ├── useProducts.ts            # Product data hooks
│   ├── useOrders.ts              # Order data hooks
│   ├── useStores.ts              # Store data hooks
│   └── useDashboard.ts           # Dashboard metrics
├── lib/
│   ├── api.ts                    # API client & endpoints
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # App constants
├── store/
│   └── authStore.ts              # Auth & app state
├── types/
│   └── index.ts                  # TypeScript types
├── layouts/
│   ├── AdminLayout.tsx           # Protected layout
│   └── RootLayout.tsx            # Root layout
├── config/
│   └── themes.ts                 # Theme configuration
├── styles/
│   └── globals.css               # Global styles
├── App.tsx                       # Main app component
└── main.tsx                      # Entry point
```

## 🌐 API Endpoints

All endpoints use the base URL: `http://localhost:3000/api`

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Current user info
- `POST /auth/refresh` - Refresh token

### Tenants
- `GET /tenants` - List all tenants
- `POST /tenants` - Create tenant
- `GET /tenants/:id` - Get tenant
- `PATCH /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant

### Stores
- `GET /stores` - List stores
- `POST /stores` - Create store
- `GET /stores/:id` - Get store
- `PATCH /stores/:id` - Update store
- `DELETE /stores/:id` - Delete store

### Products
- `GET /products` - List products
- `POST /products` - Create product
- `GET /products/:id` - Get product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Orders
- `GET /orders` - List orders
- `GET /orders/:id` - Get order
- `PATCH /orders/:id` - Update order status

### Users
- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/:id` - Get user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Analytics
- `GET /analytics/dashboard` - Dashboard metrics
- `GET /analytics/sales` - Sales data
- `GET /analytics/revenue` - Revenue data

## 🔐 Authentication

The admin uses two authentication methods:

1. **API Key Authentication** (development)
   - Set `VITE_API_KEY` in `.env`
   - Sent as `x-api-key` header

2. **Bearer Token** (production)
   - Login via `/auth/login`
   - Token stored in Zustand
   - Sent as `Authorization: Bearer {token}`

## 🏪 Store Context

When managing resources for a specific store:
- Select store from dropdown in header
- Store ID sent as `x-store-id` header
- All API requests scoped to selected store

## 🎨 Theming

The dashboard uses a dark theme by default with:
- Custom color palette (indigo/purple gradient)
- Glassmorphism effects
- Smooth animations and transitions
- Responsive layouts

To customize colors, edit `src/config/themes.ts` and Tailwind config.

## 📱 Responsive Design

The dashboard is fully responsive:
- **Mobile** (< 640px): Bottom navigation, mobile menu
- **Tablet** (640-1024px): Sidebar collapses to icons
- **Desktop** (>1024px): Full sidebar with labels

## 🧩 Components

### Radix UI Components Included
- Accordion, Alert Dialog, Avatar
- Button, Card, Checkbox
- Dialog, Dropdown Menu
- Form, Input, Label
- Select, Separator, Sheet
- Tabs, Table, Toast
- Tooltip, and more...

All styled with Tailwind and customizable.

## 🔧 Customization

### Adding a New Page

1. Create page component:
```typescript
// src/pages/admin/custom/CustomPage.tsx
export function CustomPage() {
  return (
    <div>
      <h1>Custom Page</h1>
      {/* Your content */}
    </div>
  )
}
```

2. Add route to `src/App.tsx`:
```typescript
<Route path="custom" element={<CustomPage />} />
```

3. Add to navigation in `src/components/admin/admin-sidebar.tsx`:
```typescript
{ icon: CustomIcon, label: 'Custom', href: '/admin/custom' }
```

### Creating API Hooks

```typescript
// src/hooks/useCustom.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export function useCustomList() {
  return useQuery({
    queryKey: ['custom'],
    queryFn: () => apiClient.get('/custom')
  })
}

export function useCreateCustom() {
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/custom', data)
  })
}
```

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Connection Issues

1. Check backend is running: `http://localhost:3000`
2. Verify API key in `.env`
3. Check browser console for errors
4. Check network tab for failed requests

### Authentication Problems

1. Clear browser localStorage
2. Check API key is valid
3. Verify `/auth/login` endpoint works
4. Check token expiration

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tanstack Query Documentation](https://tanstack.com/query)
- [React Router Documentation](https://reactrouter.com)
- [Original v0-dashboard-demo](https://github.com/sawyelin1011/v0-dashboard-demo)

## ⚠️ Migration Status

🚧 **Work in Progress**

The dashboard is currently being adapted from the v0-dashboard-demo (CMS) to MTC Platform (ecommerce).

See `INTEGRATION_GUIDE.md` for detailed migration tasks and progress.

### Completed
- ✅ Repository cloned and integrated
- ✅ Package.json updated
- ✅ API client adapted for multi-tenant
- ✅ Authentication configured

### Remaining
- ⏳ Rename Collections → Products
- ⏳ Rename Content → Orders
- ⏳ Create Store Selector component
- ⏳ Create Stores management page
- ⏳ Create Tenants management page
- ⏳ Update navigation menu
- ⏳ Update AuthStore with multi-tenant fields
- ⏳ Replace Tanstack Router with React Router
- ⏳ Create App.tsx with routes
- ⏳ Test all endpoints

**Estimated completion:** 4-6 hours

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is a private monorepo package. For contributions, please follow the standard Git workflow.

## 📞 Support

For issues or questions:
- Check `INTEGRATION_GUIDE.md` for detailed documentation
- Review `QUICK_START.sh` for setup script
- Contact platform team

---

**Version:** 2.0.0  
**Last Updated:** 2025-01-25  
**Status:** Integration in Progress
