import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <Card className={cn('h-full border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300', className)}>
      <CardHeader>
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {title}
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-chart-1 animate-pulse"></div>
          </CardTitle>
          {description && <p className="text-sm text-muted-foreground mt-1.5">{description}</p>}
        </div>
      </CardHeader>
      <CardContent className="pt-0 sm:pt-2">{children}</CardContent>
    </Card>
  );
}
