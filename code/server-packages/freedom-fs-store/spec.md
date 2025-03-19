# Freedom File System Store Specification

## Overview

The Freedom File System Store (`freedom-fs-store`) is a server-side implementation of the `MutableSyncableStore` interface that persists data to the file system. It provides a robust, scalable storage solution for the Freedom platform that maintains the same cryptographic security guarantees as the in-memory implementation while offering persistence across server restarts.

## Implementation Plan

- [x] Set up module structure and dependencies
- [ ] Implement core components listed below
- [ ] Add export files
- [ ] Add README.md
- [ ] Implement tests, similar to the in-memory implementation
- [ ] Debug

## Architecture

### Core Components

1. **FSSyncableStore**: The main class implementing the `MutableSyncableStore` interface
2. **FSAccessControlledFolderBase**: Base implementation for file system folder operations
3. **FSEncryptedBundle**: File system implementation of encrypted bundles
4. **FSPlainBundle**: File system implementation of plain bundles
5. **FSFolder**: File system implementation of folders
6. **FSTrustMarkStore**: File system implementation of trust mark storage

### Directory Structure

```
<storage_root>/
├── metadata/
│   ├── provenance.json       # Store provenance information
│   ├── creator_key_set.json  # Creator crypto key set ID
│   └── hash_cache.json       # Cache of computed hashes
├── bundles/
│   ├── <bundle_id>/
│   │   ├── metadata.json     # Bundle metadata
│   │   └── files/
│   │       ├── <file_id>.bin # Binary file data
│   │       └── ...
│   └── ...
├── folders/
│   ├── <folder_id>/
│   │   ├── metadata.json     # Folder metadata
│   │   └── items/            # Subdirectories for nested items
│   │       └── ...
│   └── ...
└── trust_marks/
    └── <trust_mark_id>.json  # Trust mark data
```

## Implementation Details

### FSSyncableStore

The `FSSyncableStore` class is the main entry point for the file system store implementation. It extends `FSAccessControlledFolderBase` and implements the `MutableSyncableStore` interface.

```typescript
export class FSSyncableStore extends FSAccessControlledFolderBase implements MutableSyncableStore {
  public readonly creatorCryptoKeySetId: CryptoKeySetId;
  public readonly cryptoService: CryptoService;
  public readonly localTrustMarks: FSTrustMarkStore;
  
  constructor({
    storageRootId,
    cryptoService,
    provenance,
    baseDirectory
  }: {
    storageRootId: StorageRootId;
    cryptoService: CryptoService;
    provenance: SyncableProvenance;
    baseDirectory: string;
  }) {
    // Implementation
  }
  
  // MutableSyncableStore interface methods
  public readonly initialize: PRFunc<undefined, 'conflict'>;
}
```

### FSAccessControlledFolderBase

The base class for file system folder operations, implementing common functionality for managing access control.

```typescript
export abstract class FSAccessControlledFolderBase implements MutableAccessControlledFolder {
  public readonly type = 'folder';
  public readonly path: StaticSyncablePath;
  public readonly provenance: SyncableProvenance;
  protected readonly baseDirectory: string;
  
  // Methods for access control management
  public readonly updateAccess: PRFunc<undefined, 'conflict'>;
  public readonly canPushToRemotes: PRFunc<boolean>;
  public readonly didCryptoKeyHaveRoleAtTimeMSec: PRFunc<boolean, never>;
  public readonly getRolesByCryptoKeySetId: PRFunc<Partial<Record<CryptoKeySetId, SyncableStoreRole>>, never>;
  public readonly getTrustedTimeSources: PRFunc<TrustedTimeSource[], 'not-found'>;
  
  // File system specific methods
  protected readonly ensureDirectoryExists: (dirPath: string) => Promise<void>;
  protected readonly getMetadataPath: (id: string) => string;
  protected readonly readMetadataFile: <T>(path: string) => Promise<T | null>;
  protected readonly writeMetadataFile: <T>(path: string, data: T) => Promise<void>;
}
```

### FSEncryptedBundle

Implementation of encrypted bundles stored on the file system.

```typescript
export class FSEncryptedBundle extends FSBundleBase {
  constructor({
    store,
    syncTracker,
    folderOperationsHandler,
    path,
    provenance,
    baseDirectory
  }: FSEncryptedBundleConstructorArgs) {
    super({
      store,
      syncTracker,
      folderOperationsHandler,
      path,
      provenance,
      supportsDeletion: true,
      baseDirectory
    });
  }
  
  // Encryption/decryption methods
  protected override computeHash_(trace: Trace, encodedData: Uint8Array): PR<Sha256Hash>;
  protected override decodeData_(trace: Trace, encodedData: Uint8Array): PR<Uint8Array>;
  protected override encodeData_(trace: Trace, rawData: Uint8Array): PR<Uint8Array>;
}
```

