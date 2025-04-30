---
status: incomplete, has TODOs
---
# CRDT

Synchronization requires a conflict-resolution mechanism. This document explains our decisions and implementation.

## CRDT Bundles

TODO: text needs humanization and clarity

Conflict free resolution data types (CRDTs) allow us to merge data from multiple sources without dealing with complex, manual conflict resolution.

We're currently using Yjs to encode our CRDTs and support rich text data and a variety of other complex data types.

For synchronization, we store CRDTs in bundles. CRDT bundles each have at least 2 sub-bundles, representing snapshots and deltas (there's actually a separate deltas sub-bundle per snapshot). Snapshots allow us to flatten and compress data, especially when we know all parties are in-sync. Deltas represent the changes made on top of a given snapshot.

Each saved change is written to a delta file, which can then be synchronized.
