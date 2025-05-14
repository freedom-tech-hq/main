# Freedom Local Sync

Implementation of the local side of synchronization that uses freedom-sync-types and integrates with freedom-syncable-store to provide conflict resolution and data persistence.  For example, when a remote pull request happens, the server must pull the data from its local copy of the syncable store before returning it.  Similarly for push requests, the server must push the received content into its local copy of the syncable store.  This package facilitates that type of activity, including supporting globs and complex nested push/pull data.

