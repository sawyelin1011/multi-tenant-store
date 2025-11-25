import { useResponsive } from '@/hooks/useResponsive';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { HeaderNew } from './HeaderNew';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isMobile } = useResponsive();
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderNew />

        <main
          className={cn(
            'flex-1 overflow-y-auto bg-background',
            'p-4 md:p-6 lg:p-8',
            isMobile && 'pt-20'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
