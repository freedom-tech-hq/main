import type { PR, PRFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableId, SyncableItemType } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { StoreBase } from '../immutable/StoreBase.ts';
import type { MutableSyncableItemAccessor } from './MutableSyncableItemAccessor.ts';

export interface MutableStoreBase extends StoreBase {
  /** Marks the file or access controlled folder for deletion.  A future sweep operation on the file store will actually delete the entry.
   * Stores may support different retention periods. */
  readonly delete: PRFunc<undefined, 'not-found', [id: SyncableId]>;

  /** Gets a mutable accessor to the file or access controlled folder with the specified ID */
  readonly getMutable: <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    id: SyncableId,
    expectedType?: SingleOrArray<T>
  ) => PR<MutableSyncableItemAccessor & { type: T }, 'not-found' | 'untrusted' | 'wrong-type'>;
}
