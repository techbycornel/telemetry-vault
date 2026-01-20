import { memo, CSSProperties, ReactElement } from 'react';
import { List } from 'react-window';
import type { TelemetryEvent, EventType } from '@/types/telemetry';

interface VirtualizedEventTableProps {
  events: TelemetryEvent[];
  height?: number;
}

const EVENT_TYPE_BADGES: Record<EventType, string> = {
  log: 'bg-data-1/20 text-data-1',
  metric: 'bg-data-2/20 text-data-2',
  trace: 'bg-data-3/20 text-data-3',
  error: 'bg-destructive/20 text-destructive',
  span: 'bg-data-5/20 text-data-5',
};

const LEVEL_COLORS: Record<string, string> = {
  debug: 'text-muted-foreground',
  info: 'text-info',
  warn: 'text-warning',
  error: 'text-destructive',
};

const ROW_HEIGHT = 48;

const formatTimestamp = (ts: number) => {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
  });
};

interface CustomRowProps {
  events: TelemetryEvent[];
}

interface RowComponentProps {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: CSSProperties;
  events: TelemetryEvent[];
}

function EventRow({ index, style, events, ariaAttributes }: RowComponentProps): ReactElement {
  const event = events[index];
  
  return (
    <div 
      style={style}
      className="data-table-row flex items-center gap-4 px-4 text-sm"
      {...ariaAttributes}
    >
      <div className="w-20 font-mono text-xs text-muted-foreground flex-shrink-0">
        {formatTimestamp(event.timestamp)}
      </div>
      
      <div className="w-16 flex-shrink-0">
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${EVENT_TYPE_BADGES[event.eventType]}`}>
          {event.eventType}
        </span>
      </div>
      
      <div className="w-32 font-mono text-xs text-muted-foreground truncate flex-shrink-0">
        {event.service}
      </div>
      
      <div className="w-12 font-mono text-xs flex-shrink-0">
        <span className={LEVEL_COLORS[event.level || 'info']}>
          {event.level?.toUpperCase()}
        </span>
      </div>
      
      <div className="w-16 font-mono text-xs text-primary text-right flex-shrink-0">
        {event.value.toFixed(1)}
      </div>
      
      <div className="flex-1 truncate text-xs text-muted-foreground" title={event.message}>
        {event.message}
      </div>
    </div>
  );
}

export const VirtualizedEventTable = memo(function VirtualizedEventTable({ 
  events,
  height = 400
}: VirtualizedEventTableProps) {
  if (events.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No events match the current filters
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card" aria-label="Telemetry events table">
      {/* Header */}
      <div 
        className="flex items-center gap-4 px-4 py-3 bg-surface-elevated border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider"
      >
        <div className="w-20 flex-shrink-0">Time</div>
        <div className="w-16 flex-shrink-0">Type</div>
        <div className="w-32 flex-shrink-0">Service</div>
        <div className="w-12 flex-shrink-0">Level</div>
        <div className="w-16 text-right flex-shrink-0">Value</div>
        <div className="flex-1">Message</div>
      </div>
      
      {/* Virtualized rows */}
      <List<CustomRowProps>
        style={{ height }}
        rowCount={events.length}
        rowHeight={ROW_HEIGHT}
        rowProps={{ events }}
        rowComponent={EventRow}
        className="scrollbar-thin"
        overscanCount={5}
      />
    </div>
  );
});
