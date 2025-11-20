import { Button } from '../ui/button';
import { brand } from '../../config/brand';
import { Bell, BookOpen, LifeBuoy } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/70 px-6 backdrop-blur">
      <div>
        <p className="text-sm font-medium text-slate-500">{brand.platformName}</p>
        <h1 className="text-xl font-semibold text-slate-900">Unified Admin Workspace</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" aria-label="Documentation" title="Documentation" className="text-slate-500">
          <BookOpen className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" aria-label="Support" title="Support" className="text-slate-500">
          <LifeBuoy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" aria-label="Alerts" title="Alerts" className="text-slate-500">
          <Bell className="h-4 w-4" />
        </Button>
        <Button size="sm">Launch Workspace</Button>
      </div>
    </header>
  );
}
