import { memo, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TimeRange } from '@/types/telemetry';

const HOUR = 60 * 60 * 1000;

interface TimeRangeOption {
  label: string;
  duration: number;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: '1h', duration: HOUR },
  { label: '6h', duration: 6 * HOUR },
  { label: '12h', duration: 12 * HOUR },
  { label: '24h', duration: 24 * HOUR },
];

interface TimeRangePickerProps {
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

export const TimeRangePicker = memo(function TimeRangePicker({ 
  timeRange, 
  onTimeRangeChange 
}: TimeRangePickerProps) {
  const currentDuration = timeRange.end - timeRange.start;

  const handleRangeSelect = useCallback((duration: number) => {
    const now = Date.now();
    onTimeRangeChange({
      start: now - duration,
      end: now,
    });
  }, [onTimeRangeChange]);

  const formatTimeRange = () => {
    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex items-center gap-3" role="group" aria-label="Select time range">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span className="font-mono text-xs">{formatTimeRange()}</span>
      </div>
      
      <div className="flex items-center rounded-lg border border-border bg-surface-elevated p-1 gap-1">
        {TIME_RANGE_OPTIONS.map(({ label, duration }) => {
          const isActive = Math.abs(currentDuration - duration) < HOUR / 2;
          return (
            <Button
              key={label}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleRangeSelect(duration)}
              className={`px-3 h-7 text-xs font-medium focus-ring ${
                isActive ? '' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={isActive}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
});
