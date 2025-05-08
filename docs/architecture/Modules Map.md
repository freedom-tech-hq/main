# Modules Map

Our packages, grouped by aspect.

## Email App

Includes UI and backends.
Data processing is implemented on top of Syncable Store and should be thoroughly separated.

### Frontend and Backends
- freedom-**email-app** (app) [README.md](../../code/apps/freedom-email-app/README.md)
  Email frontend. The only frontend for now.
- freedom-**mail-host** (backend) [README.md](../../code/backends/freedom-mail-host/README.md)
  Node.js SMTP server for inbound emails.
  Syncable Store subscription for outbound emails.
- Parts of freedom-**store-api-server** (see [REST API](#rest-api) section) are related to the Email App.
- **delivery-host** (backend) [README.md](../../code/backends/delivery-host/README.md)
  Non-TS module. Docker Mailserver configuration as a delivery host.

### Components
- freedom-**email-sync** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-email-sync/README.md)
  Functions defining email-app related structure in Syncable Store, client-and-server part.
- freedom-**email-user** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-email-user/README.md)
  Client-only extension of `freedom-email-sync` (same scope).
- freedom-**email-tasks-web-worker** (web-worker) [README.md](../../code/web-worker-packages/freedom-email-tasks-web-worker/README.md)
  Client-side REST API handlers.
- freedom-**email-server** (server) [README.md](../../code/server-packages/freedom-email-server/README.md)
  Email app backend implementation on top of freedom-syncable-store-server.
  Note: the existence of this package shows a problem in separation of concerns for backends. It is probably temporary.
- freedom-**db** (server) [README.md](../../code/server-packages/freedom-db/README.md)
  User properties to route emails. Plus DB layer.

### Dev Tools
- freedom-**mock-smtp-server** (dev) [README.md](../../code/dev-packages/freedom-mock-smtp-server/README.md)
  Collects incoming SMTP emails. Locally - to debug outbound, in the cloud - to collect content samples.

---

## Syncable Store

### Principal Logic
- freedom-**syncable-store** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-syncable-store/README.md)
  The Cynosure of Everything.
- freedom-**syncable-store-types** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-syncable-store-types/README.md)
  Types for Syncable Store packages.

### Access Control
- freedom-**access-control-types** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-access-control-types/README.md)
  Type definitions for access control, independent of implementation details.
- freedom-**access-control** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-access-control/README.md)
  Access control implementation that enforces permissions using the crypto packages.

### CRDT & Synchronization Protocol
- freedom-**sync-types** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-sync-types/README.md)
  Core types and interfaces for sync operations, defining contracts between components.
- freedom-**sync-service** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-sync-service/README.md)
  Client handler for push/pull REST API.
  Note: does not seem actually belonging to cross-platform.

- freedom-**conflict-free-document-data** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-conflict-free-document-data/README.md)
  Basic data types and schemas for conflict-free documents, separate from implementation details.
- freedom-**conflict-free-document** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-conflict-free-document/README.md)
  Implementation of conflict-free editing built on top of freedom-conflict-free-document-data using Yjs.

- freedom-**sync-service-testing-tools** (dev) [README.md](../../code/dev-packages/freedom-sync-service-testing-tools/README.md)
  Testing utilities for sync operations without requiring full backend implementations.

### REST API
- freedom-**store-api-server** (backend) [README.md](../../code/backends/freedom-store-api-server/README.md)
  Generic Syncable Store endpoints and app-specific ones. Connects `freedom-email-server` to expose Email-specific endpoints.
- freedom-**store-api-server-api** (cross-platform)
  REST API schema.
- freedom-**syncable-store-server** (server) [README.md](../../code/server-packages/freedom-syncable-store-server/README.md)
  Backend implementation of the server. Extracted from the server because also used by `freedom-email-server`.

### Backings
- freedom-**syncable-store-backing-types** (cross-platform)
- freedom-**in-memory-syncable-store-backing** (cross-platform)
- freedom-**file-system-syncable-store-backing** (server)
- freedom-**google-storage-syncable-store-backing** (server)
- freedom-**opfs-syncable-store-backing** (web-worker)

---

### Cryptography
These packages do not implement parts of the store, but may implement atomic transformations demanded by the store implementation.
- freedom-**crypto-data** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-crypto-data/README.md)
  See `freedom-crypto` description below. 
- freedom-**crypto** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-crypto/README.md)
  General-purpose cryptographic operations. Encryption, decryption, signing, and verification functionality.
  Brian: Data should be mostly serializable types. Crypto is mostly utils and non serializable types.
  Pavel: The distinction is not clear. A non-serializable object becomes serializable via yaschema. A serializable object is not always being serialized.  I propose merging them in one package.
- freedom-**crypto-service** (cross-platform) [README.md](../../code/cross-platform-packages/freedom-crypto-service/README.md)
  Defines:
  `UserKeys` interface - user keys enumerator.
  `decryptOneEncryptedValue` function - connects `freedom-crypto.decryptEncryptedValue()` with `UserKeys`.
  TODO: Consider merging into a package that introduces the idea of a user of a store. Also, the need in a enumerator as a service is not obvious, UserKeys might be a record, so the functions that encrypt expect one key, the functions that decrypt expect an array of keys, the functions (or constructors) that assume both operations - expect a record with one+array. Keys do not need lazy-loading, do they?

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

### General Purpose Utils
#### Ubiquitous Utils
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

### API Server
- freedom-**server-auth** (server) [README.md](../../code/server-packages/freedom-server-auth/README.md)
  Types extracted from `freedom-server-api-handling`. Pavel's opinion: merge this and `freedom-server-trace-auth-token` into `freedom-server-api-handling`.  
- freedom-**server-trace-auth-token** (server) [README.md](../../code/server-packages/freedom-server-trace-auth-token/README.md)
  Implementation for `freedom-server-auth` extracted from `freedom-server-api-handling`. See the comment on `freedom-server-auth`.

### Tracing, Logging & Metrics
- freedom-**logging-types** (cross-platform)
- freedom-**metrics-types** (cross-platform)
- freedom-**trace-cache** (cross-platform)
- freedom-**trace-logging-and-metrics** (cross-platform)
- freedom-**trace-service-context** (cross-platform)
- freedom-**dev-logging-support** (cross-platform)
- freedom-**profiler** (dev)

---

## Object Store
Seems not used. It is currently only used in the server part that is being replaced with Postgres.

- freedom-**object-store-types** (cross-platform)
- freedom-**json-file-object-store** (server)
- freedom-**sqlite-object-store** (server)
- freedom-**indexeddb-object-store** (web)
