import { memo } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  colorClass?: string;
}

export const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon,
  colorClass = 'text-primary'
}: MetricCardProps) {
  return (
    <div className="metric-card" role="region" aria-label={title}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className={`text-2xl font-bold font-mono ${colorClass}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});
