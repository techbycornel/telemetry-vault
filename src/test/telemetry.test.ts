import { describe, it, expect } from 'vitest';

// Recreate aggregation logic for testing
interface TelemetryEvent {
  id: string;
  timestamp: number;
  value: number;
}

interface AggregatedData {
  timestamp: number;
  count: number;
  avg: number;
  sum: number;
  min: number;
  max: number;
  p95: number;
}

function aggregateEvents(
  events: TelemetryEvent[], 
  bucketSize: number
): AggregatedData[] {
  if (events.length === 0) return [];
  
  const buckets = new Map<number, number[]>();
  
  for (const event of events) {
    const bucketKey = Math.floor(event.timestamp / bucketSize) * bucketSize;
    const bucket = buckets.get(bucketKey);
    if (bucket) {
      bucket.push(event.value);
    } else {
      buckets.set(bucketKey, [event.value]);
    }
  }
  
  const result: AggregatedData[] = [];
  
  for (const [timestamp, values] of buckets) {
    values.sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const count = values.length;
    const p95Index = Math.floor(values.length * 0.95);
    
    result.push({
      timestamp,
      count,
      sum,
      avg: sum / count,
      min: values[0],
      max: values[values.length - 1],
      p95: values[Math.min(p95Index, values.length - 1)],
    });
  }
  
  result.sort((a, b) => a.timestamp - b.timestamp);
  
  return result;
}

describe('Telemetry Aggregation', () => {
  const MINUTE = 60 * 1000;

  it('should aggregate empty array to empty result', () => {
    expect(aggregateEvents([], MINUTE)).toEqual([]);
  });

  it('should correctly calculate count', () => {
    const events = [
      { id: '1', timestamp: 1000, value: 10 },
      { id: '2', timestamp: 1500, value: 20 },
      { id: '3', timestamp: 2000, value: 30 },
    ];
    
    const result = aggregateEvents(events, 10000);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
  });

  it('should correctly calculate sum and average', () => {
    const events = [
      { id: '1', timestamp: 0, value: 10 },
      { id: '2', timestamp: 100, value: 20 },
      { id: '3', timestamp: 200, value: 30 },
    ];
    
    const result = aggregateEvents(events, 1000);
    expect(result[0].sum).toBe(60);
    expect(result[0].avg).toBe(20);
  });

  it('should correctly calculate min and max', () => {
    const events = [
      { id: '1', timestamp: 0, value: 5 },
      { id: '2', timestamp: 100, value: 100 },
      { id: '3', timestamp: 200, value: 50 },
    ];
    
    const result = aggregateEvents(events, 1000);
    expect(result[0].min).toBe(5);
    expect(result[0].max).toBe(100);
  });

  it('should correctly calculate P95', () => {
    // Create 100 events with values 1-100
    const events = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      timestamp: i,
      value: i + 1,
    }));
    
    const result = aggregateEvents(events, 1000);
    // P95 of 1-100 should be 95 or 96 depending on rounding
    expect(result[0].p95).toBeGreaterThanOrEqual(95);
    expect(result[0].p95).toBeLessThanOrEqual(96);
  });

  it('should separate events into correct time buckets', () => {
    const events = [
      { id: '1', timestamp: 0, value: 10 },
      { id: '2', timestamp: 500, value: 20 },
      { id: '3', timestamp: 1000, value: 30 },
      { id: '4', timestamp: 1500, value: 40 },
    ];
    
    const result = aggregateEvents(events, 1000);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(0);
    expect(result[0].count).toBe(2);
    expect(result[1].timestamp).toBe(1000);
    expect(result[1].count).toBe(2);
  });

  it('should handle single event', () => {
    const events = [{ id: '1', timestamp: 0, value: 42 }];
    
    const result = aggregateEvents(events, 1000);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(1);
    expect(result[0].sum).toBe(42);
    expect(result[0].avg).toBe(42);
    expect(result[0].min).toBe(42);
    expect(result[0].max).toBe(42);
    expect(result[0].p95).toBe(42);
  });

  it('should return sorted results by timestamp', () => {
    const events = [
      { id: '1', timestamp: 3000, value: 10 },
      { id: '2', timestamp: 1000, value: 20 },
      { id: '3', timestamp: 5000, value: 30 },
    ];
    
    const result = aggregateEvents(events, 1000);
    expect(result.map(r => r.timestamp)).toEqual([1000, 3000, 5000]);
  });
});

