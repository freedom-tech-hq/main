import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableItemAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';
import type { SingleOrArray } from 'yaschema';

import { getMutableSyncableAtPath } from './getMutableSyncableAtPath.ts';

export const getMutableParentSyncable = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    expectedType?: SingleOrArray<T>
  ): PR<MutableSyncableItemAccessor & { type: T }, 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parentPath = path.parentPath;
    if (parentPath === undefined) {
      return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
    }

    return await getMutableSyncableAtPath(trace, store, parentPath, expectedType);
  }
);
