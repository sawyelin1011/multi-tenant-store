import type { ReactNode } from 'react';
import { brand } from '../../config/brand';
import { cn } from '../../lib/utils';
import { Layers, PlugZap, Settings, Store } from 'lucide-react';

const iconMap = new Map<string, ReactNode>([
  ['dashboard', <Store key="dashboard" className="h-4 w-4" />],
  ['plugins', <PlugZap key="plugins" className="h-4 w-4" />],
  ['settings', <Settings key="settings" className="h-4 w-4" />],
]);

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/80 p-6 lg:flex">
      <div className="flex items-center gap-3 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-brand">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{brand.name}</p>
          <p className="text-xs text-slate-500">{brand.tagline}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {brand.navigation.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:text-slate-900',
              item.href === '/dashboard' && 'bg-slate-100 text-slate-900',
            )}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              {iconMap.get(item.label.toLowerCase()) ?? <PlugZap className="h-4 w-4" />}
            </span>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-10 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
        Need help? Email
        <a href={`mailto:${brand.supportEmail}`} className="ml-1 font-medium text-brand">
          {brand.supportEmail}
        </a>
      </div>
    </aside>
  );
}
