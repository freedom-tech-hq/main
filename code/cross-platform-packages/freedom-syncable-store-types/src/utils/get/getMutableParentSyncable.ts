import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { OldSyncablePath, SyncableItemType } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { MutableSyncableItemAccessor } from '../../types/MutableSyncableItemAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from './getMutableSyncableAtPath.ts';

export const getMutableParentSyncable = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    store: MutableSyncableStore,
    path: OldSyncablePath,
    expectedType?: SingleOrArray<T>
  ): PR<MutableSyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parentPath = path.parentPath;
    if (parentPath === undefined) {
      return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
    }

    return await getMutableSyncableAtPath(trace, store, parentPath, expectedType);
  }
);
