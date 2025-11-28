import './styles/globals.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router'
import { Providers } from './components/providers'
import { Analytics } from '@vercel/analytics/react'
import { useAuthStore } from './store/authStore'
import { RootLayout } from './layouts/RootLayout'
import { AdminLayout } from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import ContentPage from './pages/admin/content/ContentPage'
import CreateContentPage from './pages/admin/content/CreateContentPage'
import EditContentPage from './pages/admin/content/EditContentPage'
import CollectionsPage from './pages/admin/collections/CollectionsPage'
import CollectionDetailPage from './pages/admin/collections/CollectionDetailPage'
import MediaPage from './pages/admin/media/MediaPage'
import UsersPage from './pages/admin/users/UsersPage'
import PluginsPage from './pages/admin/plugins/PluginsPage'
import PluginSettingsPage from './pages/admin/plugins/PluginSettingsPage'
import SettingsPage from './pages/admin/settings/SettingsPage'

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/login' }) },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) throw redirect({ to: '/login' })
  },
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const adminContentRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/content',
  component: ContentPage,
})

const adminContentCreateRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/content/create',
  component: CreateContentPage,
})

const adminContentEditRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/content/$contentId/edit',
  component: EditContentPage,
})

const adminCollectionsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/collections',
  component: CollectionsPage,
})

const adminCollectionDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/collections/$collectionId',
  component: CollectionDetailPage,
})

const adminMediaRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/media',
  component: MediaPage,
})

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/users',
  component: UsersPage,
})

const adminPluginsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/plugins',
  component: PluginsPage,
})

const adminPluginSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/plugins/$pluginId/settings',
  component: PluginSettingsPage,
})

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminContentRoute,
    adminContentCreateRoute,
    adminContentEditRoute,
    adminCollectionsRoute,
    adminCollectionDetailRoute,
    adminMediaRoute,
    adminUsersRoute,
    adminPluginsRoute,
    adminPluginSettingsRoute,
    adminSettingsRoute,
  ]),
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
      <Analytics />
    </Providers>
  </StrictMode>,
)
