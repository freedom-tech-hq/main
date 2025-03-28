import type { PR } from 'freedom-async';
import { allResults, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { SyncableBundleAccessor } from '../../types/SyncableBundleAccessor.ts';
import type { SyncableFolderAccessor } from '../../types/SyncableFolderAccessor.ts';
import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { guardIsExpectedType } from '../guards/guardIsExpectedType.ts';
import { guardIsProvenanceValid } from '../guards/guardIsProvenanceValid.ts';
import { guardIsSyncableItemAcceptedOrWasWriteLegit } from '../guards/guardIsSyncableItemAcceptedOrWasWriteLegit.ts';

export const getSyncableAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath,
    expectedType?: SingleOrArray<T>
  ): PR<SyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    if (store.path.storageRootId !== path.storageRootId) {
      return makeFailure(new NotFoundError(trace, { message: 'Wrong storage root ID', errorCode: 'not-found' }));
    }

    const rootGuards = await guardIsProvenanceValid(trace, store, store);
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

    const firstCursorGuards = await allResults(trace, [
      guardIsProvenanceValid(trace, store, cursor.value),
      guardIsSyncableItemAcceptedOrWasWriteLegit(trace, store, cursor.value)
    ]);
    if (!firstCursorGuards.ok) {
      return firstCursorGuards;
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

          const cursorGuards = await allResults(trace, [
            guardIsProvenanceValid(trace, store, cursor.value),
            guardIsSyncableItemAcceptedOrWasWriteLegit(trace, store, cursor.value)
          ]);
          if (!cursorGuards.ok) {
            return cursorGuards;
          }

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

    const finalGuards = await allResults(trace, [
      guardIsProvenanceValid(trace, store, cursor.value),
      guardIsSyncableItemAcceptedOrWasWriteLegit(trace, store, cursor.value),
      guardIsExpectedType(trace, path, cursor.value, expectedType, 'wrong-type')
    ]);
    if (!finalGuards.ok) {
      return generalizeFailureResult(trace, finalGuards, 'wrong-type');
    }

    return makeSuccess(cursor.value as SyncableItemAccessor & { type: T });
  }
);
