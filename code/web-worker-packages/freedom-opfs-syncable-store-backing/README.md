# freedom-opfs-syncable-store-backing

## Summary

freedom-opfs-syncable-store-backing implements a file/folder storage backend on top of the browser’s OPFS (Origin Private File System), supporting creation, deletion, lookup, and metadata management for syncable items. It is designed to be used as the backing layer for higher-level syncable stores in the Freedom project.

## Overview

This package provides an implementation of a `SyncableStoreBacking` using the OPFS API, which is a browser-based persistent file storage system.

Its main export is the `OpfsSyncableStoreBacking` class, which implements the `SyncableStoreBacking` interface.

The class manages a directory tree rooted at a `FileSystemDirectoryHandle` and provides methods to:

- Initialize the backing store with metadata
- Check if an item exists at a given path
- Retrieve files or folders at a given path
- Create binary files and folders at specified paths, with conflict detection
- Delete files or folders
- Update local metadata for items

All operations are asynchronous and return results wrapped in a custom async result type, with strong error typing (e.g., `'not-found'`, `'wrong-type'`, `'conflict'`).

## Usage

This package is intended to be used as a low-level storage backend for syncable stores in the Freedom project. It abstracts direct interaction with the OPFS API, providing a higher-level interface for file and folder management with metadata and error handling.