### FSBundleBase

Base class for file system bundle implementations.

```typescript
export abstract class FSBundleBase implements MutableFileStore, BundleManagement {
  public readonly path: StaticSyncablePath;
  public readonly supportsDeletion: boolean;
  protected readonly baseDirectory: string;
  
  // File operations
  public readonly createBinaryFile: MutableFileStore['createBinaryFile'];
  public readonly createBundleFile: MutableFileStore['createBundleFile'];
  public readonly delete: PRFunc<undefined, 'not-found'>;
  public readonly dynamicToStaticId: PRFunc<SyncableId, 'not-found'>;
  public readonly exists: PRFunc<boolean>;
  public readonly generateNewSyncableItemId: GenerateNewSyncableItemIdFunc;
  public readonly get: PRFunc<SyncableItemAccessor>;
  public readonly getHash: PRFunc<Sha256Hash>;
  public readonly getHashesById: PRFunc<Partial<Record<SyncableId, Sha256Hash>>>;
  public readonly getIds: PRFunc<SyncableId[]>;
  public readonly getProvenance: PRFunc<SyncableProvenance>;
  public readonly ls: PRFunc<string[]>;
  public readonly markNeedsRecomputeHash: PRFunc<undefined>;
  public readonly staticToDynamicId: PRFunc<DynamicSyncableId>;
  
  // File system specific methods
  protected readonly getFilePath: (id: string) => string;
  protected readonly readFile: (id: string) => Promise<Uint8Array | null>;
  protected readonly writeFile: (id: string, data: Uint8Array) => Promise<void>;
  protected readonly deleteFile: (id: string) => Promise<boolean>;
}
```

### FSTrustMarkStore

Implementation of trust mark storage on the file system.

```typescript
export class FSTrustMarkStore implements MutableTrustMarkStore {
  private readonly baseDirectory: string;
  
  constructor(baseDirectory: string) {
    this.baseDirectory = path.join(baseDirectory, 'trust_marks');
  }
  
  // MutableTrustMarkStore interface methods
  public readonly add: PRFunc<undefined, 'conflict'>;
  public readonly get: PRFunc<TrustMark, 'not-found'>;
  public readonly getAll: PRFunc<TrustMark[]>;
  public readonly remove: PRFunc<undefined, 'not-found'>;
}
```

## Performance Considerations

1. **Caching**: Implement an in-memory cache for frequently accessed metadata and small files to reduce disk I/O
2. **Hash Caching**: Store computed hashes in a cache file to avoid recomputing them for unchanged data
3. **Batched Operations**: Support batched read/write operations to minimize disk access
4. **File Locking**: Implement proper file locking mechanisms to prevent concurrent access issues
5. **Atomic Operations**: Ensure file system operations are atomic to maintain data integrity

## Security Considerations

1. **File Permissions**: Set appropriate file permissions to restrict access to the storage directory
2. **Encryption at Rest**: All sensitive data must be encrypted before being written to disk
3. **Secure Deletion**: Implement secure deletion methods for sensitive data
4. **Integrity Verification**: Verify file integrity using cryptographic hashes
5. **Access Control**: Enforce the same access control mechanisms as the in-memory implementation

## Error Handling

1. **Disk Space**: Handle disk space exhaustion gracefully
2. **I/O Errors**: Implement robust error handling for file system operations
3. **Corruption Detection**: Detect and report data corruption
4. **Recovery Mechanisms**: Implement recovery mechanisms for corrupted data

## Synchronization

1. **Atomic Operations**: Ensure file operations are atomic to prevent data corruption during synchronization
2. **Conflict Resolution**: Implement the same conflict resolution mechanisms as the in-memory implementation
3. **Change Tracking**: Track changes to enable efficient synchronization with remote stores

## Testing Strategy

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test the interaction between components
3. **Performance Tests**: Measure and optimize performance under various loads
4. **Stress Tests**: Test behavior under high load and resource constraints
5. **Recovery Tests**: Verify recovery from simulated failures

## Migration Path

1. **Data Migration**: Provide tools to migrate data from other store implementations
2. **Backward Compatibility**: Ensure compatibility with existing Freedom platform components
3. **Versioning**: Support versioning of the storage format to enable future upgrades

## Future Enhancements

1. **Sharding**: Support for sharding large stores across multiple directories or volumes
2. **Compression**: Optional compression of stored data to reduce disk space usage
3. **Backup Integration**: Built-in support for backup and restore operations
4. **Metrics**: Collect and expose performance metrics
5. **Garbage Collection**: Implement efficient garbage collection for deleted data
