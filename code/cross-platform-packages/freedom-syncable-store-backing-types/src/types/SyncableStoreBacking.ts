import type { PR, PRFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { LocalItemMetadata, SyncableId, SyncableItemType, SyncablePath } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { SyncableStoreBackingFileAccessor } from './accessors/SyncableStoreBackingFileAccessor.ts';
import type { SyncableStoreBackingFolderAccessor } from './accessors/SyncableStoreBackingFolderAccessor.ts';
import type { SyncableStoreBackingItemAccessor } from './accessors/SyncableStoreBackingItemAccessor.ts';
import type { SyncableStoreBackingItemMetadata } from './SyncableStoreBackingItemMetadata.ts';

export interface SyncableStoreBacking {
  readonly existsAtPath: PRFunc<boolean, never, [path: SyncablePath]>;

  readonly getAtPath: <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    path: SyncablePath,
    expectedType?: SingleOrArray<T>
  ) => PR<SyncableStoreBackingItemAccessor & { type: T }, 'not-found' | 'wrong-type'>;

  readonly getIdsInPath: PRFunc<
    SyncableId[],
    'not-found' | 'wrong-type',
    [path: SyncablePath, options?: { type?: SingleOrArray<SyncableItemType> }]
  >;

  readonly getMetadataAtPath: PRFunc<SyncableStoreBackingItemMetadata, 'not-found' | 'wrong-type', [path: SyncablePath]>;

  readonly getMetadataByIdInPath: PRFunc<
    Partial<Record<SyncableId, SyncableStoreBackingItemMetadata>>,
    'not-found' | 'wrong-type',
    [path: SyncablePath, ids?: Set<SyncableId>]
  >;

  readonly createBinaryFileWithPath: PRFunc<
    SyncableStoreBackingFileAccessor,
    'not-found' | 'wrong-type' | 'conflict',
    [path: SyncablePath, { data: Uint8Array; metadata: SyncableStoreBackingItemMetadata }]
  >;

  readonly createFolderWithPath: PRFunc<
    SyncableStoreBackingFolderAccessor,
    'not-found' | 'wrong-type' | 'conflict',
    [path: SyncablePath, { metadata: SyncableStoreBackingItemMetadata }]
  >;

  readonly deleteAtPath: PRFunc<undefined, 'not-found' | 'wrong-type', [path: SyncablePath]>;

  readonly updateLocalMetadataAtPath: PRFunc<
    undefined,
    'not-found' | 'wrong-type',
    [path: SyncablePath, metadata: Partial<LocalItemMetadata>]
  >;
}
