import type { PR, PRFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type {
  StaticSyncablePath,
  SyncableBundleMetadata,
  SyncableFileMetadata,
  SyncableFolderMetadata,
  SyncableId,
  SyncableItemMetadata,
  SyncableItemType
} from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { LocalItemMetadata } from '../LocalItemMetadata.ts';
import type { SyncableStoreBackingFileAccessor } from './accessors/SyncableStoreBackingFileAccessor.ts';
import type { SyncableStoreBackingFolderAccessor } from './accessors/SyncableStoreBackingFolderAccessor.ts';
import type { SyncableStoreBackingItemAccessor } from './accessors/SyncableStoreBackingItemAccessor.ts';

export interface SyncableStoreBacking {
  readonly existsAtPath: PRFunc<boolean, never, [path: StaticSyncablePath]>;

  readonly getAtPath: <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    path: StaticSyncablePath,
    expectedType?: SingleOrArray<T>
  ) => PR<SyncableStoreBackingItemAccessor & { type: T }, 'not-found' | 'wrong-type'>;

  readonly getIdsInPath: PRFunc<
    SyncableId[],
    'not-found' | 'wrong-type',
    [path: StaticSyncablePath, options?: { type?: SingleOrArray<SyncableItemType> }]
  >;

  readonly getMetadataAtPath: PRFunc<SyncableItemMetadata & LocalItemMetadata, 'not-found' | 'wrong-type', [path: StaticSyncablePath]>;

  readonly getMetadataByIdInPath: PRFunc<
    Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>,
    'not-found' | 'wrong-type',
    [path: StaticSyncablePath, ids?: Set<SyncableId>]
  >;

  readonly createBinaryFileWithPath: PRFunc<
    SyncableStoreBackingFileAccessor,
    'not-found' | 'wrong-type' | 'conflict',
    [path: StaticSyncablePath, { data: Uint8Array; metadata: SyncableFileMetadata & LocalItemMetadata }]
  >;

  readonly createFolderWithPath: PRFunc<
    SyncableStoreBackingFolderAccessor,
    'not-found' | 'wrong-type' | 'conflict',
    [path: StaticSyncablePath, { metadata: (SyncableFolderMetadata | SyncableBundleMetadata) & LocalItemMetadata }]
  >;

  readonly deleteAtPath: PRFunc<undefined, 'not-found' | 'wrong-type', [path: StaticSyncablePath]>;

  readonly updateLocalMetadataAtPath: PRFunc<
    undefined,
    'not-found' | 'wrong-type',
    [path: StaticSyncablePath, metadata: Partial<LocalItemMetadata>]
  >;
}
