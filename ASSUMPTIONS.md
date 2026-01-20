# ASSUMPTIONS.md

## Telemetry Vault - Assumptions & Validation Needs

This document lists assumptions made during development due to the absence of a real backend API.

---

## Data Model Assumptions

### 1. Event Structure

**Assumed:**
```typescript
interface TelemetryEvent {
  id: string;
  timestamp: number;
  value: number;
  eventType: 'log' | 'metric' | 'trace' | 'error' | 'span';
  service: 'api-gateway' | 'auth-service' | 'user-service' | 'payment-service' | 'notification-service';
  level?: 'debug' | 'info' | 'warn' | 'error';
  message?: string;
}
```

**Needs validation:**
- Are there additional required fields (e.g., `traceId`, `spanId`, `correlationId`)?
- Is `value` always numeric or can it be structured data?
- What's the actual list of services? Is it dynamic per tenant?
- Are there event-type-specific fields (e.g., `stackTrace` for errors)?

### 2. Event Type Distribution

**Assumed:** Uniform random distribution across event types.

**Might be wrong:**
- Real systems typically have 90%+ logs, 5% metrics, <1% errors
- Distribution affects UI design (error-centric vs. log-centric views)

### 3. Time Distribution

**Assumed:** Events clustered around random centers to simulate traffic patterns.

**Needs validation:**
- What are typical traffic patterns? (business hours? batch jobs? 24/7?)
- Are there expected gaps or spikes to model?

---

## API Behavior Assumptions

### 4. Query Capabilities

**Assumed:** Backend would support:
- Time range filtering
- Multi-select filtering on eventType and service
- Text search on message content
- Pre-computed aggregations (count, avg, p95, sum, max)

**Might be wrong:**
- P95 calculation might be expensive without pre-aggregation
- Full-text search might require separate infrastructure (Elasticsearch)
- Aggregation granularity might be fixed, not dynamic

### 5. Pagination Strategy

**Assumed:** Cursor-based pagination with ~100 events per page.

**Needs validation:**
- What's the expected latency budget?
- Is offset-based pagination acceptable for jumping to specific pages?
- Maximum time range for a single query?

### 6. Real-time Updates

**Assumed:** Not required for prototype; would use WebSocket polling.

**Needs validation:**
- Is real-time essential? What latency is acceptable (1s? 30s? 5min)?
- Push (WebSocket) vs. pull (polling) preference?

---

## UI/UX Assumptions

### 7. Time Range Selection

**Assumed:** Fixed quick-select options (1h, 6h, 12h, 24h).

**Might be wrong:**
- Users might need custom date ranges
- Relative time might be needed (e.g., "last 7 days")
- Timezone handling not addressed

### 8. Aggregation Modes

**Assumed:** count, avg, p95, sum, max are the key metrics.

**Needs validation:**
- Is P99 needed?
- Are percentiles calculated correctly for the use case?
- Should aggregation be by event type or service, not just time?

### 9. Filter Behavior

**Assumed:** Multi-select filters with AND logic within groups, OR across groups.

**Example:** `eventType=log OR error` AND `service=api-gateway OR auth-service`

**Needs validation:**
- Is this the expected filter logic?
- Are there "advanced" filter needs (e.g., value > 100)?

### 10. Table Columns

**Assumed:** Fixed columns: Time, Type, Service, Level, Value, Message.

**Might be wrong:**
- Users might want customizable columns
- Different event types might need different column layouts
- Column sorting requirements unclear

---

## Performance Assumptions

### 11. Dataset Size

**Assumed:** 50,000 events is a reasonable demo size.

**Needs validation:**
- What's the typical query result size in production?
- Is there a "maximum events" limit the API would return?

### 12. Client Device Capabilities

**Assumed:** Modern browser with Web Worker support, 4GB+ RAM.

**Might be wrong:**
- Mobile users might have less capable devices
- Should there be a "lite" mode for low-power devices?

### 13. Network Latency

**Assumed:** (For future backend) <100ms API response time.

**Needs validation:**
- What's the SLA for API responses?
- Are there geographic distribution concerns?

---

## Business Logic Assumptions

### 14. Multi-tenancy

**Assumed:** Single tenant view for prototype.

**Needs validation:**
- How is tenant isolation enforced?
- Can users switch between tenants?
- Are there tenant-specific customizations?

### 15. Access Control

**Assumed:** All data visible to authenticated user.

**Needs validation:**
- Are there service-level access restrictions?
- Can some users only see specific event types?

### 16. Data Retention

**Assumed:** All data within time range is available.

**Needs validation:**
- What's the retention policy?
- Is there cold storage for older data?
- Different retention for different event types?

---

## What Product/Backend Should Clarify

| Priority | Question | Impact |
|----------|----------|--------|
| **High** | What's the exact event schema with all required fields? | Data model design |
| **High** | What aggregations does the backend support natively? | Performance strategy |
| **High** | What's the maximum result set size? | Pagination design |
| **Medium** | Is real-time streaming required? | Architecture complexity |
| **Medium** | What's the typical event type distribution? | UI focus areas |
| **Medium** | Are there user-level access restrictions? | Security model |
| **Low** | What custom time ranges are needed? | Feature scope |
| **Low** | Is mobile support required? | Performance budgets |

---

## Validation Plan

Once backend is available:

1. **Schema validation**: Compare generated schema with actual API response
2. **Load testing**: Verify assumptions about result set sizes
3. **User testing**: Validate filter UX matches mental model
4. **Performance testing**: Measure actual API latencies vs. assumptions
5. **Accessibility audit**: Verify screen reader compatibility with real data

---

## Risks of Wrong Assumptions

| Assumption | Risk if Wrong | Mitigation |
|------------|---------------|------------|
| Event schema | Major refactor of types and UI | Early API integration |
| P95 calculation | Performance issues or incorrect values | Backend-side aggregation |
| Time distribution | Misleading demo data | Real data sampling |
| Filter logic | Confused users, wrong results | User research |
| Result set size | Memory issues or missing data | Pagination first |
