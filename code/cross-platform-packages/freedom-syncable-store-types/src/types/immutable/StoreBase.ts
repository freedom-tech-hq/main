import type { PR, PRFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableId, SyncableItemMetadata, SyncableItemType } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-backing-types';
import type { SingleOrArray } from 'yaschema';

import type { GenerateNewSyncableItemNameFunc } from '../GenerateNewSyncableItemNameFunc.ts';
import type { SyncableItemAccessor } from './SyncableItemAccessor.ts';
import type { SyncableItemAccessorBase } from './SyncableItemAccessorBase.ts';

export interface StoreBase extends SyncableItemAccessorBase {
  /** Determines if the file or access controlled folder exists or not */
  readonly exists: PRFunc<boolean, never, [id: SyncableId]>;

  /** Generates a new syncable item name using the specified template type */
  readonly generateNewSyncableItemName: GenerateNewSyncableItemNameFunc;

  /** Gets an accessor to the file or access controlled folder with the specified ID */
  readonly get: <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    id: SyncableId,
    expectedType?: SingleOrArray<T>
  ) => PR<SyncableItemAccessor & { type: T }, 'not-found' | 'untrusted' | 'wrong-type'>;

  /** Unordered IDs, optionally restricted to a specified type */
  readonly getIds: PRFunc<SyncableId[], never, [options?: { type?: SingleOrArray<SyncableItemType> }]>;

  readonly getMetadataById: PRFunc<Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>>;

  /** Checks if the specified item is deleted */
  readonly isDeleted: PRFunc<boolean, never, [id: SyncableId]>;

  /** Lists the IDs of files, along with their hashes */
  readonly ls: PRFunc<string[]>;
}
