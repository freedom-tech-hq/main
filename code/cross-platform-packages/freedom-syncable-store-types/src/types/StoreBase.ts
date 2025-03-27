import type { PR, PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableId, SyncableId, SyncableItemType } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { GenerateNewSyncableItemIdFunc } from './GenerateNewSyncableItemIdFunc.ts';
import type { SyncableItemAccessor } from './SyncableItemAccessor.ts';
import type { SyncableItemAccessorBase } from './SyncableItemAccessorBase.ts';

export interface StoreBase extends SyncableItemAccessorBase {
  /**
   * Gets the static ID associated with the specified dynamic ID in this store.
   *
   * @returns `'not-found'` if no corresponding item was found
   */
  readonly dynamicToStaticId: PRFunc<SyncableId, 'not-found', [id: DynamicSyncableId]>;

  /** Determines if the file or access controlled folder exists or not */
  readonly exists: PRFunc<boolean, never, [id: DynamicSyncableId]>;

  /** Generates a new syncable item ID using the specified template type */
  readonly generateNewSyncableItemId: GenerateNewSyncableItemIdFunc;

  /** Gets an accessor to the file or access controlled folder with the specified ID */
  readonly get: <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    id: DynamicSyncableId,
    expectedType?: SingleOrArray<T>
  ) => PR<SyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'wrong-type'>;

  readonly getHashesById: PRFunc<Partial<Record<SyncableId, Sha256Hash>>>;

  /** Unordered IDs, optionally restricted to a specified type */
  readonly getIds: PRFunc<SyncableId[], never, [options?: { type?: SingleOrArray<SyncableItemType> }]>;

  /** Lists the IDs of files, along with their hashes */
  readonly ls: PRFunc<string[]>;

  /** Gets the best dynamic ID corresponding to the specified static ID from this store.  For example, the best dynamic ID for a
   * `SyncableEncryptedId` is typically a `DynamicSyncableEncryptedId`.  This may fail, for example with a `SyncableEncryptedId`, if the
   * current user cant decrypt the static ID */
  readonly staticToDynamicId: PRFunc<DynamicSyncableId, never, [id: SyncableId]>;
}
