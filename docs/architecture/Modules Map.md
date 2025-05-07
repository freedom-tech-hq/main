# Modules Map

## Email App

Includes UI and backends.
Data processing is implemented on top of Syncable Store and should be thoroughly separated.

### Frontend and Backends
- freedom-**email-app** (app)
- freedom-**mail-host** (backend)
- **delivery-host** (backend)

### Components
- freedom-**email-sync** (cross-platform)
- freedom-**email-user** (cross-platform)
- freedom-**email-server** (server)
- freedom-**email-tasks-web-worker** (web-worker)
- freedom-**db** (server)
  User properties to route emails. Plus DB layer.

### Dev Tools
- freedom-**mock-smtp-server** (dev)

---

## Syncable Store

### Principal Logic
- freedom-**syncable-store** (cross-platform)
- freedom-**syncable-store**-types (cross-platform)

### REST API
- freedom-**store-api-server** (backend)
- freedom-**store-api-server**-api (cross-platform)
- freedom-**syncable-store**-server (server)

### Backings
- freedom-**syncable-store**-backing-types (cross-platform)
- freedom-**in-memory-syncable-store-backing** (cross-platform)
- freedom-**file-system-syncable-store-backing** (server)
- freedom-**google-storage-syncable-store-backing** (server)
- freedom-**opfs-syncable-store-backing** (web-worker)

### Conflict Resolution & Document Management
- freedom-**conflict-free-document** (cross-platform)
- freedom-**conflict-free-document**-data (cross-platform)
- freedom-**sync-service** (cross-platform)
- freedom-**sync-types** (cross-platform)
- freedom-**sync-service**-testing-tools (dev)

---

### Security & Cryptography
- freedom-**crypto** (cross-platform)
- freedom-**crypto**-data (cross-platform)
- freedom-**crypto**-service (cross-platform)
- freedom-**access-control** (cross-platform)
- freedom-**access-control**-types (cross-platform)
- freedom-**server-auth** (server)
- freedom-**server-trace-auth-token** (server)

---

## Object Store
Seems not used. It is currently only used in the server part that is being replaced with Postgres.

- freedom-**object-store-types** (cross-platform)
- freedom-**json-file-object-store** (server)
- freedom-**sqlite-object-store** (server)
- freedom-**indexeddb-object-store** (web)

---

## UI & Web Related
- freedom-**logical-web-components** (web)
- freedom-**react-binding-persistence** (web)
- freedom-**web-navigation** (web)

---

## Localization
- freedom-**localization** (cross-platform)
- freedom-**server-localization** (server)
- freedom-**react-localization** (web)
- freedom-**localization**-tools (dev)

---

## Infrastructure & Development Tools
- freedom-**build-tools** (dev)
- freedom-**dev-scripts** (dev)
- freedom-**testing-tools** (dev)
- **reference** (dev)

---

## Pure Development Needs

### Type Definitions
- freedom-**data-source-types** (cross-platform)
- freedom-**device-notification-types** (cross-platform)
- freedom-**indexing-types** (cross-platform)
- freedom-**locking-types** (cross-platform)
- freedom-**notification-types** (cross-platform)

### Data Structures & Utilities
#### Common Use Utils
- freedom-**async** (cross-platform)
- freedom-**basic-data** (cross-platform)
- freedom-**cast** (cross-platform)
- freedom-**common-errors** (cross-platform)
- freedom-**contexts** (cross-platform)
- freedom-**do-soon** (cross-platform)
- freedom-**fetching** (cross-platform)
- freedom-**get-or-create** (cross-platform)
- freedom-**paginated-data** (cross-platform)
- freedom-**periodic** (cross-platform)
- freedom-**serialization** (cross-platform)
- freedom-**task-queue** (cross-platform)
- freedom-**trusted-time-source** (cross-platform)
- freedom-**config** (server)
  Unified framework for server configuration.

#### Narrow Niche Utils
- freedom-**nest** (cross-platform)
  A single-function package. Extensive documentation in function's tsdoc.

### Caching
- freedom-**in-memory-cache** (cross-platform)

### Tracing, Logging & Metrics
- freedom-**logging-types** (cross-platform)
- freedom-**metrics-types** (cross-platform)
- freedom-**trace-cache** (cross-platform)
- freedom-**trace-logging-and-metrics** (cross-platform)
- freedom-**trace-service-context** (cross-platform)
- freedom-**dev-logging-support** (cross-platform)
- freedom-**profiler** (dev)
