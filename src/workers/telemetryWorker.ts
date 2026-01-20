// Web Worker for heavy telemetry data operations
// This keeps the main thread responsive during data generation and aggregation

import type { 
  TelemetryEvent, 
  EventType, 
  ServiceName, 
  AggregatedData,
  FilterState,
  WorkerRequest,
  GeneratePayload,
  FilterPayload,
  AggregatePayload
} from '../types/telemetry';

const EVENT_TYPES: EventType[] = ['log', 'metric', 'trace', 'error', 'span'];
const SERVICES: ServiceName[] = ['api-gateway', 'auth-service', 'user-service', 'payment-service', 'notification-service'];
const LEVELS = ['debug', 'info', 'warn', 'error'] as const;

const SAMPLE_MESSAGES = [
  'Request processed successfully',
  'Database query completed',
  'Cache hit',
  'Cache miss - fetching from origin',
  'Authentication validated',
  'Rate limit check passed',
  'Connection established',
  'Timeout waiting for response',
  'Retrying failed request',
  'Batch job started',
  'Webhook delivered',
  'Message queued for processing',
];

// Fast pseudo-random number generator (Mulberry32)
function createRng(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateEvents(count: number, startTime: number, endTime: number): TelemetryEvent[] {
  const events: TelemetryEvent[] = new Array(count);
  const timeSpan = endTime - startTime;
  const rng = createRng(Date.now());
  
  // Generate in chunks for progress reporting
  const chunkSize = 5000;
  
  for (let i = 0; i < count; i++) {
    const eventType = EVENT_TYPES[Math.floor(rng() * EVENT_TYPES.length)];
    const service = SERVICES[Math.floor(rng() * SERVICES.length)];
    
    // Create temporal clusters for realistic data
    const clusterCenter = rng();
    const clusterSpread = rng() * 0.1;
    const normalizedTime = Math.max(0, Math.min(1, clusterCenter + (rng() - 0.5) * clusterSpread));
    
    events[i] = {
      id: `evt_${i.toString(36)}_${Date.now().toString(36)}`,
      timestamp: startTime + Math.floor(normalizedTime * timeSpan),
      value: generateValue(eventType, rng),
      eventType,
      service,
      level: LEVELS[Math.floor(rng() * LEVELS.length)],
      message: SAMPLE_MESSAGES[Math.floor(rng() * SAMPLE_MESSAGES.length)],
    };
    
    // Report progress every chunk
    if (i % chunkSize === 0 && i > 0) {
      self.postMessage({ type: 'progress', payload: (i / count) * 100 });
    }
  }
  
  // Sort by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp);
  
  return events;
}

function generateValue(eventType: EventType, rng: () => number): number {
  switch (eventType) {
    case 'metric':
      return Math.floor(rng() * 1000) / 10; // 0-100 with decimal
    case 'trace':
    case 'span':
      return Math.floor(rng() * 500) + 1; // 1-500ms latency
    case 'error':
      return Math.floor(rng() * 500) + 400; // 400-900 status codes
    default:
      return Math.floor(rng() * 100);
  }
}

function filterEvents(events: TelemetryEvent[], filters: FilterState): TelemetryEvent[] {
  const { timeRange, eventTypes, services, searchQuery } = filters;
  const searchLower = searchQuery.toLowerCase();
  
  return events.filter(event => {
    // Time range filter
    if (event.timestamp < timeRange.start || event.timestamp > timeRange.end) {
      return false;
    }
    
    // Event type filter
    if (eventTypes.length > 0 && !eventTypes.includes(event.eventType)) {
      return false;
    }
    
    // Service filter
    if (services.length > 0 && !services.includes(event.service)) {
      return false;
    }
    
    // Search query filter
    if (searchQuery && event.message && !event.message.toLowerCase().includes(searchLower)) {
      return false;
    }
    
    return true;
  });
}

function aggregateEvents(
  events: TelemetryEvent[], 
  bucketSize: number
): AggregatedData[] {
  if (events.length === 0) return [];
  
  const buckets = new Map<number, number[]>();
  
  // Group values into time buckets
  for (const event of events) {
    const bucketKey = Math.floor(event.timestamp / bucketSize) * bucketSize;
    const bucket = buckets.get(bucketKey);
    if (bucket) {
      bucket.push(event.value);
    } else {
      buckets.set(bucketKey, [event.value]);
    }
  }
  
  // Calculate aggregations for each bucket
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
  
  // Sort by timestamp
  result.sort((a, b) => a.timestamp - b.timestamp);
  
  return result;
}

// Worker message handler
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { type, payload } = e.data;
  
  try {
    switch (type) {
      case 'generate': {
        const { count, timeRange } = payload as GeneratePayload;
        const events = generateEvents(count, timeRange.start, timeRange.end);
        self.postMessage({ type: 'generated', payload: events });
        break;
      }
      
      case 'filter': {
        const { events, filters } = payload as FilterPayload;
        const filtered = filterEvents(events, filters);
        self.postMessage({ type: 'filtered', payload: filtered });
        break;
      }
      
      case 'aggregate': {
        const { events, bucketSize } = payload as AggregatePayload;
        const aggregated = aggregateEvents(events, bucketSize);
        self.postMessage({ type: 'aggregated', payload: aggregated });
        break;
      }
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      payload: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export {};
