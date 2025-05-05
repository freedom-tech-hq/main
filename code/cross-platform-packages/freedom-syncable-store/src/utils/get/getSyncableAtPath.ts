import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';
import { guardIsExpectedType } from 'freedom-syncable-store-backing-types';
import type { SyncableBundleAccessor, SyncableFolderAccessor, SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';
import type { SingleOrArray } from 'yaschema';

import { guardIsRootProvenanceValid } from '../guards/guardIsRootProvenanceValid.ts';

export const getSyncableAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath,
    expectedType?: SingleOrArray<T>
  ): PR<SyncableItemAccessor & { type: T }, 'not-found' | 'untrusted' | 'wrong-type'> => {
    if (store.path.storageRootId !== path.storageRootId) {
      return makeFailure(new NotFoundError(trace, { message: 'Wrong storage root ID', errorCode: 'not-found' }));
    }

    const rootGuards = await guardIsRootProvenanceValid(trace, store);
    if (!rootGuards.ok) {
      return rootGuards;
    }

    if (path.ids.length === 0) {
      const guards = guardIsExpectedType(trace, new SyncablePath(path.storageRootId), store, expectedType, 'wrong-type');
      if (!guards.ok) {
        return generalizeFailureResult(trace, guards, 'wrong-type');
      }

      return makeSuccess(store as SyncableStore & { type: T });
    }

    let cursor = await store.get(trace, path.ids[0]);
    if (!cursor.ok) {
      return cursor;
    }

    for (const id of path.ids.slice(1)) {
      switch (cursor.value.type) {
        case 'folder':
        case 'bundle': {
          const folderLikeAccessor = cursor.value as SyncableFolderAccessor | SyncableBundleAccessor;

          const nextCursor = await folderLikeAccessor.get(trace, id);
          if (!nextCursor.ok) {
            return nextCursor;
          }

          cursor = nextCursor;

          break;
        }
        case 'file':
          return makeFailure(
            new NotFoundError(trace, {
              message: `Expected folder or bundle, found ${cursor.value.type}`,
              errorCode: 'not-found'
            })
          );
      }
    }

    const finalGuards = guardIsExpectedType(trace, path, cursor.value, expectedType, 'wrong-type');
    if (!finalGuards.ok) {
      return generalizeFailureResult(trace, finalGuards, 'wrong-type');
    }

    return makeSuccess(cursor.value as SyncableItemAccessor & { type: T });
  }
);
