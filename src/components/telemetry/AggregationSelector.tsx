import { memo } from 'react';
import { Button } from '@/components/ui/button';
import type { AggregationType } from '@/types/telemetry';

const AGGREGATION_OPTIONS: { value: AggregationType; label: string; description: string }[] = [
  { value: 'count', label: 'Count', description: 'Number of events' },
  { value: 'avg', label: 'Average', description: 'Mean value' },
  { value: 'p95', label: 'P95', description: '95th percentile' },
  { value: 'sum', label: 'Sum', description: 'Total value' },
  { value: 'max', label: 'Max', description: 'Maximum value' },
];

interface AggregationSelectorProps {
  value: AggregationType;
  onChange: (type: AggregationType) => void;
}

export const AggregationSelector = memo(function AggregationSelector({ 
  value, 
  onChange 
}: AggregationSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Aggregation
      </label>
      <div 
        className="flex items-center rounded-lg border border-border bg-surface-elevated p-1 gap-1"
        role="radiogroup"
        aria-label="Select aggregation type"
      >
        {AGGREGATION_OPTIONS.map(({ value: optValue, label, description }) => (
          <Button
            key={optValue}
            variant={value === optValue ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange(optValue)}
            className={`px-3 h-7 text-xs font-medium focus-ring ${
              value === optValue ? '' : 'text-muted-foreground hover:text-foreground'
            }`}
            role="radio"
            aria-checked={value === optValue}
            aria-label={`${label}: ${description}`}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
});
