import { ArrowUpRight, PlugZap } from 'lucide-react';
import { Card, CardTitle, CardValue } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { brand } from '../config/brand';

const metrics = [
  { label: 'Active Tenants', value: '248', trend: '+18% vs last week' },
  { label: 'Enabled Plugins', value: '73', trend: '+6 new integrations' },
  { label: 'Pending Workflows', value: '12', trend: 'SLA 98% met' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-2">
            <Badge variant="success">Production Ready</Badge>
            <h2 className="text-3xl font-semibold text-slate-900">
              {brand.name} · {brand.platformName}
            </h2>
            <p className="max-w-2xl text-base text-slate-600">
              Deliver white-label commerce experiences with shadcn-powered UI blocks, plugin orchestration, and tenant-aware
              workflows.
            </p>
            <div className="flex gap-3">
              <Button size="lg">Launch Console</Button>
              <Button size="lg" variant="outline">
                Explore docs
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="ml-auto rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Deployment status</p>
            <ul className="mt-3 space-y-2">
              <li>• Admin UI build ready</li>
              <li>• Plugin toolkit synced</li>
              <li>• GitHub release checklist pending commit</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardTitle>{metric.label}</CardTitle>
            <CardValue>{metric.value}</CardValue>
            <p className="mt-4 text-sm text-slate-500">{metric.trend}</p>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-6">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-brand">
            <PlugZap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-500">Plugin toolkit</p>
            <h3 className="text-xl font-semibold text-slate-900">Scaffold integrations in seconds</h3>
            <p className="text-sm text-slate-500">
              Run <code className="rounded bg-slate-900 px-2 py-1 text-white">npx mtc-admin plugin scaffold</code> and focus on
              business logic while the CLI handles manifests, shadcn UI entries, and migrations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
