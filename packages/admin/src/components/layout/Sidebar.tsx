import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { NAVIGATION_ITEMS } from './Navigation';
import { useResponsive } from '@/hooks/useResponsive';
import { useSidebar } from '@/hooks/useSidebar';
import { adminConfig } from '@/config/admin.config';

export function Sidebar() {
  const location = useLocation();
  const { isMobile } = useResponsive();
  const { isCollapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = ({ showLabels = true }) => (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {showLabels && !isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              M
            </div>
            <span className="font-semibold text-base">{adminConfig.branding.appName}</span>
          </Link>
        )}
        {(isCollapsed || !showLabels) && (
          <Link to="/dashboard" className="flex items-center justify-center w-full">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              M
            </div>
          </Link>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="ml-auto shrink-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="ml-auto shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    (isCollapsed && !isMobile) && 'justify-center px-2'
                  )}
                  title={(isCollapsed && !isMobile) ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {((!isCollapsed && !isMobile) || isMobile) && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <div className={cn(
          'text-xs text-muted-foreground',
          (isCollapsed && !isMobile) && 'text-center'
        )}>
          {(isCollapsed && !isMobile) ? '©' : `© 2024 ${adminConfig.branding.company}`}
        </div>
      </div>
    </div>
  );

  // Mobile Drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button - Fixed in top left */}
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden shadow-lg"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent showLabels={true} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop Sidebar - Always docked left
  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-card border-r transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent showLabels={true} />
    </aside>
  );
}
