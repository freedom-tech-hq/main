---
status: AI-version, revise it
---
# Synchronization

## Remotes

Synchronization happens between your devices and "remotes" - systems that store and transfer your data:

- **Freedom Cloud** - Optional central storage service
- **Freedom Nodes** - Personal servers that can sync with your devices and the Cloud
- **Other User Devices** - Direct device-to-device synchronization

Each folder can be configured to sync with multiple remotes in priority order.

## Push/Pull Process

Freedom uses a push/pull mechanism with a hash-based approach:

1. **Push** - Your device sends new data to remotes when you make changes
2. **Pull** - Your device checks for and retrieves new data from remotes
3. **Comparison** - Systems compare folder/file hashes to identify what needs syncing
   - Folder hash = Hash of ID-to-hash map of contained items
   - File hash = SHA256 hash of binary content

## Sync Order

Data synchronizes in a specific order to ensure consistency:

1. `.access-control` bundle first
2. `.changes` bundle second
3. All other content last

This order ensures permissions are properly established before content syncs.

## End-User Device Sync Behavior

For most changes, your devices stop syncing after the first successful remote sync. Exceptions:

- **User profile allocation** - Profile is pushed to all configured remotes
- **Root allocation** - Initial push to a Node is required to start syncing

## Validation During Sync

When data is received during sync:

1. Signatures are verified
2. Permissions are checked
3. Content-specific validations are performed

The Cloud performs basic access checks but can't decrypt content. Your devices and Nodes (if they have decryption access) perform full validation.

## Conflict Resolution

Since all files are immutable, traditional conflicts don't occur. Instead:

- New versions of files are created rather than modifying existing ones
- CRDTs (Conflict-free Resolution Data Types) are used where "mutability" is needed
- CRDT bundles store data in snapshots and deltas for efficient merging

## Sync Configuration

The Freedom Management app helps configure which remotes to sync with. The configuration includes:

- Which devices/remotes to sync with
- Priority order for synchronization
- Per-application and/or root folder settings

Most users simply select Freedom Cloud and/or Freedom Nodes for syncing.
