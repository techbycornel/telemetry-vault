# ARCHITECTURE.md

## Telemetry Vault - Architecture Documentation

### Overview

Telemetry Vault is a high-performance telemetry data exploration interface designed to handle 50,000+ events while maintaining UI responsiveness. This document outlines the key architectural decisions and their rationales.

---

## State Management Strategy

### Approach: Hook-based with Web Workers

The application uses a **centralized custom hook (`useTelemetryData`)** that encapsulates:
- Raw event storage
- Filtered event state
- Aggregated data state
- Filter state
- Loading states

**Why this approach:**
1. **Colocation**: All telemetry-related state lives together, making it easy to reason about
2. **Encapsulation**: Components don't need to know about Web Workers or data processing internals
3. **Memoization**: The hook returns memoized values and stable callbacks
4. **No external state library**: React's built-in `useState` and `useRef` are sufficient for this use case

**Trade-off**: For a larger app with multiple data domains, consider Zustand or Redux for cross-cutting state.

---

## Data Generation & Storage

### Generation Strategy

Events are generated in a **Web Worker** using:
- A fast pseudo-random number generator (Mulberry32) for deterministic, performant randomness
- Temporal clustering to simulate realistic traffic patterns
- Chunked processing with progress callbacks

```
Main Thread                     Worker Thread
    |                                |
    | postMessage({type:'generate'}) |
    |------------------------------->|
    |                                | Generate 50k events
    |                                | (chunked with progress)
    |     {type:'progress', 50%}     |
    |<-------------------------------|
    |     {type:'generated', data}   |
    |<-------------------------------|
```

### Storage Decision

Events are stored in a **single typed array** in memory:
- **Pros**: Fast iteration, simple mental model, works well with TypeScript
- **Cons**: Memory usage scales linearly; no persistence across sessions

**Alternative considered**: IndexedDB for persistence. Rejected for prototype scope but recommended for production.

---

## Performance Bottlenecks & Mitigations

### 1. Main Thread Blocking

**Problem**: Generating and processing 50k+ events would freeze the UI.

**Solution**: **Web Workers** for all heavy operations:
- Data generation
- Filtering
- Aggregation (count, avg, p95, etc.)

### 2. Rendering Large Lists

**Problem**: Rendering 50k DOM nodes would crash the browser.

**Solution**: **Virtualization with react-window**
- Only renders visible rows (~15-20 at a time)
- Maintains smooth scrolling with overscan
- Memory footprint stays constant regardless of dataset size

### 3. Excessive Re-renders

**Problem**: Filter changes could trigger cascading re-renders.

**Solutions**:
- `React.memo()` on all presentational components
- `useCallback()` for event handlers passed as props
- `useMemo()` for derived calculations (stats, chart data)
- Debounced filter updates (100ms delay)

### 4. Chart Performance

**Problem**: Recharts with thousands of points is slow.

**Solution**: Time-bucketed aggregation
- Raw events → aggregated buckets (e.g., 15-minute intervals)
- Chart renders ~100 points instead of 50,000
- Bucket size adapts to time range

---

## Trade-offs Made

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| In-memory storage | No persistence | Prototype scope; simpler architecture |
| Single worker | No parallel processing | Sufficient for 50k events; simpler coordination |
| Fixed row height | No dynamic heights | 10x performance gain; acceptable for structured data |
| Client-side aggregation | CPU on user device | No backend requirement; acceptable with Web Workers |
| Debounced filters | 100ms delay | Prevents filter spam; imperceptible to users |

---

## What Breaks First at 10× Scale (500k events)

### 1. Memory Pressure
- **Issue**: 500k events ≈ 100-150MB in memory
- **Symptom**: Page slowdown on low-memory devices
- **Mitigation**: Implement pagination, discard old events, or use IndexedDB with lazy loading

### 2. Worker Message Overhead
- **Issue**: `postMessage` serializes entire dataset
- **Symptom**: Noticeable lag when sending filtered events back
- **Mitigation**: Use `SharedArrayBuffer` or keep data in worker, only send aggregations

### 3. Filter Processing Time
- **Issue**: Linear scan of 500k events
- **Symptom**: 200-500ms filter latency
- **Mitigation**: Pre-index by event type and service; binary search for time ranges

### 4. Initial Load Time
- **Issue**: Generating 500k events takes 2-3 seconds
- **Symptom**: Long loading screen
- **Mitigation**: Stream data generation, show partial results early

---

## Backend Integration Changes

With a real backend, the architecture would shift:

### Current (Client-side)
```
[Browser] → Generate → Filter → Aggregate → Render
```

### With Backend
```
[Backend API] → Streaming/Pagination → [Browser] → Render
           ↑
    Query: time range, filters, aggregation
           ↓
    Response: Aggregated data + paginated events
```

### Specific Changes

1. **Replace Web Worker data generation** with API calls
2. **Push aggregation to backend** (much faster with database indexes)
3. **Implement cursor-based pagination** for event table
4. **Add WebSocket** for real-time streaming updates
5. **Cache API responses** with React Query (already installed)
6. **Add loading/error states** for network failures

### Query Design

```typescript
// Example API contract
GET /api/v1/telemetry/events
  ?start=1642000000000
  &end=1642100000000
  &eventTypes[]=log&eventTypes[]=error
  &services[]=api-gateway
  &cursor=evt_abc123
  &limit=100

GET /api/v1/telemetry/aggregate
  ?start=1642000000000
  &end=1642100000000
  &aggregation=p95
  &bucketSize=900000  // 15 minutes
```

---

## Testing Strategy

Logic-focused tests cover:
- Time bucketing edge cases
- Aggregation calculations (especially P95)
- Filter combinations
- Empty state handling

UI tests would use React Testing Library for:
- Filter interactions
- Keyboard accessibility
- Loading states

---

## Accessibility Considerations

1. **Semantic HTML**: `<main>`, `<header>`, `<section>`, `<table>`
2. **ARIA labels**: All interactive regions labeled
3. **Focus management**: Visible focus rings, keyboard navigation
4. **Screen reader support**: Filter state announced, table headers associated
5. **Color contrast**: Checked against WCAG AA

---

## Conclusion

This architecture prioritizes **perceived performance** and **developer experience** for a prototype scope. The Web Worker pattern establishes a clean boundary for future backend integration, while virtualization and memoization ensure the UI remains responsive at scale.
