import type { PR, PRFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { StaticSyncablePath, SyncableId, SyncableItemType } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { ModifyableSyncableStoreBackingMetadata } from './ModifyableSyncableStoreBackingMetadata.ts';
import type { SyncableStoreBackingFlatFileAccessor } from './SyncableStoreBackingFlatFileAccessor.ts';
import type { SyncableStoreBackingFolderAccessor } from './SyncableStoreBackingFolderAccessor.ts';
import type { SyncableStoreBackingItemAccessor } from './SyncableStoreBackingItemAccessor.ts';
import type { SyncableStoreBackingMetadata } from './SyncableStoreBackingMetadata.ts';

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

  readonly getMetadataAtPath: PRFunc<SyncableStoreBackingMetadata, 'not-found' | 'wrong-type', [path: StaticSyncablePath]>;

  readonly getMetadataByIdInPath: PRFunc<
    Partial<Record<SyncableId, SyncableStoreBackingMetadata>>,
    'not-found' | 'wrong-type',
    [path: StaticSyncablePath, ids?: Set<SyncableId>]
  >;

  readonly createBinaryFileWithPath: PRFunc<
    SyncableStoreBackingFlatFileAccessor,
    'not-found' | 'wrong-type' | 'conflict',
    [path: StaticSyncablePath, { data: Uint8Array; metadata: SyncableStoreBackingMetadata & { type: 'flatFile' } }]
  >;

  readonly createFolderWithPath: PRFunc<
    SyncableStoreBackingFolderAccessor,
    'not-found' | 'wrong-type' | 'conflict',
    [path: StaticSyncablePath, { metadata: SyncableStoreBackingMetadata & { type: 'folder' | 'bundleFile' } }]
  >;

  readonly deleteAtPath: PRFunc<undefined, 'not-found' | 'wrong-type', [path: StaticSyncablePath]>;

  readonly updateMetadataAtPath: PRFunc<
    undefined,
    'not-found' | 'wrong-type',
    [path: StaticSyncablePath, metadata: Partial<ModifyableSyncableStoreBackingMetadata>]
  >;
}
