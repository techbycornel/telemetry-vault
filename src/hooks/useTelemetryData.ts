import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { 
  TelemetryEvent, 
  FilterState, 
  AggregatedData, 
  AggregationType,
  TimeRange,
  DataStats,
  EventType,
  ServiceName
} from '../types/telemetry';

const DEFAULT_EVENT_COUNT = 50000;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

interface UseTelemetryDataReturn {
  events: TelemetryEvent[];
  filteredEvents: TelemetryEvent[];
  aggregatedData: AggregatedData[];
  stats: DataStats;
  filters: FilterState;
  aggregationType: AggregationType;
  isLoading: boolean;
  isGenerating: boolean;
  progress: number;
  setFilters: (filters: Partial<FilterState>) => void;
  setAggregationType: (type: AggregationType) => void;
  regenerateData: (count?: number) => void;
}

const getDefaultTimeRange = (): TimeRange => {
  const now = Date.now();
  return {
    start: now - 24 * HOUR, // Last 24 hours
    end: now,
  };
};

const getDefaultFilters = (): FilterState => ({
  timeRange: getDefaultTimeRange(),
  eventTypes: [],
  services: [],
  searchQuery: '',
});

export function useTelemetryData(): UseTelemetryDataReturn {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TelemetryEvent[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);
  const [filters, setFiltersState] = useState<FilterState>(getDefaultFilters);
  const [aggregationType, setAggregationType] = useState<AggregationType>('count');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const workerRef = useRef<Worker | null>(null);
  const filterTimeoutRef = useRef<number | null>(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/telemetryWorker.ts', import.meta.url),
      { type: 'module' }
    );
    
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      
      switch (type) {
        case 'generated':
          setEvents(payload as TelemetryEvent[]);
          setFilteredEvents(payload as TelemetryEvent[]);
          setIsGenerating(false);
          setProgress(100);
          break;
        case 'filtered':
          setFilteredEvents(payload as TelemetryEvent[]);
          setIsLoading(false);
          break;
        case 'aggregated':
          setAggregatedData(payload as AggregatedData[]);
          break;
        case 'progress':
          setProgress(payload as number);
          break;
        case 'error':
          console.error('Worker error:', payload);
          setIsLoading(false);
          setIsGenerating(false);
          break;
      }
    };
    
    // Generate initial data
    const timeRange = getDefaultTimeRange();
    workerRef.current.postMessage({
      type: 'generate',
      payload: { count: DEFAULT_EVENT_COUNT, timeRange },
    });
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Filter events when filters change (debounced)
  useEffect(() => {
    if (!workerRef.current || events.length === 0) return;
    
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    setIsLoading(true);
    
    filterTimeoutRef.current = window.setTimeout(() => {
      workerRef.current?.postMessage({
        type: 'filter',
        payload: { events, filters },
      });
    }, 100); // 100ms debounce
    
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [events, filters]);

  // Aggregate data when filtered events or aggregation type changes
  useEffect(() => {
    if (!workerRef.current || filteredEvents.length === 0) return;
    
    // Calculate bucket size based on time range
    const duration = filters.timeRange.end - filters.timeRange.start;
    let bucketSize: number;
    
    if (duration <= HOUR) {
      bucketSize = MINUTE; // 1-minute buckets for <= 1 hour
    } else if (duration <= 6 * HOUR) {
      bucketSize = 5 * MINUTE; // 5-minute buckets for <= 6 hours
    } else if (duration <= 24 * HOUR) {
      bucketSize = 15 * MINUTE; // 15-minute buckets for <= 24 hours
    } else {
      bucketSize = HOUR; // 1-hour buckets for > 24 hours
    }
    
    workerRef.current.postMessage({
      type: 'aggregate',
      payload: { events: filteredEvents, aggregationType, bucketSize },
    });
  }, [filteredEvents, aggregationType, filters.timeRange]);

  // Calculate stats
  const stats = useMemo<DataStats>(() => {
    const eventTypeCounts = {} as Record<EventType, number>;
    const serviceCounts = {} as Record<ServiceName, number>;
    
    for (const event of filteredEvents) {
      eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
      serviceCounts[event.service] = (serviceCounts[event.service] || 0) + 1;
    }
    
    return {
      totalEvents: events.length,
      filteredEvents: filteredEvents.length,
      timeRange: filters.timeRange,
      eventTypeCounts,
      serviceCounts,
    };
  }, [events.length, filteredEvents, filters.timeRange]);

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const regenerateData = useCallback((count: number = DEFAULT_EVENT_COUNT) => {
    if (!workerRef.current) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    const timeRange = getDefaultTimeRange();
    setFiltersState(prev => ({ ...prev, timeRange }));
    
    workerRef.current.postMessage({
      type: 'generate',
      payload: { count, timeRange },
    });
  }, []);

  return {
    events,
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
  };
}
