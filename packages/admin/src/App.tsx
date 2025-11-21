import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { useEffect } from 'react';
import { injectBrandTheme } from './lib/theme';

export default function App() {
  useEffect(() => {
    injectBrandTheme();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-slate-50/70 px-6 py-8">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
