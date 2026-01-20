import { useMemo, useCallback } from 'react';
import { Activity, Database, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelemetryData } from '@/hooks/useTelemetryData';
import { MetricCard } from './MetricCard';
import { FilterBar } from './FilterBar';
import { TimeRangePicker } from './TimeRangePicker';
import { AggregationSelector } from './AggregationSelector';
import { TelemetryChart } from './TelemetryChart';
import { VirtualizedEventTable } from './VirtualizedEventTable';
import { LoadingOverlay } from './LoadingOverlay';
import type { FilterState, TimeRange } from '@/types/telemetry';

export function TelemetryDashboard() {
  const {
    filteredEvents,
    aggregatedData,
    stats,
    filters,
    aggregationType,
    isLoading,
    isGenerating,
    progress,
    setFilters,
    setAggregationType,
    regenerateData,
  } = useTelemetryData();

  const handleTimeRangeChange = useCallback((timeRange: TimeRange) => {
    setFilters({ timeRange });
  }, [setFilters]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(newFilters);
  }, [setFilters]);

  const errorCount = useMemo(() => {
    return stats.eventTypeCounts.error || 0;
  }, [stats.eventTypeCounts]);

  const avgValue = useMemo(() => {
    if (aggregatedData.length === 0) return 0;
    const sum = aggregatedData.reduce((acc, d) => acc + d.avg, 0);
    return sum / aggregatedData.length;
  }, [aggregatedData]);

  return (
    <div className="min-h-screen bg-background">
      <LoadingOverlay isVisible={isGenerating} progress={progress} />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Database className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Telemetry Vault</h1>
                <p className="text-xs text-muted-foreground">Real-time data exploration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <TimeRangePicker 
                timeRange={filters.timeRange} 
                onTimeRangeChange={handleTimeRangeChange} 
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateData()}
                className="gap-2 focus-ring"
                aria-label="Regenerate sample data"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Metrics Row */}
        <section aria-label="Key metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Events"
              value={stats.totalEvents}
              subtitle="Generated dataset"
              icon={<Database className="h-4 w-4" />}
            />
            <MetricCard
              title="Filtered Events"
              value={stats.filteredEvents}
              subtitle={`${((stats.filteredEvents / stats.totalEvents) * 100).toFixed(1)}% of total`}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              title="Avg Value"
              value={avgValue.toFixed(2)}
              subtitle="Across time buckets"
              icon={<Clock className="h-4 w-4" />}
            />
            <MetricCard
              title="Errors"
              value={errorCount}
              subtitle="Error events detected"
              icon={<AlertTriangle className="h-4 w-4" />}
              colorClass={errorCount > 0 ? 'text-destructive' : 'text-primary'}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="glass-panel rounded-lg p-4 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Filters</h2>
              <FilterBar filters={filters} onFilterChange={handleFilterChange} />
            </div>
            
            <div className="glass-panel rounded-lg p-4">
              <AggregationSelector 
                value={aggregationType} 
                onChange={setAggregationType} 
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Chart */}
            <section className="glass-panel rounded-lg p-4" aria-label="Time series visualization">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Time Series - {aggregationType.toUpperCase()}
                </h2>
                {isLoading && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Updating...
                  </span>
                )}
              </div>
              <TelemetryChart 
                data={aggregatedData} 
                aggregationType={aggregationType}
                isLoading={isGenerating}
              />
            </section>

            {/* Events Table */}
            <section className="space-y-4" aria-label="Events table">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Events ({filteredEvents.length.toLocaleString()})
                </h2>
                <span className="text-xs text-muted-foreground">
                  Virtualized for performance
                </span>
              </div>
              <VirtualizedEventTable events={filteredEvents} height={450} />
            </section>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border mt-8 py-4 text-center text-xs text-muted-foreground">
        <p>Telemetry Vault • {stats.totalEvents.toLocaleString()} events • Web Worker powered</p>
      </footer>
    </div>
  );
}
