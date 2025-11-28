import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Menu, X, Zap } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-xl border-r border-border/50">
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
        {showLabels && !isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all group-hover:scale-105">
              <Zap className="h-5 w-5" />
            </div>
            <span className="font-bold text-base bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              {adminConfig.branding.appName}
            </span>
          </Link>
        )}
        {(isCollapsed || !showLabels) && (
          <Link to="/dashboard" className="flex items-center justify-center w-full group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all group-hover:scale-105">
              <Zap className="h-5 w-5" />
            </div>
          </Link>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="ml-auto shrink-0 hover:bg-accent/50 transition-all"
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
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
                'hover:bg-accent/50',
                isActive && 'bg-gradient-to-r from-primary/10 to-chart-1/10 text-primary border border-primary/20 shadow-lg shadow-primary/5',
                !isActive && 'hover:translate-x-0.5',
                (isCollapsed && !isMobile) && 'justify-center px-2'
              )}
              title={(isCollapsed && !isMobile) ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-chart-1/5 shine" />
              )}
              <span className={cn(
                "shrink-0 relative z-10 transition-all",
                isActive && "scale-110"
              )}>
                {item.icon}
              </span>
              {((!isCollapsed && !isMobile) || isMobile) && (
                <span className={cn(
                  "font-medium text-sm relative z-10 transition-all",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              )}
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-chart-1 rounded-l-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4">
        <div className={cn(
          'text-xs text-muted-foreground font-medium',
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
          className="fixed top-4 left-4 z-50 md:hidden shadow-lg bg-card/95 backdrop-blur-xl border-border/50 hover:bg-accent/50"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 border-border/50">
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
        'hidden md:flex flex-col border-r border-border/50 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <SidebarContent showLabels={true} />
    </aside>
  );
}
