import { Sidebar } from './Sidebar';
import { HeaderNew } from './HeaderNew';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderNew />

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8 animate-in">
          <div className="w-full max-w-screen-2xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
