// Core telemetry data types

export type EventType = 'log' | 'metric' | 'trace' | 'error' | 'span';
export type ServiceName = 'api-gateway' | 'auth-service' | 'user-service' | 'payment-service' | 'notification-service';
export type AggregationType = 'count' | 'avg' | 'p95' | 'sum' | 'min' | 'max';

export interface TelemetryEvent {
  id: string;
  timestamp: number; // Unix timestamp in ms
  value: number;
  eventType: EventType;
  service: ServiceName;
  level?: 'debug' | 'info' | 'warn' | 'error';
  message?: string;
  tags?: Record<string, string>;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface FilterState {
  timeRange: TimeRange;
  eventTypes: EventType[];
  services: ServiceName[];
  searchQuery: string;
}

export interface AggregatedData {
  timestamp: number;
  count: number;
  avg: number;
  sum: number;
  min: number;
  max: number;
  p95: number;
}

export interface DataStats {
  totalEvents: number;
  filteredEvents: number;
  timeRange: TimeRange;
  eventTypeCounts: Record<EventType, number>;
  serviceCounts: Record<ServiceName, number>;
}

// Worker message types
export interface WorkerRequest {
  type: 'generate' | 'filter' | 'aggregate';
  payload: GeneratePayload | FilterPayload | AggregatePayload;
}

export interface GeneratePayload {
  count: number;
  timeRange: TimeRange;
}

export interface FilterPayload {
  events: TelemetryEvent[];
  filters: FilterState;
}

export interface AggregatePayload {
  events: TelemetryEvent[];
  aggregationType: AggregationType;
  bucketSize: number; // in milliseconds
}

export interface WorkerResponse {
  type: 'generated' | 'filtered' | 'aggregated' | 'error' | 'progress';
  payload: TelemetryEvent[] | TelemetryEvent[] | AggregatedData[] | string | number;
}
