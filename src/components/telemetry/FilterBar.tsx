import { memo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { EventType, ServiceName, FilterState } from '@/types/telemetry';

const EVENT_TYPES: EventType[] = ['log', 'metric', 'trace', 'error', 'span'];
const SERVICES: ServiceName[] = ['api-gateway', 'auth-service', 'user-service', 'payment-service', 'notification-service'];

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  log: 'bg-data-1/20 text-data-1 border-data-1/30',
  metric: 'bg-data-2/20 text-data-2 border-data-2/30',
  trace: 'bg-data-3/20 text-data-3 border-data-3/30',
  error: 'bg-destructive/20 text-destructive border-destructive/30',
  span: 'bg-data-5/20 text-data-5 border-data-5/30',
};

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export const FilterBar = memo(function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const toggleEventType = useCallback((type: EventType) => {
    const current = filters.eventTypes;
    const newTypes = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFilterChange({ eventTypes: newTypes });
  }, [filters.eventTypes, onFilterChange]);

  const toggleService = useCallback((service: ServiceName) => {
    const current = filters.services;
    const newServices = current.includes(service)
      ? current.filter(s => s !== service)
      : [...current, service];
    onFilterChange({ services: newServices });
  }, [filters.services, onFilterChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ searchQuery: e.target.value });
  }, [onFilterChange]);

  const clearFilters = useCallback(() => {
    onFilterChange({ eventTypes: [], services: [], searchQuery: '' });
  }, [onFilterChange]);

  const hasActiveFilters = filters.eventTypes.length > 0 || 
    filters.services.length > 0 || 
    filters.searchQuery.length > 0;

  return (
    <div className="space-y-4" role="search" aria-label="Filter telemetry events">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search events..."
          value={filters.searchQuery}
          onChange={handleSearchChange}
          className="pl-10 bg-surface-elevated border-border focus-ring"
          aria-label="Search events by message content"
        />
      </div>

      {/* Event Type Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Event Types
          </label>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 focus-ring rounded"
              aria-label="Clear all filters"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by event type">
          {EVENT_TYPES.map(type => {
            const isActive = filters.eventTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleEventType(type)}
                className={`filter-chip ${isActive ? 'active' : EVENT_TYPE_COLORS[type]} focus-ring`}
                aria-pressed={isActive}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Service Filters */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Services
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by service">
          {SERVICES.map(service => {
            const isActive = filters.services.includes(service);
            return (
              <button
                key={service}
                onClick={() => toggleService(service)}
                className={`filter-chip ${isActive ? 'active' : ''} focus-ring`}
                aria-pressed={isActive}
              >
                {service}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
