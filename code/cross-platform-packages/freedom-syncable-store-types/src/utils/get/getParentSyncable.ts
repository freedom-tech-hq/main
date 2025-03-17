import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType, SyncablePath } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getParentSyncable = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath,
    expectedType?: SingleOrArray<T>
  ): PR<SyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parentPath = path.parentPath;
    if (parentPath === undefined) {
      return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
    }

    return getSyncableAtPath(trace, store, parentPath, expectedType);
  }
);