describe('Telemetry Filter Logic', () => {
  interface FilteredEvent {
    timestamp: number;
    eventType: string;
    service: string;
    message?: string;
  }

  interface Filters {
    timeRange: { start: number; end: number };
    eventTypes: string[];
    services: string[];
    searchQuery: string;
  }

  function filterEvents(events: FilteredEvent[], filters: Filters): FilteredEvent[] {
    const { timeRange, eventTypes, services, searchQuery } = filters;
    const searchLower = searchQuery.toLowerCase();
    
    return events.filter(event => {
      if (event.timestamp < timeRange.start || event.timestamp > timeRange.end) {
        return false;
      }
      if (eventTypes.length > 0 && !eventTypes.includes(event.eventType)) {
        return false;
      }
      if (services.length > 0 && !services.includes(event.service)) {
        return false;
      }
      if (searchQuery && event.message && !event.message.toLowerCase().includes(searchLower)) {
        return false;
      }
      return true;
    });
  }

  const sampleEvents: FilteredEvent[] = [
    { timestamp: 1000, eventType: 'log', service: 'api-gateway', message: 'Request received' },
    { timestamp: 2000, eventType: 'error', service: 'auth-service', message: 'Auth failed' },
    { timestamp: 3000, eventType: 'metric', service: 'api-gateway', message: 'Latency check' },
    { timestamp: 4000, eventType: 'trace', service: 'user-service', message: 'User lookup' },
  ];

  it('should filter by time range', () => {
    const result = filterEvents(sampleEvents, {
      timeRange: { start: 1500, end: 3500 },
      eventTypes: [],
      services: [],
      searchQuery: '',
    });
    
    expect(result).toHaveLength(2);
    expect(result.map(e => e.timestamp)).toEqual([2000, 3000]);
  });

  it('should filter by event type', () => {
    const result = filterEvents(sampleEvents, {
      timeRange: { start: 0, end: 10000 },
      eventTypes: ['log', 'error'],
      services: [],
      searchQuery: '',
    });
    
    expect(result).toHaveLength(2);
    expect(result.map(e => e.eventType)).toEqual(['log', 'error']);
  });

  it('should filter by service', () => {
    const result = filterEvents(sampleEvents, {
      timeRange: { start: 0, end: 10000 },
      eventTypes: [],
      services: ['api-gateway'],
      searchQuery: '',
    });
    
    expect(result).toHaveLength(2);
    expect(result.every(e => e.service === 'api-gateway')).toBe(true);
  });

  it('should filter by search query (case-insensitive)', () => {
    const result = filterEvents(sampleEvents, {
      timeRange: { start: 0, end: 10000 },
      eventTypes: [],
      services: [],
      searchQuery: 'FAILED',
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('Auth failed');
  });

  it('should combine multiple filters', () => {
    const result = filterEvents(sampleEvents, {
      timeRange: { start: 0, end: 10000 },
      eventTypes: ['log', 'metric'],
      services: ['api-gateway'],
      searchQuery: '',
    });
    
    expect(result).toHaveLength(2);
  });

  it('should return all events with empty filters', () => {
    const result = filterEvents(sampleEvents, {
      timeRange: { start: 0, end: 10000 },
      eventTypes: [],
      services: [],
      searchQuery: '',
    });
    
    expect(result).toHaveLength(4);
  });
});
