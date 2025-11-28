import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Image,
  Users,
  Settings,
  Plug,
  ChevronLeft,
  ChevronRight,
  Store,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Plugin } from '@/types'

interface AdminSidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
  plugins?: Plugin[]
  onWidthChange?: (width: number) => void
}

export function AdminSidebarContent({ collapsed = false, className, plugins }: { collapsed?: boolean; className?: string; plugins?: Plugin[] }) {
  const router = useRouterState()
  const pathname = router.location.pathname
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const mainMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: FileText, label: 'Content', href: '/admin/content' },
    { icon: FolderOpen, label: 'Collections', href: '/admin/collections' },
    { icon: Image, label: 'Media', href: '/admin/media' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: Plug, label: 'Plugins', href: '/admin/plugins' },
  ]

  const settingsItems = [{ icon: Settings, label: 'Settings', href: '/admin/settings' }]

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className={cn('flex flex-col bg-[#0a0b11]', className)}>
      <div className={cn('flex items-center gap-3 p-4', collapsed ? 'justify-center' : 'px-6')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <Store className="w-5 h-5 text-white" />
        </div>
        <span
          className={cn(
            'font-bold text-lg tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden transition-all duration-300',
            collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block',
          )}
        >
          CF CMS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
        <div>
          <h3
            className={cn(
              'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-6 transition-all duration-300 whitespace-nowrap overflow-hidden',
              collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block',
            )}
          >
            Menu
          </h3>
          <nav className="space-y-1 px-3">
            {mainMenuItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                  isActive(item.href)
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                  collapsed && 'justify-center',
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-colors shrink-0',
                    isActive(item.href) ? 'text-indigo-400' : 'text-gray-500 group-hover:text-white',
                  )}
                />
                <span
                  className={cn(
                    'font-medium text-sm whitespace-nowrap transition-all duration-300',
                    collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block',
                  )}
                >
                  {item.label}
                </span>

                {isActive(item.href) && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {plugins && plugins.length > 0 && (
          <div>
            <h3
              className={cn(
                'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-6 transition-all duration-300 whitespace-nowrap overflow-hidden',
                collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block',
              )}
            >
              Plugins
            </h3>
            <nav className="space-y-1 px-3">
              {plugins.map((plugin) =>
                plugin.menuItems?.map((menuItem) => (
                  <Link
                    key={`${plugin.id}-${menuItem.href}`}
                    to={menuItem.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                      isActive(menuItem.href)
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5',
                      collapsed && 'justify-center',
                    )}
                    title={collapsed ? menuItem.label : undefined}
                  >
                    <Plug
                      className={cn(
                        'w-5 h-5 text-gray-500 group-hover:text-white shrink-0',
                        isActive(menuItem.href) && 'text-indigo-400',
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium text-sm whitespace-nowrap transition-all duration-300',
                        collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block',
                      )}
                    >
                      {menuItem.label}
                    </span>
                  </Link>
                )),
              )}
            </nav>
          </div>
        )}

        <div>
          <h3
            className={cn(
              'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-6 transition-all duration-300 whitespace-nowrap overflow-hidden',
              collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block',
            )}
          >
            System
          </h3>
          <nav className="space-y-1 px-3">
            {settingsItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  isActive(item.href)
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                  collapsed && 'justify-center',
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-colors shrink-0',
                    isActive(item.href) ? 'text-indigo-400' : 'text-gray-500 group-hover:text-white',
                  )}
                />
                <span
                  className={cn(
                    'font-medium text-sm whitespace-nowrap transition-all duration-300',
                    collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-[#0a0b11]">
        <div className={cn('flex items-center gap-3 px-2 transition-all duration-300', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div
            className={cn(
              'flex flex-col overflow-hidden transition-all duration-300',
              collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 flex',
            )}
          >
            <span className="text-sm font-bold text-white truncate">{user?.name || 'Admin'}</span>
            <span className="text-xs text-gray-500 truncate capitalize">{user?.role || 'admin'}</span>
          </div>
          {!collapsed && (
            <button onClick={handleLogout} title="Logout" className="ml-auto shrink-0">
              <LogOut className="w-4 h-4 text-gray-500 hover:text-red-400 cursor-pointer" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar({ isCollapsed, setIsCollapsed, plugins, onWidthChange }: AdminSidebarProps) {
  const asideRef = React.useRef<HTMLElement>(null)

  React.useLayoutEffect(() => {
    if (!asideRef.current || !onWidthChange) return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) {
        onWidthChange(width)
      }
    })

    observer.observe(asideRef.current)
    return () => observer.disconnect()
  }, [onWidthChange])

  return (
    <aside
      ref={asideRef}
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#0a0b11] border-r border-white/5 transition-all duration-300 z-50 flex flex-col',
        isCollapsed
          ? 'w-[70px]'
          : 'w-auto min-w-[70px] max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-3rem)] lg:w-64',
      )}
    >
      <AdminSidebarContent collapsed={isCollapsed} className="flex-1 min-h-0" plugins={plugins} />

      <div className="p-3 border-t border-white/5 bg-[#0a0b11]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full h-8 flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  )
}
