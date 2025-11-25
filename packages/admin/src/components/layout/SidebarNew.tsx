import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import { useSidebar } from '@/hooks/useSidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Store,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Layers,
} from 'lucide-react';
import { adminConfig } from '@/config/admin.config';

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: MenuItem[];
  enabled?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    enabled: true,
  },
  {
    label: 'Tenants',
    href: '/tenants',
    icon: <Building2 className="h-5 w-5" />,
    enabled: adminConfig.features.enableTenantManagement,
  },
  {
    label: 'Stores',
    href: '/stores',
    icon: <Store className="h-5 w-5" />,
    enabled: adminConfig.features.enableStoreManagement,
  },
  {
    label: 'Products',
    href: '/products',
    icon: <Package className="h-5 w-5" />,
    enabled: adminConfig.features.enableProductManagement,
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: <ShoppingCart className="h-5 w-5" />,
    enabled: adminConfig.features.enableOrderManagement,
  },
  {
    label: 'Users',
    href: '/users',
    icon: <Users className="h-5 w-5" />,
    enabled: adminConfig.features.enableUserManagement,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    enabled: adminConfig.features.enableAnalytics,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
    enabled: adminConfig.features.enableSettings,
  },
];

export function SidebarNew() {
  const { isCollapsed, toggle } = useSidebar();
  const { isMobile } = useResponsive();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const enabledMenuItems = MENU_ITEMS.filter((item) => item.enabled !== false);

  if (isMobile && !showMobileMenu) {
    return (
      <div className="fixed top-0 left-0 z-50 p-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowMobileMenu(true)}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      {isMobile && showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 md:relative md:z-0 flex flex-col',
          isCollapsed ? 'w-20' : 'w-64',
          isMobile && !showMobileMenu && '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Layers className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-sidebar-foreground truncate">
                  {adminConfig.branding.appName}
                </h1>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={isMobile ? () => setShowMobileMenu(false) : toggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isMobile ? (
              <X className="h-5 w-5" />
            ) : isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {enabledMenuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  window.location.pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </a>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="outline"
            size={isCollapsed ? 'icon' : 'default'}
            className="w-full"
            onClick={() => (window.location.href = '/settings')}
          >
            {isCollapsed ? <Settings className="h-4 w-4" /> : 'Settings'}
          </Button>
        </div>
      </aside>
    </>
  );
}
