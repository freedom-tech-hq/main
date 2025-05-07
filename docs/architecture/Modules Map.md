# Modules Map

## Email App

Includes UI and backends.
Data processing is implemented on top of Syncable Store and should be thoroughly separated.

### Frontend and Backends
- freedom-**email-app** (frontend) [README.md](../../code/apps/freedom-email-app/README.md)
- freedom-**mail-host** (backend) [README.md](../../code/backends/freedom-mail-host/README.md)
  Node.js SMTP server for inbound and Syncable Store subscription for outbound emails.
- **delivery-host** (backend) [README.md](../../code/backends/delivery-host/README.md)
  Non-TS module. Docker Mailserver configuration as a delivery host.
- **store-api-server** (see [REST API](#rest-api) section) also contains elements for Email App.

### Components
- freedom-**email-sync** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-email-sync/README.md)
  Cross-platform email synchronization types and utilities.
- freedom-**email-user** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-email-user/README.md)
  Types and utilities for email credentials and mail management.
- freedom-**email-server** (server) [README.md](../../code/server-packages/freedom-email-server/README.md)
  Email app backend implementation on top of freedom-syncable-store-server.
  Note: the existence of this package shows a problem in separation of concerns for backends. It is probably temporary.
- freedom-**email-tasks-web-worker** (web-worker) [README.md](../../code/web-worker-packages/freedom-email-tasks-web-worker/README.md)
  Client-side REST API handlers.
- freedom-**db** (server) [README.md](../../code/server-packages/freedom-db/README.md)
  User properties to route emails. Plus DB layer.

### Dev Tools
- freedom-**mock-smtp-server** (dev) [README.md](../../code/dev-packages/freedom-mock-smtp-server/README.md)
  Collects incoming SMTP emails. Locally - to debug outbound, in the cloud - to collect content samples.

---

## Syncable Store

### Principal Logic
- freedom-**syncable-store** (cross-platform)
- freedom-**syncable-store-types** (cross-platform)

### REST API
- freedom-**store-api-server** (backend)
  Generic Syncable Store endpoints and app-specific ones.
- freedom-**store-api-server-api** (cross-platform)
  REST API schema.
- freedom-**syncable-store-server** (server)
  Backend implementation of the server. Extracted from the server because also used by `freedom-email-server`.

### Backings
- freedom-**syncable-store-backing-types** (cross-platform)
- freedom-**in-memory-syncable-store-backing** (cross-platform)
- freedom-**file-system-syncable-store-backing** (server)
- freedom-**google-storage-syncable-store-backing** (server)
- freedom-**opfs-syncable-store-backing** (web-worker)

### Conflict Resolution & Document Management
- freedom-**conflict-free-document** (cross-platform)
- freedom-**conflict-free-document-data** (cross-platform)
- freedom-**sync-service** (cross-platform)
- freedom-**sync-types** (cross-platform)
- freedom-**sync-service-testing-tools** (dev)

---

### Security & Cryptography
- freedom-**crypto** (cross-platform)
- freedom-**crypto-data** (cross-platform)
- freedom-**crypto-service** (cross-platform)
- freedom-**access-control** (cross-platform)
- freedom-**access-control-types** (cross-platform)
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
- freedom-**localization-tools** (dev)

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
