# Summary

freedom-opfs-syncable-store-backing implements a file/folder storage backend on top of the browser’s OPFS, supporting creation, deletion, lookup, and metadata management for syncable items, and is designed to be used as the backing layer for higher-level syncable stores in the Freedom project.

# Overview

This package provides an implementation of a "SyncableStoreBacking" using the OPFS (Origin Private File System) API, which is a browser-based persistent file storage system.

Its main export is the OpfsSyncableStoreBacking class, which implements the SyncableStoreBacking interface.

The class manages a directory tree rooted at a FileSystemDirectoryHandle and provides methods to:
* Initialize the backing store with metadata.
* Check if an item exists at a given path.
* Retrieve files or folders at a given path.
* Create binary files and folders at specified paths, with conflict detection.
* Delete files or folders.
* Update local metadata for items.

All operations are asynchronous and return results wrapped in a custom async result type, with strong error typing (e.g., 'not-found', 'wrong-type', 'conflict').
